import { log } from '../utils/logger.js'

/**
 * @class GroupService
 * @description Service class for managing educational group operations including creation, assignment of members, and retrieval
 *
 * @property {Object} GroupModel - The database model for groups
 * @property {Object} StudentTeacherModel - The database model for student-teacher relationships
 * @property {Object} LearnerModel - The database model for learners
 *
 * @example
 * const groupService = new GroupService(GroupModel, StudentTeacherModel, LearnerModel);
 *
 * // Create a new group
 * const group = await groupService.createGroup('group123', 'Math Class', 'academic');
 *
 * // Assign teachers or student teachers to the group
 * await groupService.assignStudentTeacherMembers('group123', ['teacher1', 'teacher2']);
 *
 * // Assign learners to the group
 * await groupService.assignLearnerMembers(['student1', 'student2'], 'group123');
 *
 * // Get all groups of a specific type
 * const academicGroups = await groupService.getAllGroups({ group_type: 'academic' });
 *
 * // Get a specific group by ID
 * const specificGroup = await groupService.getGroupById('group123');
 */
class GroupService {
  /**
   * @class GroupService
   * @description Service class for handling group-related operations
   * @param {Object} GroupModel - The model for groups
   * @param {Object} StudentTeacherModel - The model for student-teacher relationships
   * @param {Object} LearnerModel - The model for learners
   */
  constructor(GroupModel, StudentTeacherModel, LearnerModel) {
    this.GroupModel = GroupModel
    this.StudentTeacherModel = StudentTeacherModel
    this.LearnerModel = LearnerModel
  }

  /**
   * Creates a new group in the system
   *
   * @async
   * @param {string} groupId - The unique identifier for the group
   * @param {string} name - The name of the group
   * @param {string} groupType - The type of the group
   * @returns {Promise<object>} The created group object
   * @throws {Error} If any required fields are missing or if group creation fails
   */
  async createGroup(name, groupType, groupId = null) {
    if (!name || !groupType) {
      throw new Error('All fields are required')
    }

    try {
      const createData = {
        name,
        group_type: groupType,
      }

      if (groupId) {
        createData.group_id = groupId
      }

      return await this.GroupModel.create(createData)
    } catch (error) {
      throw new Error('Failed to create group')
    }
  }

  /**
   * Assigns student-teacher members to a specific group.
   *
   * @param {string|number} groupId - The ID of the group to assign members to.
   * @param {Array<string|number>} userIds - An array of user IDs to be assigned to the group.
   * @returns {Promise<Array>} A promise that resolves to an array of the updated student-teacher records.
   * @throws {Error} Throws an error if any required fields are missing or if the assignment process fails.
   */
  async assignStudentTeacherMembers(groupId, userIds) {
    if (!groupId || !userIds) {
      throw new Error('All fields are required')
    }

    try {
      const studentTeachers = await this.StudentTeacherModel.findAll({
        where: { user_id: userIds },
      })

      for (const studentTeacher of studentTeachers) {
        studentTeacher.group_id = groupId
        await studentTeacher.save()
      }

      return studentTeachers
    } catch (error) {
      throw new Error('Failed to assign student teacher members')
    }
  }

  /**
   * Assigns multiple learners to a specific group
   * @param {Array<number|string>} userIds - Array of user IDs to assign to the group
   * @param {number|string} groupId - ID of the group to which the learners will be assigned
   * @returns {Promise<Array>} Promise resolving to an array of updated learner objects
   * @throws {Error} If any required fields are missing or if the assignment process fails
   */
  async assignLearnerMembers(groupId, userIds) {
    if (!groupId || !userIds) {
      throw new Error('All fields are required')
    }
  
    try {
      const learners = await this.LearnerModel.findAll({ where: { user_id: userIds }, })

      for (const learner of learners) {
        learner.group_id = groupId
        await learner.save()
      }
  
      return learners
    } catch (error) {
      throw new Error('Failed to assign learner members')
    }
  }

  /**
   * Retrieves all groups from the database, optionally filtered by group_type.
   *
   * @async
   * @param {Object} [options={}] - Optional filter parameters
   * @param {string} [options.group_type] - Type of group to filter by
   * @returns {Promise<Array>} A promise that resolves to an array of group objects
   * @throws {Error} If there is an issue fetching groups from the database
   */
  async getAllGroups(options = {}) {
    try {
      const whereClause = {}

      if (options.group_type) {
        whereClause.group_type = options.group_type
      }

      return await this.GroupModel.findAll({ where: whereClause })
    } catch (error) {
      log.error('Error fetching groups:', error)
      throw new Error('Failed to fetch groups')
    }
  }

  /**
   * Retrieves a group by its ID from the database.
   *
   * @async
   * @param {number|string} groupId - The ID of the group to retrieve
   * @returns {Promise<Object>} The retrieved group object
   * @throws {Error} If the group is not found or if there's an error during the fetch operation
   */
  async getGroupById(groupId) {
    try {
      const group = await this.GroupModel.findByPk(groupId)
      if (!group) {
        throw new Error('Group not found')
      }
      return group
    } catch (error) {
      throw new Error('Failed to fetch group')
    }
  }

  /**
   * Updates a group's information
   *
   * @async
   * @param {number|string} groupId - The ID of the group to update
   * @param {Object} updateData - The data to update
   * @returns {Promise<Object>} The updated group
   * @throws {Error} If group is not found or update fail
   */
  async updateGroup(groupId, updateData) {
    try {
      const group = await this.GroupModel.findByPk(groupId)
      if (!group) {
        throw new Error('Group not found')
      }

      await group.update(updateData)
      return group
    } catch (error) {
      log.error('Error updating group:', error)

      // Re-throw specific errors
      if (error.message === 'Group not found') {
        throw error
      }

      throw new Error('Failed to update group')
    }
  }

  /**
   * Deletes a group
   *
   * @async
   * @param {number|string} groupId - The ID of the group to delete
   * @returns {Promise<boolean>} True if deletion was successful
   * @throws {Error} If group is not found or deletion fails
   */
  async deleteGroup(groupId) {
    try {
      const group = await this.GroupModel.findByPk(groupId)
      if (!group) {
        throw new Error('Group not found')
      }

      await group.destroy({ force: true })
      return true
    } catch (error) {
      log.error('Error deleting group:', error)

      // Re-throw specific errors
      if (error.message === 'Group not found') {
        throw error
      }

      throw new Error('Failed to delete group')
    }
  }

  /**
 * Retrieves the members of a specific group based on the group's type.
 *
 * @async
 * @param {number|string} groupId - The ID of the group to retrieve members for.
 * @returns {Promise<Array>} A promise that resolves to an array of group members.
 * @throws {Error} If the group is not found or if there's an error during the fetch operation.
 * @throws {Error} If the group type is invalid.
 * @throws {Error} If there is an issue fetching group members.
 *
 * @example
 * const groupMembers = await groupService.getGroupMembers('group123');
 * console.log(groupMembers);
 */
  async getGroupMembers(groupId) {
    try {
      const group = await this.GroupModel.findByPk(groupId)
      if (!group) {
        throw new Error('Group not found')
      }

      let groupMembers = [];

      if (group.group_type === 'student_teacher') {
        groupMembers = await this.StudentTeacherModel.findAll({
          where: { group_id: groupId },
        })
      } else if (group.group_type === 'learner') {
        groupMembers = await this.LearnerModel.findAll({
          where: { group_id: groupId },
        })
      }

      return groupMembers
    } catch (error) {
      throw new Error('Failed to fetch group members')
    }
  }
}

export default GroupService
