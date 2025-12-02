import AnnouncementService from '../services/announcementService.js'
import { Announcement, Course, User, Group, StudentTeacher, Learner, Teacher, Admin, Enrollment, School, Blacklist } from '../models/index.js'
import { log } from '../utils/logger.js'
import { handleControllerError } from '../utils/errorHandler.js'

const announcementService = new AnnouncementService(Announcement, Course, User, Group, StudentTeacher, Learner, Teacher, Admin, Enrollment, School, Blacklist)

const createAnnouncement = async (req, res) => {
    try {
        const { course_id, title, message } = req.body
        const user_id = req.user.id
        const announcement = await announcementService.createAnnouncement(course_id, title, message, user_id)
        res.status(201).json({
            message: 'Announcement created successfully',
            announcement
        })
        log.info(`Announcement ${announcement.title} created successfully`)
    } catch (error) {
        return handleControllerError(error, res, 'Create announcement', 'Error creating announcement')
    }
}

const getAnnouncementsByCourseId = async (req, res) => {
    try {
        const { courseId } = req.params
        const announcements = await announcementService.getAnnouncementsByCourseId(courseId)
        res.status(200).json(announcements)
    } catch (error) {
        return handleControllerError(error, res, 'Get announcements by course', 'Error fetching announcements')
    }
}

const getGlobalAnnouncements = async (req, res) => {
    try {
        const announcements = await announcementService.getGlobalAnnouncements()
        res.status(200).json(announcements)
    } catch (error) {
        return handleControllerError(error, res, 'Get global announcements', 'Error fetching global announcements')
    }
}

const getAnnouncementById = async (req, res) => {
    try {
        const { announcementId } = req.params
        const announcement = await announcementService.getAnnouncementById(announcementId)
        res.status(200).json(announcement)
    } catch (error) {
        return handleControllerError(error, res, 'Get announcement by ID', 'Error fetching announcement')
    }
}

const getAnnouncementsByUserIdAndCourseId = async (req, res) => {
    try {
        const { userId, courseId } = req.params
        const announcements = await announcementService.getAnnouncementsByUserIdAndCourseId(userId, courseId)
        res.status(200).json(announcements)
    } catch (error) {
        return handleControllerError(error, res, 'Get user announcements by course', 'Error fetching announcements')
    }
}

const getAnnouncementsByUserId = async (req, res) => {
    try {
        const { userId } = req.params
        const announcements = await announcementService.getAnnouncementsByUserId(userId)
        res.status(200).json(announcements)
    } catch (error) {
        return handleControllerError(error, res, 'Get user announcements', 'Error fetching announcements')
    }
}

const updateAnnouncement = async (req, res) => {
    try {
        const { announcementId } = req.params
        const { course_id, title, message } = req.body
        const user_id = req.user.id
        const announcement = await announcementService.updateAnnouncement(announcementId, course_id, title, message, user_id)
        res.status(200).json({
            message: 'Announcement updated successfully',
            announcement
        })
    } catch (error) {
        return handleControllerError(error, res, 'Update announcement', 'Error updating announcement')
    }
}

const deleteAnnouncement = async (req, res) => {
    try {
        const { announcementId } = req.params
        await announcementService.deleteAnnouncement(announcementId)
        res.status(200).json({ message: 'Announcement deleted successfully' })
    } catch (error) {
        return handleControllerError(error, res, 'Delete announcement', 'Error deleting announcement')
    }
}

export {
    createAnnouncement,
    getAnnouncementsByCourseId,
    getGlobalAnnouncements,
    getAnnouncementById,
    getAnnouncementsByUserIdAndCourseId,
    getAnnouncementsByUserId,
    updateAnnouncement,
    deleteAnnouncement,
}
