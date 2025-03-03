/**
 * Middleware to check if user has one of the allowed roles
 * @param {Array} allowedRoles - List of roles allowed to access the route
 */
export const checkRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized - No user data found' })
    }

    if (allowedRoles.includes(req.user.role)) {
      next()
    } else {
      res.status(403).json({
        message: 'Forbidden - You do not have permission to perform this action',
      })
    }
  }
}
