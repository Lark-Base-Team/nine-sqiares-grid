import {
    dashboard as dashboardSdk,
    ThemeModeType,
    SourceType,
    IDataRange,
    DashboardState,
    base as baseSdk,
    bitable as bitableSdk,
} from '@lark-base-open/js-sdk';
import React from "react"
import {useEffect, useRef, FC, useState} from 'react';
import {
    Tabs,
    TabPane,
    Form,
    Input,
    Button,
    Divider,
    Select, Toast,
    Spin
} from '@douyinfe/semi-ui';
import Icon, {IconDeleteStroked, IconPlus} from '@douyinfe/semi-icons';
import {IconTick} from '@douyinfe/semi-icons';

import {useDatasourceConfigStore, useTextConfigStore, useDatasourceStore, initialDatasourceConfig} from '../../store';

import deleteIcon from '../../assets/icon_delete-trash_outlined.svg';
import addIcon from '../../assets/icon_add_outlined.svg';


import {useTranslation} from 'react-i18next';

import './index.css';
import {IDatasourceConfigCacheType, TableDataGroupHelper} from "../../utils/tableDataGroupHelper";
import IconTable from '../../assets/icon_table.svg?react';
import IconPerson from '../../assets/icon_person.svg?react';
import IconChoose from '../../assets/icon_choose.svg?react';

import IconText from '../../assets/icon_text.svg?react';
import IconSelect from '../../assets/icon_select.svg?react';
import IconFunction from '../../assets/icon_function.svg?react';
import IconFindReference from '../../assets/icon_find_reference.svg?react';
import IconNumber from '../../assets/icon_number.svg?react';
import BaseSelector from '../BaseSelector';


interface IConfigPanelPropsType {
    dataRanges: { [key: string]: string | number }[],
    tables: any[];
    isMultipleBase?: boolean;
    bitableRef: React.MutableRefObject<typeof bitableSdk | null>;
}


