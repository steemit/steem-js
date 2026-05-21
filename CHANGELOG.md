# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.16] - 2026-05-21

### Fixed

- Route 51 legacy read RPC helpers through **`condenser_api`** instead of **`database_api`**, matching current [steem](https://github.com/steemit/steem) full nodes (fixes `Could not find method` errors for `get_accounts`, `get_content`, discussions, etc.).
- Keep 12 helpers on **`database_api`** where the node still exposes them (`get_config`, `get_dynamic_global_properties`, `verify_authority`, `find_change_recovery_account_requests`, …).

### Removed

- Drop 30 `steem.api.*` helpers that are not implemented on current Steem nodes (WebSocket subscriptions, category listings, `getDiscussionsByPayout`, proposed-transaction getters, escrow-by-side helpers, account bandwidth/notifications, `getLiquidityQueue`, `getMinerQueue`, …). See [API routing](./docs/README.md#api-routing).

### Changed

- Documentation and source comments updated for condenser vs database API routing ([docs/README.md#api-routing](./docs/README.md#api-routing), [refactoring notes](./docs/refactoring-2025.md#11-api-rpc-routing-v1016)).

## [1.0.15] - 2026-05-21

### Changed

- Bump package version to 1.0.15.

### Added

- `clean` script; run `clean` before `build` in the build pipeline.

## [1.0.14] - (prior release)

Previous release on npm before the routing fix branch. See git history and [refactoring-2025.md](./docs/refactoring-2025.md) for the 2025 modernization work.
