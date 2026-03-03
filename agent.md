# nine-sqiares-grid Agent 指南

本文件用于让自动化编码 Agent（或新加入的开发者）快速理解本项目的结构、关键链路与常见改动点。

## 项目概览

- 这是一个基于 `Vite + React + TypeScript` 的九宫格（9 cells）可视化组件。
- 运行在飞书多维表格 Dashboard 插件环境中，依赖 `@lark-base-open/js-sdk` 获取表、字段与记录，并在配置面板中保存配置。
- 核心逻辑分为两块：
  - **配置与数据准备**：选择表/字段/分类/分组 → 计算 9 个格子的展示数据。
  - **渲染**：读取 store 中的数据与文案配置，渲染九宫格与轴标签。

## 常用命令

- 开发：`pnpm dev`
- 构建：`pnpm build`
- 预览：`pnpm preview`
- 测试（watch）：`pnpm test`
- 测试（CI 一次性）：`pnpm test:run`

## 目录与关键文件

- UI 入口
  - `src/main.tsx`：挂载 React
  - `src/App.tsx`：应用壳
- 九宫格渲染
  - `src/components/nineSquaresGrid/nineSquaresGrid.tsx`：九宫格 UI（9 个 cell、轴标题、暗黑/明亮主题适配）
- 配置面板
  - `src/components/configPanel/configPanel.tsx`：数据源选择、字段选择、分类与分组、保存配置、预览刷新
- 数据计算（最重要的可测部分）
  - `src/utils/tableDataGroupHelper.tsx`：拉取记录、筛选格子、分组、计算 total/percent/list
  - `src/utils/data.ts`：分页拉取记录（移动端总数过大时会提前返回并标记不支持）
- 状态管理
  - `src/store/index.tsx`：`zustand` stores（datasource / datasourceConfig / textConfig 等）
- 国际化
  - `src/i18n.ts` + `public/locales/*/translation.json`

## 核心数据流（建议理解）

1) 配置面板选择表与字段（人员字段、横轴字段、竖轴字段、可选分组字段、横纵轴分类 optionIds）。
2) `ConfigPanel` 调用 `TableDataGroupHelper.prepareData(tableId, datasource, snapshot)` 计算数据。
3) `prepareData` 将结果写入 `datasource.*Value`（如 `leftUpValue` / `rightUpValue` 等），并通过 store 更新触发 UI 渲染。
4) `NineSquaresGrid` 读取 `datasource` 与 `textConfig` 渲染：
   - cell 右上角 `total, percent%` 直接来自 `datasource[xxx].total/percent`
   - percent 计算逻辑在 `mapRecordByDisplayInfo`：对 `(total / totalRowCount) * 100` 向下取整保留 2 位（非四舍五入）。

## 数据计算规则摘要（TableDataGroupHelper）

- **记录范围**：`loadAllRecordsForTable` 会根据 `dataRange/viewId` 过滤；在 Dashboard 配置/创建态为性能只取前 400 行。
- **格子筛选**：按竖轴 optionIds（up/middle/down）与横轴 optionIds（left/middle/right）做交集筛选。
- **可选分组**：若配置了 `groupField`，会生成可选分组文本并对每个格子内记录按文本值分别筛到不同分组。
- **展示映射**：把记录映射为 `{ category, persons: string[] }[]`，并计算：
  - `total = persons.length`（所有分组合并后的人名数）
  - `percent = floor((total * 100) / totalRowCount, 2)`（向下取整两位小数）

## 测试策略与约定

- 优先覆盖纯逻辑：如`src/utils/tableDataGroupHelper.tsx`。
- 本项目已接入 `Vitest`，建议：
  - 单元测试覆盖 `groupTextsFor` / `groupRecordsByInfo` / `filterRecordsByInfo` / `mapRecordByDisplayInfo`
  - 集成测试覆盖 `prepareData`（mock `base.getTable()`、mock `loadAllRecordsForTable()`，断言 9 格写入结果）
- 现有示例：`src/utils/tableDataGroupHelper.test.ts`

## 与 Lark SDK 交互的注意点

- `ConfigPanel` 与 `TableDataGroupHelper` 会优先使用外部传入的 `bitableRef.current`（支持多 Base 切换），否则退回 SDK 默认导入。
- UI/配置态依赖 `dashboard.state`（`DashboardState.View/Config/Create`），涉及数据量与边界行为时需考虑状态差异。

## Agent 改动建议（常见任务）

- 改“计算逻辑/边界行为”：优先改 `src/utils/tableDataGroupHelper.tsx` 并补测试。
- 改“展示与样式”：改 `src/components/nineSquaresGrid/*`，必要时补视觉回归或组件测试。
- 改“配置交互/校验”：改 `src/components/configPanel/*`，尽量通过 mock store + mock sdk 写可复现测试。

