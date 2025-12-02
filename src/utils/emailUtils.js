<<<<<<< HEAD
import nodemailer from 'nodemailer'
import { log } from './logger.js'

// Configure nodemailer with proper error handling
const transporter = (() => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    log.warn('Email credentials not configured.')
    return null
  }

  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  })
})()

/**
 * Sends an email using the configured mail transporter
 * @param {Object} mailOptions - The mail options object
 * @returns {Promise<Object>} The result of the send operation
 * @throws {Error} If email service is not configured or sending fails
 */
export const sendEmail = async (mailOptions) => {
  if (!transporter) {
    throw new Error('Email service not configured')
  }

  try {
    return await transporter.sendMail(mailOptions)
  } catch (error) {
    log.error('Failed to send email:', { error: error.message, to: mailOptions.to })
    throw new Error('Failed to send email: ' + error.message)
  }
}
=======
import nodemailer from 'nodemailer'
import { log } from './logger.js'

// Configure nodemailer with proper error handling
const transporter = (() => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    log.warn('Email credentials not configured.')
    return null
  }

  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  })
})()

/**
 * Sends an email using the configured mail transporter
 * @param {Object} mailOptions - The mail options object
 * @returns {Promise<Object>} The result of the send operation
 * @throws {Error} If email service is not configured or sending fails
 */
export const sendEmail = async (mailOptions) => {
  if (!transporter) {
    throw new Error('Email service not configured')
  }

  try {
    return await transporter.sendMail(mailOptions)
  } catch (error) {
    log.error('Failed to send email:', { error: error.message, to: mailOptions.to })
    throw new Error('Failed to send email: ' + error.message)
  }
}
>>>>>>> 627466f638de697919d077ca56524377d406840d
