import { Injectable, Logger } from '@nestjs/common'
import {
  Attachment,
  BaseProviderService,
  BatchResultsResponse,
  Breed,
  calculateHash,
  CreateOrderPayload,
  Device,
  IdPayload,
  IdsPayload,
  IntegrationTestResponse,
  mergePicks,
  NullPayloadPayload,
  Order,
  OrderCreatedResponse,
  OrderTestPayload,
  ReferenceDataResponse,
  Result,
  Service,
  ServiceCodePayload,
  Sex,
  Species,
} from '@nominal-systems/dmi-engine-common'
import { AntechV6MessageData } from '../interfaces/antechV6-message-data.interface'
import { AntechV6ApiService } from '../antechV6-api/antechV6-api.service'
import {
  AntechV6AccessToken,
  AntechV6PetSex,
  AntechV6PreOrderPlacement,
  AntechV6Result,
  AntechV6SpeciesAndBreeds,
  AntechV6TestGuide,
  AntechV6UserCredentials,
} from '../interfaces/antechV6-api.interface'
import { AntechV6Mapper } from '../providers/antechV6-mapper'
import { AntechV6ApiException } from '../common/exceptions/antechV6-api.exception'

@Injectable()
export class AntechV6Service extends BaseProviderService<AntechV6MessageData> {
  private readonly logger = new Logger(AntechV6Service.name)

  constructor(
    private readonly antechV6Api: AntechV6ApiService,
    private readonly antechV6Mapper: AntechV6Mapper,
  ) {
    super()
  }

  async testAuth(
    payload: NullPayloadPayload,
    metadata: AntechV6MessageData,
  ): Promise<IntegrationTestResponse> {
    const credentials: AntechV6UserCredentials = {
      UserName: metadata.integrationOptions.username,
      Password: metadata.integrationOptions.password,
      ClinicID: metadata.integrationOptions.clinicId,
    }

    try {
      await this.antechV6Api.testAuth(metadata.providerConfiguration.baseUrl, credentials)
      return {
        success: true,
        message: 'Authentication successful',
      }
    } catch (error) {
      return {
        success: false,
        message: error.message,
      }
    }
  }

  async createOrder(
    payload: CreateOrderPayload,
    metadata: AntechV6MessageData,
  ): Promise<OrderCreatedResponse> {
    const credentials: AntechV6UserCredentials = {
      UserName: metadata.integrationOptions.username,
      Password: metadata.integrationOptions.password,
      ClinicID: metadata.integrationOptions.clinicId,
    }

    const preOrder = this.antechV6Mapper.mapCreateOrderPayload(payload, metadata)
    const preOrderPlacement: AntechV6PreOrderPlacement & AntechV6AccessToken =
      await this.antechV6Api.placePreOrder(
        metadata.providerConfiguration.baseUrl,
        credentials,
        preOrder,
      )

    return this.antechV6Mapper.mapAntechV6PreOrder(preOrder, preOrderPlacement, metadata)
  }

  async getBatchOrders(
    payload: NullPayloadPayload,
    metadata: AntechV6MessageData,
  ): Promise<Order[]> {
    const { username, password, clinicId } = metadata.integrationOptions
    const { IhdMnemonic = [] } = metadata.providerConfiguration
    const credentials = {
      UserName: username,
      Password: password,
      ClinicID: clinicId,
    }

    const orderStatusResponse = await this.antechV6Api.getOrderStatus(
      metadata.providerConfiguration.baseUrl,
      credentials,
      false,
    )

    const orders: Order[] = []
    for (const orderStatus of orderStatusResponse.LabOrders) {
      const resultStatusResponse = await this.antechV6Api.getResultStatus(
        metadata.providerConfiguration.baseUrl,
        credentials,
        { ClinicAccessionID: orderStatus.ClinicAccessionID },
      )

      const order =
        resultStatusResponse.LabResults.length > 0
          ? mergePicks(
              this.antechV6Mapper.mapAntechV6OrderStatus(orderStatus),
              this.antechV6Mapper.mapAntechV6ResultStatus(resultStatusResponse.LabResults[0]),
            )
          : (this.antechV6Mapper.mapAntechV6OrderStatus(orderStatus) as unknown as Order)

      const orderMnemonics = [...(orderStatus.LabTests || []).map((t) => t.Mnemonic)]

      if (!orderMnemonics.some((mn) => IhdMnemonic.includes(mn))) {
        const manifest: Attachment | undefined = await this.antechV6Api.getOrderTrf(
          metadata.providerConfiguration.baseUrl,
          credentials,
          orderStatus.ClinicAccessionID,
        )
        if (manifest != null) {
          order.manifest = manifest
        }
      }

      if (resultStatusResponse.LabResults.length === 0) {
        this.logger.warn(`Couldn't find result status for order ${orderStatus.ClinicAccessionID}`)
      }

      orders.push(order)
    }

    return orders
  }

