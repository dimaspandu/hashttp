import { createRegexStrategy } from "./strategies/regex.js";
import { createTrieStrategy } from "./strategies/trie.js";

/**
 * Number of dynamic routes at or above which the trie strategy is selected
 * over the regex strategy when the strategy is set to "auto". Considered an
 * implementation detail.
 *
 * @type {number}
 */
export const DYNAMIC_ROUTE_THRESHOLD = 50;

/**
 * @typedef {"auto" | "regex" | "trie"} StrategyName
 */

/**
 * @typedef {Object} MatcherOptions
 * @property {boolean} [query] - When true (default), include the parsed query in the result.
 * @property {StrategyName} [strategy] - Matching strategy: "auto" (default), "regex", or "trie".
 * @property {number} [dynamicThreshold] - Dynamic route count at/above which "auto" selects trie.
 */

/**
 * Select the most appropriate matching strategy for a compiled collection.
 *
 * When strategy is "auto" (the default), the decision is automatic and based
 * on the number of dynamic routes: a small collection uses the regex strategy
 * and a large collection uses the trie strategy. The explicit "regex" and
 * "trie" values bypass the automatic decision. The public API and matching
 * behavior remain identical regardless of the chosen strategy.
 *
 * @param {import("./compile.js").CompiledRoutes} compiled - The compiled route collection.
 * @param {MatcherOptions} [options] - Optional matcher configuration.
 * @returns {import("./compile.js").MatchStrategy} The selected strategy.
 */
export function selectStrategy(compiled, options = {}) {
  const {
    strategy = "auto",
    dynamicThreshold = DYNAMIC_ROUTE_THRESHOLD,
    query: includeQuery = true,
  } = options;

  let factory;
  if (strategy === "trie") {
    factory = createTrieStrategy;
  } else if (strategy === "regex") {
    factory = createRegexStrategy;
  } else {
    factory =
      compiled.dynamicRoutes.length >= dynamicThreshold
        ? createTrieStrategy
        : createRegexStrategy;
  }

  return factory(compiled, includeQuery);
}
