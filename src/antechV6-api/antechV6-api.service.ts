import { Injectable, Logger } from '@nestjs/common'
import {
  AntechV6AccessToken,
  AntechV6Endpoints,
  AntechV6Order,
  AntechV6OrderPlacement,
  AntechV6OrderStatusResponse,
  AntechV6PreOrder,
  AntechV6PreOrderPlacement,
  AntechV6Result,
  AntechV6ResultStatusResponse,
  AntechV6SpeciesAndBreeds,
  AntechV6TestGuide,
  AntechV6UserCredentials,
} from '../interfaces/antechV6-api.interface'
import { Attachment, BaseApiService } from '@nominal-systems/dmi-engine-common'
import { AntechV6ApiHttpService } from './antechV6-api-http.service'
import { AntechV6ApiException } from '../common/exceptions/antechV6-api.exception'

@Injectable()
export class AntechV6ApiService extends BaseApiService {
  private readonly logger = new Logger(AntechV6ApiService.name)

  constructor(private readonly httpService: AntechV6ApiHttpService) {
    super(httpService)
  }

  private async doGet<T>(
    credentials: AntechV6UserCredentials,
    baseUrl: string,
    endpoint: AntechV6Endpoints,
    opts?: {
      path?: string
      params?: Record<string, any>
      responseType?: 'json' | 'arraybuffer'
      integrationId?: string
    },
  ): Promise<T> {
    const { Token } = await this.authenticate(baseUrl, credentials, opts?.integrationId)
    const url = opts?.path ? `${baseUrl}${endpoint}${opts.path}` : `${baseUrl}${endpoint}`

    return await this.get<T>(url, {
      params: {
        ...opts?.params,
      },
      responseType: opts?.responseType || 'json',
      headers: {
        accessToken: Token,
      },
      metadata: { integrationId: opts?.integrationId },
    } as any)
  }

  private async doPost<T>(
    credentials: AntechV6UserCredentials,
    baseUrl: string,
    endpoint: AntechV6Endpoints,
    data: any,
    opts?: {
      integrationId?: string
    },
  ): Promise<T> {
    const { Token } = await this.authenticate(baseUrl, credentials, opts?.integrationId)
    return await this.post<T>(`${baseUrl}${endpoint}`, data, {
      headers: {
        'Content-Type': 'application/json',
        accessToken: Token,
      },
      metadata: { integrationId: opts?.integrationId },
    } as any)
  }

  private async authenticate(
    baseUrl: string,
    credentials: AntechV6UserCredentials,
    integrationId?: string,
  ): Promise<AntechV6AccessToken> {
    return await this.post<AntechV6AccessToken>(`${baseUrl}${AntechV6Endpoints.LOGIN}`, credentials, {
      metadata: { integrationId },
    } as any)
  }

  async getOrderStatus(
    baseUrl: string,
    credentials: AntechV6UserCredentials,
    overrideAck = true,
    integrationId?: string,
  ): Promise<AntechV6OrderStatusResponse> {
    return await this.doGet<AntechV6OrderStatusResponse>(
      credentials,
      baseUrl,
      AntechV6Endpoints.GET_STATUS,
      {
        params: {
          serviceType: 'labOrder',
          ClinicID: credentials.ClinicID,
          overrideAck,
        },
        integrationId,
      },
    )
  }

  async getOrderTrf(
    baseUrl: string,
    credentials: AntechV6UserCredentials,
    clinicAccessionID: string,
    integrationId?: string,
  ): Promise<Attachment | undefined> {
    try {
      const pdfData = await this.doGet<string>(
        credentials,
        baseUrl,
        AntechV6Endpoints.GET_ORDER_TRF,
        {
          path: `/${clinicAccessionID}`,
          responseType: 'arraybuffer',
          integrationId,
        },
      )

      return {
        contentType: 'application/pdf',
        data: Buffer.from(pdfData, 'binary').toString('base64'),
        uri: `${baseUrl}${AntechV6Endpoints.GET_ORDER_TRF}/${clinicAccessionID}`,
      }
    } catch (error) {
      this.logger.warn(`Couldn't fetch order TRF for order ${clinicAccessionID}`)
      return undefined
    }
  }

  async getResultStatus(
    baseUrl: string,
    credentials: AntechV6UserCredentials,
    query: {
      ClinicAccessionID?: string
    } = {},
    integrationId?: string,
  ): Promise<AntechV6ResultStatusResponse> {
    return await this.doGet<AntechV6ResultStatusResponse>(
      credentials,
      baseUrl,
      AntechV6Endpoints.GET_STATUS,
      {
        params: {
          serviceType: 'labResult',
          ClinicID: credentials.ClinicID,
          overrideAck: true,
          ...query,
        },
        integrationId,
      },
    )
  }

