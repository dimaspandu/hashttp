/**
 * Hash-based exact route matcher
 * O(1) lookup for exact route keys
 */

/**
 * Create a hash matcher from routes
 * @param {Object} routes - Flat routes object
 * @returns {Object} Matcher with match() method
 */
export function createHashMatcher(routes) {
  return {
    match(path) {
      if (routes[path]) {
        return {
          routeKey: path,
          pointer: routes[path],
          params: {},
        };
      }
      return null;
    },
  };
}
