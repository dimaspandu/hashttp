/**
 * Simple template engine with {{curlyBrace}} syntax
 */

const TEMPLATE_PATTERN = /\{\{([a-zA-Z0-9_.]+)\}\}/g;

/**
 * Get nested value from object using dot notation
 * @param {Object} obj - Source object
 * @param {string} path - Dot-notated path (e.g., "user.name")
 * @returns {*} Value at path or undefined
 */
function getNestedValue(obj, path) {
  if (!obj || typeof obj !== "object") return undefined;
  
  const keys = path.split(".");
  let value = obj;
  
  for (const key of keys) {
    if (value === null || value === undefined) return undefined;
    value = value[key];
  }
  
  return value;
}

/**
 * Replace {{placeholder}} with values from data object
 * @param {string} content - Template content
 * @param {Object} data - Data to inject
 * @returns {string} Rendered content
 */
export function renderTemplate(content, data = {}) {
  if (typeof content !== "string") return content;
  
  return content.replace(TEMPLATE_PATTERN, (_, key) => {
    const value = getNestedValue(data, key);
    return value !== undefined ? String(value) : "";
  });
}

/**
 * Check if content contains template placeholders
 * @param {string} content - Content to check
 * @returns {boolean} True if contains {{...}}
 */
export function hasPlaceholders(content) {
  return typeof content === "string" && TEMPLATE_PATTERN.test(content);
}