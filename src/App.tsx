import React, { useCallback, useEffect, useRef, useState } from 'react';
import { dashboard as dashboardSdk, DashboardState, bitable as bitableSdk, bridge, workspace} from "@lark-base-open/js-sdk";
import { IDatasourceConfigType, useDatasourceConfigStore, useDatasourceStore, useTextConfigStore } from './store';
import { TableDataGroupHelper } from "./utils/tableDataGroupHelper";
import { createConsoleLogger } from './utils/consoleLogger';
import { deriveDatasourceConfigFromFields } from './utils/deriveDatasourceConfigFromFields';
import { useDashboardBindings } from './hooks/useDashboardBindings';
import { LoadingView, MainView, NotSupportedView } from './components/appViews';

// 说明：这里的前缀使用组件语义（Root），避免与 dashboard 概念混淆。
const logger = createConsoleLogger('[nine-sqiares-grid][Root]');

function App() {

    const { datasource, updateDatasource } = useDatasourceStore((state) => state);

    // 类型与数据
    const { datasourceConfig, updateDatasourceConfig } = useDatasourceConfigStore((state) => state);

    // 样式配置数据
    const { textConfig, updateTextConfig } = useTextConfigStore((state) => state);

    const [isLoading, setIsLoading] = useState(true)
    const [progress, setProgress] = useState<{ total: number; current: number; notSupport?: boolean }>({ total: 0, current: 0 });
    const [isMultipleBase, setIsMultipleBase] = useState<boolean | undefined>(undefined);
    const [isGetConfigReady, setIsGetConfigReady] = useState<boolean>(false);

    const bitableRef = useRef<typeof bitableSdk | null>(bitableSdk);
    const dashboard = bitableRef.current?.dashboard || dashboardSdk;
    const hasInit  = useRef<boolean>(false);

    useEffect(() => {
        (async () => {
            const env = await bridge.getEnv();
            setIsMultipleBase(env.needChangeBase ?? false);
        })();
    }, []);

    // 获取表格列表
    const getTableList = useCallback((tableIdList: any) => {
        return tableIdList.map(async (table: any) => {
            const name = await table.getName();
            return {
                tableName: name,
                tableId: table.id,
            };
        });
    }, []);

    const dataHelper = new TableDataGroupHelper({ setProgress, bitableRef })

    // 依据当前配置内容，准备组件渲染数据
    async function initConfigData(id: string | null, baseToken?: string, configSnapshot?: IDatasourceConfigType) {
        //LIGHT = "LIGHT", DARK = "DARK"
        if (!bitableRef.current) {
            return;
        }
        const base = bitableRef.current.base;
        const dashboard = bitableRef.current.dashboard;
        const isCreate = dashboard?.state === DashboardState.Create;
        const isConfig = dashboard?.state === DashboardState.Config;
        const theme = await dashboard.getTheme()
        if (theme.theme === 'LIGHT') {
            datasource.theme = 'light'
        } else {
            datasource.theme = 'dark'
        }
        logger.info('theme.resolved', {
            theme: theme?.theme,
            dashboardState: dashboard?.state,
        });
        updateTheme(theme.theme.toLocaleLowerCase())
         // 说明：非 Create 态下，如果已经传入 configSnapshot，说明配置已就绪，
         // 不应被 isGetConfigReady 的异步更新竞态阻塞，否则会导致持续 Loading。
         if(!configSnapshot && !isGetConfigReady && dashboard?.state !== DashboardState.Create) {
            return;
        }
        const baseConfig = configSnapshot ?? datasourceConfig;
        let nextConfig: IDatasourceConfigType = {
            ...baseConfig,
            horizontalCategories: { ...baseConfig.horizontalCategories },
            verticalCategories: { ...baseConfig.verticalCategories },
        };

        let tableId = id ?? '';
        let tableList: any[] = [];
        if (isCreate || isConfig) {
            const tableIdList = await base.getTableList();
            // console.log('获取表 id 列表: ',tableIdList)
            tableList = await Promise.all(getTableList(tableIdList));
            logger.info('tables.loaded', {
                dashboardState: dashboard?.state,
                tableCount: tableList.length,
            });
            datasource.tables = [...tableList];
        }
        const isTableValid = id && tableList.find(t => t.tableId === id);
        const availableInfo = !isTableValid ? await dataHelper.findAvailableTableForRender(tableList, 0) : undefined;
        if (!isTableValid && availableInfo?.tableId) {
            logger.warn('table.fallback', {
                requestedTableId: id ?? '',
                resolvedTableId: availableInfo.tableId,
                fieldsCount: availableInfo.fields.length,
            });
        }
        if (availableInfo && availableInfo.tableId) {
            // config render data
            tableId = availableInfo.tableId;
            datasource.fields[availableInfo.tableId] = availableInfo.fields
            nextConfig = deriveDatasourceConfigFromFields(availableInfo.fields, nextConfig)
        }

        logger.info('config.snapshot', {
            tableId: nextConfig.tableId,
            dataRange: nextConfig.dataRange,
            personnelField: nextConfig.personnelField,
            horizontalField: nextConfig.horizontalField,
            verticalField: nextConfig.verticalField,
            groupField: nextConfig.groupField,
        });
        datasource.tableId = tableId;
        nextConfig.tableId = tableId

        if (!datasource.fields[tableId] || datasource.fields[tableId].length === 0) {
            if (tableId) {
                const table = await base.getTable(tableId);
                logger.info('table.loaded', {
                    tableId,
                });
                const fields = await table.getFieldMetaList()
                datasource.fields[tableId] = [...fields];
            } else {
                datasource.fields[tableId] = [];
            }
        }

        logger.info('fields.resolved', {
            tableId,
            fieldsCount: datasource.fields?.[tableId]?.length ?? 0,
        });
        if (tableId) {
            const tableDataRange: any[] = await dashboard.getTableDataRange(tableId)
            datasource.dataRanges[tableId] = tableDataRange.map(item => ({
                type: item.type,
                viewId: item.viewId,
                viewName: item.viewName
            }))
        }

        // 创建链路默认选中全部数据
        if(!nextConfig.dataRange) nextConfig.dataRange = 'All';

        logger.info('dataRanges.resolved', {
            tableId,
            dataRangeCount: datasource.dataRanges?.[tableId]?.length ?? 0,
            selectedDataRange: nextConfig.dataRange,
        });
        // 如果不是创建面板，则根据 自定义配置组装数据
        if (dashboard.state !== DashboardState.Create ||
            (nextConfig.tableId && nextConfig.personnelField && nextConfig.horizontalField && nextConfig.verticalField)
        ) {
            if (tableId) {
                await dataHelper.prepareData(tableId, datasource, nextConfig)
                updateDatasource({ ...(datasource as any) })
            }
        }

        const resolvedBaseToken = baseToken ?? nextConfig.baseToken;
        updateDatasourceConfig({ ...nextConfig, baseToken: resolvedBaseToken })
        logger.info('data.prepared', {
            tableId,
            totalRowCount: datasource.totalRowCount,
        });
        // 强制刷新
        setIsLoading(false)
        hasInit.current = true;

        // 渲染完通知 宿主
        setTimeout(() => {
            dashboard.setRendered().then( res => {
                logger.info('rendered.notified', { res });
            })
        }, 1000);
    }

    function updateTheme(theme: string) {
        document.body.setAttribute('theme-mode', theme);
    }

    useDashboardBindings({
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
        onThemeUpdate: updateTheme,
    });

    useEffect(() => {
       (async () => {
            if (!hasInit.current) {
                return;
            }
            const realBitable = isMultipleBase
                ? await workspace.getBitable(datasourceConfig.baseToken!)
                : bitableSdk;
            bitableRef.current = realBitable;
            await initConfigData(null, datasourceConfig.baseToken, datasourceConfig);
        })()
    }, [datasourceConfig.baseToken, isMultipleBase]);

    if (isLoading) {
        return <LoadingView progress={progress} theme={datasource.theme} />;
    }
    if (progress.notSupport) {
        return <NotSupportedView theme={datasource.theme} />;
    }
    return <MainView dashboardState={dashboard?.state} datasource={datasource} isMultipleBase={isMultipleBase} bitableRef={bitableRef} />;
}

export default App
