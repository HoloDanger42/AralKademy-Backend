import swaggerJSDoc from 'swagger-jsdoc'
import config from './config.js'

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Aralkademy LMS API',
      version: config.version,
      description: 'API documentation for the Aralkademy Learning Management System',
      contact: {
        name: 'Support',
        email: 'lennardace.flores.cics@ust.edu.ph',
        url: 'https://discord.gg/vXt5BchWRV',
      },
    },
    servers: [
      {
        url: `http://localhost:${config.port}/api`,
        description: 'Development server',
      },
      {
        url: process.env.PRODUCTION_API_URL || 'https://aralkademy-backend.onrender.com/api',
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            message: { type: 'string' },
          },
        },

        User: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            email: { type: 'string', format: 'email' },
            first_name: { type: 'string' },
            last_name: { type: 'string' },
            middle_initial: { type: 'string' },
            role: { type: 'string', enum: ['admin', 'teacher', 'student_teacher', 'learner'] },
            school_id: { type: 'integer' },
            birth_date: { type: 'string', format: 'date' },
            contact_no: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },

        Course: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            name: { type: 'string' },
            description: { type: 'string' },
            user_id: { type: 'integer' },
            student_teacher_group_id: { type: 'integer' },
            learner_group_id: { type: 'integer' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },

        Enrollment: {
          type: 'object',
          properties: {
            enrollment_id: { type: 'integer' },
            email: { type: 'string', format: 'email' },
            first_name: { type: 'string' },
            last_name: { type: 'string' },
            middle_initial: { type: 'string' },
            birth_date: { type: 'string', format: 'date' },
            contact_no: { type: 'string' },
            school_id: { type: 'integer' },
            year_level: { type: 'integer' },
            status: { type: 'string', enum: ['pending', 'approved', 'rejected'] },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },

        Group: {
          type: 'object',
          properties: {
            group_id: { type: 'integer' },
            name: { type: 'string' },
            group_type: { type: 'string', enum: ['student_teacher', 'learner'] },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },

        Module: {
          type: 'object',
          properties: {
            module_id: { type: 'integer' },
            course_id: { type: 'integer' },
            name: { type: 'string' },
            description: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },

        Content: {
          type: 'object',
          properties: {
            content_id: { type: 'integer' },
            module_id: { type: 'integer' },
            name: { type: 'string' },
            link: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },

        Assessment: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            title: { type: 'string' },
            description: { type: 'string' },
            course_id: { type: 'integer' },
            type: { type: 'string', enum: ['quiz', 'assignment', 'exam'] },
            max_score: { type: 'integer' },
            passing_score: { type: 'integer' },
            duration_minutes: { type: 'integer' },
            due_date: { type: 'string', format: 'date-time' },
            is_published: { type: 'boolean' },
            instructions: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },

        Question: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            assessment_id: { type: 'integer' },
            question_text: { type: 'string' },
            question_type: {
              type: 'string',
              enum: ['multiple_choice', 'true_false', 'short_answer', 'essay'],
            },
            points: { type: 'integer' },
            order_index: { type: 'integer' },
            media_url: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },

        QuestionOption: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            question_id: { type: 'integer' },
            option_text: { type: 'string' },
            is_correct: { type: 'boolean' },
            order_index: { type: 'integer' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },

        Submission: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            assessment_id: { type: 'integer' },
            user_id: { type: 'integer' },
            status: { type: 'string', enum: ['in_progress', 'submitted', 'graded'] },
            start_time: { type: 'string', format: 'date-time' },
            submit_time: { type: 'string', format: 'date-time' },
            score: { type: 'integer' },
            max_score: { type: 'integer' },
            is_late: { type: 'boolean' },
            feedback: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },

        AnswerResponse: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            submission_id: { type: 'integer' },
            question_id: { type: 'integer' },
            selected_option_id: { type: 'integer' },
            text_response: { type: 'string' },
            points_awarded: { type: 'integer' },
            feedback: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },

        ModuleGrade: {
          type: 'object',
          properties: {
            module_grade_id: { type: 'integer' },
            module_id: { type: 'integer' },
            user_id: { type: 'integer' },
            grade: { type: 'float' },
          },
        },

        Announcement: {
          type: 'object',
          properties: {
            announcement_id: { type: 'integer' },
            course_id: { type: 'integer' },
            title: { type: 'string' },
            message: { type: 'string' },
            user_id: { type: 'integer' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },

        Attendance: {
          type: 'object',
          properties: {
            attendance_id: { type: 'integer' },
            course_id: { type: 'integer' },
            user_id: { type: 'integer' },
            date: { type: 'string', format: 'date' },
            status: { type: 'string', enum: ['present', 'absent', 'late'] },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ['./src/routes/*.js'],
}

const swaggerSpec = swaggerJSDoc(options)

export default swaggerSpec
