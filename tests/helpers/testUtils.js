import jwt from 'jsonwebtoken'
import { User } from '../../src/models/User.js'
import bcrypt from 'bcryptjs'

/**
 * Generates a JWT token for a given user.
 * @param {Object} user - The user object.
 * @returns {string} The JWT token.
 */
export const generateToken = (user) => {
  return jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '1h' })
}

/**
 * Creates and returns a hashed password.
 * @param {string} password - The plain text password.
 * @returns {Promise<string>} Hashed password.
 */
export const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10)
  return await bcrypt.hash(password, salt)
}

/**
 * Finds a user by email.
 * @param {string} email - The user's email.
 * @returns {Promise<Object>} User object.
 */
export const findUserByEmail = async (email) => {
  return await User.findOne({ where: { email } })
}

/**
 * Validates that the response has the expected status and structure.
 * @param {Object} response - The response object.
 * @param {number} status - Expected HTTP status code.
 * @param {Object} data - Expected data structure.
 */
export const validateResponse = (response, status, data) => {
  expect(response.status).toBe(status)
  expect(response.body).toMatchObject(data)
}
