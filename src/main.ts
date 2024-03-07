import { NestFactory } from '@nestjs/core'
import { AntechV6Module } from './antechV6.module'
import { MicroserviceOptions, Transport } from '@nestjs/microservices'

async function bootstrap() {
  const app = await NestFactory.create(AntechV6Module)
  app.connectMicroservice<MicroserviceOptions>(
    {
      transport: Transport.MQTT,
      options: {
        url: 'mqtt://localhost:1883'
      }
    },
    { inheritAppConfig: true }
  )

  await app.startAllMicroservices()
  await app.listen(4000)
}

bootstrap()
