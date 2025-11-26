# Baseline Values for Serialization Testing

## Overview

To ensure the correctness of serialization implementations, tests use baseline values from `old-steem-js` (a verified implementation) for validation. This ensures our implementation remains consistent with a known correct implementation.

## Generating Baseline Values

### Method 1: Using Generation Scripts (Recommended)

1. Install old-steem-js dependencies:
   ```bash
   cd ../old-steem-js
   npm install  # or yarn install / pnpm install
   ```

2. Run the generation script:
   ```bash
   node generate-comment-baseline.mjs
   ```

3. Copy the output hex value to `COMMENT_OPERATION_BASELINE.expectedHex` in `test/baseline-values.ts`

### Method 2: Manual Extraction

If old-steem-js cannot run, you can extract from verified test cases:

1. Check known values in `old-steem-js/test/operations_test.js`
2. Run old-steem-js serializer with the same transaction data
3. Add the generated hex value to `baseline-values.ts`

## Test Cases

### Comment Operation

Test case is defined in `COMMENT_OPERATION_BASELINE`, containing:
- Transaction data (tx)
- Expected hex output (expectedHex)

When `expectedHex` is `null`, the test will skip and show a warning.

### Account Create Operation

`ACCOUNT_CREATE_BASELINE` contains known values from `old-steem-js/test/operations_test.js`:
- Known hex value: `614bde71d95f911bf3560109000000000000000003535445454d000009696e69746d696e65720573636f74740100000000010332757668fa45c2bc21447a2ff1dc2bbed9d9dda1616fd7b700255bd28e9d674a010001000000000103fb8900a262d51b908846be54fcf04b3a80d12ee749b9446f976b58b220ba4eed010001000000000102af4963d0f034043f4b4b0c99220e6a4b5d8b9cc71e5cd7d110f7602f3a0a11d1010002ff0de11ef55b998daf88047f1a00a60ed5dffb0c23c3279f8bd42a733845c5da000000`

Note: account_create operation serialization has been implemented and tests are now passing.

## Why Do We Need Baseline Values?

1. **Verify Correctness**: Ensure new implementation produces the same output as verified implementation
2. **Regression Testing**: Prevent implementation changes from causing output variations
3. **Deterministic Verification**: Ensure serialization is deterministic (same input produces same output)

## Adding New Baseline Values

1. Add new test case in `test/baseline-values.ts`
2. Use `generate-comment-baseline.mjs` as template to create new generation script
3. Add corresponding test case in test file
4. Run generation script to get baseline value
5. Update `expectedHex` in `baseline-values.ts`