<<<<<<< HEAD
import GroupService from '../services/groupService.js'
import { Group, Learner, StudentTeacher, User } from '../models/index.js'
import { log } from '../utils/logger.js'
import { handleControllerError } from '../utils/errorHandler.js'

const groupService = new GroupService(Group, StudentTeacher, Learner, User)

/**
 * Retrieves all groups, optionally filtered by group type.
 * @param {Object} req - The request object containing query parameters.
 * @param {Object} res - The response object.
 */
const getAllGroups = async (req, res) => {
  try {
    const { group_type } = req.query

    let options = {}
    if (group_type) {
      if (group_type !== 'learner' && group_type !== 'student_teacher') {
        return res.status(400).json({ message: 'Invalid group_type' })
      }
      options.group_type = group_type
    }

    const groups = await groupService.getAllGroups(options)
    res.status(200).json(groups)
    log.info('Retrieved all groups')
  } catch (error) {
    return handleControllerError(error, res, 'Get all groups', 'Failed to retrieve groups')
  }
}

/**
 * Creates a new group.
 * @param {Object} req - The request object containing group details.
 * @param {Object} res - The response object.
 */
const createGroup = async (req, res) => {
  try {
    const { name, groupType, groupId } = req.body
    const newGroup = await groupService.createGroup(name, groupType, groupId)

    res.status(201).json({
      message: 'Group created successfully',
      group: newGroup,
    })
    log.info(`Group ${name} was successfully created`)
  } catch (error) {
    return handleControllerError(error, res, 'Create group', 'Failed to create group')
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
    return handleControllerError(
      error,
      res,
      `Get group ${req.params.groupId}`,
      'Failed to retrieve group'
    )
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
    const learners = await groupService.assignLearnerMembers(groupId, userIds)

    res.status(200).json({
      message: 'Learners assigned successfully',
      learners,
    })
    log.info('Learners assigned successfully')
  } catch (error) {
    return handleControllerError(
      error,
      res,
      'Assign learner members',
      'Failed to assign learner members'
    )
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
    return handleControllerError(
      error,
      res,
      'Assign student teacher members',
      'Failed to assign student teacher members'
    )
  }
}

/**
 * Updates a group's information.
 * @param {Object} req - The request object containing the group ID in req.params and update data in req.body.
 * @param {Object} res - The response object.
 */
const updateGroup = async (req, res) => {
  try {
    const { groupId } = req.params
    const updateData = req.body

    const updatedGroup = await groupService.updateGroup(groupId, updateData)

    res.status(200).json({
      message: 'Group updated successfully',
      group: updatedGroup,
    })
    log.info(`Group with id ${groupId} updated successfully`)
  } catch (error) {
    return handleControllerError(
      error,
      res,
      `Update group ${req.params.groupId}`,
      'Failed to update group'
    )
  }
}

/**
 * Removes a member from a specific group.
 * @param {Object} req - The request object containing the group ID and user ID in req.params.
 * @param {Object} res - The response object.
 */
const removeMember = async (req, res) => {
  try {
    const { groupId, userId } = req.params
    const removedMember = await groupService.removeMember(groupId, userId)

    res.status(200).json({
      message: 'Member removed successfully',
      member: removedMember,
    })
    log.info(`Member with id ${userId} removed from group with id ${groupId}`)
  } catch (error) {
    return handleControllerError(
      error,
      res,
      `Remove member ${req.params.userId} from group ${req.params.groupId}`,
      'Failed to remove member'
    )
  }
}

/**
 * Deletes a group.
 * @param {Object} req - The request object containing the group ID in req.params.
 * @param {Object} res - The response object.
 */
const deleteGroup = async (req, res) => {
  try {
    const { groupId } = req.params

    await groupService.deleteGroup(groupId)

    res.status(200).json({ message: 'Group deleted successfully' })
    log.info(`Group with id ${groupId} deleted successfully`)
  } catch (error) {
    return handleControllerError(
      error,
      res,
      `Delete group ${req.params.groupId}`,
      'Failed to delete group'
    )
  }
}

/**
 * Retrieves the members of a specific group based on the group's type.
 * @param {Object} req - The request object containing the group ID in req.params.
 * @param {Object} res - The response object.
 */
const getGroupMembers = async (req, res) => {
  try {
    const { groupId } = req.params
    const groupMembers = await groupService.getGroupMembers(groupId)

    res.status(200).json(groupMembers)
    log.info(`Retrieved group members for group with id ${groupId}`)
  } catch (error) {
    return handleControllerError(
      error,
      res,
      `Get group members for group ${req.params.groupId}`,
      'Failed to retrieve group members'
    )
  }
}

export {
  getAllGroups,
  createGroup,
  assignLearnerMembers,
  assignStudentTeacherMembers,
  getGroupById,
  updateGroup,
  deleteGroup,
  getGroupMembers,
  removeMember
}
=======
import GroupService from '../services/groupService.js'
import { Group, Learner, StudentTeacher, User } from '../models/index.js'
import { log } from '../utils/logger.js'
import { handleControllerError } from '../utils/errorHandler.js'

