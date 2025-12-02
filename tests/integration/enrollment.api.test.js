import request from 'supertest'
import app from '../../src/server.js'
import { sequelize } from '../../src/config/database.js'
import { School } from '../../src/models/index.js'
import '../../src/models/associate.js'

describe('Enrollment API (Integration Tests)', () => {
  let testSchool
  let server

  beforeAll(async () => {
    await sequelize.sync({ force: true })

    // Create test school
    testSchool = await School.create({
      school_id: Math.floor(10000 + Math.random() * 90000),
      name: 'Test Integration School',
      address: '123 Test St., Test City',
      contact_no: '02-8123-4567',
    })

    server = app.listen()
  })

  afterAll(async () => {
    await sequelize.close()
    server.close()
  })

  describe('POST /api/enrollments', () => {
    test('should create a new enrollment', async () => {
      const enrollmentData = {
        email: `test${Date.now()}@example.com`,
        password: 'Password123!',
        confirm_password: 'Password123!',
        first_name: 'Test',
        last_name: 'Student',
        birth_date: '2000-01-01',
        contact_no: '09123456789',
        school_id: testSchool.school_id,
        year_level: 3,
      }

      const response = await request(server).post('/api/enrollments').send(enrollmentData)

      expect(response.status).toBe(201)
      expect(response.body.message).toEqual('Enrollment created successfully')
      expect(response.body.enrollment).toHaveProperty('email', enrollmentData.email)
    })

    test('should reject enrollment with invalid data', async () => {
      const invalidData = {
        // Missing required fields
        email: `test${Date.now()}@example.com`,
        password: 'Pass123!',
      }

      const response = await request(server).post('/api/enrollments').send(invalidData)

      expect(response.status).toBe(400)
      expect(response.body).toHaveProperty('errors')
    })
  })

  describe('POST /api/enrollments/check-status', () => {
    test('should check enrollment status', async () => {
      // Create enrollment
      const email = `status${Date.now()}@example.com`
      await request(server).post('/api/enrollments').send({
        email,
        password: 'Password123!',
        confirm_password: 'Password123!',
        first_name: 'Status',
        last_name: 'Test',
        birth_date: '2000-01-01',
        contact_no: '09123456789',
        school_id: testSchool.school_id,
        year_level: 3,
      })

      // Then check its status
      const response = await request(server).post(`/api/enrollments/check-status`).send({ email })

      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('status', 'pending')
    })
  })
})
