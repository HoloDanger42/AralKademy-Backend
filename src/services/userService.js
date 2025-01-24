import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

class UserService {
  constructor(UserModel, TeacherModel, AdminModel, StudentTeacherModel) {
    this.UserModel = UserModel;
    this.TeacherModel = TeacherModel;
    this.AdminModel = AdminModel;
    this.StudentTeacherModel = StudentTeacherModel;
  }

  async createUser(email, password, firstName, lastName, birthDate, contactNo, schoolId, role, department = null, section = null, groupId = null) {
    const transaction = await this.UserModel.sequelize.transaction();
    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      const userData = {
        email,
        password: hashedPassword,
        first_name: firstName,
        last_name: lastName,
        role: role,
        birth_date: birthDate,
        contact_no: contactNo,
        school_id: schoolId,
      };

      const user = await this.UserModel.create(userData, { transaction });

      if (role === 'teacher') {
        await this.TeacherModel.create({ user_id: user.id }, { transaction });
      } else if (role === 'admin') {
        await this.AdminModel.create({ user_id: user.id }, { transaction });
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
    const user = await this.UserModel.findOne({ where: { email } });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new Error('Invalid credentials');
    }

    const token = jwt.sign({ email }, process.env.JWT_SECRET, {
      expiresIn: '1h',
    });

    return { user, token };
  }

  async getAllUsers() {
    return await this.UserModel.findAll();
  }
}

export default UserService;