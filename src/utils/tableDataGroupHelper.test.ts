import { describe, expect, it, vi } from 'vitest';

import { TableDataGroupHelper } from './tableDataGroupHelper';

function createHelper() {
  const bitableRef = { current: null } as any;
  return new TableDataGroupHelper({
    setProgress: () => void 0,
    bitableRef,
  });
}

describe('TableDataGroupHelper（单元测试）', () => {
  it('supportedFiled：仅支持 1/3/11/19/20', () => {
    const helper = createHelper();
    expect(helper.supportedFiled(1)).toBe(true);
    expect(helper.supportedFiled(3)).toBe(true);
    expect(helper.supportedFiled(11)).toBe(true);
    expect(helper.supportedFiled(19)).toBe(true);
    expect(helper.supportedFiled(20)).toBe(true);
    expect(helper.supportedFiled(2)).toBe(false);
    expect(helper.supportedFiled(999)).toBe(false);
  });

  it('fieldTextKey：人员字段取 name，其它取 text', () => {
    const helper = createHelper();
    expect(helper.fieldTextKey(11)).toBe('name');
    expect(helper.fieldTextKey(1)).toBe('text');
  });

  it('groupTextsFor：groupField 为空返回空数组', () => {
    const helper = createHelper();
    expect(helper.groupTextsFor([], null)).toEqual([]);
  });

  it('groupTextsFor：单选字段（type=3）从 options 中取 name/text', () => {
    const helper = createHelper();
    const records: any[] = [];
    const groupField: any = {
      id: 'group',
      type: 3,
      property: { options: [{ name: 'A' }, { text: 'B' }] },
    };
    expect(helper.groupTextsFor(records as any, groupField)).toEqual(['A', 'B']);
  });

  it('groupTextsFor：非单选字段从 records 中去重抽取 text', () => {
    const helper = createHelper();
    const groupField: any = { id: 'group', type: 1 };
    const records: any[] = [
      { fields: { group: { text: 'X' } } },
      { fields: { group: { text: 'Y' } } },
      { fields: { group: { text: 'X' } } },
      { fields: { group: null } },
    ];
    const result = helper.groupTextsFor(records as any, groupField);
    expect(result.sort()).toEqual(['X', 'Y']);
  });

  it('groupRecordsByInfo：未设置 groupField 时返回默认分组', () => {
    const helper = createHelper();
    const records: any[] = [{ fields: {} }, { fields: {} }];
    expect(helper.groupRecordsByInfo(records as any, null, [])).toEqual([
      { category: '', persons: records },
    ]);
  });

  it('groupRecordsByInfo：按 groupTexts 分组筛选', () => {
    const helper = createHelper();
    const groupField: any = { id: 'group' };
    const records: any[] = [
      { fields: { group: { text: 'A' } } },
      { fields: { group: { text: 'B' } } },
      { fields: { group: { text: 'A' } } },
    ];
    const result = helper.groupRecordsByInfo(records as any, groupField, ['A', 'B']);
    expect(result).toHaveLength(2);
    expect(result[0].category).toBe('A');
    expect(result[0].persons).toHaveLength(2);
    expect(result[1].category).toBe('B');
    expect(result[1].persons).toHaveLength(1);
  });

  it('filterRecordsByInfo：按横纵轴 option id 交集过滤', () => {
    const helper = createHelper();
    const vField: any = { id: 'v' };
    const hField: any = { id: 'h' };
    const snapshot: any = {
      verticalCategories: { up: ['v1'], middle: ['v2'], down: ['v3'] },
      horizontalCategories: { left: ['h1'], middle: ['h2'], right: ['h3'] },
    };
    const records: any[] = [
      { fields: { v: { id: 'v1' }, h: { id: 'h1' } } }, // 命中 up+left
      { fields: { v: { id: 'v1' }, h: { id: 'h2' } } },
      { fields: { v: { id: 'v2' }, h: { id: 'h1' } } },
    ];
    const result = helper.filterRecordsByInfo(records as any, vField, 'up', hField, 'left', snapshot);
    expect(result).toHaveLength(1);
    expect((result[0] as any).fields.v.id).toBe('v1');
    expect((result[0] as any).fields.h.id).toBe('h1');
  });

  it('mapRecordByDisplayInfo：映射出 category/persons/total/percent', () => {
    const helper = createHelper();
    const personnelField: any = { id: 'person', type: 11 };
    const grouped: any[] = [
      {
        category: 'TeamA',
        persons: [
          { fields: { person: [{ name: 'Alice' }] } },
          { fields: { person: [{ name: 'Bob' }] } },
        ],
      },
      { category: 'TeamB', persons: [{ fields: { person: [{ name: 'Cindy' }] } }] },
      { category: 'Empty', persons: [] },
    ];
    const res = helper.mapRecordByDisplayInfo(grouped as any, personnelField, 10);
    expect(res.total).toBe(3);
    expect(res.percent).toBe(30);
    expect(res.list).toEqual([
      { category: 'TeamA', persons: ['Alice', 'Bob'] },
      { category: 'TeamB', persons: ['Cindy'] },
    ]);
  });
});

