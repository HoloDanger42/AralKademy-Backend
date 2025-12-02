<<<<<<< HEAD
import { SpecificError } from './errorMiddleware.js'

/**
 * Creates a validation middleware function using the provided schema
 *
 * @param {Object} schema - Validation schema object with body, query, and params properties
 * @returns {Function} Express middleware function that validates request data
 */
export const validateRequest = (schema) => {
  return (req, _res, next) => {
    try {
      const errors = []

      // Validate request body if schema.body exists
      if (schema.body && req.body) {
        const { error } = schema.body.validate(req.body, { abortEarly: false })
        if (error) {
          errors.push(
            ...error.details.map((detail) => ({
              location: 'body',
              message: detail.message,
              path: detail.path,
            }))
          )
        }
      }

      // Validate query parameters if schema.query exists
      if (schema.query && req.query) {
        const { error } = schema.query.validate(req.query, { abortEarly: false })
        if (error) {
          errors.push(
            ...error.details.map((detail) => ({
              location: 'query',
              message: detail.message,
              path: detail.path,
            }))
          )
        }
      }

      // Validate URL parameters if schema.params exists
      if (schema.params && req.params) {
        const { error } = schema.params.validate(req.params, { abortEarly: false })
        if (error) {
          errors.push(
            ...error.details.map((detail) => ({
              location: 'params',
              message: detail.message,
              path: detail.path,
            }))
          )
        }
      }

      if (errors.length > 0) {
        console.log('Validation errors:', JSON.stringify(errors, null, 2))
        throw new SpecificError('Validation Error', 400, errors)
      }

      next()
    } catch (error) {
      next(error)
    }
  }
}

export const validate = validateRequest
=======
import { SpecificError } from './errorMiddleware.js'

/**
 * Creates a validation middleware function using the provided schema
 *
 * @param {Object} schema - Validation schema object with body, query, and params properties
 * @returns {Function} Express middleware function that validates request data
 */
export const validateRequest = (schema) => {
  return (req, _res, next) => {
    try {
      const errors = []

      // Validate request body if schema.body exists
      if (schema.body && req.body) {
        const { error } = schema.body.validate(req.body, { abortEarly: false })
        if (error) {
          errors.push(
            ...error.details.map((detail) => ({
              location: 'body',
              message: detail.message,
              path: detail.path,
            }))
          )
        }
      }

      // Validate query parameters if schema.query exists
      if (schema.query && req.query) {
        const { error } = schema.query.validate(req.query, { abortEarly: false })
        if (error) {
          errors.push(
            ...error.details.map((detail) => ({
              location: 'query',
              message: detail.message,
              path: detail.path,
            }))
          )
        }
      }

      // Validate URL parameters if schema.params exists
      if (schema.params && req.params) {
        const { error } = schema.params.validate(req.params, { abortEarly: false })
        if (error) {
          errors.push(
            ...error.details.map((detail) => ({
              location: 'params',
              message: detail.message,
              path: detail.path,
            }))
          )
        }
      }

      if (errors.length > 0) {
        console.log('Validation errors:', JSON.stringify(errors, null, 2))
        throw new SpecificError('Validation Error', 400, errors)
      }

      next()
    } catch (error) {
      next(error)
    }
  }
}

export const validate = validateRequest
>>>>>>> 627466f638de697919d077ca56524377d406840d
