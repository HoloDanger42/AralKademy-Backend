import { log } from '../utils/logger.js'
import GroupService from './groupService.js';

// Configure nodemailer with proper error handling
const transporter = (() => {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        log.warn('Email credentials not configured.')
        return null
    }

    return nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    })
})()

class AnnouncementService {
    constructor(announcementModel, courseModel, userModel) {
        this.announcementModel = announcementModel
        this.courseModel = courseModel
        this.userModel = userModel
        this.groupModel = groupModel
        this.studentTeacherModel = studentTeacherModel
        this.learnerModel = learnerModel

        this.groupService = new GroupService(
            groupModel,
            studentTeacherModel,
            learnerModel
        );
    }

    async createAnnouncement(announcementData, skipEmail = false) {
        try {
            if (announcementData.courseId) {
                const course = await this.courseModel.findByPk(announcementData.courseId)
                if (!course) {
                    throw new Error('Course not found')
                }

                const announcement = await this.announcementModel.create(announcementData)

                const learnerGroup = await this.groupModel.findOne({
                    where: { course_id: course.id, group_type: 'learner' },
                })



                if (learnerGroup) {
                    const learners = await this.groupService.getGroupMembers(learnerGroup.group_id)
                    const emails = learners.map((learner) => learner.email)

                    if (!skipEmail) {
                        try {
                            if (!transporter) {
                                log.error('Email service not configured.')
                                throw new Error('Email service unavailable')
                            }

                            const emailPromises = emails.map((email) => {
                                const mailOptions = {
                                    from: process.env.EMAIL_USER,
                                    to: email,
                                    subject: `${course.name} Announcement`,
                                    text:
                                        `New announcement in ${course.name}: ${announcement.title}`,
                                    html: `<p>${announcement.message}</p>`,
                                }
                                return transporter.sendMail(mailOptions)
                            })
                            await Promise.all(emailPromises)
                        } catch (emailError) {
                            log.error('Failed to send email:', emailError)
                        }
                    }
                }

                return announcement
            } else {
                const announcement = await this.announcementModel.create(announcementData)
                return announcement
            }
        } catch (error) {
            log.error('Error creating announcement:', error)
            throw error
        }
    }

    async getAnnouncementsByCourseId(courseId) {
        try {
            const course = await this.courseModel.findByPk(courseId)
            if (!course) {
                throw new Error('Course not found')
            }

            const announcements = await this.announcementModel.findAll({
                where: { course_id: courseId },
                include: [
                    {
                        model: this.userModel,
                        attributes: ['id', 'first_name', 'last_name'],
                    },
                    {
                        model: this.courseModel,
                        attributes: ['id', 'name'],
                    },
                ],
            })
            return announcements
        } catch (error) {
            log.error('Error fetching announcements:', error)
            throw error
        }
    }

    async getGlobalAnnouncements() {
        try {
            const announcements = await this.announcementModel.findAll({
                where: { is_global: true },
                include: [
                    {
                        model: this.userModel,
                        attributes: ['id', 'first_name', 'last_name'],
                    },
                ],
            })
            return announcements
        } catch (error) {
            log.error('Error fetching global announcements:', error)
            throw error
        }
    }

    async getAnnouncementById(announcementId) {
        try {
            const announcement = await this.announcementModel.findOne({
                where: { announcement_id: announcementId },
                include: [
                    {
                        model: this.userModel,
                        attributes: ['id', 'first_name', 'last_name'],
                    },
                    {
                        model: this.courseModel,
                        attributes: ['id', 'name'],
                        required: false,
                    },
                ],
            })

            if (!announcement) {
                throw new Error('Announcement not found')
            }
            return announcement
        } catch (error) {
            log.error('Error fetching announcement:', error)
            throw error
        }
    }

    async getAnnouncementsByUserIdAndCourseId(userId, courseId) {
        try {
            const user = await this.userModel.findByPk(userId)
            if (!user) {
                throw new Error('User not found')
            }

            const course = await this.courseModel.findByPk(courseId)
            if (!course) {
                throw new Error('Course not found')
            }

            const announcements = await this.announcementModel.findAll({
                where: { user_id: userId, course_id: courseId },
                include: [
                    {
                        model: this.userModel,
                        attributes: ['id', 'first_name', 'last_name'],
                    },
                    {
                        model: this.courseModel,
                        attributes: ['id', 'name'],
                    },
                ],
            })
            return announcements
        } catch (error) {
            log.error('Error fetching announcements:', error)
            throw error
        }
    }

    async getAnnouncementsByUserId(userId) {
        try {
            const user = await this.userModel.findByPk(userId)
            if (!user) {
                throw new Error('User not found')
            }

            const announcements = await this.announcementModel.findAll({
                where: { user_id: userId },
                include: [
                    {
                        model: this.userModel,
                        attributes: ['id', 'first_name', 'last_name'],
                    },
                    {
                        model: this.courseModel,
                        attributes: ['id', 'name'],
                        required: false,
                    },
                ],
            })
            return announcements
        } catch (error) {
            log.error('Error fetching announcements:', error)
            throw error
        }
    }

}

export default AnnouncementService
