## Why

当前 `App` 在非 Create 态初始化时存在竞态：配置已通过 `configSnapshot` 传入，但 `isGetConfigReady` 仍未同步更新，导致 `initConfigData` 在 `src/App.tsx` 内提前 `return`，从而无法执行 `setIsLoading(false)`，页面持续处于 Loading。

## What Changes

- 调整 `initConfigData` 的 gate 条件：当已传入 `configSnapshot` 时，非 Create 态不应因 `isGetConfigReady === false` 提前返回。
- 保持既有行为不变：仍然在未准备好配置且未传入快照时阻止初始化，避免无配置初始化导致异常。

## Capabilities

### New Capabilities
- `app-init-loading-guard`: 规范 `initConfigData` 的初始化 gate 规则，确保非 Create 态在已具备配置快照时不会卡在 Loading。

### Modified Capabilities
<!-- 这是初始化健壮性修复，不改变用户可见功能行为，不修改既有 capability 的需求。 -->

## Impact

- `src/App.tsx`: 调整 `initConfigData` 的 early-return 条件。

