# Changelog

All notable changes to this project will be documented in this file.

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
