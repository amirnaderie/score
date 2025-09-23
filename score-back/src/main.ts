import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import helmet from 'helmet';
import * as cookieParser from 'cookie-parser';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe, BadRequestException } from '@nestjs/common';
import { CorrelationMiddleware } from './modules/correlation/correlation.middleware';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get<ConfigService>(ConfigService);
  const appPort = config.get<number>('APP_PORT') || 5004;
  const CORS_ORIGINS = config.get<string>('CORS_ORIGINS');

  // Add correlation middleware
  app.use(new CorrelationMiddleware().use);

  const corsOptions = {
    origin: (origin, callback) => {
      const allowedOrigins = CORS_ORIGINS
        ? CORS_ORIGINS.split(',').map((origin) => origin.trim())
        : [];

      if (!origin) {
        callback(null, true);
        return;
      }

      if (allowedOrigins.includes(origin) || !origin) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE','PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key'],
  };
  app.enableCors(corsOptions);

  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:', 'https:'],
        },
      },
    }),
  );
  app.use(cookieParser());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      exceptionFactory: (errors) => {
        const firstError = errors[0];
        const constraints = firstError?.constraints;
        const message = constraints
          ? Object.values(constraints)[0]
          : 'Validation failed';
        return new BadRequestException(message);
      },
    }),
  );

  await app.listen(appPort);
}
bootstrap();