  async getAllResults(
    baseUrl: string,
    credentials: AntechV6UserCredentials,
    integrationId?: string,
  ): Promise<AntechV6Result[]> {
    return await this.doGet<AntechV6Result[]>(
      credentials,
      baseUrl,
      AntechV6Endpoints.GET_ALL_RESULTS,
      { integrationId },
    )
  }

  async getOrphanResults(
    baseUrl: string,
    credentials: AntechV6UserCredentials,
    integrationId?: string,
  ): Promise<AntechV6Result[]> {
    return await this.doGet<AntechV6Result[]>(
      credentials,
      baseUrl,
      AntechV6Endpoints.GET_ALL_ORPHAN_RESULTS,
      { integrationId },
    )
  }

  async getSpeciesAndBreeds(
    baseUrl: string,
    credentials: AntechV6UserCredentials,
    integrationId?: string,
  ): Promise<AntechV6SpeciesAndBreeds> {
    return await this.doGet<AntechV6SpeciesAndBreeds>(
      credentials,
      baseUrl,
      AntechV6Endpoints.GET_SPECIES_AND_BREEDS,
      {
        params: {
          ClinicID: credentials.ClinicID,
        },
        integrationId,
      },
    )
  }

  async getTestGuide(
    baseUrl: string,
    credentials: AntechV6UserCredentials,
    params: Record<string, string | number> = {},
    integrationId?: string,
  ): Promise<AntechV6TestGuide> {
    const accessToken: AntechV6AccessToken = await this.post<AntechV6AccessToken>(
      `${baseUrl}${AntechV6Endpoints.LOGIN}`,
      credentials,
      { metadata: { integrationId } } as any,
    )

    return await this.get<AntechV6TestGuide>(`${baseUrl}${AntechV6Endpoints.GET_TEST_GUIDE}`, {
      params: {
        accesstoken: accessToken.Token,
        userId: String(accessToken?.UserInfo?.ID),
        pageSize: 2500,
        ...params,
      },
      metadata: { integrationId },
    } as any)
  }

  async placePreOrder(
    baseUrl: string,
    credentials: AntechV6UserCredentials,
    preOrder: AntechV6PreOrder,
    integrationId?: string,
  ): Promise<AntechV6PreOrderPlacement & AntechV6AccessToken> {
    try {
      const { Token } = await this.authenticate(baseUrl, credentials, integrationId)
      const preOrderPlacement = await this.post<AntechV6PreOrderPlacement>(
        `${baseUrl}${AntechV6Endpoints.PLACE_PRE_ORDER}`,
        preOrder,
        {
          headers: {
            'Content-Type': 'application/json',
            accessToken: Token,
          },
          metadata: { integrationId },
        } as any,
      )
      return {
        ...preOrderPlacement,
        Token,
      }
    } catch (error) {
      throw new AntechV6ApiException('Failed to place pre-order', error.status, error)
    }
  }

  async placeOrder(
    baseUrl: string,
    credentials: AntechV6UserCredentials,
    order: AntechV6Order,
    integrationId?: string,
  ): Promise<AntechV6OrderPlacement & AntechV6AccessToken> {
    try {
      const { Token } = await this.authenticate(baseUrl, credentials, integrationId)
      const orderPlacement = await this.post<AntechV6OrderPlacement>(
        `${baseUrl}${AntechV6Endpoints.PLACE_ORDER}`,
        order,
        {
          headers: {
            'Content-Type': 'application/json',
            accessToken: Token,
          },
          metadata: { integrationId },
        } as any,
      )
      return {
        ...orderPlacement,
        Token,
      }
    } catch (error) {
      throw new AntechV6ApiException('Failed to place order', error.status, error)
    }
  }

  async acknowledgeResults(
    baseUrl: string,
    credentials: AntechV6UserCredentials,
    labAccessionIds: string[] = [],
    integrationId?: string,
  ): Promise<void> {
    await this.doPost(credentials, baseUrl, AntechV6Endpoints.ACKNOWLEDGE_STATUS, {
      serviceType: 'labResult',
      clinicId: credentials.ClinicID,
      labAccessionsIds: [...new Set(labAccessionIds)],
    }, { integrationId })
  }

  async acknowledgeOrders(
    baseUrl: string,
    credentials: AntechV6UserCredentials,
    clinicAccessionIds: string[] = [],
    integrationId?: string,
  ): Promise<void> {
    await this.doPost(credentials, baseUrl, AntechV6Endpoints.ACKNOWLEDGE_STATUS, {
      serviceType: 'labOrder',
      clinicId: credentials.ClinicID,
      clinicAccessionIds: [...new Set(clinicAccessionIds)],
    }, { integrationId })
  }

  async testAuth(baseUrl: string, credentials: AntechV6UserCredentials): Promise<void> {
    try {
      await this.authenticate(baseUrl, credentials)
    } catch (error) {
      throw new AntechV6ApiException('Failed to authenticate', error.status, error)
    }
  }
}
