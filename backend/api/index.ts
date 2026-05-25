import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { AppModule } from '../src/app.module';
import { ValidationPipe } from '@nestjs/common';
import * as express from 'express';

// Resolve express in a way that works across both CommonJS and ES Module transpilation
const getExpressApp = (): any => {
  if (typeof express === 'function') {
    return express;
  }
  if (express && typeof (express as any).default === 'function') {
    return (express as any).default;
  }
  return express;
};

const expressApp = getExpressApp();
const server = expressApp();

let isBootstrapped = false;

async function bootstrap() {
  if (isBootstrapped) return;
  const app = await NestFactory.create(AppModule, new ExpressAdapter(server));
  
  // Enable CORS
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // Global validation pipes
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
    }),
  );

  // Serve static files from /tmp since Vercel's real filesystem is read-only
  app.use('/uploads', expressApp.static('/tmp'));

  await app.init();
  isBootstrapped = true;
}

export default async (req: any, res: any) => {
  await bootstrap();
  server(req, res);
};
