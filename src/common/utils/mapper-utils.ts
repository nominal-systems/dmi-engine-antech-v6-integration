import { AntechV6Pet, AntechV6PetSex } from '../../interfaces/antechV6-api.interface'
import { isNullOrUndefinedOrEmpty } from '@nominal-systems/dmi-engine-common'
import { DEFAULT_PET_AGE } from '../../constants/default-pet-age'
import * as moment from 'moment'

export function extractPetAge(birthdate?: string): Pick<AntechV6Pet, 'PetAge' | 'PetAgeUnits'> {
  if (isNullOrUndefinedOrEmpty(birthdate)) {
    return DEFAULT_PET_AGE
  } else {
    const birthdateMoment = moment(birthdate, 'YYYY-MM-DD')
    const now = moment()

    const years = now.diff(birthdateMoment, 'years')
    const months = now.diff(birthdateMoment, 'months')
    const weeks = now.diff(birthdateMoment, 'weeks')
    const days = now.diff(birthdateMoment, 'days')
    if (years > 0) {
      return { PetAge: years, PetAgeUnits: 'Y' }
    } else if (months > 0) {
      return { PetAge: months, PetAgeUnits: 'M' }
    } else if (weeks > 0) {
      return { PetAge: weeks, PetAgeUnits: 'W' }
    } else if (days > 0) {
      return { PetAge: days, PetAgeUnits: 'D' }
    }

    return DEFAULT_PET_AGE
  }
}

export function mapPatientSex(sex: string): AntechV6PetSex {
  switch (sex) {
    case 'M':
      return AntechV6PetSex.MALE
    case 'F':
      return AntechV6PetSex.FEMALE
    case 'CM':
      return AntechV6PetSex.MALE_CASTRATED
    case 'SF':
      return AntechV6PetSex.FEMALE_SPRAYED
    default:
      return AntechV6PetSex.UNKNOWN
  }
}
