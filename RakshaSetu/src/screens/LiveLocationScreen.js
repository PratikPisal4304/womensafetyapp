// src/screens/LiveLocationScreen.js

import * as Location from 'expo-location';
import { deleteDoc, doc, setDoc, updateDoc } from 'firebase/firestore';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Button,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
  TouchableOpacity,
} from 'react-native';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../../config/firebaseConfig'; // Adjust path as needed

const LiveLocationScreen = ({ route, navigation }) => {
  // Use duration from route params or default to 1 minute.
  const initialDuration = route.params?.duration || 1;
  const [duration, setDuration] = useState(initialDuration);
  const [isSharing, setIsSharing] = useState(false);
  const [shareId, setShareId] = useState(null);
  const [remainingTime, setRemainingTime] = useState(duration * 60); // seconds
  const [locationSubscription, setLocationSubscription] = useState(null);
  const endTimeRef = useRef(null); // will store the end timestamp for sharing

  // Format seconds into "X:YY" format (minutes:seconds)
  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // Start sharing: get permissions, create Firestore document, start location watcher.
  const startSharing = async () => {
    // Validate duration input.
    if (isNaN(duration) || duration < 1) {
      Alert.alert('Invalid Duration', 'Please enter a valid duration (minimum 1 minute).');
      return;
    }

    // Request location permissions.
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Location permission is required.');
      navigation.goBack();
      return;
    }

    // Generate unique share ID.
    const id = uuidv4();
    setShareId(id);
    try {
      // Get initial location.
      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      const { latitude, longitude } = currentLocation.coords;
      const expiresAt = new Date(Date.now() + duration * 60 * 1000);

      // Create Firestore document.
      await setDoc(doc(db, 'liveLocations', id), {
        location: { latitude, longitude },
        createdAt: new Date(),
        expiresAt,
      });

      // Start watching location updates.
      const subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 5000, // update every 5 seconds
          distanceInterval: 1,
        },
        async (loc) => {
          const { latitude, longitude } = loc.coords;
          await updateDoc(doc(db, 'liveLocations', id), {
            location: { latitude, longitude },
          });
        }
      );
      setLocationSubscription(subscription);

      // Share link after a short delay.
      setTimeout(() => {
        const shareLink = `https://rakshasetu-c9e0b.web.app/live?shareId=${id}`;
        Share.share({
          message: `Track my live location for ${duration} minute(s): ${shareLink}`,
        }).catch((err) => console.error('Share error:', err));
      }, 1000);

      // Set the end time for the countdown and update state.
      endTimeRef.current = Date.now() + duration * 60 * 1000;
      setRemainingTime(duration * 60);
      setIsSharing(true);
    } catch (error) {
      Alert.alert('Error', 'Could not fetch location or create Firestore document.');
      navigation.goBack();
    }
  };

  // Timer effect: once sharing starts, update the remaining time every second.
  useEffect(() => {
    if (!isSharing) return;
    const interval = setInterval(() => {
      const newRemaining = Math.max(0, Math.ceil((endTimeRef.current - Date.now()) / 1000));
      setRemainingTime(newRemaining);
      if (newRemaining <= 0) {
        clearInterval(interval);
        stopSharing();
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [isSharing]);

  // Stop sharing: remove location subscription and delete Firestore document.
  const stopSharing = async () => {
    Alert.alert('Stop Sharing', 'Are you sure you want to stop live location sharing?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Stop',
        style: 'destructive',
        onPress: async () => {
          if (locationSubscription) {
            locationSubscription.remove();
          }
          if (shareId) {
            await deleteDoc(doc(db, 'liveLocations', shareId));
          }
          Alert.alert('Live Sharing Ended', 'Your live location sharing has ended.');
          navigation.goBack();
        },
      },
    ]);
  };

  // Clean up location subscription on component unmount.
  useEffect(() => {
    return () => {
      if (locationSubscription) locationSubscription.remove();
    };
  }, [locationSubscription]);

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Live Location Sharing</Text>
        {!isSharing ? (
          <>
            <Text style={styles.label}>Set Timer (minutes):</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={duration.toString()}
              onChangeText={(text) => setDuration(Number(text))}
            />
            <TouchableOpacity style={styles.button} onPress={startSharing}>
              <Text style={styles.buttonText}>Start Sharing</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={styles.timer}>Time Remaining: {formatTime(remainingTime)}</Text>
            <TouchableOpacity style={styles.buttonStop} onPress={stopSharing}>
              <Text style={styles.buttonText}>Stop Sharing</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
};

export default LiveLocationScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffd1e1', // custom background color
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  card: {
    backgroundColor: '#fff',
    width: '90%',
    borderRadius: 15,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 6,
    alignItems: 'center',
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  label: {
    fontSize: 18,
    marginBottom: 10,
    color: '#555',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    width: '80%',
    padding: 10,
    borderRadius: 8,
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#ff5f96',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 8,
    marginVertical: 10,
  },
  buttonStop: {
    backgroundColor: '#d9534f',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 8,
    marginVertical: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  timer: {
    fontSize: 24,
    marginBottom: 20,
    color: '#333',
  },
});
