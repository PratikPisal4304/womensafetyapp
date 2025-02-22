import React from "react";
import { ThemeProvider } from './src/context/ThemeContext';
import { NavigationContainer } from "@react-navigation/native";
import Routes from "./src/routes";

const App = () => {
  return (
    <ThemeProvider>
      <NavigationContainer>
       <Routes />
      </NavigationContainer>
    </ThemeProvider>
  );
};

export default App;
