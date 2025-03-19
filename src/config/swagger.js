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
            name: { type: 'string'},
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
            name: { type: 'string'},
            link: { type: 'string'}, 
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
