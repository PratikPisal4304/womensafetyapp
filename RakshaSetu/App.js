import React from "react";
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from "@react-navigation/native";
import Routes from "./src/routes";
import { UserProvider } from "./src/context/UserContext";

const App = () => {
  return (
    <UserProvider>
      <SafeAreaProvider>
        <NavigationContainer>
          <Routes/>
        </NavigationContainer>
      </SafeAreaProvider>
    </UserProvider>
  );
};

export default App;
