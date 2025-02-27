# AralKademy Backend

## Overview

This is a RESTful API backend for the AralKademy Learning Management System (LMS). It's built using Node.js with Express.js, utilizes Sequelize as an ORM for PostgreSQL database interactions, and provides core functionalities for user and course management. The API is designed with security, logging, thorough testing, and maintainability in mind.

## Key Features

- **User Management:** User registration, authentication, and management.
- **Course Management:** Creation, retrieval, and management of courses.
- **Secure Authentication:** JWT-based authentication for securing API endpoints.
- **Logging:** Request and response logging for debugging and monitoring.
- **Error Handling:** Comprehensive error handling middleware for graceful error responses.
- **Testing:** Automated unit and integration tests using Jest.
- **Database ORM:** Sequelize for managing database interactions with PostgreSQL.
- **API Documentation:** Automatically generated interactive API documentation.

## Technical Requirements

- **Node.js:** v18 or higher
- **npm:** v8 or higher
- **PostgreSQL:** v13 or higher
- **pgAdmin 4:** for PostgreSQL database management
- **REST Client:** Postman for testing API endpoints

## Version Information

**Current Version:** 1.0.0

## Project Structure

```
aralkademy-backend/
├── .vscode/
│   └── settings.json          # VS Code workspace settings (for formatting, linting, etc.)
├── eslint.config.cjs               # ESLint configuration
├── .prettierrc                # Prettier configuration
├── .sequelizerc                # Sequelize configuration
├── .env                       # Environment variables (never commit this!)
├── aralkademy.log             # Application log file
├── migrations/
├── src/
│   ├── server.js              # Main server file
│   ├── config/                # Configuration files
│   │   └── database.js        # Database connection
│   ├── controllers/            # API logic
│   │   ├── userController.js
│   │   ├── enrollmentController.js
│   │   ├── groupController.js
│   │   └── courseController.js
│   ├── middleware/             # Middleware functions
│   │   ├── authMiddleware.js  # Auth middleware
│   │   ├── errorMiddleware.js # Error handling
│   │   ├── logMiddleware.js  # Logging requests and responses
│   │   └── securityMiddleware.js  # Security configs
│   ├── models/                 # Database Models
│   │   ├── User.js
│   │   ├── Admin.js
│   │   ├── StudentTeacher.js
│   │   ├── Teacher.js
│   │   ├── Learner.js
│   │   ├── School.js
│   │   ├── Course.js
│   │   ├── Enrollment.js
│   │   ├── School.js
│   │   ├── Group.js
│   │   ├── index.js
│   │   └── associate.js
│   ├── routes/                 # API endpoint definitions
│   │   ├── users.js
│   │   ├── enrollments.js
│   │   ├── groups.js
│   │   └── courses.js
│   ├── services/               # Business logic and services
│   │   ├── userService.js
│   │   ├── courseService.js
│   │   ├── enrollmentService.js
│   │   ├── groupService.js
│   │   └── roleService.js
│   └── utils/                  # Utility functions
│       └── logger.js
├── tests/
│   ├── fixtures/               # Reusable test data
│   │   ├── userData.js
│   │   ├── schoolData.js
│   │   ├── enrollmentData.js
│   │   ├── groupData.js
│   │   └── courseData.js
│   ├── helpers/                # Test utility functions
│   │   ├── testData.js
│   │   ├── testSetup.js
│   │   └── testUtils.js
│   ├── unit/                   # Unit tests
│   │   ├── config/
│   │   │   └── database.test.js
│   │   ├── controllers/
│   │   │   ├── userController.test.js
│   │   │   ├── enrollmentController.test.js
│   │   │   ├── groupController.test.js
│   │   │   └── courseController.test.js
│   │   ├── middleware/
│   │   │   ├── authMiddleware.test.js
│   │   │   ├── errorMiddleware.test.js
│   │   │   ├── logMiddleware.test.js
│   │   │   └── securityMiddleware.test.js
│   │   ├── models/
│   │   │   ├── User.test.js
│   │   │   ├── School.test.js
│   │   │   ├── Admin.test.js
│   │   │   ├── StudentTeacher.test.js
│   │   │   ├── Teacher.test.js
│   │   │   ├── Learner.test.js
│   │   │   ├── Group.test.js
│   │   │   ├── Enrollment.test.js
│   │   │   └── Course.test.js
│   │   ├── setup/
│   │   │   └── server.test.js
│   │   ├── services/
│   │   │   ├── userService.test.js
│   │   │   ├── courseService.test.js
│   │   │   ├── enrollmentService.test.js
│   │   │   ├── groupService.test.js
│   │   │   └── roleService.test.js
│   │   └── utils/
│   │       └── logger.test.js
│   ├── integration/            # Integration tests
│   │   ├── course.api.test.js
│   │   └── user.api.test.js
│   └── jest.setup.js           # Jest setup and configuration
├── babel.config.js            # Babel configuration
├── jest.config.js             # Jest configuration
├── package.json               # Project dependencies
├── package-lock.json          # Dependency lock file
├── README.md                  # Project documentation
└── .gitignore                  # Files excluded from Git
```

