## Context

`initConfigData` 内部当前用 `isGetConfigReady` 作为非 Create 态的 gate：当 `isGetConfigReady` 为 false 时直接 return。

但配置拉取链路中（例如 `useDashboardBindings`）通常会先 `setIsGetConfigReady(true)`，再立刻调用 `initConfigData(..., configSnapshot)`。由于 state 更新异步，`initConfigData` 执行时仍可能读到旧值 false，导致提前返回，并使 `setIsLoading(false)` 永远不执行，从而页面持续 Loading。

## Goals / Non-Goals

**Goals:**

- 在非 Create 态下，只要 `initConfigData` 已拿到确定的配置快照（`configSnapshot`），就不应被 `isGetConfigReady` 阻塞。
- 维持原本“无配置时不初始化”的保护逻辑。

**Non-Goals:**

- 不调整配置拉取/订阅链路，不引入额外的异步调度（如 setTimeout/microtask）。
- 不重构状态管理，仅做最小改动修复卡死。

## Decisions

- 采用方案 A：将 gate 条件改为“仅当未提供 `configSnapshot` 且 `isGetConfigReady` 未就绪时才提前返回”。
- 这样 `configSnapshot` 作为“配置已就绪”的强信号，可绕开 state 更新竞态。

## Risks / Trade-offs

- **[configSnapshot 为空/不完整]** → Mitigation：保持原保护逻辑：仅在 `configSnapshot` truthy 时绕开 gate；否则仍阻塞。

