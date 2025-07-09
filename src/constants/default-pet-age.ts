import { AntechV6Pet } from '../interfaces/antechV6-api.interface'

export const DEFAULT_PET_AGE: Pick<AntechV6Pet, 'PetAge' | 'PetAgeUnits'> = {
  PetAge: 1,
  PetAgeUnits: 'Y',
}
