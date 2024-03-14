import { Controller } from '@nestjs/common'
import {
  ApiEvent,
  Breed,
  Operation,
  OrderCreatedResponse,
  ProviderOrderCreation,
  ProviderReferenceData,
  ReferenceDataResponse,
  Resource,
  Sex,
  Species
} from '@nominal-systems/dmi-engine-common'
import { MessagePattern } from '@nestjs/microservices'
import { AntechV6MessageData } from '../interfaces/antechV6-message-data.interface'
import { PROVIDER_NAME } from '../constants/provider-name.constant'
import { AntechV6Service } from '../services/antechV6.service'

@Controller('engine/antech-v6')
export class AntechV6Controller implements ProviderOrderCreation, ProviderReferenceData {
  constructor(private readonly antechV6Service: AntechV6Service) {}

  @MessagePattern(`${PROVIDER_NAME}.${Resource.Orders}.${Operation.Create}`)
  public createOrder(msg: ApiEvent<AntechV6MessageData>): Promise<OrderCreatedResponse> {
    const { payload, ...metadata } = msg.data
    return this.antechV6Service.createOrder(payload, metadata)
  }

  @MessagePattern(`${PROVIDER_NAME}.${Resource.Sexes}.${Operation.List}`)
  public getSexes(msg: ApiEvent<AntechV6MessageData>): Promise<ReferenceDataResponse<Sex> | Sex[]> {
    const { payload, ...metadata } = msg.data
    return this.antechV6Service.getSexes(payload, metadata)
  }

  @MessagePattern(`${PROVIDER_NAME}.${Resource.Species}.${Operation.List}`)
  public getSpecies(msg: ApiEvent<AntechV6MessageData>): Promise<ReferenceDataResponse<Species> | Species[]> {
    const { payload, ...metadata } = msg.data
    return this.antechV6Service.getSpecies(payload, metadata)
  }

  @MessagePattern(`${PROVIDER_NAME}.${Resource.Breeds}.${Operation.List}`)
  public getBreeds(msg: ApiEvent<AntechV6MessageData>): Promise<ReferenceDataResponse<Breed> | Breed[]> {
    const { payload, ...metadata } = msg.data
    return this.antechV6Service.getBreeds(payload, metadata)
  }
}
