import UserService from '../services/userService.js'
import { User } from '../models/User.js'
import { log } from '../utils/logger.js'

const userService = new UserService(User)

const signup = async (req, res) => {
  try {
    const { username, password, email } = req.body

    const newUser = await userService.createUser(username, email, password)

    res.status(201).json({
      message: 'User created successfully',
      user: newUser,
    })
    log.info(`User ${username} was successfully created`)
  } catch (error) {
    log.error('Signup error:', error)
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({
        message: 'Username or email already exists',
      })
    }
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({ message: error.message })
    }
    return res.status(500).json({ message: 'Error creating user' })
  }
}

const login = async (req, res) => {
  try {
    const { email, password } = req.body
    const { user, token } = await userService.loginUser(email, password)

    res.status(200).json({
      message: 'Logged in successfully',
      token,
      user,
    })
    log.info(`User ${email} logged in successfully`)
  } catch (error) {
    log.error('Login error:', error)
    return res.status(500).json({ message: 'Authentication failed' })
  }
}

const getAllUsers = async (_req, res) => {
  try {
    const users = await userService.getAllUsers()
    res.status(200).json(users)
    log.info('Retrieved all users')
  } catch (error) {
    log.error('Get all users error:', error)
    return res.status(500).json({ message: 'Failed to retrieve users' })
  }
}

export { signup, login, getAllUsers }
