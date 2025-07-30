import { Injectable, HttpStatus, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import * as querystring from 'querystring';
import { jwtDecode } from 'jwt-decode';
import { Buffer } from 'buffer';
import { CookieOptions, Response } from 'express';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { LogEvent } from 'src/modules/event/log.event';
import { logTypes } from 'src/modules/event/enums/logType.enum';

@Injectable()
export class AuthService {
  constructor(
    private readonly configService: ConfigService,
    private eventEmitter: EventEmitter2,
  ) {}

  async authenticate(req: Request, response: Response, codeParameter: string) {
    //try {
    //const codeParameter = (req as any).body.codeParameter;
    const authUrl = this.configService.get('AUTH_URL');
    process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';
    const parameterValue = querystring.stringify({
      grant_type: 'authorization_code',
      code: codeParameter,
      client_id: this.configService.get('CLIENT_ID'),
      client_secret: this.configService.get('CLIENT_SECRET'),
      redirect_uri: this.configService.get('REDIRECT_URI'),
    });
    let tokenFromSSO;

    tokenFromSSO = await axios.post(`${authUrl}token`, parameterValue, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    try {
    } catch (error) {
      this.eventEmitter.emit(
        'logEvent',
        new LogEvent({
          logTypes: logTypes.ERROR,
          fileName: 'auth.service',
          method: 'authenticate',
          message: error.message || 'ُcalling zarrir error',
          requestBody: JSON.stringify({ codeParameter }),
          stack: error.stack,
        }),
      );
    }
    const decodedHeader: any = jwtDecode(tokenFromSSO.data.access_token);
    const { aud, exp } = decodedHeader;
    if (aud !== this.configService.get('CLIENT_ID')) {
      throw new UnauthorizedException(
        'شما مجوز دسترسی به این سامانه را ندارید',
      );
    }

    const userData = await this.verifyToken(tokenFromSSO.data.access_token);
    const { cookieOptions } = await this.createOption(exp);
    response.cookie(
      'accessToken',
      tokenFromSSO.data.access_token,
      cookieOptions,
    );

    return response.status(HttpStatus.OK).json({
      message: 'Successfully signed in',
      data: {
        userId: userData.id,
        userName: userData.username,
        roles: userData.roles,
      },
    });
    // return {
    //   message: 'Successfully signed in',
    //   data: {
    //     userId: userData.id,
    //     userName: userData.username,
    //     roles: userData.roles,
    //   },
    // };
  }

  async createOption(zarrirExp: number) {
    // const maxAge: number =
    //   parseInt(this.configService.get('COOKIE_EXPIRES') as string) * 1000;
    const now = Math.floor(Date.now() / 1000); // Current Unix timestamp
    const maxAgeInSeconds = (zarrirExp - now) * 1000;

    const cookieOptions: CookieOptions = {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: maxAgeInSeconds, // parseInt(this.configService.get('COOKIE_EXPIRES') as string),
      secure: process.env.ENV === 'prod',
      domain:
        process.env.ENV === 'dev'
          ? undefined
          : this.configService.get<string>('COOKIE_DOMAIN'),
      path: '/', // Explicitly set path
    };
    return { cookieOptions };
  }

  async verifyToken(token: string): Promise<any> {
    try {
      const clientId = this.configService.get('CLIENT_ID');
      const clientSecret = this.configService.get('CLIENT_SECRET');
      const authUrl = this.configService.get('AUTH_URL');
      const basic = `${clientId}:${clientSecret}`;
      const encodedToken = Buffer.from(basic).toString('base64');
      process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';
      if (!token || token === '') {
        // Optionally use a logger here
        console.error('token is null');
        return null;
      }
      const response = await axios.post(
        authUrl + 'api/profile',
        querystring.stringify({ token }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Authorization: 'Basic ' + encodedToken,
          },
        },
      );
      if (response.status === 200) {
        return response.data;
      } else {
        console.error(
          `verifyToken failed  Status: ${response.status} token: ${token}`,
        );
        return null;
      }
    } catch (error: any) {
      console.error('Error in verifyToken:', error);
      if (
        error?.response?.status &&
        (error.response.status === 401 ||
          (error.response.status === 400 &&
            error.response.data &&
            typeof error.response.data === 'string' &&
            error.response.data.includes('invalid token')))
      ) {
        throw new Error('invalid token');
      } else {
        throw new Error('error in server');
      }
    }
  }
}
