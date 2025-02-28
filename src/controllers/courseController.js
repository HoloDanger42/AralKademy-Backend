import CourseService from '../services/courseService.js';
import { Course } from '../models/Course.js';
import { User } from '../models/User.js'; // Import User model
import { Group } from '../models/Group.js'
import { log } from '../utils/logger.js';

const courseService = new CourseService(Course, User, Group); // Pass User model

/**
 * Retrieves all courses.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 */
const getAllCourses = async (req, res) => {
    try {
        const courses = await courseService.getAllCourses();
        res.status(200).json(courses);
    } catch (error) {
        log.error('Error getting all courses:', error);
        res.status(500).json({ message: 'Failed to retrieve courses' });
    }
};

/**
 * Retrieves a course by ID.
 * @param {Object} req - The request object containing the course ID in req.params.
 * @param {Object} res - The response object.
 */
const getCourseById = async (req, res) => {
    try {
        const { id } = req.params;
        const course = await courseService.getCourseById(id);
        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }
        res.status(200).json(course);
    } catch (error) {
        log.error(`Error getting course by ID ${req.params.id}:`, error);
        res.status(500).json({ message: 'Failed to retrieve course' });
    }
};

/**
 * Creates a new course.
 * @param {Object} req - The request object containing course details.
 * @param {Object} res - The response object.
 */
const createCourse = async (req, res) => {
    try {
        // --- ROLE CHECK (Admin Only) ---
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Forbidden: Only admins can create courses.' });
        }

        const courseData = req.body;

        // --- Validation (Controller's Responsibility) ---
        const errors = {};
        if (!courseData.name) errors.name = 'Course name is required.';
        if (courseData.description === undefined) errors.description = 'Description is required.';
        // Validate user_id (teacher) if provided
        if (courseData.user_id) {
            const teacher = await User.findByPk(courseData.user_id);
            if (!teacher || teacher.role !== 'teacher') {
                errors.user_id = 'Invalid teacher ID.';
            }
        }
        // Validate learner_group_id if provided
        if (courseData.learner_group_id) {
            const learnerGroup = await Group.findByPk(courseData.learner_group_id);
            if (!learnerGroup) {
                errors.learner_group_id = 'Invalid learner group ID.';
            }
        }

        // Validate student_teacher_group_id if provided
        if (courseData.student_teacher_group_id) {
            const studentTeacherGroup = await Group.findByPk(courseData.student_teacher_group_id);
            if (!studentTeacherGroup) {
                errors.student_teacher_group_id = 'Invalid student teacher group ID.';
            }
        }

        if (Object.keys(errors).length > 0) {
            return res.status(400).json({ errors });
        }
        // --- End Validation ---

        const newCourse = await courseService.createCourse(courseData);

        res.status(201).json({
            message: 'Course created successfully',
            course: newCourse,
        });
        log.info(`Course ${newCourse.name} created successfully`);

    } catch (error) {
        log.error('Create course error:', error);
        if (error.name === 'SequelizeValidationError') {
            const sequelizeErrors = {};
            error.errors.forEach((err) => {
                sequelizeErrors[err.path] = err.message;
            });
            return res.status(400).json({ errors: sequelizeErrors });
        }
        // Handle unique constraint violation (course name)
        if (error.message === 'Course name already exists') {
            return res.status(409).json({ errors: { name: error.message } }); // 409 Conflict
        }
        return res.status(500).json({ message: 'Failed to create course' });
    }
};

/**
 * Updates a course.
 * @param {Object} req - The request object containing the course ID in req.params and updated data in req.body.
 * @param {Object} res - The response object.
 */
const updateCourse = async (req, res) => {
    try {
        // --- ROLE CHECK (Admin Only) ---
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Forbidden: Only admins can update courses.' });
        }

        const { id } = req.params;
        const courseData = req.body;
        // --- Validation ---
        const errors = {};
        if (!courseData.name) errors.name = 'Course name is required.';
        if (courseData.description === undefined) errors.description = 'Description is required';

        // Validate user_id (teacher), if provided
        if (courseData.user_id) {
          const teacher = await User.findByPk(courseData.user_id);
          if (!teacher || teacher.role !== 'teacher') {
            errors.user_id = 'Invalid teacher ID.';
          }
        }
        // Validate learner_group_id if provided
        if (courseData.learner_group_id) {
            const learnerGroup = await Group.findByPk(courseData.learner_group_id);
            if (!learnerGroup) {
                errors.learner_group_id = 'Invalid learner group ID.';
            }
        }

        // Validate student_teacher_group_id if provided
        if (courseData.student_teacher_group_id) {
            const studentTeacherGroup = await Group.findByPk(courseData.student_teacher_group_id);
            if (!studentTeacherGroup) {
                errors.student_teacher_group_id = 'Invalid student teacher group ID.';
            }
        }

        if (Object.keys(errors).length > 0) {
            return res.status(400).json({ errors });
        }
        // --- End Validation ---

        const updatedCourse = await courseService.updateCourse(id, courseData);
        res.status(200).json(updatedCourse);
        log.info(`Course with id ${id} updated successfully`);
    } catch (error) {
      log.error(`Error updating course with ID ${req.params.id}:`, error);
        if (error.message === 'Course not found') {
            return res.status(404).json({ message: error.message });
        }
         if (error.name === 'SequelizeValidationError') {
            const sequelizeErrors = {};
            error.errors.forEach((err) => {
                sequelizeErrors[err.path] = err.message;
            });
            return res.status(400).json({ errors: sequelizeErrors });
        }
         if (error.message === 'Course name already exists') {
            return res.status(409).json({ errors: { name: error.message } }); // 409 Conflict
        }
        return res.status(500).json({ message: error.message || 'Failed to update course' });
    }
};

