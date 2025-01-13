export const validUsers = [
  {
    username: 'john_doe',
    email: 'john@example.com',
    password: 'securepassword',
  },
  {
    username: 'jane_smith',
    email: 'jane@example.com',
    password: 'anothersecurepassword',
  },
]

export const invalidUsers = [
  {
    // Missing username
    email: 'no_username@example.com',
    password: 'password123',
  },
  {
    // Invalid email format
    username: 'invalid_email',
    email: 'invalid-email',
    password: 'password123',
  },
  {
    // Short password
    username: 'short_password',
    email: 'shortpass@example.com',
    password: 'short',
  },
]
