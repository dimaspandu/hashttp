/**
 * Normalize an incoming pathname by removing the URL fragment and query string.
 *
 * All characters after the first "#" or "?" are discarded. No other
 * transformation is applied, so the result remains a raw pathname.
 *
 * @param {unknown} input - The incoming pathname, URL, or any value coercible to string.
 * @returns {string} The normalized pathname without query string or fragment.
 */
export function normalizePathname(input) {
  if (input == null) {
    return "";
  }

  let path = String(input);

  const hashIndex = path.indexOf("#");
  if (hashIndex !== -1) {
    path = path.slice(0, hashIndex);
  }

  const queryIndex = path.indexOf("?");
  if (queryIndex !== -1) {
    path = path.slice(0, queryIndex);
  }

  return path;
}

/**
 * Parse the query string of an incoming pathname into an object.
 *
 * The leading "?" is optional. Values are kept as strings (standard HTTP
 * semantics). When a key appears more than once, its values are collected
 * into an array. URL encoding is decoded automatically. If there is no query
 * string, an empty object is returned. The URL fragment is ignored.
 *
 * @param {unknown} input - The incoming pathname or URL.
 * @returns {Object<string, string | string[]>} The parsed query parameters.
 */
export function parseQuery(input) {
  if (input == null) {
    return {};
  }

  let path = String(input);

  const hashIndex = path.indexOf("#");
  if (hashIndex !== -1) {
    path = path.slice(0, hashIndex);
  }

  const queryIndex = path.indexOf("?");
  if (queryIndex === -1) {
    return {};
  }

  const queryString = path.slice(queryIndex + 1);
  if (queryString === "") {
    return {};
  }

  const params = new URLSearchParams(queryString);
  const result = {};

  for (const key of new Set(params.keys())) {
    const values = params.getAll(key);
    result[key] = values.length > 1 ? values : values[0];
  }

  return result;
}

/**
 * Split a pathname into its non-empty segments.
 *
 * Leading and trailing slashes are ignored, so "/a/b/c/" yields ["a", "b", "c"]
 * and "/" yields [].
 *
 * @param {string} pathname - The normalized pathname to split.
 * @returns {string[]} The list of path segments in order.
 */
export function splitSegments(pathname) {
  return pathname.split("/").filter((segment) => segment !== "");
}
