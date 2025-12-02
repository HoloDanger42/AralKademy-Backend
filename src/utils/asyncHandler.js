/**
 * Utility function to handle async route handlers in Express
 * Eliminates the need for try/catch blocks in every route
 * @param {Function} fn - Async function to be wrapped
 * @returns {Function} - Express middleware function
 */
export const asyncHandler = (fn) => {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next)
}
