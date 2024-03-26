export enum AntechV6Endpoints {
  LOGIN = '/Users/v6/Login',
  GET_STATUS = '/LabResults/v6/GetStatus',
  GET_ALL_RESULTS = '/LabResults/v6/GetAllResults',
  GET_SPECIES_AND_BREEDS = '/Master/v6/GetSpeciesBreed',
  PLACE_PRE_ORDER = '/LabOrders/v6/PreOrderPlacement',
  GET_TEST_GUIDE = '/Tests/v6'
}

export interface AntechV6UserCredentials {
  UserName: string
  Password: string
  ClinicID: string
}

export interface AntechV6OrderStatus {
  LabOrders?: any
}

export interface AntechV6AccessToken {
  Token: string
  UserInfo?: {
    ID: number
  }
}

export interface AntechV6PreOrderPlacement {
  Value: string
}

export interface AntechV6SpeciesAndBreeds {
  value: {
    data: AntechV6Species[]
    message: string
  }
}

export interface AntechV6Species {
  id: number
  name: string
  breed: AntechV6Breed[]
}

export interface AntechV6Breed {
  id: number
  name: string
  breedExtId: string
  speciesExtId: string
}

export interface AntechV6TestGuide {
  TotalCount: number
  LabResults: AntechV6Test[]
}

export interface AntechV6Test {
  CodeID: string
  ExtensionID: string
  Description: string
  MnemonicType: string
  Alias: string
  Category: string
  ClientFacingDescription: string
  StiboMnemonics: string
  Code: string
  ReportingTitle: string
  Schedule: string
  LabID: number
  SDFlag: string
  AOLFlag: string
  Price: number
  IdexxCode: string
  FavoriteMnemonic: string
  FavDisplayName: string
  FavCustomID: number
  OrderCount: number
  ClinicID: string
  Container: string
  Specimen: string
  SubTestCodeIDList: string
  SubTestCodeExtIDList: string
  SubTestCodeList: string
  Status: string
  HTEnabled: string
  POC_Mnemonic: string
  AnalyzerID: string
  Common: string
  POC_Flag: string
  AcceptableSpecies: string
  PreferredSpecimenRequirements: string
  AcceptableSpecimenRequirements: string
  RetentionStability: string
  SpecimenDefinition: string
  POC_Id: string
}

export interface AntechV6PreOrder extends AntechV6Client, AntechV6Doctor, AntechV6Pet {
  LabID?: number
  ClinicID: string
  ClinicAccessionID: string
  Order_ID?: string
  User_ID?: number
  ListOrderCodes?: string
  OrderCodes?: string[]
}

export interface AntechV6Client {
  ClientID: string
  ClientFirstName: string
  ClientLastName: string
  ClientAddress?: string
  ClientState?: string
  ClientCity?: string
  ClientZip?: string
  ClientCountry?: string
  ClientCell?: string
  ClientEmail?: string
}

export interface AntechV6Doctor {
  DoctorID?: string
  DoctorFirstName: string
  DoctorLastName: string
  DoctorCell?: string
  DoctorEmail?: string
}

export interface AntechV6Pet {
  PetID: string
  PetName: string
  PetSex: AntechV6PetSex
  PetAge: number
  PetAgeUnits: AntechV6PetAgeUnits
  PetWeight?: number
  PetWeightUnits?: string
  SpeciesID: number
  BreedID: number
}

export enum AntechV6PetSex {
  MALE = 'M',
  FEMALE = 'F',
  MALE_CASTRATED = 'CM',
  FEMALE_SPRAYED = 'SF',
  UNKNOWN = 'U'
}

export type AntechV6PetAgeUnits = 'Y' | 'M' | 'W' | 'D'

export interface AntechV6Clinic {
  ClinicID?: number
  LabId?: number
  AccountNumber?: string
  ClinicExtId?: string
  Name?: string
  Phone?: string
  Fax?: string
  FaxVersion?: string
  Status?: string
  CultureCode?: string
  HTEnabled?: string
  HasUsers?: boolean
}

export interface AntechV6Result {
  ID: number
  Clinic?: AntechV6Clinic
  LabAccessionID: string
  ClinicAccessionID: string
  ReportedDateTime?: string
  LatestAccessionUpdate?: string
  CorrectedTestCount?: number
  ReceivedDateTime?: string
  ProfileDisplay?: string
  TestDescription?: string
  OrderStatus?: string
  Corrected?: string
  PendingTestCount?: number
  TotalTestCount?: number
  ViewedDateTime?: string
  ReleasedDateTime?: string
  PrintedDateTime?: string
  DownloadDateTime?: string
  UnitCodeResults: AntechV6UnitCodeResult[]
  Doctor?: {
    Id?: string
    Name?: string
  }
  Pet?: {
    Id?: string
    Name?: string
  }
  Client?: {
    Id?: string
    FirstName?: string
    LastName?: string
  }
}

export interface AntechV6UnitCodeResult {
  UnitCodeResultID?: string
  UnitCodeID?: number
  ProfileExtID?: string
  UnitCodeExtID: string
  ReleasedDateTime?: string
  CreatedTimeStamp?: string
  ReleasedDateTimeStr?: string
  ViewedDateTime?: string
  ResultStatus?: AntechV6ResultStatus
  OrderControlStatus?: string
  Comments?: string
  UnitCodeDisplayName: string
  ProfileDisplayName: string
  UnitCodeType?: string
  UCType?: string
  TestCodeResults: AntechV6TestCodeResult[]
  Category?: string
  AccessionResultID?: number
}

export interface AntechV6TestCodeResult {
  TestCodeExtID: string
  Test: string
  TestCodeID?: string
  TestCodeResultID?: string
  AbnormalFlag?: AntechV6AbnormalFlag
  ResultStatus?: string
  Result: string
  ResultFileURL?: string
  Range?: string
  Unit?: string
  HtmlDisplay?: string
  Comments?: string
  Min?: string
  Max?: string
  TestType?: string
  AbsExtID?: string
  TCTrendExtID?: string
  TxtDspStr?: string
  UnitCodeID?: string
  ReportComments?: string[]
}

export enum AntechV6ResultStatus {
  IN_PROGRESS = 'I',
  PARTIAL = 'P',
  FINAL = 'F',
  UPDATED_CORRECTED = 'C'
}

export enum AntechV6AbnormalFlag {
  HIGH = 'H',
  LOW = 'L',
  ABNORMAL = '*',
  POSITIVE = 'P'
}
