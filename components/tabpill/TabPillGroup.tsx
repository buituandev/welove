import React, { useMemo } from "react";
import { ScrollView, StyleSheet, View, ViewStyle } from "react-native";
import TabPill from "./TabPill";

export interface TabPillGroupProps {
  tabs: {
    name: string;
    onClick: () => void;
    component?: React.ReactNode;
  }[];
  activeTab: string;
  containerStyle?: ViewStyle;
  scrollViewStyle?: ViewStyle;
  contentContainerStyle?: ViewStyle;
  renderContent?: boolean;
}

const TabPillGroup: React.FC<TabPillGroupProps> = ({
  tabs,
  activeTab,
  containerStyle,
  scrollViewStyle,
  contentContainerStyle,
  renderContent = true,
}) => {
  // Memoize active component to prevent unnecessary re-renders
  const activeComponent = useMemo(() => {
    if (!renderContent) return null;
    
    const activeTabData = tabs.find((tab) => tab.name === activeTab);
    return activeTabData?.component || null;
  }, [tabs, activeTab, renderContent]);

  // Memoize tab pills to prevent re-renders when only content changes
  const tabPills = useMemo(
    () =>
      tabs.map((tab) => (
        <TabPill
          key={tab.name}
          name={tab.name}
          isActive={activeTab === tab.name}
          onPress={tab.onClick}
        />
      )),
    [tabs, activeTab]
  );

  return (
    <>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[styles.tabContainer, scrollViewStyle]}
        style={containerStyle}
      >
        {tabPills}
      </ScrollView>
      {renderContent && activeComponent && (
        <View style={contentContainerStyle}>{activeComponent}</View>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  tabContainer: {
    flexDirection: "row",
    gap: 8,
    paddingVertical: 2,
  },
});

export default TabPillGroup;

