export const validCourses = [
  {
    name: 'Introduction to Programming',
    description: 'Learn the basics of programming.',
  },
  {
    name: 'Advanced JavaScript',
    description: 'Deep dive into JavaScript and its frameworks.',
  },
  {
    name: 'Database Management System',
    description: 'Understand the fundamentals of database design and SQL.',
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
