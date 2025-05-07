import { sequelize } from '../../../src/config/database.js';
import { TeacherCourse } from '../../../src/models/TeacherCourse.js';
import { createTestCourse, createTestUser } from '../../helpers/testData.js';
import '../../../src/models/associate.js';

describe('TeacherCourse Model', () => {
  let course;
  let user;

  beforeEach(async () => {
    await sequelize.sync({ force: true }); // Reset the database
    course = await createTestCourse(); // Create a test course
    user = await createTestUser(); // Create a test user
  });

  afterAll(async () => {
    await sequelize.close(); // Close the database connection
  });

  describe('Creation', () => {
    it('should create a valid TeacherCourse', async () => {
      const teacherCourse = await TeacherCourse.create({
        course_id: course.id,
        user_id: user.id,
      });

      expect(teacherCourse).toHaveProperty('teacher_course_id');
      expect(teacherCourse.course_id).toBe(course.id);
      expect(teacherCourse.user_id).toBe(user.id);
    });

    it('should fail without required fields', async () => {
      await expect(TeacherCourse.create({})).rejects.toThrow();
    });
  });

  describe('Validation', () => {
    it('should fail if course_id is missing', async () => {
      await expect(
        TeacherCourse.create({
          user_id: user.id,
        })
      ).rejects.toThrow();
    });

    it('should fail if user_id is missing', async () => {
      await expect(
        TeacherCourse.create({
          course_id: course.id,
        })
      ).rejects.toThrow();
    });
  });

  describe('Associations', () => {
    it('should associate with course and user', async () => {
      const teacherCourse = await TeacherCourse.create({
        course_id: course.id,
        user_id: user.id,
      });

      const found = await TeacherCourse.findOne({
        where: { teacher_course_id: teacherCourse.teacher_course_id },
        include: ['course', 'teacher'], // Ensure associations are loaded
      });

      expect(found).not.toBeNull();
      expect(found.course_id).toBe(course.id);
      expect(found.user_id).toBe(user.id);
    });
  });

  describe('Soft Deletion', () => {
    it('should soft delete TeacherCourse', async () => {
      const teacherCourse = await TeacherCourse.create({
        course_id: course.id,
        user_id: user.id,
      });

      await teacherCourse.destroy();

      const found = await TeacherCourse.findOne({
        where: { teacher_course_id: teacherCourse.teacher_course_id },
        paranoid: false, // Include soft-deleted records
      });

      expect(found.deletedAt).toBeTruthy();
    });
  });

  describe('Query Operations', () => {
    it('should find TeacherCourses with pagination', async () => {
      const teacherCoursesData = Array.from({ length: 5 }, () => ({
        course_id: course.id,
        user_id: user.id,
      }));

      await Promise.all(teacherCoursesData.map((data) => TeacherCourse.create(data)));

      const { count, rows } = await TeacherCourse.findAndCountAll({
        limit: 2,
        offset: 0,
      });

      expect(count).toBe(5);
      expect(rows.length).toBe(2);
    });
  });
});