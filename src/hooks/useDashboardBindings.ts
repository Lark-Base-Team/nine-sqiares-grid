import { useEffect, useRef } from 'react';
import { debounce } from 'lodash-es';
import { DashboardState, dashboard as dashboardSdk, workspace as workspaceSdk } from '@lark-base-open/js-sdk';

import type { IDatasourceConfigType, ITextConfigType } from '../store';
import { createConsoleLogger } from '../utils/consoleLogger';
import { mergeDashboardConfigSnapshot } from '../utils/mergeDashboardConfig';

type DashboardLike = {
  state?: DashboardState;
  getConfig?: () => Promise<any>;
  onConfigChange?: (cb: () => void) => void;
  onDataChange?: (cb: () => void) => void;
  onThemeChange?: (cb: (event: any) => void) => void;
};

function useLatestRef<T>(value: T) {
  const ref = useRef<T>(value);
  useEffect(() => {
    ref.current = value;
  }, [value]);
  return ref;
}

function normalizeTheme(next: unknown) {
  // theme.data.theme: 'LIGHT' | 'DARK'
  if (next === 'LIGHT') {
    return { datasourceTheme: 'light' as const, normalized: 'light' };
  }
  return { datasourceTheme: 'dark' as const, normalized: String(next ?? '').toLocaleLowerCase() };
}

function useDashboardThemeBinding(params: {
  dashboard: DashboardLike;
  datasource: any;
  onThemeUpdate: (theme: string) => void;
  updateDatasource: (next: any) => void;
  hasRegisteredTheme: React.MutableRefObject<boolean>;
  logger: ReturnType<typeof createConsoleLogger>;
}) {
  const { dashboard, datasource, onThemeUpdate, updateDatasource, hasRegisteredTheme, logger } = params;

  useEffect(() => {
    if (hasRegisteredTheme.current) return;
    hasRegisteredTheme.current = true;

    dashboard?.onThemeChange?.((theme: any) => {
      const next = theme?.data?.theme;
      const normalized = normalizeTheme(next);
      datasource.theme = normalized.datasourceTheme;
      onThemeUpdate(normalized.normalized);
      updateDatasource({ ...(datasource as any) });

      logger.info('theme.changed', {
        next,
        normalized: normalized.normalized,
      });
    });
  }, [dashboard, datasource, hasRegisteredTheme, logger, onThemeUpdate, updateDatasource]);
}

async function resolveInitialBaseTokenIfNeeded(params: {
  isMultipleBase: boolean;
  bitableRef: React.MutableRefObject<any>;
  logger: ReturnType<typeof createConsoleLogger>;
}) {
  const { isMultipleBase, bitableRef, logger } = params;
  if (!isMultipleBase) return undefined;

  logger.info('create.baseToken.resolve.start');
  const baseList = await workspaceSdk.getBaseList({
    query: '',
    page: { cursor: '' },
  });
  const initialBaseToken = baseList?.base_list?.[0]?.token || '';
  const realBitable = await workspaceSdk.getBitable(initialBaseToken);
  bitableRef.current = realBitable;
  logger.info('create.baseToken.resolve.done', {
    hasBaseToken: Boolean(initialBaseToken),
  });
  return initialBaseToken;
}

