/**
 * Hashttp - Minimal, dependency-free routing engine
 * Main entry point
 */

import { createHashMatcher } from "./matcher/hash.js";
import { createRegexMatcher } from "./matcher/regex.js";
import { createTrieMatcher } from "./matcher/trie.js";
import { getContentType } from "./contentType.js";

const ROUTE_THRESHOLD_FOR_TRIE = 20;

/**
 * Separate routes into exact and dynamic
 * @param {Object} routes - All routes
 * @returns {Object} { exact, dynamic }
 */
function separateRoutes(routes) {
  const exact = {};
  const dynamic = {};

  for (const [key, pointer] of Object.entries(routes)) {
    if (key.includes(":")) {
      dynamic[key] = pointer;
    } else {
      exact[key] = pointer;
    }
  }

  return { exact, dynamic };
}

/**
 * Create a router instance
 * @param {Object} routesObject - Flat routes configuration
 * @returns {Object} Router instance with match() and resolve() methods
 */
function hashttp(routesObject) {
  if (!routesObject || typeof routesObject !== "object") {
    throw new Error("routesObject must be a valid object");
  }

  const routes = routesObject;
  const { exact, dynamic } = separateRoutes(routes);

  // Select matching strategy based on route count
  let exactMatcher = null;
  let dynamicMatcher = null;

  const totalRoutes = Object.keys(routes).length;

  // Create exact matcher
  if (Object.keys(exact).length > 0) {
    exactMatcher = createHashMatcher(exact);
  }

  // Create dynamic matcher
  if (Object.keys(dynamic).length > 0) {
    if (totalRoutes > ROUTE_THRESHOLD_FOR_TRIE) {
      dynamicMatcher = createTrieMatcher(dynamic);
    } else {
      dynamicMatcher = createRegexMatcher(dynamic);
    }
  }

  return {
    /**
     * Match a request path to a route
     * @param {string} path - Request path
     * @returns {Object|null} Match result or null
     */
    match(path) {
      if (!path || typeof path !== "string") {
        return null;
      }

      // Try exact match first
      if (exactMatcher) {
        const exactMatch = exactMatcher.match(path);
        if (exactMatch) {
          return {
            routeKey: exactMatch.routeKey,
            pointer: exactMatch.pointer,
            params: exactMatch.params,
          };
        }
      }

      // Try dynamic match
      if (dynamicMatcher) {
        const dynamicMatch = dynamicMatcher.match(path);
        if (dynamicMatch) {
          return {
            routeKey: dynamicMatch.routeKey,
            pointer: dynamicMatch.pointer,
            params: dynamicMatch.params,
          };
        }
      }

      // Try fallback route (*)
      if (routes["*"]) {
        return {
          routeKey: "*",
          pointer: routes["*"],
          params: {},
        };
      }

      return null;
    },

    /**
     * Resolve pointer to target info
     * @param {string|Object} pointer - Route pointer
     * @returns {Object} { target, headers, contentType }
     */
    resolve(pointer) {
      if (typeof pointer === "string") {
        return {
          target: pointer,
          headers: {},
          contentType: getContentType(pointer),
        };
      }

      if (typeof pointer === "object" && pointer.target) {
        const headers = pointer.headers || {};
        const contentType = headers["Content-Type"] || getContentType(pointer.target);
        return {
          target: pointer.target,
          headers,
          contentType,
          status: typeof pointer.status === "number" ? pointer.status : 200,
        };
      }

      throw new Error("Invalid pointer format");
    },

    /**
     * Get info about the router
     * @returns {Object} Router stats
     */
    info() {
      return {
        totalRoutes: Object.keys(routes).length,
        exactRoutes: Object.keys(exact).length,
        dynamicRoutes: Object.keys(dynamic).length,
        matcherStrategy: totalRoutes > ROUTE_THRESHOLD_FOR_TRIE ? "trie" : "hash+regex",
      };
    },
  };
}

export default hashttp;
