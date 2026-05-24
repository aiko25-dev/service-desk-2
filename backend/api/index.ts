import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { AppModule } from '../src/app.module';
import { ValidationPipe } from '@nestjs/common';
import * as express from 'express';

const server = express();

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
  app.use('/uploads', express.static('/tmp'));

  await app.init();
  isBootstrapped = true;
}

export default async (req: any, res: any) => {
  await bootstrap();
  server(req, res);
};
