import { test } from "node:test";
import assert from "node:assert/strict";
import { parsePattern } from "../src/pattern.js";

test("parses wildcard", () => {
  assert.deepEqual(parsePattern("*"), { raw: "*", isWildcard: true, segments: [] });
});

test("parses static root", () => {
  const result = parsePattern("/");
  assert.equal(result.isWildcard, false);
  assert.deepEqual(result.segments, []);
});

test("parses static segments", () => {
  const result = parsePattern("/articles");
  assert.deepEqual(result.segments, [{ type: "static", value: "articles" }]);
});

test("parses dynamic segments", () => {
  const result = parsePattern("/articles/:slug");
  assert.deepEqual(result.segments, [
    { type: "static", value: "articles" },
    { type: "param", name: "slug" },
  ]);
});

test("parses multiple dynamic segments", () => {
  const result = parsePattern("/users/:id/posts/:postId");
  assert.deepEqual(result.segments, [
    { type: "static", value: "users" },
    { type: "param", name: "id" },
    { type: "static", value: "posts" },
    { type: "param", name: "postId" },
  ]);
});
