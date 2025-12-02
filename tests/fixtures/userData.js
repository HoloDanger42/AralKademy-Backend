<<<<<<< HEAD
export const validUsers = [
  {
    first_name: 'John',
    last_name: 'Doe',
    email: 'john@example.com',
    password: 'securepassword',
    birth_date: new Date('2000-01-01'),
    contact_no: '639123456789',
    role: 'learner',
  },
  {
    first_name: 'Jane',
    last_name: 'Smith',
    email: 'jane@example.com',
    password: 'anothersecurepassword',
    school_id: 2,
    role: 'teacher',
  },
  {
    first_name: 'Bob',
    last_name: 'Brown',
    email: 'bob.brown@example.com',
    password: 'anothersecurepassword',
    school_id: 3,
    role: 'student_teacher',
    student_teacher: {
      section: 'B1',
      department: 'Mathematics',
      student_teacher_group_id: 2,
    },
  },
  {
    first_name: 'Alice',
    last_name: 'Johnson',
    email: 'alice.johnson@example.com',
    password: 'anothersecurepassword',
    school_id: 4,
    role: 'admin',
  },
]

export const invalidUsers = [
  {
    // Missing first_name
    last_name: 'Doe',
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
    first_name: 'Invalid',
    last_name: 'Email',
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
    first_name: 'Short',
    last_name: 'Password',
    email: 'shortpassword@example.com',
    password: 'short',
    schoolId: 1,
    learner: {
      section: 'B',
      year_level: 2,
      group_id: 2,
    },
  },
  {
    // Missing schoolId
    first_name: 'NoSchool',
    last_name: 'User',
    email: 'noschool@example.com',
    password: 'password123',
    learner: {
      section: 'C',
      year_level: 3,
      group_id: 3,
    },
  },
]
=======
export const validUsers = [
  {
    first_name: 'John',
    last_name: 'Doe',
    email: 'john@example.com',
    password: 'securepassword',
    birth_date: new Date('2000-01-01'),
    contact_no: '639123456789',
    role: 'learner',
  },
  {
    first_name: 'Jane',
    last_name: 'Smith',
    email: 'jane@example.com',
    password: 'anothersecurepassword',
    school_id: 2,
    role: 'teacher',
  },
  {
    first_name: 'Bob',
    last_name: 'Brown',
    email: 'bob.brown@example.com',
    password: 'anothersecurepassword',
    school_id: 3,
    role: 'student_teacher',
    student_teacher: {
      section: 'B1',
      department: 'Mathematics',
      student_teacher_group_id: 2,
    },
  },
  {
    first_name: 'Alice',
    last_name: 'Johnson',
    email: 'alice.johnson@example.com',
    password: 'anothersecurepassword',
    school_id: 4,
    role: 'admin',
  },
]

export const invalidUsers = [
  {
    // Missing first_name
    last_name: 'Doe',
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
    first_name: 'Invalid',
    last_name: 'Email',
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
    first_name: 'Short',
    last_name: 'Password',
    email: 'shortpassword@example.com',
    password: 'short',
    schoolId: 1,
    learner: {
      section: 'B',
      year_level: 2,
      group_id: 2,
    },
  },
  {
    // Missing schoolId
    first_name: 'NoSchool',
    last_name: 'User',
    email: 'noschool@example.com',
    password: 'password123',
    learner: {
      section: 'C',
      year_level: 3,
      group_id: 3,
    },
  },
]
>>>>>>> 627466f638de697919d077ca56524377d406840d
