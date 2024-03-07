import { Module } from '@nestjs/common'
import { BullModule } from '@nestjs/bull'
import { AntechV6Controller } from './antech-v6/antech-v6.controller'
import { OrdersProcessor } from './processors/orders.processor'
import { ConfigModule, ConfigService } from '@nestjs/config'
import configuration from './config/configuration'
import { ResultsProcessor } from './processors/results.processor'
import { QueueService } from './services/queue.service'
import { PROVIDER_NAME } from './constants/provider-name.constant'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration]
    }),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        redis: {
          host: 'localhost',
          port: 6379
        }
      }),
      inject: [ConfigService]
    }),
    BullModule.registerQueue({ name: `${PROVIDER_NAME}.results` }, { name: `${PROVIDER_NAME}.orders` })
  ],
  controllers: [AntechV6Controller],
  providers: [QueueService, OrdersProcessor, ResultsProcessor]
})
export class AntechV6Module {}
