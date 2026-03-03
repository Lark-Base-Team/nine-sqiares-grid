import React from 'react';
import { t } from 'i18next';

import { Empty } from '../Empty';

export function NotSupportedView(props: { theme: 'light' | 'dark' | 'primary' }) {
  const { theme } = props;
  return (
    <div style={{ width: '100%', height: '100%', display: 'grid', alignItems: 'center', justifyItems: 'center' }}>
      <div
        style={{
          width: '100%',
          height: 'max-content',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          rowGap: '10px',
          justifyItems: 'center',
          flexWrap: 'wrap',
        }}
      >
        <Empty />
        <div
          style={{
            textAlign: 'center',
            fontSize: '16px',
            color: theme === 'light' ? '#1F2329' : '#FFFFFF',
            whiteSpace: 'normal',
            wordWrap: 'break-word',
            overflowWrap: 'break-word',
          }}
        >
          {t('暂不支持展示')}
        </div>
      </div>
    </div>
  );
}

