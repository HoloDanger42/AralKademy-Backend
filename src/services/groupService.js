class GroupService {
  constructor(GroupModel, StudentTeacherModel, LearnerModel) {
    this.GroupModel = GroupModel;
    this.StudentTeacherModel = StudentTeacherModel;
    this.LearnerModel = LearnerModel;
  }

  async createGroup(groupId, name, groupType) {
    if (!groupId || !name || !groupType) {
      throw new Error('All fields are required');
    }

    try {
      return await this.GroupModel.create({
        group_id: groupId,
        name,
        group_type: groupType
      });
    } catch (error) {
      throw new Error('Failed to create group');
    }
  }

  async assignStudentTeacherMembers(userIds, groupId) {
    try {
      const studentTeachers = await this.StudentTeacherModel.findAll({ where: { user_id: userIds } });
      if (studentTeachers.length !== userIds.length) {
        throw new Error('One or more users are not student teachers');
      }

      for (const studentTeacher of studentTeachers) {
        studentTeacher.group_id = groupId;
        await studentTeacher.save();
      }

      return studentTeachers;
    } catch (error) {
      throw new Error('Failed to assign student teacher members');
    }
  }

  async assignLearnerMembers(userIds, groupId) {
    try {
      const learners = await this.LearnerModel.findAll({ where: { user_id: userIds } });
      if (learners.length !== userIds.length) {
        throw new Error('One or more users are not learners');
      }

      for (const learner of learners) {
        learner.group_id = groupId;
        await learner.save();
      }

      return learners;
    } catch (error) {
      throw new Error('Failed to assign learner members');
    }
  }

  async getAllGroups() {
    try {
      return await this.GroupModel.findAll();
    } catch (error) {
      throw new Error('Failed to fetch groups');
    }
  }
}

export default GroupService;