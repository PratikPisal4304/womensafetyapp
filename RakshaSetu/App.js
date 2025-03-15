import { NavigationContainer } from "@react-navigation/native";
import React from "react";
import 'react-native-get-random-values';
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ShakeDetectionProvider } from "./src/context/ShakeDetectionContext";
import { UserProvider } from "./src/context/UserContext";
import './src/i18n'; // Ensure this file exists
import Routes from "./src/routes";


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
