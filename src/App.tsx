import React, { useCallback, useEffect, useRef, useState } from 'react';
import { dashboard as dashboardSdk, DashboardState, bitable as bitableSdk, bridge, workspace} from "@lark-base-open/js-sdk";
import { IDatasourceConfigType, useDatasourceConfigStore, useDatasourceStore, useTextConfigStore } from './store';
import { TableDataGroupHelper } from "./utils/tableDataGroupHelper";
import { useDashboardBindings } from './hooks/useDashboardBindings';
import { LoadingView, MainView, NotSupportedView } from './components/appViews';

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

    function configRenderData(fields: any[], config: IDatasourceConfigType): IDatasourceConfigType {
        const nextConfig: IDatasourceConfigType = {
            ...config,
            horizontalCategories: { ...config.horizontalCategories },
            verticalCategories: { ...config.verticalCategories },
        };

        const userFields = fields.filter(field => field.type === 11)
        const userField: any = userFields[0]
        if (userField?.id) {
            nextConfig.personnelField = userField.id;
        }

        const optionFields = fields.filter(field => field.type === 3)
        const horizontalField: any = optionFields[0];
        if (horizontalField?.id) {
            nextConfig.horizontalField = horizontalField.id
        }
        if (horizontalField?.property?.options) {
            let options = (horizontalField.property.options as any[]).map(item => ({ ...item, disabled: false }))
            if (options.length === 1) {
                options[0].disabled = true
                nextConfig.horizontalCategories.left = [options[0].id]
                return nextConfig;
            } else if (options.length === 2) {
                options[0].disabled = true
                nextConfig.horizontalCategories.left = [options[0].id]
                options[1].disabled = true
                nextConfig.horizontalCategories.middle = [options[1].id]
                return nextConfig;
            } else if (options.length >= 3) {
                options[0].disabled = true
                nextConfig.horizontalCategories.left = [options[0].id]
                options[Math.floor(options.length / 2)].disabled = true
                nextConfig.horizontalCategories.middle = [options[Math.floor(options.length / 2)].id]
                options[options.length - 1].disabled = true
                nextConfig.horizontalCategories.right = [options[options.length - 1].id]
            }
        }

        const verticalField: any = optionFields[1];
        if (verticalField?.id) {
            nextConfig.verticalField = verticalField.id
        }
        if (verticalField?.property?.options) {
            let options = (verticalField.property.options as any[]).map(item => ({ ...item, disabled: false }))
            if (options.length === 1) {
                options[0].disabled = true
                nextConfig.verticalCategories.up = [options[0].id]
                return nextConfig;
            } else if (options.length === 2) {
                options[0].disabled = true
                nextConfig.verticalCategories.up = [options[0].id]
                options[1].disabled = true
                nextConfig.verticalCategories.middle = [options[1].id]
                return nextConfig;
            } else if (options.length >= 3) {
                options[0].disabled = true
                nextConfig.verticalCategories.up = [options[0].id]
                options[Math.floor(options.length / 2)].disabled = true
                nextConfig.verticalCategories.middle = [options[Math.floor(options.length / 2)].id]
                options[options.length - 1].disabled = true
                nextConfig.verticalCategories.down = [options[options.length - 1].id]
            }
        }
        return nextConfig;
    }

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
        console.log(theme, '++++++++++++++++++')
        updateTheme(theme.theme.toLocaleLowerCase())
         if(!isGetConfigReady && dashboard?.state !== DashboardState.Create) {
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
            console.log('获取所有表: ', tableList);
            datasource.tables = [...tableList];
        }
        const isTableValid = id && tableList.find(t => t.tableId === id);
        const availableInfo = !isTableValid ? await dataHelper.findAvailableTableForRender(tableList, 0) : undefined;
        console.log(availableInfo, 'availableInfo---------')
        if (availableInfo && availableInfo.tableId) {
            // config render data
            tableId = availableInfo.tableId;
            datasource.fields[availableInfo.tableId] = availableInfo.fields
            nextConfig = configRenderData(availableInfo.fields, nextConfig)
        }

        console.log(baseConfig, nextConfig, '-----------prepare render data')
        datasource.tableId = tableId;
        nextConfig.tableId = tableId

        if (!datasource.fields[tableId] || datasource.fields[tableId].length === 0) {
            if (tableId) {
                const table = await base.getTable(tableId);
                console.log('获取当前选中的表', table)
                const fields = await table.getFieldMetaList()
                datasource.fields[tableId] = [...fields];
            } else {
                datasource.fields[tableId] = [];
            }
        }

        console.log('获取选中表的所有字段信息: ', datasource.fields);
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

        console.log('获取表数据范围: ', datasource.dataRanges);
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
        console.log('------------------------------------------------------数据已经准备好: ',datasource, new Date().toISOString())
        // 强制刷新
        setIsLoading(false)
        hasInit.current = true;

        // 渲染完通知 宿主
        setTimeout(() => {
            console.log('------------------------------------------------------渲染完成 ');
            dashboard.setRendered().then( res => {
                console.log('set rendered: ',res);
            })
        }, 1000);
    }

    function updateTheme(theme: string) {
        document.body.setAttribute('theme-mode', theme);
    }

    useDashboardBindings({
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
