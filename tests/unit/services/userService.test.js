import { jest } from '@jest/globals'
import UserService from '../../../src/services/userService.js'
import { validUsers } from '../../fixtures/userData.js'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

// Set environment variable for JWT secret
process.env.JWT_SECRET = 'testsecret'

const mockUserModel = {
  create: jest.fn(),
  findOne: jest.fn(),
  findAll: jest.fn(),
}

describe('User Service', () => {
  let userService

  beforeEach(() => {
    userService = new UserService(mockUserModel)
    jest.resetAllMocks()
  })

  describe('createUser', () => {
    test('should create a user successfully with hashed password', async () => {
      // Arrange
      const userData = validUsers[0]
      jest.spyOn(bcrypt, 'hash').mockResolvedValue('hashedpassword')
      mockUserModel.create.mockResolvedValue({ id: 1, ...userData, password: 'hashedpassword' })

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

      mockUserModel.create.mockRejectedValueOnce({
        name: 'SequelizeUniqueConstraintError',
        errors: [
          {
            path: 'email',
            message: 'email must be unique',
          },
        ],
      })

      // Act & Assert
      await expect(
        userService.createUser('new_user', userData.email, 'newpassword')
      ).rejects.toThrow('Email already exists')
    })

    test('should throw an error when creating a user with existing username', async () => {
      // Arrange
      const userData = validUsers[0]
      mockUserModel.create.mockRejectedValueOnce({
        name: 'SequelizeUniqueConstraintError',
        errors: [
          {
            path: 'username',
            message: 'username must be unique',
          },
        ],
      })

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
      jest.spyOn(bcrypt, 'hash').mockResolvedValue('hashedpassword')

      mockUserModel.findOne.mockResolvedValue({
        id: 1,
        ...userData,
        password: 'hashedPassword',
      })

      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true)
      jest.spyOn(jwt, 'sign').mockImplementation((payload, secret, options) => {
        expect(payload).toEqual({ email: userData.email })
        expect(secret).toBe(process.env.JWT_SECRET)
        expect(options).toEqual({ expiresIn: '1h' })

        return 'mockedToken'
      })

      // Act
      const response = await userService.loginUser(userData.email, userData.password)

      // Assert
      expect(mockUserModel.findOne).toHaveBeenCalledWith({
        where: { email: userData.email },
      })
      expect(bcrypt.compare).toHaveBeenCalledWith(userData.password, 'hashedPassword')
      expect(jwt.sign).toHaveBeenCalledWith({ email: userData.email }, process.env.JWT_SECRET, {
        expiresIn: '1h',
      })
      expect(response).toEqual({
        user: expect.objectContaining({
          id: 1,
          email: userData.email,
          username: userData.username,
        }),
        token: 'mockedToken',
      })
    })

    test('should throw "Invalid credentials" if user does not exist', async () => {
      mockUserModel.findOne.mockResolvedValue(null)

      // Act & Assert
      await expect(userService.loginUser('nonexistent@example.com', 'password123')).rejects.toThrow(
        'Invalid credentials'
      )

      expect(mockUserModel.findOne).toHaveBeenCalledWith({
        where: { email: 'nonexistent@example.com' },
      })
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
      const expectedUsers = [
        { ...validUsers[0], id: 1 },
        { ...validUsers[1], id: 2 },
      ]

      mockUserModel.findAll.mockResolvedValue(expectedUsers)

      // Act
      const users = await userService.getAllUsers()

      // Assert
      expect(users.length).toBe(2)
      expect(users[0].username).toBe(validUsers[0].username)
      expect(users[1].username).toBe(validUsers[1].username)
    })

    test('should return an empty array when no users exist', async () => {
      // Arrange
      mockUserModel.findAll.mockResolvedValue([])

      // Act
      const users = await userService.getAllUsers()

      // Assert
      expect(users).toEqual([])
      expect(mockUserModel.findAll).toHaveBeenCalled()
    })
  })
})
