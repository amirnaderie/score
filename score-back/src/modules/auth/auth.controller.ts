import { Controller, Post, Req, Res, HttpStatus, Body } from '@nestjs/common';
import { Response } from 'express';
import { AuthService } from './provider/auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post()
  async authenticate(
     @Body('codeParameter') codeParameter: string,
    @Req() req: Request,
    //@Res({ passthrough: true }) response: Response,
     @Res() response: Response,
  ) {
    return await this.authService.authenticate(req, response,codeParameter);
  }
}
