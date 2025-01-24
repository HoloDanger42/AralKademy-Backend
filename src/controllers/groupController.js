import GroupService from '../services/groupService.js'
import { Group } from '../models/Group.js'
import { log } from '../utils/logger.js'

const groupService = new GroupService(Group)

const getAllGroups = async (_req, res) => {
  try {
    const groups = await groupService.getAllGroups()
    res.status(200).json(groups)
    log.info('Retrieved all groups')
  } catch (error) {
    log.error('Get all groups error:', error)
    return res.status(500).json({ message: 'Failed to retrieve groups' })
  }
}

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
        if (error.message === 'Group name is required') {
        return res.status(400).json({
            message: 'Group name is required',
        })
        }
        if (error.message === 'Group type is required') {
        return res.status(400).json({
            message: 'Group type is required',
        })
        }
        if (error.name === 'SequelizeValidationError') {
        const field = error.errors ? error.errors[0].path : 'unknown'
        return res.status(400).json({
            message: error.message,
            field: field,
        })
        }
        return res.status(500).json({ message: 'Error creating group' })
    }
}

const assignStudentTeacherMembers = async (req, res) => {
    try {
        const { userIds, groupId } = req.body
        const studentTeachers = await groupService.assignStudentTeacherMembers(userIds, groupId)
    
        res.status(200).json({
        message: 'Student teachers assigned successfully',
        studentTeachers,
        })
        log.info(`Student teachers assigned to group ${groupId}`)
    } catch (error) {
        log.error('Assign student teachers error:', error)
        if (error.message === 'One or more users are not student teachers') {
        return res.status(400).json({
            message: 'One or more users are not student teachers',
        })
        }
        return res.status(500).json({ message: 'Error assigning student teachers' })
    }
}

const assignLearnerMembers = async (req, res) => {
    try {
        const { userIds, groupId } = req.body
        const learners = await groupService.assignLearnerMembers(userIds, groupId)
    
        res.status(200).json({
        message: 'Learners assigned successfully',
        learners,
        })
        log.info(`Learners assigned to group ${groupId}`)
    } catch (error) {
        log.error('Assign learners error:', error)
        if (error.message === 'One or more users are not learners') {
        return res.status(400).json({
            message: 'One or more users are not learners',
        })
        }
        return res.status(500).json({ message: 'Error assigning learners' })
    }
}

export { getAllGroups, createGroup, assignLearnerMembers, assignStudentTeacherMembers }
