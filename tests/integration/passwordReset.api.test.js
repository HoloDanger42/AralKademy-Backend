import request from 'supertest'
import app from '../../src/server.js'
import bcrypt from 'bcryptjs'
import { sequelize } from '../../src/config/database.js'
import { User, School } from '../../src/models/index.js'
import UserService from '../../src/services/userService.js'

describe('Password Reset Flow', () => {
  let server
  let testSchool
  let userService
  let testUser
  let resetCode

  beforeAll(async () => {
    await sequelize.sync({ force: true })

    testSchool = await School.create({
      school_id: Math.floor(10000 + Math.random() * 90000),
      name: 'Reset Test School',
      address: '123 Reset St., Test City',
      contact_no: '02-8123-4567',
    })

    const hashedPassword = await bcrypt.hash('OldPass123', 10)
    testUser = await User.create({
      email: 'reset@pwtest.com',
      password: hashedPassword,
      first_name: 'Reset',
      last_name: 'User',
      role: 'teacher',
      birth_date: new Date('1990-01-01'),
      contact_no: '09123456789',
      school_id: testSchool.school_id,
    })

    userService = new UserService(
      sequelize.models.User,
      sequelize.models.Teacher,
      sequelize.models.Admin,
      sequelize.models.StudentTeacher,
      sequelize.models.Learner,
      sequelize.models.Enrollment,
      sequelize.models.Course,
      sequelize.models.Group,
      sequelize.models.School,
      sequelize.models.Blacklist
    )

    server = app.listen()
  })

  afterAll(async () => {
    await sequelize.close()
    server.close()
  })

  test('Complete password reset flow', async () => {
    // Step 1: Request password reset (skip actual email sending)
    resetCode = await userService.forgotPassword('reset@pwtest.com', true)

    // Step 2: Verify the reset code
    const verifyResponse = await request(server).post('/api/users/verify-reset-code').send({
      email: 'reset@pwtest.com',
      code: resetCode,
    })

    expect(verifyResponse.status).toBe(200)

    // Step 3: Reset the password
    const resetResponse = await request(server).post('/api/users/reset-password').send({
      email: 'reset@pwtest.com',
      password: 'NewPass123!',
    })

    expect(resetResponse.status).toBe(200)

    // Step 4: Try logging in with new password
    const loginResponse = await request(server).post('/api/auth/login').send({
      email: 'reset@pwtest.com',
      password: 'NewPass123!',
      captchaResponse: 'test-captcha-token',
    })

    expect(loginResponse.status).toBe(200)
    expect(loginResponse.body).toHaveProperty('token')
  })
})