function useDashboardConfigAndDataBinding(params: {
  bitableRef: React.MutableRefObject<any>;
  dashboard: DashboardLike;
  isMultipleBase: boolean | undefined;
  datasourceConfigRef: React.MutableRefObject<IDatasourceConfigType>;
  textConfigRef: React.MutableRefObject<ITextConfigType>;
  updateDatasourceConfig: (next: IDatasourceConfigType) => void;
  updateTextConfig: (next: ITextConfigType) => void;
  setIsGetConfigReady: (next: boolean) => void;
  initConfigData: (id: string | null, baseToken?: string, configSnapshot?: IDatasourceConfigType) => Promise<void>;
  hasRegisteredConfig: React.MutableRefObject<boolean>;
  logger: ReturnType<typeof createConsoleLogger>;
}) {
  const {
    bitableRef,
    dashboard,
    isMultipleBase,
    datasourceConfigRef,
    textConfigRef,
    updateDatasourceConfig,
    updateTextConfig,
    setIsGetConfigReady,
    initConfigData,
    hasRegisteredConfig,
    logger,
  } = params;

  useEffect(() => {
    // 等 env 初始化完 isMultipleBase，再开始绑定 config 相关逻辑
    if (isMultipleBase === undefined) return;
    if (hasRegisteredConfig.current) return;
    hasRegisteredConfig.current = true;

    const getConfig = async (source: number) => {
      logger.info('config.fetch.trigger', {
        source,
        dashboardState: dashboard?.state,
      });

      // 先获取保存的配置数据
      if (dashboard?.state !== DashboardState.Create) {
        const config = await dashboard?.getConfig?.();
        if (!config) {
          logger.warn('config.fetch.empty');
          return;
        }

        const dataConditionsCount = Array.isArray(config?.dataConditions) ? config.dataConditions.length : 0;
        const { mergedDatasourceConfig, mergedTextConfig } = mergeDashboardConfigSnapshot({
          dashboardConfig: config,
          datasourceConfigSnapshot: datasourceConfigRef.current,
          textConfigSnapshot: textConfigRef.current,
        });

        logger.info('config.merge.done', {
          tableId: mergedDatasourceConfig.tableId,
          hasBaseToken: Boolean(mergedDatasourceConfig.baseToken),
          dataRange: mergedDatasourceConfig.dataRange,
          dataConditionsCount,
        });

        updateDatasourceConfig(mergedDatasourceConfig);
        updateTextConfig(mergedTextConfig);
        setIsGetConfigReady(true);
        await initConfigData(mergedDatasourceConfig.tableId, mergedDatasourceConfig.baseToken, mergedDatasourceConfig);
        return;
      }

      // Create 态：多 Base 场景下先拿默认 base token
      const initialBaseToken = await resolveInitialBaseTokenIfNeeded({
        isMultipleBase: Boolean(isMultipleBase),
        bitableRef,
        logger,
      });

      await initConfigData(null, initialBaseToken, {
        ...datasourceConfigRef.current,
        baseToken: initialBaseToken,
      } as IDatasourceConfigType);
    };

    const debouncedGetConfig = debounce(getConfig, 500, {
      leading: false,
      trailing: true,
    });

    debouncedGetConfig(1);
    dashboard?.onConfigChange?.(() => debouncedGetConfig(2));
    dashboard?.onDataChange?.(() => debouncedGetConfig(3));
  }, [bitableRef, dashboard, datasourceConfigRef, hasRegisteredConfig, initConfigData, isMultipleBase, logger, setIsGetConfigReady, textConfigRef, updateDatasourceConfig, updateTextConfig]);
}

/**
 * 绑定 Dashboard 事件 + 拉取配置（含 debounce）。
 *
 * 目标：把 App.tsx 中与「宿主事件订阅/配置拉取」相关的代码集中到一个 hook，减少组件体积。
 */
export function useDashboardBindings(params: {
  bitableRef: React.MutableRefObject<any>;
  isMultipleBase: boolean | undefined;
  datasource: any;
  datasourceConfig: IDatasourceConfigType;
  textConfig: ITextConfigType;
  updateDatasource: (next: any) => void;
  updateDatasourceConfig: (next: IDatasourceConfigType) => void;
  updateTextConfig: (next: ITextConfigType) => void;
  setIsGetConfigReady: (next: boolean) => void;
  initConfigData: (id: string | null, baseToken?: string, configSnapshot?: IDatasourceConfigType) => Promise<void>;
  onThemeUpdate: (theme: string) => void;
}) {
  const {
    bitableRef,
    isMultipleBase,
    datasource,
    datasourceConfig,
    textConfig,
    updateDatasource,
    updateDatasourceConfig,
    updateTextConfig,
    setIsGetConfigReady,
    initConfigData,
    onThemeUpdate,
  } = params;

  // 多 Base 场景下优先用 bitableRef.current?.dashboard；默认用 SDK 导出的实例；
  const dashboard: DashboardLike = bitableRef.current?.dashboard ?? dashboardSdk;

  // 职责边界：
  // - theme：订阅主题变化并同步 datasource/theme + 回调
  // - config/data：订阅 config/data 变化，debounce 拉取并合并配置，触发 initConfigData
  // - create + multiple base：在 Create 态首次初始化默认 baseToken 并切换 bitableRef.current
  // 约束：订阅无需清理（只注册一次）；行为/时序与现有实现保持一致。
  const logger = createConsoleLogger('[nine-sqiares-grid][DashboardBindings]');

  // 避免闭包捕获旧值：用 ref 保持最新 store 状态
  const datasourceConfigRef = useLatestRef<IDatasourceConfigType>(datasourceConfig);
  const textConfigRef = useLatestRef<ITextConfigType>(textConfig);

  // 避免重复注册监听
  const hasRegisteredTheme = useRef(false);
  const hasRegisteredConfig = useRef(false);

  // 1) theme binding
  useDashboardThemeBinding({
    dashboard,
    datasource,
    onThemeUpdate,
    updateDatasource,
    hasRegisteredTheme,
    logger,
  });

  // 2) config/data binding + create init
  useDashboardConfigAndDataBinding({
    bitableRef,
    dashboard,
    isMultipleBase,
    datasourceConfigRef,
    textConfigRef,
    updateDatasourceConfig,
    updateTextConfig,
    setIsGetConfigReady,
    initConfigData,
    hasRegisteredConfig,
    logger,
  });
}
