<<<<<<< HEAD
import { jest } from '@jest/globals'

// --- Mock dependencies ---
const mockLog = { error: jest.fn(), warn: jest.fn() }
jest.unstable_mockModule('../../../src/utils/logger.js', () => ({ log: mockLog }))

// Setup nodemailer mock properly
const mockSendMail = jest.fn().mockResolvedValue({})
const mockCreateTransport = jest.fn(() => ({ sendMail: mockSendMail }))
jest.unstable_mockModule('nodemailer', () => ({
  createTransport: mockCreateTransport,
  default: { createTransport: mockCreateTransport },
}))

// Mock GroupService and UserService
const mockGetGroupMembers = jest.fn()
const MockGroupService = jest.fn().mockImplementation(() => ({
  getGroupMembers: mockGetGroupMembers,
}))
jest.unstable_mockModule('../../../src/services/groupService.js', () => ({
  default: MockGroupService,
}))

const mockGetUsersByRole = jest.fn()
const MockUserService = jest.fn().mockImplementation(() => ({
  getUsersByRole: mockGetUsersByRole,
}))
jest.unstable_mockModule('../../../src/services/userService.js', () => ({
  default: MockUserService,
}))

// Import after mocks
const { default: AnnouncementServiceImported } = await import(
  '../../../src/services/announcementService.js'
)

// --- Helper: create service instance with mocks ---
function makeService({
  announcementModel = {},
  courseModel = {},
  userModel = {},
  groupModel = {},
  studentTeacherModel = {},
  learnerModel = {},
  teacherModel = {},
  adminModel = {},
  enrollmentModel = {},
  schoolModel = {},
  blacklistModel = {},
} = {}) {
  return new AnnouncementServiceImported(
    announcementModel,
    courseModel,
    userModel,
    groupModel,
    studentTeacherModel,
    learnerModel,
    teacherModel,
    adminModel,
    enrollmentModel,
    schoolModel,
    blacklistModel
  )
}

// --- Test data ---
const fakeCourse = { id: 1, name: 'Math', learner_group_id: 10 }
const fakeUser = { id: 2, first_name: 'Jane', last_name: 'Doe', email: 'jane@example.com' }
const fakeAnnouncement = {
  announcement_id: 5,
  course_id: 1,
  title: 'T',
  message: 'M',
  user_id: 2,
  update: jest.fn(),
  destroy: jest.fn(),
}
const fakeLearners = [
  { user: { email: 'learner1@example.com' } },
  { user: { email: 'learner2@example.com' } },
]
const fakeUsers = [{ email: 'a@b.com' }, { email: 'c@d.com' }]

