// useShake.js
import { useEffect, useRef } from 'react';
import { Accelerometer } from 'expo-sensors';

export default function useShake(onShake, threshold = 4.0, debounceTime = 2000, isEnabled = true) {
  const lastShakeTime = useRef(0);

  useEffect(() => {
    if (!isEnabled) {
      // If shake detection is disabled, do not subscribe.
      return;
    }
    const subscription = Accelerometer.addListener(({ x, y, z }) => {
      const totalAcceleration = Math.sqrt(x * x + y * y + z * z);
      if (totalAcceleration > threshold) {
        const now = Date.now();
        if (now - lastShakeTime.current > debounceTime) {
          lastShakeTime.current = now;
          onShake && onShake();
        }
      }
    });
    Accelerometer.setUpdateInterval(300);
    return () => subscription && subscription.remove();
  }, [onShake, threshold, debounceTime, isEnabled]);
}
