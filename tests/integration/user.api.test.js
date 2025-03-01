import request from 'supertest'
import app from '../../src/server.js'
import bcrypt from 'bcryptjs'
import { sequelize } from '../../src/config/database.js'
import { User, School, Teacher } from '../../src/models/index.js'
import '../../src/models/associate.js'

describe('Users API Integration Tests', () => {
  let server
  let authToken = ''
  let testUserId

  beforeAll(async () => {
    await sequelize.sync({ force: true })

    const school = await School.create({
      school_id: Math.floor(10000 + Math.random() * 90000),
      name: 'Test School',
      address: '123 Test St., Test City',
      contact_no: '02-8123-4567',
    })

    // Create user after sync
    const hashedPassword = await bcrypt.hash('testPassword', 10)
    const user = await User.create({
      email: 'testUser@example.com',
      password: hashedPassword,
      first_name: 'Test',
      last_name: 'User',
      birth_date: new Date('1990-01-01'),
      contact_no: '09123456789',
      school_id: school.school_id,
      role: 'teacher',
    })
    testUserId = user.id

    // Create teacher record
    await Teacher.create({
      user_id: user.id,
    })

    server = app.listen(0)
  })

  afterAll((done) => {
    if (server && server.close) {
      server.close(done)
    } else {
      done()
    }
  })

  describe('POST /users/login', () => {
    it('should log in a user and return a valid token', async () => {
      const loginData = {
        email: 'testUser@example.com',
        password: 'testPassword',
        captchaResponse: 'test-bypass-captcha',
      }
      const res = await request(app).post('/api/users/login').send(loginData).expect(200)

      expect(res.body).toHaveProperty('token')
      authToken = res.body.token
    })
  })

  describe('GET /users', () => {
    it('should retrieve all users', async () => {
      const res = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      // Check paginated response structure
      expect(res.body).toEqual(
        expect.objectContaining({
          count: expect.any(Number),
          users: expect.any(Array),
        })
      )

      // Verify the user data
      expect(res.body.users.length).toBeGreaterThan(0)
      expect(res.body.users[0]).toEqual(
        expect.objectContaining({
          id: expect.any(Number),
          email: 'testUser@example.com',
          first_name: 'Test',
          last_name: 'User',
        })
      )
    })
  })

  describe('GET /users/:id', () => {
    it('should retrieve a specific user when authorized', async () => {
      console.log('Making request with test user ID:', testUserId)

      const res = await request(app)
        .get(`/api/users/${testUserId}`)
        .set('Authorization', `Bearer ${authToken}`)

      console.log('Response status:', res.status)
      console.log('Response body:', res.body)

      expect(res.status).toBe(200)
      expect(res.body).toEqual(
        expect.objectContaining({
          id: testUserId,
          email: expect.any(String),
          first_name: expect.any(String),
          last_name: expect.any(String),
        })
      )
    })

    it('should return 401 Unauthorized when token is missing', async () => {
      await request(app).get(`/api/users/${testUserId}`).expect(401)
    })
  })
})
