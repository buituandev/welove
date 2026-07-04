import React from "react";

export interface PullToRefreshAndroidProps {
  refreshing: boolean;
  onRefresh: () => void | Promise<void>;
  children: React.ReactNode;
}

export const PullToRefreshAndroid = ({
  refreshing,
  onRefresh,
  children,
}: PullToRefreshAndroidProps) => {
  return <>{children}</>;
};
