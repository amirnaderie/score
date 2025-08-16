import {
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import * as querystring from 'querystring';
import { jwtDecode } from 'jwt-decode';
import { Buffer } from 'buffer';
import { CookieOptions, Response } from 'express';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { LogEvent } from 'src/modules/event/providers/log.event';
import { logTypes } from 'src/modules/event/enums/logType.enum';
import { ErrorMessages } from 'src/constants/error-messages.constants';
import handelError from 'src/utility/handel-error';

@Injectable()
export class AuthService {
  private clientId: string;
  private clientSecret: string;
  private authUrl: string;
  private redirect_uri: string;

  constructor(
    private readonly configService: ConfigService,
    private eventEmitter: EventEmitter2,
  ) {
    this.clientId = this.configService.get('CLIENT_ID');
    this.clientSecret = this.configService.get('CLIENT_SECRET');
    this.authUrl = this.configService.get('AUTH_URL');
    this.redirect_uri = this.configService.get('REDIRECT_URI')
  }

  async authenticate(req: Request, response: Response, codeParameter: string) {
    //try {
    //const codeParameter = (req as any).body.codeParameter;
    process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';
    const parameterValue = querystring.stringify({
      grant_type: 'authorization_code',
      code: codeParameter,
      client_id: this.clientId,
      client_secret: this.clientSecret,
      redirect_uri: this.redirect_uri,
    });
    let tokenFromSSO;

    tokenFromSSO = await axios.post(`${this.authUrl}token`, parameterValue, {
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
    const personelData = await this.getPersonalData(userData.username);

    const { cookieOptions } = await this.createOption(exp);
    response.cookie(
      'accessToken',
      tokenFromSSO.data.access_token,
      cookieOptions,
    );

    // return response.status(HttpStatus.OK).json({
    //   message: 'Successfully signed in',
    //   data: {
    //     userId: userData.id,
    //     userName: userData.username,
    //     roles: userData.roles,
    //   },
    // });
    return {
      message: 'Successfully signed in',
      data: {
        userId: userData.id,
        roles: userData.roles,
        branchCode: Number(personelData.branchCode),
        personelCode: Number(userData.username),
      },
    };
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

      const basic = `${this.clientId}:${this.clientSecret}`;
      const encodedToken = Buffer.from(basic).toString('base64');
      const roles = this.configService.get<string>('ROLES');
      process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';
      if (!token || token === '') {
        // Optionally use a logger here
        console.error('token is null');
        return null;
      }
      const response = await axios.post(
        this.authUrl + 'api/profile',
        querystring.stringify({ token }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Authorization: 'Basic ' + encodedToken,
          },
        },
      );

      if (response.status === 200) {
        const allowedRoles = roles
          ? roles.split(',').map((role) => role.trim())
          : [];
        const userData = response.data;
        if (
          !userData.roles ||
          !Array.isArray(userData.roles) ||
          userData.roles.length === 0
        ) {
          this.eventEmitter.emit(
            'logEvent',
            new LogEvent({
              logTypes: logTypes.ERROR,
              fileName: 'auth.service',
              method: 'verifyToken',
              message: `User has no roles. token: ${token}, response data: ${JSON.stringify(
                response.data,
              )}`,
              requestBody: JSON.stringify(response.data),
              stack: '',
            }),
          );
          throw new UnauthorizedException(ErrorMessages.AUTH_FAILED);
        }

        const hasAllowedRole = userData.roles.some((role: string) =>
          allowedRoles.includes(role),
        );

        if (!hasAllowedRole) {
          this.eventEmitter.emit(
            'logEvent',
            new LogEvent({
              logTypes: logTypes.ERROR,
              fileName: 'auth.service',
              method: 'verifyToken',
              message: `User does not have required roles. token: ${token}, roles: ${JSON.stringify(
                userData.roles,
              )}`,
              requestBody: JSON.stringify(response.data),
              stack: '',
            }),
          );
          throw new UnauthorizedException(ErrorMessages.AUTH_FAILED);
        }

        return userData;
      } else {
        this.eventEmitter.emit(
          'logEvent',
          new LogEvent({
            logTypes: logTypes.ERROR,
            fileName: 'auth.service',
            method: 'verifyToken',
            message: `verifyToken failed  Status: ${response.status} token: ${token}`,
            requestBody: '',
            stack: '',
          }),
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
        this.eventEmitter.emit(
          'logEvent',
          new LogEvent({
            logTypes: logTypes.ERROR,
            fileName: 'auth.service',
            method: 'verifyToken',
            message: `error in verifyToken `,
            requestBody: '',
            stack: error.stack,
          }),
        );
        return null;
      } else {
        this.eventEmitter.emit(
          'logEvent',
          new LogEvent({
            logTypes: logTypes.ERROR,
            fileName: 'auth.service',
            method: 'verifyToken',
            message: `error in verifyToken `,
            requestBody: '',
            stack: error.stack,
          }),
        );
        throw new UnauthorizedException(ErrorMessages.AUTH_FAILED);
      }
    }
  }

  async getPersonalData(personelCode: number) {
    try {
      const AFRA_URL = this.configService.get<string>('AFRA_URL');
      const AFRA_TOKEN = this.configService.get<string>('AFRA_TOKEN');
      const retVal = await fetch(`${AFRA_URL}/findByCode`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Basic ${AFRA_TOKEN}`,
        },
        body: JSON.stringify({
          code: personelCode.toString(),
        }),
      });
      const userDetailData = await retVal.json();
      return {
        branchCode: userDetailData.currentUnit.code,
        branchName: "",//userDetailData.currentUnit.name,
      };
    } catch (error) {
      handelError(
        error,
        this.eventEmitter,
        'score.service',
        'getPersonalData calling API named findByCode from afra',
        { personelCode },
      );
      throw new InternalServerErrorException(ErrorMessages.INTERNAL_ERROR);
    }
  }

  async signOut(req: Request) {
    try {
      const basic = `${this.clientId}:${this.clientSecret}`;
      const encodedToken = Buffer.from(basic).toString("base64");
      process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = "0";
      const token = (req as any).cookies['accessToken'];
      const isValidAccessToken = await axios.post(
        `${this.authUrl}revoke`,
        querystring.stringify({ token }),
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Authorization: "Basic " + encodedToken,
          },
        },
      );
      return true;
    } catch (error) {
      handelError(
        error,
        this.eventEmitter,
        'score.service',
        'calling API named revoke from zarrir',

        {}
      );
      throw new InternalServerErrorException(ErrorMessages.INTERNAL_ERROR);
    }
  }
}
