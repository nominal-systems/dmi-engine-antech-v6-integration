import { Process, Processor } from '@nestjs/bull'
import { Job } from 'bull'
import { runWithRequestContext } from '@nominal-systems/dmi-engine-common'
import { AntechV6MessageData } from '../interfaces/antechV6-message-data.interface'
import { Inject, Logger } from '@nestjs/common'
import { PROVIDER_NAME } from '../constants/provider-name.constant'
import { AntechV6Service } from '../services/antechV6.service'
import { ClientProxy } from '@nestjs/microservices'

// @Process() concurrency is read at class-decoration time, before Nest's DI
// container exists, so it can't come from ConfigService - read process.env directly.
const ORDERS_CONCURRENCY = Math.max(1, parseInt(process.env.ANTECH_V6_ORDERS_CONCURRENCY ?? '1', 10) || 1)

@Processor(`${PROVIDER_NAME}.orders`)
export class AntechV6OrdersProcessor {
  private readonly logger = new Logger(AntechV6OrdersProcessor.name)

  constructor(
    private readonly antechV6Service: AntechV6Service,
    @Inject('API_SERVICE') private readonly apiClient: ClientProxy,
  ) {}

  @Process({ concurrency: ORDERS_CONCURRENCY })
  async fetchOrders(job: Job<AntechV6MessageData>) {
    const { payload, ...metadata } = job.data
    await runWithRequestContext({ integrationId: payload.integrationId }, async () => {
      this.logger.debug(`Fetching orders for integration ${payload.integrationId}`)
      try {
        const orders = await this.antechV6Service.getBatchOrders(payload, metadata)

        if (orders.length > 0) {
          this.logger.log(
            `Fetched ${orders.length} order${orders.length > 1 ? 's' : ''} for integration ${payload.integrationId}`,
          )

          const clinicAccessionIds = orders
            .map((order) => order.externalId)
            .filter((accId): accId is string => accId !== undefined)

          this.apiClient.emit('external_orders', {
            integrationId: payload.integrationId,
            orders,
          })

          await this.antechV6Service.acknowledgeOrders({ ids: clinicAccessionIds }, metadata)
          this.logger.log(
            `Acknowledged orders ${clinicAccessionIds.join(',')} for integration ${payload.integrationId}`,
          )
        }
      } catch (error) {
        this.logger.error(`Error fetching orders for integration ${payload.integrationId}`)
      }
    })
  }
}
