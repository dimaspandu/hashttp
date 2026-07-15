import { test } from "node:test";
import assert from "node:assert/strict";
import { compile } from "../src/compile.js";
import { selectStrategy, DYNAMIC_ROUTE_THRESHOLD } from "../src/strategy.js";

function routesWithDynamic(count) {
  const routes = { "*": "404" };
  for (let i = 0; i < count; i++) {
    routes[`/item/${i}/:slug`] = i;
  }
  return routes;
}

test("selects regex strategy below the threshold", () => {
  const compiled = compile(routesWithDynamic(DYNAMIC_ROUTE_THRESHOLD - 1));
  const strategy = selectStrategy(compiled);
  assert.equal(strategy.match("/item/0/a").route, "/item/0/:slug");
});

test("selects trie strategy at or above the threshold", () => {
  const compiled = compile(routesWithDynamic(DYNAMIC_ROUTE_THRESHOLD));
  const strategy = selectStrategy(compiled);
  assert.equal(strategy.match("/item/0/a").route, "/item/0/:slug");
});

test("both strategies resolve identically near the threshold", () => {
  const compiledLow = compile(routesWithDynamic(DYNAMIC_ROUTE_THRESHOLD - 1));
  const compiledHigh = compile(routesWithDynamic(DYNAMIC_ROUTE_THRESHOLD));
  const low = selectStrategy(compiledLow);
  const high = selectStrategy(compiledHigh);

  for (let i = 0; i < 5; i++) {
    const path = `/item/${i}/slug-${i}`;
    assert.deepEqual(low.match(path), high.match(path));
  }
});

test("explicit regex strategy is honored", () => {
  const compiled = compile(routesWithDynamic(DYNAMIC_ROUTE_THRESHOLD));
  const strategy = selectStrategy(compiled, { strategy: "regex" });
  assert.equal(strategy.match("/item/0/a").route, "/item/0/:slug");
});

test("explicit trie strategy is honored", () => {
  const compiled = compile(routesWithDynamic(DYNAMIC_ROUTE_THRESHOLD - 1));
  const strategy = selectStrategy(compiled, { strategy: "trie" });
  assert.equal(strategy.match("/item/0/a").route, "/item/0/:slug");
});

test("auto honors a custom dynamicThreshold", () => {
  const compiled = compile(routesWithDynamic(3));
  const strategy = selectStrategy(compiled, { strategy: "auto", dynamicThreshold: 3 });
  assert.equal(strategy.match("/item/0/a").route, "/item/0/:slug");
});

test("includeQuery false yields an empty query object", () => {
  const compiled = compile({ "/a": "v" });
  const strategy = selectStrategy(compiled, { query: false });
  assert.deepEqual(strategy.match("/a?x=1").query, {});
});

test("includeQuery true parses the query", () => {
  const compiled = compile({ "/a": "v" });
  const strategy = selectStrategy(compiled, { query: true });
  assert.deepEqual(strategy.match("/a?x=1").query, { x: "1" });
});
