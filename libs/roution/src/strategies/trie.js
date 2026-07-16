import { normalizePathname, splitSegments, parseQuery } from "../normalize.js";
import { parsePattern } from "../pattern.js";

/**
 * @typedef {Object} TrieNode
 * @property {Map<string, TrieNode>} staticChildren - Child nodes indexed by literal segment.
 * @property {{name: string, node: TrieNode} | null} paramChild - Optional single parameter child for this level.
 * @property {{route: string, value: any} | null} terminal - The route stored at this node when a pattern ends here.
 * @property {{route: string, value: any} | null} wildcard - The optional "*" fallback route, only set on the root node.
 */

/**
 * Create an empty trie node.
 *
 * @returns {TrieNode} A fresh, unpopulated trie node.
 */
function createNode() {
  return {
    staticChildren: new Map(),
    paramChild: null,
    terminal: null,
    wildcard: null,
  };
}

/**
 * Insert a route entry into the trie.
 *
 * Pattern segments are walked one level per segment. Static segments descend
 * into staticChildren; ":name" segments descend into paramChild. When the
 * segments are exhausted, the route is stored as a terminal on the final node.
 *
 * @param {TrieNode} root - The trie root node.
 * @param {import("../pattern.js").PatternSegment[]} segments - Parsed pattern segments.
 * @param {{route: string, value: any}} entry - The route pattern and its opaque value.
 * @returns {void}
 */
function insert(root, segments, entry) {
  let node = root;
  for (const segment of segments) {
    if (segment.type === "param") {
      if (!node.paramChild) {
        node.paramChild = { name: segment.name, node: createNode() };
      }
      node = node.paramChild.node;
      continue;
    }
    let child = node.staticChildren.get(segment.value);
    if (!child) {
      child = createNode();
      node.staticChildren.set(segment.value, child);
    }
    node = child;
  }
  node.terminal = entry;
}

/**
 * Build a path trie from a compiled route collection.
 *
 * Static and dynamic routes share the same trie. The wildcard route, when
 * present, is attached to the root node as a global fallback.
 *
 * @param {import("../compile.js").CompiledRoutes} compiled - The compiled route collection.
 * @returns {TrieNode} The root trie node.
 */
function buildTrie(compiled) {
  const root = createNode();
  if (compiled.wildcard) {
    root.wildcard = compiled.wildcard;
  }

  for (const [raw, entry] of compiled.staticRoutes) {
    insert(root, parsePattern(raw).segments, entry);
  }
  for (const route of compiled.dynamicRoutes) {
    insert(root, route.segments, { route: route.route, value: route.value });
  }

  return root;
}

/**
 * Walk the trie for a list of segments and return the first match.
 *
 * Static children are preferred over the parameter child, so literal routes
 * always win over dynamic routes at the same level. The wildcard fallback is
 * not consulted here; it is applied by the caller when no terminal is found.
 *
 * @param {TrieNode} root - The trie root node.
 * @param {string[]} segments - The normalized pathname segments.
 * @returns {{terminal: {route: string, value: any}, params: Object<string, string>} | null} The match, or null when none.
 */
function matchTrie(root, segments) {
  let node = root;
  const params = {};

  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];
    const child = node.staticChildren.get(segment);
    if (child) {
      node = child;
      continue;
    }
    if (node.paramChild) {
      params[node.paramChild.name] = decodeURIComponent(segment);
      node = node.paramChild.node;
      continue;
    }
    return null;
  }

  if (node.terminal) {
    return { terminal: node.terminal, params };
  }
  return null;
}

/**
 * Create a matcher strategy backed by a path trie.
 *
 * Suitable for collections with a large number of routes, where a single trie
 * traversal scales better than scanning regular expressions. Static and
 * dynamic routes live in the same trie; an optional wildcard is the fallback.
 *
 * @param {import("../compile.js").CompiledRoutes} compiled - The compiled route collection.
 * @param {boolean} [includeQuery] - When true, parse the query string into the result.
 * @returns {import("../compile.js").MatchStrategy} A strategy exposing a match method.
 */
export function createTrieStrategy(compiled, includeQuery = true) {
  const root = buildTrie(compiled);

  return {
    match(pathname) {
      const normalized = normalizePathname(pathname);
      const query = includeQuery ? parseQuery(pathname) : {};
      const segments = splitSegments(normalized);

      const matched = matchTrie(root, segments);
      if (matched) {
        return {
          found: true,
          pathname: normalized,
          route: matched.terminal.route,
          params: matched.params,
          query,
          value: matched.terminal.value,
        };
      }

      if (root.wildcard) {
        return {
          found: true,
          pathname: normalized,
          route: root.wildcard.route,
          params: {},
          query,
          value: root.wildcard.value,
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
