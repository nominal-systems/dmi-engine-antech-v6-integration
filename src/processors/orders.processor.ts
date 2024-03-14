import { Process, Processor } from '@nestjs/bull'
import { Job } from 'bull'
import { AntechV6MessageData } from '../interfaces/antechV6-message-data.interface'
import { Logger } from '@nestjs/common'
import { PROVIDER_NAME } from '../constants/provider-name.constant'
import { AntechV6Service } from '../services/antechV6.service'

@Processor(`${PROVIDER_NAME}.orders`)
export class OrdersProcessor {
  private readonly logger = new Logger(OrdersProcessor.name)

  constructor(private readonly antechV6Service: AntechV6Service) {}

  @Process()
  async fetchOrders(job: Job<AntechV6MessageData>) {
    const { payload, ...metadata } = job.data
    this.logger.debug(`Fetching orders for integration ${payload.integrationId}`)
    try {
      const orders = await this.antechV6Service.getBatchOrders(payload, metadata)
      console.log(`fetchOrders()= ${JSON.stringify(orders, null, 2)}`) // TODO(gb): remove trace
    } catch (error) {
      this.logger.error(`Error fetching orders for integration ${payload.integrationId}`)
    }
  }
}
