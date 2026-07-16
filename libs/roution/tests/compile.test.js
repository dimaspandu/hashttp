import { test } from "node:test";
import assert from "node:assert/strict";
import { compile } from "../src/compile.js";

test("classifies root as static", () => {
  const compiled = compile({ "/": "index" });
  assert.equal(compiled.staticRoutes.get("/").value, "index");
  assert.equal(compiled.dynamicRoutes.length, 0);
});

test("classifies static routes", () => {
  const compiled = compile({ "/articles": "a", "/about": "b" });
  assert.equal(compiled.staticRoutes.size, 2);
  assert.equal(compiled.staticRoutes.get("/about").value, "b");
});

test("classifies dynamic routes", () => {
  const compiled = compile({ "/articles/:slug": "a" });
  assert.equal(compiled.staticRoutes.size, 0);
  assert.equal(compiled.dynamicRoutes.length, 1);
  assert.deepEqual(compiled.dynamicRoutes[0].paramNames, ["slug"]);
});

test("classifies wildcard", () => {
  const compiled = compile({ "*": "fallback" });
  assert.equal(compiled.wildcard.value, "fallback");
});

test("classifies mixed collection", () => {
  const compiled = compile({
    "/": "home",
    "/articles/:slug": "dynamic",
    "*": "fallback",
  });
  assert.equal(compiled.staticRoutes.size, 1);
  assert.equal(compiled.dynamicRoutes.length, 1);
  assert.equal(compiled.wildcard.value, "fallback");
});
