import { log } from '../utils/logger.js'
import GroupService from './groupService.js';
import Sequelize from 'sequelize'

class AttendanceService {
    constructor(attendanceModel, courseModel, userModel, groupModel, studentTeacherModel, learnerModel) {
        this.attendanceModel = attendanceModel
        this.courseModel = courseModel
        this.userModel = userModel

        this.groupService = new GroupService(
            groupModel,
            studentTeacherModel,
            learnerModel,
            userModel
        );
    }

    async createAttendance(courseId, date) {
        try {
            const course = await this.courseModel.findByPk(courseId)

            if (!course) {
                throw new Error('Course not found')
            }

            const learners = await this.groupService.getGroupMembers(course.learner_group_id)

            const attendanceRecords = await Promise.all(
                learners.map(async (learner) => {
                    const attendanceRecord = await this.attendanceModel.create({
                        course_id: course.id,
                        user_id: learner.user.id,
                        date: date,
                        status: 'not marked',
                    })
                    return attendanceRecord
                })
            )

            return attendanceRecords
        } catch (error) {
            log.error('Error creating attendance:', error)
            throw error
        }
    }

    async getAttendanceByCourseIdAndDate(courseId, startDate, endDate) {
        try {
            const attendanceRecords = await this.attendanceModel.findAll({
                where: {
                    course_id: courseId,
                    date: {
                        [Sequelize.Op.between]: [startDate, endDate]
                    }
                },
                include: [
                    {
                        model: this.userModel,
                        as: 'user',
                        attributes: ['first_name', 'middle_initial', 'last_name'],
                    },
                ],
            })

            return attendanceRecords
        } catch (error) {
            log.error('Error fetching attendance:', error)
            throw error
        }
    }

    async setAttendanceStatus(attendanceId, status) {
        try {
            const attendanceRecord = await this.attendanceModel.findByPk(attendanceId)

            if (!attendanceRecord) {
                throw new Error('Attendance record not found')
            }

            attendanceRecord.status = status
            await attendanceRecord.save()

            return attendanceRecord
        } catch (error) {
            log.error('Error updating attendance status:', error)
            throw error
        }
    }

    async getAttendanceByCourseIdAndUserId(courseId, userId) {
        try {
            const attendanceRecords = await this.attendanceModel.findAll({
                where: {
                    course_id: courseId,
                    user_id: userId,
                },
                include: [
                    {
                        model: this.userModel,
                        as: 'user',
                        attributes: ['first_name', 'middle_initial', 'last_name'],
                    },
                ],
            })

            return attendanceRecords
        } catch (error) {
            log.error('Error fetching attendance:', error)
            throw error
        }
    }
}

export default AttendanceService
