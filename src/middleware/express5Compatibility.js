/**
 * Middleware to ensure compatibility with Express 5
 * 
 * In Express 5, req.query, req.body, and req.params are now immutable (read-only).
 * This middleware creates mutable copies of these properties to maintain compatibility
 * with code that might try to modify them.
 */
export const express5Compatibility = (req, _res, next) => {
  // Create a mutable copy of req.query
  if (req.query) {
    const originalQuery = { ...req.query };
    
    // Define a mutable property that shadows the immutable one
    Object.defineProperty(req, '_mutableQuery', {
      value: { ...originalQuery },
      writable: true,
      configurable: true
    });
    
    // Override the query getter to return our mutable copy
    Object.defineProperty(req, 'query', {
      get: function() { return this._mutableQuery; },
      set: function(val) { this._mutableQuery = val; },
      configurable: true
    });
  }

  // Create a mutable copy of req.params
  if (req.params) {
    const originalParams = { ...req.params };
    
    Object.defineProperty(req, '_mutableParams', {
      value: { ...originalParams },
      writable: true,
      configurable: true
    });
    
    Object.defineProperty(req, 'params', {
      get: function() { return this._mutableParams; },
      set: function(val) { this._mutableParams = val; },
      configurable: true
    });
  }

  // Create a mutable copy of req.body
  if (req.body) {
    const originalBody = { ...req.body };
    
    Object.defineProperty(req, '_mutableBody', {
      value: { ...originalBody },
      writable: true,
      configurable: true
    });
    
    Object.defineProperty(req, 'body', {
      get: function() { return this._mutableBody; },
      set: function(val) { this._mutableBody = val; },
      configurable: true
    });
  }

  next();
};