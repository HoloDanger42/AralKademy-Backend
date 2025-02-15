import request from 'supertest'
import app from '../../src/server.js'
import { sequelize } from '../../src/config/database.js'
import { Course } from '../../src/models/Course.js'
import '../../src/models/associate.js'

describe('Course Endpoints (Integration Tests)', () => {
  let server
  let authToken

  beforeAll(async () => {
    await sequelize.sync({ force: true })

    server = app.listen(0)

    // Login to get auth token
    const loginRes = await request(app).post('/users/login').send({
      email: 'testadmin@example.com',
      password: 'testPassword',
    })

    authToken = loginRes.body.token
  })

  afterAll(async () => {
    if (server) {
      await server.close()
    }
    await sequelize.close()
  })

  describe('POST /courses', () => {
    it('should create a new course', async () => {
      const courseData = {
        name: 'Introduction to Programming',
        description: 'Learn the basics of programming.',
        user_id: null,
        student_teacher_group_id: null,
        learner_group_id: null,
      }

      const res = await request(app)
        .post('/courses')
        .set('Authorization', `Bearer ${authToken}`)
        .send(courseData)

      expect(res.status).toBe(201)
      expect(res.body.course).toEqual(
        expect.objectContaining({
          name: courseData.name,
          description: courseData.description
        })
      )
    })

    describe('error handling', () => {
      it('should handle empty course name', async () => {
        const res = await request(app)
          .post('/courses')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            name: '',
            description: 'Test description'
          })

        expect(res.status).toBe(400)
        expect(res.body).toEqual({
          message: 'Course name is required',
        })
      })

      it('should handle course name too long', async () => {
        const res = await request(app)
          .post('/courses')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            name: 'a'.repeat(256),
            description: 'Test description'
          })

        expect(res.status).toBe(400)
        expect(res.body).toEqual({
          message: 'Course name is too long',
        })
      })
    })
  })

  describe('GET /courses', () => {
    beforeEach(async () => {
      await Course.destroy({ where: {} }) // Clean up before each test
    })

    it('should retrieve all courses', async () => {
      // Create test courses
      await Course.bulkCreate([
        {
          name: 'Course 1',
          description: 'Description 1'
        },
        {
          name: 'Course 2',
          description: 'Description 2'
        },
      ])

      const res = await request(app).get('/courses').set('Authorization', `Bearer ${authToken}`)

      expect(res.status).toBe(200)
      expect(res.body).toEqual(
        expect.objectContaining({
          count: expect.any(Number),
          rows: expect.arrayContaining([
            expect.objectContaining({
              name: expect.any(String),
              description: expect.any(String)
            }),
          ]),
        })
      )
    })
  })
})
