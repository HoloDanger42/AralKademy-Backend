import { UnauthorizedError, ForbiddenError } from '../utils/errors.js'

/**
 * Middleware to check if user has one of the allowed roles
 * @param {Array} allowedRoles - List of roles allowed to access the route
 */
export const checkRole = (allowedRoles) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        next(new UnauthorizedError('No authenticated user found', 'NO_USER_DATA'))
        return
      }

      if (allowedRoles.includes(req.user.role)) {
        next()
      } else {
        next(new ForbiddenError(
          `You need one of these roles: ${allowedRoles.join(', ')}`,
          'INSUFFICIENT_ROLE'
        ))
      }
    } catch (error) {
      next(error)
    }
  }
}
