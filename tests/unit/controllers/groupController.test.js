import { beforeEach, describe, expect, jest } from '@jest/globals'
import {
  getAllGroups,
  createGroup,
  assignLearnerMembers,
  assignStudentTeacherMembers,
  getGroupById,
  updateGroup,
  deleteGroup,
  getGroupMembers,
  removeMember,
} from '../../../src/controllers/groupController.js'
import GroupService from '../../../src/services/groupService.js'
import { log } from '../../../src/utils/logger.js'

describe('Group Controller', () => {
  let mockReq
  let mockRes
  let mockGroupService

  beforeEach(() => {
    mockReq = {
      body: {},
      params: {},
      query: {},
      user: { userId: 1, role: 'admin' },
    }
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    }

    mockGroupService = {
      getAllGroups: jest.fn(),
    }

    jest
      .spyOn(GroupService.prototype, 'getAllGroups')
      .mockImplementation(mockGroupService.getAllGroups)

    jest.spyOn(log, 'info')
    jest.spyOn(log, 'error')
    jest.clearAllMocks()
  })

  describe('getAllGroups', () => {
    test('should retrieve all groups successfully (get all groups)', async () => {
      const groups = [{ id: 1, name: 'Test Group' }]

      jest.spyOn(GroupService.prototype, 'getAllGroups').mockResolvedValue(groups)

      await getAllGroups(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(200)
      expect(mockRes.json).toHaveBeenCalledWith(groups)
      expect(log.info).toHaveBeenCalledWith('Retrieved all groups')
    })

    test('should handle errors when retrieving all groups (get all groups)', async () => {
      mockGroupService.getAllGroups.mockRejectedValue(new Error('Error fetching groups'))

      await getAllGroups(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(500)
      expect(mockRes.json).toHaveBeenCalledWith({
        error: {
          message: 'Failed to retrieve groups',
          code: 'INTERNAL_ERROR',
        },
      })
      expect(log.error).toHaveBeenCalledWith('Get all groups error:', expect.any(Error))
    })

    test('should filter groups by valid group_type', async () => {
      // Arrange
      mockReq.query = { group_type: 'learner' }
      const learnerGroups = [
        { id: 1, name: 'Learner Group 1', group_type: 'learner' },
        { id: 2, name: 'Learner Group 2', group_type: 'learner' },
      ]

      jest.spyOn(GroupService.prototype, 'getAllGroups').mockResolvedValue(learnerGroups)

      // Act
      await getAllGroups(mockReq, mockRes)

      // Assert
      expect(GroupService.prototype.getAllGroups).toHaveBeenCalledWith({ group_type: 'learner' })
      expect(mockRes.status).toHaveBeenCalledWith(200)
      expect(mockRes.json).toHaveBeenCalledWith(learnerGroups)
      expect(log.info).toHaveBeenCalledWith('Retrieved all groups')
    })

    test('should return 400 for invalid group_type', async () => {
      // Arrange
      mockReq.query = { group_type: 'invalid_type' }

      // Act
      await getAllGroups(mockReq, mockRes)

      // Assert
      expect(GroupService.prototype.getAllGroups).not.toHaveBeenCalled()
      expect(mockRes.status).toHaveBeenCalledWith(400)
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Invalid group_type',
      })
    })
  })

  describe('createGroup', () => {
    test('should create a new group successfully (create group)', async () => {
      mockReq.body = { groupId: 1, name: 'New Group', groupType: 'Study' }
      const newGroup = { id: 1, name: 'New Group' }
      jest.spyOn(GroupService.prototype, 'createGroup').mockResolvedValue(newGroup)

      await createGroup(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(201)
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Group created successfully',
        group: newGroup,
      })
      expect(log.info).toHaveBeenCalledWith('Group New Group was successfully created')
    })

    test('should handle missing fields when creating a group (create group)', async () => {
      jest
        .spyOn(GroupService.prototype, 'createGroup')
        .mockRejectedValue(new Error('All fields are required'))

      await createGroup(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(400)
      expect(mockRes.json).toHaveBeenCalledWith({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'All fields are required',
        },
      })
      expect(log.error).toHaveBeenCalledWith('Create group error:', expect.any(Error))
    })

    test('should handle errors when creating a group (create group)', async () => {
      jest
        .spyOn(GroupService.prototype, 'createGroup')
        .mockRejectedValue(new Error('Error creating group'))

      await createGroup(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(500)
      expect(mockRes.json).toHaveBeenCalledWith({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to create group',
        },
      })
      expect(log.error).toHaveBeenCalledWith('Create group error:', expect.any(Error))
    })
  })

  describe('getGroupById', () => {
    test('should return a group by ID successfully (get group by id)', async () => {
      mockReq.params = { groupId: 1 }
      const group = { id: 1, name: 'Test Group' }
      jest.spyOn(GroupService.prototype, 'getGroupById').mockResolvedValue(group)

      await getGroupById(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(200)
      expect(mockRes.json).toHaveBeenCalledWith(group)
    })

    test('should handle when group is not found (get group by id)', async () => {
      jest.spyOn(GroupService.prototype, 'getGroupById').mockResolvedValue(null) // Return null instead of throwing

      await getGroupById(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(404)
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Group not found' })
    })

    test('should handle errors when retrieving a group by ID (get group by id)', async () => {
      mockReq.params = { groupId: 1 }

      jest
        .spyOn(GroupService.prototype, 'getGroupById')
        .mockRejectedValue(new Error('Error fetching group'))

      await getGroupById(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(500)
      expect(mockRes.json).toHaveBeenCalledWith({
        error: {
          message: 'Failed to retrieve group',
          code: 'INTERNAL_ERROR',
        },
      })
      expect(log.error).toHaveBeenCalledWith('Get group 1 error:', expect.any(Error))
    })
  })

  describe('assignLearnerMembers', () => {
    test('should assign learners to a group successfully (assign learner members)', async () => {
      mockReq.body = { userIds: [1, 2], groupId: 1 }
      const learners = [{ userId: 1 }, { userId: 2 }]
      jest.spyOn(GroupService.prototype, 'assignLearnerMembers').mockResolvedValue(learners)

      await assignLearnerMembers(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(200)
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Learners assigned successfully',
        learners,
      })
      expect(log.info).toHaveBeenCalledWith('Learners assigned successfully')
    })

    test('should handle errors when assigning learners to a group (assign learner members)', async () => {
      jest
        .spyOn(GroupService.prototype, 'assignLearnerMembers')
        .mockRejectedValue(new Error('Error assigning learners'))

      await assignLearnerMembers(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(500)
      expect(mockRes.json).toHaveBeenCalledWith({
        error: {
          message: 'Failed to assign learner members',
          code: 'INTERNAL_ERROR',
        },
      })
      expect(log.error).toHaveBeenCalledWith('Assign learner members error:', expect.any(Error))
    })

    test('should handle missing fields when assigning learners to a group (assign learner members)', async () => {
      jest
        .spyOn(GroupService.prototype, 'assignLearnerMembers')
        .mockRejectedValue(new Error('All fields are required'))

      await assignLearnerMembers(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(400)
      expect(mockRes.json).toHaveBeenCalledWith({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'All fields are required',
        },
      })
      expect(log.error).toHaveBeenCalledWith('Assign learner members error:', expect.any(Error))
    })
  })

  describe('assignStudentTeacherMembers', () => {
    test('should assign student teachers to a group successfully (assign student teacher members)', async () => {
      mockReq.body = { userIds: [1, 2], groupId: 1 }
      const studentTeachers = [{ userId: 1 }, { userId: 2 }]
      jest
        .spyOn(GroupService.prototype, 'assignStudentTeacherMembers')
        .mockResolvedValue(studentTeachers)

      await assignStudentTeacherMembers(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(200)
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Student teachers assigned successfully',
        studentTeachers,
      })
      expect(log.info).toHaveBeenCalledWith('Student teachers assigned successfully')
    })

    test('should handle errors when assigning student teachers to a group (assign student teacher members)', async () => {
      jest
        .spyOn(GroupService.prototype, 'assignStudentTeacherMembers')
        .mockRejectedValue(new Error('Error assigning student teachers'))

      await assignStudentTeacherMembers(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(500)
      expect(mockRes.json).toHaveBeenCalledWith({
        error: {
          message: 'Failed to assign student teacher members',
          code: 'INTERNAL_ERROR',
        },
      })
      expect(log.error).toHaveBeenCalledWith(
        'Assign student teacher members error:',
        expect.any(Error)
      )
    })

    test('should handle missing fields when assigning student teachers to a group (assign student teacher members)', async () => {
      jest
        .spyOn(GroupService.prototype, 'assignStudentTeacherMembers')
        .mockRejectedValue(new Error('All fields are required'))

      await assignStudentTeacherMembers(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(400)
      expect(mockRes.json).toHaveBeenCalledWith({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'All fields are required',
        },
      })
      expect(log.error).toHaveBeenCalledWith(
        'Assign student teacher members error:',
        expect.any(Error)
      )
    })
  })

  describe('updateGroup', () => {
    test('should update a group successfully', async () => {
      // Arrange
      mockReq.params.groupId = '1'
      mockReq.body = {
        name: 'Updated Group Name',
        groupType: 'student_teacher',
        addUserIds: [5, 6],
        removeUserIds: [3, 4],
      }

      const mockUpdatedGroup = {
        groupId: 1,
        name: 'Updated Group Name',
        groupType: 'student_teacher',
      }

      GroupService.prototype.updateGroup = jest.fn().mockResolvedValue(mockUpdatedGroup)

      // Act
      await updateGroup(mockReq, mockRes)

      // Assert
      expect(GroupService.prototype.updateGroup).toHaveBeenCalledWith('1', mockReq.body)
      expect(mockRes.status).toHaveBeenCalledWith(200)
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Group updated successfully',
        group: mockUpdatedGroup,
      })
    })

    test('should handle group not found error', async () => {
      // Arrange
      mockReq.params.groupId = '999'
      mockReq.body = { name: 'Updated Group Name' }

      const error = new Error('Group not found')
      GroupService.prototype.updateGroup = jest.fn().mockRejectedValue(error)

      // Act
      await updateGroup(mockReq, mockRes)

      // Assert
      expect(GroupService.prototype.updateGroup).toHaveBeenCalledWith('999', mockReq.body)
      expect(mockRes.status).toHaveBeenCalledWith(404)
      expect(mockRes.json).toHaveBeenCalledWith({
        error: {
          message: 'Group not found',
          code: 'NOT_FOUND',
        },
      })
    })
  })

  describe('deleteGroup', () => {
    test('should delete a group successfully', async () => {
      // Arrange
      mockReq.params.groupId = '1'

      GroupService.prototype.deleteGroup = jest.fn().mockResolvedValue(true)

      // Act
      await deleteGroup(mockReq, mockRes)

      // Assert
      expect(GroupService.prototype.deleteGroup).toHaveBeenCalledWith('1')
      expect(mockRes.status).toHaveBeenCalledWith(200)
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Group deleted successfully',
      })
    })

    test('should handle group not found error during deletion', async () => {
      // Arrange
      mockReq.params.groupId = '999'

      const error = new Error('Group not found')
      GroupService.prototype.deleteGroup = jest.fn().mockRejectedValue(error)

      // Act
      await deleteGroup(mockReq, mockRes)

      // Assert
      expect(GroupService.prototype.deleteGroup).toHaveBeenCalledWith('999')
      expect(mockRes.status).toHaveBeenCalledWith(404)
      expect(mockRes.json).toHaveBeenCalledWith({
        error: {
          message: 'Group not found',
          code: 'NOT_FOUND',
        },
      })
    })
  })

  describe('getGroupMembers', () => {
    test('should retrieve group members successfully', async () => {
      // Arrange
      mockReq.params.groupId = '1'
      const groupMembers = [{ userId: 1 }, { userId: 2 }]

      GroupService.prototype.getGroupMembers = jest.fn().mockResolvedValue(groupMembers)

      // Act
      await getGroupMembers(mockReq, mockRes)

      // Assert
      expect(GroupService.prototype.getGroupMembers).toHaveBeenCalledWith('1')
      expect(mockRes.status).toHaveBeenCalledWith(200)
      expect(mockRes.json).toHaveBeenCalledWith(groupMembers)
    })

    test('should handle group not found error when retrieving group members', async () => {
      // Arrange
      mockReq.params.groupId = '999'

      const error = new Error('Group not found')
      GroupService.prototype.getGroupMembers = jest.fn().mockRejectedValue(error)

      // Act
      await getGroupMembers(mockReq, mockRes)

      // Assert
      expect(GroupService.prototype.getGroupMembers).toHaveBeenCalledWith('999')
      expect(mockRes.status).toHaveBeenCalledWith(404)
      expect(mockRes.json).toHaveBeenCalledWith({
        error: {
          message: 'Group not found',
          code: 'NOT_FOUND',
        },
      })
    })

    test('should handle errors when retrieving group members', async () => {
      // Arrange
      mockReq.params.groupId = '1'

      const error = new Error('Error fetching group members')
      GroupService.prototype.getGroupMembers = jest.fn().mockRejectedValue(error)

      // Act
      await getGroupMembers(mockReq, mockRes)

      // Assert
      expect(GroupService.prototype.getGroupMembers).toHaveBeenCalledWith('1')
      expect(mockRes.status).toHaveBeenCalledWith(500)
      expect(mockRes.json).toHaveBeenCalledWith({
        error: {
          message: 'Failed to retrieve group members',
          code: 'INTERNAL_ERROR',
        },
      })
    })
  })

  describe('removeMember', () => {
    test('should remove a member from a group successfully', async () => {
      // Arrange
      mockReq.params.groupId = '1'
      mockReq.params.userId = '10'

      const removedMember = { userId: 10, groupId: 1 }

      // Mocking the removeMember method to resolve successfully
      GroupService.prototype.removeMember = jest.fn().mockResolvedValue(removedMember)

      // Act
      await removeMember(mockReq, mockRes)

      // Assert
      expect(GroupService.prototype.removeMember).toHaveBeenCalledWith('1', '10')
      expect(mockRes.status).toHaveBeenCalledWith(200)
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Member removed successfully',
        member: removedMember,
      })
      expect(log.info).toHaveBeenCalledWith('Member with id 10 removed from group with id 1')
    })

    test('should handle member not found when trying to remove (remove member)', async () => {
      // Arrange
      mockReq.params.groupId = '1'
      mockReq.params.userId = '999'

      const error = new Error('Member not found')
      GroupService.prototype.removeMember = jest.fn().mockRejectedValue(error)

      // Act
      await removeMember(mockReq, mockRes)

      // Assert
      expect(GroupService.prototype.removeMember).toHaveBeenCalledWith('1', '999')
      expect(mockRes.status).toHaveBeenCalledWith(404)
      expect(mockRes.json).toHaveBeenCalledWith({
        error: {
          message: 'Member not found',
          code: 'NOT_FOUND',
        },
      })
      expect(log.error).toHaveBeenCalledWith(
        'Remove member 999 from group 1 error:',
        expect.any(Error)
      )
    })

    test('should handle errors when removing a member (remove member)', async () => {
      // Arrange
      mockReq.params.groupId = '1'
      mockReq.params.userId = '10'

      const error = new Error('Internal Server Error')
      GroupService.prototype.removeMember = jest.fn().mockRejectedValue(error)

      // Act
      await removeMember(mockReq, mockRes)

      // Assert
      expect(GroupService.prototype.removeMember).toHaveBeenCalledWith('1', '10')
      expect(mockRes.status).toHaveBeenCalledWith(500)
      expect(mockRes.json).toHaveBeenCalledWith({
        error: {
          message: 'Failed to remove member',
          code: 'INTERNAL_ERROR',
        },
      })
      expect(log.error).toHaveBeenCalledWith(
        'Remove member 10 from group 1 error:',
        expect.any(Error)
      )
    })
  })
})
