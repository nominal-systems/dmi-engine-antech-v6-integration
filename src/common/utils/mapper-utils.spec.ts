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

    it('should calculate pet age in years', () => {
      const birthdate = moment().subtract(12, 'years').format('YYYY-MM-DD')
      expect(extractPetAge(birthdate)).toEqual({ PetAge: 12, PetAgeUnits: 'Y' })
    })

    it('should calculate pet age in months', () => {
      const birthdate = moment().subtract(3, 'months').format('YYYY-MM-DD')
      expect(extractPetAge(birthdate)).toEqual({ PetAge: 3, PetAgeUnits: 'M' })
    })

    it('should calculate the pet age in weeks', () => {
      const birthdate = moment().subtract(2, 'weeks').format('YYYY-MM-DD')
      expect(extractPetAge(birthdate)).toEqual({ PetAge: 2, PetAgeUnits: 'W' })
    })

    it('should calculate the pet age in days', () => {
      const birthdate = moment().subtract(2, 'days').format('YYYY-MM-DD')
      expect(extractPetAge(birthdate)).toEqual({ PetAge: 2, PetAgeUnits: 'D' })
    })
  })
})
