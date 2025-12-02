import { authMiddleware } from './authMiddleware.js'
import { checkRole } from './roleMiddleware.js'

// Define role-based route protection helper
export const protect = (roles = []) => {
  return [authMiddleware, checkRole(roles)]
}

// Commonly used role combinations
export const rbac = {
  adminOnly: protect(['admin']),
  teacherAndAdmin: protect(['teacher', 'admin']),
  studentTeacherAndAbove: protect(['student_teacher', 'admin', 'teacher']),
  allAuthenticated: protect(['admin', 'teacher', 'student_teacher', 'learner']),

  // For public routes that require authentication but no specific role
  authenticated: [authMiddleware],
}
