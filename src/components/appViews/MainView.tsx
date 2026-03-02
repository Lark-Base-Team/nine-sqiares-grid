import React from 'react';
import { DashboardState, bitable as bitableSdk } from '@lark-base-open/js-sdk';

import { NineSquaresGrid } from '../nineSquaresGrid';
import { ConfigPanel } from '../configPanel';

export function MainView(props: {
  dashboardState?: DashboardState;
  datasource: any;
  isMultipleBase?: boolean;
  bitableRef: React.MutableRefObject<typeof bitableSdk | null>;
}) {
  const { dashboardState, datasource, isMultipleBase, bitableRef } = props;
  return (
    <div>
      <div className="flex h-full">
        <NineSquaresGrid />
        {dashboardState === DashboardState.Create || dashboardState === DashboardState.Config ? (
          <ConfigPanel
            tables={datasource.tables}
            dataRanges={datasource.dataRanges[datasource.tableId]}
            isMultipleBase={isMultipleBase}
            bitableRef={bitableRef}
          />
        ) : null}
      </div>
    </div>
  );
}

