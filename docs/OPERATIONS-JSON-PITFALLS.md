# Operation JSON pitfalls: authority maps, metadata strings, broadcast wrappers

This page documents failure modes that do **not** surface at build time — the SDK
signs the transaction locally without complaint, and the failure only appears
when the node processes the broadcast. Each pitfall below lists the wrong shape,
the symptom you will see, and the correct form.

Scope: authority-carrying operations (`account_update`, `account_update2`,
`recover_account`, `request_account_recovery`, …) built and signed with this
SDK. Applies as of v1.2.1; this page will be updated when the planned
broadcast-parity follow-ups land.

---

## 1. Authorities must be pair arrays, not object maps

Steem's `authority` carries `account_auths` / `key_auths` as `fc::flat_map`,
whose JSON form is an **array of `[key, weight]` pairs** — not a JSON object.

```js
// ✅ correct — fc::flat_map JSON form
const authority = {
  weight_threshold: 1,
  account_auths: [],
  key_auths: [['STM7DTS62msowgpAZJBNRMStMUt5bfRA4hc9j5wjwU4vKhi3KFkKb', 1]],
};

// ❌ wrong — human-intuitive object map
const authority = {
  weight_threshold: 1,
  account_auths: [],
  key_auths: { STM7DTS62msowgpAZJBNRMStMUt5bfRA4hc9j5wjwU4vKhi3KFkKb: 1 },
};
```

**Symptom:** local signing *succeeds* — the binary serializer accepts both
shapes and produces a valid signature — but the broadcast is rejected by the
node with a `bad_cast`-style exception, because `fc::from_variant` for a
`flat_map` requires an array of pairs. The signature you computed is never even
evaluated.

**Safety net coverage:** `steem.auth.normalizeTransactionForBroadcast()` rewrites
only `account_update` operations (converting object maps to pair arrays and
coercing metadata to strings, mirroring `sanitizeAccountUpdatePayload`). For
every other operation that carries authorities, **the caller is responsible for
the pair-array shape** — there is no normalization step in the SDK for them.

Weights (`weight_threshold` and per-key/account weights) are unsigned 16-bit
integers.

## 2. `json_metadata` / `posting_json_metadata` must be strings

Both fields are protocol `string` fields (UTF-8 JSON text), not embedded JSON
objects.

```js
// ✅ correct
posting_json_metadata: JSON.stringify({ profile: { name: 'alice' } }),

// ❌ wrong — a parsed object
posting_json_metadata: { profile: { name: 'alice' } },
```

**Symptom:** for `account_update2`, an object input is stringified with
`String(value)` — producing the literal text `"[object Object]"` — which is what
gets covered by the signature; the node then rejects the non-string variant when
parsing the broadcast JSON. (`account_update` serializes objects with
`JSON.stringify`, but do not rely on that asymmetry.)

Normalize explicitly with the exported helper, which accepts a string, an
object/array, or null:

```js
steem.auth.normalizeChainJsonMetadata(value); // → string
```

## 3. `account_update2` has no high-level broadcast wrapper

The binary serializer supports `account_update2` (including metadata-only
updates since #552), but `src/broadcast/operations.ts` has no registry entry
for it, so `steem.broadcast.accountUpdate2*` methods **do not exist**. Use the
generic entry point:

```js
await steem.broadcast.send(
  {
    extensions: [],
    operations: [[
      'account_update2',
      {
        account: 'alice',
        // all four of owner / active / posting / memo_key are OPTIONAL;
        // omit them entirely for a metadata-only update
        json_metadata: '',
        posting_json_metadata: JSON.stringify({ profile: { name: 'Alice' } }),
        extensions: [],
      },
    ]],
  },
  [postingWif]
);
```

Or sign manually and relay the signed transaction yourself:
`steem.auth.signTransaction(tx, [wif])` → broadcast via
`condenser_api.broadcast_transaction`.

Protocol details worth knowing (see `account_update2_operation` in
`steem_operations.hpp`):

- All four authority/key fields are `optional<>`: absent fields serialize as a
  single `0x00` presence byte, present as `0x01` + value. An empty string is
  treated as absent.
- Required signing authority on the node side: `owner` present → owner;
  otherwise `active` if any of `active`/`posting`/`memo_key` is set or
  `json_metadata` is non-empty; otherwise **posting** (the metadata-only case).

## 4. Broadcast endpoint: `condenser_api` vs `network_broadcast_api`

If you relay signed transactions yourself, prefer
`condenser_api.broadcast_transaction`: it accepts the legacy JSON this SDK
produces (tuple `key_auths`). `network_broadcast_api.broadcast_transaction`
goes through appbase `fc::from_variant`, which has been observed to reject
tuple-form authorities with `bad_cast` on some nodes (e.g. steemitdev). The
node-side plugin namespaces are defined in the C++ reference
(`libraries/plugins/`).

## 5. Deliberate behaviors (documented, not bugs)

- **`account_update2` `memo_key` accepts strings only.** `"STM…"` strings are
  the only JSON-representable form of `public_key_type` anyway — the node's
  `fc::from_variant(public_key_type)` requires a string variant and validates
  the prefix + ripemd160 checksum. (v1 `account_update` additionally tolerates
  `Buffer` / `{ toBuffer() }` inputs on the binary path.)
- **`weight_threshold: 0` is coerced to 1** by the shared authority serializer
  (`|| 1`). The chain does not host authorities with a zero threshold, so this
  only fires on malformed input.

---

Found a pitfall not covered here? Please open an issue with the exact JSON you
sent, the signature digest, and the node's rejection message.
