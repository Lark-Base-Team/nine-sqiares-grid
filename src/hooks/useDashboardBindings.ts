import { useEffect, useRef } from 'react';
import { debounce } from 'lodash-es';
import { DashboardState, workspace as workspaceSdk } from '@lark-base-open/js-sdk';

import type { IDatasourceConfigType, ITextConfigType } from '../store';

type DashboardLike = {
  state?: DashboardState;
  getConfig?: () => Promise<any>;
  onConfigChange?: (cb: () => void) => void;
  onDataChange?: (cb: () => void) => void;
  onThemeChange?: (cb: (event: any) => void) => void;
};

/**
 * 绑定 Dashboard 事件 + 拉取配置（含 debounce）。
 *
 * 目标：把 App.tsx 中与「宿主事件订阅/配置拉取」相关的代码集中到一个 hook，减少组件体积。
 */
export function useDashboardBindings(params: {
  dashboard: DashboardLike;
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
    dashboard,
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

  // 避免闭包捕获旧值：用 ref 保持最新 store 状态
  const datasourceConfigRef = useRef<IDatasourceConfigType>(datasourceConfig);
  const textConfigRef = useRef<ITextConfigType>(textConfig);
  useEffect(() => {
    datasourceConfigRef.current = datasourceConfig;
  }, [datasourceConfig]);
  useEffect(() => {
    textConfigRef.current = textConfig;
  }, [textConfig]);

  // 避免重复注册监听（原实现 useEffect 依赖变化会反复注册）
  const hasRegisteredTheme = useRef(false);
  const hasRegisteredConfig = useRef(false);

  useEffect(() => {
    if (hasRegisteredTheme.current) return;
    hasRegisteredTheme.current = true;

    dashboard?.onThemeChange?.((theme: any) => {
      // theme.data.theme: 'LIGHT' | 'DARK'
      const next = theme?.data?.theme;
      if (next === 'LIGHT') {
        datasource.theme = 'light';
      } else {
        datasource.theme = 'dark';
      }
      onThemeUpdate(String(next ?? '').toLocaleLowerCase());
      updateDatasource({ ...(datasource as any) });
    });
  }, [dashboard, datasource, onThemeUpdate, updateDatasource]);

  useEffect(() => {
    // 等 env 初始化完 isMultipleBase，再开始绑定 config 相关逻辑
    if (isMultipleBase === undefined) return;
    if (hasRegisteredConfig.current) return;
    hasRegisteredConfig.current = true;

    const getConfig = async (p: any) => {
      console.log('========1get config', p);

      // 先获取保存的配置数据
      if (dashboard?.state !== DashboardState.Create) {
        const config = await dashboard?.getConfig?.();
        if (!config) return;

        const customConfig: any = config.customConfig;
        const dataConditions: any[] = config.dataConditions;

        // 复制模版时， customConfig 中的数据不会被动态替换，这会导致复制模版获取的 table id 不对。这里手动做下同步
        if (Array.isArray(dataConditions) && dataConditions.length > 0) {
          const firstCondition = dataConditions[0] as any;
          if (firstCondition?.tableId) {
            customConfig.datasourceConfig.tableId = firstCondition.tableId;
          }
          if (firstCondition?.baseToken) {
            customConfig.datasourceConfig.baseToken = firstCondition.baseToken;
          }
        }

        const mergedDatasourceConfig = {
          ...datasourceConfigRef.current,
          ...customConfig.datasourceConfig,
        } as IDatasourceConfigType;
        console.log(
          '获取到 config start========：',
          config,
          textConfigRef.current,
          datasourceConfigRef.current,
          mergedDatasourceConfig,
        );

        updateDatasourceConfig(mergedDatasourceConfig);
        updateTextConfig({ ...textConfigRef.current, ...customConfig.textConfig } as ITextConfigType);
        setIsGetConfigReady(true);
        console.log('获取到 config end=====：', config, mergedDatasourceConfig);
        await initConfigData(mergedDatasourceConfig.tableId, mergedDatasourceConfig.baseToken, mergedDatasourceConfig);
        return;
      }

      // Create 态：多 Base 场景下先拿默认 base token
      const getBaseToken = async () => {
        if (!isMultipleBase) return undefined;
        const baseList = await workspaceSdk.getBaseList({
          query: '',
          page: { cursor: '' },
        });
        const initialBaseToken = baseList?.base_list?.[0]?.token || '';
        const realBitable = await workspaceSdk.getBitable(initialBaseToken);
        bitableRef.current = realBitable;
        return initialBaseToken;
      };

      const initialBaseToken = await getBaseToken();
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
  }, [bitableRef, dashboard, initConfigData, isMultipleBase, setIsGetConfigReady, updateDatasourceConfig, updateTextConfig]);
}

