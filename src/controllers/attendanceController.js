<<<<<<< HEAD
import AttendanceService from '../services/attendanceService.js'
import { Attendance, Course, User, Group, StudentTeacher, Learner} from '../models/index.js'
import { log } from '../utils/logger.js'
import { handleControllerError } from '../utils/errorHandler.js'

const attendanceService = new AttendanceService(Attendance, Course, User, Group, StudentTeacher, Learner)

const createAttendance = async (req, res) => {
    try {
        const { courseId, date } = req.body
        const attendance = await attendanceService.createAttendance(courseId, date)
        res.status(201).json({
            message: 'Attendance created successfully',
            attendance
        })
        log.info(`Attendance for course ${courseId} on ${date} created successfully`)
    } catch (error) {
        return handleControllerError(error, res, 'Create attendance', 'Error creating attendance')
    }
}

const getAttendanceByCourseIdAndDate = async (req, res) => {
    try {
        const { courseId, date } = req.params

        const startDate = new Date(date);
        startDate.setUTCHours(0, 0, 0, 0);
        
        const endDate = new Date(startDate);
        endDate.setUTCHours(23, 59, 59, 999);

        const attendance = await attendanceService.getAttendanceByCourseIdAndDate(courseId, startDate, endDate)
        res.status(200).json(attendance)
    } catch (error) {
        return handleControllerError(error, res, 'Get attendance by course and date', 'Error fetching attendance')
    }
}

const setAttendanceStatus = async (req, res) => {
    try {
        const { attendanceId } = req.params
        const { status } = req.body
        const attendance = await attendanceService.setAttendanceStatus(attendanceId, status)
        res.status(200).json({
            message: 'Attendance status set successfully',
            attendance
        })
        log.info(`Attendance status for ID ${attendanceId} set to ${status}`)
    } catch (error) {
        return handleControllerError(error, res, 'Set attendance status', 'Error setting attendance status')
    }
}

const getAttendanceByCourseIdAndUserId = async (req, res) => {
    try {
        const { courseId, userId } = req.params
        const attendance = await attendanceService.getAttendanceByCourseIdAndUserId(courseId, userId)
        res.status(200).json(attendance)
    } catch (error) {
        return handleControllerError(error, res, 'Get attendance by course and user', 'Error fetching attendance')
    }
}

export {
    createAttendance,
    getAttendanceByCourseIdAndDate,
    setAttendanceStatus,
    getAttendanceByCourseIdAndUserId,
}
=======
import AttendanceService from '../services/attendanceService.js'
import { Attendance, Course, User, Group, StudentTeacher, Learner} from '../models/index.js'
import { log } from '../utils/logger.js'
import { handleControllerError } from '../utils/errorHandler.js'

const attendanceService = new AttendanceService(Attendance, Course, User, Group, StudentTeacher, Learner)

const createAttendance = async (req, res) => {
    try {
        const { courseId, date } = req.body
        const attendance = await attendanceService.createAttendance(courseId, date)
        res.status(201).json({
            message: 'Attendance created successfully',
            attendance
        })
        log.info(`Attendance for course ${courseId} on ${date} created successfully`)
    } catch (error) {
        return handleControllerError(error, res, 'Create attendance', 'Error creating attendance')
    }
}

const getAttendanceByCourseIdAndDate = async (req, res) => {
    try {
        const { courseId, date } = req.params

        const startDate = new Date(date);
        startDate.setUTCHours(0, 0, 0, 0);
        
        const endDate = new Date(startDate);
        endDate.setUTCHours(23, 59, 59, 999);

        const attendance = await attendanceService.getAttendanceByCourseIdAndDate(courseId, startDate, endDate)
        res.status(200).json(attendance)
    } catch (error) {
        return handleControllerError(error, res, 'Get attendance by course and date', 'Error fetching attendance')
    }
}

const setAttendanceStatus = async (req, res) => {
    try {
        const { attendanceId } = req.params
        const { status } = req.body
        const attendance = await attendanceService.setAttendanceStatus(attendanceId, status)
        res.status(200).json({
            message: 'Attendance status set successfully',
            attendance
        })
        log.info(`Attendance status for ID ${attendanceId} set to ${status}`)
    } catch (error) {
        return handleControllerError(error, res, 'Set attendance status', 'Error setting attendance status')
    }
}

const getAttendanceByCourseIdAndUserId = async (req, res) => {
    try {
        const { courseId, userId } = req.params
        const attendance = await attendanceService.getAttendanceByCourseIdAndUserId(courseId, userId)
        res.status(200).json(attendance)
    } catch (error) {
        return handleControllerError(error, res, 'Get attendance by course and user', 'Error fetching attendance')
    }
}

export {
    createAttendance,
    getAttendanceByCourseIdAndDate,
    setAttendanceStatus,
    getAttendanceByCourseIdAndUserId,
}
>>>>>>> 627466f638de697919d077ca56524377d406840d
