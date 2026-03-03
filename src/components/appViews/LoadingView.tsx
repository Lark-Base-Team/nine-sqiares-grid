import React from 'react';
import Icon from '@douyinfe/semi-icons';

import IconLoading from '../../assets/icon_loading.svg?react';

export function LoadingView(props: {
  progress: { total: number; current: number };
  theme: 'light' | 'dark' | 'primary';
}) {
  const { progress, theme } = props;
  return (
    <div style={{ width: '100%', height: '100%', display: 'grid', alignItems: 'center', justifyItems: 'center' }}>
      <div
        style={{
          width: 'max-content',
          height: 'max-content',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          rowGap: '10px',
          justifyItems: 'center',
        }}
      >
        <Icon svg={<IconLoading />} />
        <div style={{ textAlign: 'center', fontSize: '16px', color: theme === 'light' ? '#1F2329' : '#FFFFFF' }}>
          加载中...（{progress.current}/{progress.total}）
        </div>
      </div>
    </div>
  );
}

