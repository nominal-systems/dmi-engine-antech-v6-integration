import { Injectable } from '@nestjs/common'
import {
  BatchResultsResponse,
  Breed,
  calculateHash,
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
import {
  AntechV6AccessToken,
  AntechV6OrderStatus,
  AntechV6PetSex,
  AntechV6PreOrderPlacement,
  AntechV6SpeciesAndBreeds,
  AntechV6UserCredentials
} from '../interfaces/antechV6-api.interface'
import { AntechV6Mapper } from '../providers/antechV6-mapper'

@Injectable()
export class AntechV6Service implements ProviderService<AntechV6MessageData> {
  constructor(
    private readonly antechV6Api: AntechV6ApiService,
    private readonly antechV6Mapper: AntechV6Mapper
  ) {}

  async createOrder(payload: CreateOrderPayload, metadata: AntechV6MessageData): Promise<OrderCreatedResponse> {
    const credentials: AntechV6UserCredentials = {
      UserName: metadata.integrationOptions.username,
      Password: metadata.integrationOptions.password,
      ClinicID: metadata.integrationOptions.clinicId
    }

    const preOrder = this.antechV6Mapper.mapCreateOrderPayload(payload, metadata)
    const preOrderPlacement: AntechV6PreOrderPlacement & AntechV6AccessToken = await this.antechV6Api.placePreOrder(
      metadata.providerConfiguration.baseUrl,
      credentials,
      preOrder
    )

    return this.antechV6Mapper.mapAntechV6PreOrder(preOrder, preOrderPlacement, metadata)
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

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async getSexes(payload: NullPayloadPayload, metadata: AntechV6MessageData): Promise<ReferenceDataResponse<Sex>> {
    const items: Sex[] = Object.entries(AntechV6PetSex).map(([key, value]) => ({
      name: key,
      code: value
    }))

    return Promise.resolve({
      items,
      hash: calculateHash(items)
    })
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async getSpecies(
    payload: NullPayloadPayload,
    metadata: AntechV6MessageData
  ): Promise<ReferenceDataResponse<Species>> {
    const credentials: AntechV6UserCredentials = {
      UserName: metadata.integrationOptions.username,
      Password: metadata.integrationOptions.password,
      ClinicID: metadata.integrationOptions.clinicId
    }

    const antechV6SpeciesAndBreeds: AntechV6SpeciesAndBreeds = await this.antechV6Api.getSpeciesAndBreeds(
      metadata.providerConfiguration.baseUrl,
      credentials
    )
    const items: Species[] = antechV6SpeciesAndBreeds.value.data.map((species) => ({
      name: species.name,
      code: String(species.id)
    }))

    return {
      items,
      hash: calculateHash(items)
    }
  }

  async getBreeds(payload: NullPayloadPayload, metadata: AntechV6MessageData): Promise<ReferenceDataResponse<Breed>> {
    const credentials: AntechV6UserCredentials = {
      UserName: metadata.integrationOptions.username,
      Password: metadata.integrationOptions.password,
      ClinicID: metadata.integrationOptions.clinicId
    }

    const antechV6SpeciesAndBreeds: AntechV6SpeciesAndBreeds = await this.antechV6Api.getSpeciesAndBreeds(
      metadata.providerConfiguration.baseUrl,
      credentials
    )
    const getBreeds = (data: AntechV6SpeciesAndBreeds): Breed[] => {
      return data.value.data.flatMap((species) =>
        species.breed.map((breed) => ({ code: String(breed.id), name: breed.name, species: String(species.id) }))
      )
    }

    const items = getBreeds(antechV6SpeciesAndBreeds)

    return {
      items,
      hash: calculateHash(items)
    }
  }

  createRequisitionId(payload: NullPayloadPayload, metadata: AntechV6MessageData): string {
    console.log('createRequisitionId()') // TODO(gb): remove trace
    console.log(`payload= ${JSON.stringify(payload, null, 2)}`) // TODO(gb): remove trace
    console.log(`metadata= ${JSON.stringify(metadata, null, 2)}`) // TODO(gb): remove trace
    throw new Error('Method not implemented.')
  }
}
