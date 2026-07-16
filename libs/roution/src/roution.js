import { compile } from "./compile.js";
import { selectStrategy, DYNAMIC_ROUTE_THRESHOLD } from "./strategy.js";

/**
 * Create a reusable matcher from route definitions.
 *
 * Route definitions are compiled once. The matching strategy (regex or trie)
 * is selected automatically based on the compiled collection unless overridden
 * through options. The public API and matching behavior stay the same either
 * way.
 *
 * @param {Object<string, any>} routes - Map of pattern strings to opaque values.
 * @param {import("./strategy.js").MatcherOptions} [options] - Optional configuration.
 * @returns {import("./compile.js").MatchStrategy} The matcher instance exposing a match method.
 * @throws {TypeError} If routes is not a non-null plain object.
 */
export function createMatcher(routes, options = {}) {
  if (routes == null || typeof routes !== "object" || Array.isArray(routes)) {
    throw new TypeError("createMatcher expects a non-null object of route definitions");
  }

  const {
    query = true,
    strategy = "auto",
    dynamicThreshold = DYNAMIC_ROUTE_THRESHOLD,
  } = options;

  const compiled = compile(routes);
  const matcherStrategy = selectStrategy(compiled, {
    query,
    strategy,
    dynamicThreshold,
  });

  return {
    match(pathname) {
      return matcherStrategy.match(pathname);
    },
  };
}

export default createMatcher;
