import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

class UserService {
  constructor(UserModel) {
    this.UserModel = UserModel
  }

  async createUser(username, email, password) {
    try {
      const hashedPassword = await bcrypt.hash(password, 10)
      return await this.UserModel.create({
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
    const user = await this.UserModel.findOne({ where: { email } })
    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new Error('Invalid credentials')
    }

    const token = jwt.sign({ email }, process.env.JWT_SECRET, {
      expiresIn: '1h',
    })

    return { user, token }
  }

  async getAllUsers() {
    return await this.UserModel.findAll()
  }
}

export default UserService
