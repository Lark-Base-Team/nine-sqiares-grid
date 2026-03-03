## 1. 结构拆分（hooks/modules）

- [x] 1.1 梳理 `useDashboardBindings` 的职责边界与最小对外接口（参数/返回值保持不变或最小变更）
- [x] 1.2 拆出 `useDashboardThemeBinding`：只负责主题订阅与主题归一化，不改变现有 side effects
- [x] 1.3 拆出 `useDashboardConfigAndDataBinding`：只负责 config/data 事件订阅、debounce 与触发入口
- [x] 1.4 拆出 Create 态多 Base 初始化逻辑（如 `resolveInitialBaseTokenIfNeeded`），并保持原有时序
- [x] 1.5 将 `useDashboardBindings` 调整为组合层：按固定顺序调用子 hook/函数，并继续“只注册一次”的策略

## 2. 纯逻辑抽取与测试

- [x] 2.1 抽取 `loadAndMergeDashboardConfig` 等纯逻辑（处理 `getConfig()` 返回、合并 store 快照、同步 `dataConditions`）
- [x] 2.2 为纯逻辑补充单测（覆盖：复制模版时 tableId/baseToken 同步、合并优先级、空值兜底）

## 3. 调试日志规范化

- [x] 3.1 统一 DashboardBindings 日志前缀与事件名（`dot.case`），替换分隔符式/无结构日志
- [x] 3.2 日志 payload 结构化并裁剪字段（禁止输出大对象，如完整 config/datasource/table 实例）

## 4. Verify

- [x] 4.1 运行 `pnpm test:run`
- [x] 4.2 运行 `pnpm build`
