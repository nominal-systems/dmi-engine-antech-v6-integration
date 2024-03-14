import { AntechV6Mapper } from './antechV6-mapper'
import { Test } from '@nestjs/testing'
import { CreateOrderPayload } from '@nominal-systems/dmi-engine-common'
import { AntechV6PetSex, AntechV6PreOrder } from '../interfaces/antechV6-api.interface'

describe('AntechV6Mapper', () => {
  let mapper: AntechV6Mapper
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

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [AntechV6Mapper]
    }).compile()

    mapper = module.get<AntechV6Mapper>(AntechV6Mapper)
  })

  it('should be defined', () => {
    expect(mapper).toBeDefined()
  })

  describe('mapCreateOrderPayload()', () => {
    const payload = {
      requisitionId: 'VCHOSJW1',
      integrationId: '26740bd3-44ee-47f9-aa6c-466ec702cdb7',
      patient: {
        name: 'Gilbert',
        identifier: [
          {
            id: 703,
            system: 'pims:patient:id',
            value: 'GILBERT'
          }
        ],
        species: '36c3cde0-bd6b-11eb-9610-302432eba3e9',
        breed: '1ddc1bc2-d7ed-11ea-aee5-302432eba3ec',
        sex: 'MALE',
        birthdate: null,
        weightMeasurement: null,
        weightUnits: null,
        id: '192931a6-4067-4019-8d94-612c1e08b51a'
      },
      client: {
        id: '80ea84f3-86cf-4b56-a6be-2ff6c50d7274',
        firstName: 'Marcellus',
        lastName: 'Kerluke',
        isStaff: false
      },
      veterinarian: {
        id: '672b294e-9a57-49ba-8504-642965827981',
        firstName: 'Neva',
        lastName: 'Klein',
        identifier: [
          {
            id: 902,
            system: 'pims:veterinarian:id',
            value: '99'
          }
        ]
      },
      status: 'ACCEPTED',
      tests: [
        {
          code: 'SA804'
        },
        {
          code: 'CAC655S'
        }
      ],
      externalId: null,
      submissionUri: null,
      devices: null,
      technician: null,
      notes: null,
      labRequisitionInfo: null,
      id: '8fce8113-4ab4-4f4c-b80a-b4ebd00e49a9',
      editable: false,
      createdAt: '2024-03-13T15:51:39.607Z',
      updatedAt: '2024-03-13T15:51:39.607Z'
    } as unknown as CreateOrderPayload

    it('should map the payload to an Antech PreOrder', () => {
      const expected: AntechV6PreOrder = {
        LabID: 1,
        ClinicID: '140039',
        ClinicAccessionID: 'VCHOSJW1',
        ClientID: '80ea84f3-86cf-4b56-a6be-2ff6c50d7274',
        ClientFirstName: 'Marcellus',
        ClientLastName: 'Kerluke',
        DoctorID: '99',
        DoctorFirstName: 'Neva',
        DoctorLastName: 'Klein',
        PetID: 'GILBERT',
        PetName: 'Gilbert',
        PetSex: AntechV6PetSex.UNKNOWN,
        PetAge: 1,
        PetAgeUnits: 'Y',
        SpeciesID: 41,
        BreedID: 370,
        OrderCodes: ['SA804', 'CAC655S']
      }
      expect(mapper.mapCreateOrderPayload(payload, metadataMock)).toEqual(expected)
    })
  })
})
