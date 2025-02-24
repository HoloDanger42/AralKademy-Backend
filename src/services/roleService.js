import { User } from '../models/User.js'
import { Teacher } from '../models/Teacher.js'
import { Admin } from '../models/Admin.js'
import { Learner } from '../models/Learner.js'
import { StudentTeacher } from '../models/StudentTeacher.js'
import { sequelize } from '../config/database.js'

class RoleService {
  static VALID_ROLES = ['teacher', 'admin', 'student_teacher', 'learner']

  static validateRoleData(role, roleData) {
    switch (role) {
      case 'learner':
        if (!roleData.enrollment_id) {
          throw new Error('enrollment_id is required')
        }
        if (!roleData.year_level) {
          throw new Error('year_level is required')
        }
        break
      case 'student_teacher':
        if (!roleData.section || !roleData.department) {
          throw new Error('section and department are required')
        }
        break
    }
  }

  static async assignRole(userId, role, roleData = {}) {
    const transaction = await sequelize.transaction()

    try {
      // Validate role
      this.validateRole(role)
      this.validateRoleData(role, roleData)

      // Get user
      const user = await User.findByPk(userId, { transaction })
      if (!user) throw new Error('User not found')

      if (user.role === role) {
        throw new Error('User already has this role')
      }

      // Update user role
      await user.update({ role }, { transaction })

      // Create role record
      const RoleModel = this.getRoleModel(role)
      await RoleModel.create(
        {
          user_id: userId,
          ...roleData,
        },
        { transaction }
      )

      await transaction.commit()
      return true
    } catch (error) {
      await transaction.rollback()
      throw error
    }
  }

  static async changeRole(userId, newRole, roleData = {}) {
    const transaction = await sequelize.transaction()

    try {
      // Validate new role
      this.validateRole(newRole)
      this.validateRoleData(newRole, roleData)

      // Get user
      const user = await User.findByPk(userId, { transaction })
      if (!user) throw new Error('User not found')

      if (user.role === newRole) {
        throw new Error('User already has this role')
      }

      // Soft delete old role
      const OldRoleModel = this.getRoleModel(user.role)
      await OldRoleModel.destroy({
        where: { user_id: userId },
        transaction,
      })

      // Create new role
      const NewRoleModel = this.getRoleModel(newRole)
      await NewRoleModel.create(
        {
          user_id: userId,
          ...roleData,
        },
        { transaction }
      )

      // Update user role
      await user.update({ role: newRole }, { transaction })

      await transaction.commit()
      return true
    } catch (error) {
      await transaction.rollback()
      throw error
    }
  }

  static validateRole(role) {
    if (!this.VALID_ROLES.includes(role)) {
      throw new Error(`Invalid role. Must be one of: ${this.VALID_ROLES.join(', ')}`)
    }
  }

  static getRoleModel(role) {
    switch (role) {
      case 'teacher':
        return Teacher
      case 'learner':
        return Learner
      case 'admin':
        return Admin
      case 'student_teacher':
        return StudentTeacher
      default:
        throw new Error('Invalid role model')
    }
  }
}

export { RoleService }