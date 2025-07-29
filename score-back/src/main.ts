import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import helmet from 'helmet';
import * as cookieParser from 'cookie-parser';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get<ConfigService>(ConfigService);
  const appPort = config.get<number>('APP_PORT') || 5003;
  const CORS_ORIGINS = config.get<string>('CORS_ORIGINS');

  // const corsOptions = {
  //   origin: (origin, callback) => {
  //     if (
  //       !origin ||
  //       /(.*\.)?banksepah\.ir$/.test(origin) ||
  //       process.env.ENV === 'dev' || process.env.ENV === 'stage'
  //     ) {
  //       callback(null, true);
  //     } else {
  //       callback(new Error('Not allowed by CORS'));
  //     }
  //   },
  //   // methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  //   credentials: true,
  // };
  const corsOptions = {
    origin: (origin, callback) => {
      // Get CORS origins from environment variable

      // Parse the comma-separated string into an array
      const allowedOrigins = CORS_ORIGINS
        ? CORS_ORIGINS.split(',').map(origin => origin.trim())
        : [];

      // Allow requests with no origin (mobile apps, curl, etc.)
      if (!origin) {
        callback(null, true);
        return;
      }

      // Check if the origin is in the allowed list
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  };
  app.enableCors(corsOptions);

  app.use(helmet());

  app.use(cookieParser()); // Use cookie-parser middleware

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  await app.listen(appPort);
}
bootstrap();
