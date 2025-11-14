import { Test, TestingModule } from '@nestjs/testing'
import { AntechV6ApiService } from './antechV6-api.service'
import { AntechV6ApiHttpService } from './antechV6-api-http.service'
import { AntechV6UserCredentials } from '../interfaces/antechV6-api.interface'
import { RedisCacheService } from '../providers/redis-cache.service'

describe('AntechV6ApiService', () => {
  let service: AntechV6ApiService
  let httpService: AntechV6ApiHttpService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AntechV6ApiService,
        {
          provide: AntechV6ApiHttpService,
          useValue: {
            post: jest.fn(), // Mock the HTTP service
          },
        },
        {
          provide: RedisCacheService,
          useValue: {
            get: jest.fn(),
            set: jest.fn(),
          },
        },
      ],
    }).compile()

    service = module.get<AntechV6ApiService>(AntechV6ApiService)
    httpService = module.get<AntechV6ApiHttpService>(AntechV6ApiHttpService)
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
})
