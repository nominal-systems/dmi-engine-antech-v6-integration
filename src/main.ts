import { NestFactory } from '@nestjs/core'
import { AntechV6Module } from './antechV6.module'
import { MicroserviceOptions, Transport } from '@nestjs/microservices'
import { ConfigService } from '@nestjs/config'
import { ValidationPipe } from '@nestjs/common'

async function bootstrap() {
  const app = await NestFactory.create(AntechV6Module)
  const configService = app.get<ConfigService<any>>(ConfigService)

  app.connectMicroservice<MicroserviceOptions>(
    {
      transport: Transport.MQTT,
      options: {
        ...configService.get('mqtt'),
      },
    },
    { inheritAppConfig: true },
  )
  app.useGlobalPipes(new ValidationPipe({ transform: true }))
  await app.startAllMicroservices()
}

bootstrap()
