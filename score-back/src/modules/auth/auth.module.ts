import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './provider/auth.service';

@Module({
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}