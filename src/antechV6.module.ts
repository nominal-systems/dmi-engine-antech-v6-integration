import { Module } from '@nestjs/common'
import { BullModule } from '@nestjs/bull'
import { OrdersProcessor } from './processors/orders.processor'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { ResultsProcessor } from './processors/results.processor'

@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        redis: configService.get('redis')
      }),
      inject: [ConfigService]
    })
  ],
  providers: [OrdersProcessor, ResultsProcessor],
  exports: [BullModule]
})
export class AntechV6Module {}
