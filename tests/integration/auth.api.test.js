import request from 'supertest'
import app from '../../src/server.js'
import { sequelize } from '../../src/config/database.js'
import { User, School } from '../../src/models/index.js'
import { Op } from 'sequelize'
import jwt from 'jsonwebtoken'
import config from '../../src/config/config.js'
import { hashPassword } from '../../src/utils/passwordUtils.js'
import '../../src/models/associate.js'

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

    refreshToken = jwt.sign({ id: testUser.id }, config.jwt.refreshTokenSecret, {
      expiresIn: config.jwt.refreshTokenExpiry,
    })

    // Store refresh token in user record
    await testUser.update({ refreshToken: refreshToken })
  })

  afterAll(async () => {
    // Clean up test data
    await User.destroy({ where: { email: 'refresh-test@example.com' } })
    await School.destroy({ where: { name: 'Test School' } })
  })

  test('should return new access token when valid refresh token is provided', async () => {
    const response = await request(app).post('/api/auth/refresh').send({ refreshToken }).expect(200)

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

describe('Role-Based Access Control', () => {
  let server
  let testSchool
  // Store tokens for different user roles
  const tokens = {}

  beforeAll(async () => {
    await sequelize.sync({ force: true })

    // Create test school
    testSchool = await School.create({
      school_id: Math.floor(10000 + Math.random() * 90000),
      name: 'RBAC Test School',
      address: '123 RBAC St., Test City',
      contact_no: '02-8123-4567',
    })

    // Create users with different roles
    const roles = ['admin', 'teacher', 'student_teacher', 'learner']
    const hashedPassword = await hashPassword('Password123!')

    for (const role of roles) {
      const user = await User.create({
        email: `${role}@rbactest.com`,
        password: hashedPassword,
        first_name: role.charAt(0).toUpperCase() + role.slice(1),
        last_name: 'User',
        role: role,
        birth_date: new Date('1990-01-01'),
        contact_no: '09123456789',
        school_id: testSchool.school_id,
      })

      // Create specific role records if needed
      if (role === 'admin') {
        await sequelize.models.Admin.create({ user_id: user.id })
      } else if (role === 'teacher') {
        await sequelize.models.Teacher.create({ user_id: user.id })
      } else if (role === 'student_teacher') {
        await sequelize.models.StudentTeacher.create({
          user_id: user.id,
          section: 'A',
          department: 'Science',
        })
      } else if (role === 'learner') {
        const enrollment = await sequelize.models.Enrollment.create({
          email: `learner-enroll${Date.now()}@rbactest.com`,
          password: hashedPassword,
          first_name: 'Learner',
          last_name: 'Enrollee',
          school_id: testSchool.school_id,
          year_level: 3,
          birth_date: new Date('2000-01-01'),
          contact_no: '09123456789',
          status: 'approved',
        })

        await sequelize.models.Learner.create({
          user_id: user.id,
          year_level: 3,
          enrollment_id: enrollment.enrollment_id,
        })
      }

      // Login to get token
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: `${role}@rbactest.com`,
          password: 'Password123!',
          captchaResponse: 'test-captcha-token',
        })

      tokens[role] = response.body.token
    }

    server = app.listen()
  })

  afterAll(async () => {
    await User.destroy({ where: { email: { [Op.like]: '%@rbactest.com' } } })
    await School.destroy({ where: { name: 'RBAC Test School' } })
    await sequelize.close()
    server.close()
  })

  // Test admin-only access
  test('Admin-only routes should be accessible only by admins', async () => {
    // Admin should have access
    const adminResponse = await request(server)
      .get('/api/users')
      .set('Authorization', `Bearer ${tokens.admin}`)

    expect(adminResponse.status).toBe(200)

    // Other roles should not have access
    const teacherResponse = await request(server)
      .get('/api/users')
      .set('Authorization', `Bearer ${tokens.teacher}`)

    expect(teacherResponse.status).toBe(403)

    const learnerResponse = await request(server)
      .get('/api/users')
      .set('Authorization', `Bearer ${tokens.learner}`)

    expect(learnerResponse.status).toBe(403)
  })

  // Test teacher and admin access
  test('Teacher and admin routes should be accessible by appropriate roles', async () => {
    // Test course viewing
    const adminResponse = await request(server)
      .get('/api/courses')
      .set('Authorization', `Bearer ${tokens.admin}`)

    expect(adminResponse.status).toBe(200)

    const teacherResponse = await request(server)
      .get('/api/courses')
      .set('Authorization', `Bearer ${tokens.teacher}`)

    expect(teacherResponse.status).toBe(200)

    // Test course creation (Admin can create, teacher cannot)
    const teacherCreateResponse = await request(server)
      .post('/api/courses')
      .set('Authorization', `Bearer ${tokens.teacher}`)
      .send({
        name: 'Test Course',
        description: 'A test course',
      })

    // Teachers should not be able to create courses (only admins can)
    expect(teacherCreateResponse.status).toBe(403)

    // Learners definitely should not be able to create courses
    const learnerCreateResponse = await request(server)
      .post('/api/courses')
      .set('Authorization', `Bearer ${tokens.learner}`)
      .send({
        name: 'Unauthorized Course',
        description: 'This should not be created',
      })

    expect(learnerCreateResponse.status).toBe(403)
  })

  // Test authentication requirement
  test('Protected routes should reject unauthenticated requests', async () => {
    const response = await request(server).get('/api/courses')

    expect(response.status).toBe(401)
  })

  // Test invalid token rejection
  test('Should reject requests with invalid tokens', async () => {
    const response = await request(server)
      .get('/api/courses')
      .set('Authorization', 'Bearer invalid-token')

    expect(response.status).toBe(401)
  })

  // Test token validation endpoint
  test('Token validation should return user info for valid token', async () => {
    const response = await request(server)
      .get('/api/auth/validate')
      .set('Authorization', `Bearer ${tokens.admin}`)

    expect(response.status).toBe(200)
    expect(response.body).toHaveProperty('isValid', true)
    expect(response.body.user).toHaveProperty('role', 'admin')
  })

  // Test logout functionality
  test('Should invalidate token on logout', async () => {
    // First logout
    const logoutResponse = await request(server)
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${tokens.learner}`)

    expect(logoutResponse.status).toBe(200)

    // Then try to use the same token
    const protectedResponse = await request(server)
      .get('/api/courses')
      .set('Authorization', `Bearer ${tokens.learner}`)

    // Should be rejected as the token should be blacklisted
    expect(protectedResponse.status).toBe(401)
  })
})
