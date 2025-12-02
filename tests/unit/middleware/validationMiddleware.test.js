<<<<<<< HEAD
import { jest } from '@jest/globals'
import { validate } from '../../../src/middleware/validationMiddleware.js'
import { SpecificError } from '../../../src/middleware/errorMiddleware.js'
import Joi from 'joi'

// Mock next function
const mockNext = jest.fn()

// Reset mocks before each test
beforeEach(() => {
  jest.clearAllMocks()
})

describe('Validation Middleware', () => {
  // Test case for body validation
  describe('Body validation', () => {
    test('should pass with valid body data', () => {
      // Arrange
      const schema = {
        body: Joi.object({
          name: Joi.string().required(),
          age: Joi.number().integer().min(18).required(),
        }),
      }
      const req = { body: { name: 'John', age: 25 } }
      const res = {}

      // Act
      validate(schema)(req, res, mockNext)

      // Assert
      expect(mockNext).toHaveBeenCalledTimes(1)
      expect(mockNext).not.toHaveBeenCalledWith(expect.any(Error))
    })

    test('should fail with invalid body data', () => {
      // Arrange
      const schema = {
        body: Joi.object({
          name: Joi.string().required(),
          age: Joi.number().integer().min(18).required(),
        }),
      }
      const req = { body: { name: '', age: 15 } }
      const res = {}

      // Act
      validate(schema)(req, res, mockNext)

      // Assert
      expect(mockNext).toHaveBeenCalledTimes(1)
      expect(mockNext).toHaveBeenCalledWith(expect.any(SpecificError))
      expect(mockNext.mock.calls[0][0].statusCode).toBe(400)
      expect(mockNext.mock.calls[0][0].details.length).toBe(2) // Two validation errors
    })

    test('should skip body validation when schema.body is not defined', () => {
      // Arrange
      const schema = {}
      const req = { body: { invalid: 'data' } }
      const res = {}

      // Act
      validate(schema)(req, res, mockNext)

      // Assert
      expect(mockNext).toHaveBeenCalledTimes(1)
      expect(mockNext).not.toHaveBeenCalledWith(expect.any(Error))
    })
  })

  // Test case for query validation
  describe('Query validation', () => {
    test('should pass with valid query parameters', () => {
      // Arrange
      const schema = {
        query: Joi.object({
          page: Joi.number().integer().min(1),
          limit: Joi.number().integer().min(1).max(100),
        }),
      }
      const req = { query: { page: 1, limit: 20 } }
      const res = {}

      // Act
      validate(schema)(req, res, mockNext)

      // Assert
      expect(mockNext).toHaveBeenCalledTimes(1)
      expect(mockNext).not.toHaveBeenCalledWith(expect.any(Error))
    })

    test('should fail with invalid query parameters', () => {
      // Arrange
      const schema = {
        query: Joi.object({
          page: Joi.number().integer().min(1),
          limit: Joi.number().integer().min(1).max(100),
        }),
      }
      const req = { query: { page: 0, limit: 200 } }
      const res = {}

      // Act
      validate(schema)(req, res, mockNext)

      // Assert
      expect(mockNext).toHaveBeenCalledTimes(1)
      expect(mockNext).toHaveBeenCalledWith(expect.any(SpecificError))
      expect(mockNext.mock.calls[0][0].statusCode).toBe(400)
      expect(mockNext.mock.calls[0][0].details.length).toBe(2) // Two validation errors
    })
  })

  // Test case for params validation
  describe('Params validation', () => {
    test('should pass with valid params', () => {
      // Arrange
      const schema = {
        params: Joi.object({
          id: Joi.number().integer().required(),
        }),
      }
      const req = { params: { id: 123 } }
      const res = {}

      // Act
      validate(schema)(req, res, mockNext)

      // Assert
      expect(mockNext).toHaveBeenCalledTimes(1)
      expect(mockNext).not.toHaveBeenCalledWith(expect.any(Error))
    })

    test('should fail with invalid params', () => {
      // Arrange
      const schema = {
        params: Joi.object({
          id: Joi.number().integer().required(),
        }),
      }
      const req = { params: { id: 'abc' } }
      const res = {}

      // Act
      validate(schema)(req, res, mockNext)

      // Assert
      expect(mockNext).toHaveBeenCalledTimes(1)
      expect(mockNext).toHaveBeenCalledWith(expect.any(SpecificError))
      expect(mockNext.mock.calls[0][0].statusCode).toBe(400)
      expect(mockNext.mock.calls[0][0].details.length).toBe(1) // One validation error
    })
  })

  // Test case for multiple validation types
  describe('Combined validations', () => {
    test('should validate body, query and params together', () => {
      // Arrange
      const schema = {
        body: Joi.object({
          name: Joi.string().required(),
        }),
        query: Joi.object({
          page: Joi.number().integer().min(1),
        }),
        params: Joi.object({
          id: Joi.number().integer().required(),
        }),
      }
      const req = {
        body: { name: 'John' },
        query: { page: 1 },
        params: { id: 123 },
      }
      const res = {}

      // Act
      validate(schema)(req, res, mockNext)

      // Assert
      expect(mockNext).toHaveBeenCalledTimes(1)
      expect(mockNext).not.toHaveBeenCalledWith(expect.any(Error))
    })

    test('should collect all validation errors from body, query and params', () => {
      // Arrange
      const schema = {
        body: Joi.object({
          name: Joi.string().required(),
        }),
        query: Joi.object({
          page: Joi.number().integer().min(1),
        }),
        params: Joi.object({
          id: Joi.number().integer().required(),
        }),
      }
      const req = {
        body: { name: '' },
        query: { page: 0 },
        params: { id: 'abc' },
      }
      const res = {}

      // Act
      validate(schema)(req, res, mockNext)

      // Assert
      expect(mockNext).toHaveBeenCalledTimes(1)
      expect(mockNext).toHaveBeenCalledWith(expect.any(SpecificError))
      expect(mockNext.mock.calls[0][0].statusCode).toBe(400)
      expect(mockNext.mock.calls[0][0].details.length).toBe(3) // Three validation errors

      // Verify the error details contain the correct locations
      const errorDetails = mockNext.mock.calls[0][0].details
      expect(errorDetails.some((err) => err.location === 'body')).toBe(true)
      expect(errorDetails.some((err) => err.location === 'query')).toBe(true)
      expect(errorDetails.some((err) => err.location === 'params')).toBe(true)
    })
  })

  // Test error handling
  describe('Error handling', () => {
    test('should handle thrown errors and pass them to next', () => {
      // Arrange
      const schema = {
        body: {
          validate: () => {
            throw new Error('Unexpected error')
          },
        },
      }
      const req = { body: {} }
      const res = {}

      // Act
      validate(schema)(req, res, mockNext)

      // Assert
      expect(mockNext).toHaveBeenCalledTimes(1)
      expect(mockNext).toHaveBeenCalledWith(expect.any(Error))
    })
  })
})
=======
import { jest } from '@jest/globals'
import { validate } from '../../../src/middleware/validationMiddleware.js'
import { SpecificError } from '../../../src/middleware/errorMiddleware.js'
import Joi from 'joi'

