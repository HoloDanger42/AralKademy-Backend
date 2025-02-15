// backend/src/services/userService.js
import bcrypt from 'bcryptjs'; // Use bcryptjs consistently
import jwt from 'jsonwebtoken';
import { log } from '../utils/logger.js'; // Import your logger

class UserService {
    constructor(
        UserModel,
        TeacherModel,
        AdminModel,
        StudentTeacherModel,
        LearnerModel,
        EnrollmentModel
    ) {
        this.UserModel = UserModel;
        this.TeacherModel = TeacherModel;
        this.AdminModel = AdminModel;
        this.StudentTeacherModel = StudentTeacherModel;
        this.LearnerModel = LearnerModel;
        this.EnrollmentModel = EnrollmentModel;
    }

    validateUserData(userData) {
        if (userData.email && !userData.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
            throw new Error('Invalid email format');
        }
        if (userData.contact_no && !userData.contact_no.match(/^09\d{9}$/)) {
            throw new Error('Invalid contact number format');
        }
    }

    validateRole(role) {
        const validRoles = ['teacher', 'learner', 'admin', 'student_teacher'];
        if (!validRoles.includes(role)) {
            throw new Error('Invalid role.');
        }
    }

    validatePassword(password) {
        if (!password || password.length < 8) {
            throw new Error('Password must be at least 8 characters');
        }
    }

    async createUser(email, password, firstName, lastName, birthDate, contactNo, schoolId, role, department = null, section = null, groupId = null) {
        const transaction = await this.UserModel.sequelize.transaction();
        try {
            const userData = {
                email,
                password,  // Store plain text temporarily
                first_name: firstName,
                last_name: lastName,
                role: role,
                birth_date: birthDate,
                contact_no: contactNo,
                school_id: schoolId,
            };

            this.validateUserData(userData);
            this.validateRole(role);
            this.validatePassword(password); // Validate *before* hashing

            // Hash the password *before* creating the user
            userData.password = await bcrypt.hash(password, 10); // Hash and update userData

            const user = await this.UserModel.create(userData, { transaction });

            // ... (rest of your createUser logic - creating related models) ...
            if (role === 'teacher') {
                await this.TeacherModel.create({ user_id: user.id }, { transaction })
              } else if (role === 'admin') {
                await this.AdminModel.create({ user_id: user.id }, { transaction })
              } else if (role === 'student_teacher') {
                await this.StudentTeacherModel.create({ user_id: user.id, department, section, group_id: groupId }, { transaction });
              }

            await transaction.commit();
            return user;
        } catch (error) {
            await transaction.rollback();
            if (error.name === 'SequelizeUniqueConstraintError') {
                if (error.errors[0].path === 'email') {
                    throw new Error('Email already exists');
                }
            }
            throw error;
        }
    }

    async loginUser(email, password) {
        try { // Add try/catch here
            log.debug(`Attempting login for user: ${email}`); // Debug log

            const user = await this.UserModel.findOne({ where: { email } });
            log.debug(`User found: ${user ? user.email : 'null'}`); // Debug log

            if (!user) {
                log.warn(`Login failed: User not found for email ${email}`);
                throw new Error('Invalid credentials'); // Throw consistent error
            }

            const passwordMatch = await bcrypt.compare(password, user.password);
            log.debug(`Password match: ${passwordMatch}`); // Debug log

            if (!passwordMatch) {
                log.warn(`Login failed: Incorrect password for user ${email}`);
                throw new Error('Invalid credentials'); // Throw consistent error
            }

            const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, {
                expiresIn: '15m', // Shorter expiration for testing
            });

            log.info(`User ${email} logged in successfully.`);

             // Exclude password, include other fields
            const { password: userPassword, ...userWithoutPassword } = user.toJSON();
            return { user: userWithoutPassword, token };

        } catch (error) {
            log.error(`Error in loginUser: ${error.message}`, error); // Log the error
            throw error; // Re-throw the error so the controller can handle it
        }
    }

    async getAllUsers(page = 1, limit = 10) {
        return await this.UserModel.findAndCountAll({
          limit,
          offset: (page - 1) * limit,
          attributes: { exclude: ['password'] },
        })
      }

    async getUserById(userId) {
        const user = await this.UserModel.findOne({
          where: { id: userId },
          include: [
            {
              model: this.TeacherModel,
              as: 'teacher',
              required: false,
            },
            {
              model: this.AdminModel,
              as: 'admin',
              required: false,
            },
            {
              model: this.StudentTeacherModel,
              as: 'studentTeacher',
              required: false,
            },
            {
              model: this.LearnerModel,
              as: 'learner',
              required: false,
              include: [
                {
                  model: this.EnrollmentModel,
                  as: 'enrollment',
                },
              ],
            },
          ],
        })

        if (!user) {
          throw new Error('User not found')
        }

        // Remove password from response
        const { password, ...userWithoutPassword } = user.toJSON()
        return userWithoutPassword
      }

      async updateUser(userId, userData) {
        this.validateUserData(userData)
        const transaction = await this.UserModel.sequelize.transaction()
        try {
          const user = await this.UserModel.findByPk(userId)
          if (!user) throw new Error('User not found')

          await user.update(userData, { transaction })
          await transaction.commit()
          return user
        } catch (error) {
          await transaction.rollback()
          throw error
        }
      }

      async deleteUser(userId) {
        const transaction = await this.UserModel.sequelize.transaction()
        try {
          const user = await this.UserModel.findByPk(userId)
          if (!user) throw new Error('User not found')

          if (user.role === 'teacher') {
            await this.TeacherModel.destroy({
              where: { user_id: userId },
              force: true,
              transaction,
            })
          }

          await user.destroy({ transaction })
          await transaction.commit()
          return true
        } catch (error) {
          await transaction.rollback()
          throw error
        }
      }

      async changePassword(userId, oldPassword, newPassword) {
        const transaction = await this.UserModel.sequelize.transaction()
        try {
          const user = await this.UserModel.findByPk(userId)
          if (!user) throw new Error('User not found')

          const isValid = await bcrypt.compare(oldPassword, user.password)
          if (!isValid) throw new Error('Invalid password')

          const hashedPassword = await bcrypt.hash(newPassword, 10)
          await user.update({ password: hashedPassword }, { transaction })

          await transaction.commit()
          return true
        } catch (error) {
          await transaction.rollback()
          throw error;
        }
      }

    async getUsersByRole(role) {
        return await this.UserModel.findAll({
        where: { role },
        attributes: { exclude: ['password'] },
        })
    }

    async getUsersBySchool(schoolId) {
        return await this.UserModel.findAll({
        where: { school_id: schoolId },
        attributes: { exclude: ['password'] },
        })
    }
}

export default UserService;