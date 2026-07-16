# Changelog

All notable changes to this project will be documented in this file.

## [1.0.9] - 2026-07-16
### Changed
- Extracted the hashttp serving engine into `src/hashttp.js` (`createServerFromRoutes`) and moved the route matcher to `libs/roution`.
- Simplified `demo/server.js` to route definitions plus a single `createServerFromRoutes(routes)` call.
- Renamed the template data property from `struct` to `model` (object or `(params) => object` factory) across the engine, demo, and docs.
- Updated README structure and usage to reflect the engine/library split.

## [1.0.8] - 2026-07-15
### Changed
- Restructured the demo to run on the `roution` matcher (`helpers/roution`) instead of the removed `src/` library.
- Reworked `demo/server.js` resolution order: serve static files first, then match routes, then fall back to `404.html`.
- Replaced the `data` template property with `struct` (object or `(params) => object` factory) for template data injection.
- Tidied `demo/public`: removed unrouted files (`docs/`, `storage/`, `render-template.html`) and static article files that shadowed the dynamic `/articles/:slug` route.
- Updated `README.md` to describe the current structure, `struct` templating, and the static-first resolution flow.

### Added
- Page composition entries can carry their own per-chunk `struct`.

## [1.0.7] - 2026-07-05
### Added
- Page composition feature with array target support
- `compose()` utility function for combining multiple templates/files

## [1.0.6] - 2026-07-05
### Added
- Built-in template engine with `{{placeholder}}` syntax
- Dot notation support for nested values (e.g., `{{user.name}}`)
- Route `data` and `model` properties for template data injection
- `render(content, data)` method on router instance
- `hasPlaceholders(content)` utility function

## [1.0.5] - 2026-06-06
### Changed
- Simplified demo server to serve `demo/public` first, then fall back to dynamic routes and `*`.
- Updated README to describe the new demo behavior.
- Kept dynamic `/articles/:slug` and `/storage/:file` routes as router-only fallbacks.

## [1.0.5] - 2026-06-06
### Fixed
- Demo: serve extensionless paths by trying `<path>.html` before other checks (e.g., `/articles` → `public/articles.html`).


## [1.0.3] - 2026-06-06
### Changed
- Added explanatory comment for the unmatched-route guard in `demo/server.js`.

## [1.0.0] - 2026-06-06
### Added
- Initial release of Hashttp routing engine.
- Flat route object mapping with explicit targets.
- Dynamic route matching using `:param` placeholders.
- Automatic content-type detection by file extension.
- Route pointer object support with explicit `target` and `headers`.
- Smart matcher selection: hash + regex for small sets, trie support for larger route collections.
- ESM-compatible codebase with zero external dependencies.
- Demo server in `demo/server.js` showcasing static, dynamic, JSON, and folder-like routes.
- Unit test suite in `test/matcher.test.js` covering matcher and integration behavior.
