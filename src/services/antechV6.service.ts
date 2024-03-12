import { Injectable } from '@nestjs/common'
import {
  BatchResultsResponse,
  Breed,
  CreateOrderPayload,
  Device,
  IdPayload,
  NullPayloadPayload,
  Order,
  OrderCreatedResponse,
  OrderTestPayload,
  ProviderService,
  ReferenceDataResponse,
  Result,
  Service,
  ServiceCodePayload,
  Sex,
  Species
} from '@nominal-systems/dmi-engine-common'
import { AntechV6MessageData } from '../interfaces/antechV6-message-data.interface'
import { AntechV6ApiService } from './antechV6-api.service'
import { AntechV6OrderStatus, AntechV6UserCredentials } from '../interfaces/antechV6-api.interface'

@Injectable()
export class AntechV6Service implements ProviderService<AntechV6MessageData> {
  constructor(private readonly antechV6Api: AntechV6ApiService) {}

  createOrder(payload: CreateOrderPayload, metadata: AntechV6MessageData): Promise<OrderCreatedResponse> {
    console.log('createOrder()') // TODO(gb): remove trace
    console.log(`payload= ${JSON.stringify(payload, null, 2)}`) // TODO(gb): remove trace
    console.log(`metadata= ${JSON.stringify(metadata, null, 2)}`) // TODO(gb): remove trace
    throw new Error('Method not implemented.')
  }

  async getBatchOrders(payload: NullPayloadPayload, metadata: AntechV6MessageData): Promise<Order[]> {
    const credentials: AntechV6UserCredentials = {
      UserName: metadata.integrationOptions.username,
      Password: metadata.integrationOptions.password,
      ClinicID: metadata.integrationOptions.clinicId
    }

    const status: AntechV6OrderStatus = await this.antechV6Api.getOrderStatus(
      metadata.providerConfiguration.baseUrl,
      credentials
    )

    return status.LabOrders as unknown as Order[]
  }

  getBatchResults(payload: NullPayloadPayload, metadata: AntechV6MessageData): Promise<BatchResultsResponse> {
    console.log('getBatchResults()') // TODO(gb): remove trace
    console.log(`payload= ${JSON.stringify(payload, null, 2)}`) // TODO(gb): remove trace
    console.log(`metadata= ${JSON.stringify(metadata, null, 2)}`) // TODO(gb): remove trace
    throw new Error('Method not implemented.')
  }

  getOrder(payload: IdPayload, metadata: AntechV6MessageData): Promise<Order> {
    console.log('getOrder()') // TODO(gb): remove trace
    console.log(`payload= ${JSON.stringify(payload, null, 2)}`) // TODO(gb): remove trace
    console.log(`metadata= ${JSON.stringify(metadata, null, 2)}`) // TODO(gb): remove trace
    throw new Error('Method not implemented.')
  }

  getOrderResult(payload: IdPayload, metadata: AntechV6MessageData): Promise<Result> {
    console.log('getOrderResult()') // TODO(gb): remove trace
    console.log(`payload= ${JSON.stringify(payload, null, 2)}`) // TODO(gb): remove trace
    console.log(`metadata= ${JSON.stringify(metadata, null, 2)}`) // TODO(gb): remove trace
    throw new Error('Method not implemented.')
  }

  cancelOrder(payload: IdPayload, metadata: AntechV6MessageData): Promise<void> {
    console.log('cancelOrder()') // TODO(gb): remove trace
    console.log(`payload= ${JSON.stringify(payload, null, 2)}`) // TODO(gb): remove trace
    console.log(`metadata= ${JSON.stringify(metadata, null, 2)}`) // TODO(gb): remove trace
    throw new Error('Method not implemented.')
  }

  cancelOrderTest(payload: OrderTestPayload, metadata: AntechV6MessageData): Promise<void> {
    console.log('cancelOrderTest()') // TODO(gb): remove trace
    console.log(`payload= ${JSON.stringify(payload, null, 2)}`) // TODO(gb): remove trace
    console.log(`metadata= ${JSON.stringify(metadata, null, 2)}`) // TODO(gb): remove trace
    throw new Error('Method not implemented.')
  }

  getServices(payload: NullPayloadPayload, metadata: AntechV6MessageData): Promise<Service[]> {
    console.log('getServices()') // TODO(gb): remove trace
    console.log(`payload= ${JSON.stringify(payload, null, 2)}`) // TODO(gb): remove trace
    console.log(`metadata= ${JSON.stringify(metadata, null, 2)}`) // TODO(gb): remove trace
    throw new Error('Method not implemented.')
  }

  getServiceByCode(payload: ServiceCodePayload, metadata: AntechV6MessageData): Promise<Service> {
    console.log('getServiceByCode()') // TODO(gb): remove trace
    console.log(`payload= ${JSON.stringify(payload, null, 2)}`) // TODO(gb): remove trace
    console.log(`metadata= ${JSON.stringify(metadata, null, 2)}`) // TODO(gb): remove trace
    throw new Error('Method not implemented.')
  }

  getDevices(payload: NullPayloadPayload, metadata: AntechV6MessageData): Promise<Device[]> {
    console.log('getDevices()') // TODO(gb): remove trace
    console.log(`payload= ${JSON.stringify(payload, null, 2)}`) // TODO(gb): remove trace
    console.log(`metadata= ${JSON.stringify(metadata, null, 2)}`) // TODO(gb): remove trace
    throw new Error('Method not implemented.')
  }

  getSexes(payload: NullPayloadPayload, metadata: AntechV6MessageData): Promise<ReferenceDataResponse<Sex>> {
    console.log('getSexes()') // TODO(gb): remove trace
    console.log(`payload= ${JSON.stringify(payload, null, 2)}`) // TODO(gb): remove trace
    console.log(`metadata= ${JSON.stringify(metadata, null, 2)}`) // TODO(gb): remove trace
    throw new Error('Method not implemented.')
  }

  getSpecies(payload: NullPayloadPayload, metadata: AntechV6MessageData): Promise<ReferenceDataResponse<Species>> {
    console.log('getSpecies()') // TODO(gb): remove trace
    console.log(`payload= ${JSON.stringify(payload, null, 2)}`) // TODO(gb): remove trace
    console.log(`metadata= ${JSON.stringify(metadata, null, 2)}`) // TODO(gb): remove trace
    throw new Error('Method not implemented.')
  }

  getBreeds(payload: NullPayloadPayload, metadata: AntechV6MessageData): Promise<ReferenceDataResponse<Breed>> {
    console.log('getBreeds()') // TODO(gb): remove trace
    console.log(`payload= ${JSON.stringify(payload, null, 2)}`) // TODO(gb): remove trace
    console.log(`metadata= ${JSON.stringify(metadata, null, 2)}`) // TODO(gb): remove trace
    throw new Error('Method not implemented.')
  }

  createRequisitionId(payload: NullPayloadPayload, metadata: AntechV6MessageData): string {
    console.log('createRequisitionId()') // TODO(gb): remove trace
    console.log(`payload= ${JSON.stringify(payload, null, 2)}`) // TODO(gb): remove trace
    console.log(`metadata= ${JSON.stringify(metadata, null, 2)}`) // TODO(gb): remove trace
    throw new Error('Method not implemented.')
  }
}
