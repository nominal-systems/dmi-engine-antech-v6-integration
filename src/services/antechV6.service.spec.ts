import { Test } from '@nestjs/testing'
import { AntechV6Service } from './antechV6.service'
import { NullPayloadPayload, Order } from '@nominal-systems/dmi-engine-common'
import { AntechV6ApiService } from './antechV6-api.service'
import { AntechV6Mapper } from '../providers/antechV6-mapper'

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
  const nullPayloadMock: NullPayloadPayload = null
  const antechV6ApiServiceMock = {
    getOrderStatus: jest.fn(),
    getSpeciesAndBreeds: jest.fn(() => {
      return {
        value: {
          data: [
            {
              id: 13,
              name: 'Caprine',
              breed: [
                {
                  id: 348,
                  name: 'Goat',
                  breedExtId: 'G',
                  speciesExtId: 'CA'
                },
                {
                  id: 602,
                  name: 'Rocky Mountain Goat',
                  breedExtId: 'RMG',
                  speciesExtId: 'CA'
                }
              ]
            }
          ]
        }
      }
    })
  }

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        AntechV6Service,
        AntechV6Mapper,
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
      antechV6ApiServiceMock.getOrderStatus.mockResolvedValue({
        LabOrders: []
      })
      const orders: Order[] = await service.getBatchOrders(payloadMock, metadataMock)
      expect(orders).toEqual([])
    })
  })

  describe('getSexes()', () => {
    it('should return sex list', async () => {
      expect(await service.getSexes(nullPayloadMock, metadataMock)).toEqual(
        expect.objectContaining({
          items: [
            {
              name: 'MALE',
              code: 'M'
            },
            {
              name: 'FEMALE',
              code: 'F'
            },
            {
              name: 'MALE_CASTRATED',
              code: 'CM'
            },
            {
              name: 'FEMALE_SPRAYED',
              code: 'SF'
            },
            {
              name: 'UNKNOWN',
              code: 'U'
            }
          ],
          hash: expect.any(String)
        })
      )
    })
  })

  describe('getSpecies()', () => {
    it('should return species list', async () => {
      expect(await service.getSpecies(nullPayloadMock, metadataMock)).toEqual(
        expect.objectContaining({
          items: [
            {
              name: 'Caprine',
              code: '13'
            }
          ],
          hash: expect.any(String)
        })
      )
    })
  })

  describe('getBreeds()', () => {
    it('should return species list', async () => {
      expect(await service.getBreeds(nullPayloadMock, metadataMock)).toEqual(
        expect.objectContaining({
          items: [
            {
              code: '348',
              name: 'Goat',
              species: '13'
            },
            {
              code: '602',
              name: 'Rocky Mountain Goat',
              species: '13'
            }
          ],
          hash: expect.any(String)
        })
      )
    })
  })
})
