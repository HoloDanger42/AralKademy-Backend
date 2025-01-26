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
  {
    name: 'Data Science Basics',
    description: 'An introduction to data science concepts and tools.',
  },
];

export const invalidCourses = [
  {
    name: '', // Empty course name
    description: 'This course has no name.',
  },
  {
    name: 'a'.repeat(256), // Too long course name (greater than 255 characters)
    description: 'This course name exceeds the length limit.',
  },
  {
    name: 'Valid Name But No Description', // Valid name but no description
    description: '', 
  },
];
