// @ts-nocheck
import { create } from 'zustand';

export interface IDatasourceType {
    // 所有表对象
    tables: any[];
    //选中
    baseToken?: string;
    tableId: string;
    theme: 'light' | 'dark' | 'primary';
    fields: { [key: string]: any[] };
    allRecords: { [key: string]: { [key: string]: any[] }[] },
    totalRowCount: number;
    dataRanges: { [key: string]: { [key: string]: string | number }[] },
    leftDownValue: { list: { category: string, persons: string[] }[], total: number, percent: number },
    middleDownValue: { list: { category: string, persons: string[] }[], total: number, percent: number },
    rightDownValue: { list: { category: string, persons: string[] }[], total: number, percent: number },
    leftMiddleValue: { list: { category: string, persons: string[] }[], total: number, percent: number },
    middleMiddleValue: { list: { category: string, persons: string[] }[], total: number, percent: number },
    rightMiddleValue: { list: { category: string, persons: string[] }[], total: number, percent: number },
    leftUpValue: { list: { category: string, persons: string[] }[], total: number, percent: number },
    middleUpValue: { list: { category: string, persons: string[] }[], total: number, percent: number },
    rightUpValue: { list: { category: string, persons: string[] }[], total: number, percent: number },
}

interface IDatasourceStore {
    datasource: IDatasourceType;
    updateDatasource: (typeConfig: IDatasourceType) => void;
}

export const useDatasourceStore = create<IDatasourceStore>((set) => ({
    datasource: {
        tables: [],
        tableId: '',
        baseToken: undefined,
        fields: {},
        allRecords: {},
        theme: 'light',
        totalRowCount: 0,
        dataRanges: {},
        leftDownValue: { total: 0, percent: 0, list: [] },
        middleDownValue: { total: 0, percent: 0, list: [] },
        rightDownValue: { total: 0, percent: 0, list: [] },
        leftMiddleValue: { total: 0, percent: 0, list: [] },
        middleMiddleValue: { total: 0, percent: 0, list: [] },
        rightMiddleValue: { total: 0, percent: 0, list: [] },
        leftUpValue: { total: 0, percent: 0, list: [] },
        middleUpValue: { total: 0, percent: 0, list: [] },
        rightUpValue: { total: 0, percent: 0, list: [] },
    },
    updateDatasource: (datasource) => set(() => ({ datasource })),
}));



export interface IDatasourceConfigType {
    baseToken?: string;
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

interface IDatasourceConfigStore {
    datasourceConfig: IDatasourceConfigType;
    updateDatasourceConfig: (typeConfig: IDatasourceConfigType) => void;
}

export const initialDatasourceConfig = {
    tableId: '',
    baseToken: undefined,
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

export const useDatasourceConfigStore = create<IDatasourceConfigStore>((set) => ({
    datasourceConfig: initialDatasourceConfig,
    updateDatasourceConfig: (datasourceConfig) => set(() => ({ datasourceConfig })),
}));

export interface ITextConfigType {
    HLeftValue: string,
    HMiddleValue: string,
    HRightValue: string,
    VUpValue: string,
    VMiddleValue: string,
    VDownValue: string,
    leftDownValue: string,
    middleDownValue: string,
    rightDownValue: string,
    leftMiddleValue: string,
    middleMiddleValue: string,
    rightMiddleValue: string,
    leftUpValue: string,
    middleUpValue: string,
    rightUpValue: string,
}

interface ITextConfigStore {
    textConfig: ITextConfigType;
    updateTextConfig: (styleConfig: ITextConfigType) => void;
}

export const useTextConfigStore = create<ITextConfigStore>((set) => ({
    textConfig: {
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
    },
    updateTextConfig: (textConfig: ITextConfigType) =>
        set(() => ({ textConfig })),
}));
