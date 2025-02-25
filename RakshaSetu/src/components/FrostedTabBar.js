import React from "react";
import { View, StyleSheet, Platform } from "react-native";
import { BottomTabBar } from "@react-navigation/bottom-tabs";
import { BlurView } from "expo-blur";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function FrostedTabBar(props) {
  const insets = useSafeAreaInsets();
  const containerStyle = [
    styles.container,
    { paddingBottom: Platform.OS === "android" ? 0 : insets.bottom },
  ];

  return (
    <View style={containerStyle}>
      <BlurView
        intensity={40}
        tint="light"
        style={[styles.blurContainer, styles.pinkOverlay]}
      >
        <BottomTabBar {...props} />
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 80,
    backgroundColor: "transparent",
    elevation: 10,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: -2 },
    shadowRadius: 8,
  },
  blurContainer: {
    flex: 1,
  },
  pinkOverlay: {
    backgroundColor: "rgba(252, 166, 197, 0.2)",
  },
});
