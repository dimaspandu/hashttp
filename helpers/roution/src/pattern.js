/**
 * @typedef {"static" | "param"} SegmentType
 */

/**
 * @typedef {Object} PatternSegment
 * @property {SegmentType} type - Whether the segment is a literal or a parameter.
 * @property {string} [value] - The literal value when type is "static".
 * @property {string} [name] - The parameter name when type is "param".
 */

/**
 * Parse a route pattern into structured segments.
 *
 * The wildcard pattern "*" is recognized as a standalone fallback route.
 * Static segments become { type: "static", value } and ":name" segments
 * become { type: "param", name }.
 *
 * @param {string} pattern - The route pattern, e.g. "/articles/:slug".
 * @returns {{raw: string, isWildcard: boolean, segments: PatternSegment[]}} The parsed pattern.
 */
export function parsePattern(pattern) {
  if (pattern === "*") {
    return { raw: pattern, isWildcard: true, segments: [] };
  }

  const segments = pattern
    .split("/")
    .filter((segment) => segment !== "")
    .map((segment) => {
      if (segment.startsWith(":")) {
        return { type: "param", name: segment.slice(1) };
      }
      return { type: "static", value: segment };
    });

  return { raw: pattern, isWildcard: false, segments };
}
