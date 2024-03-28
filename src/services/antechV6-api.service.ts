import { Injectable } from '@nestjs/common'
import { HttpService } from '@nestjs/axios'
import {
  AntechV6AccessToken,
  AntechV6Endpoints,
  AntechV6OrderStatusResponse,
  AntechV6PreOrder,
  AntechV6PreOrderPlacement,
  AntechV6Result,
  AntechV6ResultStatusResponse,
  AntechV6SpeciesAndBreeds,
  AntechV6TestGuide,
  AntechV6UserCredentials
} from '../interfaces/antechV6-api.interface'
import { BaseApiService } from './base-api.service'

@Injectable()
export class AntechV6ApiService extends BaseApiService {
  constructor(private readonly httpService: HttpService) {
    super(httpService)
  }

  private async doGet<T>(
    credentials: AntechV6UserCredentials,
    baseUrl: string,
    endpoint: AntechV6Endpoints,
    params?: any
  ): Promise<T> {
    const accessToken = await this.authenticate(baseUrl, credentials)
    return await this.get<T>(`${baseUrl}${endpoint}`, {
      params: {
        ...params
      },
      headers: {
        accessToken
      }
    })
  }

  private async doPost<T>(
    credentials: AntechV6UserCredentials,
    baseUrl: string,
    endpoint: AntechV6Endpoints,
    data: any
  ): Promise<T> {
    const accessToken = await this.authenticate(baseUrl, credentials)
    return await this.post<T>(`${baseUrl}${endpoint}`, data, {
      headers: {
        'Content-Type': 'application/json',
        accessToken
      }
    })
  }

  private async authenticate(baseUrl: string, credentials: AntechV6UserCredentials): Promise<string> {
    const accessToken: AntechV6AccessToken = await this.post<AntechV6AccessToken>(
      `${baseUrl}${AntechV6Endpoints.LOGIN}`,
      credentials
    )
    return accessToken.Token
  }

  async getOrderStatus(baseUrl: string, credentials: AntechV6UserCredentials): Promise<AntechV6OrderStatusResponse> {
    return await this.doGet<AntechV6OrderStatusResponse>(credentials, baseUrl, AntechV6Endpoints.GET_STATUS, {
      serviceType: 'labOrder',
      ClinicID: credentials.ClinicID,
      overrideAck: true
    })
  }

  async getResultStatus(
    baseUrl: string,
    credentials: AntechV6UserCredentials,
    query: {
      ClinicAccessionID?: string
    } = {}
  ): Promise<AntechV6ResultStatusResponse> {
    return await this.doGet<AntechV6ResultStatusResponse>(credentials, baseUrl, AntechV6Endpoints.GET_STATUS, {
      serviceType: 'labResult',
      ClinicID: credentials.ClinicID,
      overrideAck: true,
      ...query
    })
  }

  async getAllResults(baseUrl: string, credentials: AntechV6UserCredentials): Promise<AntechV6Result[]> {
    const accessToken = await this.authenticate(baseUrl, credentials)

    // The Get All Results endpoint still expects the `accessToken` as a query param, but it should be changed to a
    // header parameter in the future.
    return await this.get<AntechV6Result[]>(`${baseUrl}${AntechV6Endpoints.GET_ALL_RESULTS}`, {
      params: {
        accessToken
      }
    })
  }

  async getSpeciesAndBreeds(baseUrl: string, credentials: AntechV6UserCredentials): Promise<AntechV6SpeciesAndBreeds> {
    return await this.doGet<AntechV6SpeciesAndBreeds>(credentials, baseUrl, AntechV6Endpoints.GET_SPECIES_AND_BREEDS, {
      ClinicID: credentials.ClinicID
    })
  }

  async getTestGuide(baseUrl: string, credentials: AntechV6UserCredentials): Promise<AntechV6TestGuide> {
    const accessToken: AntechV6AccessToken = await this.post<AntechV6AccessToken>(
      `${baseUrl}${AntechV6Endpoints.LOGIN}`,
      credentials
    )

    return await this.get<AntechV6TestGuide>(`${baseUrl}${AntechV6Endpoints.GET_TEST_GUIDE}`, {
      params: {
        accesstoken: accessToken.Token,
        userId: String(accessToken?.UserInfo?.ID),
        pageSize: 2500
      }
    })
  }

  async placePreOrder(
    baseUrl: string,
    credentials: AntechV6UserCredentials,
    preOrder: AntechV6PreOrder
  ): Promise<AntechV6PreOrderPlacement & AntechV6AccessToken> {
    const accessToken = await this.authenticate(baseUrl, credentials)
    const preOrderPlacement: AntechV6PreOrderPlacement = await this.doPost<AntechV6PreOrderPlacement>(
      credentials,
      baseUrl,
      AntechV6Endpoints.PLACE_PRE_ORDER,
      preOrder
    )
    return {
      ...preOrderPlacement,
      Token: accessToken
    }
  }

  async acknowledgeResults(
    baseUrl: string,
    credentials: AntechV6UserCredentials,
    labAccessionIds: string[] = []
  ): Promise<void> {
    console.log(`Acknowledge results: ${labAccessionIds.join(', ')}`) // TODO(gb): remove trace
    // TODO(gb): acknowledge results
  }

  async acknowledgeOrders(
    baseUrl: string,
    credentials: AntechV6UserCredentials,
    clinicAccessionIds: string[] = []
  ): Promise<void> {
    console.log(`Acknowledge orders: ${clinicAccessionIds.join(', ')}`) // TODO(gb): remove trace
    // TODO(gb): acknowledge orders
  }
}
