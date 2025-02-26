import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
//
import dotenv from 'dotenv';
dotenv.config();
//

class UserService {
  constructor(
    UserModel,
    TeacherModel,
    AdminModel,
    StudentTeacherModel,
    LearnerModel,
    EnrollmentModel,
    CourseModel,
    GroupModel,
    SchoolModel,
    BlacklistModel
  ) {
    this.UserModel = UserModel
    this.TeacherModel = TeacherModel
    this.AdminModel = AdminModel
    this.StudentTeacherModel = StudentTeacherModel
    this.LearnerModel = LearnerModel
    this.EnrollmentModel = EnrollmentModel
    this.Course = CourseModel
    this.Group = GroupModel
    this.School = SchoolModel
    this.jwtSecret = process.env.JWT_SECRET // Get from .env and store as a property
    this.BlacklistModel = BlacklistModel
  }

  validateUserData(userData) {
    if (userData.email && !userData.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      throw new Error('Invalid email format')
    }
    if (userData.contact_no && !userData.contact_no.match(/^09\d{9}$/)) {
      throw new Error('Invalid contact number format')
    }
  }

  validateRole(role) {
    const validRoles = ['admin', 'teacher', 'student_teacher', 'learner']
    if (!validRoles.includes(role)) {
      throw new Error('Invalid role.')
    }
  }

  validatePassword(password) {
    if (!password || password.length < 8) {
      throw new Error('Password must be at least 8 characters')
    }
  }

  async createUser(
    email,
    password,
    firstName,
    lastName,
    birthDate,
    contactNo,
    schoolId,
    role,
    department = null,
    section = null,
    groupId = null
  ) {
    const transaction = await this.UserModel.sequelize.transaction()
    try {
      const userData = {
        email,
        password: password,
        first_name: firstName,
        last_name: lastName,
        role: role,
        birth_date: birthDate,
        contact_no: contactNo,
        school_id: schoolId,
      }

      this.validateUserData(userData)
      this.validateRole(role)
      this.validatePassword(password)

      const user = await this.UserModel.create(userData, { transaction })

      if (role === 'teacher') {
        await this.TeacherModel.create({ user_id: user.id }, { transaction })
      } else if (role === 'admin') {
        await this.AdminModel.create({ user_id: user.id }, { transaction })
      } else if (role === 'student_teacher') {
        await this.StudentTeacherModel.create(
          { user_id: user.id, department, section, group_id: groupId },
          { transaction }
        )
      } else if (role === 'learner'){//---------
       
           if (groupId) {
               await this.LearnerModel.create({ user_id: user.id, group_id: groupId }, { transaction });
           } else {
                await this.LearnerModel.create({ user_id: user.id}, { transaction }); //create without group
           }
      }//---------------

      await transaction.commit()
      return user
    } catch (error) {
      await transaction.rollback()
      if (error.name === 'SequelizeUniqueConstraintError') {
        if (error.errors[0].path === 'email') {
          throw new Error('Email already exists')
        }
      }
      throw error
    }
  }

    async loginUser(email, password) {
      try{
      const user = await this.UserModel.findOne({ where: { email } })

      if (!user || !(await bcrypt.compare(password, user.password))) {
        throw new Error('Invalid credentials')
      }

      const passwordMatch = await bcrypt.compare(password, user.password);

      if (!passwordMatch) {
        throw new Error('Invalid credentials');
      }

      //--
      const token = this.generateToken(user); 

      return { user, token }
      }catch (error) {
        console.error("Error in loginUser:", error); // LOG THE ERROR
        throw error; // Re-throw the error so the controller can handle it
      }
  }

  //-------------
  generateToken(user) {
    return jwt.sign({ id: user.id, email: user.email, role: user.role }, this.jwtSecret, { expiresIn: '1h' }); 
  }
  //--------------

  async getAllUsers(page = 1, limit = 10) {
    return await this.UserModel.findAndCountAll({
      limit,
      offset: (page - 1) * limit,
      attributes: { exclude: ['password'] },
    })
  }

  async getUserById(userId) {
    if (!userId) {
      throw new Error('User ID is required')
    }

    // Convert to number if it's a string
    const id = Number(userId)
    if (isNaN(id)) {
      throw new Error('Invalid user ID format')
    }

    const user = await this.UserModel.findOne({
      where: { id },
      include: [
        {
          model: this.TeacherModel,
          as: 'teacher',
          required: false,
          include: [
            {
              model: this.Course,
              as: 'courses',
            },
          ],
        },
        {
          model: this.AdminModel,
          as: 'admin',
          required: false,
          include: [
            {
              model: this.EnrollmentModel,
              as: 'enrollments',
            },
          ],
        },
        {
          model: this.StudentTeacherModel,
          as: 'studentTeacher',
          required: false,
          include: [
            {
              model: this.Group,
              as: 'group',
            },
          ],
        },
        {
          model: this.LearnerModel,
          as: 'learner',
          required: false,
          include: [
            {
              model: this.Group,
              as: 'group',
            },
          ],
        },
        {
          model: this.School,
          as: 'school',
        },
      ],
      attributes: { exclude: ['password'] },
    })

    if (!user) {
      throw new Error('User not found')
    }

    return user
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
      // added but maybe needed in the future - lennard
      else if (user.role === 'admin') {
        await this.AdminModel.destroy({ where: { user_id: userId }, force: true, transaction 
        })
      }
      //-----

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
      throw error
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

  async logoutUser(token) {
    try {
      const decoded = jwt.verify(token, this.jwtSecret);

      if (this.BlacklistModel) {
        await this.BlacklistModel.create({ token });
      }

      return { message: 'User logged out successfully' };
    } catch (error) {
      throw new Error('Invalid token or logout failed');
    }
  }
}

export default UserService
