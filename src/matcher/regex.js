/**
 * Regex-based dynamic route matcher
 * Handles :param placeholders and captures them
 */

/**
 * Convert route template to regex
 * Example: "/articles/:slug" -> /^\/articles\/([^/]+)$/
 * @param {string} template - Route template with :param placeholders
 * @returns {Object} { regex, paramNames }
 */
export function templateToRegex(template) {
  const paramNames = [];
  let pattern = "";
  let lastIndex = 0;

  // Process template to build regex pattern
  const paramRegex = /:([a-zA-Z_][a-zA-Z0-9_]*)/g;
  let match;

  while ((match = paramRegex.exec(template)) !== null) {
    // Add escaped part before the param
    const before = template.substring(lastIndex, match.index);
    pattern += before.replace(/[.+?^${}()|[\]\\]/g, "\\$&");
    
    // Add capture group for param
    paramNames.push(match[1]);
    pattern += "([^/]+)";
    
    lastIndex = match.index + match[0].length;
  }

  // Add remaining escaped part
  const remaining = template.substring(lastIndex);
  pattern += remaining.replace(/[.+?^${}()|[\]\\]/g, "\\$&");

  pattern = `^${pattern}$`;
  return {
    regex: new RegExp(pattern),
    paramNames,
  };
}

export function createRegexMatcher(dynamicRoutes) {
  const compiled = {};

  // Pre-compile all dynamic routes
  for (const [routeKey, pointer] of Object.entries(dynamicRoutes)) {
    const { regex, paramNames } = templateToRegex(routeKey);
    compiled[routeKey] = { regex, paramNames, pointer };
  }

  return {
    match(path) {
      for (const [routeKey, { regex, paramNames, pointer }] of Object.entries(compiled)) {
        const match = path.match(regex);
        if (match) {
          const params = {};
          // First element is full match, rest are capture groups
          for (let i = 0; i < paramNames.length; i++) {
            params[paramNames[i]] = match[i + 1];
          }
          return {
            routeKey,
            pointer,
            params,
          };
        }
      }
      return null;
    },
  };
}