// Mock next function
const mockNext = jest.fn()

// Reset mocks before each test
beforeEach(() => {
  jest.clearAllMocks()
})

describe('Validation Middleware', () => {
  // Test case for body validation
  describe('Body validation', () => {
    test('should pass with valid body data', () => {
      // Arrange
      const schema = {
        body: Joi.object({
          name: Joi.string().required(),
          age: Joi.number().integer().min(18).required(),
        }),
      }
      const req = { body: { name: 'John', age: 25 } }
      const res = {}

      // Act
      validate(schema)(req, res, mockNext)

      // Assert
      expect(mockNext).toHaveBeenCalledTimes(1)
      expect(mockNext).not.toHaveBeenCalledWith(expect.any(Error))
    })

    test('should fail with invalid body data', () => {
      // Arrange
      const schema = {
        body: Joi.object({
          name: Joi.string().required(),
          age: Joi.number().integer().min(18).required(),
        }),
      }
      const req = { body: { name: '', age: 15 } }
      const res = {}

      // Act
      validate(schema)(req, res, mockNext)

      // Assert
      expect(mockNext).toHaveBeenCalledTimes(1)
      expect(mockNext).toHaveBeenCalledWith(expect.any(SpecificError))
      expect(mockNext.mock.calls[0][0].statusCode).toBe(400)
      expect(mockNext.mock.calls[0][0].details.length).toBe(2) // Two validation errors
    })

    test('should skip body validation when schema.body is not defined', () => {
      // Arrange
      const schema = {}
      const req = { body: { invalid: 'data' } }
      const res = {}

      // Act
      validate(schema)(req, res, mockNext)

      // Assert
      expect(mockNext).toHaveBeenCalledTimes(1)
      expect(mockNext).not.toHaveBeenCalledWith(expect.any(Error))
    })
  })

  // Test case for query validation
  describe('Query validation', () => {
    test('should pass with valid query parameters', () => {
      // Arrange
      const schema = {
        query: Joi.object({
          page: Joi.number().integer().min(1),
          limit: Joi.number().integer().min(1).max(100),
        }),
      }
      const req = { query: { page: 1, limit: 20 } }
      const res = {}

      // Act
      validate(schema)(req, res, mockNext)

      // Assert
      expect(mockNext).toHaveBeenCalledTimes(1)
      expect(mockNext).not.toHaveBeenCalledWith(expect.any(Error))
    })

    test('should fail with invalid query parameters', () => {
      // Arrange
      const schema = {
        query: Joi.object({
          page: Joi.number().integer().min(1),
          limit: Joi.number().integer().min(1).max(100),
        }),
      }
      const req = { query: { page: 0, limit: 200 } }
      const res = {}

      // Act
      validate(schema)(req, res, mockNext)

      // Assert
      expect(mockNext).toHaveBeenCalledTimes(1)
      expect(mockNext).toHaveBeenCalledWith(expect.any(SpecificError))
      expect(mockNext.mock.calls[0][0].statusCode).toBe(400)
      expect(mockNext.mock.calls[0][0].details.length).toBe(2) // Two validation errors
    })
  })

  // Test case for params validation
  describe('Params validation', () => {
    test('should pass with valid params', () => {
      // Arrange
      const schema = {
        params: Joi.object({
          id: Joi.number().integer().required(),
        }),
      }
      const req = { params: { id: 123 } }
      const res = {}

      // Act
      validate(schema)(req, res, mockNext)

      // Assert
      expect(mockNext).toHaveBeenCalledTimes(1)
      expect(mockNext).not.toHaveBeenCalledWith(expect.any(Error))
    })

    test('should fail with invalid params', () => {
      // Arrange
      const schema = {
        params: Joi.object({
          id: Joi.number().integer().required(),
        }),
      }
      const req = { params: { id: 'abc' } }
      const res = {}

      // Act
      validate(schema)(req, res, mockNext)

      // Assert
      expect(mockNext).toHaveBeenCalledTimes(1)
      expect(mockNext).toHaveBeenCalledWith(expect.any(SpecificError))
      expect(mockNext.mock.calls[0][0].statusCode).toBe(400)
      expect(mockNext.mock.calls[0][0].details.length).toBe(1) // One validation error
    })
  })

  // Test case for multiple validation types
  describe('Combined validations', () => {
    test('should validate body, query and params together', () => {
      // Arrange
      const schema = {
        body: Joi.object({
          name: Joi.string().required(),
        }),
        query: Joi.object({
          page: Joi.number().integer().min(1),
        }),
        params: Joi.object({
          id: Joi.number().integer().required(),
        }),
      }
      const req = {
        body: { name: 'John' },
        query: { page: 1 },
        params: { id: 123 },
      }
      const res = {}

      // Act
      validate(schema)(req, res, mockNext)

      // Assert
      expect(mockNext).toHaveBeenCalledTimes(1)
      expect(mockNext).not.toHaveBeenCalledWith(expect.any(Error))
    })

    test('should collect all validation errors from body, query and params', () => {
      // Arrange
      const schema = {
        body: Joi.object({
          name: Joi.string().required(),
        }),
        query: Joi.object({
          page: Joi.number().integer().min(1),
        }),
        params: Joi.object({
          id: Joi.number().integer().required(),
        }),
      }
      const req = {
        body: { name: '' },
        query: { page: 0 },
        params: { id: 'abc' },
      }
      const res = {}

      // Act
      validate(schema)(req, res, mockNext)

      // Assert
      expect(mockNext).toHaveBeenCalledTimes(1)
      expect(mockNext).toHaveBeenCalledWith(expect.any(SpecificError))
      expect(mockNext.mock.calls[0][0].statusCode).toBe(400)
      expect(mockNext.mock.calls[0][0].details.length).toBe(3) // Three validation errors

      // Verify the error details contain the correct locations
      const errorDetails = mockNext.mock.calls[0][0].details
      expect(errorDetails.some((err) => err.location === 'body')).toBe(true)
      expect(errorDetails.some((err) => err.location === 'query')).toBe(true)
      expect(errorDetails.some((err) => err.location === 'params')).toBe(true)
    })
  })

  // Test error handling
  describe('Error handling', () => {
    test('should handle thrown errors and pass them to next', () => {
      // Arrange
      const schema = {
        body: {
          validate: () => {
            throw new Error('Unexpected error')
          },
        },
      }
      const req = { body: {} }
      const res = {}

      // Act
      validate(schema)(req, res, mockNext)

      // Assert
      expect(mockNext).toHaveBeenCalledTimes(1)
      expect(mockNext).toHaveBeenCalledWith(expect.any(Error))
    })
  })
})
>>>>>>> 627466f638de697919d077ca56524377d406840d
