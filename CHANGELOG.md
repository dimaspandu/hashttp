# Changelog

All notable changes to this project will be documented in this file.

## [1.0.4] - 2026-06-06
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
