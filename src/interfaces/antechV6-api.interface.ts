export enum AntechV6Endpoints {
  LOGIN = '/Users/v6/Login',
  GET_STATUS = '/LabResults/v6/GetStatus',
  GET_SPECIES_AND_BREEDS = '/Master/v6/GetSpeciesBreed',
  PLACE_PRE_ORDER = '/LabOrders/v6/PreOrderPlacement'
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
