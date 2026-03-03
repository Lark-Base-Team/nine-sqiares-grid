## Why

`src/App.tsx` 里存在大量 `console.log`：输出内容不一致、夹杂分隔符/调试字符串，并且会直接打印较大的对象（如 `datasource`、字段列表、表对象等）。这会让线上排障时难以检索关键信息，也可能造成不必要的信息暴露与控制台噪音。

## What Changes

- 统一 `App` 组件日志的格式：固定命名空间前缀 + 事件名 + 结构化 payload。
- 用更合适的日志级别（`console.info`/`console.warn`/`console.error`），避免混用。
- 避免输出大对象与不稳定字段，只保留排障所需的关键键值（如 `tableId`、数量统计、状态等）。
- 移除分隔符式的“装饰性日志”，改为可检索的事件日志。

## Capabilities

### New Capabilities
- `app-console-logging`: 规范 `App` 组件的控制台日志输出格式与内容（前缀、事件名、payload 结构、字段裁剪）。

### Modified Capabilities
<!-- 本次为内部日志规范化，不改变对外功能行为；不修改既有 capability 的需求。 -->

## Impact

- `src/App.tsx`：替换并规范多处控制台日志输出。

