## Context

`useDashboardBindings` 目前是一个“聚合型”hook：

- 主题订阅：`dashboard.onThemeChange` → 更新 `datasource.theme`、调用 `onThemeUpdate`、刷新 store。
- 配置/数据订阅：`dashboard.onConfigChange` + `dashboard.onDataChange` → debounce 后统一触发 `getConfig`。
- 配置拉取与合并：在非 Create 态下拉 `dashboard.getConfig()`，并与 store 快照合并，同时处理复制模版下的 `dataConditions` 同步。
- Create 态多 Base 初始化：在 Create 态下（且多 Base）先拿默认 baseToken、切换 `bitableRef.current`，再调用 `initConfigData`。

该结构虽能工作，但职责混杂导致：修改局部逻辑时容易影响其他链路；难以复用；也不利于单测覆盖。

约束：

- **不改变对外行为**：订阅触发时机、debounce、Create/非 Create 分支与 side effects 保持一致。
- **订阅无需清理**：继续沿用“只注册一次”的模式（例如 `hasRegistered*.current`），不引入 unsubscribe/cleanup。
- **调试日志需要规范**：输出可检索、结构化，避免打印大对象。

## Goals / Non-Goals

**Goals:**

- 将 `useDashboardBindings` 拆分为职责单一、可组合的小 hook/函数；外部调用方式尽量不变。
- 把 Create/非 Create、主题/配置等不同链路隔离，降低耦合。
- 规范调试日志：统一前缀与事件名，payload 结构化且裁剪字段。

**Non-Goals:**

- 不改变业务行为与数据含义（仅结构重排与日志规范）。
- 不引入新的第三方日志库/埋点系统。
- 不补齐订阅清理（按约束保持当前策略）。

## Decisions

### Decision 1: 采用“组合 hook + 子 hook”拆分

保留现有对外入口 `useDashboardBindings(params)` 作为组合层，内部拆为：

- `useDashboardThemeBinding(...)`：只负责主题订阅与主题归一化。
- `useDashboardConfigAndDataBinding(...)`：只负责 config/data 事件订阅、debounce 与触发入口。
- `resolveInitialBaseTokenIfNeeded(...)`（或 hook）：只处理 Create 态多 Base 的默认 baseToken 获取与 `bitableRef` 切换。
- `loadAndMergeDashboardConfig(...)`：抽取纯逻辑（从 `dashboard.getConfig()` 结果里读取 `customConfig`/`dataConditions` 并合并），便于单测。

理由：

- 将“订阅”与“拉取/合并/初始化”拆开，减少单个 effect 的分支。
- 子 hook 以最小依赖集工作，降低不必要的 re-render 触发与闭包问题。

备选方案：仅在原文件内用私有函数拆分，但仍保留单个 hook 的多个 useEffect。缺点是可复用性与结构清晰度提升有限。

### Decision 2: 状态读取继续使用 ref，集中成通用 helper

保留用 ref 避免闭包捕获旧值的策略，但抽成 `useLatestRef(value)`（或等价 helper），减少重复代码，并让依赖更明确。

### Decision 3: 调试日志采用“固定前缀 + 事件名 + payload”

为 `useDashboardBindings` 相关链路定义统一前缀（示例：`[nine-sqiares-grid][DashboardBindings]`），事件名采用 `dot.case`（示例：`config.fetch.start`、`config.fetch.done`、`create.baseToken.resolved`）。

payload 只输出必要字段（例如 `dashboardState`、`tableId`、`baseToken` 是否存在、`dataConditionsCount` 等），禁止输出大对象（完整 config、datasource、table 实例等）。

备选方案：完全移除日志。缺点是与“规范调试日志”目标不符，也不利于排障。

## Risks / Trade-offs

- **[回归风险：拆分后调用顺序变化]** → Mitigation：在组合层显式固定调用顺序；保持原先“先 theme，再 config/data”的 effect 语义；补充最小的单测/行为断言（至少覆盖 merge 逻辑）。
- **[依赖数组变化导致重复订阅]** → Mitigation：沿用 `hasRegistered*.current` 只注册一次；确保子 hook 也遵守该约束。
- **[日志规范影响排障习惯]** → Mitigation：事件名保持稳定；payload 保留关键键值（tableId/baseToken/state/counts），保证可检索。

