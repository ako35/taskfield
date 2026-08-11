import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  const allowedOrigins = [
    process.env.WEB_ORIGIN,
    'http://localhost:5173',
    'http://127.0.0.1:5173',
  ].filter((origin): origin is string => Boolean(origin));
  app.enableCors({
    origin: allowedOrigins,
  });
  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
