import {base as baseSdk, IGetRecordsParams, IRecord, ITable, bitable as bitableSdk, dashboard as dashboardSdk, DashboardState} from "@lark-base-open/js-sdk";
import {IDatasourceConfigType} from "../store";
import { loadTableRecords } from "./data";

export interface IDatasourceConfigCacheType {
    tableId: string;
    dataRange: string;
    personnelField: string;
    horizontalField: string;
    horizontalCategories: {
        left: string[],
        middle: string[],
        right: string[]
    };
    verticalField: string;
    verticalCategories: {
        up: string[],
        middle: string[],
        down: string[]
    };
    groupField: string;
}

/**
 * 九宫格数据准备与分组计算的工具类。
 *
 * - 负责：拉取表记录（可按 viewId/dataRange 过滤）、按横纵轴分类筛选、可选分组、计算展示数据结构。
 * - 不负责：持久化配置、UI 交互。
 */
export class TableDataGroupHelper {
    setProgress: (props: { total: number; current: number; notSupport?: boolean }) => void;
    bitableRef: React.MutableRefObject<typeof bitableSdk | null>;

    /**
     * @param props.setProgress 外部注入的进度回调，用于展示加载进度
     * @param props.bitableRef 外部注入的 bitable sdk 引用（支持多 Base 切换）
     */
    constructor(props: { 
        setProgress: (props: { total: number, current: number; notSupport?: boolean }) => void;
        bitableRef: React.MutableRefObject<typeof bitableSdk | null>;
    }) {
        this.setProgress = props.setProgress;
        this.bitableRef = props.bitableRef;
    }

    /**
     * 判断字段类型是否在当前组件支持的范围内。
     */
    supportedFiled(fieldType: number): Boolean {
        // 1 文本，3 单选  11 人员  19 查找引用  20公式
        return [1, 3, 11, 19, 20].some(type => type === fieldType);
    }

    /**
     * 在给定表列表中寻找一个可用于渲染九宫格的“可用表”。
     *
     * 规则：必须至少包含 1 个人员字段（type=11）且至少 2 个单选字段（type=3）。
     *
     * @param tableList 表列表（通常来自 base.getTableList() 的加工结果）
     * @param index 从哪个下标开始查找（递归向后查找）
     * @returns 找到则返回 { tableId, fields }，否则返回 undefined
     */
    async findAvailableTableForRender(tableList: any[], index: number): Promise<{ tableId: string, fields: any[] } | undefined> {
        // 找个 有 type 3 单选  type 11 人员 字段的表，而且 type 3 的 字段大于等于 2，
        let result: { tableId: string, fields: any[] } | undefined = { tableId: '', fields: [] };
        const findTableItem = tableList[index];
        if (!findTableItem) return  undefined;
        const base = this.bitableRef.current?.base || baseSdk;
        const table = await base.getTable(findTableItem.tableId);
        const fields = (await table.getFieldMetaList()) as any[]
        // 找到 有一个成员字段和两个数字字段 的表
        const userFields = fields.filter(field => field.type === 11)
        const optionFields = fields.filter(field => field.type === 3)
        if (userFields.length > 0 && optionFields.length >= 2) {
            result = { tableId: findTableItem.tableId, fields: fields };
            return result
        }
        if (index < tableList.length - 1) {
            return await this.findAvailableTableForRender(tableList, index + 1);
        }
        return result;

    }

