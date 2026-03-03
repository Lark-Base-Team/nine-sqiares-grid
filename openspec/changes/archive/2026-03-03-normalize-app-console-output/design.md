## Context

当前 `src/App.tsx` 在初始化与数据准备过程中有多处 `console.log`：

- 输出内容不统一（中文说明、分隔符、对象直出混杂）
- 难以按关键词检索与聚合
- 直接输出大对象（如 `datasource`、字段/表对象）导致噪音与潜在信息暴露

## Goals / Non-Goals

**Goals:**
- 统一 `App` 组件日志前缀、事件名与 payload 的结构
- 仅输出排障必要信息（裁剪字段，避免大对象）
- 不通过“开关”控制日志（按需求只规范内容，不新增控制逻辑）

**Non-Goals:**
- 不引入新的日志库/埋点体系
- 不改动 `ConfigPanel`/其他模块的日志
- 不改变业务功能与数据计算行为

## Decisions

### Decision 1: 采用“前缀 + 事件名 + payload”的轻量约定

- 前缀固定为 `"[nine-sqiares-grid][Root]"`（用组件语义命名，避免与 dashboard 概念混淆）
- 事件名采用 `dot.case`（例如 `theme.resolved`、`tables.loaded`、`rendered.notified`）
- payload 使用对象输出，且只包含关键字段（id、数量、状态、耗时等）

### Decision 2: 在 `App.tsx` 内提供轻量日志辅助函数

通过本地小函数封装前缀与 payload 输出，减少手写字符串带来的不一致。
