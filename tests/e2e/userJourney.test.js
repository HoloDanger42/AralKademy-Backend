import request from 'supertest'
import app from '../../src/server.js'
import { sequelize } from '../../src/config/database.js'
import { School, User, Admin } from '../../src/models/index.js'
import bcrypt from 'bcryptjs'

describe('User Journey End-to-End Tests', () => {
  let server
  let testSchool
  let adminToken

  beforeAll(async () => {
    await sequelize.sync({ force: true })

    // Create test school
    testSchool = await School.create({
      school_id: Math.floor(10000 + Math.random() * 90000),
      name: 'E2E Test School',
      address: '123 E2E St., Test City',
      contact_no: '02-8123-4567',
    })

    // Create an admin user
    const hashedPassword = await bcrypt.hash('AdminPass123!', 10)
    const adminUser = await User.create({
      email: 'admin@e2etest.com',
      password: hashedPassword,
      first_name: 'Admin',
      last_name: 'User',
      role: 'admin',
      birth_date: new Date('1990-01-01'),
      contact_no: '09123456789',
      school_id: testSchool.school_id,
    })

    await Admin.create({ user_id: adminUser.id })

    server = app.listen()

    // Login as admin to get token
    const loginResponse = await request(server).post('/api/auth/login').send({
      email: 'admin@e2etest.com',
      password: 'AdminPass123!',
      captchaResponse: 'test-captcha-token',
    })

    adminToken = loginResponse.body.token
  })

  afterAll(async () => {
    await sequelize.close()
    server.close()
  })

  test('Complete enrollment to approval flow', async () => {
    // Step 1: Student creates enrollment application
    const email = `student${Date.now()}@e2etest.com`
    const enrollResponse = await request(server).post('/api/enrollments').send({
      email,
      password: 'StudentPass123!',
      confirm_password: 'StudentPass123!',
      first_name: 'E2E',
      last_name: 'Student',
      birth_date: '2000-01-01',
      contact_no: '09876543210',
      school_id: testSchool.school_id,
      year_level: 3,
    })

    expect(enrollResponse.status).toBe(201)
    const enrollmentId = enrollResponse.body.enrollment.enrollment_id

    // Step 2: Check enrollment status
    const checkStatusResponse = await request(server)
      .post('/api/enrollments/check-status')
      .send({ email })

    expect(checkStatusResponse.status).toBe(200)
    expect(checkStatusResponse.body.status).toBe('pending')

    // Step 3: Admin approves the enrollment
    const approveResponse = await request(server)
      .patch(`/api/enrollments/${enrollmentId}/approve`)
      .set('Authorization', `Bearer ${adminToken}`)

    expect(approveResponse.status).toBe(200)
    expect(approveResponse.body.status).toBe('approved')

    // Step 4: Student logs in with created account
    const loginResponse = await request(server).post('/api/auth/login').send({
      email,
      password: 'StudentPass123!',
      captchaResponse: 'test-captcha-token',
    })

    expect(loginResponse.status).toBe(200)
    expect(loginResponse.body).toHaveProperty('token')
  })
})
