import { jest } from '@jest/globals'
import bcrypt from 'bcryptjs'
import {
  hashPassword,
  comparePassword,
  validatePassword,
} from '../../../src/utils/passwordUtils.js'

describe('Password Utils', () => {
  describe('hashPassword', () => {
    it('should hash a password successfully', async () => {
      const password = 'TestPassword123!'
      const hashedPassword = await hashPassword(password)

      // Verify it's not the original password
      expect(hashedPassword).not.toBe(password)
      // Verify it has the bcrypt format (starts with $2a$ or $2b$)
      expect(hashedPassword).toMatch(/^\$2[ab]\$\d+\$/)
    })

    it('should create different hashes for the same password', async () => {
      const password = 'TestPassword123!'
      const hash1 = await hashPassword(password)
      const hash2 = await hashPassword(password)

      expect(hash1).not.toBe(hash2)
    })

    it('should use the provided salt rounds', async () => {
      const password = 'TestPassword123!'
      const saltRounds = 12

      const spy = jest.spyOn(bcrypt, 'hash')
      await hashPassword(password, saltRounds)

      expect(spy).toHaveBeenCalledWith(password, saltRounds)
      spy.mockRestore()
    })
  })

  describe('comparePassword', () => {
    it('should return true for matching passwords', async () => {
      const password = 'TestPassword123!'
      const hashedPassword = await hashPassword(password)

      const result = await comparePassword(password, hashedPassword)
      expect(result).toBe(true)
    })

    it('should return false for non-matching passwords', async () => {
      const password = 'TestPassword123!'
      const wrongPassword = 'WrongPassword456@'
      const hashedPassword = await hashPassword(password)

      const result = await comparePassword(wrongPassword, hashedPassword)
      expect(result).toBe(false)
    })
  })

  describe('validatePassword', () => {
    it('should return true for valid passwords', () => {
      // Valid passwords that meet all requirements
      const validPasswords = ['Password123!', 'Complex@Pass1word', 'SuperS3cur3P@ss', 'Abc123!@#']

      validPasswords.forEach((password) => {
        expect(validatePassword(password)).toBe(true)
      })
    })

    it('should reject passwords shorter than 8 characters', () => {
      expect(validatePassword('Abc1!@#')).toBe(false)
      expect(validatePassword('Sh0rt!')).toBe(false)
    })

    it('should reject passwords without uppercase letters', () => {
      expect(validatePassword('password123!')).toBe(false)
      expect(validatePassword('all_lowercase123!')).toBe(false)
    })

    it('should reject passwords without lowercase letters', () => {
      expect(validatePassword('PASSWORD123!')).toBe(false)
      expect(validatePassword('ALL_UPPERCASE123!')).toBe(false)
    })

    it('should reject passwords without numbers', () => {
      expect(validatePassword('PasswordNoNumbers!')).toBe(false)
      expect(validatePassword('JustLetters@')).toBe(false)
    })

    it('should reject passwords without special characters', () => {
      expect(validatePassword('Password123')).toBe(false)
      expect(validatePassword('NoSpecialChars123')).toBe(false)
    })

    it('should handle null or invalid values', () => {
      expect(validatePassword(null)).toBe(false)
      expect(validatePassword(undefined)).toBe(false)
      expect(validatePassword(123456)).toBe(false)
      expect(validatePassword({})).toBe(false)
      expect(validatePassword([])).toBe(false)
      expect(validatePassword('')).toBe(false)
    })
  })
})
