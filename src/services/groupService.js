import { log } from '../utils/logger.js'

class GroupService {
  constructor(GroupModel, StudentTeacherModel, LearnerModel) {
    this.GroupModel = GroupModel
    this.StudentTeacherModel = StudentTeacherModel
    this.LearnerModel = LearnerModel
  }

  async createGroup(groupId, name, groupType) {
    if (!groupId || !name || !groupType) {
      throw new Error('All fields are required')
    }

    try {
      return await this.GroupModel.create({
        group_id: groupId,
        name,
        group_type: groupType,
      })
    } catch (error) {
      throw new Error('Failed to create group')
    }
  }

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

  async assignLearnerMembers(userIds, groupId) {
    if (!groupId || !userIds) {
      throw new Error('All fields are required')
    }

    try {
      const learners = await this.LearnerModel.findAll({ where: { user_id: userIds } })

      for (const learner of learners) {
        learner.group_id = groupId
        await learner.save()
      }

      return learners
    } catch (error) {
      throw new Error('Failed to assign learner members')
    }
  }

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
}

export default GroupService
