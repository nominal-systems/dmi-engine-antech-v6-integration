import { Test, TestingModule } from '@nestjs/testing'
import { CACHE_MANAGER, CacheStore } from '@nestjs/cache-manager'
import { HttpException } from '@nestjs/common'
import { of, throwError } from 'rxjs'
import { AntechV6ApiService } from './antechV6-api.service'
import { AntechV6ApiHttpService } from './antechV6-api-http.service'
import {
  AntechV6AccessToken,
  AntechV6Endpoints,
  AntechV6UserCredentials,
} from '../interfaces/antechV6-api.interface'

describe('AntechV6ApiService', () => {
  let service: AntechV6ApiService
  let httpService: AntechV6ApiHttpService
  let cacheManager: CacheStore

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AntechV6ApiService,
        {
          provide: CACHE_MANAGER,
          useValue: {
            get: jest.fn(),
            set: jest.fn(),
          },
        },
        {
          provide: AntechV6ApiHttpService,
          useValue: {
            get: jest.fn(),
            post: jest.fn(), // Mock the HTTP service
          },
        },
      ],
    }).compile()

    service = module.get<AntechV6ApiService>(AntechV6ApiService)
    httpService = module.get<AntechV6ApiHttpService>(AntechV6ApiHttpService)
    cacheManager = module.get<CacheStore>(CACHE_MANAGER)
  })

  it('should remove duplicate clinicAccessionIds before calling acknowledgeResults', async () => {
    const mockCredentials = { ClinicID: '12345' } as unknown as AntechV6UserCredentials
    const duplicateAccessionIds = ['A1', 'A2', 'A1', 'A3', 'A2']
    const uniqueAccessionIds = ['A1', 'A2', 'A3']

    jest.spyOn(service as any, 'doPost').mockResolvedValue(undefined)

    await service.acknowledgeResults(
      'https://api.antechv6.com',
      mockCredentials,
      duplicateAccessionIds,
    )

    expect(service['doPost']).toHaveBeenCalledWith(
      mockCredentials,
      'https://api.antechv6.com',
      expect.any(String), // AntechV6Endpoints.ACKNOWLEDGE_STATUS
      {
        serviceType: 'labResult',
        clinicId: '12345',
        labAccessionsIds: uniqueAccessionIds,
      },
    )
  })

  it('should remove duplicate clinicAccessionIds before calling acknowledgeOrders', async () => {
    const mockCredentials = { ClinicID: '12345' } as unknown as AntechV6UserCredentials
    const duplicateAccessionIds = ['A1', 'A2', 'A1', 'A3', 'A2']
    const uniqueAccessionIds = ['A1', 'A2', 'A3']

    jest.spyOn(service as any, 'doPost').mockResolvedValue(undefined)

    await service.acknowledgeOrders(
      'https://api.antechv6.com',
      mockCredentials,
      duplicateAccessionIds,
    )

    expect(service['doPost']).toHaveBeenCalledWith(
      mockCredentials,
      'https://api.antechv6.com',
      expect.any(String), // AntechV6Endpoints.ACKNOWLEDGE_STATUS
      {
        serviceType: 'labOrder',
        clinicId: '12345',
        clinicAccessionIds: uniqueAccessionIds,
      },
    )
  })

  describe('authenticate (token caching)', () => {
    const baseUrl = 'https://api.antechv6.com'
    const credentials: AntechV6UserCredentials = {
      UserName: 'PIMS_USER',
      Password: 'devtest',
      ClinicID: '140138',
    }
    const cacheKey = `access_token-${credentials.UserName}-${credentials.ClinicID}`
    const tokenMock: AntechV6AccessToken = { Token: 'mockAccessToken', UserInfo: { ID: 123 } }
    const TOKEN_TTL_MS = 12 * 60 * 60 * 1000

    const httpPostMock = (data: any) =>
      of({ data, headers: {}, config: { url: '', headers: {} }, status: 200, statusText: 'OK' })

    it('should use a token from the cache if available', async () => {
      jest.spyOn(cacheManager as any, 'get').mockResolvedValue(tokenMock as any)

      const token = await (service as any).authenticate(baseUrl, credentials)

      expect(cacheManager.get).toHaveBeenCalledWith(cacheKey)
      expect(httpService.post).not.toHaveBeenCalled()
      expect(cacheManager.set).not.toHaveBeenCalled()
      expect(token).toEqual(tokenMock)
    })

    it('should fetch a new token if not in cache and cache it for 12h', async () => {
      jest.spyOn(cacheManager as any, 'get').mockResolvedValue(undefined as any)
      jest.spyOn(httpService, 'post').mockReturnValue(httpPostMock(tokenMock) as any)

      const token = await (service as any).authenticate(baseUrl, credentials)

      expect(cacheManager.get).toHaveBeenCalledWith(cacheKey)
      expect(httpService.post).toHaveBeenCalled()
      expect(cacheManager.set).toHaveBeenCalledWith(cacheKey, tokenMock, TOKEN_TTL_MS)
      expect(token).toEqual(tokenMock)
    })

    it('should fetch a new token, bypassing the cache, when useCache is false', async () => {
      jest.spyOn(httpService, 'post').mockReturnValue(httpPostMock(tokenMock) as any)

      const token = await (service as any).authenticate(baseUrl, credentials, false)

      expect(cacheManager.get).not.toHaveBeenCalled()
      expect(httpService.post).toHaveBeenCalled()
      expect(cacheManager.set).not.toHaveBeenCalled()
      expect(token).toEqual(tokenMock)
    })

    it('should throw an error if the auth request fails', async () => {
      jest.spyOn(cacheManager as any, 'get').mockResolvedValue(undefined as any)
      jest.spyOn(httpService, 'post').mockReturnValue(throwError(() => new Error('boom')) as any)

      await expect((service as any).authenticate(baseUrl, credentials)).rejects.toThrow()
    })
  })

  describe('401 re-authentication', () => {
    const baseUrl = 'https://api.antechv6.com'
    const credentials: AntechV6UserCredentials = {
      UserName: 'PIMS_USER',
      Password: 'devtest',
      ClinicID: '140138',
    }
    const cacheKey = `access_token-${credentials.UserName}-${credentials.ClinicID}`
    const TOKEN_TTL_MS = 12 * 60 * 60 * 1000
    const staleToken: AntechV6AccessToken = { Token: 'staleToken', UserInfo: { ID: 123 } }
    const freshToken: AntechV6AccessToken = { Token: 'freshToken', UserInfo: { ID: 123 } }
    const unauthorized = (): HttpException => new HttpException('Unauthorized', 401)

    beforeEach(() => {
      // A stale token is already cached, so the first attempt uses it.
      jest.spyOn(cacheManager as any, 'get').mockResolvedValue(staleToken as any)
      // Re-login (a POST to LOGIN) yields the fresh token.
      jest.spyOn(service as any, 'post').mockResolvedValue(freshToken as any)
    })

    it('re-authenticates and retries once when a GET returns 401, updating the cache', async () => {
      const getSpy = jest
        .spyOn(service as any, 'get')
        .mockRejectedValueOnce(unauthorized())
        .mockResolvedValueOnce({ id: 'result' } as any)

      const result = await service.getResultStatus(baseUrl, credentials)

      expect(result).toEqual({ id: 'result' })
      // Re-login happened against the LOGIN endpoint and the cache was refreshed
      expect(service['post']).toHaveBeenCalledWith(
        `${baseUrl}${AntechV6Endpoints.LOGIN}`,
        credentials,
      )
      expect(cacheManager.set).toHaveBeenCalledWith(cacheKey, freshToken, TOKEN_TTL_MS)
      // The request ran twice: once with the stale token, once with the fresh one
      expect(getSpy).toHaveBeenCalledTimes(2)
      expect(getSpy.mock.calls[1][1]).toMatchObject({ headers: { accessToken: freshToken.Token } })
    })

    it('does not re-authenticate on a non-401 error', async () => {
      jest.spyOn(service as any, 'get').mockRejectedValue(new HttpException('Server error', 500))

      await expect(service.getResultStatus(baseUrl, credentials)).rejects.toThrow()

      expect(service['post']).not.toHaveBeenCalled()
      expect(cacheManager.set).not.toHaveBeenCalled()
      expect(service['get']).toHaveBeenCalledTimes(1)
    })

    it('does not re-authenticate when the request succeeds', async () => {
      jest.spyOn(service as any, 'get').mockResolvedValue({ id: 'result' } as any)

      await service.getResultStatus(baseUrl, credentials)

      expect(service['post']).not.toHaveBeenCalled()
      expect(service['get']).toHaveBeenCalledTimes(1)
    })

    it('propagates the error when the retried request also returns 401', async () => {
      const getSpy = jest.spyOn(service as any, 'get').mockRejectedValue(unauthorized())

      await expect(service.getResultStatus(baseUrl, credentials)).rejects.toThrow(HttpException)

      expect(getSpy).toHaveBeenCalledTimes(2)
      expect(service['post']).toHaveBeenCalledTimes(1)
    })

    it('re-authenticates and retries order placement on 401', async () => {
      const orderPlacement = { OrderId: 'order-1' }
      let placeCalls = 0
      jest.spyOn(service as any, 'post').mockImplementation(async (...args: any[]) => {
        const url = args[0] as string
        if (url.endsWith(AntechV6Endpoints.LOGIN)) {
          return freshToken
        }
        placeCalls++
        if (placeCalls === 1) {
          throw unauthorized()
        }
        return orderPlacement
      })

      const result = await service.placeOrder(baseUrl, credentials, {} as any)

      expect(result).toEqual({ ...orderPlacement, Token: freshToken.Token })
      expect(cacheManager.set).toHaveBeenCalledWith(cacheKey, freshToken, TOKEN_TTL_MS)
      expect(placeCalls).toBe(2)
    })
  })
})
