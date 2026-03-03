## ADDED Requirements

### Requirement: DashboardBindings 拆分后行为保持一致

在对 `useDashboardBindings` 进行职责拆分与重构后，系统 **MUST** 保持现有对外行为与时序一致，不引入额外的订阅清理逻辑。

#### Scenario: 主题变化时更新主题并触发渲染刷新
- **WHEN** Dashboard 触发主题变更事件（如 `LIGHT`/`DARK`）
- **THEN** 系统 **MUST** 将主题归一化为小写字符串并调用主题更新回调（例如 `"light"`/`"dark"`）
- **AND** 系统 **MUST** 同步更新 datasource 的主题字段并触发一次 store 更新以刷新视图

#### Scenario: 非 Create 态拉取并合并配置后触发初始化
- **WHEN** Dashboard 处于非 Create 状态且触发配置变更或数据变更
- **THEN** 系统 **MUST** 以 debounce 方式合并触发配置处理流程（避免高频重复执行）
- **AND** 系统 **MUST** 从 Dashboard 获取保存的配置并与当前 store 快照合并后写回 store
- **AND** 系统 **MUST** 使用合并后的快照调用初始化函数（如 `initConfigData(tableId, baseToken, mergedConfig)`）

#### Scenario: Create 态多 Base 时初始化默认 BaseToken
- **WHEN** Dashboard 处于 Create 状态且处于多 Base 环境
- **THEN** 系统 **MUST** 获取默认的 `baseToken` 并切换 `bitableRef.current` 到对应的 bitable 实例
- **AND** 系统 **MUST** 以该 `baseToken` 触发初始化流程（如 `initConfigData(null, baseToken, snapshot)`）

#### Scenario: 订阅只注册一次且无需清理
- **WHEN** hook 运行并完成事件订阅注册
- **THEN** 系统 **MUST** 确保同类订阅只注册一次（避免因依赖变化反复注册）
- **AND** 系统 **MUST NOT** 引入 unsubscribe/cleanup 逻辑（按约束保持现状）

### Requirement: 调试日志输出规范化

DashboardBindings 相关的调试日志 **MUST** 具备一致、可检索、结构化且信息裁剪合理的格式。

#### Scenario: 统一前缀与事件名
- **WHEN** 输出 DashboardBindings 相关调试日志
- **THEN** 日志 message **MUST** 以固定前缀开头（例如 `"[nine-sqiares-grid][DashboardBindings]"`）
- **AND** message **MUST** 包含稳定的事件名（`dot.case`，例如 `config.fetch.start`）

#### Scenario: payload 结构化且不输出大对象
- **WHEN** 日志需要携带上下文信息
- **THEN** payload **MUST** 以对象形式输出（例如 `{ dashboardState, tableId }`）
- **AND** payload **MUST NOT** 包含大对象或不稳定对象（如完整 `config`、`datasource`、table 实例等）

