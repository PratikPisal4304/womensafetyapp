// FrostedTabBar.js
import React from "react";
import { View, StyleSheet } from "react-native";
import { BottomTabBar } from "@react-navigation/bottom-tabs";
import { BlurView } from "expo-blur";

export default function FrostedTabBar(props) {
  return (
    <View style={styles.container}>
      {/* BlurView with a pinkish background overlay for a frosted pink look */}
      <BlurView
        intensity={40}       // Increase for stronger blur
        tint="light"         // 'light', 'dark', or 'default'
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
    left: 0,          // spans the entire width
    right: 0,
    bottom: 0,
    height: 70,       // a bit taller for a bigger bar
    backgroundColor: "transparent", 
    // Optional floating shadow
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
    // Pinkish tint on top of the blur
    backgroundColor: "rgba(252, 166, 197, 0.2)", 
  },
});
