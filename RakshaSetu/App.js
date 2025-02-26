import React from "react";
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from "@react-navigation/native";
import Routes from "./src/routes";

const App = () => {
  return (
    
      <SafeAreaProvider>
        <NavigationContainer>
          <Routes/>
        </NavigationContainer>
      </SafeAreaProvider>
    
  );
};

export default App;
