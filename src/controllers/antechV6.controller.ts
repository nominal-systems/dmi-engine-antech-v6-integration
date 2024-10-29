import { Controller, Logger } from '@nestjs/common'
import {
  ApiEvent,
  Breed,
  CreateOrderPayload,
  Device,
  IntegrationTestResponse,
  Operation,
  OrderCreatedResponse,
  ProviderApi,
  ProviderOrderCreation,
  ProviderOrderUpdate,
  ProviderReferenceData,
  ProviderServices,
  ReferenceDataResponse,
  Resource,
  Service,
  Sex,
  Species
} from '@nominal-systems/dmi-engine-common'
import { MessagePattern } from '@nestjs/microservices'
import { AntechV6MessageData } from '../interfaces/antechV6-message-data.interface'
import { PROVIDER_NAME } from '../constants/provider-name.constant'
import { AntechV6Service } from '../services/antechV6.service'

@Controller('engine/antech-v6')
export class AntechV6Controller
  implements ProviderOrderCreation, ProviderOrderUpdate, ProviderReferenceData, ProviderServices, ProviderApi
{
  private readonly logger = new Logger(AntechV6Controller.name)

  constructor(private readonly antechV6Service: AntechV6Service) {}

  @MessagePattern(`${PROVIDER_NAME}/${Resource.Integration}/${Operation.Test}`)
  public async testCredentials(msg: ApiEvent<AntechV6MessageData>): Promise<IntegrationTestResponse> {
    const { payload, ...metadata } = msg.data
    return await this.antechV6Service.testAuth(payload, metadata)
  }

  @MessagePattern(`${PROVIDER_NAME}/${Resource.Orders}/${Operation.Create}`)
  public async createOrder(msg: ApiEvent<AntechV6MessageData>): Promise<OrderCreatedResponse> {
    const { payload, ...metadata } = msg.data
    const orderCreatedResponse = await this.antechV6Service.createOrder(<CreateOrderPayload>payload, metadata)
    this.logger.log(`Antech V6 pre-order placed. Finalize it at: ${orderCreatedResponse.submissionUri}`)
    return orderCreatedResponse
  }

  @MessagePattern(`${PROVIDER_NAME}/${Resource.Orders}/${Operation.Cancel}`)
  public cancelOrder(msg: ApiEvent<AntechV6MessageData>): Promise<void> {
    const { payload, ...metadata } = msg.data
    return this.antechV6Service.cancelOrder(payload, metadata)
  }

  @MessagePattern(`${PROVIDER_NAME}/${Resource.Orders}/${Operation.TestsCancel}`)
  public cancelOrderTest(msg: ApiEvent<AntechV6MessageData>): Promise<void> {
    const { payload, ...metadata } = msg.data
    return this.antechV6Service.cancelOrderTest(payload, metadata)
  }

  @MessagePattern(`${PROVIDER_NAME}/${Resource.Sexes}/${Operation.List}`)
  public getSexes(msg: ApiEvent<AntechV6MessageData>): Promise<ReferenceDataResponse<Sex> | Sex[]> {
    const { payload, ...metadata } = msg.data
    return this.antechV6Service.getSexes(payload, metadata)
  }

  @MessagePattern(`${PROVIDER_NAME}/${Resource.Species}/${Operation.List}`)
  public getSpecies(msg: ApiEvent<AntechV6MessageData>): Promise<ReferenceDataResponse<Species> | Species[]> {
    const { payload, ...metadata } = msg.data
    return this.antechV6Service.getSpecies(payload, metadata)
  }

  @MessagePattern(`${PROVIDER_NAME}/${Resource.Breeds}/${Operation.List}`)
  public getBreeds(msg: ApiEvent<AntechV6MessageData>): Promise<ReferenceDataResponse<Breed> | Breed[]> {
    const { payload, ...metadata } = msg.data
    return this.antechV6Service.getBreeds(payload, metadata)
  }

  @MessagePattern(`${PROVIDER_NAME}/${Resource.Devices}/${Operation.List}`)
  public getDevices(): Promise<ReferenceDataResponse<Device> | Device[]> {
    return Promise.resolve([])
  }

  @MessagePattern(`${PROVIDER_NAME}/${Resource.Services}/${Operation.List}`)
  public getServices(msg: ApiEvent<AntechV6MessageData>): Promise<ReferenceDataResponse<Service> | Service[]> {
    const { payload, ...metadata } = msg.data
    return this.antechV6Service.getServices(payload, metadata)
  }
}
