import { Process, Processor } from '@nestjs/bull'
import { Job } from 'bull'
import { AntechV6MessageData } from '../interfaces/antech-v6-message-data.interface'
import { Logger } from '@nestjs/common'
import { PROVIDER_NAME } from '../constants/provider-name.constant'

@Processor(`${PROVIDER_NAME}.orders`)
export class OrdersProcessor {
  private readonly logger = new Logger(OrdersProcessor.name)

  @Process()
  async fetchOrders(job: Job<AntechV6MessageData>) {
    const { payload, ...metadata } = job.data
    this.logger.debug(`Fetching orders for integration ${payload.integrationId}`)
  }
}
