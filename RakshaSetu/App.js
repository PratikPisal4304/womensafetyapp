import React from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { NavigationContainer } from "@react-navigation/native";
import Routes from "./src/routes";
import { UserProvider } from "./src/context/UserContext";
import { ShakeDetectionProvider } from "./src/context/ShakeDetectionContext";
import './src/i18n'; // Ensure this file exists

const App = () => {
  return (
    <UserProvider>
      <ShakeDetectionProvider>
        <SafeAreaProvider>
          <NavigationContainer>
            <Routes />
          </NavigationContainer>
        </SafeAreaProvider>
      </ShakeDetectionProvider>
    </UserProvider>
  );
};

export default App;
