# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.1] - 2026-07-29

### Security

- **Bump `bn.js` to remediate the infinite-loop DoS** ([CVE-2026-2739](https://github.com/advisories/GHSA-378v-28hj-76wf), Dependabot #259 / #260): `maskn(0)` corrupts a `BN`'s internal state, so later `toString()` / `divmod()` calls hang the process. Two copies were affected and both ship inside the published `dist` bundles: the direct dependency (raised to `^5.2.3`, resolving to 5.2.5) and the transitive copy pulled in by `elliptic` (refreshed to 4.12.5). No code path in this package calls `maskn`, so the advisory was not reachable from `steem.auth` itself, but downstream consumers receive `BN` instances through `ECSignature`.

## [1.1.0] - 2026-07-22

### Added

- **Precise TypeScript return types** for the 7 explicitly-typed RPC methods (`getAccounts`, `getAccountHistory`, `getDynamicGlobalProperties`, `getContent`, `getFollowers`, `getBlock`, `getConfig`), mirroring the Steem C++ node's `condenser_api` / `database_api` / `follow_api` `FC_REFLECT` serialization structs. New protocol interfaces (`ExtendedAccount`, `DynamicGlobalProperties`, `Discussion`, `SignedBlock`, `FollowApiObject`, `AppliedOperation`, `AccountHistoryEntry`, `Manabar`, `BeneficiaryRoute`, `ActiveVote`) are exported from the main entry so downstream consumers (wallet, condenser) can opt into precise typing (#542). Type-only change; no runtime behavior change.
- **`prepublishOnly` npm hook** runs `clean && rollup -c` before `npm publish`, preventing accidental empty-package publishes (since `files` only ships `dist`, which is gitignored and built at publish time).

### Fixed

- **Apply the bytebuffer `new Buffer()` patch** by migrating `patchedDependencies` to `pnpm-workspace.yaml`. pnpm 10+ no longer reads the `pnpm` field from `package.json`, so the bytebuffer@5.0.1 patch (landed in 1.0.17) was silently **not** applied, causing build/runtime regressions on Node 20+ (#540).
- **Remove dead `key_utils` module** that imported the undeclared `secure-random` package; its functionality is already covered by `src/crypto/random-bytes.ts` (Web Crypto API). Also resolve all 44 lint warnings (#541).

### Docs

- Remove the outdated **"Under Construction / do not use in production"** banner from `README.md`: the 2025 rewrite has reached release readiness, the 1.0.20 `verifyTransaction` fix is verified end-to-end, and downstream projects (wallet, condenser) already depend on this package in production.

## [1.0.20] - 2026-07-15

### Fixed

- **`steem.auth.verifyTransaction`** now verifies signatures against the correct binary digest `sha256(chain_id ‖ serializeTransaction(normalizedTrx))`, mirroring `signTransaction`'s digest exactly. Previously it verified against `Buffer.from(JSON.stringify(transaction))`, which never matched the signed digest and caused it to return `false` for every legitimately-signed transaction — making the function unusable. The `signatures` field is excluded from the digest (matching signing-time behavior, since `signTransaction` serializes before attaching signatures).

### Added

- Export **`serializeTransaction`** from `steem.auth` so downstream apps (e.g. wallet relay services) can reconstruct the signing digest themselves for server-side signature verification. Type declarations are emitted automatically by the TypeScript build.

### Docs

- Update the Authentication and Transaction serialization sections in `docs/README.md` with `verifyTransaction` / `serializeTransaction` entries and runnable examples.
- Add a **"Transaction Signature Verification"** section to `docs/signature-verification-examples.md`, covering the sign→verify round-trip, the server-side relay verification use case, rejected cases, and manual digest construction.

## [1.0.19] - 2026-05-24

### Fixed

- Align **`account_update`** authority types with Steem **`fc::flat_map`** JSON: broadcast **`key_auths`** / **`account_auths`** as **`[key, weight]`** pair arrays (not object maps), matching `fc::from_variant` in `fc/container/flat.hpp` (#538).
- Coerce mistaken object-map authority input into pair arrays before signing and broadcast.

### Added

- Export **`AuthorityWeightPair`**; document protocol shapes on **`ChainAuthority`** and **`AccountUpdatePayload`**.
- Binary serializer accepts pair arrays and object maps for authority maps; parity test for normalized vs raw transaction bytes.

## [1.0.18] - 2026-05-23

### Fixed

- Normalize **`account_update`** operations in **`signTransaction`** so returned JSON matches Steem protocol types (`authority` objects, string `json_metadata`), fixing `bad_cast_exception` on JSON-RPC broadcast after client-side signing (#537).
- Fail fast in the binary serializer when `owner` / `active` / `posting` is passed as an array instead of an authority object.

### Added

- Export **`normalizeOperationForBroadcast`**, **`normalizeTransactionForBroadcast`**, and related helpers from **`steem.auth`**.

## [1.0.17] - 2026-05-22

### Fixed

- Patch **`bytebuffer@5.0.1`** (via `pnpm.patchedDependencies`) to use `Buffer.alloc` / `Buffer.from` instead of deprecated `new Buffer()`, eliminating Node.js **DEP0005** warnings when bundling or loading the library on Node 20+.

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
