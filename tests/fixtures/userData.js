export const validUsers = [
  {
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    password: 'securepassword',
    school_id: 1,
    learner: {
      section: 'A',
      year_level: 1,
      group_id: 1,
    },
  },
  {
    firstName: 'Jane',
    lastName: 'Smith',
    email: 'jane@example.com',
    password: 'anothersecurepassword',
    school_id: 2,
    teacher: {
      department: 'Math',
      emp_status: 'Full-time',
    },
  },
]

export const invalidUsers = [
  {
    // Missing firstName
    lastName: 'Doe',
    email: 'missingfirstname@example.com',
    password: 'password123',
    school_id: 1,
    admin: {
      position: 'Manager',
      emp_status: 'Full-time',
    },
  },
  {
    // Invalid email format
    firstName: 'Invalid',
    lastName: 'Email',
    email: 'invalid-email',
    password: 'password123',
    school_id: 2,
    teacher: {
      department: 'Science',
      emp_status: 'Part-time',
    },
  },
  {
    // Password too short
    firstName: 'Short',
    lastName: 'Password',
    email: 'shortpassword@example.com',
    password: 'short',
    school_id: 1,
    learner: {
      section: 'B',
      year_level: 2,
      group_id: 2,
    },
  },
  {
    // Missing school_id
    firstName: 'NoSchool',
    lastName: 'User',
    email: 'noschool@example.com',
    password: 'password123',
    learner: {
      section: 'C',
      year_level: 3,
      group_id: 3,
    },
  },
]
