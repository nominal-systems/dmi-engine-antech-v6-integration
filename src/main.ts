import { NestFactory } from '@nestjs/core';
import { AntechV6Module } from './antechV6.module';

async function bootstrap() {
  const app = await NestFactory.create(AntechV6Module);
  await app.listen(3000);
}
bootstrap();
