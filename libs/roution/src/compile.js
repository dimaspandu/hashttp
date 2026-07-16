import { parsePattern } from "./pattern.js";

/**
 * @typedef {Object} CompiledRoutes
 * @property {Map<string, {route: string, value: any}>} staticRoutes - Routes with only literal segments, keyed by pattern.
 * @property {Array<{route: string, value: any, segments: import("./pattern.js").PatternSegment[], paramNames: string[]}>} dynamicRoutes - Routes containing parameters, in definition order.
 * @property {{route: string, value: any} | null} wildcard - The optional "*" fallback route.
 */

/**
 * @typedef {Object} MatchResult
 * @property {boolean} found - Whether a route was matched.
 * @property {string} pathname - The normalized pathname that was matched against.
 * @property {string | null} route - The matched route pattern, or null when not found.
 * @property {Object<string, string>} params - Extracted route parameters.
 * @property {Object<string, string | string[]>} query - Parsed query string parameters.
 * @property {any} value - The opaque value associated with the matched route.
 */

/**
 * @typedef {Object} MatchStrategy
 * @property {(pathname: string) => MatchResult} match - Resolve a pathname to a match result.
 */

/**
 * Compile route definitions into an internal, reusable representation.
 *
 * Routes are partitioned into static routes (exact string lookup), dynamic
 * routes (segments containing parameters), and an optional wildcard fallback.
 * Compilation happens once; the resulting object is reused for every match.
 *
 * @param {Object<string, any>} routes - Map of pattern strings to opaque values.
 * @returns {CompiledRoutes} The compiled route collection.
 */
export function compile(routes) {
  const staticRoutes = new Map();
  const dynamicRoutes = [];
  let wildcard = null;

  for (const [pattern, value] of Object.entries(routes)) {
    const parsed = parsePattern(pattern);

    if (parsed.isWildcard) {
      wildcard = { route: pattern, value };
      continue;
    }

    const onlyStatic = parsed.segments.every((segment) => segment.type === "static");

    if (onlyStatic) {
      staticRoutes.set(parsed.raw, { route: pattern, value });
      continue;
    }

    dynamicRoutes.push({
      route: pattern,
      value,
      segments: parsed.segments,
      paramNames: parsed.segments
        .filter((segment) => segment.type === "param")
        .map((segment) => segment.name),
    });
  }

  return { staticRoutes, dynamicRoutes, wildcard };
}
