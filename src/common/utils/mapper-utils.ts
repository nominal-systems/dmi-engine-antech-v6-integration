import {
  AntechV6Pet,
  AntechV6PetSex,
  AntechV6Result,
} from '../../interfaces/antechV6-api.interface'
import {
  Client,
  isNullOrUndefinedOrEmpty,
  OrderPatient,
  Patient,
  Test,
  TestResultItemStatus,
  Veterinarian,
} from '@nominal-systems/dmi-engine-common'
import { DEFAULT_PET_AGE } from '../../constants/default-pet-age'
import * as moment from 'moment'
import { AntechV6ApiException } from '../exceptions/antechV6-api.exception'

export function extractPetAge(
  birthdate?: string,
  ageUnits?: 'Y' | 'M' | 'W' | 'D',
): Pick<AntechV6Pet, 'PetAge' | 'PetAgeUnits'> {
  if (isNullOrUndefinedOrEmpty(birthdate)) {
    return DEFAULT_PET_AGE
  } else {
    const birthdateMoment = moment(birthdate, 'YYYY-MM-DD')
    const now = moment()
    const days = now.diff(birthdateMoment, 'days')
    const weeks = now.diff(birthdateMoment, 'weeks')
    const months = now.diff(birthdateMoment, 'months')
    const years = now.diff(birthdateMoment, 'years')
    // When units are specified, never return 0. If the difference is 0,
    // round up to 1; if negative (future date), fall through to default.
    if (ageUnits) {
      if (ageUnits === 'Y') {
        if (years < 0) return DEFAULT_PET_AGE
        return { PetAge: Math.max(1, years), PetAgeUnits: 'Y' }
      }
      if (ageUnits === 'M') {
        if (months < 0) return DEFAULT_PET_AGE
        return { PetAge: Math.max(1, months), PetAgeUnits: 'M' }
      }
      if (ageUnits === 'W') {
        if (weeks < 0) return DEFAULT_PET_AGE
        return { PetAge: Math.max(1, weeks), PetAgeUnits: 'W' }
      }
      if (ageUnits === 'D') {
        if (days < 0) return DEFAULT_PET_AGE
        return { PetAge: Math.max(1, days), PetAgeUnits: 'D' }
      }
    } else {
      if (years > 0) return { PetAge: years, PetAgeUnits: 'Y' }
      if (months > 0) return { PetAge: months, PetAgeUnits: 'M' }
      if (weeks > 0) return { PetAge: weeks, PetAgeUnits: 'W' }
      if (days > 0) return { PetAge: days, PetAgeUnits: 'D' }
    }
    return DEFAULT_PET_AGE
  }
}

export function extractPetWeight(
  patient: OrderPatient,
): Pick<AntechV6Pet, 'PetWeight' | 'PetWeightUnits'> {
  if (
    !isNullOrUndefinedOrEmpty(patient.weightMeasurement) &&
    !isNullOrUndefinedOrEmpty(patient.weightUnits)
  ) {
    return {
      PetWeight: patient.weightMeasurement,
      PetWeightUnits: patient.weightUnits,
    }
  } else {
    return {}
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

export function mapTestCodeResultStatus(status?: string): TestResultItemStatus {
  switch (status) {
    default:
      return TestResultItemStatus.DONE
  }
}

export function generateClinicAccessionId(clinicId: string, pimsId: string): string {
  if (clinicId === undefined) {
    throw new AntechV6ApiException('Error while generating a Clinic Accession ID', 400, {
      message: 'clinicId is not set in the integration options',
    })
  }

  if (pimsId === undefined) {
    throw new AntechV6ApiException('Error while generating a Clinic Accession ID', 400, {
      message: 'pimsId is not set in the provider configuration',
    })
  }

  if (pimsId.length < 3 || pimsId.length > 4) {
    throw new AntechV6ApiException('Error while generating a Clinic Accession ID', 400, {
      message: 'pimsId incorrect length: it must be 3-4 characters long',
    })
  }

  // Calculate the maximum allowed length for the seq part
  const maxSeqLength = 20 - clinicId.length - pimsId.length - 2 // 2 hyphens
  if (maxSeqLength <= 0) {
    throw new AntechV6ApiException('Error while generating a Clinic Accession ID', 400, {
      message: 'clinicId and/or pimsId are too long',
    })
  }

  // Compute the seq part
  const currentTime = new Date().getTime()
  const seq = currentTime % Math.pow(10, maxSeqLength)
  const seqStr = seq.toString().slice(0, maxSeqLength)

  return `${clinicId}-${pimsId}-${seqStr}`
}

export function applyTestResultSequencing(testCode: string, sequence: string[]): number {
  return sequence.indexOf(testCode)
}

export function isOrphanResult(result: AntechV6Result): boolean {
  return isNullOrUndefinedOrEmpty(result.ClinicAccessionID)
}

export function extractPatientFromResult(result: AntechV6Result): Patient {
  return {
    name: result.Pet.Name || '',
    sex: 'UNKNOWN',
    species: 'UNKNOWN',
  }
}

export function extractClientFromResult(result: AntechV6Result): Client {
  return {
    firstName: result.Client.FirstName || '',
    lastName: result.Client.LastName || '',
  }
}

export function extractVeterinarianFromResult(result: AntechV6Result): Veterinarian {
  return {
    firstName: result.Doctor.FirstName || '',
    lastName: result.Doctor.LastName || '',
  }
}

export function extractOrderTestCodesFromResult(result: AntechV6Result): Test[] {
  return result.UnitCodeResults.map((unitCodeResult) => {
    return { code: unitCodeResult.OrderCode }
  })
}
