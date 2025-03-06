// ShakeHandler.js
import React, { useContext } from 'react';
import { useNavigation } from '@react-navigation/native';
import useShake from '../hooks/useShake';
import { ShakeDetectionContext } from '../../src/context/ShakeDetectionContext';

export default function ShakeHandler() {
  const navigation = useNavigation();
  const { isShakeEnabled } = useContext(ShakeDetectionContext);

  useShake(() => {
    // Navigate to SOS screen with auto activation if shake detection is enabled.
    navigation.navigate('SOS', { autoActivate: true });
  }, 4.0, 2000, isShakeEnabled);

  return null;
}
