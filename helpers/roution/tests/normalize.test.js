import { test } from "node:test";
import assert from "node:assert/strict";
import { normalizePathname, splitSegments, parseQuery } from "../src/normalize.js";

test("strips query string", () => {
  assert.equal(normalizePathname("/articles?page=1"), "/articles");
});

test("strips url fragment", () => {
  assert.equal(normalizePathname("/articles#comments"), "/articles");
});

test("strips both query and fragment", () => {
  assert.equal(normalizePathname("/articles?page=1&perPage=10#comments"), "/articles");
});

test("returns path untouched when no query or fragment", () => {
  assert.equal(normalizePathname("/articles/javascript"), "/articles/javascript");
});

test("converts null/undefined to empty string", () => {
  assert.equal(normalizePathname(null), "");
  assert.equal(normalizePathname(undefined), "");
});

test("coerces non-string input to string", () => {
  assert.equal(normalizePathname(123), "123");
});

test("splitSegments ignores leading and trailing slashes", () => {
  assert.deepEqual(splitSegments("/a/b/c/"), ["a", "b", "c"]);
});

test("splitSegments returns empty array for root", () => {
  assert.deepEqual(splitSegments("/"), []);
});

test("parseQuery returns empty object without query string", () => {
  assert.deepEqual(parseQuery("/articles"), {});
});

test("parseQuery returns empty object for empty query", () => {
  assert.deepEqual(parseQuery("/articles?"), {});
});

test("parseQuery parses single key as string", () => {
  assert.deepEqual(parseQuery("/articles?page=1"), { page: "1" });
});

test("parseQuery parses multiple keys", () => {
  assert.deepEqual(parseQuery("/articles?page=1&perPage=10"), {
    page: "1",
    perPage: "10",
  });
});

test("parseQuery collects repeated keys into an array", () => {
  assert.deepEqual(parseQuery("/search?tag=a&tag=b"), { tag: ["a", "b"] });
});

test("parseQuery ignores the url fragment", () => {
  assert.deepEqual(parseQuery("/articles?page=1#top"), { page: "1" });
});

test("parseQuery decodes url-encoded values", () => {
  assert.deepEqual(parseQuery("/search?q=hello%20world"), { q: "hello world" });
});
