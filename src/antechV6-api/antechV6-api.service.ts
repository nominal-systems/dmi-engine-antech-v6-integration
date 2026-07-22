import { Inject, Injectable, Logger } from '@nestjs/common'
import { CACHE_MANAGER, CacheStore } from '@nestjs/cache-manager'
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

// The Antech v6 auth response does not indicate any expiry time, but the token
// has been tested to be valid for more than 12 hours.
const ACCESS_TOKEN_TTL = 12 * 60 * 60 * 1000

@Injectable()
export class AntechV6ApiService extends BaseApiService {
  private readonly logger = new Logger(AntechV6ApiService.name)

  constructor(
    @Inject(CACHE_MANAGER) private readonly cacheManager: CacheStore,
    private readonly httpService: AntechV6ApiHttpService,
  ) {
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
    },
  ): Promise<T> {
    const { Token } = await this.authenticate(baseUrl, credentials)
    const url = opts?.path ? `${baseUrl}${endpoint}${opts.path}` : `${baseUrl}${endpoint}`

    return await this.get<T>(url, {
      params: {
        ...opts?.params,
      },
      responseType: opts?.responseType || 'json',
      headers: {
        accessToken: Token,
      },
    })
  }

  private async doPost<T>(
    credentials: AntechV6UserCredentials,
    baseUrl: string,
    endpoint: AntechV6Endpoints,
    data: any,
  ): Promise<T> {
    const { Token } = await this.authenticate(baseUrl, credentials)
    return await this.post<T>(`${baseUrl}${endpoint}`, data, {
      headers: {
        'Content-Type': 'application/json',
        accessToken: Token,
      },
    })
  }

  private async authenticate(
    baseUrl: string,
    credentials: AntechV6UserCredentials,
    useCache = true,
  ): Promise<AntechV6AccessToken> {
    let accessToken: AntechV6AccessToken | undefined = undefined
    const key = `access_token-${credentials.UserName}-${credentials.ClinicID}`
    if (useCache) {
      accessToken = await this.cacheManager.get<AntechV6AccessToken>(key)
    }
    if (!accessToken) {
      accessToken = await this.post<AntechV6AccessToken>(
        `${baseUrl}${AntechV6Endpoints.LOGIN}`,
        credentials,
      )
      this.logger.debug(`Got new token: ${accessToken.Token.slice(-4)}`)
      if (useCache) {
        await this.cacheManager.set(key, accessToken, ACCESS_TOKEN_TTL)
        this.logger.debug(`Saved new token '${key}' in cache (ttl: ${ACCESS_TOKEN_TTL / 1000}s)`)
      }
    }
    return accessToken
  }

  async getOrderStatus(
    baseUrl: string,
    credentials: AntechV6UserCredentials,
    overrideAck = true,
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
      },
    )
  }

  async getOrderTrf(
    baseUrl: string,
    credentials: AntechV6UserCredentials,
    clinicAccessionID: string,
  ): Promise<Attachment | undefined> {
    try {
      const pdfData = await this.doGet<string>(
        credentials,
        baseUrl,
        AntechV6Endpoints.GET_ORDER_TRF,
        {
          path: `/${clinicAccessionID}`,
          responseType: 'arraybuffer',
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
      },
    )
  }

  async getAllResults(
    baseUrl: string,
    credentials: AntechV6UserCredentials,
  ): Promise<AntechV6Result[]> {
    return await this.doGet<AntechV6Result[]>(
      credentials,
      baseUrl,
      AntechV6Endpoints.GET_ALL_RESULTS,
    )
  }

  async getOrphanResults(
    baseUrl: string,
    credentials: AntechV6UserCredentials,
  ): Promise<AntechV6Result[]> {
    return await this.doGet<AntechV6Result[]>(
      credentials,
      baseUrl,
      AntechV6Endpoints.GET_ALL_ORPHAN_RESULTS,
    )
  }

  async getSpeciesAndBreeds(
    baseUrl: string,
    credentials: AntechV6UserCredentials,
  ): Promise<AntechV6SpeciesAndBreeds> {
    return await this.doGet<AntechV6SpeciesAndBreeds>(
      credentials,
      baseUrl,
      AntechV6Endpoints.GET_SPECIES_AND_BREEDS,
      {
        params: {
          ClinicID: credentials.ClinicID,
        },
      },
    )
  }

  async getTestGuide(
    baseUrl: string,
    credentials: AntechV6UserCredentials,
    params: Record<string, string | number> = {},
  ): Promise<AntechV6TestGuide> {
    const accessToken: AntechV6AccessToken = await this.authenticate(baseUrl, credentials)

    return await this.get<AntechV6TestGuide>(`${baseUrl}${AntechV6Endpoints.GET_TEST_GUIDE}`, {
      params: {
        accesstoken: accessToken.Token,
        userId: String(accessToken?.UserInfo?.ID),
        pageSize: 2500,
        ...params,
      },
    })
  }

  async placePreOrder(
    baseUrl: string,
    credentials: AntechV6UserCredentials,
    preOrder: AntechV6PreOrder,
  ): Promise<AntechV6PreOrderPlacement & AntechV6AccessToken> {
    try {
      const { Token } = await this.authenticate(baseUrl, credentials)
      const preOrderPlacement = await this.post<AntechV6PreOrderPlacement>(
        `${baseUrl}${AntechV6Endpoints.PLACE_PRE_ORDER}`,
        preOrder,
        {
          headers: {
            'Content-Type': 'application/json',
            accessToken: Token,
          },
        },
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
  ): Promise<AntechV6OrderPlacement & AntechV6AccessToken> {
    try {
      const { Token } = await this.authenticate(baseUrl, credentials)
      const orderPlacement = await this.post<AntechV6OrderPlacement>(
        `${baseUrl}${AntechV6Endpoints.PLACE_ORDER}`,
        order,
        {
          headers: {
            'Content-Type': 'application/json',
            accessToken: Token,
          },
        },
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
  ): Promise<void> {
    await this.doPost(credentials, baseUrl, AntechV6Endpoints.ACKNOWLEDGE_STATUS, {
      serviceType: 'labResult',
      clinicId: credentials.ClinicID,
      labAccessionsIds: [...new Set(labAccessionIds)],
    })
  }

  async acknowledgeOrders(
    baseUrl: string,
    credentials: AntechV6UserCredentials,
    clinicAccessionIds: string[] = [],
  ): Promise<void> {
    await this.doPost(credentials, baseUrl, AntechV6Endpoints.ACKNOWLEDGE_STATUS, {
      serviceType: 'labOrder',
      clinicId: credentials.ClinicID,
      clinicAccessionIds: [...new Set(clinicAccessionIds)],
    })
  }

  async testAuth(baseUrl: string, credentials: AntechV6UserCredentials): Promise<void> {
    try {
      await this.authenticate(baseUrl, credentials)
    } catch (error) {
      throw new AntechV6ApiException('Failed to authenticate', error.status, error)
    }
  }
}
