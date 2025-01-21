import { User } from './User.js'
import { Learner } from './Learner.js'
import { Group } from './Group.js'
import { StudentTeacher } from './StudentTeacher.js'
import { Course } from './Course.js'
import { School } from './School.js'

const models = {
  User,
  Learner,
  Group,
  StudentTeacher,
  Course,
  School,
}

// Initialize associations after all models are loaded
User.hasOne(Learner, { foreignKey: 'user_id', as: 'learnerProfile' })
Learner.belongsTo(User, { foreignKey: 'user_id', as: 'user' })
Learner.belongsTo(Group, { foreignKey: 'learner_group_id', as: 'group' })
Group.hasMany(Learner, { foreignKey: 'learner_group_id', as: 'learners' })
School.hasMany(User, { foreignKey: 'school_id' })

export default models
