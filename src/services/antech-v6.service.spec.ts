import { Test } from '@nestjs/testing'
import { AntechV6Service } from './antech-v6.service'
import { NullPayloadPayload } from '@nominal-systems/dmi-engine-common'
import { AntechV6ApiService } from './antech-v6-api.service'

describe('AntechV6Service', () => {
  let service: AntechV6Service
  const metadataMock = {
    integrationOptions: {
      username: 'PIMS_USER',
      password: 'devtest',
      clinicId: '140039',
      labId: '1'
    },
    providerConfiguration: {
      baseUrl: 'https://margaapi-pims.marsvh.com',
      uiBaseUrl: 'https://margaui-pims.marsvh.com'
    }
  }
  const antechV6ApiServiceMock = {
    getOrderStatus: jest.fn()
  }

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        AntechV6Service,
        {
          provide: AntechV6ApiService,
          useValue: antechV6ApiServiceMock
        }
      ]
    }).compile()

    service = module.get<AntechV6Service>(AntechV6Service)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  describe('getBatchOrders()', () => {
    const payloadMock = {
      integrationId: '26740bd3-44ee-47f9-aa6c-466ec702cdb7'
    } as unknown as NullPayloadPayload

    it('should fetch orders', async () => {
      antechV6ApiServiceMock.getOrderStatus.mockResolvedValue({ data: {} })
      await service.getBatchOrders(payloadMock, metadataMock)
    })
  })
})
