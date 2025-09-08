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
      expect(extractPetAge(birthdate)).toEqual({ PetAge: 2, PetAgeUnits: 'D' })
    })

    it('should calculate the pet age in days for a birthdate far in the past', () => {
      const birthdate = moment().subtract(5, 'years').format('YYYY-MM-DD')
      expect(extractPetAge(birthdate)).toEqual({ PetAge: 1826, PetAgeUnits: 'D' })
    })
  })
})
