import React from "react";
import { View, Text, Switch, StyleSheet } from "react-native";
import { useTheme } from "../context/ThemeContext";

const SettingsScreen = () => {
  const { theme, toggleTheme } = useTheme();
  const isDarkMode = theme === "dark";

  return (
    <View style={[styles.container, { backgroundColor: isDarkMode ? "#121212" : "#F5FCFF" }]}>
      <Text style={[styles.text, { color: isDarkMode ? "#FFF" : "#000" }]}>Dark Mode</Text>
      <Switch value={isDarkMode} onValueChange={toggleTheme} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    fontSize: 18,
    marginBottom: 10,
  },
});

export default SettingsScreen;
