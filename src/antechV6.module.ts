import { Module } from '@nestjs/common'
import { BullModule } from '@nestjs/bull'
import { AntechV6Controller } from './antech-v6/antech-v6.controller'

@Module({
  imports: [
    BullModule.forRoot({
      redis: {
        host: 'localhost',
        port: 6379,
      },
    }),
    BullModule.registerQueue(
      { name: `antech-v6.results` },
      { name: `antech-v6.orders` },
    ),
  ],
  controllers: [AntechV6Controller],
})
export class AntechV6Module {}
