# Debug Control Instructions

Debug code in the steem-js project can be controlled in multiple ways, outputting debug information only when needed.

## Control Methods

### Method 1: Enable via Configuration (Recommended)

```javascript
const steem = require('@steemit/steem-js');

// Enable all debug output
steem.config.set({ debug: true });

// Disable all debug output
steem.config.set({ debug: false });
```

### Method 2: Enable via Environment Variables

```bash
# Enable all steem-js debug output
DEBUG=steem-js node your-script.js

# Enable only transaction-related debug
DEBUG=steem-js:transaction node your-script.js

# Enable multiple specific debug flags
DEBUG=steem-js:transaction,steem-js:signature node your-script.js

# Enable all steem-js debug (using wildcards)
DEBUG=steem-js:* node your-script.js
```

### Method 3: Check in Code

```javascript
const debug = require('./src/utils/debug');

// Check if debug is enabled
if (debug.isEnabled('transaction')) {
  // Execute some debugging code
}

// Use debug tool for output
debug.transaction('Transaction data:', tx);
debug.signature('Signature data:', sig);
debug.warn('Warning message');
debug.error('Error message'); // Errors are always output
```

## Debug Flags

Currently supported debug flags:

- `transaction` - Transaction-related debug information (serialization, digest, etc.)
- `signature` - Signature-related debug information

## Examples

### Example 1: Enable Transaction Debug

```javascript
const steem = require('@steemit/steem-js');

// Enable transaction debug
steem.config.set({ debug: true });

// Or use environment variable
// DEBUG=steem-js:transaction node script.js

steem.broadcast.comment(wif, parentAuthor, parentPermlink, author, permlink, title, body, jsonMetadata, (err, result) => {
  // Will output transaction debug information
});
```

### Example 2: Disable All Debug

```javascript
const steem = require('@steemit/steem-js');

// Disable all debug
steem.config.set({ debug: false });

// Or don't set DEBUG environment variable
```

### Example 3: Conditional Debug Output

```javascript
const debug = require('./src/utils/debug');

function myFunction() {
  // Execute only when debug is enabled
  if (debug.isEnabled('transaction')) {
    debug.transaction('Processing transaction:', tx);
    // Execute some debugging code
  }
}
```

## Important Notes

1. **Default Behavior**: By default, all debug output is **disabled**
2. **Error Output**: `debug.error()` is always output, not affected by debug settings
3. **Warning Output**: `debug.warn()` is output by default, but can be disabled with `debug_warnings: false`
4. **Performance Impact**: When debug is disabled, debug code doesn't execute and won't affect performance

## Configuration Options

Options that can be set in `steem.config.set()`:

- `debug: boolean` - Enable/disable all debug output
- `debug_warnings: boolean` - Control warning output (default true)

## Implementation Details

Debug control is implemented through the `src/utils/debug.ts` module, supporting:

1. Configuration priority: `steem.config.set({ debug: true })` overrides environment variables
2. Environment variable support: Compatible with `DEBUG` environment variable (similar to `debug` npm package)
3. Flag filtering: Supports filtering specific debug output through flags