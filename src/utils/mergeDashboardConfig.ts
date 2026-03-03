import type { IDatasourceConfigType, ITextConfigType } from '../store';

type DashboardSavedConfigLike = {
  customConfig?: {
    datasourceConfig?: Partial<IDatasourceConfigType>;
    textConfig?: Partial<ITextConfigType>;
  };
  dataConditions?: Array<{ tableId?: string; baseToken?: string } & Record<string, unknown>>;
} & Record<string, unknown>;

export function mergeDashboardConfigSnapshot(params: {
  dashboardConfig: DashboardSavedConfigLike;
  datasourceConfigSnapshot: IDatasourceConfigType;
  textConfigSnapshot: ITextConfigType;
}) {
  const { dashboardConfig, datasourceConfigSnapshot, textConfigSnapshot } = params;

  const customConfig = (dashboardConfig?.customConfig ?? {}) as NonNullable<DashboardSavedConfigLike['customConfig']>;
  const datasourceConfigPatch = (customConfig.datasourceConfig ?? {}) as Partial<IDatasourceConfigType>;
  const textConfigPatch = (customConfig.textConfig ?? {}) as Partial<ITextConfigType>;

  // 复制模版时， customConfig 中的数据不会被动态替换，会导致 tableId/baseToken 不对。
  // 这里按原行为：用 dataConditions 的首条条件同步覆盖。
  const firstCondition = Array.isArray(dashboardConfig?.dataConditions)
    ? dashboardConfig!.dataConditions![0]
    : undefined;

  const syncedDatasourceConfigPatch: Partial<IDatasourceConfigType> = {
    ...datasourceConfigPatch,
  };
  if (firstCondition?.tableId) {
    syncedDatasourceConfigPatch.tableId = firstCondition.tableId;
  }
  if (firstCondition?.baseToken) {
    syncedDatasourceConfigPatch.baseToken = firstCondition.baseToken;
  }

  return {
    mergedDatasourceConfig: {
      ...datasourceConfigSnapshot,
      ...syncedDatasourceConfigPatch,
    } as IDatasourceConfigType,
    mergedTextConfig: {
      ...textConfigSnapshot,
      ...textConfigPatch,
    } as ITextConfigType,
  };
}

