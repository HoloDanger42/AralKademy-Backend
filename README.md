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
├── .eslintrc.js               # ESLint configuration
├── .prettierrc                # Prettier configuration
├── .env                       # Environment variables (never commit this!)
├── aralkademy.log             # Application log file
├── src/
│   ├── server.js              # Main server file
│   ├── config/                # Configuration files
│   │   └── database.js        # Database connection
│   ├── controllers/            # API logic
│   │   ├── userController.js
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
│   │   └── Course.js
│   ├── routes/                 # API endpoint definitions
│   │   ├── users.js
│   │   └── courses.js
│   ├── services/               # Business logic and services
│   │   ├── userService.js
│   │   └── courseService.js
│   └── utils/                  # Utility functions
│       └── logger.js
├── tests/
│   ├── fixtures/               # Reusable test data
│   │   ├── userData.js
│   │   ├── schoolData.js
│   │   └── courseData.js
│   ├── helpers/                # Test utility functions
│   │   ├── testData.js
│   │   ├── testSetup.js
│   │   └── testUtils.js
│   ├── unit/                   # Unit tests
│   │   ├── controllers/
│   │   │   ├── userController.test.js
│   │   │   └── courseController.test.js
│   │   ├── middleware/
│   │   │   ├── authMiddleware.test.js
│   │   │   ├── errorMiddleware.test.js
│   │   │   ├── logMiddleware.test.js
│   │   │   └── securityMiddleware.test.js
│   │   ├── models/
│   │   │   ├── User.test.js
│   │   │   ├── School.test.js
│   │   │   └── Course.test.js
│   │   ├── setup/
│   │   │   └── server.test.js
│   │   ├── services/
│   │   │   ├── userService.test.js
│   │   │   └── courseService.test.js
│   │   └── utils/
│   │       └── logger.test.js
│   ├── integration/            # Integration tests
│   │   ├── courses.test.js
│   │   └── users.test.js
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

      # Server Configuration
      PORT=3000

      # Authentication Configuration
      JWT_SECRET=your_jwt_secret_key
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

- `POST /users/signup`: Create a new user
  - **Request Body:**
    ```json
    {
      "username": "string",
      "email": "string",
      "password": "string"
    }
    ```
  - **Response:** `201 Created` on success.
    - **Example:**
      ```json
      {
        "message": "User created successfully",
        "user": {
          "id": 1,
          "username": "testuser",
          "email": "test@example.com",
          "updatedAt": "2024-10-27T06:35:01.673Z",
          "createdAt": "2024-10-27T06:35:01.673Z"
        }
      }
      ```
  - **Error Codes**:
    - `400 Bad Request`: Missing required fields, or incorrect data types.
    - `409 Conflict`: User already exists.
    - `500 Internal Server Error`: Internal server error.
- `POST /users/login`: Authenticate user
  - **Request Body:**
    ```json
    {
      "username": "string",
      "password": "string"
    }
    ```
  - **Response:** `200 OK` on success.
    - **Example:**
      ```json
      {
        "message": "Logged in successfully",
        "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTcxOTQ2OTU5MCwiZXhwIjoxNzE5NDczMTkwfQ.B1yO05bK7nZ_66Wk0_01P52y87H1V34L68G3xH9_v4U",
        "user": {
          "id": 1,
          "username": "testuser",
          "email": "test@example.com",
          "createdAt": "2024-06-27T07:19:50.830Z",
          "updatedAt": "2024-06-27T07:19:50.830Z"
        }
      }
      ```
  - **Error Codes**:
    - `400 Bad Request`: Missing required fields.
    - `401 Unauthorized`: Invalid credentials.
    - `500 Internal Server Error`: Internal server error.
- `GET /users`: Get all users
  - **Headers:** `Authorization: Bearer <token>`
  - **Response:** `200 OK` on success.
    - **Example:**
      ```json
      [
        {
          "id": 1,
          "username": "testuser1",
          "email": "test1@example.com",
          "createdAt": "2024-10-27T06:35:01.673Z",
          "updatedAt": "2024-10-27T06:35:01.673Z"
        },
        {
          "id": 2,
          "username": "testuser2",
          "email": "test2@example.com",
          "createdAt": "2024-10-27T06:35:01.673Z",
          "updatedAt": "2024-10-27T06:35:01.673Z"
        }
      ]
      ```
  - **Error Codes:**
    - `401 Unauthorized`: Invalid or missing token.
    - `500 Internal Server Error`: Internal server error.

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

### `users` table

- `id`: Primary key, Auto-increment, Integer.
- `username`: Unique, String, not null, Minimum length of 3.
- `email`: Unique, String, not null, valid email format.
- `password`: String, not null, Minimum length of 8.
- `created_at`: Timestamp, automatically added
- `updated_at`: Timestamp, automatically added.

### `courses` table

- `id`: Primary key, Auto-increment, Integer.
- `name`: String, not null, unique.
- `description`: String, nullable.
- `created_at`: Timestamp, automatically added
- `updated_at`: Timestamp, automatically added.

## Performance Considerations

- Use database indexes where needed to optimize query performance.
- Implement caching mechanisms for data that does not change frequently.
- Use pagination for API endpoints that return a large list to ensure better performance.

## Contributing

Feel free to open issues or make pull requests. Contact us at <lennardace.flores.cics@ust.edu.ph> or join our Discord server [here](https://discord.gg/vXt5BchWRV).