// --- Tests ---
describe('AnnouncementService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    process.env.EMAIL_USER = 'test@aral.com'
    process.env.EMAIL_PASS = 'pw'
    mockSendMail.mockResolvedValue({})
  })

  describe('createAnnouncement (course)', () => {
    test('creates announcement and sends emails', async () => {
      const announcementModel = { create: jest.fn().mockResolvedValue(fakeAnnouncement) }
      const courseModel = { findByPk: jest.fn().mockResolvedValue(fakeCourse) }
      const userModel = { findByPk: jest.fn().mockResolvedValue(fakeUser) }
      mockGetGroupMembers.mockResolvedValue(fakeLearners)

      const service = makeService({ announcementModel, courseModel, userModel })
      const result = await service.createAnnouncement(1, 'T', 'M', 2)

      expect(courseModel.findByPk).toHaveBeenCalledWith(1)
      expect(announcementModel.create).toHaveBeenCalledWith({
        course_id: 1,
        title: 'T',
        message: 'M',
        user_id: 2,
      })
      expect(userModel.findByPk).toHaveBeenCalledWith(2)
      expect(mockGetGroupMembers).toHaveBeenCalledWith(10)
      expect(mockSendMail).toHaveBeenCalledTimes(2)
      expect(result).toBe(fakeAnnouncement)
    })

    test('throws if course not found', async () => {
      const courseModel = { findByPk: jest.fn().mockResolvedValue(null) }
      const service = makeService({ courseModel })
      await expect(service.createAnnouncement(1, 'T', 'M', 2)).rejects.toThrow('Course not found')
      expect(mockLog.error).toHaveBeenCalled()
    })

    test('throws if postedBy not found', async () => {
      const announcementModel = { create: jest.fn().mockResolvedValue(fakeAnnouncement) }
      const courseModel = { findByPk: jest.fn().mockResolvedValue(fakeCourse) }
      const userModel = { findByPk: jest.fn().mockResolvedValue(null) }
      const service = makeService({ announcementModel, courseModel, userModel })
      await expect(service.createAnnouncement(1, 'T', 'M', 2)).rejects.toThrow(
        'Posted by not found'
      )
      expect(mockLog.error).toHaveBeenCalled()
    })

    test('skips email if skipEmail=true', async () => {
      const announcementModel = { create: jest.fn().mockResolvedValue(fakeAnnouncement) }
      const courseModel = { findByPk: jest.fn().mockResolvedValue(fakeCourse) }
      const userModel = { findByPk: jest.fn().mockResolvedValue(fakeUser) }
      mockGetGroupMembers.mockResolvedValue(fakeLearners)
      const service = makeService({ announcementModel, courseModel, userModel })
      await service.createAnnouncement(1, 'T', 'M', 2, true)
      expect(mockSendMail).not.toHaveBeenCalled()
    })
  })

  describe('createAnnouncement (global)', () => {
    test('creates global announcement and sends emails', async () => {
      const announcementModel = { create: jest.fn().mockResolvedValue(fakeAnnouncement) }
      const userModel = { findByPk: jest.fn().mockResolvedValue(fakeUser) }
      mockGetUsersByRole
        .mockResolvedValueOnce(fakeUsers)
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
      const service = makeService({ announcementModel, userModel })
      const result = await service.createAnnouncement(null, 'T', 'M', 2)
      expect(announcementModel.create).toHaveBeenCalledWith({
        course_id: null,
        title: 'T',
        message: 'M',
        user_id: 2,
      })
      expect(userModel.findByPk).toHaveBeenCalledWith(2)
      expect(mockGetUsersByRole).toHaveBeenCalledWith('learner')
      expect(mockSendMail).toHaveBeenCalledTimes(2)
      expect(result).toBe(fakeAnnouncement)
    })

    test('throws if postedBy not found', async () => {
      const announcementModel = { create: jest.fn().mockResolvedValue(fakeAnnouncement) }
      const userModel = { findByPk: jest.fn().mockResolvedValue(null) }
      const service = makeService({ announcementModel, userModel })
      await expect(service.createAnnouncement(null, 'T', 'M', 2)).rejects.toThrow(
        'Posted by not found'
      )
      expect(mockLog.error).toHaveBeenCalled()
    })
  })

  describe('getAnnouncementsByCourseId', () => {
    test('returns announcements for course', async () => {
      const courseModel = { findByPk: jest.fn().mockResolvedValue(fakeCourse) }
      const announcementModel = { findAll: jest.fn().mockResolvedValue([fakeAnnouncement]) }
      const userModel = {}
      const service = makeService({ announcementModel, courseModel, userModel })
      const result = await service.getAnnouncementsByCourseId(1)
      expect(result).toEqual([fakeAnnouncement])
      expect(announcementModel.findAll).toHaveBeenCalled()
    })

    test('throws if course not found', async () => {
      const courseModel = { findByPk: jest.fn().mockResolvedValue(null) }
      const service = makeService({ courseModel })
      await expect(service.getAnnouncementsByCourseId(1)).rejects.toThrow('Course not found')
      expect(mockLog.error).toHaveBeenCalled()
    })
  })

  describe('getGlobalAnnouncements', () => {
    test('returns global announcements', async () => {
      const announcementModel = { findAll: jest.fn().mockResolvedValue([fakeAnnouncement]) }
      const userModel = {}
      const service = makeService({ announcementModel, userModel })
      const result = await service.getGlobalAnnouncements()
      expect(result).toEqual([fakeAnnouncement])
      expect(announcementModel.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ where: { course_id: null } })
      )
    })
  })

  describe('getAnnouncementById', () => {
    test('returns announcement', async () => {
      const announcementModel = { findOne: jest.fn().mockResolvedValue(fakeAnnouncement) }
      const userModel = {}
      const courseModel = {}
      const service = makeService({ announcementModel, userModel, courseModel })
      const result = await service.getAnnouncementById(5)
      expect(result).toBe(fakeAnnouncement)
      expect(announcementModel.findOne).toHaveBeenCalledWith(
        expect.objectContaining({ where: { announcement_id: 5 } })
      )
    })

    test('throws if not found', async () => {
      const announcementModel = { findOne: jest.fn().mockResolvedValue(null) }
      const service = makeService({ announcementModel })
      await expect(service.getAnnouncementById(5)).rejects.toThrow('Announcement not found')
      expect(mockLog.error).toHaveBeenCalled()
    })
  })

  describe('getAnnouncementsByUserIdAndCourseId', () => {
    test('returns announcements', async () => {
      const userModel = { findByPk: jest.fn().mockResolvedValue(fakeUser) }
      const courseModel = { findByPk: jest.fn().mockResolvedValue(fakeCourse) }
      const announcementModel = { findAll: jest.fn().mockResolvedValue([fakeAnnouncement]) }
      const service = makeService({ announcementModel, userModel, courseModel })
      const result = await service.getAnnouncementsByUserIdAndCourseId(2, 1)
      expect(result).toEqual([fakeAnnouncement])
    })

    test('throws if user not found', async () => {
      const userModel = { findByPk: jest.fn().mockResolvedValue(null) }
      const service = makeService({ userModel })
      await expect(service.getAnnouncementsByUserIdAndCourseId(2, 1)).rejects.toThrow(
        'User not found'
      )
      expect(mockLog.error).toHaveBeenCalled()
    })

    test('throws if course not found', async () => {
      const userModel = { findByPk: jest.fn().mockResolvedValue(fakeUser) }
      const courseModel = { findByPk: jest.fn().mockResolvedValue(null) }
      const service = makeService({ userModel, courseModel })
      await expect(service.getAnnouncementsByUserIdAndCourseId(2, 1)).rejects.toThrow(
        'Course not found'
      )
      expect(mockLog.error).toHaveBeenCalled()
    })
  })

  describe('getAnnouncementsByUserId', () => {
    test('returns announcements', async () => {
      const userModel = { findByPk: jest.fn().mockResolvedValue(fakeUser) }
      const announcementModel = { findAll: jest.fn().mockResolvedValue([fakeAnnouncement]) }
      const service = makeService({ announcementModel, userModel })
      const result = await service.getAnnouncementsByUserId(2)
      expect(result).toEqual([fakeAnnouncement])
    })

    test('throws if user not found', async () => {
      const userModel = { findByPk: jest.fn().mockResolvedValue(null) }
      const service = makeService({ userModel })
      await expect(service.getAnnouncementsByUserId(2)).rejects.toThrow('User not found')
      expect(mockLog.error).toHaveBeenCalled()
    })
  })

  describe('updateAnnouncement', () => {
    test('updates announcement', async () => {
      const announcement = { ...fakeAnnouncement, update: jest.fn().mockResolvedValue() }
      const announcementModel = { findByPk: jest.fn().mockResolvedValue(announcement) }
      const courseModel = { findByPk: jest.fn().mockResolvedValue(fakeCourse) }
      const service = makeService({ announcementModel, courseModel })
      const result = await service.updateAnnouncement(5, 1, 'T', 'M', 2)
      expect(announcement.update).toHaveBeenCalledWith({
        course_id: 1,
        title: 'T',
        message: 'M',
        user_id: 2,
      })
      expect(result).toBe(announcement)
    })

    test('throws if announcement not found', async () => {
      const announcementModel = { findByPk: jest.fn().mockResolvedValue(null) }
      const service = makeService({ announcementModel })
      await expect(service.updateAnnouncement(5, 1, 'T', 'M', 2)).rejects.toThrow(
        'Announcement not found'
      )
    })

    test('throws if course not found', async () => {
      const announcement = { ...fakeAnnouncement, update: jest.fn() }
      const announcementModel = { findByPk: jest.fn().mockResolvedValue(announcement) }
      const courseModel = { findByPk: jest.fn().mockResolvedValue(null) }
      const service = makeService({ announcementModel, courseModel })
      await expect(service.updateAnnouncement(5, 1, 'T', 'M', 2)).rejects.toThrow(
        'Course not found'
      )
    })
  })

  describe('deleteAnnouncement', () => {
    test('deletes announcement', async () => {
      const announcement = { ...fakeAnnouncement, destroy: jest.fn().mockResolvedValue() }
      const announcementModel = { findByPk: jest.fn().mockResolvedValue(announcement) }
      const service = makeService({ announcementModel })
      const result = await service.deleteAnnouncement(5)
      expect(announcement.destroy).toHaveBeenCalled()
      expect(result).toEqual({ message: 'Announcement deleted successfully' })
    })

    test('throws if announcement not found', async () => {
      const announcementModel = { findByPk: jest.fn().mockResolvedValue(null) }
      const service = makeService({ announcementModel })
      await expect(service.deleteAnnouncement(5)).rejects.toThrow('Announcement not found')
    })
  })
})
=======
import { jest } from '@jest/globals'

