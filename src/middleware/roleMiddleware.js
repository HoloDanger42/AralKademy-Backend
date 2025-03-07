import { UnauthorizedError, ForbiddenError } from '../utils/errors.js'

/**
 * Middleware to check if user has one of the allowed roles
 * @param {Array} allowedRoles - List of roles allowed to access the route
 */
export const checkRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      throw new UnauthorizedError('No authenticated user found', 'NO_USER_DATA')
    }

    if (allowedRoles.includes(req.user.role)) {
      next()
    } else {
      throw new ForbiddenError(
        `You need one of these roles: ${allowedRoles.join(', ')}`,
        'INSUFFICIENT_ROLE'
      )
    }
  }
}
