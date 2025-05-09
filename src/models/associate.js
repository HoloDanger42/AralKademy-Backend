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
  Module,
  Content,
  Assessment,
  Question,
  QuestionOption,
  Submission,
  AnswerResponse,
  ModuleGrade,
  AuthToken,
  Announcement,
  Attendance,
  ModuleUnlockOverride,
} from './index.js'

User.hasMany(Announcement, { foreignKey: 'user_id', as: 'announcements' })
Announcement.belongsTo(User, { foreignKey: 'user_id', as: 'user' })

Course.hasMany(Announcement, { foreignKey: 'course_id', as: 'announcements', onDelete: 'CASCADE' })
Announcement.belongsTo(Course, { foreignKey: 'course_id', as: 'course' })

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

// Associate AuthToken with User
AuthToken.belongsTo(User, { foreignKey: 'user_id', as: 'user' })
User.hasMany(AuthToken, { foreignKey: 'user_id', as: 'authTokens' })

// Teacher associations
Teacher.belongsTo(User, { foreignKey: 'user_id', as: 'user' })
Teacher.hasMany(Course, {
  foreignKey: 'user_id',
  as: 'courses',
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
Group.hasMany(Course, {
  foreignKey: 'student_teacher_group_id',
  as: 'studentTeacherCourses',
})
Group.hasMany(Course, {
  foreignKey: 'learner_group_id',
  as: 'learnerCourses',
})

// School associations
School.hasMany(User, { foreignKey: 'school_id', as: 'users' })

// Course associations
Course.belongsTo(User, { foreignKey: 'user_id', as: 'teacher' })

Course.belongsTo(Group, {
  foreignKey: 'student_teacher_group_id',
  as: 'studentTeacherGroup',
})
Course.belongsTo(Group, {
  foreignKey: 'learner_group_id',
  as: 'learnerGroup',
})

Course.hasMany(Module, { foreignKey: 'course_id', as: 'modules' })

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

// Module associations
Module.belongsTo(Course, { foreignKey: 'course_id', as: 'course' })
Module.hasMany(Content, { foreignKey: 'module_id', as: 'contents' })

// Content associations
Content.belongsTo(Module, { foreignKey: 'module_id', as: 'module' })

// Assessment associations
Module.hasMany(Assessment, {
  foreignKey: 'module_id',
  as: 'assessments',
  onDelete: 'CASCADE',
})
Assessment.belongsTo(Module, {
  foreignKey: 'module_id',
  as: 'module',
})

// Question associations
Assessment.hasMany(Question, {
  foreignKey: 'assessment_id',
  as: 'questions',
  onDelete: 'CASCADE',
})
Question.belongsTo(Assessment, {
  foreignKey: 'assessment_id',
  as: 'assessment',
})

// QuestionOption associations
Question.hasMany(QuestionOption, {
  foreignKey: 'question_id',
  as: 'options',
  onDelete: 'CASCADE',
})
QuestionOption.belongsTo(Question, {
  foreignKey: 'question_id',
  as: 'question',
})

// Submission associations
Assessment.hasMany(Submission, {
  foreignKey: 'assessment_id',
  as: 'submissions',
})
Submission.belongsTo(Assessment, {
  foreignKey: 'assessment_id',
  as: 'assessment',
})
User.hasMany(Submission, {
  foreignKey: 'user_id',
  as: 'submissions',
})
Submission.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user',
})

// AnswerResponse associations
Submission.hasMany(AnswerResponse, {
  foreignKey: 'submission_id',
  as: 'answers',
  onDelete: 'CASCADE',
})
AnswerResponse.belongsTo(Submission, {
  foreignKey: 'submission_id',
  as: 'submission',
})
Question.hasMany(AnswerResponse, {
  foreignKey: 'question_id',
  as: 'responses',
})
AnswerResponse.belongsTo(Question, {
  foreignKey: 'question_id',
  as: 'question',
})
QuestionOption.hasMany(AnswerResponse, {
  foreignKey: 'selected_option_id',
  as: 'selections',
})
AnswerResponse.belongsTo(QuestionOption, {
  foreignKey: 'selected_option_id',
  as: 'selected_option',
})

// ModuleGrade associations
ModuleGrade.belongsTo(Module, {
  foreignKey: 'module_id',
  as: 'module',
})

ModuleGrade.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user',
})

Module.hasMany(ModuleGrade, {
  foreignKey: 'module_id',
  as: 'modulegrades',
})

User.hasMany(ModuleGrade, {
  foreignKey: 'user_id',
  as: 'modulegrades',
})

// Attendance associations
User.hasMany(Attendance, {
  foreignKey: 'user_id',
  as: 'attendances',
  onDelete: 'CASCADE',
})

Attendance.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user',
})

Course.hasMany(Attendance, {
  foreignKey: 'course_id',
  as: 'attendances',
  onDelete: 'CASCADE',
})

Attendance.belongsTo(Course, {
  foreignKey: 'course_id',
  as: 'course',
})

// ModuleUnlockOverride associations
ModuleUnlockOverride.belongsTo(User, { foreignKey: 'user_id', as: 'learner' })
ModuleUnlockOverride.belongsTo(User, {
  foreignKey: 'overridden_by_user_id',
  as: 'teacherWhoUnlocked',
})
ModuleUnlockOverride.belongsTo(Module, { foreignKey: 'unlocked_module_id', as: 'unlockedModule' })

User.hasMany(ModuleUnlockOverride, { foreignKey: 'user_id', as: 'receivedModuleUnlocks' })
User.hasMany(ModuleUnlockOverride, {
  foreignKey: 'overridden_by_user_id',
  as: 'performedModuleUnlocks',
})
Module.hasMany(ModuleUnlockOverride, { foreignKey: 'unlocked_module_id', as: 'manualUnlocks' })
Course.hasMany(ModuleUnlockOverride, { foreignKey: 'course_id', as: 'manualModuleUnlocksInCourse' })

export {
  User,
  Teacher,
  Admin,
  StudentTeacher,
  Learner,
  Enrollment,
  Course,
  Group,
  School,
  Module,
  Content,
  Assessment,
  Question,
  QuestionOption,
  Submission,
  AnswerResponse,
  ModuleGrade,
  AuthToken,
  Announcement,
  Attendance,
  ModuleUnlockOverride,
}
