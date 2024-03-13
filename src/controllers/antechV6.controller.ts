import { Controller } from '@nestjs/common'
import {
  ApiEvent,
  Operation,
  OrderCreatedResponse,
  ProviderOrderCreation,
  Resource
} from '@nominal-systems/dmi-engine-common'
import { MessagePattern } from '@nestjs/microservices'
import { AntechV6MessageData } from '../interfaces/antechV6-message-data.interface'
import { PROVIDER_NAME } from '../constants/provider-name.constant'
import { AntechV6Service } from '../services/antechV6.service'

@Controller('engine/antech-v6')
export class AntechV6Controller implements ProviderOrderCreation {
  constructor(private readonly antechV6Service: AntechV6Service) {}

  @MessagePattern(`${PROVIDER_NAME}.${Resource.Orders}.${Operation.Create}`)
  public createOrder(msg: ApiEvent<AntechV6MessageData>): Promise<OrderCreatedResponse> {
    const { payload, ...metadata } = msg.data
    return this.antechV6Service.createOrder(payload, metadata)
  }
}
