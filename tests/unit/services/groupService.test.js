
import { beforeEach, describe, expect, jest } from '@jest/globals'
import GroupService from '../../../src/services/groupService'
import {
  validGroupData,
  invalidGroupData,
  allGroups,
  validStudentTeacherIds,
  validLearnerIds,
} from '../../fixtures/groupData'

// Mock models
const mockGroupModel = {
  create: jest.fn(),
  findAll: jest.fn(),
  findByPk: jest.fn(),
}

const mockStudentTeacherModel = {
  findAll: jest.fn(),
}

const mockLearnerModel = {
  findAll: jest.fn(),
}

const mockUserModel = {
  findAll: jest.fn(),
}

describe('Group Service', () => {
  let groupService

  beforeEach(() => {
    groupService = new GroupService(mockGroupModel, mockStudentTeacherModel, mockLearnerModel, mockUserModel)
    jest.resetAllMocks()
  })

  describe('createGroup', () => {
    test('should successfully create a group (create group)', async () => {
      // Arrange
      mockGroupModel.create.mockResolvedValue(validGroupData)

      // Act
      const group = await groupService.createGroup(
        validGroupData.name,
        validGroupData.group_type,
        validGroupData.group_id
      )

      // Assert
      expect(group).toEqual(validGroupData)
      expect(mockGroupModel.create).toHaveBeenCalledWith(validGroupData)
    })

    test('should throw error if required fields are missing (create group)', async () => {
      // Act & Assert
      await expect(
        groupService.createGroup(
          invalidGroupData.groupId,
          invalidGroupData.name,
          invalidGroupData.groupType
        )
      ).rejects.toThrow('All fields are required')
    })

    test('should throw error if group creation fails (create group)', async () => {
      // Arrange
      mockGroupModel.create.mockRejectedValue(new Error('Failed to create group'))

      // Act & Assert
      await expect(
        groupService.createGroup(
          validGroupData.group_id,
          validGroupData.name,
          validGroupData.group_type
        )
      ).rejects.toThrow('Failed to create group')
    })
  })

  describe('getAllGroups', () => {
    test('should retrieve all groups (get all groups)', async () => {
      // Arrange
      mockGroupModel.findAll.mockResolvedValue(allGroups)

      // Act
      const result = await groupService.getAllGroups()

      // Assert
      expect(result).toEqual(allGroups)
      expect(mockGroupModel.findAll).toHaveBeenCalled()
    })

    test('should throw error if fetching all groups fails (get all groups)', async () => {
      // Arrange
      mockGroupModel.findAll.mockRejectedValue(new Error('Failed to fetch groups'))

      // Act & Assert
      await expect(groupService.getAllGroups()).rejects.toThrow('Failed to fetch groups')
    })
  })

  describe('assignStudentTeacherMembers', () => {
    test('should assign student-teacher members to a group successfully (assign student teacher members)', async () => {
      // Arrange: Mock the student-teachers to be returned by findAll
      const studentTeachers = validStudentTeacherIds.map((userId) => ({
        user_id: userId,
        group_id: null,
        save: jest.fn().mockResolvedValue(true), // Mock save method
      }))
      mockStudentTeacherModel.findAll.mockResolvedValue(studentTeachers)

      // Act
      const result = await groupService.assignStudentTeacherMembers('1', validStudentTeacherIds)

      // Assert
      expect(result).toEqual(studentTeachers)
      expect(mockStudentTeacherModel.findAll).toHaveBeenCalledWith({
        where: { user_id: validStudentTeacherIds },
      })
      studentTeachers.forEach((studentTeacher) => expect(studentTeacher.group_id).toBe('1'))
      studentTeachers.forEach((studentTeacher) => expect(studentTeacher.save).toHaveBeenCalled())
    })

    test('should throw error if required fields are missing (assign student teacher members)', async () => {
      // Act & Assert
      await expect(
        groupService.assignStudentTeacherMembers(null, validStudentTeacherIds)
      ).rejects.toThrow('All fields are required')
      await expect(groupService.assignStudentTeacherMembers('1', null)).rejects.toThrow(
        'All fields are required'
      )
    })

    test('should throw error if assignment fails (assign student teacher members)', async () => {
      // Arrange
      const error = new Error('Failed to assign student teacher members')
      mockStudentTeacherModel.findAll.mockRejectedValue(error)

      // Act & Assert
      await expect(
        groupService.assignStudentTeacherMembers('1', validStudentTeacherIds)
      ).rejects.toThrow('Failed to assign student teacher members')
    })
  })

  describe('assignLearnerMembers', () => {
    test('should assign learner members to a group successfully (assign learner members)', async () => {
      // Arrange: Mock the learners to be returned by findAll
      const learners = validLearnerIds.map((userId) => ({
        user_id: userId,
        group_id: null,
        save: jest.fn().mockResolvedValue(true), // Mock save method
      }))
      mockLearnerModel.findAll.mockResolvedValue(learners)

      // Act
      const result = await groupService.assignLearnerMembers('1', validLearnerIds)
      // Assert
      expect(result).toEqual(learners)
      expect(mockLearnerModel.findAll).toHaveBeenCalledWith({ where: { user_id: validLearnerIds } })
      learners.forEach((learner) => expect(learner.group_id).toBe('1'))
      learners.forEach((learner) => expect(learner.save).toHaveBeenCalled())
    })

    test('should throw error if required fields are missing (assign learner members)', async () => {
      // Act & Assert
      await expect(groupService.assignLearnerMembers(null, '1')).rejects.toThrow(
        'All fields are required'
      )
      await expect(groupService.assignLearnerMembers(validLearnerIds, null)).rejects.toThrow(
        'All fields are required'
      )
    })

    test('should throw error if assignment fails (assign learner members)', async () => {
      // Arrange
      const error = new Error('Failed to assign learner members')
      mockLearnerModel.findAll.mockRejectedValue(error)

      // Act & Assert
      await expect(groupService.assignLearnerMembers(validLearnerIds, '1')).rejects.toThrow(
        'Failed to assign learner members'
      )
    })
  })

  describe('getGroupById', () => {
    test('should retrieve a group by ID (get group by id)', async () => {
      // Arrange
      mockGroupModel.findByPk.mockResolvedValue(validGroupData)

      // Act
      const result = await groupService.getGroupById(validGroupData.group_id)

      // Assert
      expect(result).toEqual(validGroupData)
      expect(mockGroupModel.findByPk).toHaveBeenCalledWith(validGroupData.group_id)
    })

    test('should throw error if group is not found (get group by id)', async () => {
      // Arrange
      mockGroupModel.findByPk.mockResolvedValue(null)

      // Act & Assert
      await expect(groupService.getGroupById('invalidGroupId')).rejects.toThrow(
        'Group not found'
      )
    })

    test('should throw error if fetching the group fails (get group by id)', async () => {
      // Arrange
      mockGroupModel.findByPk.mockRejectedValue(new Error('Failed to fetch group'))

      // Act & Assert
      await expect(groupService.getGroupById(validGroupData.group_id)).rejects.toThrow(
        'Failed to fetch group'
      )
    })
  })

  describe('updateGroup', () => {
    test('should update a group successfully', async () => {
      // Arrange
      const groupId = '1'
      const updatedData = { name: 'Updated Group Name' }

      const mockGroup = {
        ...validGroupData,
        update: jest.fn().mockImplementation(function (data) {
          Object.assign(this, data)
          return this
        }),
      }

      mockGroupModel.findByPk.mockResolvedValue(mockGroup)

      // Act
      const result = await groupService.updateGroup(groupId, updatedData)

      // Assert
      expect(result).toEqual(
        expect.objectContaining({
          group_id: '1',
          name: 'Updated Group Name',
          group_type: 'Student Teacher',
        })
      )
      expect(mockGroupModel.findByPk).toHaveBeenCalledWith(groupId)
      expect(mockGroup.update).toHaveBeenCalledWith(updatedData)
    })

    test('should throw error if group is not found (update group)', async () => {
      // Arrange
      mockGroupModel.findByPk.mockResolvedValue(null)

      // Act & Assert
      await expect(groupService.updateGroup('invalidId', { name: 'New Name' })).rejects.toThrow(
        'Group not found'
      )
    })

    test('should throw error if update fails', async () => {
      // Arrange
      mockGroupModel.findByPk.mockResolvedValue({
        ...validGroupData,
        update: jest.fn().mockRejectedValue(new Error('Update error')),
      })

      // Act & Assert
      await expect(groupService.updateGroup('1', { name: 'New Name' })).rejects.toThrow(
        'Failed to update group'
      )
    })
  })

  describe('deleteGroup', () => {
    test('should delete a group successfully', async () => {
      // Arrange
      const groupId = '1'
      const mockGroup = {
        ...validGroupData,
        destroy: jest.fn().mockResolvedValue(true),
      }
      mockGroupModel.findByPk.mockResolvedValue(mockGroup)

      // Act
      await groupService.deleteGroup(groupId)

      // Assert
      expect(mockGroupModel.findByPk).toHaveBeenCalledWith(groupId)
      expect(mockGroup.destroy).toHaveBeenCalled()
    })

    test('should throw error if group is not found (delete group)', async () => {
      // Arrange
      mockGroupModel.findByPk.mockResolvedValue(null)

      // Act & Assert
      await expect(groupService.deleteGroup('invalidId')).rejects.toThrow('Group not found')
    })

    test('should throw error if deletion fails', async () => {
      // Arrange
      mockGroupModel.findByPk.mockResolvedValue({
        ...validGroupData,
        destroy: jest.fn().mockRejectedValue(new Error('Deletion error')),
      })

      // Act & Assert
      await expect(groupService.deleteGroup('1')).rejects.toThrow('Failed to delete group')
    })
  })

  describe('getGroupMembers', () => { 
    test('should retrieve student teacher members of the group (get group members)', async () => {
      // Arrange
      const groupId = '1'
      const mockGroup = { group_id: groupId, group_type: 'student_teacher' }
      const mockMembers = [
        { user_id: 'st1', group_id: groupId },
        { user_id: 'st2', group_id: groupId },
      ]
  
      mockGroupModel.findByPk.mockResolvedValue(mockGroup)
      mockStudentTeacherModel.findAll.mockResolvedValue(mockMembers)
  
      // Act
      const result = await groupService.getGroupMembers(groupId)
  
      // Assert
      expect(result).toEqual(mockMembers)
      expect(mockGroupModel.findByPk).toHaveBeenCalledWith(groupId)
      expect(mockStudentTeacherModel.findAll).toHaveBeenCalledWith({
        where: { group_id: groupId },
        include: [{
          model: mockUserModel,
          as: 'user',
          attributes: ['id', 'first_name', 'middle_initial', 'last_name', 'email'],
        }],
      })
      expect(mockLearnerModel.findAll).not.toHaveBeenCalled()
    })
  
    test('should retrieve learner members of the group (get group members)', async () => {
      // Arrange
      const groupId = '2'
      const mockGroup = { group_id: groupId, group_type: 'learner' }
      const mockMembers = [
        { user_id: 'l1', group_id: groupId },
        { user_id: 'l2', group_id: groupId },
      ]
  
      mockGroupModel.findByPk.mockResolvedValue(mockGroup)
      mockLearnerModel.findAll.mockResolvedValue(mockMembers)
  
      // Act
      const result = await groupService.getGroupMembers(groupId)
  
      // Assert
      expect(result).toEqual(mockMembers)
      expect(mockGroupModel.findByPk).toHaveBeenCalledWith(groupId)
      expect(mockLearnerModel.findAll).toHaveBeenCalledWith({
        where: { group_id: groupId },
        include: [{
          model: mockUserModel,
          as: 'user',
          attributes: ['id', 'first_name', 'middle_initial', 'last_name', 'email'],
        }],
      })
      expect(mockStudentTeacherModel.findAll).not.toHaveBeenCalled()
    })
  
    test('should throw error if group is not found (get group members)', async () => {
      // Arrange
      const groupId = '3'
      mockGroupModel.findByPk.mockResolvedValue(null)
  
      // Act & Assert
      await expect(groupService.getGroupMembers(groupId)).rejects.toThrow('Group not found')
      expect(mockGroupModel.findByPk).toHaveBeenCalledWith(groupId)
      expect(mockStudentTeacherModel.findAll).not.toHaveBeenCalled()
      expect(mockLearnerModel.findAll).not.toHaveBeenCalled()
    })
  
    test('should throw error if model query fails (get group members)', async () => {
      // Arrange
      const groupId = '4'
      const mockGroup = { group_id: groupId, group_type: 'learner' }
      mockGroupModel.findByPk.mockResolvedValue(mockGroup)
      mockLearnerModel.findAll.mockRejectedValue(new Error('Database error'))
  
      // Act & Assert
      await expect(groupService.getGroupMembers(groupId)).rejects.toThrow('Failed to fetch group members')
      expect(mockGroupModel.findByPk).toHaveBeenCalledWith(groupId)
      expect(mockLearnerModel.findAll).toHaveBeenCalledWith({
        where: { group_id: groupId },
        include: [{
          model: mockUserModel,
          as: 'user',
          attributes: ['id', 'first_name', 'middle_initial', 'last_name', 'email'],        
        }],
      })
    })
  })

  describe('removeMember', () => {
    test('should successfully remove a student teacher member from the group (remove member)', async () => {
      // Arrange
      const groupId = '1'
      const userId = 'st1'
      const mockGroup = { group_id: groupId, group_type: 'student_teacher' }
      const mockMember = {
        user_id: userId,
        group_id: groupId,
        save: jest.fn().mockResolvedValue(true),
      }
  
      mockGroupModel.findByPk.mockResolvedValue(mockGroup)
      mockStudentTeacherModel.findOne = jest.fn().mockResolvedValue(mockMember)
  
      // Act
      const result = await groupService.removeMember(groupId, userId)
  
      // Assert
      expect(result).toEqual(mockMember)
      expect(mockGroupModel.findByPk).toHaveBeenCalledWith(groupId)
      expect(mockStudentTeacherModel.findOne).toHaveBeenCalledWith({
        where: { group_id: groupId, user_id: userId },
      })
      expect(mockMember.group_id).toBeNull()
      expect(mockMember.save).toHaveBeenCalled()
    })
  
    test('should successfully remove a learner member from the group (remove member)', async () => {
      // Arrange
      const groupId = '2'
      const userId = 'l1'
      const mockGroup = { group_id: groupId, group_type: 'learner' }
      const mockMember = {
        user_id: userId,
        group_id: groupId,
        save: jest.fn().mockResolvedValue(true),
      }
  
      mockGroupModel.findByPk.mockResolvedValue(mockGroup)
      mockLearnerModel.findOne = jest.fn().mockResolvedValue(mockMember)
  
      // Act
      const result = await groupService.removeMember(groupId, userId)
  
      // Assert
      expect(result).toEqual(mockMember)
      expect(mockGroupModel.findByPk).toHaveBeenCalledWith(groupId)
      expect(mockLearnerModel.findOne).toHaveBeenCalledWith({
        where: { group_id: groupId, user_id: userId },
      })
      expect(mockMember.group_id).toBeNull()
      expect(mockMember.save).toHaveBeenCalled()
    })
  
    test('should throw error if group is not found (remove member)', async () => {
      // Arrange
      const groupId = 'invalidGroup'
      const userId = 'st1'
      mockGroupModel.findByPk.mockResolvedValue(null)
  
      // Act & Assert
      await expect(groupService.removeMember(groupId, userId)).rejects.toThrow('Group not found')
      expect(mockGroupModel.findByPk).toHaveBeenCalledWith(groupId)
    })
  
    test('should throw error if member is not found in student teacher group (remove member)', async () => {
      // Arrange
      const groupId = '1'
      const userId = 'invalidUser'
      const mockGroup = { group_id: groupId, group_type: 'student_teacher' }
  
      mockGroupModel.findByPk.mockResolvedValue(mockGroup)
      mockStudentTeacherModel.findOne = jest.fn().mockResolvedValue(null)
  
      // Act & Assert
      await expect(groupService.removeMember(groupId, userId)).rejects.toThrow('Member not found')
      expect(mockStudentTeacherModel.findOne).toHaveBeenCalledWith({
        where: { group_id: groupId, user_id: userId },
      })
    })
  
    test('should throw error if member is not found in learner group (remove member)', async () => {
      // Arrange
      const groupId = '2'
      const userId = 'invalidUser'
      const mockGroup = { group_id: groupId, group_type: 'learner' }
  
      mockGroupModel.findByPk.mockResolvedValue(mockGroup)
      mockLearnerModel.findOne = jest.fn().mockResolvedValue(null)
  
      // Act & Assert
      await expect(groupService.removeMember(groupId, userId)).rejects.toThrow('Member not found')
      expect(mockLearnerModel.findOne).toHaveBeenCalledWith({
        where: { group_id: groupId, user_id: userId },
      })
    })
  
    test('should throw error if member removal fails due to save error (remove member)', async () => {
      // Arrange
      const groupId = '1'
      const userId = 'st1'
      const mockGroup = { group_id: groupId, group_type: 'student_teacher' }
      const mockMember = {
        user_id: userId,
        group_id: groupId,
        save: jest.fn().mockRejectedValue(new Error('Save error')),
      }
  
      mockGroupModel.findByPk.mockResolvedValue(mockGroup)
      mockStudentTeacherModel.findOne = jest.fn().mockResolvedValue(mockMember)
  
      // Act & Assert
      await expect(groupService.removeMember(groupId, userId)).rejects.toThrow('Failed to remove member')
      expect(mockMember.save).toHaveBeenCalled()
    })
  
    test('should throw error if unexpected model query fails (remove member)', async () => {
      // Arrange
      const groupId = '1'
      const userId = 'st1'
      mockGroupModel.findByPk.mockRejectedValue(new Error('Database error'))
  
      // Act & Assert
      await expect(groupService.removeMember(groupId, userId)).rejects.toThrow('Failed to remove member')
      expect(mockGroupModel.findByPk).toHaveBeenCalledWith(groupId)
    })
  })
})
