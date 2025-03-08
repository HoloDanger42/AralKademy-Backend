import Joi from 'joi'

export const authSchemas = {
  login: {
    body: Joi.object({
      email: Joi.string().email().required().messages({
        'string.email': 'Please enter a valid email address',
        'any.required': 'Email is required',
      }),
      password: Joi.string().required().messages({
        'any.required': 'Password is required',
      }),
      captchaResponse: Joi.string().when('$recaptchaEnabled', {
        is: true,
        then: Joi.required(),
        otherwise: Joi.optional(),
      }),
    }),
  },

  refreshToken: {
    body: Joi.object({
      refreshToken: Joi.string().required().messages({
        'any.required': 'Refresh token is required',
      }),
    }),
  },
}
