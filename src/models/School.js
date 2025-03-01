import { DataTypes, Op } from 'sequelize'
import { sequelize } from '../config/database.js'
import { User } from './User.js'

const School = sequelize.define(
  'School',
  {
    school_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: {
        args: true,
        msg: 'School name must be unique',
      },
      validate: {
        notNull: {
          msg: 'School name is required',
        },
        notEmpty: {
          msg: 'School name is required',
        },
        len: {
          args: [1, 255],
          msg: 'School name must be between 1 and 255 characters',
        },
      },
    },
    address: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notNull: {
          msg: 'Address is required',
        },
        notEmpty: {
          msg: 'Address is required',
        },
      },
    },
    contact_no: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: {
          msg: 'Contact number is required',
        },
        is: {
          args: /^(?:\+63|0)?(?:2|3\d{2})[-\s]?\d{3,4}[-\s]?\d{4}$/,
          msg: 'Contact number must be valid',
        },
      },
    },
  },
  {
    tableName: 'schools',
    timestamps: true,
    underscored: true,
    paranoid: true,
    hooks: {
      beforeDestroy: async (school) => {
        const userCount = await User.count({
          where: {
            school_id: school.school_id,
            deletedAt: null,
          },
        })
        if (userCount > 0) {
          throw new Error('Cannot delete school with active users')
        }
      },
    },
  }
)

// // Function to ensure only hardcoded data exists
// const hardCodeSchoolData = async () => {
//   const hardcodedSchools = [
//     {
//       school_id: 1001,
//       name: 'University of Santo Tomas',
//       address: 'Espana Blvd, Sampaloc, Manila, 1008 Metro Manila',
//       contact_no: '+6324061611',
//     },
//     {
//       school_id: 1002,
//       name: 'Asuncion Consunji Elementary School',
//       address: 'Samal, Bataan',
//       contact_no: '+6324061611',
//     },
//   ]

//   // Remove any schools that are not in the hardcoded list
//   await School.destroy({
//     where: {
//       school_id: {
//         [Op.notIn]: hardcodedSchools.map((school) => school.school_id),
//       },
//     },
//     force: true, // Ensures permanent deletion
//   })

//   // Insert only if missing
//   for (const school of hardcodedSchools) {
//     await School.findOrCreate({
//       where: { school_id: school.school_id },
//       defaults: school,
//     })
//   }
// }

// // Call the function to enforce data consistency
// hardCodeSchoolData()

export { School }
