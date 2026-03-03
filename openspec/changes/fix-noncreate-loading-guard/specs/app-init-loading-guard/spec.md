## ADDED Requirements

### Requirement: 非 Create 态在已提供配置快照时不得卡在 Loading

当 `initConfigData` 在非 Create 态被调用且已提供 `configSnapshot` 时，系统 **MUST** 执行初始化流程并结束 Loading，而不是因 `isGetConfigReady` 尚未更新而提前返回。

#### Scenario: 非 Create 态传入 configSnapshot 时不触发 early return
- **WHEN** Dashboard 处于非 Create 态
- **AND** 调用 `initConfigData(..., configSnapshot)` 且 `configSnapshot` 非空
- **THEN** 系统 **MUST** 继续执行初始化（包括数据准备与状态写回）
- **AND** 系统 **MUST** 在流程末尾关闭 Loading（例如调用 `setIsLoading(false)`）

#### Scenario: 非 Create 态未传入 configSnapshot 且未 ready 时保持阻塞
- **WHEN** Dashboard 处于非 Create 态
- **AND** 未提供 `configSnapshot`
- **AND** `isGetConfigReady` 尚未就绪
- **THEN** 系统 **MUST** 保持原有阻塞策略（允许提前返回），避免在无配置时初始化

