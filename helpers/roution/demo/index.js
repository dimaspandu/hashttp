import { createMatcher } from "../src/roution.js";

// Base routes shared by both scenarios. No wildcard is defined here so the
// difference between "without wildcard" and "with wildcard" is easy to observe.
const baseRoutes = {
  "/": "public/index.html",

  "/about": "public/about.html",

  "/articles": "public/articles/index.html",

  "/articles/:slug": "public/articles/[slug].html",

  "/users/:id/posts/:postId": "public/users/[id]/posts/[postId].html",

  "/composed": ["public/header.html", "public/greetings.html", "public/footer.html"],

  "/login": {
    component: "LoginPage",
    auth: false,
  },

  "/dashboard": {
    component: "DashboardPage",
    auth: true,
    layout: "main",
  },

  "/version": "1.0.0",

  "/numbers": [1, 2, 3],

  "/health": () => ({ status: "ok" }),

  "/time": async () => new Date().toISOString(),
};

// Scenario A: no wildcard. Any pathname that does not match an explicit route
// resolves to found: false (route: null, value: null).
const withoutWildcard = { ...baseRoutes };

// Scenario B: with a wildcard. Unmatched pathnames still resolve to
// found: true, but the value comes from the "*" fallback (public/404.html).
const withWildcard = { ...baseRoutes, "*": "public/404.html" };

/*
 * createMatcher accepts an optional second argument to tune behavior.
 * All options are optional and fall back to safe defaults.
 *
 *   // Disable query parsing: result.query is always {}.
 *   createMatcher(routes, { query: false });
 *
 *   // Force a specific matching algorithm instead of "auto".
 *   createMatcher(routes, { strategy: "regex" });
 *   createMatcher(routes, { strategy: "trie" });
 *
 *   // Override when "auto" switches from regex to trie (default 50).
 *   createMatcher(routes, { strategy: "auto", dynamicThreshold: 20 });
 */

const samples = [
  "/",
  "/about",
  "/articles",
  "/articles/javascript?page=1",
  "/users/42/posts/7#comments",
  "/composed",
  "/login",
  "/dashboard",
  "/version",
  "/numbers",
  "/health",
  "/time",
  // The following paths are intentionally unregistered to show the difference
  // between resolving without and with a wildcard fallback.
  "/articles/javascript/extra",
  "/missing/page",
  "/wild/card/path",
  "/not-a-real-page",
];

runScenario('WITHOUT wildcard (unmatched -> found: false)', withoutWildcard);
runScenario('WITH wildcard "*" (unmatched -> found: true, value: public/404.html)', withWildcard);

function runScenario(title, routes) {
  const matcher = createMatcher(routes);

  console.log("=".repeat(70));
  console.log(title);
  console.log("=".repeat(70));
  console.log("Route collection:");
  console.log(JSON.stringify(Object.keys(routes), null, 2));
  console.log("\nMatch samples:\n");

  for (const pathname of samples) {
    const result = matcher.match(pathname);
    console.log(`pathname: ${pathname}`);
    console.log(`  found:    ${result.found}`);
    console.log(`  route:    ${result.route}`);
    console.log(`  pathname: ${result.pathname}`);
    console.log(`  params:   ${JSON.stringify(result.params)}`);
    console.log(`  query:    ${JSON.stringify(result.query)}`);
    console.log(`  value:    ${formatValue(result.value)}`);
    console.log("");
  }
}

function formatValue(value) {
  if (typeof value === "function") {
    return `[Function ${value.name || "anonymous"}]`;
  }
  if (typeof value === "object" && value !== null) {
    return JSON.stringify(value);
  }
  return String(value);
}
