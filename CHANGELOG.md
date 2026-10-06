# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.2.2] - 2026-10-07

### Fixed

- **Six operation types listed in the op-index map had no serializer, so signing them threw `Operation type <x> serialization not fully implemented` at runtime** (#557): `delegate_vesting_shares` (40), `create_proposal` (44), `update_proposal_votes` (45) and `remove_proposal` (46), which a wallet UI signs for its delegate **and** revoke-delegation buttons and its proposal create/vote/remove actions (each failing after the user had already authenticated and unlocked a key), plus `delete_comment` (17) and `claim_account` (22), which carried the same latent gap. `delegate_vesting_shares` is also the operation that *revokes* a delegation (`0.000000 VESTS`). The map entry had been present since the "full operation serialization" work while the serializer case was never written, so the gap stayed invisible to any test that mocks `auth.signTransaction`. Field order and encoding follow the legacy 0.7 definitions exactly (`delegator, delegatee, vesting_shares`; `creator, receiver, start_date, end_date, daily_pay, subject, permlink, extensions`; `voter|proposal_owner, proposal_ids[]` + `approve`/`extensions`). Golden hex for the ten new fixtures was generated with the legacy serializer implementation (`origin/legacy` — the code that signed these operations on mainnet), which was validated first by reproducing every committed steemutil fixture it can encode (6/6 byte-identical); byte output for all previously supported operations is unchanged, and one of the new fixtures deliberately feeds an unordered `proposal_ids` list to pin the canonical wire order described below. The serializers were also confirmed against live mainnet data: real chain transactions were re-fetched and replayed through `serializeTransaction`, and `sha256(serialized)[0:20]` reproduces the on-chain `transaction_id` (per `transaction::id()` in `libraries/protocol/transaction.cpp`) for `delegate_vesting_shares` (`16c2251ca1e6bb7d3ec77a8e89e3bb1be38bf026`, `071ad341825f9e985eb0858c476e165e8c41b92e`), `claim_account` (`8a71ffed8813630c1b8ee656754d332fd5652f84`, `036b91d9d2b9d25d92e05c9b8b946ec274bd53d9`) and `delete_comment` (`6b3481dc5a128437d21cf96590947474e3401c6f`) — every one byte-exact, which exercises the shared asset/time/string encoders end to end. No live `create_proposal` / `update_proposal_votes` / `remove_proposal` sample exists in a recent block range (SPS writes are rare), so those three rest on the C++ `FC_REFLECT` field order and the reference implementations. `OPERATION_TYPE_INDEX` is now exported **frozen** and `UNSERIALIZED_OPERATION_TYPES` records the single remaining gap (`report_over_production`, which the chain no longer accepts and whose payload embeds two signed block headers), with `test/serializer-op-coverage.test.ts` failing if a future map entry is added without a serializer. Test suite: 317 passed / 23 skipped, typecheck and lint clean (the 23 skips are the pre-existing live-network integration tests).
- **Malformed `account_create_with_delegation_basic` fixture cleaned up**: the committed fixture carried a stray leading `null` inside each `key_auths` array (an artifact of the Go fixture generator's `MarshalJSON`, silently dropped by the cross-language test loader). The nulls are gone; `expected_hex` is byte-identical and still matches the serialized transaction.
- **Open Dependabot alerts cleared** (#556): js-yaml raised to 4.3.2 via the existing `js-yaml@4` workspace override (GHSA-2883-xcg3-v3hh / CVE-2026-84375, high — `maxTotalMergeKeys` did not limit CPU use for empty merge sources); vitest and `@vitest/coverage-v8` moved ^3.2.6 → ^4.1.11, which also moves `@vitest/mocker` past the redirect-mock path traversal fix (GHSA-82fw-gwwq-j7x9 / CVE-2026-84373, medium — no 3.x backport exists, hence the major bump); `@humanfs/node` updated 0.16.7 → 0.16.8 in-range through eslint (GHSA-p498-v437-472g, medium). Dependency-only, dev/build-time packages — nothing reaches the published bundles. Full suite (282 passed / 23 skipped), typecheck, lint, audit and all four rollup bundles verified green under vitest 4.

### Changed

- **`proposal_ids` is validated instead of silently coerced**: `serializeUint64Array` mapped any element it could not read as a number to `0`, so a malformed id would have signed a vote for proposal 0 — a transaction the caller never approved — instead of surfacing the bad input. It now rejects a non-array field and every element that is not a non-negative safe integer (numeric strings are still accepted), with tests covering the rejections and the accepted forms. Applies to `update_proposal_votes` and `remove_proposal`.
- **`proposal_ids` is written in canonical ascending order**: the chain types this field as `flat_set_ex<int64_t>`, whose packed form is a *sorted* set (`fc::raw::pack` casts it to `flat_set`; the JSON path asserts "unique and sorted"), and legacy 0.7 emitted sorted bytes too — `proposal_ids` was declared `array(uint64)` and `Types.array` ran every numeric array through `sortOperation`. The first version of this serializer wrote the caller's order instead, so `[42, 1]` signed different bytes than `[1, 42]`; the node recomputes the digest over the sorted set and would have rejected the transaction as an invalid signature. The ids are now sorted numerically before they are written (not deduplicated — legacy behaviour, and a repeated id is rejected by the chain either way). Covered by byte-equality tests against the sorted golden for both operations, plus a fixture whose `proposal_ids` input is deliberately unordered.
- **The live-broadcast integration test no longer fails the build when the shared test account is out of resource credits**: `test/comment.test.ts` signs and broadcasts from one hardcoded account that backs every local run and both CI matrix jobs, and the chain answers `Account: guest123 has … RC, needs … RC` once its budget is spent — a statement about the account's wallet, not about the library, and not something a retry can clear (RC regenerates over hours). It now takes the same environment-skip path the file already used for an unavailable network (warn and skip), and still asserts a real broadcast whenever the account can transact. Unrelated to the serializer fix; left as-is it would have turned this release's CI red for an environment reason alone.

## [1.2.1] - 2026-09-09

### Fixed

- **`account_update2` metadata-only updates failed to serialize** (#552): `serializeAccountUpdate2` unconditionally serialized `owner`/`active`/`posting` and required `memo_key`, throwing `Invalid authority: expected object` for profile-style updates that carry only `json_metadata` / `posting_json_metadata`. All four fields are `optional<>` in the protocol (`account_update2_operation`): absent fields now serialize as a `0x00` presence byte (empty string treated as absent), matching `fc::raw::pack(optional)` and legacy steem-js 0.7. Verified byte-for-byte against golden vectors from the legacy serializer and against the C++ reference node (field order, op id 43, presence-byte format); 282 tests green.
- **js-yaml raised to 4.3.1 and remaining audit findings cleared** (#551): dependency-only; resolves the last open Dependabot alerts. dev/build-only dependencies, nothing reaches the published bundles beyond what 1.1.2 already covered.

### Changed

- **CI now actually guards code changes** (#553): the `push`/`pull_request` `paths` filters only matched the workflow file itself, `pnpm test || echo` swallowed test failures, and the Docker install was not frozen — a fully red suite still produced a green check. Paths now cover `src/**`, `test/**`, lockfile/workspace/patches/build configs; the test step fails the build; installs run `--frozen-lockfile` with `packageManager` pinned to `pnpm@10.34.5` (pnpm 11 requires Node ≥22.13 and would drop the node20 job). The frozen gate immediately surfaced and fixed two latent drifts the old CI had been masking: the lockfile was pnpm-11-rendered while Docker resolved older corepack defaults, and the dockerfiles never copied `pnpm-workspace.yaml` / `patches/` before install — meaning **previous CI images were built without the workspace security overrides and the bytebuffer patch applied**.

### Documented

- **New `docs/OPERATIONS-JSON-PITFALLS.md`** (#555): the JSON shapes nodes actually accept for authority-carrying operations and the failure modes of the wrong ones — object-map authorities sign locally but are rejected by `fc::from_variant(flat_map)` with bad_cast at broadcast; object metadata stringifies to `"[object Object]"` under `account_update2`; `account_update2` has no high-level `steem.broadcast.*` wrapper (use `broadcast.send`); `condenser_api.broadcast_transaction` vs `network_broadcast_api` endpoint compatibility. TSDoc added on `broadcast.send` and the `normalize*` helpers; `docs/README.md` now points serializer-support lists at the pitfalls page.

## [1.2.0] - 2026-08-16

### Security

- **Replace `elliptic` with `@noble/curves` for all secp256k1 point operations** ([CVE-2025-14505](https://github.com/advisories/GHSA-848j-6mx2-7j84), #550): elliptic's ECDSA signing incorrectly truncates the RFC 6979 nonce when an interim value has leading zeros, making affected signatures susceptible to cryptanalysis, and **no upstream fix exists** (last release 6.6.1, Nov 2024). This package never called elliptic's signing path, so it was not directly exploitable, but the advisory cannot be resolved by an upgrade. The dependency is removed entirely, along with its transitive chain (`hmac-drbg`, `brorand`, `@types/elliptic`). See `docs/refactoring-2025.md` section 12 for the full migration record.

### Changed

- Only the low-level point-arithmetic layer was swapped. The hand-written RFC 6979 deterministic nonce generation, the canonical-signature retry loop (`is_fc_canonical`), low-S normalization and the dsteem-compatible recovery byte (31–34) are unchanged, and **all signatures are bit-identical to 1.1.2**, verified against a pre-migration vector set (25 signatures / 5 keys / transaction signing / child-key derivation / ECDH shared secrets). Verification also covered the Go cross-language serializer vectors and the UMD bundle in a simulated browser context.
- `@noble/hashes` raised to `^2.3.0`, aligned with `@noble/curves` 2.3.0's own requirement (single instance in the lockfile, no duplication).
- **`PublicKey.Q` is now a `@noble/curves` point** instead of an elliptic point: `mul`→`multiply`, `getX()`→`x`, `encode('array', b)`→`toBytes(b)`, `isInfinity()`→`is0()`. The high-level `steem.auth.*` API surface is unaffected; consumers using string keys (WIF / `STM…` public keys) see no change.
- Add `publishConfig.access: "public"` so the scoped package can no longer be accidentally published as restricted.

### Fixed

- **Latent bug in the manual public-key recovery fallback** (#550): `-e` was computed as `e.neg().mod(n)`, which yields a *negative* scalar (bn.js `mod` keeps the dividend's sign) and would be rejected by noble-curves' scalar range checks. Now uses `umod()`. The bug was unreachable before because elliptic's built-in `recoverPubKey` always succeeded first.
- Clean stale entries (`elliptic`, `brorand`, `asn1.js`, `diffie-hellman`, `miller-rabin`, `browserify-sign`) from rollup's circular-dependency warning filter — none remain in the dependency tree.

## [1.1.2] - 2026-07-31

### Security

Dependency-only release remediating 20 Dependabot alerts. None of the changes affect runtime behavior; all fixes are confined to `package.json` / `pnpm-workspace.yaml` / `pnpm-lock.yaml`. Only `bn.js` (already handled in 1.1.1) ships inside the published `dist` bundles — every package below is a **dev/build/test-only** dependency and does not reach downstream consumers.

- **Bump `vitest` to `^3.2.6`** (Dependabot #283, critical): when the Vitest UI server is listening, an arbitrary file could be read and executed. Resolves to 3.2.7; `@vitest/coverage-v8` bumped in lockstep (#545).
- **Pin `vite` to `^7.3.5`** (Dependabot #278 / #279 / #280 / #284 / #285): five dev-server vulnerabilities — arbitrary file read via WebSocket, `server.fs.deny` bypass (queries + Windows alternate paths), path traversal in optimized-deps `.map` handling, and `launch-editor` NTLMv2 hash disclosure via UNC paths. `vite` was previously transitive via vitest; added as an explicit devDependency pinned to ^7.3.5 (resolves to 7.3.6) (#544).
- **Bump `rollup` to `^4.59.0`** (Dependabot #264, high): arbitrary file write via path traversal. Resolves to 4.62.3 (#546).
- **Override vulnerable transitive dependencies** (Dependabot #256 / #268 / #269 / #270 / #271 / #273 / #275 / #281 / #282 / #286 / #287 / #288 / #289): pinned `minimatch`, `brace-expansion`, `js-yaml`, `serialize-javascript`, `flatted`, `picomatch`, `postcss`, and `glob` to fixed versions via `overrides` in `pnpm-workspace.yaml` (pnpm v11 no longer reads `pnpm.overrides` from `package.json`). The `serialize-javascript` override moves `@rollup/plugin-terser`'s copy from 6.0.2 to 7.0.5; the minified UMD output is verified identical in behavior (#547).
- **Raise `postcss` override to `8.5.25`** (Dependabot #291 / #292, high): two further `sourceMappingURL` advisories (arbitrary file read / path traversal) were published after #547 landed with 8.5.10. The override now pins to 8.5.25, covering fix versions 8.5.12 and 8.5.18.

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
