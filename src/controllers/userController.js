import UserService from '../services/userService.js'
import { User } from '../models/User.js'
import { log } from '../utils/logger.js'

const userService = new UserService(User)

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

export { login, getAllUsers }
