import { User } from './User.js'
import { Learner } from './Learner.js'
import { StudentTeacher } from './StudentTeacher.js'
import { Teacher } from './Teacher.js'
import { Admin } from './Admin.js'
import { Group } from './Group.js'
import { Enrollment } from './Enrollment.js'
import { Course } from './Course.js'
import { School } from './School.js'

const models = {
  User,
  Learner,
  Group,
  Enrollment,
  StudentTeacher,
  Teacher,
  Admin,
  Course,
  School,
}

// Initialize associations after all models are loaded
User.belongsTo(School, { foreignKey: 'school_id', as: 'school' })
User.hasOne(StudentTeacher, {
  foreignKey: 'user_id',
  as: 'studentTeacher',
  onDelete: 'CASCADE',
  hooks: true,
})
User.hasOne(Teacher, {
  foreignKey: 'user_id',
  as: 'teacher',
  onDelete: 'CASCADE',
  hooks: true,
})
User.hasOne(Admin, {
  foreignKey: 'user_id',
  as: 'admin',
  onDelete: 'CASCADE',
  hooks: true,
})
User.hasOne(Learner, {
  foreignKey: 'user_id',
  as: 'learner',
  onDelete: 'CASCADE',
  hooks: true,
})
Teacher.hasMany(Course, { foreignKey: 'user_id', as: 'courses', onDelete: 'CASCADE' })
Teacher.belongsTo(User, { foreignKey: 'user_id', as: 'user' })
Learner.belongsTo(User, { foreignKey: 'user_id', as: 'user' })
Learner.belongsTo(Group, { foreignKey: 'learner_group_id', as: 'group' })
Learner.belongsTo(Enrollment, { foreignKey: 'enrollment_id', as: 'enrollment' })
StudentTeacher.belongsTo(User, { foreignKey: 'user_id', as: 'user' })
StudentTeacher.belongsTo(Group, { foreignKey: 'student_teacher_group_id', as: 'group' })
Enrollment.hasOne(Learner, { foreignKey: 'enrollment_id', as: 'learner' })
Group.hasMany(Learner, { foreignKey: 'learner_group_id', as: 'learners' })
School.hasMany(User, { foreignKey: 'school_id' })
Course.belongsTo(models.Teacher, { foreignKey: 'user_id', as: 'teacher', onDelete: 'CASCADE' })
Course.belongsTo(models.Group, {
  foreignKey: 'student_teacher_group_id',
  as: 'studentTeacherGroup',
})
Course.belongsTo(models.Group, { foreignKey: 'learner_group_id', as: 'learnerGroup' })

export default models