/**
 * Soft deletes a course.
 * @param {Object} req - The request object containing the course ID in req.params.
 * @param {Object} res - The response object.
 */
const softDeleteCourse = async (req, res) => {
    try {
        // --- ROLE CHECK (Admin Only) ---
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Forbidden: Only admins can soft-delete courses.' });
        }
        const { id } = req.params;
        await courseService.softDeleteCourse(id);
        res.status(204).end(); // No Content
        log.info(`Course with ID ${id} soft-deleted successfully`);

    } catch (error) {
        log.error(`Error soft-deleting course with ID ${req.params.id}:`, error);
        if (error.message === 'Course not found') {
            return res.status(404).json({ message: error.message });
        }
        return res.status(500).json({ message: 'Failed to delete course' });
    }
};

/**
 * Permanently deletes a course.
 * @param {Object} req - The request object containing the course ID in req.params.
 * @param {Object} res - The response object.
 */
const deleteCourse = async (req, res) => {
    try {
        // --- ROLE CHECK (Admin Only) ---
        if (req.user.role !== 'admin') {
          return res.status(403).json({
            message: "Forbidden: Only admins can permanently delete courses.",
          });
        }

        const { id } = req.params;
        await courseService.deleteCourse(id);
        res.status(204).end();
        log.info(`Course with ID ${id} permanently deleted successfully`);
      } catch (error) {
        log.error(`Error deleting course with ID ${req.params.id}:`, error);
        if (error.message === "Course not found") {
          return res.status(404).json({ message: error.message });
        }
        return res.status(500).json({ message: "Failed to delete course" });
      }
};

/**
 * Assigns a teacher to a course.
 * @param {Object} req - The request object containing the course ID in req.params and the teacher's user ID in req.body.
 * @param {Object} res - The response object.
 */
const assignTeacherCourse = async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Forbidden: Only admins can assign teachers to courses.' });
        }

        const { id } = req.params;  // Course ID
        const { userId } = req.body; // Teacher's user ID

        const updatedCourse = await courseService.assignTeacherCourse(id, userId);
        res.status(200).json({ message: 'Teacher assigned successfully', course: updatedCourse });
        log.info(`Teacher ${userId} assigned to course ${id}`);

    } catch (error) {
        log.error('Error assigning teacher to course:', error);
         if (error.message === 'Course not found') {
            return res.status(404).json({ message: error.message });
        }
        if(error.message === 'Teacher not found'){
            return res.status(404).json({message: error.message})
        }
         if (error.message === 'Provided user ID is not a teacher.') {
            return res.status(400).json({ message: error.message }); // Bad request
        }
        return res.status(500).json({ message: error.message || 'Failed to assign teacher' });
    }
};

/**
 * Assigns a learner group to a course.
 * @param {Object} req - The request object containing the course ID in req.params and the learner group ID in req.body.
 * @param {Object} res - The response object.
 */
const assignLearnerGroupCourse = async (req, res) => {
    try {
        if (req.user.role !== 'admin' && req.user.role !== 'teacher') {
          return res.status(403).json({ message: 'Forbidden: Only admins and teachers can assign learner groups.'});
        }
      const { id } = req.params; // Get course ID from params
      const { learnerGroupId } = req.body; // Get group ID from body

      const updatedCourse = await courseService.assignLearnerGroupCourse(
        id,
        learnerGroupId
      );
      res
        .status(200)
        .json({
          message: "Learner group assigned successfully",
          course: updatedCourse,
        });
      log.info(`Learner group ${learnerGroupId} assigned to course ${id}`);
    } catch (error) {
        log.error("Error assigning learner group to course:", error);
         if (error.message === 'Course not found') {
            return res.status(404).json({ message: error.message });
        }
        if (error.message === 'Learner Group not found') {
            return res.status(404).json({ message: error.message });
        }
         if (error.message === "Invalid group type. Expected type is learner") {
            return res.status(400).json({ message: error.message });
        }
        return res.status(500).json({message: error.message || 'Failed to assign learner group'})
    }
  };

/**
 * Assigns a student teacher group to a course.
 * @param {Object} req - The request object containing the course ID in req.params and the student teacher group ID in req.body.
 * @param {Object} res - The response object.
 */
const assignStudentTeacherGroupCourse = async (req, res) => {
    try {
         if (req.user.role !== 'admin' && req.user.role !== 'teacher') {
          return res.status(403).json({ message: 'Forbidden: Only admins and teachers can assign student-teacher groups.'});
        }
      const { id } = req.params;
      const { studentTeacherGroupId } = req.body;

      const updatedCourse =
        await courseService.assignStudentTeacherGroupCourse(
          id,
          studentTeacherGroupId
        );
      res
        .status(200)
        .json({
          message: "Student teacher group assigned successfully",
          course: updatedCourse,
        });
      log.info(
        `Student teacher group ${studentTeacherGroupId} assigned to course ${id}`
      );
    } catch (error) {
        log.error("Error assigning student teacher group to course:", error);
        if (error.message === 'Course not found') {
            return res.status(404).json({ message: error.message });
        }
        if(error.message === "Student Teacher Group not found"){
            return res.status(404).json({ message: error.message});
        }
         if (error.message === "Invalid group type. Expected type is student_teacher") {
            return res.status(400).json({ message: error.message });
        }
        return res.status(500).json({message: error.message || 'Failed to assign student teacher group' });

    }
};

export {
    getAllCourses,
    createCourse,
    updateCourse,
    getCourseById,
    softDeleteCourse,
    deleteCourse,
    assignTeacherCourse,
    assignLearnerGroupCourse, // Export
    assignStudentTeacherGroupCourse // Export
};