// --- Mock dependencies ---
const mockLog = { error: jest.fn(), warn: jest.fn() }
jest.unstable_mockModule('../../../src/utils/logger.js', () => ({ log: mockLog }))

// Setup nodemailer mock properly
const mockSendMail = jest.fn().mockResolvedValue({})
const mockCreateTransport = jest.fn(() => ({ sendMail: mockSendMail }))
jest.unstable_mockModule('nodemailer', () => ({
  createTransport: mockCreateTransport,
  default: { createTransport: mockCreateTransport },
}))

// Mock GroupService and UserService
const mockGetGroupMembers = jest.fn()
const MockGroupService = jest.fn().mockImplementation(() => ({
  getGroupMembers: mockGetGroupMembers,
}))
jest.unstable_mockModule('../../../src/services/groupService.js', () => ({
  default: MockGroupService,
}))

const mockGetUsersByRole = jest.fn()
const MockUserService = jest.fn().mockImplementation(() => ({
  getUsersByRole: mockGetUsersByRole,
}))
jest.unstable_mockModule('../../../src/services/userService.js', () => ({
  default: MockUserService,
}))

// Import after mocks
const { default: AnnouncementServiceImported } = await import(
  '../../../src/services/announcementService.js'
)

// --- Helper: create service instance with mocks ---
function makeService({
  announcementModel = {},
  courseModel = {},
  userModel = {},
  groupModel = {},
  studentTeacherModel = {},
  learnerModel = {},
  teacherModel = {},
  adminModel = {},
  enrollmentModel = {},
  schoolModel = {},
  blacklistModel = {},
} = {}) {
  return new AnnouncementServiceImported(
    announcementModel,
    courseModel,
    userModel,
    groupModel,
    studentTeacherModel,
    learnerModel,
    teacherModel,
    adminModel,
    enrollmentModel,
    schoolModel,
    blacklistModel
  )
}

