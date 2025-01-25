import { beforeEach, describe, expect, jest } from '@jest/globals';
import GroupService from '../../../src/services/groupService';
import { validGroupData, invalidGroupData, allGroups } from '../../fixtures/groupData';

// Mock models
const mockGroupModel = {
    create: jest.fn(),
    findAll: jest.fn(),
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
        test('should successfully create a group', async () => {
            // Arrange
            mockGroupModel.create.mockResolvedValue(validGroupData);

            // Act
            const group = await groupService.createGroup(validGroupData.group_id, validGroupData.name, validGroupData.group_type);

            // Assert
            expect(group).toEqual(validGroupData);
            expect(mockGroupModel.create).toHaveBeenCalledWith(validGroupData);  // Make sure the correct format is used
        });

        test('should throw error if required fields are missing', async () => {
            // Act & Assert
            await expect(groupService.createGroup(invalidGroupData.groupId, invalidGroupData.name, invalidGroupData.groupType)).rejects.toThrow('All fields are required');
        });

        test('should throw error if group creation fails', async () => {
            // Arrange
            mockGroupModel.create.mockRejectedValue(new Error('Failed to create group'));

            // Act & Assert
            await expect(groupService.createGroup(validGroupData.groupId, validGroupData.name, validGroupData.groupType)).rejects.toThrow('All fields are required');
        });
    });

    describe('getAllGroups', () => {
        test('should retrieve all groups', async () => {
            // Arrange
            mockGroupModel.findAll.mockResolvedValue(allGroups);

            // Act
            const result = await groupService.getAllGroups();

            // Assert
            expect(result).toEqual(allGroups);
            expect(mockGroupModel.findAll).toHaveBeenCalled();
        });

        test('should throw error if fetching all groups fails', async () => {
            // Arrange
            mockGroupModel.findAll.mockRejectedValue(new Error('Failed to fetch groups'));

            // Act & Assert
            await expect(groupService.getAllGroups()).rejects.toThrow('Failed to fetch groups');
        });

        test('should return an empty array if no groups exist', async () => {
            // Arrange
            mockGroupModel.findAll.mockResolvedValue([]);

            // Act
            const result = await groupService.getAllGroups();

            // Assert
            expect(result).toEqual([]);
        });
    });

    describe('assignStudentTeacherMembers', () => {
        test('should throw error if no student teachers found', async () => {
            // Arrange
            const userIds = [1, 2];
            const groupId = 1;

            mockLearnerModel.findAll.mockResolvedValue([]); // No student teachers found for the given userIds

            // Act & Assert
            await expect(groupService.assignStudentTeacherMembers(userIds, groupId))
                .rejects
                .toThrow('Failed to assign student teacher members');
        });

        test('should successfully assign student teacher members to a group', async () => {
            // Arrange
            const userIds = [1, 2];
            const groupId = 1;
            const studentTeacherMembers = [{ user_id: 1 }, { user_id: 2 }]; // Both valid

            mockStudentTeacherModel.findAll.mockResolvedValue(studentTeacherMembers);
            studentTeacherMembers.forEach(member => member.save = jest.fn().mockResolvedValue(member)); // Mock save as resolved

            // Act
            const result = await groupService.assignStudentTeacherMembers(userIds, groupId);

            // Assert
            expect(result).toEqual(studentTeacherMembers);
            studentTeacherMembers.forEach(member => expect(member.save).toHaveBeenCalled());
        });

        test('should throw error if some users are not student teachers', async () => {
            // Arrange
            const userIds = [1, 2];
            const groupId = 1;
            const studentTeacherMembers = [{ user_id: 1 }, { user_id: 3 }]; // One valid, one invalid

            mockStudentTeacherModel.findAll.mockResolvedValue(studentTeacherMembers);

            // Act & Assert
            await expect(groupService.assignStudentTeacherMembers(userIds, groupId))
                .rejects
                .toThrow('Failed to assign student teacher members');
        });
        test('should throw error if saving student teacher fails', async () => {
            // Arrange
            const userIds = [1, 2];
            const groupId = 1;
            const studentTeacherMembers = [
                { user_id: 1, save: jest.fn().mockRejectedValue(new Error('Save failed')) },
                { user_id: 2, save: jest.fn() }
            ];

            mockStudentTeacherModel.findAll.mockResolvedValue(studentTeacherMembers);

            // Act & Assert
            await expect(groupService.assignStudentTeacherMembers(userIds, groupId))
                .rejects
                .toThrow('Failed to assign student teacher members');
        });
    });

    describe('assignLearnerMembers', () => {
        test('should throw error if no learners found', async () => {
            // Arrange
            const userIds = [1, 2];
            const groupId = 1;

            mockLearnerModel.findAll.mockResolvedValue([]); // No learners found for the given userIds

            // Act & Assert
            await expect(groupService.assignLearnerMembers(userIds, groupId))
                .rejects
                .toThrow('Failed to assign learner members');
        });

        test('should successfully assign learner members to a group', async () => {
            // Arrange
            const userIds = [1, 2];
            const groupId = 1;
            const learnerMembers = [{ user_id: 1 }, { user_id: 2 }]; // Both valid

            mockLearnerModel.findAll.mockResolvedValue(learnerMembers);
            learnerMembers.forEach(member => member.save = jest.fn().mockResolvedValue(member)); // Mock save as resolved

            // Act
            const result = await groupService.assignLearnerMembers(userIds, groupId);

            // Assert
            expect(result).toEqual(learnerMembers);
            learnerMembers.forEach(member => expect(member.save).toHaveBeenCalled());
        });

        test('should throw error if some users are not learners', async () => {
            // Arrange
            const userIds = [1, 2];
            const groupId = 1;
            const learnerMembers = [{ user_id: 1 }, { user_id: 4 }]; // One valid, one invalid

            mockLearnerModel.findAll.mockResolvedValue(learnerMembers);

            // Act & Assert
            await expect(groupService.assignLearnerMembers(userIds, groupId))
                .rejects
                .toThrow('Failed to assign learner members');
        });

        test('should throw error if saving learner fails', async () => {
            // Arrange
            const userIds = [1, 2];
            const groupId = 1;
            const learnerMembers = [
                { user_id: 1, save: jest.fn().mockRejectedValue(new Error('Save failed')) },
                { user_id: 2, save: jest.fn() }
            ];

            mockLearnerModel.findAll.mockResolvedValue(learnerMembers);

            // Act & Assert
            await expect(groupService.assignLearnerMembers(userIds, groupId))
                .rejects
                .toThrow('Failed to assign learner members');
        });
    });
});