const groupService = new GroupService(Group, StudentTeacher, Learner, User)

/**
 * Retrieves all groups, optionally filtered by group type.
 * @param {Object} req - The request object containing query parameters.
 * @param {Object} res - The response object.
 */
const getAllGroups = async (req, res) => {
  try {
    const { group_type } = req.query

    let options = {}
    if (group_type) {
      if (group_type !== 'learner' && group_type !== 'student_teacher') {
        return res.status(400).json({ message: 'Invalid group_type' })
      }
      options.group_type = group_type
    }

    const groups = await groupService.getAllGroups(options)
    res.status(200).json(groups)
    log.info('Retrieved all groups')
  } catch (error) {
    return handleControllerError(error, res, 'Get all groups', 'Failed to retrieve groups')
  }
}

/**
 * Creates a new group.
 * @param {Object} req - The request object containing group details.
 * @param {Object} res - The response object.
 */
const createGroup = async (req, res) => {
  try {
    const { name, groupType, groupId } = req.body
    const newGroup = await groupService.createGroup(name, groupType, groupId)

    res.status(201).json({
      message: 'Group created successfully',
      group: newGroup,
    })
    log.info(`Group ${name} was successfully created`)
  } catch (error) {
    return handleControllerError(error, res, 'Create group', 'Failed to create group')
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
    return handleControllerError(
      error,
      res,
      `Get group ${req.params.groupId}`,
      'Failed to retrieve group'
    )
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
    const learners = await groupService.assignLearnerMembers(groupId, userIds)

    res.status(200).json({
      message: 'Learners assigned successfully',
      learners,
    })
    log.info('Learners assigned successfully')
  } catch (error) {
    return handleControllerError(
      error,
      res,
      'Assign learner members',
      'Failed to assign learner members'
    )
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
    return handleControllerError(
      error,
      res,
      'Assign student teacher members',
      'Failed to assign student teacher members'
    )
  }
}

/**
 * Updates a group's information.
 * @param {Object} req - The request object containing the group ID in req.params and update data in req.body.
 * @param {Object} res - The response object.
 */
const updateGroup = async (req, res) => {
  try {
    const { groupId } = req.params
    const updateData = req.body

    const updatedGroup = await groupService.updateGroup(groupId, updateData)

    res.status(200).json({
      message: 'Group updated successfully',
      group: updatedGroup,
    })
    log.info(`Group with id ${groupId} updated successfully`)
  } catch (error) {
    return handleControllerError(
      error,
      res,
      `Update group ${req.params.groupId}`,
      'Failed to update group'
    )
  }
}

/**
 * Removes a member from a specific group.
 * @param {Object} req - The request object containing the group ID and user ID in req.params.
 * @param {Object} res - The response object.
 */
const removeMember = async (req, res) => {
  try {
    const { groupId, userId } = req.params
    const removedMember = await groupService.removeMember(groupId, userId)

    res.status(200).json({
      message: 'Member removed successfully',
      member: removedMember,
    })
    log.info(`Member with id ${userId} removed from group with id ${groupId}`)
  } catch (error) {
    return handleControllerError(
      error,
      res,
      `Remove member ${req.params.userId} from group ${req.params.groupId}`,
      'Failed to remove member'
    )
  }
}

/**
 * Deletes a group.
 * @param {Object} req - The request object containing the group ID in req.params.
 * @param {Object} res - The response object.
 */
const deleteGroup = async (req, res) => {
  try {
    const { groupId } = req.params

    await groupService.deleteGroup(groupId)

    res.status(200).json({ message: 'Group deleted successfully' })
    log.info(`Group with id ${groupId} deleted successfully`)
  } catch (error) {
    return handleControllerError(
      error,
      res,
      `Delete group ${req.params.groupId}`,
      'Failed to delete group'
    )
  }
}

/**
 * Retrieves the members of a specific group based on the group's type.
 * @param {Object} req - The request object containing the group ID in req.params.
 * @param {Object} res - The response object.
 */
const getGroupMembers = async (req, res) => {
  try {
    const { groupId } = req.params
    const groupMembers = await groupService.getGroupMembers(groupId)

    res.status(200).json(groupMembers)
    log.info(`Retrieved group members for group with id ${groupId}`)
  } catch (error) {
    return handleControllerError(
      error,
      res,
      `Get group members for group ${req.params.groupId}`,
      'Failed to retrieve group members'
    )
  }
}

export {
  getAllGroups,
  createGroup,
  assignLearnerMembers,
  assignStudentTeacherMembers,
  getGroupById,
  updateGroup,
  deleteGroup,
  getGroupMembers,
  removeMember
}
>>>>>>> 627466f638de697919d077ca56524377d406840d
