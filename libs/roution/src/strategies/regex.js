import { normalizePathname, splitSegments, parseQuery } from "../normalize.js";

/**
 * Build a regular expression for a single dynamic route.
 *
 * Each static segment becomes a literal (with regex-special characters
 * escaped); each ":name" segment becomes a capturing group. The pattern is
 * anchored with "^" and "$".
 *
 * @param {{route: string, segments: import("../pattern.js").PatternSegment[]}} route - The compiled dynamic route.
 * @returns {RegExp} The anchored regular expression.
 */
function buildRegex(route) {
  const pattern =
    "^/" +
    route.segments
      .map((segment) => {
        if (segment.type === "static") {
          return segment.value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        }
        return "([^/]+)";
      })
      .join("/") +
    "$";
  return new RegExp(pattern);
}

/**
 * Create a matcher strategy backed by regular expressions.
 *
 * Suitable for collections with a moderate number of dynamic routes. Static
 * routes use an exact Map lookup, dynamic routes use precompiled regular
 * expressions, and an optional wildcard is used as a fallback.
 *
 * @param {import("../compile.js").CompiledRoutes} compiled - The compiled route collection.
 * @param {boolean} [includeQuery] - When true, parse the query string into the result.
 * @returns {import("../compile.js").MatchStrategy} A strategy exposing a match method.
 */
export function createRegexStrategy(compiled, includeQuery = true) {
  const regexRoutes = compiled.dynamicRoutes.map((route) => ({
    regex: buildRegex(route),
    paramNames: route.paramNames,
    route: route.route,
    value: route.value,
  }));

  return {
    match(pathname) {
      const normalized = normalizePathname(pathname);
      const query = includeQuery ? parseQuery(pathname) : {};

      const staticHit = compiled.staticRoutes.get(normalized);
      if (staticHit) {
        return {
          found: true,
          pathname: normalized,
          route: staticHit.route,
          params: {},
          query,
          value: staticHit.value,
        };
      }

      const segments = splitSegments(normalized);
      const reconstructed = "/" + segments.join("/");

      for (const entry of regexRoutes) {
        const match = entry.regex.exec(reconstructed);
        if (match) {
          const params = {};
          entry.paramNames.forEach((name, index) => {
            params[name] = decodeURIComponent(match[index + 1]);
          });
          return {
            found: true,
            pathname: normalized,
            route: entry.route,
            params,
            query,
            value: entry.value,
          };
        }
      }

      if (compiled.wildcard) {
        return {
          found: true,
          pathname: normalized,
          route: compiled.wildcard.route,
          params: {},
          query,
          value: compiled.wildcard.value,
        };
      }

      return {
        found: false,
        pathname: normalized,
        route: null,
        params: {},
        query,
        value: null,
      };
    },
  };
}