export const ConfigPanel: FC<IConfigPanelPropsType> = (props) => {

    const {tables, dataRanges, isMultipleBase, bitableRef } = props;
    const base = bitableRef.current?.base || baseSdk;
    const dashboard = bitableRef.current?.dashboard || dashboardSdk;

    const {t, i18n} = useTranslation();

    // 类型与数据
    const {datasourceConfig, updateDatasourceConfig} = useDatasourceConfigStore((state) => state);
    const {datasource, updateDatasource} = useDatasourceStore((state) => state);

    const [tableId, setTableId] = useState<string>(datasourceConfig.tableId)
    const [dataRangeId, setDataRangeId] = useState<string>(datasourceConfig.dataRange)
    const [dataRangeList, setDataRangeList] = useState(dataRanges);

    // 保存选择表的字段数据
    const [fields, setFields] = useState<{ [key: string]: any }[]>([])
    const [personnelFieldId, setPersonnelFieldId] = useState<string>(datasourceConfig.personnelField)
    const [horizontalFieldId, setHorizontalFieldId] = useState<string>(datasourceConfig.horizontalField)
    const [verticalFieldId, setVerticalFieldId] = useState<string>(datasourceConfig.verticalField)
    const [groupFieldId, setGroupFieldId] = useState<string>(datasourceConfig.groupField)
    const [tableLoading, setTableLoading] = useState<boolean>(false)

    console.log('====datasourceConfig', datasourceConfig)

    // 保存竖轴选择完字段后子分类的选项数据
    const [verticalCategoryOptions, setVerticalCategoryOptions] = useState<{ [key: string]: any }[]>([])
    const [verticalCategories, setVerticalCategories] = useState<{ up: string[], middle: string[], down: string[] }>({
        up: [''],
        middle: [''],
        down: ['']
    })
    // 保存横轴选择完字段后子分类的选项数据
    const [horizontalCategoryOptions, setHorizontalCategoryOptions] = useState<{ [key: string]: any }[]>([])
    const [horizontalCategories, setHorizontalCategories] = useState<{ left: string[], middle: string[], right: string[] }>({
        left: [''],
        middle: [''],
        right: ['']
    })

    let datasourceConfigCache: IDatasourceConfigCacheType = {
        tableId: '',
        dataRange: '',
        personnelField: '',
        horizontalField: '',
        horizontalCategories: {
            left: [''],
            middle: [''],
            right: ['']
        },

        verticalField: '',
        verticalCategories: {
            up: [''],
            middle: [''],
            down: ['']
        },
        groupField: ''
    };

    const addNoneForList = (list: any[]) => {
        if (list.find(item => item.id === "" && item.name === 'none')) {
            return list
        }
        return [...list, ...[{id: '', name: 'none'}]]
    }

    const [progress, setProgress] = useState({ total: 0, current: 0 })
    const dataHelper = new TableDataGroupHelper({ setProgress, bitableRef })

    const handleBaseChange = (baseToken: string | undefined) => {
        setTableLoading(true)
        updateDatasourceConfig({ ...initialDatasourceConfig, baseToken })
    }

    const chooseTable = async (tableId: string) => {
        console.log('on data source selected ', tableId, datasourceConfig)
        setTableLoading(true)
        setTableId('')
        let fields: any[] = [];
        if (datasource.fields[tableId] && datasource.fields[tableId].length > 0) {
            fields = datasource.fields[tableId];
        } else {
            const table = await base.getTable(tableId);
            console.log('-----', table)
            fields = await table.getFieldMetaList()
        }
        let allRecords: any[] = []
        if (datasource.allRecords[tableId] && datasource.allRecords[tableId].length > 0) {
            allRecords = datasource.allRecords[tableId];
        } else {
            const table = await base.getTable(tableId);
            allRecords = await dataHelper.loadAllRecordsForTable(table, datasourceConfigCache)
        }
        const tableDataRange: any[] = await dashboard.getTableDataRange(tableId)
        datasource.dataRanges[tableId] = tableDataRange.map(item => ({
            type: item.type,
            viewId: item.viewId,
            viewName: item.viewName
        }))
        setDataRangeList([...datasource.dataRanges[tableId]])

        console.log(datasourceConfig.tableId, tableId, '---------------hhhaahhh')
        datasourceConfig.tableId = tableId
        datasourceConfigCache.tableId = tableId
        setTableId(tableId)
        datasourceConfig.horizontalField = ''
        setHorizontalFieldId('')
        datasourceConfig.verticalField = ''
        setVerticalFieldId('')
        datasourceConfig.personnelField = ''
        setPersonnelFieldId('')
        datasourceConfig.groupField = ''
        setGroupFieldId('')
        datasourceConfig.horizontalCategories = {
            left: [''],
            middle: [''],
            right: ['']
        }
        datasourceConfig.verticalCategories = {
            up: [''],
            middle: [''],
            down: ['']
        }
        datasourceConfigCache.horizontalCategories = {...datasourceConfig.horizontalCategories}
        setHorizontalCategories({...datasourceConfig.horizontalCategories})
        datasourceConfigCache.verticalCategories = {...datasourceConfig.verticalCategories}
        setVerticalCategories({...datasourceConfig.verticalCategories})
        datasourceConfig.tableId = tableId
        datasource.leftDownValue = {total: 0, percent: 0, list: []}
        datasource.middleDownValue = {total: 0, percent: 0, list: []}
        datasource.rightDownValue = {total: 0, percent: 0, list: []}
        datasource.leftMiddleValue = {total: 0, percent: 0, list: []}
        datasource.middleMiddleValue = {total: 0, percent: 0, list: []}
        datasource.rightMiddleValue = {total: 0, percent: 0, list: []}
        datasource.leftUpValue = {total: 0, percent: 0, list: []}
        datasource.middleUpValue = {total: 0, percent: 0, list: []}
        datasource.rightUpValue = {total: 0, percent: 0, list: []}

        fields = fields.map(item => ({...item, disabled: false}))
        datasource.fields[tableId] = [...fields];
        datasource.tableId = tableId
        datasource.allRecords[tableId] = allRecords
        datasourceConfig.dataRange = 'All';
        setDataRangeId('All');
        console.log('change table---------', datasource, datasourceConfig, fields, fields.filter(item => dataHelper.supportedFiled(item.type)))
        updateDatasource((datasource as any))
        updateDatasourceConfig({...(datasourceConfig as any)})
        setFields(addNoneForList(fields.filter(item => dataHelper.supportedFiled(item.type))))
        setTableLoading(false)
    }

    useEffect(() => {
        chooseTable(datasourceConfig.tableId)
    }, [datasourceConfig.tableId])

    const tableDataRangeChange = (range: string) => {
        datasourceConfig.dataRange = range
        setDataRangeId(range);
        updateDatasourceConfig({...(datasourceConfig as any)})
        datasourceConfigCache = {...datasourceConfig}
        console.log('on data range selected ', range)
        dataHelper.prepareData(datasource.tableId, datasource, datasourceConfigCache).then(() => {
            updateDatasource({...(datasource as any)})
        })
    }

    const choosePersonField = (personnel: string) => {
        datasourceConfig.personnelField = personnel;
        setPersonnelFieldId(personnel)
        const config: any = datasourceConfig;
        let selectedIds = Object.values(config).filter(id => typeof id === 'string' && id.length > 0)
        console.log(selectedIds)
        fields.forEach(item => {
            item.disabled = selectedIds.findIndex(id => id === item.id) !== -1;
            console.log(item.disabled, item.id)
        })
        updateDatasourceConfig({...config})
        datasourceConfigCache = {...config}
        setFields(addNoneForList(fields))
        // console.log('on personnel choose', personnel, datasourceConfig)
        dataHelper.prepareData(datasource.tableId, datasource, datasourceConfigCache).then(() => {
            updateDatasource({...(datasource as any)})
        })
    }

    const chooseHorizontalAxisField = (horizontalField: string) => {
        // console.log('on horizontalAxis selected ', horizontalField, datasourceConfig)
        datasourceConfig.horizontalField = horizontalField;
        setHorizontalFieldId(horizontalField)
        const horizontalCategories: { left: string[], middle: string[], right: string[] } = {
            left: [''],
            middle: [''],
            right: ['']
        }
        datasourceConfig.horizontalCategories = {...horizontalCategories};
        datasourceConfigCache.horizontalCategories = {...horizontalCategories};
        setHorizontalCategories({...horizontalCategories})
        let selectedIds = Object.values((datasourceConfig as any)).filter(id => typeof id === 'string' && id.length > 0)
        fields.forEach(item => {
            item.disabled = selectedIds.findIndex(id => id === item.id) !== -1;
        })
        // console.log('horizontalField-----',datasource.fields[datasource.tableId])
        setFields(addNoneForList(fields))
        let field = fields.find(item => item.id === datasourceConfig.horizontalField)
        if (field && field.property?.options) {
            // console.log('----field::', field)
            let options = (field.property?.options as any[]).map(item => ({...item, disabled: false}))

            if (options.length === 1) {
                options[0].disabled = true
                horizontalCategories.left = [options[0].id]
                return;
            } else if (options.length === 2) {
                options[0].disabled = true
                horizontalCategories.left = [options[0].id]
                options[1].disabled = true
                horizontalCategories.middle = [options[1].id]
                return;
            } else if (options.length >= 3) {
                options[0].disabled = true
                horizontalCategories.left = [options[0].id]
                options[Math.floor(options.length / 2)].disabled = true
                horizontalCategories.middle = [options[Math.floor(options.length / 2)].id];
                options[options.length - 1].disabled = true
                horizontalCategories.right = [options[options.length - 1].id];
            }
            datasourceConfig.horizontalCategories = {...horizontalCategories}
            setHorizontalCategoryOptions(addNoneForList(options))
            setHorizontalCategories({...horizontalCategories})
        }
        // console.log('chooseHorizontalAxisField++++++++++++++++++++++++==+++++++++++++++datasourceConfig', datasourceConfig)
        datasourceConfigCache = {...datasourceConfig}
        updateDatasourceConfig({...(datasourceConfig as any)})
        dataHelper.prepareData(datasource.tableId, datasource, datasourceConfigCache).then(() => {
            updateDatasource({...(datasource as any)})
        })
    }

    const chooseVerticalAxisField = (verticalField: string) => {
        // console.log('on verticalAxis selected ', verticalField, datasourceConfig)
        datasourceConfig.verticalField = verticalField;
        setVerticalFieldId(verticalField)
        const verticalCategories: { up: string[], middle: string[], down: string[] } = {
            up: [''],
            middle: [''],
            down: ['']
        }
        datasourceConfig.verticalCategories = {...verticalCategories}
        datasourceConfigCache.verticalCategories = {...verticalCategories}
        setVerticalCategories({...verticalCategories})
        let selectedIds = Object.values((datasourceConfig as any)).filter(id => typeof id === 'string' && id.length > 0)
        fields.forEach(item => {
            item.disabled = selectedIds.findIndex(id => id === item.id) !== -1;
        })
        setFields(addNoneForList(fields))
        let field = fields.find(item => item.id === datasourceConfig.verticalField)
        if (field) {
            // console.log('----field::', field)
            let options = (field.property?.options as any[] ?? []).map(item => ({...item, disabled: false}))
            if (options.length === 1) {
                options[0].disabled = true
                verticalCategories.up = [options[0].id]
                return;
            } else if (options.length === 2) {
                options[0].disabled = true
                verticalCategories.up = [options[0].id]
                options[1].disabled = true
                verticalCategories.middle = [options[1].id]
                return;
            } else if (options.length >= 3) {
                options[0].disabled = true
                verticalCategories.up = [options[0].id]
                options[Math.floor(options.length / 2)].disabled = true
                verticalCategories.middle = [options[Math.floor(options.length / 2)].id];
                options[options.length - 1].disabled = true
                verticalCategories.down = [options[options.length - 1].id];
            }
            setVerticalCategoryOptions(addNoneForList(options))
            setVerticalCategories({...verticalCategories})
        }
        datasourceConfig.verticalCategories = {...verticalCategories}
        datasourceConfigCache = {...datasourceConfig}
        updateDatasourceConfig({...(datasourceConfig as any)})
        dataHelper.prepareData(datasource.tableId, datasource, datasourceConfigCache).then(() => {
            updateDatasource({...(datasource as any)})
        })
    }

    const onGroupChange = (selectValue: string) => {
        datasourceConfig.groupField = selectValue;
        setGroupFieldId(selectValue)
        let selectedIds = Object.values((datasourceConfig as any)).filter(id => typeof id === 'string' && id.length > 0)
        fields.forEach(item => {
            item.disabled = selectedIds.findIndex(id => id === item.id) !== -1;
        })
        datasourceConfigCache = {...datasourceConfig}
        updateDatasourceConfig({...(datasourceConfig as any)})
        setFields(addNoneForList(fields))
        dataHelper.prepareData(datasource.tableId, datasource, datasourceConfigCache).then(() => {
            updateDatasource({...(datasource as any)})
        })
    }


    const addVerticalCategory = (type: 'up' | 'middle' | 'down') => {
        // console.log('vertical category ',type,'   ' , verticalCategories[type])
        verticalCategories[type].push('')
        setVerticalCategories({...verticalCategories})
        datasourceConfig.verticalCategories = {...verticalCategories}
    }

    const removeVerticalCategory = (type: 'up' | 'middle' | 'down', index: number) => {
        if (verticalCategories[type].length <= 1) {
            return
        }
        verticalCategories[type].splice(index, 1)
        setVerticalCategories({...verticalCategories})
        datasourceConfig.verticalCategories = {...verticalCategories}
    }

    const addHorizontalCategory = (type: 'left' | 'middle' | 'right') => {
        // console.log('add category::', type, "   ", horizontalCategories[type])
        horizontalCategories[type].push('')
        setHorizontalCategories({...horizontalCategories})
        datasourceConfig.horizontalCategories = {...horizontalCategories}
    }

    const removeHorizontalCategory = (type: 'left' | 'middle' | 'right', index: number) => {
        if (horizontalCategories[type].length <= 1) {
            return
        }
        horizontalCategories[type].splice(index, 1)
        setHorizontalCategories({...horizontalCategories})
        datasourceConfig.horizontalCategories = {...horizontalCategories}
    }

    // custom options style

    const renderPersonSelectedItem = (optionNode: any) => (
        <div style={{display: 'flex', alignItems: 'center', ...textColorStyle()}}>
            <Icon svg={<IconPerson/>}/>
            <span style={{marginLeft: 8}}>{optionNode.label}</span>
        </div>
    );

    const renderTableSelectedItem = (optionNode: any) => (
        <div style={{display: 'flex', alignItems: 'center', ...textColorStyle()}}>
            <Icon svg={<IconTable/>}/>
            <span style={{marginLeft: 8}}>{optionNode.label}</span>
        </div>
    );

    const classNames: (options: { [key: string]: boolean }) => string = (options: { [key: string]: boolean }) => {
        let cls: string[] = [];
        Object.keys(options).forEach(key => {
            if (options[key]) {
                cls.push(key)
            }
        });
        return cls.join(' ');
    }
    const renderTableOptionItem = (renderProps: any) => {
        const {
            disabled,
            selected,
            label,
            value,
            focused,
            className,
            style,
            onMouseEnter,
            onClick,
            empty,
            emptyContent,
            ...rest
        } = renderProps;
        const optionCls = classNames({
            ['custom-option-render']: true,
            ['custom-option-render-focused']: focused,
            ['custom-option-render-disabled']: disabled,
            ['custom-option-render-selected']: selected,
        });
        // const searchWords = [inputValue];
        return (
            <div style={{
                ...style, ...{
                    display: 'flex',
                    flexDirection: 'row',
                    padding: '8px 12px',
                    cursor: 'pointer',
                    alignItems: 'center', ...textColorStyle()
                }
            }}
                 className={optionCls}
                 onClick={() => onClick()}
                 onMouseEnter={e => onMouseEnter()}>
                <Icon svg={<IconTable/>}/>
                <span style={{marginLeft: 8}}>{label}</span>
                {selected ? (<IconTick style={{marginLeft: 'auto', marginRight: '0'}}>
                </IconTick>) : ''}
            </div>
        );
    };


    const renderFieldOptionIcon = (type: number) => {
        // 1 文本，3 单选  11 人员  19 查找引用  20公式
        switch (type) {
            case 1:
                return (<Icon svg={<IconText/>}/>)
            case 2:
                return (<Icon svg={<IconNumber/>}/>)
            case 3:
                return (<Icon svg={<IconSelect/>}/>)
            case 11:
                return (<Icon svg={<IconPerson/>}/>)
            case 19:
                return (<Icon svg={<IconFindReference/>}/>)
            case 20:
                return (<Icon svg={<IconFunction/>}/>)
            default:
                return (<Icon svg={<IconText/>}/>)
        }
    }

    const renderFieldOptionItem = (renderProps: any) => {
        const {
            disabled,
            selected,
            label,
            value,
            focused,
            className,
            style,
            onMouseEnter,
            onClick,
            empty,
            emptyContent,
            inputValue,
            type,
            ...rest
        } = renderProps;
        const optionCls = classNames({
            ['custom-option-render']: true,
            ['custom-option-render-focused']: focused,
            ['custom-option-render-disabled']: disabled,
            ['custom-option-render-selected']: selected,
        });
        return (inputValue.length === 0 || label.toUpperCase().includes(inputValue.toUpperCase())) ? (
            <div
                style={{
                    ...style, ...{
                        opacity: disabled ? '0.6' : '1.0',
                        display: 'flex',
                        flexDirection: 'row',
                        padding: '8px 12px',
                        cursor: 'pointer',
                        alignItems: 'center', ...textColorStyle()
                    }
                }}
                className={optionCls}
                onClick={() => onClick()}
                onMouseEnter={e => onMouseEnter()}>
                {renderFieldOptionIcon(type)}
                <span style={{marginLeft: 8}}>{label}</span>
                {selected ? (<IconTick style={{marginLeft: 'auto', marginRight: '0'}}>
                </IconTick>) : ''}
            </div>
        ) : ''
    };

    const renderSelectOptionSelectedItem = (optionNode: any) => (
        <div style={{display: 'flex', alignItems: 'center', ...textColorStyle()}}>
            <Icon svg={<IconChoose/>}/>
            <span style={{marginLeft: 8}}>{optionNode.label}</span>
        </div>
    );

    const formApi = useRef<any>();

    // 样式配置数据
    const {textConfig, updateTextConfig} = useTextConfigStore(
        (state) => state,
    );

    useEffect(() => {
        // console.log('config panel useeffect', datasourceConfig, textConfig, datasource)
        let selectedFieldIds = [datasourceConfig.horizontalField ?? '', datasourceConfig.verticalField ?? '', datasourceConfig.personnelField ?? '', datasourceConfig.groupField ?? '']
        setFields(addNoneForList((datasource.fields[datasourceConfig.tableId] ?? []).map(item => ({
            ...item,
            disabled: selectedFieldIds.some(id => id === item.id)
        }))))
        let horizontalConfig = {
            left: [...datasourceConfig.horizontalCategories.left],
            middle: [...datasourceConfig.horizontalCategories.middle],
            right: [...datasourceConfig.horizontalCategories.right]
        }
        setHorizontalCategories(horizontalConfig)

        let verticalConfig = {
            up: [...datasourceConfig.verticalCategories.up],
            middle: [...datasourceConfig.verticalCategories.middle],
            down: [...datasourceConfig.verticalCategories.down]
        }
        setVerticalCategories(verticalConfig)

        let field = (datasource.fields[datasourceConfig.tableId] ?? []).find(item => item.id === datasourceConfig.verticalField)
        // console.log(field, '11')
        if (field) {
            let options = (field.property?.options as any[] ?? []).map(item => ({
                ...item,
                disabled: (Object.values(datasourceConfig.verticalCategories)).flat().some(id => id === item.id)
            }))
            console.log(options)
            setVerticalCategoryOptions([...options])
        }
        let field1 = (datasource.fields[datasourceConfig.tableId] ?? []).find(item => item.id === datasourceConfig.horizontalField)
        // console.log(field1, '22')
        if (field1) {
            let options = (field1.property?.options as any[] ?? []).map(item => ({
                ...item,
                disabled: (Object.values(datasourceConfig.horizontalCategories)).flat().some(id => id === item.id)
            }))
            console.log(options)
            setHorizontalCategoryOptions([...options])
        }
    }, []);

    useEffect(() => {

    }, []);

    // 类型与数据表单更改
    const handleDataSourceConfigFormValueChange = (values: any) => {
        console.log('handleDataSourceConfigFormValueChange', values, datasourceConfig)
    };

    const handleTextConfigFormValueChange = (values: any) => {
        console.log('handleTextConfigFormValueChange', textConfig, values)
        const newValue = {
            ...{
                HLeftValue: '',
                HMiddleValue: '',
                HRightValue: '',
                VUpValue: '',
                VMiddleValue: '',
                VDownValue: '',
                leftDownValue: '',
                middleDownValue: '',
                rightDownValue: '',
                leftMiddleValue: '',
                middleMiddleValue: '',
                rightMiddleValue: '',
                leftUpValue: '',
                middleUpValue: '',
                rightUpValue: '',
            }, ...values
        }
        const newConfig = {...textConfig, ...newValue};
        updateTextConfig({...newConfig});
    };


    const canSave = (): Boolean => {
        if (!datasourceConfig.tableId) {
            Toast.error(t('tablePlaceholder'));
            return false;
        }
        if (!datasourceConfig.personnelField) {
            Toast.error(t('personFieldPlaceholder'));
            return false;
        }
        if (!datasourceConfig.horizontalField) {
            Toast.error(t('horizontalAxisFieldPlaceholder'));
            return false;
        }
        if (!datasourceConfig.verticalField) {
            Toast.error(t('verticalAxisFieldPlaceholder'));
            return false;
        }

        if ((Object.values(datasourceConfig.horizontalCategories) as string[][]).some(list => list.length === 0)) {
            if (datasourceConfig.horizontalCategories.left.length === 0) {
                Toast.error(t('horizontalAxisLeftFieldPlaceholder'));
            } else if (datasourceConfig.horizontalCategories.middle.length === 0) {
                Toast.error(t('horizontalAxisMiddleFieldPlaceholder'));
            } else if (datasourceConfig.horizontalCategories.right.length === 0) {
                Toast.error(t('horizontalAxisRightFieldPlaceholder'));
            }
            return false;
        }
        if ((Object.values(datasourceConfig.verticalCategories) as string[][]).some(list => list.length === 0)) {
            if (datasourceConfig.verticalCategories.up.length === 0) {
                Toast.error(t('verticalAxisUpFieldPlaceholder'));
            } else if (datasourceConfig.verticalCategories.middle.length === 0) {
                Toast.error(t('verticalAxisMiddleFieldPlaceholder'));
            } else if (datasourceConfig.verticalCategories.down.length === 0) {
                Toast.error(t('verticalAxisDownFieldPlaceholder'));
            }
            return false;
        }
        return true
    }
    // 保存配置
    const saveConfig = () => {
        if (!canSave()) {
            return
        }
        datasourceConfig.horizontalCategories = {...horizontalCategories}
        datasourceConfig.verticalCategories = {...verticalCategories}
        updateDatasourceConfig({...(datasourceConfig as any)});
        console.log('save config:::', datasource, datasourceConfig, textConfig)
        dashboard.saveConfig({
            dataConditions: [
                {
                    tableId: datasourceConfig.tableId,
                    baseToken: datasourceConfig.baseToken,
                },
            ],
            customConfig: {
                datasourceConfig,
                textConfig,
            },
        }).then();
    };

    const panelBgColorStyle: () => { [key: string]: string } = () => {
        return {
            backgroundColor: datasource.theme === 'light' ? '#FFFFFF' : '#292929'
        }
    }

    const bgColorStyle: () => { [key: string]: string } = () => {
        return {
            backgroundColor: datasource.theme === 'light' ? '#EFF4FF' : '#292929'
        }
    }

    const textColorStyle: () => { [key: string]: string } = () => {
        return {
            color: datasource.theme === 'light' ? "#1F2329" : "#FFFFFF"
        }
    }

    const cardColorStyle: () => { [key: string]: string } = () => {
        return {
            backgroundColor: datasource.theme === 'light' ? '#F5F6F7' : '#1F2329',
            borderColor: datasource.theme === 'light' ? '#DEE0E3' : '#1F2329'
        }
    }

    function searchLabel(sugInput: string, option: any) {
        let label = option.label.toUpperCase();
        let sug = sugInput.toUpperCase();
        return label.includes(sug);
    }

    return (
        <div
            className="border-[rgba(31, 35, 41, 0.15)] dark:border-[rgba(207,207,207, 0.15)] relative flex h-screen w-[350px] flex-col border-l-[0.5px]  bg-[--semi-color-bg-0]"
            style={{
                borderTop:
                    dashboard.state === DashboardState.View ? 'none' : '0.5px solid ',
                borderColor:
                    datasource.theme === 'light'
                        ? 'rgba(207,207,207, 0.15)'
                        : 'rgba(31, 35, 41, 0.15)',
                ...panelBgColorStyle(),
                ...textColorStyle()
            }}
        >
            <div className="relative flex-1">
                {
                    <Tabs type="line" contentStyle={{...textColorStyle()}}>
                        <TabPane tab={t('tab_name1')} itemKey="1"
                                 style={{...textColorStyle()}}
                        >
                            <div
                                className="overflow-y-scroll px-[20px] pb-[48px] pt-[20px]"
                                style={{
                                    height: `calc(100vh - 125px)`,
                                }}
                            >

                                <Form
                                    onValueChange={(values) => handleDataSourceConfigFormValueChange(values)}
                                    getFormApi={(api) => (formApi.current = api)}
                                    autoComplete="off"
                                >
                                    <div className="flex-column form-list">
                                        {isMultipleBase &&
                                            <div className="selection-field">
                                                <BaseSelector
                                                    baseToken={datasourceConfig.baseToken!}
                                                    onChange={handleBaseChange}
                                                />
                                            </div>
                                        }
                                        <div className="selection-field">
                                            <div className="selection-title"
                                                 style={{marginBottom: '8px'}}>{t('data_source')}</div>
                                            <Select
                                                style={{width: 300, ...textColorStyle()}}
                                                defaultValue={tableId}
                                                value={tableId}
                                                disabled={tableLoading}
                                                renderSelectedItem={tableLoading ? () => <Spin /> :renderTableSelectedItem}
                                                onChange={async (selectValue) => chooseTable(selectValue as string)}
                                                optionList={tables.map((source) => ({
                                                    value: source.tableId,
                                                    label: source.tableName,
                                                }))}
                                                renderOptionItem={renderTableOptionItem}
                                            />
                                        </div>

                                        <div className="selection-field">
                                            <div className="selection-title"
                                                 style={{marginBottom: '8px'}}>{t('data_range')}</div>
                                            <Select
                                                style={{width: 300, ...textColorStyle()}}
                                                key={dataRangeId}
                                                remote={true}
                                                defaultValue={dataRangeId}
                                                value={dataRangeId}
                                                onChange={(selectedValue) => tableDataRangeChange(selectedValue as string)}
                                                disabled={tableLoading}
                                                renderSelectedItem={tableLoading ? () => <Spin /> :renderTableSelectedItem}
                                                optionList={dataRangeList.map((range) => {
                                                    const {type, viewName, viewId} = range as any;
                                                    if (type === SourceType.ALL) {
                                                        return {
                                                            value: 'All',
                                                            label: t('view_all'),
                                                        };
                                                    } else {
                                                        return {
                                                            value: viewId,
                                                            label: viewName,
                                                        };
                                                    }
                                                })}
                                                renderOptionItem={renderTableOptionItem}
                                            />
                                        </div>

                                        <Divider dashed={false} style={cardColorStyle()}/>

                                        <div className="selection-field">
                                            <div className="selection-title"
                                                 style={{marginBottom: '8px'}}>{t('personnel')}</div>
                                            <Select
                                                filter
                                                style={{width: 300, ...textColorStyle()}}
                                                remote={true}
                                                defaultValue={personnelFieldId}
                                                value={personnelFieldId}
                                                onChange={async (selectValue) => choosePersonField(selectValue as string)}
                                                disabled={tableLoading}
                                                renderSelectedItem={tableLoading ? () => <Spin /> :renderPersonSelectedItem}
                                                optionList={fields.map((item) => {
                                                    const {id, name, disabled, type} = item as any;
                                                    return {
                                                        value: id,
                                                        label: id === '' ? t(name) : name,
                                                        disabled: disabled,
                                                        type: type
                                                    };
                                                })}
                                                renderOptionItem={renderFieldOptionItem}
                                            />
                                        </div>

                                        <div className="selection-field">
                                            <div className="selection-title"
                                                 style={{marginBottom: '8px'}}>{t('horizontalAxis')}</div>
                                            <div className="selection-card"
                                                 style={{...textColorStyle(), ...cardColorStyle()}}>
                                                <div className="selection-card-title">{t('chooseField')}</div>
                                                <Select
                                                    style={{width: '100%'}}
                                                    filter={searchLabel}
                                                    remote={true}
                                                    defaultValue={horizontalFieldId}
                                                    value={horizontalFieldId}
                                                    disabled={tableLoading}
                                                    renderSelectedItem={tableLoading ? () => <Spin /> :renderSelectOptionSelectedItem}
                                                    onChange={async (selectValue) => chooseHorizontalAxisField(selectValue as string)}
                                                    optionList={fields.map((item) => {
                                                        const {id, name, disabled, type} = item as any;
                                                        return {
                                                            value: id,
                                                            label: id === '' ? t(name) : name,
                                                            disabled: disabled,
                                                            type: type
                                                        };
                                                    })}
                                                    renderOptionItem={renderFieldOptionItem}
                                                />
                                            </div>
                                        </div>
                                        <div className="selection-list">
                                            <div className="selection-card"
                                                 style={{...textColorStyle(), ...cardColorStyle()}}>
                                                <div className="selection-card-title"
                                                     style={textColorStyle()}>{t('left')}</div>
                                                {horizontalCategories.left.map((id, index) => {
                                                    return (<div className="delete-able-select-container"
                                                                 key={id + ' ' + index}>
                                                        <Select
                                                            key={id}
                                                            style={{width: '100%', ...textColorStyle()}}
                                                            remote={true}
                                                            defaultValue={id}
                                                            value={id}
                                                            onSelect={(selectValue) => {
                                                                const value = selectValue as string;
                                                                if (value === horizontalCategories.left[index]) {
                                                                    horizontalCategories.left[index] = ''
                                                                } else {
                                                                    horizontalCategories.left[index] = value
                                                                }
                                                                let selectedIds = Object.values(horizontalCategories).flat().filter(id => id.length > 0)
                                                                console.log(selectedIds, Object.values(horizontalCategories))
                                                                horizontalCategoryOptions.forEach(item => {
                                                                    item.disabled = selectedIds.findIndex(id => id === item.id) !== -1;
                                                                    console.log(item.disabled, item.id)
                                                                })
                                                                setHorizontalCategoryOptions([...horizontalCategoryOptions])
                                                            }}
                                                            optionList={horizontalCategoryOptions.map((item) => {
                                                                const {id, name, disabled} = item as any;
                                                                return {
                                                                    value: id,
                                                                    label: id === '' ? t(name) : name,
                                                                    disabled: id === horizontalCategories.left[index] ? false : disabled
                                                                };
                                                            })}
                                                        />
                                                        <img src={deleteIcon} alt=""
                                                             className="delete-icon action-container"
                                                             style={{
                                                                 pointerEvents: horizontalCategories.left.length <= 1 && index === 0 ? 'none' : 'auto',
                                                                 opacity: horizontalCategories.left.length <= 1 && index === 0 ? 0.3 : 1
                                                             }}
                                                             onClick={() => removeHorizontalCategory('left', index)}
                                                        />
                                                    </div>)
                                                })}
                                                <div className="flex-row action-container"
                                                     onClick={() => addHorizontalCategory('left')}
                                                >
                                                    <img src={addIcon} alt="" className="add-icon"/>
                                                    <div className="selection-card-bottom-text">{t('addCategory')}</div>
                                                </div>
                                            </div>
                                            <div className="selection-card"
                                                 style={{...textColorStyle(), ...cardColorStyle()}}>
                                                <div className="selection-card-title"
                                                     style={textColorStyle()}>{t('middle')}</div>
                                                {horizontalCategories.middle.map((id, index) => {
                                                    // console.log('horizontalCategories middle', id, index)
                                                    return (<div className="delete-able-select-container"
                                                                 key={id + ' ' + index}>
                                                        <Select
                                                            style={{width: '100%', ...textColorStyle()}}
                                                            remote={true}
                                                            key={id}
                                                            defaultValue={id}
                                                            value={id}
                                                            onSelect={(selectValue) => {
                                                                const value = selectValue as string;
                                                                if (value === horizontalCategories.middle[index]) {
                                                                    horizontalCategories.middle[index] = ''
                                                                } else {
                                                                    horizontalCategories.middle[index] = value
                                                                }
                                                                let selectedIds = Object.values(horizontalCategories).flat().filter(id => id.length > 0)
                                                                console.log(selectedIds, Object.values(horizontalCategories))
                                                                horizontalCategoryOptions.forEach(item => {
                                                                    item.disabled = selectedIds.findIndex(id => id === item.id) !== -1;
                                                                    console.log(item.disabled, item.id)
                                                                })
                                                                setHorizontalCategoryOptions([...horizontalCategoryOptions])
                                                            }}
                                                            optionList={horizontalCategoryOptions.map((item) => {
                                                                const {id, name, disabled} = item as any;
                                                                return {
                                                                    value: id,
                                                                    label: id === '' ? t(name) : name,
                                                                    disabled: id === horizontalCategories.middle[index] ? false : disabled
                                                                };
                                                            })}
                                                        />
                                                        <img src={deleteIcon} alt=""
                                                             className="delete-icon action-container"
                                                             style={{
                                                                 pointerEvents: horizontalCategories.middle.length <= 1 && index === 0 ? 'none' : 'auto',
                                                                 opacity: horizontalCategories.middle.length <= 1 && index === 0 ? 0.3 : 1
                                                             }}
                                                             onClick={() => removeHorizontalCategory('middle', index)}
                                                        />
                                                    </div>)
                                                })}
                                                <div className="flex-row action-container"
                                                     onClick={() => addHorizontalCategory('middle')}>
                                                    <img src={addIcon} alt="" className="add-icon"/>
                                                    <div className="selection-card-bottom-text">{t('addCategory')}</div>
                                                </div>
                                            </div>
                                            <div className="selection-card"
                                                 style={{...textColorStyle(), ...cardColorStyle()}}>
                                                <div className="selection-card-title"
                                                     style={textColorStyle()}>{t('right')}</div>
                                                {horizontalCategories.right.map((id, index) => {
                                                    return (<div className="delete-able-select-container"
                                                                 key={id + ' ' + index}>
                                                        <Select
                                                            key={id}
                                                            style={{width: '100%', ...textColorStyle()}}
                                                            remote={true}
                                                            defaultValue={id}
                                                            value={id}
                                                            onSelect={(selectValue) => {
                                                                const value = selectValue as string;
                                                                if (value === horizontalCategories.right[index]) {
                                                                    horizontalCategories.right[index] = ''
                                                                } else {
                                                                    horizontalCategories.right[index] = value
                                                                }
                                                                let selectedIds = Object.values(horizontalCategories).flat().filter(id => id.length > 0)
                                                                console.log(selectedIds, Object.values(horizontalCategories))
                                                                horizontalCategoryOptions.forEach(item => {
                                                                    item.disabled = selectedIds.findIndex(id => id === item.id) !== -1;
                                                                    console.log(item.disabled, item.id)
                                                                })
                                                                setHorizontalCategoryOptions([...horizontalCategoryOptions])
                                                            }}
                                                            optionList={horizontalCategoryOptions.map((item) => {
                                                                const {id, name, disabled} = item as any;
                                                                return {
                                                                    value: id,
                                                                    label: id === '' ? t(name) : name,
                                                                    disabled: id === horizontalCategories.right[index] ? false : disabled
                                                                };
                                                            })}
                                                        />
                                                        <img src={deleteIcon} alt=""
                                                             className="delete-icon action-container"
                                                             style={{
                                                                 pointerEvents: horizontalCategories.right.length <= 1 && index === 0 ? 'none' : 'auto',
                                                                 opacity: horizontalCategories.right.length <= 1 && index === 0 ? 0.3 : 1
                                                             }}
                                                             onClick={() => removeHorizontalCategory('right', index)}
                                                        />
                                                    </div>)
                                                })}
                                                <div className="flex-row action-container"
                                                     onClick={() => addHorizontalCategory('right')}
                                                >
                                                    <img src={addIcon} alt="" className="add-icon"/>
                                                    <div className="selection-card-bottom-text">{t('addCategory')}</div>
                                                </div>
                                            </div>
                                        </div>


                                        <div style={{display: 'flex', flexDirection: 'column'}}>
                                            <div className="selection-title"
                                                 style={{marginBottom: '8px', ...textColorStyle()}}>{t('verticalAxis')}</div>

                                            <div className="selection-card"
                                                 style={{...textColorStyle(), ...cardColorStyle()}}>
                                                <div className="selection-card-title"
                                                     style={textColorStyle()}>{t('chooseField')}</div>
                                                <Select
                                                    filter={searchLabel}
                                                    style={{width: '100%', ...textColorStyle()}}
                                                    remote={true}
                                                    defaultValue={verticalFieldId}
                                                    value={verticalFieldId}
                                                    renderSelectedItem={renderSelectOptionSelectedItem}
                                                    onChange={async (selectValue) => chooseVerticalAxisField(selectValue as string)}
                                                    optionList={fields.map((item) => {
                                                        const {id, name, disabled, type} = item as any;
                                                        return {
                                                            value: id,
                                                            label: id === '' ? t(name) : name,
                                                            disabled: disabled,
                                                            type: type
                                                        };
                                                    })}
                                                    renderOptionItem={renderFieldOptionItem}
                                                />
                                            </div>
                                        </div>

                                        <div className="selection-list margin-top-tw margin-bottom-tw">
                                            <div className="selection-card"
                                                 style={{...textColorStyle(), ...cardColorStyle()}}>
                                                <div className="selection-card-title"
                                                     style={textColorStyle()}>{t('up')}</div>
                                                {verticalCategories.up.map((id, index) => {
                                                    return (<div className="delete-able-select-container"
                                                                 key={id + ' ' + index}>
                                                        <Select
                                                            key={id}
                                                            style={{width: '100%', ...textColorStyle()}}
                                                            remote={true}
                                                            defaultValue={id}
                                                            value={id}
                                                            onSelect={(selectValue) => {
                                                                const value = selectValue as string;
                                                                if (value === verticalCategories.up[index]) {
                                                                    verticalCategories.up[index] = ''
                                                                } else {
                                                                    verticalCategories.up[index] = value
                                                                }
                                                                let selectedIds = Object.values(verticalCategories).flat().filter(id => id.length > 0)
                                                                console.log(selectedIds, Object.values(verticalCategories))
                                                                verticalCategoryOptions.forEach(item => {
                                                                    item.disabled = selectedIds.findIndex(id => id === item.id) !== -1;
                                                                    console.log(item.disabled, item.id)
                                                                })
                                                                setVerticalCategoryOptions([...verticalCategoryOptions])
                                                            }}
                                                            optionList={verticalCategoryOptions.map((item) => {
                                                                const {id, name, disabled} = item as any;
                                                                return {
                                                                    value: id,
                                                                    label: id === '' ? t(name) : name,
                                                                    disabled: id === verticalCategories.up[index] ? false : disabled
                                                                };
                                                            })}
                                                        />
                                                        <img src={deleteIcon} alt=""
                                                             className="delete-icon action-container"
                                                             style={{
                                                                 pointerEvents: verticalCategories.up.length <= 1 && index === 0 ? 'none' : 'auto',
                                                                 opacity: verticalCategories.up.length <= 1 && index === 0 ? 0.3 : 1
                                                             }}
                                                             onClick={() => removeVerticalCategory('up', index)}
                                                        />
                                                    </div>)
                                                })}
                                                <div className="flex-row action-container"
                                                     onClick={() => {
                                                         addVerticalCategory('up')
                                                     }}
                                                >
                                                    <img src={addIcon} alt="" className="add-icon"/>
                                                    <div className="selection-card-bottom-text">{t('addCategory')}</div>
                                                </div>
                                            </div>
                                            <div className="selection-card"
                                                 style={{...textColorStyle(), ...cardColorStyle()}}>
                                                <div className="selection-card-title"
                                                     style={textColorStyle()}>{t('middle')}</div>
                                                {verticalCategories.middle.map((id, index) => {
                                                    return (<div className="delete-able-select-container"
                                                                 key={id + ' ' + index}>
                                                        <Select
                                                            key={id}
                                                            style={{width: '100%', ...textColorStyle()}}
                                                            remote={true}
                                                            defaultValue={id}
                                                            value={id}
                                                            onSelect={(selectValue) => {
                                                                const value = selectValue as string;
                                                                if (value === verticalCategories.middle[index]) {
                                                                    verticalCategories.middle[index] = ''
                                                                } else {
                                                                    verticalCategories.middle[index] = value
                                                                }
                                                                let selectedIds = Object.values(verticalCategories).flat().filter(id => id.length > 0)
                                                                // console.log(selectedIds, Object.values(verticalCategories))
                                                                verticalCategoryOptions.forEach(item => {
                                                                    item.disabled = selectedIds.findIndex(id => id === item.id) !== -1;
                                                                    console.log(item.disabled, item.id)
                                                                })
                                                                setVerticalCategoryOptions([...verticalCategoryOptions])
                                                            }}
                                                            optionList={verticalCategoryOptions.map((item) => {
                                                                const {id, name, disabled} = item as any;
                                                                return {
                                                                    value: id,
                                                                    label: id === '' ? t(name) : name,
                                                                    disabled: id === verticalCategories.middle[index] ? false : disabled
                                                                };
                                                            })}
                                                        />
                                                        <img src={deleteIcon} alt=""
                                                             className="delete-icon action-container"
                                                             style={{
                                                                 pointerEvents: verticalCategories.middle.length <= 1 && index === 0 ? 'none' : 'auto',
                                                                 opacity: verticalCategories.middle.length <= 1 && index === 0 ? 0.3 : 1
                                                             }}
                                                             onClick={() => removeVerticalCategory('middle', index)}
                                                        />
                                                    </div>)
                                                })}
                                                <div className="flex-row action-container"
                                                     onClick={() => addVerticalCategory('middle')}
                                                >
                                                    <img src={addIcon} alt="" className="add-icon"/>
                                                    <div className="selection-card-bottom-text">{t('addCategory')}</div>
                                                </div>
                                            </div>
                                            <div className="selection-card"
                                                 style={{...textColorStyle(), ...cardColorStyle()}}>
                                                <div className="selection-card-title"
                                                     style={textColorStyle()}>{t('down')}</div>
                                                {verticalCategories.down.map((id, index) => {
                                                    return (<div className="delete-able-select-container"
                                                                 key={id + ' ' + index}>
                                                        <Select
                                                            style={{width: '100%', ...textColorStyle()}}
                                                            key={id}
                                                            id={id}
                                                            defaultValue={id}
                                                            value={id}
                                                            onSelect={(selectValue) => {
                                                                const value = selectValue as string;
                                                                if (value === verticalCategories.down[index]) {
                                                                    verticalCategories.down[index] = ''
                                                                } else {
                                                                    verticalCategories.down[index] = value
                                                                }
                                                                let selectedIds = Object.values(verticalCategories).flat().filter(id => id.length > 0)
                                                                console.log(selectedIds, Object.values(verticalCategories))
                                                                verticalCategoryOptions.forEach(item => {
                                                                    item.disabled = selectedIds.findIndex(id => id === item.id) !== -1;
                                                                    console.log(item.disabled, item.id)
                                                                })
                                                                setVerticalCategoryOptions([...verticalCategoryOptions])
                                                            }}
                                                            optionList={verticalCategoryOptions.map((item) => {
                                                                const {id, name, disabled} = item as any;
                                                                return {
                                                                    value: id,
                                                                    label: id === '' ? t(name) : name,
                                                                    disabled: id === verticalCategories.down[index] ? false : disabled
                                                                };
                                                            })}
                                                        />
                                                        <img src={deleteIcon} alt=""
                                                             className="delete-icon action-container"
                                                             style={{
                                                                 pointerEvents: verticalCategories.down.length <= 1 && index === 0 ? 'none' : 'auto',
                                                                 opacity: verticalCategories.down.length <= 1 && index === 0 ? 0.3 : 1
                                                             }}
                                                             onClick={() => removeVerticalCategory('down', index)}
                                                        />
                                                    </div>)
                                                })}
                                                <div className="flex-row action-container"
                                                     onClick={() => addVerticalCategory('down')}
                                                >
                                                    <img src={addIcon} alt="" className="add-icon"/>
                                                    <div className="selection-card-bottom-text">{t('addCategory')}</div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="selection-field">
                                            <div className="selection-title"
                                                 style={{marginBottom: '8px'}}>{t('group')}</div>
                                            <Select
                                                filter={searchLabel}
                                                style={{width: 300, ...textColorStyle()}}
                                                remote={true}
                                                defaultValue={groupFieldId}
                                                value={groupFieldId}
                                                onChange={async (selectValue) => onGroupChange(selectValue as string)}
                                                renderSelectedItem={renderSelectOptionSelectedItem}
                                                optionList={fields.map((item) => {
                                                    const {id, name, disabled, type} = item as any;
                                                    return {
                                                        value: id,
                                                        label: id === '' ? t((name === 'none') ? 'noneGroup' : name) : name,
                                                        disabled: disabled,
                                                        type: type
                                                    };
                                                })}
                                                renderOptionItem={renderFieldOptionItem}
                                            />
                                        </div>
                                    </div>
                                </Form>
                            </div>
                        </TabPane>


                        <TabPane tab={t('tab_name2')} itemKey="2">
                            <div
                                className="flex flex-col gap-[16px] overflow-y-scroll pb-[48px] pt-[20px]"
                                style={{
                                    height: `calc(100vh - 125px)`,
                                }}
                            >

                                <Form
                                    initValues={textConfig}
                                    onValueChange={(values) => handleTextConfigFormValueChange(values)}
                                    getFormApi={(api) => (formApi.current = api)}
                                    autoComplete="off"
                                >

                                    <div className="selection-title margin-top-tw"
                                         style={textColorStyle()}>{t('horizontalAxisCategory')}</div>
                                    <div className="selection-card" style={{...textColorStyle(), ...cardColorStyle()}}>
                                        <Form.Input field='HLeftValue' label={t('left')}
                                                    style={{width: '100%', ...textColorStyle()}}
                                                    placeholder={t('pleaseEnterText')}></Form.Input>
                                        <Form.Input field='HMiddleValue' label={t('middle')}
                                                    style={{width: '100%', ...textColorStyle()}}
                                                    placeholder={t('pleaseEnterText')}></Form.Input>
                                        <Form.Input field='HRightValue' label={t('right')}
                                                    style={{width: '100%', ...textColorStyle()}}
                                                    placeholder={t('pleaseEnterText')}></Form.Input>
                                    </div>

                                    <div className="selection-title margin-top-tw"
                                         style={textColorStyle()}>{t('verticalAxisCategory')}</div>
                                    <div className="selection-card" style={{...textColorStyle(), ...cardColorStyle()}}>
                                        <Form.Input field='VUpValue' label={t('up')}
                                                    style={{width: '100%', ...textColorStyle()}}
                                                    placeholder={t('pleaseEnterText')}></Form.Input>
                                        <Form.Input field='VMiddleValue' label={t('middle')}
                                                    style={{width: '100%', ...textColorStyle()}}
                                                    placeholder={t('pleaseEnterText')}></Form.Input>
                                        <Form.Input field='VDownValue' label={t('down')}
                                                    style={{width: '100%', ...textColorStyle()}}
                                                    placeholder={t('pleaseEnterText')}></Form.Input>
                                    </div>

                                    <div className="selection-title margin-top-tw"
                                         style={textColorStyle()}>{t('cellTitle')}</div>
                                    <div className="selection-card" style={{...textColorStyle(), ...cardColorStyle()}}>
                                        <Form.Input field='leftDownValue' label={t('leftDown')}
                                                    style={{width: '100%', ...textColorStyle()}}
                                                    placeholder={t('pleaseEnterText')}></Form.Input>
                                        <Form.Input field='middleDownValue' label={t('middleDown')}
                                                    style={{width: '100%', ...textColorStyle()}}
                                                    placeholder={t('pleaseEnterText')}></Form.Input>
                                        <Form.Input field='rightDownValue' label={t('rightDown')}
                                                    style={{width: '100%', ...textColorStyle()}}
                                                    placeholder={t('pleaseEnterText')}></Form.Input>
                                        <Form.Input field='leftMiddleValue' label={t('leftMiddle')}
                                                    style={{width: '100%', ...textColorStyle()}}
                                                    placeholder={t('pleaseEnterText')}></Form.Input>
                                        <Form.Input field='middleMiddleValue' label={t('middleMiddle')}
                                                    style={{width: '100%', ...textColorStyle()}}
                                                    placeholder={t('pleaseEnterText')}></Form.Input>
                                        <Form.Input field='rightMiddleValue' label={t('rightMiddle')}
                                                    style={{width: '100%', ...textColorStyle()}}
                                                    placeholder={t('pleaseEnterText')}></Form.Input>
                                        <Form.Input field='leftUpValue' label={t('leftUp')}
                                                    style={{width: '100%', ...textColorStyle()}}
                                                    placeholder={t('pleaseEnterText')}></Form.Input>
                                        <Form.Input field='middleUpValue' label={t('middleUp')}
                                                    style={{width: '100%', ...textColorStyle()}}
                                                    placeholder={t('pleaseEnterText')}></Form.Input>
                                        <Form.Input field='rightUpValue' label={t('rightUp')}
                                                    style={{width: '100%', ...textColorStyle()}}
                                                    placeholder={t('pleaseEnterText')}></Form.Input>
                                    </div>
                                </Form>
                            </div>
                        </TabPane>
                    </Tabs>
                }
            </div>
            <div className="relative h-[72px] w-[340px]"
                 style={{
                     ...textColorStyle()
                 }}
            >
                <Button
                    className="fixed bottom-[10px] right-[10px] w-[80px] bg-[var(--semi-color-primary)]"
                    theme="solid"
                    type="primary"
                    onClick={() => saveConfig()}
                >
                    确认
                </Button>
            </div>
        </div>
    );
};
