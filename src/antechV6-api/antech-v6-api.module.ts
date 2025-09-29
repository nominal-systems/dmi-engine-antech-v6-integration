import { Module } from '@nestjs/common'
import { HttpModule, HttpService } from '@nestjs/axios'
import { ClientsModule, Transport } from '@nestjs/microservices'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { AntechV6ApiHttpService } from './antechV6-api-http.service'
import { APP_INTERCEPTOR } from '@nestjs/core'
import { AntechV6ApiInterceptor } from './antechV6-api.interceptor'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    HttpModule.register({}),
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
  ],
  providers: [
    {
      provide: AntechV6ApiHttpService,
      useExisting: HttpService,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: AntechV6ApiInterceptor,
    },
  ],
  exports: [AntechV6ApiHttpService],
})
export class AntechV6ApiModule {
  constructor(private readonly httpService: HttpService) {}
}
