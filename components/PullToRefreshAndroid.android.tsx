import { Host, PullToRefreshBox } from "@expo/ui/jetpack-compose";
import {
  fillMaxWidth,
  wrapContentHeight,
  wrapContentWidth,
} from "@expo/ui/jetpack-compose/modifiers";
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
  return (
    <Host style={{ flex: 1 }}>
      <PullToRefreshBox
        isRefreshing={refreshing}
        onRefresh={onRefresh}
        modifiers={[
          fillMaxWidth(),
          wrapContentWidth("centerHorizontally"),
          wrapContentHeight("top"),
        ]}
      >
        {children}
      </PullToRefreshBox>
    </Host>
  );
};
