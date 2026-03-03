## Why

`src/hooks/useDashboardBindings.ts` 当前同时承载主题订阅、配置拉取与合并、数据变更/配置变更订阅、Create 态多 Base 初始化等多条链路，导致职责混杂、阅读成本高、后续迭代容易引入回归。需要在不改变现有功能行为的前提下拆分职责，并规范调试日志输出，提升可维护性。

## What Changes

- 将 `useDashboardBindings` 按职责拆分为更小的 hook/模块（例如：主题订阅、配置与数据订阅、Create 态多 Base 初始化），由一个组合层负责组装调用。
- 保持现有行为不变：事件订阅时机、debounce 行为、Create/非 Create 分支逻辑保持一致；并明确“订阅无需清理”的约束（仍通过一次性注册/防重复注册保障）。
- 规范调试日志：统一前缀与事件名，输出结构化 payload，避免打印大对象与噪音分隔符；必要时用合适的日志级别区分 info/warn/error。

## Capabilities

### New Capabilities
- `dashboard-bindings-refactor`: 将 Dashboard 事件绑定逻辑拆分为更清晰的职责单元，并提供一致的调试日志规范（不改变对外行为）。

### Modified Capabilities
<!-- 本次为内部结构与日志规范调整，不改变既有对外功能行为；如后续确认存在行为级变更，再补充对应 capability 的 delta spec。 -->

## Impact

- `src/hooks/useDashboardBindings.ts`：重构为组合层，职责下沉到更小的 hook/模块。
- `src/hooks/*`：新增/调整拆分后的 hook 文件（例如 theme/config/data 等）。
- （可选）`src/utils/*`：提取日志工具函数，统一日志格式。

