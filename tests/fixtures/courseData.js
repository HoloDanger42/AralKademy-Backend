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
  ];