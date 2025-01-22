import { User } from '../../../src/models/User.js'
import { School } from '../../../src/models/School.js'
import { validUsers, invalidUsers } from '../../fixtures/userData.js'
import { validSchools } from '../../fixtures/schoolData.js'
import { setupTestEnvironment, teardownTestEnvironment } from '../../helpers/testSetup.js'
import { hashPassword } from '../../helpers/testUtils.js'
import { createTestUser, createTestSchool, createTestEnrollment } from '../../helpers/testData.js'

describe('User Model', () => {
  beforeAll(async () => {
    await setupTestEnvironment()
  })

  afterAll(async () => {
    await teardownTestEnvironment()
  })

  describe('Valid Users', () => {
    it('should create a user with valid data', async () => {
      const school = await createTestSchool()
      const userData = {
        ...validUsers[0],
        school_id: school.school_id,
      }
      const hashedPassword = await hashPassword(userData.password)

      const user = await User.create({
        ...userData,
        password: hashedPassword,
      })

      expect(user.id).toBeDefined()
      expect(user.first_name).toBe(userData.first_name)
      expect(user.last_name).toBe(userData.last_name)
      expect(user.email).toBe(userData.email)
      expect(user.role).toBe(userData.role)
      expect(user.school_id).toBe(userData.school_id)
    })

    it('should create user with valid birthdate in past', async () => {
      const school = await createTestSchool()
      const pastDate = new Date()
      pastDate.setFullYear(pastDate.getFullYear() - 20)

      const userData = {
        ...validUsers[0],
        email: `user${Date.now()}@example.com`,
        birth_date: pastDate,
        school_id: school.school_id,
      }
      const hashedPassword = await hashPassword(userData.password)

      const user = await User.create({ ...userData, password: hashedPassword })
      expect(user.birth_date).toEqual(pastDate)
    })
  })

  describe('Invalid Users', () => {
    invalidUsers.forEach((user, index) => {
      it(`should not create user with invalid data - case ${index + 1}`, async () => {
        try {
          await User.create(user)
        } catch (error) {
          expect(error).toBeDefined()
          expect(error.name).toBe('SequelizeValidationError')
        }
      })
    })

    it('should not create user with future birthdate', async () => {
      const futureDate = new Date()
      futureDate.setFullYear(futureDate.getFullYear() + 1)

      await expect(
        User.create({
          ...validUsers[0],
          birth_date: futureDate,
        })
      ).rejects.toThrow('Birthdate must be in the past')
    })

    it('should not create user with today as birthdate', async () => {
      const today = new Date()

      await expect(
        User.create({
          ...validUsers[0],
          email: `user${Date.now()}@example.com`,
          birth_date: today,
        })
      ).rejects.toThrow('Birthdate must be in the past')
    })
  })

  describe('Associations', () => {
    it('should belong to a school', async () => {
      const school = await School.create(validSchools[0])
      const user = await createTestUser({}, 'learner', school)
      const userSchool = await user.getSchool()

      expect(userSchool.id).toBe(school.id)
      expect(userSchool.name).toBe('Test School')
    })

    it('should have one StudentTeacher', async () => {
      const userData = validUsers[2]
      const user = await User.create(userData)
      const studentTeacher = await user.createStudentTeacher({
        section: 'Test Section',
        department: 'Test Department',
      })

      expect(studentTeacher).toBeTruthy()
      expect(studentTeacher.user_id).toBe(user.id)
    })

    it('should have one Teacher', async () => {
      const userData = validUsers[1]
      const user = await User.create(userData)
      const teacher = await user.createTeacher({
        department: 'Test Department',
        emp_status: 'Full-time',
      })

      expect(teacher).toBeTruthy()
      expect(teacher.user_id).toBe(user.id)
    })

    it('should have one Admin', async () => {
      const userData = validUsers[3]
      const user = await User.create(userData)
      const admin = await user.createAdmin()

      expect(admin).toBeTruthy()
      expect(admin.user_id).toBe(user.id)
    })

    it('should have one Learner', async () => {
      try {
        const school = await createTestSchool()
        const enrollment = await createTestEnrollment({
          email: `learner${Date.now()}@example.com`,
          school_id: school.school_id,
          enrollment_date: new Date(),
        })

        const userData = {
          ...validUsers[0],
          email: `user${Date.now()}@example.com`,
          school_id: school.school_id,
        }
        const user = await User.create(userData)
        const learner = await user.createLearner({
          year_level: 3,
          enrollment_id: enrollment.enrollment_id,
        })

        expect(learner).toBeTruthy()
        expect(learner.user_id).toBe(user.id)
        expect(learner.enrollment_id).toBe(enrollment.enrollment_id)
      } catch (error) {
        console.log(error)
        throw error
      }
    })
  })
})
