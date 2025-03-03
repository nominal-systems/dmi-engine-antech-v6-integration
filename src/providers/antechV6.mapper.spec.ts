import { AntechV6Mapper } from './antechV6-mapper'
import { Test } from '@nestjs/testing'
import {
  CreateOrderPayload,
  FileUtils,
  ReferenceRangeType,
  Result,
  ResultStatus,
  TestResultItem,
  TestResultItemInterpretationCode
} from '@nominal-systems/dmi-engine-common'
import {
  AntechV6AbnormalFlag,
  AntechV6LabResultStatus,
  AntechV6OrderStatus,
  AntechV6PetSex,
  AntechV6PreOrder,
  AntechV6Result,
  AntechV6TestGuide,
  AntechV6UnitCodeResult
} from '../interfaces/antechV6-api.interface'
import { ServiceType, TestResult } from '@nominal-systems/dmi-engine-common/lib/interfaces/provider-service'
import * as path from 'path'
import { DEFAULT_PET_SPECIES } from '../constants/default-pet-species'
import { TEST_RESULT_SEQUENCING_MAP } from '../constants/test-result-sequencing-map.constant'

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
      uiBaseUrl: 'https://margaui-pims.marsvh.com',
      PimsIdentifier: 'PIMS'
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
        SpeciesID: DEFAULT_PET_SPECIES,
        BreedID: 370,
        OrderCodes: ['SA804', 'CAC655S']
      }
      expect(mapper.mapCreateOrderPayload(payload, metadataMock)).toEqual(expected)
    })
  })

  describe('extractClient()', () => {
    it('should extract ClientName and truncate if its too long', () => {
      const clientPayload = {
        id: '80ea84f3-86cf-4b56-a6be-2ff6c50d7274',
        firstName: 'Ashkan',
        lastName: 'EktesabiKhajooeikermani',
        isStaff: false
      }

      const result = (mapper as any).extractClient(clientPayload)
      expect(result).toEqual({
        ClientID: '80ea84f3-86cf-4b56-a6be-2ff6c50d7274',
        ClientFirstName: 'Ashkan',
        ClientLastName: 'EktesabiKhajooeikerm'
      })
    })
  })

  describe('mapAntechV6TestGuide()', () => {
    const testGuide: AntechV6TestGuide = {
      TotalCount: 1086,
      LabResults: [
        {
          CodeID: '11629',
          ExtensionID: '550002',
          Description: 'Accuplex',
          MnemonicType: 'U',
          Alias: 'ACCUPLEX',
          Category: 'Infectious',
          ClientFacingDescription:
            'This is a canine vector-borne disease screening test for Heartworm (Ag), Lyme disease (includes screening for antibodies against two C6 peptides), E. canis, and A. phagocytophilum.',
          StiboMnemonics: 'AC100\nCAC100\nAVR50721\nAX\nIDX72440\nIDX72441\nAVR11081',
          Code: 'AC100',
          ReportingTitle: 'Accuplex',
          Schedule: '1-2 days',
          LabID: 1,
          SDFlag: 'Y',
          AOLFlag: 'Y',
          Price: 23.61,
          IdexxCode: '2889',
          FavoriteMnemonic: '',
          FavDisplayName: '',
          FavCustomID: 0,
          OrderCount: 0,
          ClinicID: '140039',
          Container: '',
          Specimen: '0.5 mL serum in red top or serum separator tube',
          SubTestCodeIDList: '6715,6718,6724,6727,6733,6784,6787,6790',
          SubTestCodeExtIDList: '5801,5802,5804,5805,5807,5832,5833,5834',
          SubTestCodeList:
            'Heartworm,Borrelia burgdorferi,E. Canis,Anaplasma phagocytophilum,Internal Use Only (HW Class),Instrument ID,BioCD Disc Type,BioCD Disc ID',
          Status: 'Active',
          HTEnabled: 'Y',
          POC_Mnemonic: '',
          AnalyzerID: '',
          Common: 'Y',
          POC_Flag: 'N',
          AcceptableSpecies: 'Canine',
          PreferredSpecimenRequirements: 'Serum',
          AcceptableSpecimenRequirements: 'EDTA plasma',
          RetentionStability: '7 days',
          SpecimenDefinition:
            'GV, GVG, L, LV, P, PO, R, RV, S, SS, SV, UNL, UNLV, UNR, UNRV, UNS, UNSS, UNW, UNYV, V, W, YV',
          POC_Id: ''
        },
        {
          CodeID: '52439',
          ExtensionID: '533555',
          Description: 'Adult Chem Lytes,CBC,O&P,Accuplex,SDMA',
          MnemonicType: 'P',
          Alias: '',
          Category: 'CBC Chemistry Profiles',
          ClientFacingDescription:
            'Wellness chemistry with electrolytes, SDMA for glomerular filtration rate estimation (see T1035), complete blood count, Accuplex for vector-borne disease screening (see AC100), and fecal analysis using zinc sulfate with centrifugation/flotation for ova and parasite detection (T805).',
          StiboMnemonics: 'AC535S',
          Code: 'AC535S',
          ReportingTitle: 'Adult Chem Lytes,CBC,O&P,Accuplex,SDMA',
          Schedule: '1-2 days',
          LabID: 1,
          SDFlag: 'Y',
          AOLFlag: 'Y',
          Price: 105.67,
          IdexxCode: '',
          FavoriteMnemonic: '',
          FavDisplayName: '',
          FavCustomID: 0,
          OrderCount: 0,
          ClinicID: '140039',
          Container: '',
          Specimen: '1.0 mL serum, 1.0 mL whole blood, and 5.0 grams feces',
          SubTestCodeIDList: '11629,12171,12288,12892,18926',
          SubTestCodeExtIDList: '502334,502840,503075,540086,550002',
          SubTestCodeList: 'AC100,SA665LYT,T1035,T330,T805',
          Status: 'Active',
          HTEnabled: '',
          POC_Mnemonic: '',
          AnalyzerID: '',
          Common: 'N',
          POC_Flag: 'N',
          AcceptableSpecies: '',
          PreferredSpecimenRequirements: '',
          AcceptableSpecimenRequirements: '',
          RetentionStability: '',
          SpecimenDefinition: '',
          POC_Id: ''
        }
      ]
    }

    it('should map the test guide to a Service list', () => {
      expect(mapper.mapAntechV6TestGuide(testGuide)).toEqual([
        {
          code: 'AC100',
          name: 'Accuplex',
          description:
            'This is a canine vector-borne disease screening test for Heartworm (Ag), Lyme disease (includes screening for antibodies against two C6 peptides), E. canis, and A. phagocytophilum.',
          category: 'Infectious',
          type: ServiceType.IN_HOUSE,
          price: 23.61,
          currency: 'USD'
        },
        {
          code: 'AC535S',
          name: 'Adult Chem Lytes,CBC,O&P,Accuplex,SDMA',
          description:
            'Wellness chemistry with electrolytes, SDMA for glomerular filtration rate estimation (see T1035), complete blood count, Accuplex for vector-borne disease screening (see AC100), and fecal analysis using zinc sulfate with centrifugation/flotation for ova and parasite detection (T805).',
          category: 'CBC Chemistry Profiles',
          type: ServiceType.IN_HOUSE,
          price: 105.67,
          currency: 'USD'
        }
      ])
    })
  })

  describe('mapAntechV6Result()', () => {
    const allResultsResponse: any = FileUtils.loadFile(
      path.join(__dirname, '..', '..', 'test/api/LabResults/v6/GetAllResults/get-all-results_01.json')
    )

    it('should map Antech results to DMI results', () => {
      const antechV6Result: AntechV6Result = allResultsResponse[0]
      const result: Result = mapper.mapAntechV6Result(antechV6Result)
      expect(result).toEqual(
        expect.objectContaining({
          id: '279396659',
          orderId: '140039-ABC1708966466',
          accession: 'IREA00016889',
          status: ResultStatus.COMPLETED,
          testResults: expect.any(Array<TestResult>)
        })
      )
      expect(result.testResults.length).toBeGreaterThan(0)
    })

    it('should map orphan results', () => {
      const orphanResult: AntechV6Result = {
        ID: 1324,
        LabAccessionID: 'XXXXX',
        ClinicAccessionID: '',
        OrderStatus: AntechV6OrderStatus.Final,
        UnitCodeResults: [],
        Pet: {
          Id: '',
          Name: 'Bruce'
        },
        Client: {
          Id: '',
          FirstName: '',
          LastName: ''
        },
        Doctor: {
          Id: '',
          FirstName: 'Not Stated'
        }
      }
      const result: Result = mapper.mapAntechV6Result(orphanResult)
      expect(result).toHaveProperty('order')
      expect(result.order).toEqual(
        expect.objectContaining({
          externalId: 'XXXXX',
          status: 'COMPLETED',
          patient: expect.any(Object),
          client: expect.any(Object),
          veterinarian: expect.any(Object)
        })
      )
    })

    it('should parse Doctor names correctly', () => {
      const orphanResult: AntechV6Result = {
        ID: 1324,
        LabAccessionID: 'XXXXX',
        ClinicAccessionID: '',
        OrderStatus: AntechV6OrderStatus.Final,
        UnitCodeResults: [],
        Pet: {
          Id: '',
          Name: 'Bruce'
        },
        Client: {
          Id: '',
          FirstName: '',
          LastName: ''
        },
        Doctor: {
          Id: '',
          LastName: 'Doe',
          FirstName: 'John'
        }
      }
      const result: Result = mapper.mapAntechV6Result(orphanResult)
      expect(result).toHaveProperty('order')
      expect(result.order).toEqual(
        expect.objectContaining({
          veterinarian: {
            firstName: 'John',
            lastName: 'Doe'
          }
        })
      )
    })
  })

  describe('mapAntechV6UnitCodeResult()', () => {
    const allResultsResponse: any = FileUtils.loadFile(
      path.join(__dirname, '..', '..', 'test/api/LabResults/v6/GetAllResults/get-all-results_01.json')
    )

    const allResultsResponseNew: any = FileUtils.loadFile(
      path.join(__dirname, '..', '..', 'test/api/LabResults/v6/GetAllResults/get-all-results_03.json')
    )

    const cbcResultsResponse: any = FileUtils.loadFile(
      path.join(__dirname, '..', '..', 'test/api/LabResults/v6/GetAllResults/get-all-results_cbc.json')
    )

    const tyroidResultsResponse_1: any = FileUtils.loadFile(
      path.join(__dirname, '..', '..', 'test/api/LabResults/v6/TyroidProfile/get-all-results_tyroid_1.json')
    )

    const tyroidResultsResponse_2: any = FileUtils.loadFile(
      path.join(__dirname, '..', '..', 'test/api/LabResults/v6/TyroidProfile/get-all-results_tyroid_2.json')
    )

    it('should map Antech order code results to DMI test results', () => {
      const unitCodeResult: AntechV6UnitCodeResult = allResultsResponseNew[0].UnitCodeResults[0]
      const testResult: TestResult = mapper.mapAntechV6UnitCodeResult(unitCodeResult, 0)
      expect(testResult).toEqual({
        seq: 0,
        code: 'BANT805',
        name: 'Banfield Ova and Parasite',
        items: expect.any(Array<TestResultItem>)
      })
      expect(testResult.items.length).toBeGreaterThan(0)
    })

    it('should map Antech unit code to DMI test results when they come without order code', () => {
      const unitCodeResult: AntechV6UnitCodeResult = allResultsResponse[0].UnitCodeResults[0]
      const testResult: TestResult = mapper.mapAntechV6UnitCodeResult(unitCodeResult, 0)
      expect(testResult).toEqual({
        seq: 0,
        code: '502020',
        name: 'Alkaline Phosphatase',
        items: expect.any(Array<TestResultItem>)
      })
    })

    it('should sort unit code results in the order they are received', () => {
      for (const resultResponse of allResultsResponse) {
        for (const unitCodeResult of resultResponse.UnitCodeResults) {
          const testResult: TestResult = mapper.mapAntechV6UnitCodeResult(unitCodeResult, 0)
          expect(testResult.items).toHaveLength(unitCodeResult.TestCodeResults.length)
          for (const [idx, item] of testResult.items.entries()) {
            const indexInResponse = unitCodeResult.TestCodeResults.findIndex((r) => r.TestCodeExtID === item.code)
            expect(item.seq).toBe(indexInResponse)
            expect(idx).toBe(indexInResponse)
          }
        }
      }
    })

    it('should sort Heska CBC unit code results in a specific order', () => {
      for (const resultResponse of cbcResultsResponse) {
        for (const unitCodeResult of resultResponse.UnitCodeResults) {
          const testResult: TestResult = mapper.mapAntechV6UnitCodeResult(unitCodeResult, 0)
          expect(testResult.items).toHaveLength(unitCodeResult.TestCodeResults.length)
          for (const [idx, item] of testResult.items.entries()) {
            const indexInResponse = TEST_RESULT_SEQUENCING_MAP[unitCodeResult.OrderCode].indexOf(item.name)
            expect(item.seq).toBe(indexInResponse)
            expect(idx).toBe(indexInResponse)
          }
        }
      }
    })

    it('should correctly map Tyroid Profile results items when first received', () => {
      const tyroidProfileResult: AntechV6Result = tyroidResultsResponse_1[0]
      const result: Result = mapper.mapAntechV6Result(tyroidProfileResult)
      expect(result).toEqual(
        expect.objectContaining({
          id: '305580024',
          orderId: '7092-VOY-37157652213',
          accession: 'DLEA00533798',
          status: ResultStatus.PARTIAL,
          testResults: expect.any(Array<TestResult>)
        })
      )
      expect(result.testResults.length).toBe(4)
      expect(result.testResults[0]).toEqual({
        seq: 0,
        code: 'SA380',
        name: '',
        items: expect.any(Array<TestResultItem>)
      })
      expect(result.testResults[1]).toEqual({
        seq: 1,
        code: 'SA380',
        name: 'TSH',
        items: expect.any(Array<TestResultItem>)
      })
      expect(result.testResults[2]).toEqual({
        seq: 2,
        code: 'SA380',
        name: 'Free T4 By Equilibrium Dialysis',
        items: expect.any(Array<TestResultItem>)
      })
      expect(result.testResults[3]).toEqual({
        seq: 3,
        code: 'SA380',
        name: 'T4',
        items: expect.any(Array<TestResultItem>)
      })
    })

    it('should correctly map Tyroid Profile results items when received for the second time', () => {
      const tyroidProfileResult: AntechV6Result = tyroidResultsResponse_2[0]
      const result: Result = mapper.mapAntechV6Result(tyroidProfileResult)
      expect(result).toEqual(
        expect.objectContaining({
          id: '305580024',
          orderId: '7092-VOY-37157652213',
          accession: 'DLEA00533798',
          status: ResultStatus.PARTIAL,
          testResults: expect.any(Array<TestResult>)
        })
      )
      expect(result.testResults.length).toBe(4)
      expect(result.testResults[0]).toEqual({
        seq: 0,
        code: 'SA380',
        name: '',
        items: []
      })
      expect(result.testResults[1]).toEqual({
        seq: 1,
        code: 'SA380',
        name: 'TSH',
        items: expect.arrayContaining([
          expect.objectContaining({
            code: '4001',
            name: 'TSH',
            status: 'DONE',
            seq: 0
          })
        ])
      })
      expect(result.testResults[2]).toEqual({
        seq: 2,
        code: 'SA380',
        name: 'Free T4 By Equilibrium Dialysis',
        items: []
      })
      expect(result.testResults[3]).toEqual({
        seq: 3,
        code: 'SA380',
        name: 'T4',
        items: []
      })
    })
  })
  describe('mapAntechV6TestCodeResult()', () => {
    it('should map numeric test code results', () => {
      const testCodeResult = {
        TestCodeID: '1533',
        TestCodeResultID: '7533583972',
        Result: '3.3',
        Range: '2.5-3.9',
        TestCodeExtID: '1016',
        Test: 'ALBUMIN',
        Unit: 'g/dL',
        Min: '0',
        Max: '8',
        UnitCodeID: '800599069',
        ReportComments: []
      }
      expect(mapper.mapAntechV6TestCodeResult(testCodeResult, 0)).toEqual({
        seq: 0,
        code: '1016',
        name: 'ALBUMIN',
        status: 'DONE',
        valueQuantity: {
          value: 3.3,
          units: 'g/dL'
        },
        referenceRange: [
          {
            type: ReferenceRangeType.NORMAL,
            text: '2.5-3.9',
            low: 2.5,
            high: 3.9
          }
        ]
      })
    })
    it('should map numeric test code results with abnormal flags', () => {
      const testCodeResult = {
        TestCodeID: '1524',
        TestCodeResultID: '7533583981',
        AbnormalFlag: AntechV6AbnormalFlag.HIGH,
        Result: '128',
        Range: '6-102',
        TestCodeExtID: '1010',
        Test: 'Alk Phosphatase',
        Unit: 'IU/L',
        Min: '2',
        Max: '1000',
        UnitCodeID: '800599071',
        ReportComments: []
      }
      expect(mapper.mapAntechV6TestCodeResult(testCodeResult, 0)).toEqual({
        seq: 0,
        code: '1010',
        name: 'Alk Phosphatase',
        status: 'DONE',
        valueQuantity: {
          value: 128,
          units: 'IU/L'
        },
        interpretation: {
          code: TestResultItemInterpretationCode.HIGH,
          text: 'H'
        },
        referenceRange: [
          {
            type: ReferenceRangeType.NORMAL,
            text: '6-102',
            low: 6,
            high: 102
          }
        ]
      })
    })
    it('should map non-numeric test code results', () => {
      const testCodeResult = {
        TestCodeID: '17206',
        TestCodeResultID: '7533583970',
        AbnormalFlag: AntechV6AbnormalFlag.POSITIVE,
        Result: 'POSITIVE',
        TestCodeExtID: '9981',
        Test: 'Renal Tech Prediction',
        Comments:
          "This patient's RenalTech status indicates that it will develop chronic\nkidney disease within the next 24 months with greater than 95%\naccuracy.\n \nSuggested Follow-Up:\nWithin the next 3 months, and every 3-6 months thereafter, perform a\ncomplete evaluation of kidney function to evaluate the patient's\nprogression toward developing chronic kidney disease. It is\nrecommended that a minimum database including a chemistry panel, CBC,\nand urinalysis are performed.\n \nAdditional diagnostic testing and imaging should also be considered to\ninvestigate for comorbidities and underlying conditions that may\ncontribute to the development of chronic kidney disease, including\nhyperthyroidism, diabetes mellitus, cardiomyopathy, and systemic\nhypertension.\n \nThe International Renal Interest Society (IRIS) has guidelines for the\ndiagnosis, staging, and treatment of chronic kidney disease.\n \nVisit the website http://iris-kidney.com/ for more details.\n \nFor more information, please see: https://antechdiagnostics.com/RenalT\nech",
        UnitCodeID: '800599067',
        ReportComments: []
      }
      expect(mapper.mapAntechV6TestCodeResult(testCodeResult, 0)).toEqual({
        seq: 0,
        code: '9981',
        name: 'Renal Tech Prediction',
        status: 'DONE',
        valueString: 'POSITIVE',
        interpretation: {
          code: TestResultItemInterpretationCode.POSITIVE,
          text: 'P'
        },
        notes:
          "This patient's RenalTech status indicates that it will develop chronic\nkidney disease within the next 24 months with greater than 95%\naccuracy.\n \nSuggested Follow-Up:\nWithin the next 3 months, and every 3-6 months thereafter, perform a\ncomplete evaluation of kidney function to evaluate the patient's\nprogression toward developing chronic kidney disease. It is\nrecommended that a minimum database including a chemistry panel, CBC,\nand urinalysis are performed.\n \nAdditional diagnostic testing and imaging should also be considered to\ninvestigate for comorbidities and underlying conditions that may\ncontribute to the development of chronic kidney disease, including\nhyperthyroidism, diabetes mellitus, cardiomyopathy, and systemic\nhypertension.\n \nThe International Renal Interest Society (IRIS) has guidelines for the\ndiagnosis, staging, and treatment of chronic kidney disease.\n \nVisit the website http://iris-kidney.com/ for more details.\n \nFor more information, please see: https://antechdiagnostics.com/RenalT\nech"
      })
    })
    it('should map non-finite reference ranges', () => {
      const testCodeResult = {
        TestCodeID: '17733',
        TestCodeResultID: '7533583926',
        Result: '13.8',
        Range: '<15.0',
        TestCodeExtID: '3575',
        Test: 'SDMA',
        Unit: 'UG/dL',
        UnitCodeID: '800599065',
        ReportComments: []
      }
      expect(mapper.mapAntechV6TestCodeResult(testCodeResult, 0)).toEqual({
        seq: 0,
        code: '3575',
        name: 'SDMA',
        status: 'DONE',
        valueQuantity: {
          value: 13.8,
          units: 'UG/dL'
        },
        referenceRange: [
          {
            type: ReferenceRangeType.NORMAL,
            text: '<15.0',
            high: 15
          }
        ]
      })
    })
  })

  describe('mapAntechV6ResultStatus()', () => {
    it('should map pet/client/doctor correctly', () => {
      expect(
        mapper.mapAntechV6ResultStatus({
          Pet: {
            Id: '2147305531',
            Name: 'JOJO'
          },
          Client: {
            Id: 'BAC0LWT',
            FirstName: 'Joy',
            LastName: 'Hua'
          },
          Doctor: {
            Id: '',
            FirstName: 'foo',
            LastName: 'bar'
          },
          SpeciesID: 42,
          BreedID: 650
        } as unknown as AntechV6LabResultStatus)
      ).toEqual(
        expect.objectContaining({
          patient: expect.objectContaining({
            name: 'JOJO'
          }),
          client: expect.objectContaining({
            firstName: 'Joy',
            lastName: 'Hua'
          }),
          veterinarian: expect.objectContaining({
            firstName: 'foo',
            lastName: 'bar'
          })
        })
      )

      expect(
        mapper.mapAntechV6ResultStatus({
          Pet: {
            Id: '2147301908',
            Name: 'PETRIE PETEY'
          },
          Client: {
            Id: 'BAC0213',
            FirstName: 'Lynda',
            LastName: 'Hutchinson-Hinderer'
          },
          Doctor: {
            Id: '',
            FirstName: '',
            LastName: ''
          },
          SpeciesID: 41,
          BreedID: 650
        } as unknown as AntechV6LabResultStatus)
      ).toEqual(
        expect.objectContaining({
          patient: expect.objectContaining({
            name: 'PETRIE PETEY',
            identifier: [
              {
                system: 'pims:patient:id',
                value: '2147301908'
              }
            ]
          }),
          client: expect.objectContaining({
            firstName: 'Lynda',
            lastName: 'Hutchinson-Hinderer',
            identifier: [
              {
                system: 'pims:client:id',
                value: 'BAC0213'
              }
            ]
          }),
          veterinarian: expect.objectContaining({
            firstName: '',
            lastName: ''
          })
        })
      )
    })
  })

  describe('extractResultStatus', () => {
    let mapper: AntechV6Mapper

    beforeEach(() => {
      mapper = new AntechV6Mapper()
    })

    it('should return REVISED if the result is corrected', () => {
      const result: AntechV6Result = { Corrected: 'C' } as AntechV6Result
      expect(mapper.extractResultStatus(result)).toBe(ResultStatus.REVISED)
    })

    it('should return PARTIAL if there are pending tests', () => {
      const result: AntechV6Result = { PendingTestCount: 2, TotalTestCount: 5 } as AntechV6Result
      expect(mapper.extractResultStatus(result)).toBe(ResultStatus.PARTIAL)
    })

    it('should return COMPLETED if there are no pending tests', () => {
      const result: AntechV6Result = { PendingTestCount: 0, TotalTestCount: 5 } as AntechV6Result
      expect(mapper.extractResultStatus(result)).toBe(ResultStatus.COMPLETED)
    })

    it('should return PENDING if TotalTestCount is 0', () => {
      const result: AntechV6Result = { PendingTestCount: 0, TotalTestCount: 0 } as AntechV6Result
      expect(mapper.extractResultStatus(result)).toBe(ResultStatus.PENDING)
    })

    it('should handle undefined PendingTestCount and TotalTestCount safely', () => {
      const result: AntechV6Result = { PendingTestCount: undefined, TotalTestCount: undefined } as AntechV6Result
      expect(mapper.extractResultStatus(result)).toBe(ResultStatus.PENDING)

      const result_1: AntechV6Result = { PendingTestCount: undefined, TotalTestCount: 2 } as AntechV6Result
      expect(mapper.extractResultStatus(result_1)).toBe(ResultStatus.PENDING)

      const result_2: AntechV6Result = { PendingTestCount: 2, TotalTestCount: undefined } as AntechV6Result
      expect(mapper.extractResultStatus(result_2)).toBe(ResultStatus.PENDING)
    })

    it('should return PARTIAL if PendingTestCount is greater than 0 and less than TotalTestCount', () => {
      const result: AntechV6Result = { PendingTestCount: 3, TotalTestCount: 5 } as AntechV6Result
      expect(mapper.extractResultStatus(result)).toBe(ResultStatus.PARTIAL)
    })

    it('should return COMPLETED if PendingTestCount is 0 and TotalTestCount is greater than 0', () => {
      const result: AntechV6Result = { PendingTestCount: 0, TotalTestCount: 10 } as AntechV6Result
      expect(mapper.extractResultStatus(result)).toBe(ResultStatus.COMPLETED)
    })
  })
})
