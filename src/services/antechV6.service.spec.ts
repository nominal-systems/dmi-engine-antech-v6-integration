import { Test } from '@nestjs/testing'
import { AntechV6Service } from './antechV6.service'
import {
  CreateOrderPayload,
  FileUtils,
  NullPayloadPayload,
  Order,
  OrderCreatedResponse,
  OrderStatus,
  PimsIdentifiers,
} from '@nominal-systems/dmi-engine-common'
import { AntechV6ApiService } from '../antechV6-api/antechV6-api.service'
import { AntechV6Mapper } from '../providers/antechV6-mapper'
import { AntechV6OrderStatus } from '../interfaces/antechV6-api.interface'

describe('AntechV6Service', () => {
  let service: AntechV6Service
  const metadataMock = {
    integrationOptions: {
      username: 'PIMS_USER',
      password: 'devtest',
      clinicId: '140039',
      labId: '1',
    },
    providerConfiguration: {
      baseUrl: 'https://margaapi-pims.marsvh.com',
      uiBaseUrl: 'https://margaui-pims.marsvh.com',
      PimsIdentifier: 'PIMS',
      IhdMnemonics: [],
    },
  }
  const nullPayloadMock: NullPayloadPayload = null
  const antechV6ApiServiceMock = {
    getOrderStatus: jest.fn(),
    getResultStatus: jest.fn(),
    placePreOrder: jest.fn(),
    placeOrder: jest.fn(),
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
                  speciesExtId: 'CA',
                },
                {
                  id: 602,
                  name: 'Rocky Mountain Goat',
                  breedExtId: 'RMG',
                  speciesExtId: 'CA',
                },
              ],
            },
          ],
        },
      }
    }),
    getOrderTrf: jest.fn(async () => {
      return {
        contentType: 'application/pdf',
        data: 'base64-encoded-pdf-data',
        uri: 'https://example.com/trf.pdf',
      }
    }),
  }

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        AntechV6Service,
        AntechV6Mapper,
        {
          provide: AntechV6ApiService,
          useValue: antechV6ApiServiceMock,
        },
      ],
    }).compile()

    service = module.get<AntechV6Service>(AntechV6Service)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  describe('getBatchOrders()', () => {
    const payloadMock = {
      integrationId: '26740bd3-44ee-47f9-aa6c-466ec702cdb7',
    } as unknown as NullPayloadPayload

    it('should fetch orders', async () => {
      antechV6ApiServiceMock.getOrderStatus.mockResolvedValue({
        LabOrders: [],
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
            OrderStatus: AntechV6OrderStatus.Submitted,
            LabAccessionID: 'IREA00025940',
            LabTests: [
              {
                CodeType: 'U',
                CodeID: 12687,
                Mnemonic: 'SA804',
                DisplayName: 'Chemistry Panel w/SDMA',
                Price: 49.51,
              },
            ],
            AddOnTests: [],
          },
        ],
      })
      antechV6ApiServiceMock.getResultStatus.mockResolvedValue({
        LabResults: [
          {
            ClinicAccessionID: 'SHIUBBT1054',
            LabAccessionID: 'IREA00025940',
            Pet: {
              Id: 'AXAXAXA',
              Name: 'Barbara',
            },
            Client: {
              Id: 'd32f0184-f13a-40a6-816d-a0d3a0cfce69',
              FirstName: 'Trace',
              LastName: 'Bayer',
            },
            Doctor: {
              FirstName: 'Gregorio',
              LastName: 'Christiansen',
            },
            SpeciesID: 41,
            BreedID: 370,
            OrderDate: '2024-03-27T06:42:58',
            CreatedDate: '2024-03-27T00:00:00',
            CodeID: 12687,
            Mnemonic: 'SA804',
            DisplayName: 'Chemistry Panel w/SDMA',
            LabTests: [],
          },
        ],
        LabOrders: [],
      })
      const orders: Order[] = await service.getBatchOrders(payloadMock, metadataMock)
      expect(antechV6ApiServiceMock.getOrderStatus).toHaveBeenCalled()
      expect(antechV6ApiServiceMock.getResultStatus).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Object),
        {
          ClinicAccessionID: 'SHIUBBT1054',
        },
      )
      expect(orders.length).toEqual(1)
      expect(orders[0]).toEqual(
        expect.objectContaining({
          externalId: 'SHIUBBT1054',
          status: OrderStatus.SUBMITTED,
          patient: expect.any(Object),
          client: expect.any(Object),
          veterinarian: expect.any(Object),
          tests: [{ code: 'SA804' }],
          editable: false,
        }),
      )
      expect(orders[0].patient).toEqual({
        name: 'Barbara',
        sex: 'U',
        species: '41',
        breed: '370',
        identifier: [
          {
            system: PimsIdentifiers.PatientID,
            value: 'AXAXAXA',
          },
        ],
      })
      expect(orders[0].client).toEqual({
        firstName: 'Trace',
        lastName: 'Bayer',
        identifier: [
          {
            system: PimsIdentifiers.ClientID,
            value: 'd32f0184-f13a-40a6-816d-a0d3a0cfce69',
          },
        ],
      })
      expect(orders[0].veterinarian).toEqual({
        firstName: 'Gregorio',
        lastName: 'Christiansen',
      })
    })
    it('should accept more than one result per order', async () => {
      antechV6ApiServiceMock.getOrderStatus.mockResolvedValue(
        FileUtils.loadFile('test/api/LabOrders/v6/GetStatus/7152-VOY-44905954790.json'),
      )
      antechV6ApiServiceMock.getResultStatus.mockResolvedValue(
        FileUtils.loadFile('test/api/LabResults/v6/GetStatus/7152-VOY-44905954790.json'),
      )
      const orders: Order[] = await service.getBatchOrders(payloadMock, metadataMock)
      expect(orders.length).toEqual(1)
    })
    it('should fetch order TRF', async () => {
      antechV6ApiServiceMock.getOrderStatus.mockResolvedValue({
        LabOrders: [
          {
            LabTests: [],
          },
        ],
      })
      antechV6ApiServiceMock.getResultStatus.mockResolvedValue({
        LabResults: [],
      })
      const orders: Order[] = await service.getBatchOrders(payloadMock, metadataMock)
      expect(antechV6ApiServiceMock.getOrderTrf).toBeCalled()
      expect(orders.length).toEqual(1)
      expect(orders[0].manifest).toEqual(
        expect.objectContaining({
          contentType: 'application/pdf',
          uri: expect.any(String),
          data: expect.any(String),
        }),
      )
    })
    it('should continue if order TRF request fails', async () => {
      antechV6ApiServiceMock.getOrderStatus.mockResolvedValue({
        LabOrders: [
          {
            ClinicAccessionID: 'ACC123',
            LabTests: [],
          },
        ],
      })
      antechV6ApiServiceMock.getResultStatus.mockResolvedValue({
        LabResults: [],
      })
      antechV6ApiServiceMock.getOrderTrf.mockResolvedValueOnce(undefined as any)
      const orders: Order[] = await service.getBatchOrders(payloadMock, metadataMock)
      expect(antechV6ApiServiceMock.getOrderTrf).toBeCalled()
      expect(orders.length).toEqual(1)
      expect(orders[0].manifest).toBeUndefined()
    })
    it('should continue if order TRF is not returned', async () => {
      antechV6ApiServiceMock.getOrderStatus.mockResolvedValue({
        LabOrders: [
          {
            ClinicAccessionID: 'ACC124',
            LabTests: [],
          },
        ],
      })
      antechV6ApiServiceMock.getResultStatus.mockResolvedValue({
        LabResults: [],
      })
      antechV6ApiServiceMock.getOrderTrf.mockResolvedValueOnce(undefined as any)
      const orders: Order[] = await service.getBatchOrders(payloadMock, metadataMock)
      expect(antechV6ApiServiceMock.getOrderTrf).toBeCalled()
      expect(orders.length).toEqual(1)
      expect(orders[0].manifest).toBeUndefined()
    })
    it('should skip a pending order TRF when mnemonic is configured to be skipped', async () => {
      const metadataWithSkip = {
        ...metadataMock,
        providerConfiguration: {
          ...metadataMock.providerConfiguration,
          IhdMnemonic: ['HHEM-1', 'M130'],
        },
      }
      antechV6ApiServiceMock.getOrderStatus.mockResolvedValue({
        LabOrders: [
          {
            ClinicAccessionID: 'ACC125',
            LabTests: [
              {
                CodeType: 'U',
                CodeID: 13792,
                Mnemonic: 'M130',
                DisplayName: 'Culture, Urine',
                Price: 157.9,
              },
            ],
          },
        ],
      })
      antechV6ApiServiceMock.getResultStatus.mockResolvedValue({
        LabResults: [],
      })
      const orders: Order[] = await service.getBatchOrders(payloadMock, metadataWithSkip)
      expect(antechV6ApiServiceMock.getOrderTrf).not.toHaveBeenCalled()
      expect(orders[0].manifest).toBeUndefined()
    })
    it('should skip a submitted order TRF when mnemonic is configured to be skipped', async () => {
      const metadataWithSkip = {
        ...metadataMock,
        providerConfiguration: {
          ...metadataMock.providerConfiguration,
          IhdMnemonic: ['HHEM-1', 'M130'],
        },
      }
      antechV6ApiServiceMock.getOrderStatus.mockResolvedValue({
        LabOrders: [
          {
            ClinicAccessionID: 'ACC125',
            LabTests: [
              {
                CodeType: 'U',
                CodeID: 13792,
                Mnemonic: 'M130',
                DisplayName: 'Culture, Urine',
                Price: 157.9,
              },
            ],
          },
        ],
      })
      antechV6ApiServiceMock.getResultStatus.mockResolvedValue({
        LabResults: [
          {
            ClinicAccessionID: '44238-VOY-3380574337',
            Pet: {
              Id: '12791019119',
              Name: 'DOLLY',
            },
            Client: {
              Id: 'WEA0A3K',
              FirstName: 'Christina',
              LastName: 'Brown',
            },
            Doctor: {
              Id: '404235',
              FirstName: 'Holly',
              LastName: 'Crawford',
            },
            LabTests: [
              {
                CodeID: 13792,
                Mnemonic: 'M130',
                DisplayName: 'Culture, Urine',
              },
              {
                CodeID: 19191,
                Mnemonic: 'M130A',
                DisplayName: 'FIRSTract Urine Culture',
              },
            ],
          },
        ],
      })
      const orders: Order[] = await service.getBatchOrders(payloadMock, metadataWithSkip)
      expect(antechV6ApiServiceMock.getOrderTrf).not.toHaveBeenCalled()
      expect(orders[0].manifest).toBeUndefined()
    })
  })

  describe('createOrder()', () => {
    const createOrderPayload = {
      requisitionId: 'REQ123',
      client: { id: 'C1', firstName: 'Jane', lastName: 'Doe' },
      veterinarian: { id: 'D1', lastName: 'Doc' },
      patient: {
        id: 'P1',
        name: 'Buddy',
        sex: 'M',
        birthdate: '2018-01-01',
        weightMeasurement: 10,
        weightUnits: 'kg',
        species: '41',
        breed: '370',
      },
      tests: [{ code: 'SA804' }],
    } as unknown as CreateOrderPayload

    it('places a pre-order by default', async () => {
      antechV6ApiServiceMock.placePreOrder.mockResolvedValue({ Value: 'ok', Token: 'tok' })
      const resp: OrderCreatedResponse = await service.createOrder(createOrderPayload, metadataMock)
      expect(antechV6ApiServiceMock.placePreOrder).toHaveBeenCalled()
      expect(antechV6ApiServiceMock.placeOrder).not.toHaveBeenCalled()
      expect(resp).toEqual(
        expect.objectContaining({
          requisitionId: 'REQ123',
          externalId: 'REQ123',
          status: OrderStatus.WAITING_FOR_INPUT,
          submissionUri: expect.any(String),
        }),
      )
    })

    it('places order when autoSubmitOrder is true', async () => {
      antechV6ApiServiceMock.placeOrder.mockResolvedValue({
        payload: 'ok',
        status: 200,
        message: 'success',
        isSuccess: true,
        requestId: 'r1',
        Token: 'tok',
      })
      const resp: OrderCreatedResponse = await service.createOrder(createOrderPayload, {
        ...metadataMock,
        //autoSubmitOrder: true, // Moved to integrationOptions
        integrationOptions: {
          ...metadataMock.integrationOptions,
          autoSubmitOrder: true,
        },
      } as any)

      expect(antechV6ApiServiceMock.placeOrder).toHaveBeenCalled()
      expect(antechV6ApiServiceMock.placePreOrder).not.toHaveBeenCalled()
      expect(resp).toEqual(
        expect.objectContaining({
          requisitionId: 'REQ123',
          externalId: 'REQ123',
          status: OrderStatus.SUBMITTED,
        }),
      )
      // No submission URI on auto-submitted orders
      expect((resp as any).submissionUri).toBeUndefined()
    })
  })

  describe('getSexes()', () => {
    it('should return sex list', async () => {
      expect(await service.getSexes(nullPayloadMock, metadataMock)).toEqual(
        expect.objectContaining({
          items: [
            {
              name: 'MALE',
              code: 'M',
            },
            {
              name: 'FEMALE',
              code: 'F',
            },
            {
              name: 'MALE_CASTRATED',
              code: 'CM',
            },
            {
              name: 'FEMALE_SPRAYED',
              code: 'SF',
            },
            {
              name: 'UNKNOWN',
              code: 'U',
            },
          ],
          hash: expect.any(String),
        }),
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
              code: '13',
            },
          ],
          hash: expect.any(String),
        }),
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
              species: '13',
            },
            {
              code: '602',
              name: 'Rocky Mountain Goat',
              species: '13',
            },
          ],
          hash: expect.any(String),
        }),
      )
    })
  })
})
