import { BullModule } from '@nestjs/bull'
import { OrdersProcessor } from './processors/orders.processor'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { AntechV6Service } from './services/antechV6.service'
import { AntechV6ApiService } from './services/antechV6-api.service'
import { HttpModule } from '@nestjs/axios'
import { Module } from '@nestjs/common'
import { ResultsProcessor } from './processors/results.processor'
import { APP_INTERCEPTOR } from '@nestjs/core'
import { AxiosInterceptor } from './interceptors/axios.interceptor'

@Module({
  imports: [
    HttpModule,
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        redis: configService.get('redis')
      }),
      inject: [ConfigService]
    })
  ],
  providers: [
    AntechV6Service,
    AntechV6ApiService,
    OrdersProcessor,
    ResultsProcessor,
    {
      provide: APP_INTERCEPTOR,
      useClass: AxiosInterceptor
    }
  ],
  exports: [BullModule]
})
export class AntechV6Module {}
