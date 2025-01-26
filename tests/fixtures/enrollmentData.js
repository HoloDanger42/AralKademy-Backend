
export const validEnrollments = [
  {
    email: 'testuser1@example.com',
    password: 'password123',
    firstName: 'John',
    lastName: 'Doe',
    birthDate: '2000-01-01',
    contactNo: '1234567890',
    schoolId: 'school123',
    yearLevel: 'Freshman',
  },
  {
    email: 'testuser2@example.com',
    password: 'password456',
    firstName: 'Jane',
    lastName: 'Smith',
    birthDate: '1999-02-02',
    contactNo: '0987654321',
    schoolId: 'school456',
    yearLevel: 'Sophomore',
  },
];


export const invalidEnrollments = [
  {
    email: null, // Missing email
    password: 'password123',
    firstName: 'John',
    lastName: 'Doe',
    birthDate: '2000-01-01',
    contactNo: '1234567890',
    schoolId: 'school123',
    yearLevel: 'Freshman',
  },
  {
    email: 'testuser@example.com', // Email already exists
    password: 'password456',
    firstName: 'Jane',
    lastName: 'Smith',
    birthDate: '1999-02-02',
    contactNo: '0987654321',
    schoolId: 'school456',
    yearLevel: 'Sophomore',
  },
];
