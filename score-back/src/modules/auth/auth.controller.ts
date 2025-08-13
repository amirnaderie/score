import { Controller, Post, Req, Res, HttpStatus, Body, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { AuthService } from './provider/auth.service';
import { AuthGuard } from 'src/guards/auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Post()
  async authenticate(
    @Body('codeParameter') codeParameter: string,
    @Req() req: Request,
    @Res({ passthrough: true }) response: Response,
    //@Res() response: Response,
  ) {
    return await this.authService.authenticate(req, response, codeParameter);
  }

  @UseGuards(AuthGuard)
  @Post('/sign-out')
  async signOut(
    @Req() req: Request,
  ) {
    return await this.authService.signOut(req);
  }
}
