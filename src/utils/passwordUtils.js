<<<<<<< HEAD
import bcrypt from 'bcryptjs'

/**
 * Hashes a password using bcrypt
 * @param {string} password - The plain text password to hash
 * @param {number} saltRounds - Number of salt rounds for bcrypt (defaults to 10)
 * @returns {Promise<string>} - The hashed password
 */
export const hashPassword = async (password, saltRounds = 10) => {
  return await bcrypt.hash(password, saltRounds)
}

/**
 * Compares a plain text password with a hashed password
 * @param {string} password - The plain text password to check
 * @param {string} hashedPassword - The hashed password to compare against
 * @returns {Promise<boolean>} - True if passwords match, false otherwise
 */
export const comparePassword = async (password, hashedPassword) => {
  return await bcrypt.compare(password, hashedPassword)
}

/**
 * Validates password strength
 * Password must:
 * - Be at least 8 characters long
 * - Contain at least one uppercase letter
 * - Contain at least one lowercase letter
 * - Contain at least one number
 * - Contain at least one special character
 *
 * @param {string} password - The password to validate
 * @returns {boolean} - True if password meets requirements
 */
export const validatePassword = (password) => {
  if (!password || typeof password !== 'string') {
    return false
  }

  // Password must be at least 8 characters
  if (password.length < 8) {
    return false
  }

  // Check for uppercase letter
  if (!/[A-Z]/.test(password)) {
    return false
  }

  // Check for lowercase letter
  if (!/[a-z]/.test(password)) {
    return false
  }

  // Check for number
  if (!/[0-9]/.test(password)) {
    return false
  }

  // Check for special character
  if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) {
    return false
  }

  return true
}
=======
import bcrypt from 'bcryptjs'

/**
 * Hashes a password using bcrypt
 * @param {string} password - The plain text password to hash
 * @param {number} saltRounds - Number of salt rounds for bcrypt (defaults to 10)
 * @returns {Promise<string>} - The hashed password
 */
export const hashPassword = async (password, saltRounds = 10) => {
  return await bcrypt.hash(password, saltRounds)
}

/**
 * Compares a plain text password with a hashed password
 * @param {string} password - The plain text password to check
 * @param {string} hashedPassword - The hashed password to compare against
 * @returns {Promise<boolean>} - True if passwords match, false otherwise
 */
export const comparePassword = async (password, hashedPassword) => {
  return await bcrypt.compare(password, hashedPassword)
}

/**
 * Validates password strength
 * Password must:
 * - Be at least 8 characters long
 * - Contain at least one uppercase letter
 * - Contain at least one lowercase letter
 * - Contain at least one number
 * - Contain at least one special character
 *
 * @param {string} password - The password to validate
 * @returns {boolean} - True if password meets requirements
 */
export const validatePassword = (password) => {
  if (!password || typeof password !== 'string') {
    return false
  }

  // Password must be at least 8 characters
  if (password.length < 8) {
    return false
  }

  // Check for uppercase letter
  if (!/[A-Z]/.test(password)) {
    return false
  }

  // Check for lowercase letter
  if (!/[a-z]/.test(password)) {
    return false
  }

  // Check for number
  if (!/[0-9]/.test(password)) {
    return false
  }

  // Check for special character
  if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) {
    return false
  }

  return true
}
>>>>>>> 627466f638de697919d077ca56524377d406840d