  async getBatchResults(
    payload: NullPayloadPayload,
    metadata: AntechV6MessageData,
  ): Promise<BatchResultsResponse> {
    const credentials: AntechV6UserCredentials = {
      UserName: metadata.integrationOptions.username,
      Password: metadata.integrationOptions.password,
      ClinicID: metadata.integrationOptions.clinicId,
    }

    const allResults: AntechV6Result[] = await this.antechV6Api.getAllResults(
      metadata.providerConfiguration.baseUrl,
      credentials,
    )

    return {
      results: allResults.map((result) => this.antechV6Mapper.mapAntechV6Result(result)),
    }
  }

  getOrder(payload: IdPayload, metadata: AntechV6MessageData): Promise<Order> {
    console.log('getOrder()') // TODO(gb): remove trace
    console.log(`payload= ${JSON.stringify(payload, null, 2)}`) // TODO(gb): remove trace
    console.log(`metadata= ${JSON.stringify(metadata, null, 2)}`) // TODO(gb): remove trace
    throw new Error('getOrder() not implemented.')
  }

  getOrderResult(payload: IdPayload, metadata: AntechV6MessageData): Promise<Result> {
    console.log('getOrderResult()') // TODO(gb): remove trace
    console.log(`payload= ${JSON.stringify(payload, null, 2)}`) // TODO(gb): remove trace
    console.log(`metadata= ${JSON.stringify(metadata, null, 2)}`) // TODO(gb): remove trace
    throw new Error('getOrderResult() not implemented.')
  }

  cancelOrder(payload: IdPayload, metadata: AntechV6MessageData): Promise<void> {
    throw new AntechV6ApiException('Antech V6 API does not support cancelling orders.', 501, {
      message: 'Not Implemented',
    })
  }

  cancelOrderTest(payload: OrderTestPayload, metadata: AntechV6MessageData): Promise<void> {
    throw new AntechV6ApiException(
      'Antech V6 API does not support cancelling individual tests.',
      501,
      {
        message: 'Not Implemented',
      },
    )
  }

