import { extractPetAge } from './mapper-utils'
import { DEFAULT_PET_AGE } from '../../constants/default-pet-age'

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
      expect(extractPetAge('2025-01-01')).toEqual(DEFAULT_PET_AGE)
    })

    it('should calculate pet age in years', () => {
      expect(extractPetAge('2011-05-08')).toEqual({ PetAge: 12, PetAgeUnits: 'Y' })
    })

    it('should calculate pet age in months', () => {
      expect(extractPetAge('2024-01-01')).toEqual({ PetAge: 3, PetAgeUnits: 'M' })
    })

    it('should calculate the pet age in weeks', () => {
      expect(extractPetAge('2024-03-19')).toEqual({ PetAge: 2, PetAgeUnits: 'W' })
    })

    it('should calculate the pet age in days', () => {
      expect(extractPetAge('2024-04-01')).toEqual({ PetAge: 2, PetAgeUnits: 'D' })
    })
  })
})