// --- Test data ---
const fakeCourse = { id: 1, name: 'Math', learner_group_id: 10 }
const fakeUser = { id: 2, first_name: 'Jane', last_name: 'Doe', email: 'jane@example.com' }
const fakeAnnouncement = {
  announcement_id: 5,
  course_id: 1,
  title: 'T',
  message: 'M',
  user_id: 2,
  update: jest.fn(),
  destroy: jest.fn(),
}
const fakeLearners = [
  { user: { email: 'learner1@example.com' } },
  { user: { email: 'learner2@example.com' } },
]
const fakeUsers = [{ email: 'a@b.com' }, { email: 'c@d.com' }]

// --- Tests ---
describe('AnnouncementService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    process.env.EMAIL_USER = 'test@aral.com'
    process.env.EMAIL_PASS = 'pw'
    mockSendMail.mockResolvedValue({})
  })

  describe('createAnnouncement (course)', () => {
    test('creates announcement and sends emails', async () => {
      const announcementModel = { create: jest.fn().mockResolvedValue(fakeAnnouncement) }
      const courseModel = { findByPk: jest.fn().mockResolvedValue(fakeCourse) }
      const userModel = { findByPk: jest.fn().mockResolvedValue(fakeUser) }
      mockGetGroupMembers.mockResolvedValue(fakeLearners)

      const service = makeService({ announcementModel, courseModel, userModel })
      const result = await service.createAnnouncement(1, 'T', 'M', 2)

      expect(courseModel.findByPk).toHaveBeenCalledWith(1)
      expect(announcementModel.create).toHaveBeenCalledWith({
        course_id: 1,
        title: 'T',
        message: 'M',
        user_id: 2,
      })
      expect(userModel.findByPk).toHaveBeenCalledWith(2)
      expect(mockGetGroupMembers).toHaveBeenCalledWith(10)
      expect(mockSendMail).toHaveBeenCalledTimes(2)
      expect(result).toBe(fakeAnnouncement)
    })

    test('throws if course not found', async () => {
      const courseModel = { findByPk: jest.fn().mockResolvedValue(null) }
      const service = makeService({ courseModel })
      await expect(service.createAnnouncement(1, 'T', 'M', 2)).rejects.toThrow('Course not found')
      expect(mockLog.error).toHaveBeenCalled()
    })

    test('throws if postedBy not found', async () => {
      const announcementModel = { create: jest.fn().mockResolvedValue(fakeAnnouncement) }
      const courseModel = { findByPk: jest.fn().mockResolvedValue(fakeCourse) }
      const userModel = { findByPk: jest.fn().mockResolvedValue(null) }
      const service = makeService({ announcementModel, courseModel, userModel })
      await expect(service.createAnnouncement(1, 'T', 'M', 2)).rejects.toThrow(
        'Posted by not found'
      )
      expect(mockLog.error).toHaveBeenCalled()
    })

    test('skips email if skipEmail=true', async () => {
      const announcementModel = { create: jest.fn().mockResolvedValue(fakeAnnouncement) }
      const courseModel = { findByPk: jest.fn().mockResolvedValue(fakeCourse) }
      const userModel = { findByPk: jest.fn().mockResolvedValue(fakeUser) }
      mockGetGroupMembers.mockResolvedValue(fakeLearners)
      const service = makeService({ announcementModel, courseModel, userModel })
      await service.createAnnouncement(1, 'T', 'M', 2, true)
      expect(mockSendMail).not.toHaveBeenCalled()
    })
  })

  describe('createAnnouncement (global)', () => {
    test('creates global announcement and sends emails', async () => {
      const announcementModel = { create: jest.fn().mockResolvedValue(fakeAnnouncement) }
      const userModel = { findByPk: jest.fn().mockResolvedValue(fakeUser) }
      mockGetUsersByRole
        .mockResolvedValueOnce(fakeUsers)
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
      const service = makeService({ announcementModel, userModel })
      const result = await service.createAnnouncement(null, 'T', 'M', 2)
      expect(announcementModel.create).toHaveBeenCalledWith({
        course_id: null,
        title: 'T',
        message: 'M',
        user_id: 2,
      })
      expect(userModel.findByPk).toHaveBeenCalledWith(2)
      expect(mockGetUsersByRole).toHaveBeenCalledWith('learner')
      expect(mockSendMail).toHaveBeenCalledTimes(2)
      expect(result).toBe(fakeAnnouncement)
    })

    test('throws if postedBy not found', async () => {
      const announcementModel = { create: jest.fn().mockResolvedValue(fakeAnnouncement) }
      const userModel = { findByPk: jest.fn().mockResolvedValue(null) }
      const service = makeService({ announcementModel, userModel })
      await expect(service.createAnnouncement(null, 'T', 'M', 2)).rejects.toThrow(
        'Posted by not found'
      )
      expect(mockLog.error).toHaveBeenCalled()
    })
  })

  describe('getAnnouncementsByCourseId', () => {
    test('returns announcements for course', async () => {
      const courseModel = { findByPk: jest.fn().mockResolvedValue(fakeCourse) }
      const announcementModel = { findAll: jest.fn().mockResolvedValue([fakeAnnouncement]) }
      const userModel = {}
      const service = makeService({ announcementModel, courseModel, userModel })
      const result = await service.getAnnouncementsByCourseId(1)
      expect(result).toEqual([fakeAnnouncement])
      expect(announcementModel.findAll).toHaveBeenCalled()
    })

    test('throws if course not found', async () => {
      const courseModel = { findByPk: jest.fn().mockResolvedValue(null) }
      const service = makeService({ courseModel })
      await expect(service.getAnnouncementsByCourseId(1)).rejects.toThrow('Course not found')
      expect(mockLog.error).toHaveBeenCalled()
    })
  })

  describe('getGlobalAnnouncements', () => {
    test('returns global announcements', async () => {
      const announcementModel = { findAll: jest.fn().mockResolvedValue([fakeAnnouncement]) }
      const userModel = {}
      const service = makeService({ announcementModel, userModel })
      const result = await service.getGlobalAnnouncements()
      expect(result).toEqual([fakeAnnouncement])
      expect(announcementModel.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ where: { course_id: null } })
      )
    })
  })

  describe('getAnnouncementById', () => {
    test('returns announcement', async () => {
      const announcementModel = { findOne: jest.fn().mockResolvedValue(fakeAnnouncement) }
      const userModel = {}
      const courseModel = {}
      const service = makeService({ announcementModel, userModel, courseModel })
      const result = await service.getAnnouncementById(5)
      expect(result).toBe(fakeAnnouncement)
      expect(announcementModel.findOne).toHaveBeenCalledWith(
        expect.objectContaining({ where: { announcement_id: 5 } })
      )
    })

    test('throws if not found', async () => {
      const announcementModel = { findOne: jest.fn().mockResolvedValue(null) }
      const service = makeService({ announcementModel })
      await expect(service.getAnnouncementById(5)).rejects.toThrow('Announcement not found')
      expect(mockLog.error).toHaveBeenCalled()
    })
  })

  describe('getAnnouncementsByUserIdAndCourseId', () => {
    test('returns announcements', async () => {
      const userModel = { findByPk: jest.fn().mockResolvedValue(fakeUser) }
      const courseModel = { findByPk: jest.fn().mockResolvedValue(fakeCourse) }
      const announcementModel = { findAll: jest.fn().mockResolvedValue([fakeAnnouncement]) }
      const service = makeService({ announcementModel, userModel, courseModel })
      const result = await service.getAnnouncementsByUserIdAndCourseId(2, 1)
      expect(result).toEqual([fakeAnnouncement])
    })

    test('throws if user not found', async () => {
      const userModel = { findByPk: jest.fn().mockResolvedValue(null) }
      const service = makeService({ userModel })
      await expect(service.getAnnouncementsByUserIdAndCourseId(2, 1)).rejects.toThrow(
        'User not found'
      )
      expect(mockLog.error).toHaveBeenCalled()
    })

    test('throws if course not found', async () => {
      const userModel = { findByPk: jest.fn().mockResolvedValue(fakeUser) }
      const courseModel = { findByPk: jest.fn().mockResolvedValue(null) }
      const service = makeService({ userModel, courseModel })
      await expect(service.getAnnouncementsByUserIdAndCourseId(2, 1)).rejects.toThrow(
        'Course not found'
      )
      expect(mockLog.error).toHaveBeenCalled()
    })
  })

  describe('getAnnouncementsByUserId', () => {
    test('returns announcements', async () => {
      const userModel = { findByPk: jest.fn().mockResolvedValue(fakeUser) }
      const announcementModel = { findAll: jest.fn().mockResolvedValue([fakeAnnouncement]) }
      const service = makeService({ announcementModel, userModel })
      const result = await service.getAnnouncementsByUserId(2)
      expect(result).toEqual([fakeAnnouncement])
    })

    test('throws if user not found', async () => {
      const userModel = { findByPk: jest.fn().mockResolvedValue(null) }
      const service = makeService({ userModel })
      await expect(service.getAnnouncementsByUserId(2)).rejects.toThrow('User not found')
      expect(mockLog.error).toHaveBeenCalled()
    })
  })

  describe('updateAnnouncement', () => {
    test('updates announcement', async () => {
      const announcement = { ...fakeAnnouncement, update: jest.fn().mockResolvedValue() }
      const announcementModel = { findByPk: jest.fn().mockResolvedValue(announcement) }
      const courseModel = { findByPk: jest.fn().mockResolvedValue(fakeCourse) }
      const service = makeService({ announcementModel, courseModel })
      const result = await service.updateAnnouncement(5, 1, 'T', 'M', 2)
      expect(announcement.update).toHaveBeenCalledWith({
        course_id: 1,
        title: 'T',
        message: 'M',
        user_id: 2,
      })
      expect(result).toBe(announcement)
    })

    test('throws if announcement not found', async () => {
      const announcementModel = { findByPk: jest.fn().mockResolvedValue(null) }
      const service = makeService({ announcementModel })
      await expect(service.updateAnnouncement(5, 1, 'T', 'M', 2)).rejects.toThrow(
        'Announcement not found'
      )
    })

    test('throws if course not found', async () => {
      const announcement = { ...fakeAnnouncement, update: jest.fn() }
      const announcementModel = { findByPk: jest.fn().mockResolvedValue(announcement) }
      const courseModel = { findByPk: jest.fn().mockResolvedValue(null) }
      const service = makeService({ announcementModel, courseModel })
      await expect(service.updateAnnouncement(5, 1, 'T', 'M', 2)).rejects.toThrow(
        'Course not found'
      )
    })
  })

  describe('deleteAnnouncement', () => {
    test('deletes announcement', async () => {
      const announcement = { ...fakeAnnouncement, destroy: jest.fn().mockResolvedValue() }
      const announcementModel = { findByPk: jest.fn().mockResolvedValue(announcement) }
      const service = makeService({ announcementModel })
      const result = await service.deleteAnnouncement(5)
      expect(announcement.destroy).toHaveBeenCalled()
      expect(result).toEqual({ message: 'Announcement deleted successfully' })
    })

    test('throws if announcement not found', async () => {
      const announcementModel = { findByPk: jest.fn().mockResolvedValue(null) }
      const service = makeService({ announcementModel })
      await expect(service.deleteAnnouncement(5)).rejects.toThrow('Announcement not found')
    })
  })
})
>>>>>>> 627466f638de697919d077ca56524377d406840d
