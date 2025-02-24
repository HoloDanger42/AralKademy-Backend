import { beforeEach, describe, expect, jest } from '@jest/globals';
import GroupService from '../../../src/services/groupService';
import { validGroupData, invalidGroupData, allGroups, validStudentTeacherIds, validLearnerIds } from '../../fixtures/groupData';

// Mock models
const mockGroupModel = {
    create: jest.fn(),
    findAll: jest.fn(),
    findByPk: jest.fn(),
};

const mockStudentTeacherModel = {
    findAll: jest.fn(),
};

const mockLearnerModel = {
    findAll: jest.fn(),
};

describe('Group Service', () => {
    let groupService;

    beforeEach(() => {
        groupService = new GroupService(mockGroupModel, mockStudentTeacherModel, mockLearnerModel);
        jest.resetAllMocks();
    });

    describe('createGroup', () => {
        test('should successfully create a group (create group)', async () => {
            // Arrange
            mockGroupModel.create.mockResolvedValue(validGroupData);

            // Act
            const group = await groupService.createGroup(validGroupData.group_id, validGroupData.name, validGroupData.group_type);

            // Assert
            expect(group).toEqual(validGroupData);
            expect(mockGroupModel.create).toHaveBeenCalledWith(validGroupData);
        });

        test('should throw error if required fields are missing (create group)', async () => {
            // Act & Assert
            await expect(groupService.createGroup(invalidGroupData.groupId, invalidGroupData.name, invalidGroupData.groupType)).rejects.toThrow('All fields are required');
        });

        test('should throw error if group creation fails (create group)', async () => {
            // Arrange
            mockGroupModel.create.mockRejectedValue(new Error('Failed to create group'));

            // Act & Assert
            await expect(groupService.createGroup(validGroupData.group_id, validGroupData.name, validGroupData.group_type)).rejects.toThrow('Failed to create group');
        });
    });

    describe('getAllGroups', () => {
        test('should retrieve all groups (get all groups)', async () => {
            // Arrange
            mockGroupModel.findAll.mockResolvedValue(allGroups);

            // Act
            const result = await groupService.getAllGroups();

            // Assert
            expect(result).toEqual(allGroups);
            expect(mockGroupModel.findAll).toHaveBeenCalled();
        });

        test('should throw error if fetching all groups fails (get all groups)', async () => {
            // Arrange
            mockGroupModel.findAll.mockRejectedValue(new Error('Failed to fetch groups'));

            // Act & Assert
            await expect(groupService.getAllGroups()).rejects.toThrow('Failed to fetch groups');
        });
    });

    describe('assignStudentTeacherMembers', () => {
        test('should assign student-teacher members to a group successfully (assign student teacher members)', async () => {
            // Arrange: Mock the student-teachers to be returned by findAll
            const studentTeachers = validStudentTeacherIds.map(userId => ({
                user_id: userId,
                group_id: null,
                save: jest.fn().mockResolvedValue(true), // Mock save method
            }));
            mockStudentTeacherModel.findAll.mockResolvedValue(studentTeachers);
    
            // Act
            const result = await groupService.assignStudentTeacherMembers('1', validStudentTeacherIds);
    
            // Assert
            expect(result).toEqual(studentTeachers);
            expect(mockStudentTeacherModel.findAll).toHaveBeenCalledWith({ where: { user_id: validStudentTeacherIds } });
            studentTeachers.forEach(studentTeacher => expect(studentTeacher.group_id).toBe('1'));
            studentTeachers.forEach(studentTeacher => expect(studentTeacher.save).toHaveBeenCalled());
        });
    
        test('should throw error if required fields are missing (assign student teacher members)', async () => {
            // Act & Assert
            await expect(groupService.assignStudentTeacherMembers(null, validStudentTeacherIds)).rejects.toThrow('All fields are required');
            await expect(groupService.assignStudentTeacherMembers('1', null)).rejects.toThrow('All fields are required');
        });
    
        test('should throw error if assignment fails (assign student teacher members)', async () => {
            // Arrange
            const error = new Error('Failed to assign student teacher members');
            mockStudentTeacherModel.findAll.mockRejectedValue(error);
    
            // Act & Assert
            await expect(groupService.assignStudentTeacherMembers('1', validStudentTeacherIds)).rejects.toThrow('Failed to assign student teacher members');
        });
    });
    
    describe('assignLearnerMembers', () => {
        test('should assign learner members to a group successfully (assign learner members)', async () => {
            // Arrange: Mock the learners to be returned by findAll
            const learners = validLearnerIds.map(userId => ({
                user_id: userId,
                group_id: null,
                save: jest.fn().mockResolvedValue(true), // Mock save method
            }));
            mockLearnerModel.findAll.mockResolvedValue(learners);
    
            // Act
            const result = await groupService.assignLearnerMembers(validLearnerIds, '1');
    
            // Assert
            expect(result).toEqual(learners);
            expect(mockLearnerModel.findAll).toHaveBeenCalledWith({ where: { user_id: validLearnerIds } });
            learners.forEach(learner => expect(learner.group_id).toBe('1'));
            learners.forEach(learner => expect(learner.save).toHaveBeenCalled());
        });
    
        test('should throw error if required fields are missing (assign learner members)', async () => {
            // Act & Assert
            await expect(groupService.assignLearnerMembers(null, '1')).rejects.toThrow('All fields are required');
            await expect(groupService.assignLearnerMembers(validLearnerIds, null)).rejects.toThrow('All fields are required');
        });
    
        test('should throw error if assignment fails (assign learner members)', async () => {
            // Arrange
            const error = new Error('Failed to assign learner members');
            mockLearnerModel.findAll.mockRejectedValue(error);
    
            // Act & Assert
            await expect(groupService.assignLearnerMembers(validLearnerIds, '1')).rejects.toThrow('Failed to assign learner members');
        });
    });

    describe('getGroupById', () => {
        test('should retrieve a group by ID (get group by id)', async () => {
            // Arrange
            mockGroupModel.findByPk.mockResolvedValue(validGroupData);

            // Act
            const result = await groupService.getGroupById(validGroupData.group_id);

            // Assert
            expect(result).toEqual(validGroupData);
            expect(mockGroupModel.findByPk).toHaveBeenCalledWith(validGroupData.group_id);
        });

        test('should throw error if group is not found (get group by id)', async () => {
            // Arrange
            mockGroupModel.findByPk.mockResolvedValue(null);

            // Act & Assert
            await expect(groupService.getGroupById('invalidGroupId')).rejects.toThrow('Failed to fetch group');
        });

        test('should throw error if fetching the group fails (get group by id)', async () => {
            // Arrange
            mockGroupModel.findByPk.mockRejectedValue(new Error('Failed to fetch group'));

            // Act & Assert
            await expect(groupService.getGroupById(validGroupData.group_id)).rejects.toThrow('Failed to fetch group');
        });
    });
});