/**
 * Trie-based route matcher for large route sets
 * Efficient for prefix-based and dynamic route matching
 */

/**
 * Create a trie node
 * @returns {Object} Trie node with children map and route info
 */
export function createNode() {
  return {
    children: new Map(),
    exact: null, // Exact match route info
    param: null, // :param match route info
  };
}

 
/**
 * @param {Object} root - Trie root node
 * @param {string} path - Route path (e.g., "/articles/:slug")
 * @param {*} pointer - Route target (file, folder, or handler object)
 */
export function insertRoute(root, path, pointer) {
  const segments = path.split("/").filter(Boolean);
  let node = root;

  for (const segment of segments) {
    if (!node.children.has(segment)) {
      node.children.set(segment, createNode());
    }
    node = node.children.get(segment);
  }

  node.exact = { pointer };
}

/**
 * Insert a dynamic route (with :param) into the trie
 * @param {Object} root - Trie root node
 * @param {string} path - Route path (e.g., "/articles/:slug")
 * @param {*} pointer - Route target
 */
export function insertDynamicRoute(root, path, pointer) {
  const segments = path.split("/").filter(Boolean);
  let node = root;

  for (const segment of segments) {
    const isParam = segment.startsWith(":");
    const key = isParam ? ":param" : segment;

    if (!node.children.has(key)) {
      node.children.set(key, createNode());
    }
    node = node.children.get(key);
  }

  if (!node.param) {
    node.param = {
      pointer,
      paramNames: segments.filter((s) => s.startsWith(":")).map((s) => s.substring(1)),
    };
  }
}

/**
 * Match a path in the trie
 * @param {Object} root - Trie root node
 * @param {string} path - Request path
 * @returns {Object|null} Match info or null
 */
export function matchPath(root, path) {
  const segments = path.split("/").filter(Boolean);
  let node = root;
  const capturedParams = {};

  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];

    // Try exact match first
    if (node.children.has(segment)) {
      node = node.children.get(segment);
    }
    // Then try param match
    else if (node.children.has(":param")) {
      const paramNode = node.children.get(":param");
      // Track the param name from this level
      node = paramNode;
    } else {
      return null;
    }
  }

  // Check if we have an exact match at this node
  if (node.exact) {
    return {
      pointer: node.exact.pointer,
      params: capturedParams,
    };
  }

  // Check if we have a param match
  if (node.param) {
    return {
      pointer: node.param.pointer,
      params: capturedParams,
    };
  }

  return null;
}

/**
 * Create a trie matcher
 * @param {Object} routes - Flat routes object
 * @returns {Object} Matcher with match() method
 */
export function createTrieMatcher(routes) {
  const root = createNode();

  for (const [routeKey, pointer] of Object.entries(routes)) {
    if (routeKey.includes(":")) {
      insertDynamicRoute(root, routeKey, pointer);
    } else {
      insertRoute(root, routeKey, pointer);
    }
  }

  return {
    match(path) {
      const result = matchPath(root, path);
      if (result) {
        return {
          routeKey: path, // TODO: track actual route key
          pointer: result.pointer,
          params: result.params,
        };
      }
      return null;
    },
  };
}
 
