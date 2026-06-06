/**
 * Unit tests for matchers and integration
 * Run with: node test/matcher.test.js
 */

import { createHashMatcher } from "../src/matcher/hash.js";
import { createRegexMatcher, templateToRegex } from "../src/matcher/regex.js";
import { createTrieMatcher } from "../src/matcher/trie.js";
import { getContentType } from "../src/contentType.js";
import hashttp from "../src/index.js";

let testsPassed = 0;
let testsFailed = 0;

function assert(condition, message) {
  if (!condition) {
    console.error(`✗ FAIL: ${message}`);
    testsFailed++;
  } else {
    console.log(`✓ PASS: ${message}`);
    testsPassed++;
  }
}

function assertEquals(actual, expected, message) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    console.error(`✗ FAIL: ${message}`);
    console.error(`  Expected: ${JSON.stringify(expected)}`);
    console.error(`  Got: ${JSON.stringify(actual)}`);
    testsFailed++;
  } else {
    console.log(`✓ PASS: ${message}`);
    testsPassed++;
  }
}

console.log("\n=== Hash Matcher Tests ===\n");

const hashMatcher = createHashMatcher({
  "/": "index.html",
  "/about": "about.html",
  "/contact": "contact.html",
});

assertEquals(hashMatcher.match("/"), { routeKey: "/", pointer: "index.html", params: {} }, "Hash matcher: exact match root");
assertEquals(hashMatcher.match("/about"), { routeKey: "/about", pointer: "about.html", params: {} }, "Hash matcher: exact match /about");
assert(hashMatcher.match("/notfound") === null, "Hash matcher: no match returns null");

console.log("\n=== Regex Matcher Tests ===\n");

const regexMatcher = createRegexMatcher({
  "/articles/:slug": "articles/[slug].html",
  "/users/:id/posts/:postId": "users/[id]/posts/[postId].html",
});

const match1 = regexMatcher.match("/articles/hello-world");
assertEquals(match1?.params, { slug: "hello-world" }, "Regex matcher: capture single param");
assertEquals(match1?.routeKey, "/articles/:slug", "Regex matcher: correct route key");

const match2 = regexMatcher.match("/users/123/posts/456");
assertEquals(match2?.params, { id: "123", postId: "456" }, "Regex matcher: capture multiple params");

assert(regexMatcher.match("/articles") === null, "Regex matcher: no match for incomplete path");

console.log("\n=== Template to Regex Tests ===\n");

const { regex: r1, paramNames: p1 } = templateToRegex("/articles/:slug");
assertEquals(p1, ["slug"], "templateToRegex: extract single param name");
assert("/articles/test".match(r1) !== null, "templateToRegex: matches valid path");
assert("/articles".match(r1) === null, "templateToRegex: rejects incomplete path");

console.log("\n=== Content-Type Detection ===\n");

assertEquals(getContentType("file.html"), "text/html; charset=utf-8", "Content-Type: HTML");
assertEquals(getContentType("style.css"), "text/css; charset=utf-8", "Content-Type: CSS");
assertEquals(getContentType("script.js"), "application/javascript; charset=utf-8", "Content-Type: JS");
assertEquals(getContentType("image.png"), "image/png", "Content-Type: PNG");
assertEquals(getContentType("file.unknown"), "application/octet-stream", "Content-Type: fallback");

console.log("\n=== Hashttp Integration Tests ===\n");

const router = hashttp(
  {
    "/": "index.html",
    "/articles": "articles.html",
    "/articles/:slug": "articles/[slug].html",
    "/style.css": "assets/css/style.css",
    "/api": {
      target: "api.handler",
      headers: { "Content-Type": "application/json" },
    },
    "*": { target: "404.html", status: 404 },
  }
);

const m1 = router.match("/");
assertEquals(m1?.routeKey, "/", "Integration: match root");

const m2 = router.match("/articles");
assertEquals(m2?.routeKey, "/articles", "Integration: match exact /articles");

const m3 = router.match("/articles/hello-world");
assertEquals(m3?.params, { slug: "hello-world" }, "Integration: match dynamic route");

const m4 = router.match("/notfound");
assertEquals(m4?.routeKey, "*", "Integration: fallback to *");
const resolvedFallback = router.resolve(m4?.pointer);
assertEquals(resolvedFallback.status, 404, "Integration: resolve fallback status 404");

const resolved = router.resolve("index.html");
assertEquals(resolved.contentType, "text/html; charset=utf-8", "Integration: resolve content-type");

const resolvedObj = router.resolve({
  target: "api.handler",
  headers: { "Content-Type": "application/json" },
});
assertEquals(resolvedObj.contentType, "application/json", "Integration: resolve with explicit headers");

const folderRouter = hashttp({
  "/docs": { target: "docs", folder: true },
});
const folderMatch1 = folderRouter.match("/docs");
assertEquals(folderMatch1?.routeKey, "/docs", "Folder route: match /docs");
assertEquals(folderMatch1?.params, { tail: "" }, "Folder route: empty tail for root");
assertEquals(folderRouter.resolve(folderMatch1.pointer).folder, true, "Folder route: resolve preserves folder flag");
const folderMatch2 = folderRouter.match("/docs/version.md");
assertEquals(folderMatch2?.routeKey, "/docs", "Folder route: prefix match /docs/version.md");
assertEquals(folderMatch2?.params, { tail: "/version.md" }, "Folder route: capture tail path");

console.log("\n=== Router Info ===\n");
const info = router.info();
console.log(`Total routes: ${info.totalRoutes}`);
console.log(`Exact routes: ${info.exactRoutes}`);
console.log(`Dynamic routes: ${info.dynamicRoutes}`);
console.log(`Matcher strategy: ${info.matcherStrategy}`);

console.log(`\n=== Test Summary ===\nPassed: ${testsPassed}\nFailed: ${testsFailed}\n`);

if (testsFailed > 0) {
  process.exit(1);
}
