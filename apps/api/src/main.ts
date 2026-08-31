import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);
  const origins = (config.get<string>('APP_URL') ?? 'http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  app.setGlobalPrefix('api');
  app.use(cookieParser());
  app.enableCors({ origin: origins, credentials: true });
  app.enableShutdownHooks();
  await app.listen(Number(config.get<string>('PORT') ?? 3001), '0.0.0.0');
}

void bootstrap();
