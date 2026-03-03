import { describe, expect, it } from 'vitest';
import { mergeDashboardConfigSnapshot } from './mergeDashboardConfig';

describe('mergeDashboardConfigSnapshot', () => {
  it('syncs tableId/baseToken from first dataConditions (template copy)', () => {
    const datasourceConfigSnapshot = {
      tableId: 'from-store',
      baseToken: 'store-token',
      dataRange: 'All',
      personnelField: 'p',
      horizontalField: 'h',
      horizontalCategories: { left: [''], middle: [''], right: [''] },
      verticalField: 'v',
      verticalCategories: { up: [''], middle: [''], down: [''] },
      groupField: 'g',
    };
    const textConfigSnapshot = {
      HLeftValue: 'L',
      HMiddleValue: 'M',
      HRightValue: 'R',
      VUpValue: 'U',
      VMiddleValue: 'C',
      VDownValue: 'D',
      leftDownValue: '',
      middleDownValue: '',
      rightDownValue: '',
      leftMiddleValue: '',
      middleMiddleValue: '',
      rightMiddleValue: '',
      leftUpValue: '',
      middleUpValue: '',
      rightUpValue: '',
    };

    const dashboardConfig = {
      customConfig: {
        datasourceConfig: {
          tableId: 'from-customConfig',
          baseToken: 'custom-token',
          dataRange: 'View_1',
        },
      },
      dataConditions: [{ tableId: 'from-condition', baseToken: 'condition-token' }],
    };

    const res = mergeDashboardConfigSnapshot({
      dashboardConfig,
      datasourceConfigSnapshot: datasourceConfigSnapshot as any,
      textConfigSnapshot: textConfigSnapshot as any,
    });

    expect(res.mergedDatasourceConfig.tableId).toBe('from-condition');
    expect(res.mergedDatasourceConfig.baseToken).toBe('condition-token');
    // other fields still merge from customConfig (unless overwritten by dataConditions sync)
    expect(res.mergedDatasourceConfig.dataRange).toBe('View_1');
  });

  it('merges textConfig and tolerates missing customConfig', () => {
    const datasourceConfigSnapshot = {
      tableId: '',
      dataRange: '',
      personnelField: '',
      horizontalField: '',
      horizontalCategories: { left: [''], middle: [''], right: [''] },
      verticalField: '',
      verticalCategories: { up: [''], middle: [''], down: [''] },
      groupField: '',
    };
    const textConfigSnapshot = {
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
    };

    const dashboardConfig = {
      customConfig: {
        textConfig: {
          HLeftValue: 'LEFT',
        },
      },
    };

    const res = mergeDashboardConfigSnapshot({
      dashboardConfig,
      datasourceConfigSnapshot: datasourceConfigSnapshot as any,
      textConfigSnapshot: textConfigSnapshot as any,
    });

    expect(res.mergedTextConfig.HLeftValue).toBe('LEFT');
  });
});