  async getServices(
    payload: NullPayloadPayload,
    metadata: AntechV6MessageData,
  ): Promise<Service[]> {
    const credentials: AntechV6UserCredentials = {
      UserName: metadata.integrationOptions.username,
      Password: metadata.integrationOptions.password,
      ClinicID: metadata.integrationOptions.clinicId,
    }

    const testGuide: AntechV6TestGuide = await this.antechV6Api.getTestGuide(
      metadata.providerConfiguration.baseUrl,
      credentials,
    )

    return this.antechV6Mapper.mapAntechV6TestGuide(testGuide)
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
  async getSexes(
    payload: NullPayloadPayload,
    metadata: AntechV6MessageData,
  ): Promise<ReferenceDataResponse<Sex>> {
    const items: Sex[] = Object.entries(AntechV6PetSex).map(([key, value]) => ({
      name: key,
      code: value,
    }))

    return Promise.resolve({
      items,
      hash: calculateHash(items),
    })
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async getSpecies(
    payload: NullPayloadPayload,
    metadata: AntechV6MessageData,
  ): Promise<ReferenceDataResponse<Species>> {
    const credentials: AntechV6UserCredentials = {
      UserName: metadata.integrationOptions.username,
      Password: metadata.integrationOptions.password,
      ClinicID: metadata.integrationOptions.clinicId,
    }

    const antechV6SpeciesAndBreeds: AntechV6SpeciesAndBreeds =
      await this.antechV6Api.getSpeciesAndBreeds(
        metadata.providerConfiguration.baseUrl,
        credentials,
      )
    const items: Species[] = antechV6SpeciesAndBreeds.value.data.map((species) => ({
      name: species.name,
      code: String(species.id),
    }))

    return {
      items,
      hash: calculateHash(items),
    }
  }

  async getBreeds(
    payload: NullPayloadPayload,
    metadata: AntechV6MessageData,
  ): Promise<ReferenceDataResponse<Breed>> {
    const credentials: AntechV6UserCredentials = {
      UserName: metadata.integrationOptions.username,
      Password: metadata.integrationOptions.password,
      ClinicID: metadata.integrationOptions.clinicId,
    }

    const antechV6SpeciesAndBreeds: AntechV6SpeciesAndBreeds =
      await this.antechV6Api.getSpeciesAndBreeds(
        metadata.providerConfiguration.baseUrl,
        credentials,
      )
    const getBreeds = (data: AntechV6SpeciesAndBreeds): Breed[] => {
      return data.value.data.flatMap((species) =>
        species.breed.map((breed) => ({
          code: String(breed.id),
          name: breed.name,
          species: String(species.id),
        })),
      )
    }

    const items = getBreeds(antechV6SpeciesAndBreeds)

    return {
      items,
      hash: calculateHash(items),
    }
  }

  async acknowledgeOrders(payload: IdsPayload, metadata: AntechV6MessageData): Promise<void> {
    const credentials: AntechV6UserCredentials = {
      UserName: metadata.integrationOptions.username,
      Password: metadata.integrationOptions.password,
      ClinicID: metadata.integrationOptions.clinicId,
    }

    await this.antechV6Api.acknowledgeOrders(
      metadata.providerConfiguration.baseUrl,
      credentials,
      payload.ids,
    )
  }

  async acknowledgeOrder(payload: IdPayload, metadata: AntechV6MessageData): Promise<void> {
    const credentials: AntechV6UserCredentials = {
      UserName: metadata.integrationOptions.username,
      Password: metadata.integrationOptions.password,
      ClinicID: metadata.integrationOptions.clinicId,
    }

    await this.antechV6Api.acknowledgeOrders(metadata.providerConfiguration.baseUrl, credentials, [
      payload.id,
    ])
  }

  async acknowledgeResults(payload: IdsPayload, metadata: AntechV6MessageData): Promise<void> {
    const credentials: AntechV6UserCredentials = {
      UserName: metadata.integrationOptions.username,
      Password: metadata.integrationOptions.password,
      ClinicID: metadata.integrationOptions.clinicId,
    }

    await this.antechV6Api.acknowledgeResults(
      metadata.providerConfiguration.baseUrl,
      credentials,
      payload.ids,
    )
  }

  async acknowledgeResult(payload: IdPayload, metadata: AntechV6MessageData): Promise<void> {
    const credentials: AntechV6UserCredentials = {
      UserName: metadata.integrationOptions.username,
      Password: metadata.integrationOptions.password,
      ClinicID: metadata.integrationOptions.clinicId,
    }

    await this.antechV6Api.acknowledgeResults(metadata.providerConfiguration.baseUrl, credentials, [
      payload.id,
    ])
  }

  createRequisitionId(payload: NullPayloadPayload, metadata: AntechV6MessageData): string {
    console.log('createRequisitionId()') // TODO(gb): remove trace
    console.log(`payload= ${JSON.stringify(payload, null, 2)}`) // TODO(gb): remove trace
    console.log(`metadata= ${JSON.stringify(metadata, null, 2)}`) // TODO(gb): remove trace
    throw new Error('Method not implemented.')
  }
}
