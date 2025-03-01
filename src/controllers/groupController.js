import GroupService from '../services/groupService.js'
import { Group } from '../models/Group.js'
import { log } from '../utils/logger.js'

const groupService = new GroupService(Group)

/**
 * Retrieves all groups, optionally filtered by group type.
 * @param {Object} req - The request object containing query parameters.
 * @param {Object} res - The response object.
 */
const getAllGroups = async (req, res) => {
  try {
    const { group_type } = req.query // Get group_type from query parameters.

    const whereClause = {} // Start with an empty WHERE clause.

    if (group_type) {
      // IMPORTANT: Validate the group_type to prevent SQL injection
      if (group_type !== 'learner' && group_type !== 'student_teacher') {
        return res.status(400).json({ message: 'Invalid group_type' })
      }
      whereClause.group_type = group_type // Add group_type filter if provided and valid.
    }

    const groups = await Group.findAll({
      where: whereClause, // Use the WHERE clause
    })
    res.status(200).json(groups)
  } catch (error) {
    log.error('Error getting groups:', error)
    res.status(500).json({ message: 'Failed to retrieve groups' })
  }
}

/**
 * Creates a new group.
 * @param {Object} req - The request object containing group details.
 * @param {Object} res - The response object.
 */
const createGroup = async (req, res) => {
  try {
    const { groupId, name, groupType } = req.body
    const newGroup = await groupService.createGroup(groupId, name, groupType)

    res.status(201).json({
      message: 'Group created successfully',
      group: newGroup,
    })
    log.info(`Group ${name} was successfully created`)
  } catch (error) {
    log.error('Create group error:', error)
    if (error.message === 'All fields are required') {
      return res.status(400).json({ message: 'All fields are required' })
    }
    return res.status(500).json({ message: 'Failed to create group' })
  }
}

/**
 * Retrieves a group by ID.
 * @param {Object} req - The request object containing the group ID in req.params.
 * @param {Object} res - The response object.
 */
const getGroupById = async (req, res) => {
  try {
    const { groupId } = req.params
    const group = await groupService.getGroupById(groupId)

    if (!group) {
      return res.status(404).json({ message: 'Group not found' })
    }

    res.status(200).json(group)
    log.info(`Retrieved group with id ${groupId}`)
  } catch (error) {
    log.error('Get group by id error:', error)
    return res.status(500).json({ message: 'Failed to retrieve group' })
  }
}

/**
 * Assigns learner members to a group.
 * @param {Object} req - The request object containing user IDs and group ID.
 * @param {Object} res - The response object.
 */
const assignLearnerMembers = async (req, res) => {
  try {
    const { userIds, groupId } = req.body
    const learners = await groupService.assignLearnerMembers(userIds, groupId)

    res.status(200).json({
      message: 'Learners assigned successfully',
      learners,
    })
    log.info('Learners assigned successfully')
  } catch (error) {
    log.error('Assign learner members error:', error)
    if (error.message === 'All fields are required') {
      return res.status(400).json({ message: 'All fields are required' })
    }
    return res.status(500).json({ message: 'Failed to assign learner members' })
  }
}

/**
 * Assigns student teacher members to a group.
 * @param {Object} req - The request object containing user IDs and group ID.
 * @param {Object} res - The response object.
 */
const assignStudentTeacherMembers = async (req, res) => {
  try {
    const { userIds, groupId } = req.body
    const studentTeachers = await groupService.assignStudentTeacherMembers(groupId, userIds)

    res.status(200).json({
      message: 'Student teachers assigned successfully',
      studentTeachers,
    })
    log.info('Student teachers assigned successfully')
  } catch (error) {
    log.error('Assign student teacher members error:', error)
    if (error.message === 'All fields are required') {
      return res.status(400).json({ message: 'All fields are required' })
    }
    return res.status(500).json({ message: 'Failed to assign student teacher members' })
  }
}

export { getAllGroups, createGroup, assignLearnerMembers, assignStudentTeacherMembers, getGroupById }