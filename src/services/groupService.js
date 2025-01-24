class GroupService {
  constructor(GroupModel) {
    this.GroupModel = GroupModel;
    this.StudentTeacherModel = StudentTeacherModel;
    this.LearnerModel = LearnerModel;
  }

  async createGroup(groupId, name, groupType) {
      return await this.GroupModel.create({
        group_id: groupId,
        name,
        group_type: groupType
      })
  }

  async assignStudentTeacherMembers(userIds, groupId) {
    const studentTeachers = await this.StudentTeacherModel.findAll({ where: { user_id: userIds } });
    if (studentTeachers.length !== userIds.length) {
      throw new Error('One or more users are not student teachers');
    }
  
    for (const studentTeacher of studentTeachers) {
      studentTeacher.group_id = groupId;
      await studentTeacher.save();
    }
  
    return studentTeachers;
  }

  async assignLearnerMembers(userIds, groupId) {
    const learners = await this.LearnerModel.findAll({ where: { user_id: userIds } });
    if (learners.length !== userIds.length) {
      throw new Error('One or more users are not learners');
    }
  
    for (const learner of learners) {
      learner.group_id = groupId;
      await learner.save();
    }
  
    return learners;
  }

  async getAllGroups() {
    return await this.GroupModel.findAll();
  }
}

export default GroupService;