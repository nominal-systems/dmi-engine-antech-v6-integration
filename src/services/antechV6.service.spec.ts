import { Test } from '@nestjs/testing'
import { AntechV6Service } from './antechV6.service'
import { NullPayloadPayload, Order, OrderStatus, PimsIdentifiers } from '@nominal-systems/dmi-engine-common'
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
      uiBaseUrl: 'https://margaui-pims.marsvh.com',
      PimsIdentifier: 'PIMS'
    }
  }
  const nullPayloadMock: NullPayloadPayload = null
  const antechV6ApiServiceMock = {
    getOrderStatus: jest.fn(),
    getResultStatus: jest.fn(),
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
      expect(antechV6ApiServiceMock.getOrderStatus).toHaveBeenCalled()
      expect(antechV6ApiServiceMock.getResultStatus).not.toHaveBeenCalled()
      expect(orders).toEqual([])
    })

    it('should map order from order/report status', async () => {
      antechV6ApiServiceMock.getOrderStatus.mockResolvedValue({
        LabResults: [],
        LabOrders: [
          {
            ClinicAccessionID: 'SHIUBBT1054',
            OrderDate: '2024-03-27T06:42:58',
            CreatedDate: '2024-03-27T06:42:58',
            OrderStatus: 7,
            LabAccessionID: 'IREA00025940',
            LabTests: [
              {
                CodeType: 'U',
                CodeID: 12687,
                Mnemonic: 'SA804',
                DisplayName: 'Chemistry Panel w/SDMA',
                Price: 49.51
              }
            ],
            AddOnTests: []
          }
        ]
      })
      antechV6ApiServiceMock.getResultStatus.mockResolvedValue({
        LabResults: [
          {
            ClinicAccessionID: 'SHIUBBT1054',
            LabAccessionID: 'IREA00025940',
            PetID: 'AXAXAXA',
            ClientID: 'd32f0184-f13a-40a6-816d-a0d3a0cfce69',
            DoctorName: 'Christiansen, Gregorio',
            PetName: 'Barbara',
            ClientName: 'Bayer Trace',
            SpeciesID: 41,
            BreedID: 370,
            OrderDate: '2024-03-27T06:42:58',
            CreatedDate: '2024-03-27T00:00:00',
            CodeID: 12687,
            Mnemonic: 'SA804',
            DisplayName: 'Chemistry Panel w/SDMA',
            LabTests: []
          }
        ],
        LabOrders: []
      })
      const orders: Order[] = await service.getBatchOrders(payloadMock, metadataMock)
      expect(antechV6ApiServiceMock.getOrderStatus).toHaveBeenCalled()
      expect(antechV6ApiServiceMock.getResultStatus).toHaveBeenCalledWith(expect.any(String), expect.any(Object), {
        ClinicAccessionID: 'SHIUBBT1054'
      })
      expect(orders.length).toEqual(1)
      expect(orders[0]).toEqual({
        externalId: 'SHIUBBT1054',
        status: OrderStatus.SUBMITTED,
        patient: expect.any(Object),
        client: expect.any(Object),
        veterinarian: expect.any(Object),
        tests: [{ code: 'SA804' }],
        editable: false
      })
      expect(orders[0].patient).toEqual({
        name: 'Barbara',
        sex: 'U',
        species: '41',
        breed: '370',
        identifier: [
          {
            system: PimsIdentifiers.PatientID,
            value: 'AXAXAXA'
          }
        ]
      })
      expect(orders[0].client).toEqual({
        firstName: 'Trace',
        lastName: 'Bayer',
        identifier: [
          {
            system: PimsIdentifiers.ClientID,
            value: 'd32f0184-f13a-40a6-816d-a0d3a0cfce69'
          }
        ]
      })
      expect(orders[0].veterinarian).toEqual({
        firstName: 'Gregorio',
        lastName: 'Christiansen'
      })
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
