import { extractPetAge, extractPetWeight, sanitizeName } from './mapper-utils'
import { DEFAULT_PET_AGE } from '../../constants/default-pet-age'
import * as moment from 'moment'
import { OrderPatient } from '@nominal-systems/dmi-engine-common'

describe('MapperUtils', () => {
  describe('extractPetAge()', () => {
    it('should return default age when birthdate is null', () => {
      expect(extractPetAge(null as unknown as any)).toEqual(DEFAULT_PET_AGE)
    })

    it('should return default age when birthdate is empty', () => {
      expect(extractPetAge('')).toEqual(DEFAULT_PET_AGE)
    })

    it('should return default age when birthdate is undefined', () => {
      expect(extractPetAge(undefined)).toEqual(DEFAULT_PET_AGE)
    })

    it('should return default age when birthdate is not provided', () => {
      expect(extractPetAge()).toEqual(DEFAULT_PET_AGE)
    })

    it('should return default age when birthdate is in the future', () => {
      const futureDate = moment().add(1, 'day').format('YYYY-MM-DD')
      expect(extractPetAge(futureDate)).toEqual(DEFAULT_PET_AGE)
    })

    it('should calculate the pet age in days', () => {
      const birthdate = moment().subtract(2, 'days').format('YYYY-MM-DD')
      expect(extractPetAge(birthdate, 'D')).toEqual({ PetAge: 2, PetAgeUnits: 'D' })
    })

    it('should not return zero days when pet age is today', () => {
      const birthdate = moment().format('YYYY-MM-DD')
      expect(extractPetAge(birthdate, 'D')).toEqual({ PetAge: 1, PetAgeUnits: 'D' })
    })

    it('should not return zero weeks when pet age is less than a week', () => {
      const birthdate = moment().subtract(3, 'days').format('YYYY-MM-DD')
      expect(extractPetAge(birthdate, 'W')).toEqual({ PetAge: 1, PetAgeUnits: 'W' })
    })

    it('should calculate the pet age in weeks', () => {
      const birthdate = moment().subtract(10, 'weeks').format('YYYY-MM-DD')
      expect(extractPetAge(birthdate, 'W')).toEqual({ PetAge: 10, PetAgeUnits: 'W' })
    })

    it('should calculate the pet age in months', () => {
      const birthdate = moment().subtract(15, 'months').format('YYYY-MM-DD')
      expect(extractPetAge(birthdate, 'M')).toEqual({ PetAge: 15, PetAgeUnits: 'M' })
    })

    it('should not return zero months when pet age is less than a month', () => {
      const birthdate = moment().subtract(23, 'days').format('YYYY-MM-DD')
      expect(extractPetAge(birthdate, 'M')).toEqual({ PetAge: 1, PetAgeUnits: 'M' })
    })

    it('should calculate the pet age in years', () => {
      const birthdate = moment().subtract(3, 'years').format('YYYY-MM-DD')
      expect(extractPetAge(birthdate, 'Y')).toEqual({ PetAge: 3, PetAgeUnits: 'Y' })
    })

    it('should not return zero years when pet age is less than a year', () => {
      const birthdate = moment().subtract(10, 'months').format('YYYY-MM-DD')
      expect(extractPetAge(birthdate, 'Y')).toEqual({ PetAge: 1, PetAgeUnits: 'Y' })
    })

    it('should calculate the pet age in days for a birthdate far in the past', () => {
      const birthdate = moment().subtract(5, 'years').format('YYYY-MM-DD')
      expect(extractPetAge(birthdate, 'D')).toEqual({ PetAge: 5 * 365 + 1, PetAgeUnits: 'D' })
    })

    it('should never return 0 days/weeks/months/years', () => {
      expect(extractPetAge(moment().subtract(8, 'hours').format('YYYY-MM-DD'), 'D')).toEqual({
        PetAge: 1,
        PetAgeUnits: 'D',
      })
      expect(extractPetAge(moment().subtract(5, 'days').format('YYYY-MM-DD'), 'W')).toEqual({
        PetAge: 1,
        PetAgeUnits: 'W',
      })
      expect(extractPetAge(moment().subtract(20, 'days').format('YYYY-MM-DD'), 'M')).toEqual({
        PetAge: 1,
        PetAgeUnits: 'M',
      })
      expect(extractPetAge(moment().subtract(300, 'days').format('YYYY-MM-DD'), 'Y')).toEqual({
        PetAge: 1,
        PetAgeUnits: 'Y',
      })
    })

    it('should calculate the pet age in natural units', () => {
      expect(extractPetAge(moment().subtract(32, 'days').format('YYYY-MM-DD'))).toEqual({
        PetAge: 1,
        PetAgeUnits: 'M',
      })
      expect(extractPetAge(moment().subtract(400, 'days').format('YYYY-MM-DD'))).toEqual({
        PetAge: 1,
        PetAgeUnits: 'Y',
      })
      expect(extractPetAge(moment().subtract(8, 'days').format('YYYY-MM-DD'))).toEqual({
        PetAge: 1,
        PetAgeUnits: 'W',
      })
    })

    it('should honor the preferred unit when calculating pet age', () => {
      const birthdate = moment().subtract(18, 'months').format('YYYY-MM-DD')
      expect(extractPetAge(birthdate)).toEqual({ PetAge: 1, PetAgeUnits: 'Y' })
      const days = moment().diff(moment(birthdate), 'days')
      expect(extractPetAge(birthdate, 'D')).toEqual({ PetAge: days, PetAgeUnits: 'D' })
      const months = moment().diff(moment(birthdate), 'months')
      expect(extractPetAge(birthdate, 'M')).toEqual({ PetAge: months, PetAgeUnits: 'M' })
    })
  })

  describe('extractPetWeight()', () => {
    it('should return the weight as received', () => {
      const patient: Partial<OrderPatient> = {
        weightMeasurement: 15.5,
        weightUnits: 'kg',
      }
      expect(extractPetWeight(patient as OrderPatient)).toEqual({
        PetWeight: 15.5,
        PetWeightUnits: 'kg',
      })
    })

    it('should return the weight as received when it is a small non-zero value', () => {
      const patient: Partial<OrderPatient> = {
        weightMeasurement: 0.005,
        weightUnits: 'kg',
      }
      expect(extractPetWeight(patient as OrderPatient)).toEqual({
        PetWeight: 0.005,
        PetWeightUnits: 'kg',
      })
    })

    it('should return empty object when weight is zero', () => {
      const patient: Partial<OrderPatient> = {
        weightMeasurement: 0,
        weightUnits: 'kg',
      }
      expect(extractPetWeight(patient as OrderPatient)).toEqual({})
    })
  })

  describe('sanitizeName()', () => {
    it('should leave a name that already fits unchanged', () => {
      expect(sanitizeName("Mary-Kate O'Brien 3", 50)).toBe("Mary-Kate O'Brien 3")
      expect(sanitizeName('  Mary  Ann  ', 50)).toBe('  Mary  Ann  ')
      expect(sanitizeName('   ', 20)).toBe('   ')
      expect(sanitizeName('', 20)).toBe('')
    })

    it('should replace double quotes with single quotes', () => {
      expect(sanitizeName('Roger "Doc"', 50)).toBe("Roger 'Doc'")
    })

    it('should replace typographic quotes with single quotes', () => {
      expect(sanitizeName('O’Brien', 50)).toBe("O'Brien")
      expect(sanitizeName('“Doc” ‘Jr’', 50)).toBe("'Doc' 'Jr'")
    })

    it('should drop the accent from an accented letter', () => {
      expect(sanitizeName('José Ñandú', 50)).toBe('Jose Nandu')
      expect(sanitizeName('Zoë Françoise', 50)).toBe('Zoe Francoise')
      expect(sanitizeName('José', 50)).toBe('Jose')
    })

    it('should replace any other character with a dash', () => {
      expect(sanitizeName('Smith & Jones', 50)).toBe('Smith - Jones')
      expect(sanitizeName('St. John', 50)).toBe('St- John')
      expect(sanitizeName('Rex (2)/Max_1', 50)).toBe('Rex -2--Max-1')
      expect(sanitizeName('Strauß', 50)).toBe('Strau-')
    })

    it('should replace each character with one dash, whatever its encoding', () => {
      expect(sanitizeName('Rex \u{1F436}', 50)).toBe('Rex -')
      expect(sanitizeName('김민준', 50)).toBe('---')
    })

    it('should turn tabs, line breaks and no-break spaces into spaces', () => {
      expect(sanitizeName('Mary\tAnn\nLee Jo', 50)).toBe('Mary Ann Lee Jo')
    })

    it('should truncate to the maximum length after sanitizing', () => {
      expect(sanitizeName('Ábcdefghij"Klmnopqrstuv', 20)).toBe("Abcdefghij'Klmnopqrs")
      expect(sanitizeName('é'.repeat(25), 20)).toBe('e'.repeat(20))
      expect(sanitizeName('\u{1F436}'.repeat(25), 20)).toBe('-'.repeat(20))
    })

    it('should not leave a trailing space where it truncates', () => {
      expect(sanitizeName('Abcdefghijklmnopqrs Tuv', 20)).toBe('Abcdefghijklmnopqrs')
    })
  })
})