describe('TableDataGroupHelper.prepareData（集成测试）', () => {
  it('按配置快照计算 9 个格子并写入 datasource', async () => {
    const tableId = 'tbl1';

    const fields: any[] = [
      { id: 'person', type: 11 },
      {
        id: 'group',
        type: 3,
        property: { options: [{ name: 'TeamA' }, { name: 'TeamB' }] },
      },
      { id: 'v', type: 3, property: { options: [{ id: 'v1' }, { id: 'v2' }, { id: 'v3' }] } },
      { id: 'h', type: 3, property: { options: [{ id: 'h1' }, { id: 'h2' }, { id: 'h3' }] } },
    ];

    const allRecords: any[] = [
      // leftUp: v1 + h1
      { recordId: 'r1', fields: { v: { id: 'v1' }, h: { id: 'h1' }, group: { text: 'TeamA' }, person: [{ name: 'Alice' }] } },
      { recordId: 'r2', fields: { v: { id: 'v1' }, h: { id: 'h1' }, group: { text: 'TeamB' }, person: [{ name: 'Bob' }] } },
      // middleDown: v3 + h2
      { recordId: 'r3', fields: { v: { id: 'v3' }, h: { id: 'h2' }, group: { text: 'TeamA' }, person: [{ name: 'Cindy' }] } },
      // rightMiddle: v2 + h3
      { recordId: 'r4', fields: { v: { id: 'v2' }, h: { id: 'h3' }, group: { text: 'TeamA' }, person: [{ name: 'David' }] } },
    ];

    const snapshot: any = {
      tableId,
      dataRange: 'All',
      personnelField: 'person',
      horizontalField: 'h',
      horizontalCategories: { left: ['h1'], middle: ['h2'], right: ['h3'] },
      verticalField: 'v',
      verticalCategories: { up: ['v1'], middle: ['v2'], down: ['v3'] },
      groupField: 'group',
    };

    const mockTable: any = {
      id: tableId,
      getFieldMetaList: vi.fn().mockResolvedValue(fields),
    };
    const mockBase: any = {
      getTable: vi.fn().mockResolvedValue(mockTable),
    };
    const bitableRef: any = {
      current: {
        base: mockBase,
      },
    };

    const helper = new TableDataGroupHelper({
      setProgress: () => void 0,
      bitableRef,
    });

    const loadSpy = vi
      .spyOn(helper, 'loadAllRecordsForTable')
      .mockResolvedValue(allRecords as any);

    const datasource: any = {
      allRecords: {},
    };

    await helper.prepareData(tableId, datasource, snapshot);

    expect(loadSpy).toHaveBeenCalledTimes(1);
    expect(mockBase.getTable).toHaveBeenCalledWith(tableId);
    expect(datasource.totalRowCount).toBe(4);
    expect(datasource.allRecords[tableId]).toHaveLength(4);

    // leftUp: 2 条（TeamA / TeamB 各 1）
    expect(datasource.leftUpValue.total).toBe(2);
    expect(datasource.leftUpValue.percent).toBe(50);
    expect(datasource.leftUpValue.list).toEqual([
      { category: 'TeamA', persons: ['Alice'] },
      { category: 'TeamB', persons: ['Bob'] },
    ]);

    // rightDown: 0 条
    expect(datasource.rightDownValue.total).toBe(0);
    expect(datasource.rightDownValue.percent).toBe(0);
    expect(datasource.rightDownValue.list).toEqual([]);
  });
});

