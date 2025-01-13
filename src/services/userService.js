import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { User } from '../models/User.js'

class UserService {
  async createUser(username, email, password) {
    try {
      const hashedPassword = await bcrypt.hash(password, 10)
      return await User.create({
        username,
        email,
        password: hashedPassword,
      })
    } catch (error) {
      if (error.name === 'SequelizeUniqueConstraintError') {
        if (error.errors[0].path === 'email') {
          throw new Error('Email already exists')
        }
        if (error.errors[0].path === 'username') {
          throw new Error('Username already exists')
        }
      }
      throw error
    }
  }

  async loginUser(email, password) {
    const user = await User.findOne({ where: { email } })
    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new Error('Invalid credentials')
    }

    const token = jwt.sign({ email }, process.env.JWT_SECRET, {
      expiresIn: '1h',
    })

    return { user, token }
  }

  async getAllUsers() {
    return await User.findAll()
  }
}

export default UserService
