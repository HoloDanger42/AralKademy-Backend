export const validEnrollments = [
  {
    email: 'testuser1@example.com',
    password: 'password123!',
    confirm_password: 'password123!',
    first_name: 'John',
    last_name: 'Doe',
    birth_date: '2000-01-01',
    contact_no: '09953644057',
    school_id: 'school123',
    year_level: 'Freshman',
  },
  {
    email: 'testuser2@example.com',
    password: 'password456@',
    confirm_password: 'password456@',
    first_name: 'Jane',
    last_name: 'Smith',
    birth_date: '1999-02-02',
    contact_no: '09953644057',
    school_id: 'school456',
    year_level: 'Sophomore',
  },
]

export const invalidEnrollments = [
  {
    email: null, // Missing email
    password: 'password123',
    first_name: 'John',
    last_name: 'Doe',
    birth_date: '2000-01-01',
    contact_no: '1234567890',
    school_id: 'school123',
    year_level: 'Freshman',
  },
]
