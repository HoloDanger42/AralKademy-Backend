import Joi from 'joi'

export const passwordlessAuthSchemas = {
  magicLinkRequest: Joi.object({
    email: Joi.string().email().required().messages({
      'string.email': 'Please enter a valid email address',
      'any.required': 'Email is required',
    }),
  }),

  codeRequest: Joi.object({
    identifier: Joi.string().required().messages({
      'any.required': 'Student ID or username is required',
    }),
  }),

  tokenVerification: Joi.object({
    token: Joi.string().required().messages({
      'any.required': 'Token is required',
    }),
  }),
}
