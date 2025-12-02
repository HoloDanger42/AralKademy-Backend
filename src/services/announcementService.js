import { log } from '../utils/logger.js'
import GroupService from './groupService.js'
import UserService from './userService.js'
import nodemailer from 'nodemailer'

// Create a function to get transporter to make it testable
function getTransporter() {
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
}

class AnnouncementService {
  constructor(
    announcementModel,
    courseModel,
    userModel,
    groupModel,
    studentTeacherModel,
    learnerModel,
    teacherModel,
    adminModel,
    enrollmentModel,
    schoolModel,
    blacklistModel
  ) {
    this.announcementModel = announcementModel
    this.courseModel = courseModel
    this.userModel = userModel

    this.groupService = new GroupService(groupModel, studentTeacherModel, learnerModel, userModel)

    this.userService = new UserService(
      userModel,
      teacherModel,
      adminModel,
      studentTeacherModel,
      learnerModel,
      enrollmentModel,
      courseModel,
      groupModel,
      schoolModel,
      blacklistModel
    )
  }

  async createAnnouncement(course_id = null, title, message, user_id, skipEmail = false) {
    try {
      if (course_id) {
        const course = await this.courseModel.findByPk(course_id)
        if (!course) {
          throw new Error('Course not found')
        }

        const announcement = await this.announcementModel.create({
          course_id,
          title,
          message,
          user_id,
        })

        const postedBy = await this.userModel.findByPk(announcement.user_id)

        if (!postedBy) {
          throw new Error('Posted by not found')
        }

        const learners = await this.groupService.getGroupMembers(course.learner_group_id)
        const emails = learners.map((learner) => learner.user.email)

        if (!skipEmail) {
          try {
            const transporter = getTransporter()
            if (!transporter) {
              log.error('Email service not configured.')
              throw new Error('Email service unavailable')
            }

            const emailPromises = emails.map((email) => {
              const mailOptions = {
                from: process.env.EMAIL_USER,
                to: email,
                subject: `${course.name} Announcement`,
                text: `New announcement in ${course.name}: ${announcement.title}\n\n${announcement.message}\n\nPosted by: ${postedBy.first_name} ${postedBy.last_name}`,
                html: `
                                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
                                        <h2 style="color: #4a4a4a;">New Announcement in ${course.name}</h2>
                                        <p><strong>Title:</strong> ${announcement.title}</p>
                                        <p><strong>Message:</strong></p>
                                        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px;">
                                        <p>${announcement.message}</p>
                                        </div>
                                        <p><strong>Posted by:</strong> ${postedBy.first_name} ${postedBy.last_name}</p>
                                        <p>For more information, please log in to your account on the platform.</p>
                                        <p>If you have any questions, feel free to contact us at aralkademy.techsupp@gmail.com.</p>
                                        <p>Best regards,</p>
                                        <p><strong>AralKademy Team</strong></p>
                                    </div>
                                    `,
              }
              return transporter.sendMail(mailOptions)
            })
            await Promise.all(emailPromises)
          } catch (emailError) {
            log.error('Failed to send email:', emailError)
          }
        }

        return announcement
      } else {
        const announcement = await this.announcementModel.create({
          course_id,
          title,
          message,
          user_id,
        })

        const postedBy = await this.userModel.findByPk(announcement.user_id)

        if (!postedBy) {
          throw new Error('Posted by not found')
        }

        const roles = ['learner', 'teacher', 'student_teacher']
        const userPromises = roles.map((role) => this.userService.getUsersByRole(role))
        const usersByRole = await Promise.all(userPromises)
        const users = usersByRole.flat()
        const emails = users.map((user) => user.email)

        if (!skipEmail) {
          try {
            const transporter = getTransporter()
            if (!transporter) {
              log.error('Email service not configured.')
              throw new Error('Email service unavailable')
            }

            const emailPromises = emails.map((email) => {
              const mailOptions = {
                from: process.env.EMAIL_USER,
                to: email,
                subject: `Announcement`,
                text: `New announcement: ${announcement.title}\n\n${announcement.message}\n\nPosted by: ${postedBy.first_name} ${postedBy.last_name}`,
                html: `
                                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
                                        <h2 style="color: #4a4a4a;">New Announcement</h2>
                                        <p><strong>Title:</strong> ${announcement.title}</p>
                                        <p><strong>Message:</strong></p>
                                        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px;">
                                        <p>${announcement.message}</p>
                                        </div>
                                        <p><strong>Posted by:</strong> ${postedBy.first_name} ${postedBy.last_name}</p>
                                        <p>For more information, please log in to your account on the platform.</p>
                                        <p>If you have any questions, feel free to contact us at aralkademy.techsupp@gmail.com.</p>
                                        <p>Best regards,</p>
                                        <p><strong>AralKademy Team</strong></p>
                                    </div>
                                    `,
              }
              return transporter.sendMail(mailOptions)
            })
            await Promise.all(emailPromises)
          } catch (emailError) {
            log.error('Failed to send email:', emailError)
          }
        }

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
            as: 'user',
            attributes: ['id', 'first_name', 'last_name'],
          },
          {
            model: this.courseModel,
            as: 'course',
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
        where: { course_id: null },
        include: [
          {
            model: this.userModel,
            as: 'user',
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
            as: 'user',
            attributes: ['id', 'first_name', 'last_name'],
          },
          {
            model: this.courseModel,
            as: 'course',
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
            as: 'user',
            attributes: ['id', 'first_name', 'last_name'],
          },
          {
            model: this.courseModel,
            as: 'course',
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
            as: 'user',
            attributes: ['id', 'first_name', 'last_name'],
          },
          {
            model: this.courseModel,
            as: 'course',
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

  async updateAnnouncement(announcementId, course_id = null, title, message, user_id) {
    try {
      const announcement = await this.announcementModel.findByPk(announcementId)

      if (!announcement) {
        throw new Error('Announcement not found')
      }

      if (course_id) {
        const course = await this.courseModel.findByPk(course_id)
        if (!course) {
          throw new Error('Course not found')
        }
      }

      await announcement.update({
        course_id,
        title,
        message,
        user_id,
      })
      return announcement
    } catch (error) {
      log.error('Error updating announcement:', error)
      throw error
    }
  }

  async deleteAnnouncement(announcementId) {
    try {
      const announcement = await this.announcementModel.findByPk(announcementId)

      if (!announcement) {
        throw new Error('Announcement not found')
      }

      await announcement.destroy()
      return { message: 'Announcement deleted successfully' }
    } catch (error) {
      log.error('Error deleting announcement:', error)
      throw error
    }
  }
}

export default AnnouncementService