## Installation Guide

1.  **Clone the Repository:**

    ```bash
    git clone https://github.com/HoloDanger42/AralKademy-Backend.git
    cd aralkademy-backend
    ```

2.  **Install Dependencies:**

    ```bash
    npm install
    ```

3.  **Set Up Your Environment Variables:**

    - Create a `.env` file in the root of the project (next to the `package.json`).
    - Populate the `.env` file with your database credentials, JWT secret, and other configurations.
    - **Sample .env:**

      ```env
      # Database Configuration

      DB_HOST=localhost
      DB_USER=your_db_user
      DB_PASSWORD=your_db_password
      DB_NAME=your_db_name
      DB_DIALECT=postgres
      ADMIN_PASSWORD=your_admin_password

      # Server Configuration

      PORT=4000
      ENABLE_RECAPTCHA=true
      ENABLE_EMAIL_VERIFICATION=false
      RUN_SEEDERS=false

      # Authentication Configuration

      JWT_SECRET=your_jwt_secret_key
      RECAPTCHA_SECRET_KEY=your_recaptcha_secret_key

      # Cache Configuration

      CACHE_ENABLED=false # Set to true to enable caching
      ```

    - **Important:** You need a running PostgreSQL instance, and a database created, along with a user with the necessary privileges for the application.
    - Refer to the PostgreSQL documentation for setting up the database, and creating users.

4.  **Start the Server:**

    ```bash
    npm start
    ```