    /**
     * 拉取指定表的记录。
     *
     * - 在配置态（DashboardState.Config/Create）下为了性能只取前 400 条。
     * - 当 dataRange 不为空且不为 'All' 时，会将其作为 viewId 过滤（只取对应视图范围的数据）。
     */
    async loadAllRecordsForTable(table: ITable, dataSourceConfig: IDatasourceConfigType): Promise<IRecord[]> {
        console.log('======loadAllRecordsForTable', table, dataSourceConfig)
        // 分页加载，每次加载 5000 条 直到加载完数据
        // const loadRecordsByPage = async (lastRecordId: string) => {
        //     let params: IGetRecordsParams = { pageSize: 5000 , pageToken: lastRecordId }
        //     if (dataSourceConfig.dataRange && dataSourceConfig.dataRange !== 'All') {
        //         params.viewId = dataSourceConfig.dataRange
        //     }
        //     console.log('load data params', params, dataSourceConfig.dataRange)
        //     const { hasMore , records } = await table.getRecords(params);
        //     allRecords.push(...records)
        //     if (hasMore) {
        //         const last = allRecords[allRecords.length - 1];
        //         await loadRecordsByPage(last.recordId)
        //     }
        // }
        // await loadRecordsByPage('');
        // 配置状态下，只加载前400行数据
        const dashboard = this.bitableRef.current?.dashboard || dashboardSdk;
        const isConfig = dashboard.state === DashboardState.Config || dashboard.state === DashboardState.Create
        const count = isConfig ? 400 : undefined
        let viewId = undefined;
        if (dataSourceConfig.dataRange && dataSourceConfig.dataRange !== 'All') {
            viewId = dataSourceConfig.dataRange
        }
        const allRecords = await loadTableRecords({
            tableId: table.id,
            params: { viewId },
            count,
            updadeProgress: (props) => {
                this.setProgress(props)
            },
            bitableRef: this.bitableRef,
        })
        return allRecords;
    }


    /**
     * 对记录进行“可选分组”。
     *
     * - 未指定 groupField 或 groupTexts 为空时：返回一个默认分组（全部记录放在同一组）。
     * - 指定 groupField 时：按 groupTexts 中的每个文本值，将记录筛选到对应分组。
     */
    groupRecordsByInfo(records: IRecord[],
        groupField: any | null,
        groupTexts: string[]

    ): { category: string, persons: IRecord[] }[] {
        if (!groupField) {
            return [{ category: '', persons: records }]
        }
        if (groupTexts.length === 0) {
            return [{ category: '', persons: records }]
        }
        let groupList: { category: string, persons: IRecord[] }[] = []
        groupTexts.forEach(text => {
            let filteredList = records.filter(item => {
                let itemFieldInfo = ((item.fields[groupField.id]) instanceof Array) ? (item.fields[groupField.id] as any[])[0] : (item.fields[groupField.id]);
                const itemText = itemFieldInfo ? itemFieldInfo['text'] : ''
                return text === itemText
            })
            groupList.push({ category: text, persons: filteredList })
        });
        return groupList
    }

    /**
     * 生成分组维度的“可选分组文本列表”。
     *
     * - 单选字段（type=3）：取字段 options 的 name/text。
     * - 其他字段：从记录里抽取去重后的 text。
     */
    groupTextsFor(records: IRecord[],
        groupField: any | null
    ): string[] {
        if (!groupField) {
            return [];
        }
        if (groupField.type === 3) {
            const list: { [key: string]: any }[] = groupField.property?.options ?? []
            return list.map(item => (item.name ? item.name : item.text));
        }
        let map: { [key: string]: string } = {};
        records.forEach(item => {
            let fieldInfo = ((item.fields[groupField.id]) instanceof Array) ? (item.fields[groupField.id] as any[])[0] : (item.fields[groupField.id]);
            let text = fieldInfo ? fieldInfo['text'] : '';
            if (text?.length) {
                map[text] = text;
            }
        })
        return Object.keys(map);
    }

    /**
     * 根据字段类型，返回用于从单元格字段值中取“展示文本”的 key。
     * - 人员字段：取 name
     * - 其他字段：取 text
     */
    fieldTextKey(type: number): string {
        if (type === 11) {
            // user
            return "name";
        }
        return 'text'
    }

