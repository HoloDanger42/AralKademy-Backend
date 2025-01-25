export const validEnrollments = [
  {
    email: 'john.doe@example.com',
    password: 'securepassword',
    firstName: 'John',
    lastName: 'Doe',
    birthDate: '1990-01-01',
    contactNo: '1234567890',
    schoolId: 1,
    yearLevel: 3
  },
  {
    email: 'jane.smith@example.com',
    password: 'anothersecurepassword',
    firstName: 'Jane',
    lastName: 'Smith',
    birthDate: '1995-05-15',
    contactNo: '0987654321',
    schoolId: 2,
    yearLevel: 2
  }
];

export const invalidEnrollments = [
  {
    email: null,
    password: 'short',
    firstName: 'Invalid',
    lastName: 'User',
    birthDate: '2000-12-12',
    contactNo: '0000000000',
    schoolId: null,
    yearLevel: null
  },
  {
    email: 'no.password@example.com',
    password: '',
    firstName: '',
    lastName: '',
    birthDate: '',
    contactNo: '',
    schoolId: 1,
    yearLevel: 1
  }
];