5.  **Test Your Endpoints:** Use a REST client (e.g., Postman, Insomnia) to verify that your API is working correctly. You can find a sample Postman collection [here](https://orange-sunset-597552.postman.co/workspace/Team-Workspace~94ee1c57-bd26-4e1d-8e9f-dd7b53e2e115/collection/40944288-96ee7bf5-7e01-4ddc-ac4f-0ea4276709cc?action=share&creator=40944288).

6.  **API Documentation:** You can view the automatically generated API documentation [here](link-to-your-swagger-doc).

## Development Workflow

1.  **Clone the repository:** Create a local copy of the project.
2.  **Create a branch:** Create a new branch for your specific feature or bug fix.
3.  **Code:** Implement your changes in your branch.
4.  **Test:** Run the tests locally (`npm run test`) before committing your changes.
5.  **Commit:** Add and commit your changes.
6.  **Create a pull request:** Create a pull request with a detailed description of your changes to be merged to the main branch.
7.  **Code Review:** Ensure that your changes are reviewed by other developers on the team.
8.  **Merge:** Merge your pull request to the main branch after a successful code review.

## API Documentation

You can view the automatically generated API documentation [here](link-to-your-swagger-doc) (e.g., using Swagger UI).

### User Endpoints

- `POST /users/login`: Authenticate user

  - **Request Body:**
    ```json
    {
      "email": "string",
      "password": "string",
      "captchaResponse": "string" // Required if reCAPTCHA is enabled
    }
    ```
  - **Response:** `200 OK` on success.
    - **Example:**
      ```json
      {
        "message": "Logged in successfully",
        "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
        "user": {
          "id": 1,
          "email": "test@example.com",
          "first_name": "Test",
          "last_name": "User",
          "role": "teacher",
          "createdAt": "2024-06-27T07:19:50.830Z",
          "updatedAt": "2024-06-27T07:19:50.830Z"
        }
      }
      ```
  - **Error Codes**:
    - `400 Bad Request`: Missing required fields or invalid CAPTCHA
    - `401 Unauthorized`: Invalid credentials
    - [500 Internal Server Error](http://_vscodecontentref_/11): Authentication failed

- `POST /users`: Create a new user

  - **Headers:** `Authorization: Bearer <token>` (admin access required)
  - **Request Body:**
    ```json
    {
      "email": "string",
      "password": "string",
      "firstName": "string",
      "lastName": "string",
      "birthDate": "YYYY-MM-DD",
      "contactNo": "string",
      "schoolId": "number",
      "userType": "string", // "teacher", "admin", "student_teacher", "learner"
      "department": "string", // For teachers and student_teachers
      "section": "string", // For student_teachers
      "groupId": "number" // For assigning to a group
    }
    ```
  - **Response:** `201 Created` on success
  - **Error Codes**:
    - `400 Bad Request`: Missing required fields or validation errors
    - `401 Unauthorized`: Invalid or missing token
    - `409 Conflict`: Email already exists
    - [500 Internal Server Error](http://_vscodecontentref_/12): Failed to create user

- `GET /users`: Get all users

  - **Headers:** `Authorization: Bearer <token>`
  - **Response:** `200 OK` on success.
  - **Error Codes:**
    - `401 Unauthorized`: Invalid or missing token
    - [500 Internal Server Error](http://_vscodecontentref_/13): Failed to retrieve users

- `GET /users/:id`: Get user by ID
  - **Headers:** `Authorization: Bearer <token>`
  - **Response:** `200 OK` on success.
  - **Error Codes:**
    - `401 Unauthorized`: Invalid or missing token
    - `404 Not Found`: User not found
    - [500 Internal Server Error](http://_vscodecontentref_/14): Failed to retrieve user

### Course Endpoints

- `GET /courses`: Get all courses

  - **Headers:** `Authorization: Bearer <token>`
  - **Response:** `200 OK` on success.
    - **Example:**
      ```json
      [
        {
          "id": 1,
          "name": "Test Course",
          "description": "Test description",
          "createdAt": "2024-10-27T07:19:50.830Z",
          "updatedAt": "2024-10-27T07:19:50.830Z"
        }
      ]
      ```
  - **Error Codes:**
    - `401 Unauthorized`: Invalid or missing token.
    - `500 Internal Server Error`: Internal server error.

- `POST /courses`: Create a new course

  - **Headers:**
    - `Authorization: Bearer <token>`
    - `Content-Type: application/json`
  - **Request Body:**
    ```json
    {
      "name": "string",
      "description": "string"
    }
    ```
  - **Response:** `201 Created` on success.
    - **Example:**
      ```json
      {
        "message": "Course created successfully",
        "course": {
          "id": 1,
          "name": "Test Course",
          "description": "Test description",
          "createdAt": "2024-06-27T07:19:50.830Z",
          "updatedAt": "2024-06-27T07:19:50.830Z"
        }
      }
      ```
  - **Error Codes:**
    - `400 Bad Request`: Missing required fields, or incorrect data types.
    - `401 Unauthorized`: Invalid or missing token.
    - `409 Conflict`: Course name already exists.
    - `500 Internal Server Error`: Internal server error.

- `GET /courses/:courseId`: Get course by ID

  - **Headers:** `Authorization: Bearer <token>`
  - **Response:** `200 OK` on success.
    - **Example:**
      ```json
      {
        "id": 1,
        "name": "Mathematics 101",
        "description": "Introduction to basic mathematics",
        "user_id": 3,
        "createdAt": "2024-10-27T07:19:50.830Z",
        "updatedAt": "2024-10-27T07:19:50.830Z"
      }
      ```
  - **Error Codes:**
    - `401 Unauthorized`: Invalid or missing token
    - `404 Not Found`: Course not found
    - [500 Internal Server Error](http://_vscodecontentref_/5): Error fetching course

- `PUT /courses/:courseId`: Edit course

  - **Headers:** `Authorization: Bearer <token>`
  - **Request Body:**
    ```json
    {
      "name": "string",
      "description": "string"
    }
    ```
  - **Response:** `200 OK` on success
  - **Error Codes:**
    - `400 Bad Request`: Course name is required or too long
    - `401 Unauthorized`: Invalid or missing token
    - `404 Not Found`: Course not found
    - `409 Conflict`: Course name already exists
    - [500 Internal Server Error](http://_vscodecontentref_/6): Error editing course

- `DELETE /courses/:courseId`: Soft delete course

  - **Headers:** `Authorization: Bearer <token>`
  - **Response:** `200 OK` on success
  - **Error Codes:**
    - `401 Unauthorized`: Invalid or missing token
    - `404 Not Found`: Course not found
    - [500 Internal Server Error](http://_vscodecontentref_/7): Error deleting course

- `POST /courses/assign-teacher`: Assign teacher to course

  - **Headers:** `Authorization: Bearer <token>`
  - **Request Body:**
    ```json
    {
      "courseId": "number",
      "userId": "number"
    }
    ```
  - **Response:** `200 OK` on success
  - **Error Codes:**
    - `401 Unauthorized`: Invalid or missing token
    - `404 Not Found`: Course not found
    - [500 Internal Server Error](http://_vscodecontentref_/8): Error assigning teacher to course

- `POST /courses/assign-learner-group`: Assign learner group to course

  - **Headers:** `Authorization: Bearer <token>`
  - **Request Body:**
    ```json
    {
      "courseId": "number",
      "learnerGroupId": "number"
    }
    ```
  - **Response:** `200 OK` on success
  - **Error Codes:**
    - `401 Unauthorized`: Invalid or missing token
    - `404 Not Found`: Course not found
    - [500 Internal Server Error](http://_vscodecontentref_/9): Error assigning learner group to course

- `POST /courses/assign-student-teacher-group`: Assign student teacher group to course
  - **Headers:** `Authorization: Bearer <token>`
  - **Request Body:**
    ```json
    {
      "courseId": "number",
      "studentTeacherGroupId": "number"
    }
    ```
  - **Response:** `200 OK` on success
  - **Error Codes:**
    - `401 Unauthorized`: Invalid or missing token
    - `404 Not Found`: Course not found
    - [500 Internal Server Error](http://_vscodecontentref_/10): Error assigning student teacher group to course

### Enrollment Endpoints

- `POST /enrollments`: Create a new enrollment

  - **Request Body:**
    ```json
    {
      "email": "string",
      "password": "string",
      "confirm_password": "string",
      "first_name": "string",
      "last_name": "string",
      "middle_initial": "string", // Optional
      "birth_date": "YYYY-MM-DD",
      "contact_no": "string",
      "school_id": "number",
      "year_level": "number"
    }
    ```
  - **Response:** `201 Created` on success.
    - **Example:**
      ```json
      {
        "message": "Enrollment created successfully",
        "enrollment": {
          "enrollment_id": 1,
          "email": "student@example.com",
          "first_name": "John",
          "last_name": "Doe",
          "status": "pending"
        }
      }
      ```
  - **Error Codes**:
    - `400 Bad Request`: Missing or invalid fields (includes detailed validation errors)
    - `409 Conflict`: Email already exists
    - [500 Internal Server Error](http://_vscodecontentref_/0): Failed to create enrollment

- `GET /enrollments/:enrollmentId`: Get enrollment by ID

  - **Headers:** `Authorization: Bearer <token>` (admin access required)
  - **Response:** `200 OK` on success
  - **Error Codes**:
    - `401 Unauthorized`: Invalid or missing token
    - `404 Not Found`: Enrollment not found
    - [500 Internal Server Error](http://_vscodecontentref_/1): Failed to retrieve enrollment

- `PATCH /enrollments/:enrollmentId/approve`: Approve enrollment

  - **Headers:** `Authorization: Bearer <token>` (admin access required)
  - **Response:** `200 OK` on success
  - **Error Codes**:
    - `401 Unauthorized`: Invalid or missing token
    - `404 Not Found`: Enrollment not found
    - [500 Internal Server Error](http://_vscodecontentref_/2): Failed to approve enrollment

- `PATCH /enrollments/:enrollmentId/reject`: Reject enrollment

  - **Headers:** `Authorization: Bearer <token>` (admin access required)
  - **Response:** `200 OK` on success
  - **Error Codes**:
    - `401 Unauthorized`: Invalid or missing token
    - `404 Not Found`: Enrollment not found
    - [500 Internal Server Error](http://_vscodecontentref_/3): Failed to reject enrollment

- `GET /enrollments`: Get all enrollments

  - **Headers:** `Authorization: Bearer <token>` (admin access required)
  - **Response:** `200 OK` on success
  - **Error Codes**:
    - `401 Unauthorized`: Invalid or missing token
    - [500 Internal Server Error](http://_vscodecontentref_/4): Failed to retrieve enrollments

- `GET /enrollments/school/:schoolId`: Get enrollments by school ID

  - **Headers:** `Authorization: Bearer <token>` (admin access required)
  - **Response:** `200 OK` on success
  - **Error Codes**:
    - `401 Unauthorized`: Invalid or missing token
    - `404 Not Found`: School not found
    - [500 Internal Server Error](http://_vscodecontentref_/5): Failed to retrieve enrollments

- `POST /enrollments/check-status`: Check enrollment status by email

  - **Request Body:**
    ```json
    {
      "email": "string"
    }
    ```
  - **Response:** `200 OK` on success
    - **Example:**
      ```json
      {
        "status": "pending"
      }
      ```
  - **Error Codes**:
    - `400 Bad Request`: Email is required
    - `404 Not Found`: Enrollment not found for this email
    - [500 Internal Server Error](http://_vscodecontentref_/6): Failed to check enrollment status

- `PUT /enrollments/:enrollmentId`: Update enrollment

  - **Headers:** `Authorization: Bearer <token>` (admin access required)
  - **Request Body:** Fields to update (same as create, but all fields optional)
  - **Response:** `200 OK` on success
  - **Error Codes**:
    - `401 Unauthorized`: Invalid or missing token
    - `404 Not Found`: Enrollment not found
    - `409 Conflict`: Email already exists (if updating email)
    - [500 Internal Server Error](http://_vscodecontentref_/7): Internal server error

- `DELETE /enrollments/:enrollmentId`: Delete enrollment
  - **Headers:** `Authorization: Bearer <token>` (admin access required)
  - **Response:** `204 No Content` on success
  - **Error Codes**:
    - `401 Unauthorized`: Invalid or missing token
    - `404 Not Found`: Enrollment not found
    - [500 Internal Server Error](http://_vscodecontentref_/8): Internal server error

### Group Endpoints

- `GET /groups`: Get all groups

  - **Headers:** `Authorization: Bearer <token>`
  - **Response:** `200 OK` on success.
    - **Example:**
      ```json
      [
        {
          "group_id": 1,
          "name": "Grade 1-A",
          "group_type": "learner",
          "createdAt": "2024-10-27T07:19:50.830Z",
          "updatedAt": "2024-10-27T07:19:50.830Z"
        },
        {
          "group_id": 2,
          "name": "Practicum Group 3",
          "group_type": "student_teacher",
          "createdAt": "2024-10-27T07:19:50.830Z",
          "updatedAt": "2024-10-27T07:19:50.830Z"
        }
      ]
      ```
  - **Error Codes:**
    - `401 Unauthorized`: Invalid or missing token
    - [500 Internal Server Error](http://_vscodecontentref_/0): Failed to retrieve groups

- `POST /groups`: Create a new group

  - **Headers:** `Authorization: Bearer <token>`
  - **Request Body:**
    ```json
    {
      "groupId": "number",
      "name": "string",
      "groupType": "string" // "learner" or "student_teacher"
    }
    ```
  - **Response:** `201 Created` on success
    - **Example:**
      ```json
      {
        "message": "Group created successfully",
        "group": {
          "group_id": 3,
          "name": "Grade 2-B",
          "group_type": "learner",
          "createdAt": "2024-10-28T09:30:22.123Z",
          "updatedAt": "2024-10-28T09:30:22.123Z"
        }
      }
      ```
  - **Error Codes:**
    - `400 Bad Request`: All fields are required
    - `401 Unauthorized`: Invalid or missing token
    - [500 Internal Server Error](http://_vscodecontentref_/1): Failed to create group

- `GET /groups/:groupId`: Get group by ID

  - **Headers:** `Authorization: Bearer <token>`
  - **Response:** `200 OK` on success
  - **Error Codes:**
    - `401 Unauthorized`: Invalid or missing token
    - `404 Not Found`: Group not found
    - [500 Internal Server Error](http://_vscodecontentref_/2): Failed to retrieve group

- `POST /groups/assign-student-teachers`: Assign student teachers to a group

  - **Headers:** `Authorization: Bearer <token>`
  - **Request Body:**
    ```json
    {
      "userIds": [1, 2, 3],
      "groupId": 2
    }
    ```
  - **Response:** `200 OK` on success
  - **Error Codes:**
    - `400 Bad Request`: All fields are required
    - `401 Unauthorized`: Invalid or missing token
    - [500 Internal Server Error](http://_vscodecontentref_/3): Failed to assign student teacher members

- `POST /groups/assign-learners`: Assign learners to a group
  - **Headers:** `Authorization: Bearer <token>`
  - **Request Body:**
    ```json
    {
      "userIds": [4, 5, 6],
      "groupId": 1
    }
    ```
  - **Response:** `200 OK` on success
  - **Error Codes:**
    - `400 Bad Request`: All fields are required
    - `401 Unauthorized`: Invalid or missing token
    - [500 Internal Server Error](http://_vscodecontentref_/4): Failed to assign learner members

## Testing Instructions

1.  **Run Tests:** Use the command `npm run test` to run all test cases.
2.  **Verify Test Results:** Check your test output in the terminal to ensure all tests have passed, and that there are no failed tests.
3.  **Code Coverage:** You can use a coverage tool to see that you have adequate coverage for your API, and that all of the different functionalities of your API are being tested. Configure the coverage tools in `jest.config.js`.

## Deployment Guide

This project can be deployed using Heroku, AWS, Google Cloud, or other similar services:

1.  **Prepare Your Environment:** Create the required configurations on your platform. Create a database. Configure the necessary environment variables.
2.  **Build:** Use the build process recommended for your deployment method.
3.  **Deploy:** Deploy your application to your server using the appropriate method.
4.  **Environment Variables:** Set the necessary environment variables in the deployment platform's configuration settings.
5.  **Monitor:** Configure monitoring tools for your deployed application.

## CI/CD

The project utilizes GitHub actions for CI/CD. Every pull request will automatically run the project tests, and successful builds will be deployed to the main deployment environment.

## Monitoring

Implement logging and monitoring solutions for the application in production. Consider using tools such as:

- **Application Performance Monitoring (APM):** New Relic, Datadog, or similar.
- **Logging:** ELK stack, Splunk, or similar.
- **Alerting:** Set up alerts for critical errors and performance issues.

## Security Notes

- **Authentication:** Uses JWT (JSON Web Tokens) for authentication.
- **Password Hashing:** Passwords are securely hashed using bcrypt before being stored in the database.
- **Environment Variables:** Sensitive data, such as database passwords and JWT secrets, are managed using environment variables.
- **Input Sanitization:** The application sanitizes and validates all data before it is used.
- **Rate Limiting:** Rate limiting is recommended to protect against malicious requests.
- **CORS:** Ensure that the correct CORS configuration is being used, and only trusted origins are allowed.
- **HTTPS:** Ensure that your application is deployed using HTTPS, for encrypted communication.

## Database Schema

The application uses the following database schema:

### User Model (`users` table)

- `id`: Primary key, Auto-increment, Integer
- `first_name`: String, not null
- `middle_initial`: String, nullable (max 3 chars)
- `last_name`: String, not null
- `email`: String, unique, not null, valid email format
- `password`: String, not null, hashed with bcrypt
- `birth_date`: Date, validates for dates in the past
- `contact_no`: String, validates for mobile number format
- `school_id`: Foreign key to schools table
- `role`: ENUM('learner', 'teacher', 'admin', 'student_teacher')
- Timestamps and soft delete functionality

### School Model (`schools` table)

- `school_id`: Primary key, Auto-increment, Integer
- `name`: String, unique, not null, length 1-255
- `address`: String, not null
- `contact_no`: String, validates for landline format
- Timestamps and soft delete functionality
- Constraint: Cannot be deleted if it has active users

### Teacher Model (`teachers` table)

- `user_id`: Primary key, Foreign key to users table
- `department`: String, nullable
- `emp_status`: String, nullable
- Timestamps and soft delete functionality
- Has many courses

### Admin Model (`admins` table)

- `user_id`: Primary key, Foreign key to users table
- `position`: String, nullable
- `emp_status`: String, nullable
- Timestamps and soft delete functionality
- Has many enrollments (handled_by)

### StudentTeacher Model (`student_teachers` table)

- `user_id`: Primary key, Foreign key to users table
- `section`: String, not null
- `department`: String, not null
- `student_teacher_group_id`: Foreign key to groups table
- Timestamps and soft delete functionality
- Belongs to a group

### Learner Model (`learners` table)

- `user_id`: Primary key, Foreign key to users table
- `year_level`: Integer, not null, range 1-6
- `enrollment_id`: Foreign key to enrollments table
- `learner_group_id`: Foreign key to groups table
- Timestamps
- Belongs to a group and an enrollment

### Group Model (`groups` table)

- `group_id`: Primary key, Auto-increment, Integer
- `name`: String, not null
- `group_type`: ENUM('student_teacher', 'learner')
- Timestamps and soft delete functionality
- Has many learners or student teachers based on type
- Has one course as student_teacher_group or learner_group

### Course Model (`courses` table)

- `id`: Primary key, Auto-increment, Integer
- `name`: String, unique, not null, length 1-255
- `description`: Text, nullable, max 1000 chars
- `user_id`: Foreign key to teachers table
- `student_teacher_group_id`: Foreign key to groups table
- `learner_group_id`: Foreign key to groups table
- Timestamps and soft delete functionality
- Belongs to a teacher, student teacher group, and learner group

### Enrollment Model (`enrollments` table)

- `enrollment_id`: Primary key, Auto-increment, Integer
- `first_name`: String, not null
- `middle_initial`: String, nullable, max 3 chars
- `last_name`: String, not null
- `email`: String, unique, not null, valid email format
- `password`: String, not null, min length 8
- `birth_date`: Date, not null, validates for dates in the past
- `contact_no`: String, not null, validates for mobile format
- `year_level`: Integer, not null, range 1-6
- `school_id`: Foreign key to schools table
- `handled_by_id`: Foreign key to users table (admin)
- `status`: ENUM('approved', 'rejected', 'pending')
- Timestamps and soft delete functionality
- Belongs to a school and admin
- Has one learner

## Entity Relationships

- **User to Roles**: One-to-one relationships with Teacher, Admin, StudentTeacher, or Learner
- **School to User**: One-to-many relationship
- **Teacher to Course**: One-to-many relationship
- **Admin to Enrollment**: One-to-many relationship
- **Group to StudentTeacher/Learner**: One-to-many relationship
- **Course to Groups**: Many-to-one relationships with StudentTeacher and Learner groups
- **Enrollment to Learner**: One-to-one relationship

## Authentication System

The AralKademy Backend implements a robust authentication system with several security features:

### Core Authentication Features

- **JWT-Based Authentication**: All protected endpoints require a valid JSON Web Token included in the request header as `Authorization: Bearer <token>`.

- **Role-Based Access Control (RBAC)**: The system implements four distinct user roles:

  - **Admin**: Full system access, including school management and enrollment approval
  - **Teacher**: Access to course creation, student management, and grading
  - **Student Teacher**: Limited access to assigned courses and student groups
  - **Learner**: Access to enrolled courses and personal information

- **reCAPTCHA Integration**: Protection against automated attacks and bot submissions during login and registration. Can be enabled/disabled via the `ENABLE_RECAPTCHA` environment variable.

- **Password Security**:

  - Passwords are hashed using bcrypt with appropriate salt rounds
  - Minimum password requirements enforced (8+ characters, mix of letters, numbers, symbols)
  - Password reset functionality with secure tokens

- **Email Verification**: Optional email verification for new accounts (configurable via `ENABLE_EMAIL_VERIFICATION` environment variable).

### Authentication Flow

1. **Registration**: User provides required information including email and password
2. **Verification**: If enabled, user verifies email address via emailed link
3. **Login**: User provides credentials and receives a JWT token valid for limited time
4. **Authorization**: Token is used for subsequent requests to protected endpoints
5. **Refresh**: Token can be refreshed before expiration to maintain session

### Security Considerations

- Tokens have a configurable expiration time
- Sensitive routes have additional rate limiting via `AUTH_RATE_LIMIT_MAX`
- Failed login attempts are logged and monitored
- HTTPS is enforced in production environments

## Performance Considerations

- Use database indexes where needed to optimize query performance.
- Implement caching mechanisms for data that does not change frequently.
- Use pagination for API endpoints that return a large list to ensure better performance.

## Contributing

Feel free to open issues or make pull requests. Contact us at <lennardace.flores.cics@ust.edu.ph> or join our Discord server [here](https://discord.gg/vXt5BchWRV).
