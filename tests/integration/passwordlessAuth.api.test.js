import request from 'supertest'
import app from '../../src/server.js'
import { sequelize } from '../../src/config/database.js'
import { User, AuthToken, School } from '../../src/models/index.js'
import { hashPassword } from '../../src/utils/passwordUtils.js'
import '../../src/models/associate.js'

describe('Passwordless Authentication API', () => {
  let server
  let testSchool
  let testTeacher
  let testStudent
  let magicLinkToken
  let numericToken
  let pictureToken

  beforeAll(async () => {
    await sequelize.sync({ force: true })

    // Create a test school
    testSchool = await School.create({
      school_id: Math.floor(10000 + Math.random() * 90000),
      name: 'Passwordless Test School',
      address: '123 Test St., Test City',
      contact_no: '02-8123-4567',
    })

    // Create a test teacher
    const hashedPassword = await hashPassword('Password123!')
    testTeacher = await User.create({
      email: 'teacher@passwordlesstest.com',
      password: hashedPassword,
      first_name: 'Teacher',
      last_name: 'Test',
      role: 'teacher',
      school_id: testSchool.school_id,
    })

    // Create a test student
    testStudent = await User.create({
      email: 'student@passwordlesstest.com',
      password: hashedPassword,
      first_name: 'Student',
      last_name: 'Test',
      role: 'learner',
      school_id: testSchool.school_id,
    })

    server = app.listen()
  })

  afterAll(async () => {
    await sequelize.close()
    server.close()
  })

  describe('POST /api/auth/passwordless/magic-link', () => {
    test('should generate a magic link when email is valid', async () => {
      const response = await request(server)
        .post('/api/auth/passwordless/magic-link')
        .send({ email: 'teacher@passwordlesstest.com' })

      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('message', 'Login link sent to your email')

      // Verify a token was created in the database
      const token = await AuthToken.findOne({
        where: {
          userId: testTeacher.id,
          type: 'magic_link',
        },
      })

      expect(token).toBeTruthy()
      magicLinkToken = token.token
    })

    test('should return 404 when email is not found', async () => {
      const response = await request(server)
        .post('/api/auth/passwordless/magic-link')
        .send({ email: 'nonexistent@example.com' })

      expect(response.status).toBe(404)
      expect(response.body.error).toHaveProperty('message', 'User not found')
    })

    test('should return 400 when email is not provided', async () => {
      const response = await request(server).post('/api/auth/passwordless/magic-link').send({})

      expect(response.status).toBe(400)
      expect(response.body.error).toBeTruthy()
    })
  })

  describe('POST /api/auth/passwordless/numeric-code', () => {
    test('should generate a numeric code when identifier is valid', async () => {
      const response = await request(server)
        .post('/api/auth/passwordless/numeric-code')
        .send({ identifier: testStudent.email })

      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('message', 'Login code generated successfully')
      expect(response.body).toHaveProperty('code')
      expect(response.body).toHaveProperty('qrCode')

      // Store the numeric code for later verification test
      numericToken = response.body.code
    })

    test('should return 404 when identifier is not found', async () => {
      const response = await request(server)
        .post('/api/auth/passwordless/numeric-code')
        .send({ identifier: 'NONEXISTENT' })

      expect(response.status).toBe(404)
    })
  })

  describe('POST /api/auth/passwordless/picture-code', () => {
    test('should generate a picture code when identifier is valid', async () => {
      const response = await request(server)
        .post('/api/auth/passwordless/picture-code')
        .send({ identifier: testStudent.email })

      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('message', 'Picture code generated successfully')
      expect(response.body).toHaveProperty('pictureCode')
      expect(response.body).toHaveProperty('pictures')
      expect(response.body.pictures).toBeInstanceOf(Array)
      expect(response.body.pictures.length).toBe(3)

      // Store the picture code for later verification test
      pictureToken = response.body.pictureCode
    })
  })

  describe('POST /api/auth/passwordless/verify', () => {
    test('should verify magic link token and return JWT tokens', async () => {
      const response = await request(server)
        .post('/api/auth/passwordless/verify')
        .send({ token: magicLinkToken })

      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('message', 'Login successful')
      expect(response.body).toHaveProperty('token')
      expect(response.body).toHaveProperty('refreshToken')
      expect(response.body).toHaveProperty('user')
      expect(response.body.user).toHaveProperty('email', 'teacher@passwordlesstest.com')

      // Check that the token was marked as used
      const usedToken = await AuthToken.findOne({ where: { token: magicLinkToken } })
      expect(usedToken.used).toBe(true)
    })

    test('should verify numeric code and return JWT tokens', async () => {
      const response = await request(server)
        .post('/api/auth/passwordless/verify')
        .send({ token: numericToken })

      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('token')
      expect(response.body.user).toHaveProperty('email', 'student@passwordlesstest.com')
    })

    test('should verify picture code and return JWT tokens', async () => {
      const response = await request(server)
        .post('/api/auth/passwordless/verify')
        .send({ token: pictureToken })

      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('token')
    })

    test('should return 401 when token is invalid', async () => {
      const response = await request(server)
        .post('/api/auth/passwordless/verify')
        .send({ token: 'invalid-token' })

      expect(response.status).toBe(401)
      expect(response.body.error).toHaveProperty('message', 'Invalid or expired token')
    })

    test('should return 401 when token is already used', async () => {
      // Try to use the magic link token again (which was already used in a previous test)
      const response = await request(server)
        .post('/api/auth/passwordless/verify')
        .send({ token: magicLinkToken })

      expect(response.status).toBe(401)
    })
  })

  test('Complete passwordless authentication flow', async () => {
    // Step 1: Request a magic link
    const magicLinkResponse = await request(server)
      .post('/api/auth/passwordless/magic-link')
      .send({ email: 'teacher@passwordlesstest.com' })

    expect(magicLinkResponse.status).toBe(200)

    // Get the token from the database directly
    const authToken = await AuthToken.findOne({
      where: {
        userId: testTeacher.id,
        type: 'magic_link',
        used: false,
      },
      order: [['createdAt', 'DESC']],
    })

    expect(authToken).toBeTruthy()

    // Step 2: Verify the token
    const verifyResponse = await request(server)
      .post('/api/auth/passwordless/verify')
      .send({ token: authToken.token })

    expect(verifyResponse.status).toBe(200)
    expect(verifyResponse.body).toHaveProperty('token')

    const jwt = verifyResponse.body.token

    // Step 3: Use the JWT to access a protected resource
    const protectedResponse = await request(server)
      .get('/api/courses')
      .set('Authorization', `Bearer ${jwt}`)

    expect(protectedResponse.status).toBe(200)
  })
})
