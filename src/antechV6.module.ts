import { BullModule } from '@nestjs/bull'
import { AntechV6OrdersProcessor } from './processors/antechV6-orders.processor'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { AntechV6Service } from './services/antechV6.service'
import { AntechV6ApiService } from './antechV6-api/antechV6-api.service'
import { Module } from '@nestjs/common'
import { AntechV6ResultsProcessor } from './processors/antechV6-results.processor'
import { AntechV6Controller } from './controllers/antechV6.controller'
import { AntechV6Mapper } from './providers/antechV6-mapper'
import { ClientsModule, Transport } from '@nestjs/microservices'
import { AntechV6ApiModule } from './antechV6-api/antech-v6-api.module'

@Module({
  imports: [
    ClientsModule.registerAsync([
      {
        name: 'API_SERVICE',
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: async (configService: ConfigService) => ({
          transport: Transport.MQTT,
          options: {
            ...configService.get('mqtt')
          }
        })
      }
    ]),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        redis: configService.get('redis')
      })
    }),
    AntechV6ApiModule
  ],
  providers: [AntechV6Mapper, AntechV6Service, AntechV6ApiService, AntechV6OrdersProcessor, AntechV6ResultsProcessor],
  controllers: [AntechV6Controller],
  exports: [BullModule]
})
export class AntechV6Module {}
