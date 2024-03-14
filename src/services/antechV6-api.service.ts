import { Injectable } from '@nestjs/common'
import { HttpService } from '@nestjs/axios'
import {
  AntechV6AccessToken,
  AntechV6Endpoints,
  AntechV6OrderStatus,
  AntechV6PreOrder,
  AntechV6PreOrderPlacement,
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
    params: any
  ): Promise<T> {
    const accessToken = await this.authenticate(baseUrl, credentials)
    return await this.get<T>(`${baseUrl}${endpoint}`, {
      params: {
        ...params,
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
      params: {
        accessToken
      },
      headers: {
        'Content-Type': 'application/json'
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

  async getOrderStatus(baseUrl: string, credentials: AntechV6UserCredentials): Promise<AntechV6OrderStatus> {
    return await this.doGet<AntechV6OrderStatus>(credentials, baseUrl, AntechV6Endpoints.GET_STATUS, {
      serviceType: 'labOrder',
      ClinicID: credentials.ClinicID
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
}
