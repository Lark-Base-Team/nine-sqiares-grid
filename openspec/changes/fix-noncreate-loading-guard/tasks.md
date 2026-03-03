## 1. Fix

- [x] 1.1 调整 `src/App.tsx` 中 `initConfigData` 的 early-return gate：有 `configSnapshot` 时非 Create 态不 return

## 2. Verify

- [x] 2.1 运行 `pnpm test:run`
- [x] 2.2 运行 `pnpm build`
