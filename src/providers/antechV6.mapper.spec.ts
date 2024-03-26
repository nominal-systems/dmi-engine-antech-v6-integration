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
  AntechV6PetSex,
  AntechV6PreOrder,
  AntechV6Result,
  AntechV6TestGuide,
  AntechV6UnitCodeResult
} from '../interfaces/antechV6-api.interface'
import { ServiceType, TestResult } from '@nominal-systems/dmi-engine-common/lib/interfaces/provider-service'
import * as path from 'path'

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
  })

  describe('mapAntechV6UnitCodeResult()', () => {
    const allResultsResponse: any = FileUtils.loadFile(
      path.join(__dirname, '..', '..', 'test/api/LabResults/v6/GetAllResults/get-all-results_01.json')
    )
    it('should map Antech unit code results to DMI test results', () => {
      const unitCodeResult: AntechV6UnitCodeResult = allResultsResponse[0].UnitCodeResults[0]
      const testResult: TestResult = mapper.mapAntechV6UnitCodeResult(unitCodeResult, 0)
      expect(testResult).toEqual({
        seq: 0,
        code: '502020',
        name: 'Alkaline Phosphatase',
        items: expect.any(Array<TestResultItem>)
      })
      expect(testResult.items.length).toBeGreaterThan(0)
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
        status: 'F',
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
        status: 'F',
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
        status: 'F',
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
        status: 'F',
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
})