    /**
     * 将分组后的记录映射为九宫格要展示的数据结构。
     *
     * @param groupedRecords 分组后的记录列表
     * @param personnelField 人员字段 meta，用于取人员名称
     * @param totalRowCount 总记录数（用于计算百分比）
     * @returns { list, total, percent }
     */
    mapRecordByDisplayInfo(groupedRecords: { category: string, persons: IRecord[] }[],
        personnelField: any | null,
        totalRowCount: number
    ): { list: { category: string, persons: string[] }[], total: number, percent: number } {
        // console.log('--------',groupedRecords, personnelField)
        let displayInfo: { category: string, persons: string[] }[] = [];
        groupedRecords.filter(group => group.persons.length > 0).forEach(group => {
            let list: string[] = [];
            group.persons.forEach(item => {
                let itemFieldInfo = ((item.fields[personnelField.id]) instanceof Array) ? (item.fields[personnelField.id] as any[])[0] : (item.fields[personnelField.id]);
                const fieldKey = this.fieldTextKey(personnelField.type);
                const itemText = itemFieldInfo ? itemFieldInfo[fieldKey] : ''
                if (itemText) list.push(itemText)
            })
            displayInfo.push({ category: group.category, persons: list })
        });
        const list = displayInfo.filter(item => item.persons.length > 0)
        const total = list.map(item => item.persons).flat().length
        // console.log('mapRecordByDisplayInfo:::::::::::',list, displayInfo, total, totalRowCount, (total*100)/totalRowCount)
        return { total, percent: Math.floor((total * 100 * 100) / totalRowCount) / 100.0, list };
    }


    /**
     * 根据“横轴/竖轴”的分类选项，筛选出某一个格子对应的记录集合。
     *
     * @param allRecords 全量记录
     * @param verticalField 竖轴字段 meta
     * @param verticalType 竖轴位置（up/middle/down）
     * @param horizontalField 横轴字段 meta
     * @param horizontalType 横轴位置（left/middle/right）
     * @param datasourceConfigCache 当前配置快照（包含横纵轴选项 id 列表）
     */
    filterRecordsByInfo(allRecords: IRecord[],
        verticalField: any | null,
        verticalType: 'up' | 'middle' | 'down',
        horizontalField: any | null,
        horizontalType: 'left' | 'middle' | 'right',
        datasourceConfigCache: any
    ): IRecord[] {
        let filteredRecord: IRecord[] = []
        if (verticalField) {
            let optionIds: string[] = datasourceConfigCache.verticalCategories[verticalType] ?? [];
            // console.log(verticalType, optionIds)
            filteredRecord = allRecords.filter(item => optionIds.some(id => {
                let itemFieldInfo = ((item.fields[verticalField.id]) instanceof Array) ? (item.fields[verticalField.id] as any[])[0] : (item.fields[verticalField.id]);
                const itemId = itemFieldInfo ? itemFieldInfo['id'] : ''
                return id === itemId
            }))
        }
        // console.log(JSON.parse(JSON.stringify(filteredRecord)))
        if (horizontalField) {
            let optionIds: string[] = datasourceConfigCache.horizontalCategories[horizontalType] ?? [];
            // console.log(horizontalType,optionIds)
            filteredRecord = filteredRecord.filter(item => optionIds.some(id => {
                let itemFieldInfo = ((item.fields[horizontalField.id]) instanceof Array) ? (item.fields[horizontalField.id] as any[])[0] : (item.fields[horizontalField.id]);
                const itemId = itemFieldInfo ? itemFieldInfo['id'] : ''
                return id === itemId
            }))
        }
        // console.log(JSON.parse(JSON.stringify(filteredRecord)))
        if (!verticalField || !horizontalField) {
            console.log('组装数据错误，缺失横轴或则竖轴字段')
        }
        return [...filteredRecord]
    }

