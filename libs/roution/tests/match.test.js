import { test } from "node:test";
import assert from "node:assert/strict";
import { compile } from "../src/compile.js";
import { createRegexStrategy } from "../src/strategies/regex.js";
import { createTrieStrategy } from "../src/strategies/trie.js";

/**
 * Build both matching strategies for the same route collection so every
 * assertion can be verified against the regex and trie implementations.
 *
 * @param {Object<string, any>} routes - Map of pattern strings to opaque values.
 * @returns {import("../src/compile.js").MatchStrategy[]} The regex and trie strategies.
 */
function buildStrategies(routes) {
  const compiled = compile(routes);
  return [createRegexStrategy(compiled), createTrieStrategy(compiled)];
}

for (const [name, strategyFactory] of [
  ["regex", createRegexStrategy],
  ["trie", createTrieStrategy],
]) {
  test(`[${name}] matches static root`, () => {
    const [strategy] = buildStrategies({ "/": "home" });
    const result = strategy.match("/");
    assert.equal(result.found, true);
    assert.equal(result.value, "home");
    assert.deepEqual(result.params, {});
  });

  test(`[${name}] matches static route`, () => {
    const [strategy] = buildStrategies({ "/about": "about" });
    const result = strategy.match("/about");
    assert.equal(result.found, true);
    assert.equal(result.route, "/about");
  });

  test(`[${name}] matches dynamic route and extracts params`, () => {
    const [strategy] = buildStrategies({ "/articles/:slug": "page" });
    const result = strategy.match("/articles/javascript");
    assert.equal(result.found, true);
    assert.equal(result.route, "/articles/:slug");
    assert.deepEqual(result.params, { slug: "javascript" });
  });

  test(`[${name}] returns not found when no route matches`, () => {
    const [strategy] = buildStrategies({ "/about": "about" });
    const result = strategy.match("/missing");
    assert.equal(result.found, false);
    assert.equal(result.route, null);
    assert.equal(result.value, null);
  });

  test(`[${name}] falls back to wildcard`, () => {
    const [strategy] = buildStrategies({ "*": "404" });
    const result = strategy.match("/articles/javascript");
    assert.equal(result.found, true);
    assert.equal(result.route, "*");
    assert.equal(result.value, "404");
  });

  test(`[${name}] static takes priority over wildcard`, () => {
    const [strategy] = buildStrategies({ "/about": "about", "*": "404" });
    const result = strategy.match("/about");
    assert.equal(result.value, "about");
  });

  test(`[${name}] dynamic takes priority over wildcard`, () => {
    const [strategy] = buildStrategies({ "/articles/:slug": "page", "*": "404" });
    const result = strategy.match("/articles/javascript");
    assert.equal(result.value, "page");
  });

  test(`[${name}] normalizes query string before matching`, () => {
    const [strategy] = buildStrategies({ "/articles/:slug": "page" });
    const result = strategy.match("/articles/javascript?page=1");
    assert.equal(result.found, true);
    assert.equal(result.pathname, "/articles/javascript");
  });

  test(`[${name}] parses query into the result`, () => {
    const [strategy] = buildStrategies({ "/articles/:slug": "page" });
    const result = strategy.match("/articles/javascript?page=1&perPage=10");
    assert.deepEqual(result.query, { page: "1", perPage: "10" });
    assert.deepEqual(result.params, { slug: "javascript" });
  });

  test(`[${name}] returns empty query when none present`, () => {
    const [strategy] = buildStrategies({ "/about": "about" });
    const result = strategy.match("/about");
    assert.deepEqual(result.query, {});
  });

  test(`[${name}] collects repeated query keys into an array`, () => {
    const [strategy] = buildStrategies({ "/search": "s" });
    const result = strategy.match("/search?tag=a&tag=b");
    assert.deepEqual(result.query, { tag: ["a", "b"] });
  });

  test(`[${name}] normalizes fragment before matching`, () => {
    const [strategy] = buildStrategies({ "/articles": "page" });
    const result = strategy.match("/articles#section");
    assert.equal(result.found, true);
    assert.equal(result.pathname, "/articles");
  });

  test(`[${name}] decodes url-encoded params`, () => {
    const [strategy] = buildStrategies({ "/files/:name": "file" });
    const result = strategy.match("/files/hello%20world");
    assert.deepEqual(result.params, { name: "hello world" });
  });

  test(`[${name}] segment count must match for dynamic routes`, () => {
    const [strategy] = buildStrategies({ "/users/:id": "u" });
    const result = strategy.match("/users/1/posts");
    assert.equal(result.found, false);
  });

  test(`[${name}] returns composed array value untouched`, () => {
    const value = ["a", "b", "c"];
    const [strategy] = buildStrategies({ "/composed": value });
    const result = strategy.match("/composed");
    assert.equal(result.value, value);
  });

  test(`[${name}] static takes priority over dynamic at same level`, () => {
    const [strategy] = buildStrategies({
      "/users/admin": "admin",
      "/users/:id": "user",
    });
    const result = strategy.match("/users/admin");
    assert.equal(result.route, "/users/admin");
    assert.deepEqual(result.params, {});
  });
}
