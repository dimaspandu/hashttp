/**
 * Simple template engine with {{curlyBrace}} syntax
 */

const TEMPLATE_REGEX = /\{\{([a-zA-Z0-9_.]+)\}\}/g;

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
  
  const pattern = new RegExp(TEMPLATE_REGEX.source, "g");
  return content.replace(pattern, (_, key) => {
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
  return typeof content === "string" && /\{\{([a-zA-Z0-9_.]+)\}\}/.test(content);
}