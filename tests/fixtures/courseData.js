export const validCourses = [
  {
    name: 'Introduction to JavaScript',
    description: 'A beginner-friendly course on JavaScript programming.',
  },
  {
    name: 'Advanced Node.js',
    description: 'A deep dive into Node.js for experienced developers.',
  },
  {
    name: 'Web Development with React',
    description: 'Learn to build modern web apps using React.',
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
