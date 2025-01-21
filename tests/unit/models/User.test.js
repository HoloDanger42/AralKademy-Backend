import { User } from '../../../src/models/User.js'
import { School } from '../../../src/models/School.js'
import { validUsers, invalidUsers } from '../../fixtures/userData.js'
import { validSchools } from '../../fixtures/schoolData.js'
import { setupTestEnvironment, teardownTestEnvironment } from '../../helpers/testSetup.js'
import { hashPassword } from '../../helpers/testUtils.js'

describe('User Model', () => {
  beforeAll(async () => {
    await setupTestEnvironment()
  })

  afterAll(async () => {
    await teardownTestEnvironment()
  })

  describe('Valid Users', () => {
    it('should create a user with valid data', async () => {
      const userData = { ...validUsers[0] }
      const hashedPassword = await hashPassword(userData.password)

      const user = await User.create({ ...userData, password: hashedPassword })

      expect(user.id).toBeDefined()
      expect(user.first_name).toBe(userData.first_name)
      expect(user.last_name).toBe(userData.last_name)
      expect(user.email).toBe(userData.email)
      expect(user.role).toBe(userData.role)
      expect(user.school_id).toBe(userData.school_id)
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
  })

  describe('Associations', () => {
    it('should belong to a school', async () => {
      const school = await School.create(validSchools[0])
      const userData = validUsers[0]
      console.log('userData:', userData)
      const user = await User.create(userData)
      const userSchool = await user.getSchool()

      expect(userSchool.id).toBe(school.id)
      expect(userSchool.name).toBe('Test School')
    })

    it('should have one StudentTeacher', async () => {
      const userData = validUsers[2]
      const user = await User.create(userData)
      const studentTeacher = await user.createStudentTeacher()

      expect(studentTeacher.userId).toBe(user.id)
    })

    it('should have one Teacher', async () => {
      const userData = validUsers[1]
      const user = await User.create(userData)
      const teacher = await user.createTeacher({
        department: 'Math',
        emp_status: 'Full-time',
      })

      expect(teacher.userId).toBe(user.id)
    })

    it('should have one Admin', async () => {
      const userData = validUsers[3]
      const user = await User.create(userData)
      const admin = await user.createAdmin()

      expect(admin.userId).toBe(user.id)
    })

    it('should have one Learner', async () => {
      const userData = validUsers[0]
      const user = await User.create(userData)
      const learner = await user.createLearner()

      expect(learner.userId).toBe(user.id)
    })
  })
})
