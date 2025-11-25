# Baseline Values for Transaction Serialization Tests

## 概述

为了确保序列化实现的正确性，测试使用来自 `old-steem-js`（已验证的实现）的基准值进行验证。这确保了我们的实现与已知正确的实现保持一致。

## 生成基准值

### 方法 1: 使用生成脚本（推荐）

1. 安装 old-steem-js 的依赖：
   ```bash
   cd ../old-steem-js
   npm install  # 或 yarn install / pnpm install
   ```

2. 运行生成脚本：
   ```bash
   cd ../steem-js
   node test/generate-comment-baseline.mjs
   ```

3. 将输出的十六进制值复制到 `test/baseline-values.ts` 中的 `COMMENT_OPERATION_BASELINE.expectedHex`

### 方法 2: 手动提取

如果 old-steem-js 无法运行，可以从已验证的测试用例中提取：

1. 查看 `old-steem-js/test/operations_test.js` 中的已知值
2. 使用相同的交易数据运行 old-steem-js 的序列化器
3. 将生成的十六进制值添加到 `baseline-values.ts`

## 测试用例

### Comment Operation

测试用例定义在 `COMMENT_OPERATION_BASELINE` 中，包含：
- 交易数据（tx）
- 预期的十六进制输出（expectedHex）

当 `expectedHex` 为 `null` 时，测试会跳过并显示警告。

### Account Create Operation

`ACCOUNT_CREATE_BASELINE` 包含来自 `old-steem-js/test/operations_test.js` 的已知值：
- 已知的十六进制值：`614bde71d95f911bf3560109000000000000000003535445454d000009696e69746d696e65720573636f74740100000000010332757668fa45c2bc21447a2ff1dc2bbed9d9dda1616fd7b700255bd28e9d674a010001000000000103fb8900a262d51b908846be54fcf04b3a80d12ee749b9446f976b58b220ba4eed010001000000000102af4963d0f034043f4b4b0c99220e6a4b5d8b9cc71e5cd7d110f7602f3a0a11d1010002ff0de11ef55b998daf88047f1a00a60ed5dffb0c23c3279f8bd42a733845c5da000000`

注意：account_create 操作的序列化尚未实现，相关测试已跳过。

## 为什么需要基准值？

1. **验证正确性**：确保新实现与已验证的实现产生相同的输出
2. **回归测试**：防止实现变更导致输出变化
3. **确定性验证**：确保序列化是确定性的（相同输入产生相同输出）

## 添加新的基准值

1. 在 `test/baseline-values.ts` 中添加新的测试用例
2. 使用 `generate-comment-baseline.mjs` 作为模板创建新的生成脚本
3. 在测试文件中添加对应的测试用例
4. 运行生成脚本获取基准值
5. 更新 `baseline-values.ts` 中的 `expectedHex`

