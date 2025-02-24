// components/KeyboardAwareWrapper.js
import React from 'react';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';

export default function KeyboardAwareWrapper({ children }) {
  return (
    <KeyboardAwareScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ flexGrow: 1 }}
      keyboardShouldPersistTaps="handled"
      resetScrollToCoords={{ x: 0, y: 0 }}
      scrollEnabled
    >
      {children}
    </KeyboardAwareScrollView>
  );
}
