# Debug 控制说明

steem-js 项目中的 debug 代码可以通过多种方式控制，只有在需要的时候才会输出 debug 信息。

## 控制方式

### 方式 1: 通过配置启用（推荐）

```javascript
import { steem } from '@steemit/steem-js';

// 启用所有 debug 输出
steem.config.set({ debug: true });

// 禁用所有 debug 输出
steem.config.set({ debug: false });
```

### 方式 2: 通过环境变量启用

```bash
# 启用所有 steem-js debug 输出
DEBUG=steem-js node your-script.js

# 只启用 transaction 相关的 debug
DEBUG=steem-js:transaction node your-script.js

# 启用多个特定的 debug 标志
DEBUG=steem-js:transaction,steem-js:signature node your-script.js

# 启用所有 steem-js debug（使用通配符）
DEBUG=steem-js:* node your-script.js
```

### 方式 3: 在代码中检查

```javascript
import { debug } from '@steemit/steem-js';

// 检查是否启用了 debug
if (debug.isEnabled('transaction')) {
  // 执行一些调试代码
}

// 使用 debug 工具输出
debug.transaction('Transaction data:', tx);
debug.signature('Signature info:', sig);
debug.warn('Warning message');
debug.error('Error message'); // 错误总是会输出
```

## Debug 标志

当前支持的 debug 标志：

- `transaction` - 交易相关的 debug 信息（序列化、digest 等）
- `signature` - 签名相关的 debug 信息

## 示例

### 示例 1: 启用 transaction debug

```javascript
import { steem } from '@steemit/steem-js';

// 启用 transaction debug
steem.config.set({ debug: true });

// 或者使用环境变量
// DEBUG=steem-js:transaction node script.js

steem.broadcast.comment(wif, parentAuthor, parentPermlink, author, permlink, title, body, jsonMetadata, (err, result) => {
  // 会输出 transaction debug 信息
});
```

### 示例 2: 禁用所有 debug

```javascript
import { steem } from '@steemit/steem-js';

// 禁用所有 debug
steem.config.set({ debug: false });

// 或者不设置 DEBUG 环境变量
```

### 示例 3: 条件性 debug 输出

```javascript
import { debug } from '@steemit/steem-js';

function myFunction() {
  // 只在 debug 启用时执行
  if (debug.isEnabled('transaction')) {
    debug.transaction('Processing transaction:', tx);
    // 执行一些调试代码
  }
}
```

## 注意事项

1. **默认行为**: 默认情况下，所有 debug 输出都是**禁用**的
2. **错误输出**: `debug.error()` 总是会输出，不受 debug 设置影响
3. **警告输出**: `debug.warn()` 默认会输出，但可以通过 `debug_warnings: false` 禁用
4. **性能影响**: 当 debug 禁用时，debug 代码不会执行，不会影响性能

## 配置选项

在 `steem.config.set()` 中可以设置的选项：

- `debug: boolean` - 启用/禁用所有 debug 输出
- `debug_warnings: boolean` - 控制警告输出（默认 true）

## 实现细节

Debug 控制通过 `src/utils/debug.ts` 模块实现，支持：

1. 配置优先：`steem.config.set({ debug: true })` 会覆盖环境变量
2. 环境变量支持：兼容 `DEBUG` 环境变量（类似 `debug` npm 包）
3. 标志过滤：支持通过标志过滤特定的 debug 输出

