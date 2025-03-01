import {
  User,
  Teacher,
  Admin,
  StudentTeacher,
  Learner,
  Enrollment,
  Course,
  Group,
  School,
} from './index.js'

// User associations
User.belongsTo(School, { foreignKey: 'school_id', as: 'school' })
User.hasOne(Teacher, {
  foreignKey: 'user_id',
  as: 'teacher',
  onDelete: 'CASCADE',
})
User.hasOne(Admin, {
  foreignKey: 'user_id',
  as: 'admin',
  onDelete: 'CASCADE',
})
User.hasOne(StudentTeacher, {
  foreignKey: 'user_id',
  as: 'studentTeacher',
  onDelete: 'CASCADE',
})
User.hasOne(Learner, {
  foreignKey: 'user_id',
  as: 'learner',
  onDelete: 'CASCADE',
})

// Teacher associations
Teacher.belongsTo(User, { foreignKey: 'user_id', as: 'user' })
Teacher.hasMany(Course, {
  foreignKey: 'user_id',
  as: 'courses',
  onDelete: 'CASCADE',
})

// Admin associations
Admin.belongsTo(User, { foreignKey: 'user_id', as: 'user' })
Admin.hasMany(Enrollment, { foreignKey: 'handled_by_id', as: 'enrollments' })

// StudentTeacher associations
StudentTeacher.belongsTo(User, { foreignKey: 'user_id', as: 'user' })
StudentTeacher.belongsTo(Group, {
  foreignKey: 'student_teacher_group_id',
  as: 'group',
})

// Learner associations
Learner.belongsTo(User, { foreignKey: 'user_id', as: 'user' })
Learner.belongsTo(Group, { foreignKey: 'learner_group_id', as: 'group' })
Learner.belongsTo(Enrollment, {
  foreignKey: 'enrollment_id',
  as: 'enrollment',
})

// Group associations
Group.hasMany(Learner, { foreignKey: 'learner_group_id', as: 'learners' })
Group.hasMany(StudentTeacher, {
  foreignKey: 'student_teacher_group_id',
  as: 'studentTeachers',
})
Group.hasOne(Course, {
  foreignKey: 'student_teacher_group_id',
  as: 'studentTeacherCourse',
})
Group.hasOne(Course, {
  foreignKey: 'learner_group_id',
  as: 'learnerCourse',
})

// School associations
School.hasMany(User, { foreignKey: 'school_id', as: 'users' })

// Course associations
Course.belongsTo(User, { foreignKey: 'user_id', as: 'teacher', onDelete: 'CASCADE' })

Course.belongsTo(Group, {
  foreignKey: 'student_teacher_group_id',
  as: 'studentTeacherGroup',
})
Course.belongsTo(Group, {
  foreignKey: 'learner_group_id',
  as: 'learnerGroup',
})

// Enrollment associations
Enrollment.belongsTo(School, { foreignKey: 'school_id', as: 'school' })
Enrollment.belongsTo(Admin, {
  foreignKey: 'handled_by_id',
  as: 'admin',
})
Enrollment.hasOne(Learner, {
  foreignKey: 'enrollment_id',
  as: 'learner',
})

export { User, Teacher, Admin, StudentTeacher, Learner, Enrollment, Course, Group, School }
