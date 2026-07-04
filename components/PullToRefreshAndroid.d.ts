import React from 'react';

export interface PullToRefreshAndroidProps {
  refreshing: boolean;
  onRefresh: () => void | Promise<void>;
  children: React.ReactNode;
}

export declare function PullToRefreshAndroid(props: PullToRefreshAndroidProps): React.ReactElement | null;
