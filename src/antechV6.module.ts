import { BullModule } from '@nestjs/bull'
import { AntechV6OrdersProcessor } from './processors/antechV6-orders.processor'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { AntechV6Service } from './services/antechV6.service'
import { AntechV6ApiService } from './antechV6-api/antechV6-api.service'
import { type DynamicModule, Module, type ModuleMetadata, type Provider } from '@nestjs/common'
import { AntechV6ResultsProcessor } from './processors/antechV6-results.processor'
import { AntechV6Controller } from './controllers/antechV6.controller'
import { AntechV6Mapper } from './providers/antechV6-mapper'
import { ClientsModule, Transport } from '@nestjs/microservices'
import { AntechV6ApiModule } from './antechV6-api/antech-v6-api.module'
import { APP_FILTER } from '@nestjs/core'
import { RpcExceptionFilter } from './filters/rcp-exception.filter'
import { StatsigFeatureFlagProvider } from './feature-flags/statsig-feature-flag.provider'
import { FEATURE_FLAG_PROVIDER } from './feature-flags/feature-flag.interface'

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
            ...configService.get('mqtt'),
          },
        }),
      },
    ]),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        redis: configService.get('redis'),
      }),
    }),
    AntechV6ApiModule,
  ],
  providers: [
    AntechV6Mapper,
    AntechV6Service,
    AntechV6ApiService,
    AntechV6OrdersProcessor,
    AntechV6ResultsProcessor,
    {
      provide: APP_FILTER,
      useClass: RpcExceptionFilter,
    },
  ],
  controllers: [AntechV6Controller],
  exports: [BullModule],
})
export class AntechV6Module {
  static register(options: AntechV6ModuleOptions = {}): DynamicModule {
    const featureFlagProvider: Provider =
      options.featureFlagProvider ??
      ({ provide: FEATURE_FLAG_PROVIDER, useClass: StatsigFeatureFlagProvider } satisfies Provider)

    return {
      module: AntechV6Module,
      imports: [...(options.imports ?? [])],
      providers: [featureFlagProvider, ...(options.providers ?? [])],
    }
  }
}

export interface AntechV6ModuleOptions {
  imports?: ModuleMetadata['imports']
  providers?: Provider[]
  featureFlagProvider?: Provider
}
