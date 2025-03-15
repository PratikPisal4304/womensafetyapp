// src/screens/LiveLocationScreen.js

import * as Location from 'expo-location';
import { deleteDoc, doc, setDoc, updateDoc } from 'firebase/firestore';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, Button, Share, StyleSheet, Text, View } from 'react-native';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../../config/firebaseConfig'; // Adjust path as needed

const LiveLocationScreen = ({ route, navigation }) => {
  const { duration } = route.params; // e.g. 1 minute
  const [shareId, setShareId] = useState(null);
  const [remainingTime, setRemainingTime] = useState(duration * 60); // seconds
  const [locationSubscription, setLocationSubscription] = useState(null);
  const timerRef = useRef(null);

  useEffect(() => {
    console.log('LiveLocationScreen mounted.');
    startSharing().catch((err) => {
      console.error('startSharing threw an error:', err);
      Alert.alert('Error', 'Failed to start live sharing.');
      navigation.goBack();
    });

    return () => {
      console.log('LiveLocationScreen unmounted, cleaning up...');
      if (locationSubscription) locationSubscription.remove();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const startSharing = async () => {
    console.log('startSharing called.');

    // 1) Request location permission
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      console.log('Location permission not granted. Navigating back.');
      Alert.alert('Permission Denied', 'Location permission is required.');
      navigation.goBack();
      return;
    }
    console.log('Location permission granted.');

    // 2) Generate a unique share ID
    const id = uuidv4();
    setShareId(id);
    console.log('Generated share ID:', id);

    // 3) Get initial location
    try {
      console.log('Fetching initial location...');
      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      console.log('Successfully fetched initial location:', currentLocation.coords);

      const { latitude, longitude } = currentLocation.coords;
      const expiresAt = new Date(Date.now() + duration * 60 * 1000);

      // 4) Create Firestore document
      console.log('Creating Firestore document...');
      await setDoc(doc(db, 'liveLocations', id), {
        location: { latitude, longitude },
        createdAt: new Date(),
        expiresAt,
      });
      console.log('Firestore document created with ID:', id);

      // 5) Start watching location
      console.log('Starting watchPositionAsync...');
      const subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 5000, // update every 5 seconds
          distanceInterval: 1,
        },
        async (loc) => {
          const { latitude, longitude } = loc.coords;
          console.log('Location updated:', latitude, longitude);
          await updateDoc(doc(db, 'liveLocations', id), {
            location: { latitude, longitude },
          });
        }
      );
      setLocationSubscription(subscription);
      console.log('Location watcher started.');

      // 6) Delay 1 second, then open share sheet
      console.log('Scheduling share sheet after 1s delay...');
      setTimeout(() => {
        console.log('Triggering share sheet now...');
        const shareLink = `https://rakshasetu-c9e0b.web.app/live?shareId=${id}`;
        Share.share({
          message: `Track my live location for ${duration} minute(s): ${shareLink}`,
        })
          .then((res) => console.log('Share result:', res))
          .catch((err) => console.error('Share error:', err));
      }, 1000);

      // 7) Start countdown timer
      console.log(`Starting countdown timer for ${duration} minute(s).`);
      timerRef.current = setInterval(() => {
        setRemainingTime((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            stopSharing();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (error) {
      console.error('Error fetching initial location or creating doc:', error);
      Alert.alert('Error', 'Could not fetch location or create Firestore doc.');
      navigation.goBack();
    }
  };

  const stopSharing = async () => {
    console.log('stopSharing called.');
    if (locationSubscription) {
      locationSubscription.remove();
      console.log('Location subscription removed.');
    }
    if (shareId) {
      console.log('Deleting Firestore document with ID:', shareId);
      await deleteDoc(doc(db, 'liveLocations', shareId));
    }
    Alert.alert('Live Sharing Ended', 'Your live location sharing has ended.');
    navigation.goBack();
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Live Location Sharing</Text>
      <Text style={styles.timer}>Time Remaining: {formatTime(remainingTime)}</Text>
      <Button title="Stop Sharing" onPress={stopSharing} />
    </View>
  );
};

export default LiveLocationScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  timer: {
    fontSize: 20,
    marginBottom: 20,
  },
});
