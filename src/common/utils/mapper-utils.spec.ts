import { extractPetAge } from './mapper-utils'
import { DEFAULT_PET_AGE } from '../../constants/default-pet-age'
import * as moment from 'moment'

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

    it('should return zero days when pet age is today', () => {
      const birthdate = moment().format('YYYY-MM-DD')
      expect(extractPetAge(birthdate, 'D')).toEqual({ PetAge: 0, PetAgeUnits: 'D' })
    })

    it('should return zero weeks when pet age is less than a week', () => {
      const birthdate = moment().subtract(3, 'days').format('YYYY-MM-DD')
      expect(extractPetAge(birthdate, 'W')).toEqual({ PetAge: 0, PetAgeUnits: 'W' })
    })

    it('should calculate the pet age in weeks', () => {
      const birthdate = moment().subtract(10, 'weeks').format('YYYY-MM-DD')
      expect(extractPetAge(birthdate, 'W')).toEqual({ PetAge: 10, PetAgeUnits: 'W' })
    })

    it('should calculate the pet age in months', () => {
      const birthdate = moment().subtract(15, 'months').format('YYYY-MM-DD')
      expect(extractPetAge(birthdate, 'M')).toEqual({ PetAge: 15, PetAgeUnits: 'M' })
    })

    it('should return zero months when pet age is less than a month', () => {
      const birthdate = moment().subtract(23, 'days').format('YYYY-MM-DD')
      expect(extractPetAge(birthdate, 'M')).toEqual({ PetAge: 0, PetAgeUnits: 'M' })
    })

    it('should calculate the pet age in years', () => {
      const birthdate = moment().subtract(3, 'years').format('YYYY-MM-DD')
      expect(extractPetAge(birthdate, 'Y')).toEqual({ PetAge: 3, PetAgeUnits: 'Y' })
    })

    it('should return zero years when pet age is less than a year', () => {
      const birthdate = moment().subtract(10, 'months').format('YYYY-MM-DD')
      expect(extractPetAge(birthdate, 'Y')).toEqual({ PetAge: 0, PetAgeUnits: 'Y' })
    })

    it('should calculate the pet age in days for a birthdate far in the past', () => {
      const birthdate = moment().subtract(5, 'years').format('YYYY-MM-DD')
      expect(extractPetAge(birthdate, 'D')).toEqual({ PetAge: 5 * 365 + 1, PetAgeUnits: 'D' })
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
      expect(extractPetAge(birthdate, 'D')).toEqual({ PetAge: 30 * 18 + 18 / 2, PetAgeUnits: 'D' })
      expect(extractPetAge(birthdate, 'M')).toEqual({ PetAge: 18, PetAgeUnits: 'M' })
    })
  })
})
