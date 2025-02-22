import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, StatusBar, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../context/ThemeContext";

const ProfileScreen = () => {
  const { theme } = useTheme();
  const isDarkMode = theme === "dark";

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: isDarkMode ? "#121212" : "#F5FCFF" }]}
      edges={["top"]}
    >
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor={isDarkMode ? "#121212" : "#F5FCFF"} />

      <View style={[styles.container, { backgroundColor: isDarkMode ? "#1E1E1E" : "#FFF" }]}>
        {/* Profile Image */}
        <Image
          source={{ uri: "https://www.headshotpro.com/avatar-results/danny-1.webp" }} // Replace with actual image URL
          style={styles.profileImage}
        />

        {/* Profile Name */}
        <Text style={[styles.name, { color: isDarkMode ? "#FFF" : "#000" }]}>John Doe</Text>

        {/* Email */}
        <Text style={[styles.email, { color: isDarkMode ? "#CCC" : "#555" }]}>johndoe@example.com</Text>

        {/* Bio Section */}
        <Text style={[styles.bio, { color: isDarkMode ? "#BBB" : "#666" }]}>
          Passionate developer, React Native enthusiast, and tech explorer.
        </Text>

        {/* Edit Profile Button */}
        <TouchableOpacity
          style={[styles.button, { backgroundColor: isDarkMode ? "#444" : "#007BFF" }]}
          onPress={() => alert("Edit Profile")}
        >
          <Text style={[styles.buttonText, { color: "#FFF" }]}>Edit Profile</Text>
        </TouchableOpacity>

        {/* Logout Button */}
        <TouchableOpacity
          style={[styles.button, { backgroundColor: isDarkMode ? "#AA0000" : "#FF3B30" }]}
          onPress={() => alert("Logout")}
        >
          <Text style={[styles.buttonText, { color: "#FFF" }]}>Logout</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

// Styles
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    borderRadius: 10,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 15,
  },
  name: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 5,
  },
  email: {
    fontSize: 16,
    marginBottom: 15,
  },
  bio: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  button: {
    marginTop: 10,
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    width: "80%",
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default ProfileScreen;
