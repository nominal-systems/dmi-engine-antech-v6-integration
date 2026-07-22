import { Test, TestingModule } from '@nestjs/testing'
import { CACHE_MANAGER, CacheStore } from '@nestjs/cache-manager'
import { of, throwError } from 'rxjs'
import { AntechV6ApiService } from './antechV6-api.service'
import { AntechV6ApiHttpService } from './antechV6-api-http.service'
import { AntechV6AccessToken, AntechV6UserCredentials } from '../interfaces/antechV6-api.interface'

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
})
