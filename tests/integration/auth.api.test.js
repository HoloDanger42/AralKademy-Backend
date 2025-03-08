import request from 'supertest'
import app from '../../src/server.js'
import { sequelize } from '../../src/config/database.js'
import { User, School } from '../../src/models/index.js'
import jwt from 'jsonwebtoken'
import config from '../../src/config/config.js'
import { hashPassword } from '../../src/utils/passwordUtils.js'

describe('Token Refresh API', () => {
  let testUser
  let testSchool
  let accessToken
  let refreshToken

  beforeAll(async () => {
    await sequelize.sync({ force: true })

    // Create a test school first
    testSchool = await School.create({
      school_id: Math.floor(10000 + Math.random() * 90000),
      name: 'Test School',
      address: '123 Test St., Test City',
      contact_no: '02-8123-4567',
    })

    // Create a test user
    const hashedPassword = await hashPassword('Password123!')
    testUser = await User.create({
      email: 'refresh-test@example.com',
      password: hashedPassword,
      first_name: 'Test',
      last_name: 'User',
      role: 'learner',
      school_id: testSchool.school_id,
    })

    // Generate initial tokens
    accessToken = jwt.sign(
      { userId: testUser.id, email: testUser.email, role: testUser.role },
      config.jwt.accessTokenSecret,
      { expiresIn: config.jwt.accessTokenExpiry }
    )

    refreshToken = jwt.sign({ userId: testUser.id }, config.jwt.refreshTokenSecret, {
      expiresIn: config.jwt.refreshTokenExpiry,
    })

    // Store refresh token in user record
    await testUser.update({ refreshToken: refreshToken })
  })

  afterAll(async () => {
    // Clean up test data
    await User.destroy({ where: { email: 'refresh-test@example.com' } })
    await School.destroy({ where: { name: 'Test School' } })

    // Close database connection
    await sequelize.close()
  })

  test('should return new access token when valid refresh token is provided', async () => {
    console.log('Test is sending refresh token:', refreshToken)
    const response = await request(app).post('/api/auth/refresh').send({ refreshToken }).expect(200)

    console.log('Status:', response.status)
    console.log('Response body:', response.body)

    expect(response.body).toHaveProperty('accessToken')
    expect(response.body.accessToken).not.toBe(accessToken)
    expect(response.body).toHaveProperty('message', 'Token refreshed successfully')
  })

  test('should reject with 401 when invalid refresh token is provided', async () => {
    await request(app).post('/api/auth/refresh').send({ refreshToken: 'invalid-token' }).expect(401)
  })

  test('should reject with 400 when refresh token is not provided', async () => {
    await request(app).post('/api/auth/refresh').send({}).expect(400)
  })

  test('should reject with 401 when user has no stored refresh token', async () => {
    // Remove refresh token from user
    await testUser.update({ refreshToken: null })

    await request(app).post('/api/auth/refresh').send({ refreshToken }).expect(401)

    // Restore refresh token for other tests
    await testUser.update({ refreshToken })
  })
})
