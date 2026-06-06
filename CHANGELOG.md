# Changelog

All notable changes to this project will be documented in this file.

## [1.0.3] - 2026-06-06
### Changed
- Added `folder: true` route pointer support for prefix-based folder serving.
- Updated demo route `/docs` to use folder route semantics and serve nested files from `demo/public/docs`.
- Updated README to reflect folder routes and current project state.
- Added demo docs files `demo/public/docs/version.md` and `demo/public/docs/guide.html`.

## [1.0.2] - 2026-06-06
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
