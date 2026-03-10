## steemutil 协议 Operation 汇总

来源文件：

- Go 协议定义：`/home/ety001/workspace/steemutil/protocol/operations.go`
- Operation 类型映射：`/home/ety001/workspace/steemutil/protocol/operation.go` 中的 `dataObjects` 表

字段顺序一律以 Go 结构体字段声明顺序为准；序列化时遵循 `encoder.Encoder` 的规则：

- 先写入 `OpType.Code()`（varint）
- 然后按结构体字段顺序依次编码字段（指针字段为 `has_value(uint8)` + 实际值；切片/数组为长度 + 元素；资产字符串使用 `encodeAsset`）

下面按功能大类罗列所有 Operation 及其主要字段。

---

### 1. 账号与权限类

- **account_create_operation / AccountCreateOperation**
  - 字段：`fee, creator, new_account_name, owner, active, posting, memo_key, json_metadata`
- **account_update_operation / AccountUpdateOperation**
  - 字段：`account, owner, active, posting, memo_key, json_metadata`
- **account_update2_operation / AccountUpdate2Operation**
  - 字段：`account, owner, active, posting, memo_key, json_metadata, posting_json_metadata, extensions`
- **account_create_with_delegation_operation / AccountCreateWithDelegationOperation**
  - 字段：`fee, delegation, creator, new_account_name, owner, active, posting, memo_key, json_metadata, extensions`
- **request_account_recovery_operation / RequestAccountRecoveryOperation**
  - 字段：`recovery_account, account_to_recover, new_owner_authority, extensions`
- **recover_account_operation / RecoverAccountOperation**
  - 字段：`account_to_recover, new_owner_authority, recent_owner_authority, extensions`
- **change_recovery_account_operation / ChangeRecoveryAccountOperation**
  - 字段：`account_to_recover, new_recovery_account, extensions`
- **reset_account_operation / ResetAccountOperation**
  - 字段：`reset_account, account_to_reset, new_owner_authority`
- **set_reset_account_operation / SetResetAccountOperation**
  - 字段：`account, current_reset_account, reset_account`
- **decline_voting_rights_operation / DeclineVotingRightsOperation**
  - 字段：`account, decline`

账号相关的 Authority 结构统一为：

- **Authority**
  - 字段：`account_auths (map[string]int64], key_auths (map[string]int64], weight_threshold (uint32)`

---

### 2. 投票与内容类

- **vote_operation / VoteOperation**
  - 字段：`voter, author, permlink, weight`
- **vote2_operation / Vote2Operation**
  - 字段：`voter, author, permlink, rshares, extensions`
- **comment_operation / CommentOperation**
  - 字段：`parent_author, parent_permlink, author, permlink, title, body, json_metadata`
- **delete_comment_operation / DeleteCommentOperation**
  - 字段：`author, permlink`
- **comment_options_operation / CommentOptionsOperation**
  - 字段：`author, permlink, max_accepted_payout, percent_steem_dollars, allow_votes, allow_curation_rewards, extensions`

奖励相关：

- **comment_reward_operation / CommentRewardOperation**
  - 字段：`author, permlink, payout`

---

### 3. 余额、转账与 Vesting 类

- **transfer_operation / TransferOperation**
  - 字段：`from, to, amount, memo`
- **transfer_to_vesting_operation / TransferToVestingOperation**
  - 字段：`from, to, amount`
- **withdraw_vesting_operation / WithdrawVestingOperation**
  - 字段：`account, vesting_shares`
- **set_withdraw_vesting_route_operation / SetWithdrawVestingRouteOperation**
  - 字段：`from_account, to_account, percent, auto_vest`
- **fill_vesting_withdraw_operation / FillVestingWithdrawOperation**
  - 字段：`from_account, to_account, withdrawn, deposited`
- **delegate_vesting_shares_operation / DelegateVestingSharesOperation**
  - 字段：`delegator, delegatee, vesting_shares`

储蓄相关：

- **transfer_to_savings_operation / TransferToSavingsOperation**
  - 字段：`from, to, amount, memo`
- **transfer_from_savings_operation / TransferFromSavingsOperation**
  - 字段：`from, request_id, to, amount, memo`
- **cancel_transfer_from_savings_operation / CancelTransferFromSavingsOperation**
  - 字段：`from, request_id`
- **fill_transfer_from_savings_operation / FillTransferFromSavingsOperation**
  - 字段：`from, to, amount, request_id, memo`

奖励余额：

- **claim_reward_balance_operation / ClaimRewardBalanceOperation**
  - 字段：`account, reward_steem, reward_sbd, reward_vests`
- **claim_reward_balance2_operation / ClaimRewardBalance2Operation**
  - 字段：`account, extensions, reward_tokens`

利息与流动性奖励：

