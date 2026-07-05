/**
 * Page composition utility for combining multiple templates/files
 */

/**
 * Compose templates with shared data context
 * @param {Array} chunks - Array of:
 *   - string: file path or inline template
 *   - { target: string, data?: object }: file with optional override data
 * @param {Object} context - Shared data (route params, global data)
 * @param {Object} options - { readFile, pathResolve, basePath }
 * @returns {Promise<string>}
 */
export async function compose(chunks, context = {}, options = {}) {
  if (!Array.isArray(chunks)) {
    throw new Error("chunks must be an array");
  }

  const { readFile } = options;
  
  async function resolveAndRender(chunk) {
    const chunkData = typeof chunk === "object" && chunk.data ? { ...context, ...chunk.data } : context;
    const target = typeof chunk === "object" ? chunk.target : chunk;
    
    if (!target || typeof target !== "string") {
      return "";
    }
    
    const isInline = target.includes("{{") && target.includes("}}") && !options.basePath;
    
    let content;
    if (isInline) {
      content = target;
    } else {
      const filePath = options.basePath ? options.pathResolve(options.basePath, target) : target;
      try {
        content = await readFile(filePath, "utf-8");
      } catch {
        return "";
      }
    }
    
    return renderInPlace(content, chunkData);
  }
  
  const parts = await Promise.all(chunks.map(resolveAndRender));
  return parts.join("");
}

/**
 * Replace {{placeholder}} in template content
 * @param {string} content - Template content
 * @param {Object} data - Data object
 * @returns {string} Rendered content
 */
export function renderInPlace(content, data) {
  if (typeof content !== "string") return content;
  
  const pattern = new RegExp(/\\{\\{([a-zA-Z0-9_.]+)\\}\\}/g.source, "g");
  return content.replace(pattern, (_, key) => {
    const value = getNestedValue(data, key);
    return value !== undefined ? String(value) : "";
  });
}

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