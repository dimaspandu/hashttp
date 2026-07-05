/**
 * Unit tests for matchers and integration
 * Run with: node test/matcher.test.js
 */

import { createHashMatcher } from "../src/matcher/hash.js";
import { createRegexMatcher, templateToRegex } from "../src/matcher/regex.js";
import { createTrieMatcher } from "../src/matcher/trie.js";
import { getContentType } from "../src/contentType.js";
import hashttp, { renderTemplate, hasPlaceholders, compose } from "../src/index.js";
import fs from "fs/promises";
import path from "path";

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

console.log("\n=== Template Engine Tests ===\n");

assertEquals(renderTemplate("Hello {{name}}!", { name: "World" }), "Hello World!", "Template: simple replacement");
assertEquals(renderTemplate("{{greeting}} {{name}}!", { greeting: "Hi", name: "John" }), "Hi John!", "Template: multiple replacements");
assertEquals(renderTemplate("No placeholders here", {}), "No placeholders here", "Template: no placeholders unchanged");
assertEquals(renderTemplate("Missing {{key}} stays empty", {}), "Missing  stays empty", "Template: missing key renders empty");
assertEquals(renderTemplate("Nested: {{user.name}}", { user: { name: "Alice" } }), "Nested: Alice", "Template: nested value with dot notation");
assertEquals(renderTemplate("Deep: {{a.b.c}}", { a: { b: { c: "deep value" } } }), "Deep: deep value", "Template: deeply nested value");
assert(hasPlaceholders("Hello {{name}}"), "Template: hasPlaceholders detects {{...}}");
assert(!hasPlaceholders("No placeholders"), "Template: hasPlaceholders returns false for no placeholders");

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

const dataRouter = hashttp({
  "/template": { target: "template.html", data: { title: "Test Page" } },
  "/model": { target: "model.html", model: { name: "Alice" } },
});
const resolvedData = dataRouter.resolve(dataRouter.match("/template").pointer);
assertEquals(resolvedData.data, { title: "Test Page" }, "Integration: resolve route with data property");
const resolvedModel = dataRouter.resolve(dataRouter.match("/model").pointer);
assertEquals(resolvedModel.data, { name: "Alice" }, "Integration: resolve route with model property");

const composedRouter = hashttp({
  "/composed": { target: ["header.html", "footer.html"], data: { title: "Test", message: "World" } },
});
const resolvedComposed = composedRouter.resolve(composedRouter.match("/composed").pointer);
assertEquals(Array.isArray(resolvedComposed.target), true, "Integration: composed route has array target");
assertEquals(resolvedComposed.isComposed, true, "Integration: composed route flag set");

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