- **liquidity_reward_operation / LiquidityRewardOperation**
  - 字段：`owner, payout`
- **interest_operation / InterestOperation**
  - 字段：`owner, interest`

---

### 4. 市场、价格与 Convert 类

- **limit_order_create_operation / LimitOrderCreateOperation**
  - 字段：`owner, orderid, amount_to_sell, min_to_receive, fill_or_kill, expiration`
- **limit_order_create2_operation / LimitOrderCreate2Operation**
  - 字段：`owner, orderid, amount_to_sell, exchange_rate{base, quote}, fill_or_kill, expiration`
- **limit_order_cancel_operation / LimitOrderCancelOperation**
  - 字段：`owner, orderid`
- **fill_order_operation / FillOrderOperation**
  - 字段：`current_owner, current_orderid, current_pays, open_owner, open_orderid, open_pays`

价格与兑换：

- **feed_publish_operation / FeedPublishOperation**
  - 字段：`publisher, exchange_rate{base, quote}`
- **convert_operation / ConvertOperation**
  - 字段：`owner, requestid, amount`
- **fill_convert_request_operation / FillConvertRequestOperation**
  - 字段：`owner, requestid, amount_in, amount_out`

---

### 5. 托管（Escrow）与提案类

托管相关：

- **escrow_transfer_operation / EscrowTransferOperation**
  - 字段：`from, to, sbd_amount, steem_amount, escrow_id, agent, fee, json_meta, ratification_deadline, escrow_expiration`
- **escrow_dispute_operation / EscrowDisputeOperation**
  - 字段：`from, to, agent, who, escrow_id`
- **escrow_release_operation / EscrowReleaseOperation**
  - 字段：`from, to, agent, who, receiver, escrow_id, sbd_amount, steem_amount`
- **escrow_approve_operation / EscrowApproveOperation**
  - 字段：`from, to, agent, who, escrow_id, approve`

提案系统：

- **create_proposal_operation / CreateProposalOperation**
  - 字段：`creator, receiver, start_date, end_date, daily_pay, subject, permlink, extensions`
- **update_proposal_votes_operation / UpdateProposalVotesOperation**
  - 字段：`voter, proposal_ids, approve, extensions`
- **remove_proposal_operation / RemoveProposalOperation**
  - 字段：`proposal_owner, proposal_ids, extensions`

账号/资源相关操作：

- **claim_account_operation / ClaimAccountOperation**
  - 字段：`creator, fee, extensions`
- **create_claimed_account_operation / CreateClaimedAccountOperation**
  - 字段：`creator, new_account_name, owner, active, posting, memo_key, json_metadata, extensions`

---

### 6. 见证人（Witness）与链属性类

- **witness_update_operation / WitnessUpdateOperation**
  - 字段：`owner, url, block_signing_key, props (ChainProperties), fee`
- **account_witness_vote_operation / AccountWitnessVoteOperation**
  - 字段：`account, witness, approve`
- **account_witness_proxy_operation / AccountWitnessProxyOperation**
  - 字段：`account, proxy`
- **witness_set_properties_operation / WitnessSetPropertiesOperation**
  - 字段：`owner, props (StringBytesMap), extensions`

链属性结构：

- **ChainProperties**
  - 字段：`account_creation_fee (string 或 AssetObject), maximum_block_size, sbd_interest_rate`

---

### 7. POW / 系统事件类

- **pow_operation / POWOperation**
  - 字段：`worker_account, block_id, nonce, work (POW), props (ChainProperties)`
- **pow2_operation / POW2Operation**
  - 字段：`input, pow_summary`
- **report_over_production_operation / ReportOverProductionOperation**
  - 字段：`reporter, first_block, second_block`

内部结构：

- **POW**
  - 字段：`worker, input, signature, work`

---

### 8. 自定义与二进制自定义类

- **custom_json_operation / CustomJSONOperation**
  - 字段：`required_auths, required_posting_auths, id, json`
- **custom_operation / CustomOperation**（在 steemutil 中对应为自定义编码，主要用于 `custom`）
  - 见 Go 侧注释：`required_auths, id, data`
- **custom_binary_operation / CustomBinaryOperation**
  - 字段：`id, data`

---

### 9. 只读链上事件类（主要用于回放/通知）

这些 Operation 一般不会从前端广播，但为保证协议完整，序列化/反序列化仍需支持：

- **fill_vesting_withdraw_operation / FillVestingWithdrawOperation**
  - `from_account, to_account, withdrawn, deposited`
- **fill_order_operation / FillOrderOperation**
  - `current_owner, current_orderid, current_pays, open_owner, open_orderid, open_pays`
- **fill_transfer_from_savings_operation / FillTransferFromSavingsOperation**
  - `from, to, amount, request_id, memo`
