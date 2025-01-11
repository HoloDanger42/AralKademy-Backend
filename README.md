# AralKademy Backend

## Overview

A simple LMS backend built with Express, Node.js, Sequelize, and PostgreSQL.

## Getting Started

1. Clone the repo.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up your `.env` with your database (DB_HOST, DB_USER, DB_PASSWORD, DB_NAME) DB and JWT credentials (JWT_SECRET). See the project documentation for instructions on how to setup a local Postgresql instance.
4. Start the server:
   ```bash
   npm start
   ```
5. Test endpoints with a REST client (e.g., Postman).
6. You can view the automatically generated API documentation [here](link-to-swagger-doc)

## Technologies

- Express.js
- Node.js
- Sequelize
- PostgreSQL
- Winston
- dotenv
- Jsonwebtoken
- bcrypt
- CORS
- git

## Endpoints

- POST /users/signup
- POST /users/login
- GET /users/users
- GET /courses
- POST /courses

## Logging

Logs are written to the console and to `aralkademy.log`.

## Contributing

Feel free to open issues or make pull requests. Contact us at lennardace.flores.cics@ust.edu.ph or join our discord server [here](https://discord.gg/vXt5BchWRV)
