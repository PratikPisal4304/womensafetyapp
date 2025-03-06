// ShakeDetectionContext.js
import React, { createContext, useState } from 'react';

export const ShakeDetectionContext = createContext();

export const ShakeDetectionProvider = ({ children }) => {
  const [isShakeEnabled, setIsShakeEnabled] = useState(true);

  return (
    <ShakeDetectionContext.Provider value={{ isShakeEnabled, setIsShakeEnabled }}>
      {children}
    </ShakeDetectionContext.Provider>
  );
};
