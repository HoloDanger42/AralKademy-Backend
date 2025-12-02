import { User, Teacher, Admin, Learner, StudentTeacher } from '../models/index.js'
import { sequelize } from '../config/database.js'

/**
 * Service for managing user roles within the system.
 * Provides functionality for validating, assigning, and changing user roles
 * with appropriate role-specific data validation.
 *
 * @class RoleService
 * @static
 * @description Handles all role-related operations including validation of roles
 * and their associated required data, assignment of roles to users, and
 * transitioning users between different roles while maintaining data integrity.
 *
 * The service supports the following roles:
 * - teacher: Regular teaching staff
 * - admin: System administrators
 * - student_teacher: Students who also teach
 * - learner: Regular students
 *
 * Each role has specific data requirements that are enforced during assignment.
 */
class RoleService {
  /**
   * List of valid roles in the system.
   * @static
   * @type {string[]}
   * @memberof RoleService
   */
  static VALID_ROLES = ['teacher', 'admin', 'student_teacher', 'learner']

  /**
   * Validates the required data for a specific role.
   *
   * @static
   * @param {string} role - The role to validate data for ('learner', 'student_teacher', etc.)
   * @param {Object} roleData - The data associated with the role
   * @param {string} [roleData.enrollment_id] - Required for learner role
   * @param {string} [roleData.year_level] - Required for learner role
   * @param {string} [roleData.section] - Required for student_teacher role
   * @param {string} [roleData.department] - Required for student_teacher role
   * @throws {Error} If required data for the role is missing
   * @memberof RoleService
   */
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

  /**
   * Assigns a role to a user.
   *
   * @static
   * @async
   * @param {number|string} userId - The ID of the user
   * @param {string} role - The role to assign
   * @param {Object} [roleData={}] - Additional data required for the role
   * @returns {Promise<boolean>} True if role assignment was successful
   * @throws {Error} If role validation fails, user not found, or user already has the role
   * @memberof RoleService
   */
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

  /**
   * Changes a user's role to a new one.
   *
   * @static
   * @async
   * @param {number|string} userId - The ID of the user
   * @param {string} newRole - The new role to assign
   * @param {Object} [roleData={}] - Additional data required for the new role
   * @returns {Promise<boolean>} True if role change was successful
   * @throws {Error} If role validation fails, user not found, or user already has the requested role
   * @memberof RoleService
   */
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

  /**
   * Validates if the provided role is valid.
   *
   * @static
   * @param {string} role - The role to validate
   * @throws {Error} If the role is not in the list of valid roles
   * @memberof RoleService
   */
  static validateRole(role) {
    if (!this.VALID_ROLES.includes(role)) {
      throw new Error(`Invalid role. Must be one of: ${this.VALID_ROLES.join(', ')}`)
    }
  }

  /**
   * Gets the appropriate model for a role.
   *
   * @static
   * @param {string} role - The role to get the model for
   * @returns {Object} The Sequelize model corresponding to the role
   * @throws {Error} If the role has no corresponding model
   * @memberof RoleService
   */
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