    /**
     * 按当前配置快照准备九宫格渲染所需的全部数据。
     *
     * 主要步骤：
     * 1) 拉取字段元信息与记录（可按 dataRange/viewId 过滤）
     * 2) 找到人员字段、分组字段、横纵轴字段
     * 3) 对 9 个格子分别筛选记录 -> 可选分组 -> 映射为展示结构
     *
     * @param tableId 表 ID
     * @param datasource 运行时数据容器（会被写入各格子的统计结果）
     * @param datasourceConfigCache 当前配置快照
     */
    async prepareData(tableId: string, datasource: any,  datasourceConfigCache: any) {
        const base = this.bitableRef.current?.base || baseSdk;
        const table = await base.getTable(tableId);
        const fields = await table.getFieldMetaList()
        // console.log('prepare data fields',fields);
        // 获取数据
        const allRecords = await this.loadAllRecordsForTable(table, datasourceConfigCache)
        // console.log('加载完当前 table 所以记录 ', allRecords,)
        datasource.totalRowCount = allRecords.length
        datasource.allRecords[table.id] = allRecords
        // 根据配置面板数据准备数据
        // 数据根据 四个字段进行组装显示
        let personField = fields.find(item => item.id === datasourceConfigCache.personnelField)
        let groupField = fields.find(item => item.id === datasourceConfigCache.groupField)
        let verticalField = fields.find(item => item.id === datasourceConfigCache.verticalField)
        let horizontalField = fields.find(item => item.id === datasourceConfigCache.horizontalField)
        const groupText = this.groupTextsFor(allRecords, groupField)
        // console.log(personField, groupField, verticalField, horizontalField, datasourceConfigCache, groupText)
        // 九个格子的数据未分组的数据数组
        let leftUpList = this.filterRecordsByInfo(allRecords, verticalField, 'up', horizontalField, 'left', datasourceConfigCache);
        let leftUpGroupList = this.groupRecordsByInfo(leftUpList, groupField, groupText);
        datasource.leftUpValue = this.mapRecordByDisplayInfo(leftUpGroupList, personField, allRecords.length)

        let middleUpList = this.filterRecordsByInfo(allRecords, verticalField, 'up', horizontalField, 'middle', datasourceConfigCache);
        let middleUpGroupList = this.groupRecordsByInfo(middleUpList, groupField, groupText)
        datasource.middleUpValue = this.mapRecordByDisplayInfo(middleUpGroupList, personField, allRecords.length)

        let rightUpList = this.filterRecordsByInfo(allRecords, verticalField, 'up', horizontalField, 'right', datasourceConfigCache);
        let rightUpGroupList = this.groupRecordsByInfo(rightUpList, groupField, groupText)
        datasource.rightUpValue = this.mapRecordByDisplayInfo(rightUpGroupList, personField, allRecords.length)

        let leftMiddleList = this.filterRecordsByInfo(allRecords, verticalField, 'middle', horizontalField, 'left', datasourceConfigCache);
        let leftMiddleGroupList = this.groupRecordsByInfo(leftMiddleList, groupField, groupText)
        datasource.leftMiddleValue = this.mapRecordByDisplayInfo(leftMiddleGroupList, personField, allRecords.length)

        let middleMiddleList = this.filterRecordsByInfo(allRecords, verticalField, 'middle', horizontalField, 'middle', datasourceConfigCache);
        let middleMiddleGroupList = this.groupRecordsByInfo(middleMiddleList, groupField, groupText)
        datasource.middleMiddleValue = this.mapRecordByDisplayInfo(middleMiddleGroupList, personField, allRecords.length)

        let rightMiddleList = this.filterRecordsByInfo(allRecords, verticalField, 'middle', horizontalField, 'right', datasourceConfigCache);
        let rightMiddleGroupList = this.groupRecordsByInfo(rightMiddleList, groupField, groupText)
        datasource.rightMiddleValue = this.mapRecordByDisplayInfo(rightMiddleGroupList, personField, allRecords.length)

        let leftDownList = this.filterRecordsByInfo(allRecords, verticalField, 'down', horizontalField, 'left', datasourceConfigCache);
        let leftDownGroupList = this.groupRecordsByInfo(leftDownList, groupField, groupText)
        datasource.leftDownValue = this.mapRecordByDisplayInfo(leftDownGroupList, personField, allRecords.length)

        let middleDownList = this.filterRecordsByInfo(allRecords, verticalField, 'down', horizontalField, 'middle', datasourceConfigCache);
        let middleDownGroupList = this.groupRecordsByInfo(middleDownList, groupField, groupText)
        datasource.middleDownValue = this.mapRecordByDisplayInfo(middleDownGroupList, personField, allRecords.length)

        let rightDownList = this.filterRecordsByInfo(allRecords, verticalField, 'down', horizontalField, 'right', datasourceConfigCache);
        let rightDownGroupList = this.groupRecordsByInfo(rightDownList, groupField, groupText)
        datasource.rightDownValue = this.mapRecordByDisplayInfo(rightDownGroupList, personField, allRecords.length)
    }
}
