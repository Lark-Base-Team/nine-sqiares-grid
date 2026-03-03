## Purpose

Define consistent, searchable, and appropriately-trimmed console logging for the `App` component.

## Requirements

### Requirement: App 控制台日志规范化

`App` 组件在关键生命周期与数据准备链路中输出的控制台日志，**MUST** 具备一致、可检索、信息裁剪合理的格式，避免输出大对象与无意义分隔符。

#### Scenario: 输出统一前缀与事件名

- **WHEN** `App` 组件输出日志（如：主题获取、表列表加载、可用表兜底、数据准备完成、通知宿主渲染完成）
- **THEN** 日志 message **MUST** 以固定前缀开头：`[nine-sqiares-grid][Root]`
- **AND** message **MUST** 包含稳定的事件名（如 `theme.resolved`、`tables.loaded` 等）

#### Scenario: 输出结构化 payload 且裁剪字段

- **WHEN** 日志需要携带上下文信息
- **THEN** payload **MUST** 以对象形式输出（例如 `{ tableId, dashboardState, fieldsCount }`）
- **AND** payload **MUST NOT** 直接包含巨大/不稳定对象（如 `datasource`、表对象、字段完整列表、完整 config 快照）

#### Scenario: 使用合适日志级别

- **WHEN** 输出普通流程信息
- **THEN** **MUST** 使用 `console.info`
- **AND** 在异常但可恢复/可降级的情况下 **MUST** 使用 `console.warn`（如：选中的表不可用，触发兜底逻辑）
