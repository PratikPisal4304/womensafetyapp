import React from "react";
import { ThemeProvider } from './src/context/ThemeContext';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from "@react-navigation/native";
import Routes from "./src/routes";

const App = () => {
  return (
    <ThemeProvider>
      <SafeAreaProvider>
        <NavigationContainer>
          <Routes/>
        </NavigationContainer>
      </SafeAreaProvider>
    </ThemeProvider>
  );
};

export default App;
