export const validCourses = [
  {
    name: 'Introduction to Programming',
    description: 'Learn the basics of programming.',
    user_id: 1,
    student_teacher_group_id: 1,
    learner_group_id: 1,
  },
  {
    name: 'Advanced JavaScript',
    description: 'Deep dive into JavaScript and its frameworks.',
    user_id: 2,
    student_teacher_group_id: 2,
    learner_group_id: 2,
  },
  {
    name: 'Database Management System',
    description: 'Understand the fundamentals of database design and SQL.',
    user_id: 2,
    student_teacher_group_id: 2,
    learner_group_id: 2,
  },
]

export const invalidCourses = [
  {
    // Missing name
    description: 'Course without a name.',
  },
  {
    // Name too long (assuming max length is 255)
    name: 'A'.repeat(256),
    description: 'Course with a very long name.',
  },
]
