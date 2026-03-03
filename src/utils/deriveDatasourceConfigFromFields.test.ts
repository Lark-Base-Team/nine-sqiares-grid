import { describe, expect, it } from 'vitest';

import type { IDatasourceConfigType } from '../store';
import { deriveDatasourceConfigFromFields } from './deriveDatasourceConfigFromFields';

function createBaseConfig(overrides?: Partial<IDatasourceConfigType>): IDatasourceConfigType {
  return {
    tableId: '',
    baseToken: undefined,
    dataRange: '',
    personnelField: '',
    horizontalField: '',
    horizontalCategories: { left: [''], middle: [''], right: [''] },
    verticalField: '',
    verticalCategories: { up: [''], middle: [''], down: [''] },
    groupField: '',
    ...(overrides ?? {}),
  };
}

describe('deriveDatasourceConfigFromFields', () => {
  it('可根据字段类型自动回填人员字段、横纵轴字段与默认分类（options >= 3）', () => {
    const fields: any[] = [
      { id: 'person', type: 11 },
      {
        id: 'h',
        type: 3,
        property: { options: [{ id: 'h1' }, { id: 'h2' }, { id: 'h3' }, { id: 'h4' }] },
      },
      {
        id: 'v',
        type: 3,
        property: { options: [{ id: 'v1' }, { id: 'v2' }, { id: 'v3' }] },
      },
    ];
    const config = createBaseConfig({
      horizontalCategories: { left: ['L0'], middle: ['M0'], right: ['R0'] },
      verticalCategories: { up: ['U0'], middle: ['MID0'], down: ['D0'] },
    });

    const nextConfig = deriveDatasourceConfigFromFields(fields, config);

    expect(nextConfig.personnelField).toBe('person');
    expect(nextConfig.horizontalField).toBe('h');
    expect(nextConfig.verticalField).toBe('v');

    // 横轴：第 0 / 中位 / 最后一个
    expect(nextConfig.horizontalCategories.left).toEqual(['h1']);
    expect(nextConfig.horizontalCategories.middle).toEqual(['h3']);
    expect(nextConfig.horizontalCategories.right).toEqual(['h4']);

    // 竖轴：第 0 / 中位 / 最后一个
    expect(nextConfig.verticalCategories.up).toEqual(['v1']);
    expect(nextConfig.verticalCategories.middle).toEqual(['v2']);
    expect(nextConfig.verticalCategories.down).toEqual(['v3']);
  });

  it('不会修改入参 config / fields（尤其是不应给原始 options 增加 disabled）', () => {
    const fields: any[] = [
      { id: 'person', type: 11 },
      { id: 'h', type: 3, property: { options: [{ id: 'h1' }, { id: 'h2' }, { id: 'h3' }] } },
      { id: 'v', type: 3, property: { options: [{ id: 'v1' }, { id: 'v2' }, { id: 'v3' }] } },
    ];
    const fieldsBefore = JSON.parse(JSON.stringify(fields));

    const config = createBaseConfig({
      horizontalCategories: { left: ['L0'], middle: ['M0'], right: ['R0'] },
      verticalCategories: { up: ['U0'], middle: ['MID0'], down: ['D0'] },
    });
    const configBefore = JSON.parse(JSON.stringify(config));

    deriveDatasourceConfigFromFields(fields, config);

    expect(fields).toEqual(fieldsBefore);
    expect(config).toEqual(configBefore);
    expect((fields[1].property.options[0] as any).disabled).toBeUndefined();
    expect((fields[2].property.options[0] as any).disabled).toBeUndefined();
  });

  it('横轴 options 为 1/2 时会提前 return（保持原行为）', () => {
    const fields1: any[] = [
      { id: 'person', type: 11 },
      { id: 'h', type: 3, property: { options: [{ id: 'h1' }] } },
      { id: 'v', type: 3, property: { options: [{ id: 'v1' }, { id: 'v2' }, { id: 'v3' }] } },
    ];
    const baseConfig1 = createBaseConfig({
      verticalField: 'v_old',
      verticalCategories: { up: ['U0'], middle: ['MID0'], down: ['D0'] },
    });
    const next1 = deriveDatasourceConfigFromFields(fields1, baseConfig1);
    expect(next1.horizontalCategories.left).toEqual(['h1']);
    // 早退导致不会处理 verticalField / verticalCategories
    expect(next1.verticalField).toBe('v_old');
    expect(next1.verticalCategories).toEqual({ up: ['U0'], middle: ['MID0'], down: ['D0'] });

    const fields2: any[] = [
      { id: 'person', type: 11 },
      { id: 'h', type: 3, property: { options: [{ id: 'h1' }, { id: 'h2' }] } },
      { id: 'v', type: 3, property: { options: [{ id: 'v1' }, { id: 'v2' }, { id: 'v3' }] } },
    ];
    const baseConfig2 = createBaseConfig({
      verticalField: 'v_old',
      verticalCategories: { up: ['U0'], middle: ['MID0'], down: ['D0'] },
    });
    const next2 = deriveDatasourceConfigFromFields(fields2, baseConfig2);
    expect(next2.horizontalCategories.left).toEqual(['h1']);
    expect(next2.horizontalCategories.middle).toEqual(['h2']);
    expect(next2.verticalField).toBe('v_old');
  });
});
