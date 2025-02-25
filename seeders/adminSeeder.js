import { sequelize } from '../src/config/database.js'
import { User, Admin, School } from '../src/models/index.js'
import { adminsList } from '../src/config/admins.js'
import { log } from '../src/utils/logger.js'
import bcrypt from 'bcryptjs'

export const seedAdmins = async () => {
  const t = await sequelize.transaction()
  try {
    // Check if admin already exists
    const existingAdmin = await Admin.count()
    if (existingAdmin > 0) {
      log.info('Admins already seeded')
      return
    }

    // Retrieve the school with the name "University of Santo Tomas"
    const school = await School.findOne({
      where: { name: 'University of Santo Tomas' },
      transaction: t,
    })
    if (!school) {
      throw new Error('University of Santo Tomas not found. Ensure the school is seeded first.')
    }

    // Create admin users
    for (const adminData of adminsList) {
      const hashedPassword = await bcrypt.hash(adminData.password, 10)

      const user = await User.create(
        {
          email: adminData.email,
          password: hashedPassword,
          first_name: adminData.first_name,
          last_name: adminData.last_name,
          role: adminData.role,
          is_verified: adminData.is_verified,
          school_id: school.school_id,
        },
        { transaction: t }
      )

      await Admin.create(
        {
          user_id: user.id,
        },
        { transaction: t }
      )
    }

    await t.commit()
    log.info('Admin users seeded successfully')
  } catch (error) {
    await t.rollback()
    log.error('Error seeding admin users:', error)
    throw error
  }
}
