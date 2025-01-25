import GroupService from '../services/groupService.js'
import { Group } from '../models/Group.js'
import { log } from '../utils/logger.js'

const groupService = new GroupService(Group)

const getAllGroups = async (_req, res) => {
    try {
      const groups = await groupService.getAllGroups();
      res.status(200).json(groups);
      log.info('Retrieved all groups');
    } catch (error) {
      log.error('Get all groups error:', error);
      return res.status(500).json({ message: 'Failed to retrieve groups' });
    }
  };
  
  const createGroup = async (req, res) => {
    try {
      const { groupId, name, groupType } = req.body;
      const newGroup = await groupService.createGroup(groupId, name, groupType);
  
      res.status(201).json({
        message: 'Group created successfully',
        group: newGroup,
      });
      log.info(`Group ${name} was successfully created`);
    } catch (error) {
      log.error('Create group error:', error);
      if (error.message === 'All fields are required') {
        return res.status(400).json({ message: 'All fields are required' });
      }
      return res.status(500).json({ message: 'Failed to create group' });
    }
  };
  
  const assignStudentTeacherMembers = async (req, res) => {
    try {
      const { userIds, groupId } = req.body;
      const members = await groupService.assignStudentTeacherMembers(userIds, groupId);
  
      res.status(200).json({
        message: 'Student teacher members assigned to group successfully',
        members,
      });
      log.info(`Student teacher members assigned to group ${groupId}`);
    } catch (error) {
      log.error('Assign student teacher members error:', error);
      if (error.message === 'One or more users are not student teachers') {
        return res.status(400).json({ message: 'One or more users are not student teachers' });
      }
      return res.status(500).json({ message: 'Failed to assign student teacher members' });
    }
  };
  
  const assignLearnerMembers = async (req, res) => {
    try {
      const { userIds, groupId } = req.body;
      const members = await groupService.assignLearnerMembers(userIds, groupId);
  
      res.status(200).json({
        message: 'Learner members assigned to group successfully',
        members,
      });
      log.info(`Learner members assigned to group ${groupId}`);
    } catch (error) {
      log.error('Assign learner members error:', error);
      if (error.message === 'One or more users are not learners') {
        return res.status(400).json({ message: 'One or more users are not learners' });
      }
      return res.status(500).json({ message: 'Failed to assign learner members' });
    }
  };

export { getAllGroups, createGroup, assignLearnerMembers, assignStudentTeacherMembers }
