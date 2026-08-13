import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');

  const allowedOrigins = [
    process.env.WEB_ORIGIN,
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:19006',
    'http://localhost:19007',
    'http://localhost:19008',
    'http://127.0.0.1:19006',
    'http://127.0.0.1:19007',
    'http://127.0.0.1:19008',
  ].filter((origin): origin is string => Boolean(origin));

  app.enableCors({
    origin: (
      origin: string | undefined,
      callback: (error: Error | null, allow?: boolean) => void,
    ) => {
      if (!origin) {
        callback(null, true);
        return;
      }

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      const localhostPattern = /^http:\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0)(?::\d+)?$/;
      const androidEmulatorPattern = /^http:\/\/10\.0\.2\.2(?::\d+)?$/;
      const localNetworkPattern = /^http:\/\/(192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+)(?::\d+)?$/;

      if (
        localhostPattern.test(origin) ||
        androidEmulatorPattern.test(origin) ||
        localNetworkPattern.test(origin)
      ) {
        callback(null, true);
        return;
      }

      callback(new Error('Not allowed by CORS'), false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
