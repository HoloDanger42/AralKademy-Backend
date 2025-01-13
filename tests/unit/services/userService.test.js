import { jest } from '@jest/globals'
import UserService from '../../../src/services/userService.js'
import { User } from '../../../src/models/User.js'
import { validUsers } from '../../fixtures/userData.js'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

// Set environment variable for JWT secret
process.env.JWT_SECRET = 'testsecret'

describe('User Service', () => {
  let userService

  beforeAll(async () => {
    await User.sync({ force: true })
  })

  afterAll(async () => {
    await User.sync({ force: true })
  })

  afterEach(async () => {
    await User.destroy({ where: {} })
    jest.clearAllMocks()
  })

  beforeEach(() => {
    userService = new UserService()
    jest.clearAllMocks()
  })

  describe('createUser', () => {
    test('should create a user successfully with hashed password', async () => {
      // Arrange
      const userData = validUsers[0]
      jest.spyOn(bcrypt, 'hash').mockResolvedValue('hashedpassword')

      // Act
      const user = await userService.createUser(
        userData.username,
        userData.email,
        userData.password
      )

      // Assert
      expect(bcrypt.hash).toHaveBeenCalledWith(userData.password, 10)
      expect(user).toHaveProperty('id')
      expect(user.username).toBe(userData.username)
      expect(user.email).toBe(userData.email)
      expect(user.password).toBe('hashedpassword')
    })

    test('should throw an error when creating a user with existing email', async () => {
      // Arrange
      const userData = validUsers[0]
      await userService.createUser(userData.username, userData.email, userData.password)

      // Act & Assert
      await expect(
        userService.createUser('new_user', userData.email, 'newpassword')
      ).rejects.toThrow('Email already exists')
    })

    test('should throw an error when creating a user with existing username', async () => {
      // Arrange
      const userData = validUsers[0]
      await userService.createUser(userData.username, 'newemail@example.com', userData.password)

      // Act & Assert
      await expect(
        userService.createUser(userData.username, 'anotheremail@example.com', 'anotherpassword')
      ).rejects.toThrow('Username already exists')
    })
  })

  describe('loginUser', () => {
    test('should login a user successfully and return user and token', async () => {
      // Arrange
      const userData = validUsers[0]
      const hashedPassword = await bcrypt.hash(userData.password, 10)
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true)
      jest.spyOn(jwt, 'sign').mockReturnValue('mockedtoken')
      await userService.createUser(userData.username, userData.email, userData.password)

      // Act
      const response = await userService.loginUser(userData.email, userData.password)

      // Assert
      expect(bcrypt.compare).toHaveBeenCalledWith(userData.password, hashedPassword)
      expect(jwt.sign).toHaveBeenCalledWith({ email: userData.email }, process.env.JWT_SECRET, {
        expiresIn: '1h',
      })
      expect(response).toHaveProperty('user')
      expect(response).toHaveProperty('token', 'mockedtoken')
    })

    test('should throw "Invalid credentials" if user does not exist', async () => {
      // Act & Assert
      await expect(userService.loginUser('nonexistent@example.com', 'password123')).rejects.toThrow(
        'Invalid credentials'
      )
    })

    test('should throw "Invalid credentials" if password is incorrect', async () => {
      // Arrange
      const userData = validUsers[0]
      const hashedPassword = await bcrypt.hash(userData.password, 10)
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false)
      await userService.createUser(userData.username, userData.email, hashedPassword)

      // Act & Assert
      await expect(userService.loginUser(userData.email, 'wrongpassword')).rejects.toThrow(
        'Invalid credentials'
      )
    })
  })

  describe('getAllUsers', () => {
    test('should return all users', async () => {
      // Arrange
      await userService.createUser(
        validUsers[0].username,
        validUsers[0].email,
        validUsers[0].password
      )
      await userService.createUser(
        validUsers[1].username,
        validUsers[1].email,
        validUsers[1].password
      )

      // Act
      const users = await userService.getAllUsers()

      // Assert
      expect(users.length).toBe(2)
      expect(users[0].username).toBe(validUsers[0].username)
      expect(users[1].username).toBe(validUsers[1].username)
    })

    test('should return an empty array when no users exist', async () => {
      // Act
      const users = await userService.getAllUsers()

      // Assert
      expect(users).toEqual([])
    })
  })
})