- **comment_reward_operation / CommentRewardOperation**
  - `author, permlink, payout`
- **liquidity_reward_operation / LiquidityRewardOperation**
  - `owner, payout`
- **interest_operation / InterestOperation**
  - `owner, interest`

> 后续在 `steem-js` 的 `transaction.ts` 中补全序列化逻辑时，可直接以此列表为检查清单，确保所有在 `dataObjects` 中出现的 Operation 均有对应的 `case` 与 `serializeXxx` 实现。

---

## steem-js 当前映射与实现覆盖情况

### 1. getOperationTypeIndex 中的 Operation

`src/auth/serializer/transaction.ts` 里的 `getOperationTypeIndex` 定义了可序列化的 operation 类型索引（opType → index）：

- `vote` (0)
- `comment` (1)
- `transfer` (2)
- `transfer_to_vesting` (3)
- `withdraw_vesting` (4)
- `limit_order_create` (5)
- `limit_order_cancel` (6)
- `feed_publish` (7)
- `convert` (8)
- `account_create` (9)
- `account_update` (10)
- `witness_update` (11)
- `account_witness_vote` (12)
- `account_witness_proxy` (13)
- `pow` (14)
- `custom` (15)
- `delete_comment` (17)
- `custom_json` (18)
- `comment_options` (19)

### 2. 已在 serializeOperationData 中实现二进制序列化的 Operation

`serializeOperationData` 当前只对以下 op 有完整实现：

- **comment** → `serializeComment`
- **vote** → `serializeVote`
- **transfer** → `serializeTransfer`
- **account_create** → `serializeAccountCreate`
- **account_update** → `serializeAccountUpdate`
- **custom_json** → `serializeCustomJson`

其余在 `getOperationTypeIndex` 中出现的 op（例如 `transfer_to_vesting`、`withdraw_vesting`、`limit_order_create`、`feed_publish`、`convert`、`witness_update`、`account_witness_vote`、`account_witness_proxy`、`pow`、`custom`、`delete_comment`、`comment_options`）**目前仍会在序列化阶段触发 “Operation type XXX serialization not fully implemented”**。

### 3. steem-js Broadcast API (`src/broadcast/operations.ts`) 中的 Operation

`src/broadcast/operations.ts` 的 `operations` 数组列出了通过 `steem.broadcast.xxx` 封装暴露的高频 op：

- `vote`
- `comment`
- `transfer`
- `transfer_to_vesting`
- `withdraw_vesting`
- `limit_order_create`
- `limit_order_cancel`
- `price`（仅在 broadcast 层表示，用于 `feed_publish.exchange_rate`）
- `feed_publish`
- `convert`
- `account_create`
- `account_update`
- `witness_update`
- `account_witness_vote`
- `account_witness_proxy`
- `pow`
- `custom`
- `delete_comment`
- `custom_json`
- `comment_options`

其中绝大多数都已经与 `getOperationTypeIndex` 对齐，唯独 `price` 只存在于 broadcast 封装中（作为 `feed_publish.exchange_rate` 的结构），不会单独出现在 `operations` 向量的 opType 上。

### 4. 只在 steemutil 中存在、尚未在 steem-js opMap/Broadcast 中显式建模的 Operation

下列 Operation 出现在 `steemutil/protocol/operation.go` 的 `dataObjects` 中，但目前 **既不在 `getOperationTypeIndex` 的 opMap 中，也不在 `src/broadcast/operations.ts` 的高层封装中单独出现**，多为链上回放/通知事件或扩展协议：

- `report_over_production_operation` (`TypeReportOverProduction`)
- `set_withdraw_vesting_route_operation`（在 steem-js 只作为 type index 存在，尚无 broadcast 封装）
- 所有 escrow 系列：`escrow_transfer_operation`、`escrow_dispute_operation`、`escrow_release_operation`、`escrow_approve_operation`
- 提案/治理相关：`create_proposal_operation`、`update_proposal_votes_operation`、`remove_proposal_operation`
- 账号恢复/安全相关：`request_account_recovery_operation`、`recover_account_operation`、`change_recovery_account_operation`、`reset_account_operation`、`set_reset_account_operation`
- pow/系统相关：`pow2_operation`、`fill_convert_request_operation`
- 只读奖励/结算事件：`comment_reward_operation`、`liquidity_reward_operation`、`interest_operation`、`fill_vesting_withdraw_operation`、`fill_order_operation`、`fill_transfer_from_savings_operation`
- 新版奖励与 token 相关：`claim_reward_balance2_operation`、`vote2_operation`

> 这些 op 主要用于 **区块回放和节点通知**，前端通常不会主动广播，但为了和 steemutil 以及底层协议保持一致，后续在 `transaction.ts` 中补全 serializer 时也应考虑支持（至少保证不会因为解码/重放失败而抛错）。


