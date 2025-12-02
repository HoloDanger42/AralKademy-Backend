<<<<<<< HEAD
import Joi from 'joi'

export const passwordlessAuthSchemas = {
  magicLinkRequest: Joi.object({
    email: Joi.string().email().required().messages({
      'string.email': 'Please enter a valid email address',
      'any.required': 'Email is required',
    }),
  }),

  codeRequest: Joi.object({
    email: Joi.string().email().required().messages({
      'string.email': 'Please enter a valid email address',
      'any.required': 'Email is required',
    }),
  }),

  tokenVerification: Joi.object({
    token: Joi.string().required().messages({
      'any.required': 'Token is required',
    }),
  }),
}
=======
import Joi from 'joi'

export const passwordlessAuthSchemas = {
  magicLinkRequest: Joi.object({
    email: Joi.string().email().required().messages({
      'string.email': 'Please enter a valid email address',
      'any.required': 'Email is required',
    }),
  }),

  codeRequest: Joi.object({
    email: Joi.string().email().required().messages({
      'string.email': 'Please enter a valid email address',
      'any.required': 'Email is required',
    }),
  }),

  tokenVerification: Joi.object({
    token: Joi.string().required().messages({
      'any.required': 'Token is required',
    }),
  }),
}
>>>>>>> 627466f638de697919d077ca56524377d406840d
