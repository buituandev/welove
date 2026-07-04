import { Host, PullToRefreshBox } from "@expo/ui/jetpack-compose";
import {
    fillMaxWidth,
    wrapContentHeight,
    wrapContentWidth,
} from "@expo/ui/jetpack-compose/modifiers";
import { useCallback, useState } from "react";

export const PullToRefreshAndroid = ({
    children,
}: {
    children: React.ReactNode;
}) => {
    const [refreshing, setRefreshing] = useState(false);

    const onRefresh = useCallback(() => {
        //Refresh Logic
    }, []);

    return (
        <Host matchContents>
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