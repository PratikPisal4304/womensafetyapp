import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ActivityIndicator, 
  Alert, 
  Vibration 
} from 'react-native';
import * as Location from 'expo-location';
import * as SMS from 'expo-sms';
import MapView, { Marker } from 'react-native-maps';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../../config/firebaseConfig'; // Adjust the path to your firebase config

export default function SOSScreen() {
  // Local state for SOS logic
  const [isSOSActive, setIsSOSActive] = useState(false);
  const [countdown, setCountdown] = useState(10);
  const [isSendingSOS, setIsSendingSOS] = useState(false);
  const [location, setLocation] = useState(null);

  // State to hold close friends fetched from Firestore
  const [closeFriends, setCloseFriends] = useState([]);

  // Predefined emergency contacts (fallback or additional)
  const emergencyContacts = [
    { id: '1', name: 'Close Friend 1', phone: '+9112345678910' },
    { id: '2', name: 'Close Friend 2', phone: '+9112345678910' },
    { id: '3', name: 'Police', phone: '100' },
  ];

  // Fetch close friends list from Firestore
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'closeFriends'), snapshot => {
      const friendsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCloseFriends(friendsData);
    });
    return () => unsubscribe();
  }, []);

  // Request location permission when the component mounts
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required for SOS functionality.');
      }
    })();
  }, []);

  // Countdown timer with vibration feedback each second
  useEffect(() => {
    let timer;
    if (isSOSActive && countdown > 0) {
      timer = setInterval(() => {
        Vibration.vibrate(500);
        setCountdown(prev => prev - 1);
      }, 1000);
    }
    if (countdown === 0 && isSOSActive) {
      clearInterval(timer);
      triggerSOS();
    }
    return () => timer && clearInterval(timer);
  }, [isSOSActive, countdown]);

  const startSOS = () => {
    setIsSOSActive(true);
    setCountdown(10);
  };

  const cancelSOS = () => {
    setIsSOSActive(false);
    setCountdown(10);
  };

  const triggerSOS = async () => {
    setIsSendingSOS(true);
    try {
      // Get the current location
      const loc = await Location.getCurrentPositionAsync({});
      setLocation(loc.coords);
      const { latitude, longitude } = loc.coords;
      // Construct a message with a Google Maps link
      const message = `Emergency! I need help immediately. My location: https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
      // Merge predefined contacts with close friends from Firestore
      const allContacts = [...emergencyContacts, ...closeFriends];
      const isAvailable = await SMS.isAvailableAsync();
      if (isAvailable) {
        await SMS.sendSMSAsync(
          allContacts.map(contact => contact.phone),
          message
        );
        Alert.alert('SOS Sent', 'Emergency SMS sent to your contacts.');
      } else {
        Alert.alert('SMS Not Available', 'Your device does not support SMS.');
      }
    } catch (error) {
      console.error('Error triggering SOS:', error);
      Alert.alert('Error', 'Failed to send SOS alert.');
    }
    setIsSendingSOS(false);
    setIsSOSActive(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Rakshasetu SOS</Text>
      <Text style={styles.infoText}>
        If you feel unsafe, press the button below. An alert with your current location will be sent to your emergency contacts.
      </Text>
      
      {/* SOS Button */}
      {!isSOSActive && !isSendingSOS && (
        <TouchableOpacity style={styles.sosButton} onPress={startSOS}>
          <Text style={styles.sosButtonText}>SOS</Text>
        </TouchableOpacity>
      )}

      {/* Countdown Timer with Cancel Option */}
      {isSOSActive && (
        <View style={styles.countdownContainer}>
          <Text style={styles.countdownText}>
            Sending alert in {countdown} second{countdown !== 1 ? 's' : ''}
          </Text>
          <TouchableOpacity style={styles.cancelButton} onPress={cancelSOS}>
            <Text style={styles.cancelButtonText}>Cancel Alert</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Sending Indicator */}
      {isSendingSOS && (
        <View style={styles.sendingContainer}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.sendingText}>Alerting emergency contacts...</Text>
        </View>
      )}

      {/* Map View to display current location after SOS is triggered */}
      {location && (
        <View style={styles.mapContainer}>
          <MapView
            style={styles.map}
            initialRegion={{
              latitude: location.latitude,
              longitude: location.longitude,
              latitudeDelta: 0.005,
              longitudeDelta: 0.005,
            }}
          >
            <Marker coordinate={location} title="My Location" />
          </MapView>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffd1e1', // Light pink background for a gentle look
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  header: {
    fontSize: 34,
    color: '#333',
    marginBottom: 20,
    fontWeight: 'bold',
  },
  infoText: {
    fontSize: 16,
    color: '#444',
    textAlign: 'center',
    marginBottom: 40,
    paddingHorizontal: 20,
  },
  sosButton: {
    backgroundColor: '#e60000', // Bold red button for urgency
    width: 160,
    height: 160,
    borderRadius: 80,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 12,
  },
  sosButtonText: {
    fontSize: 64,
    color: '#fff',
    fontWeight: 'bold',
  },
  countdownContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  countdownText: {
    fontSize: 24,
    color: '#333',
    marginBottom: 10,
  },
  cancelButton: {
    backgroundColor: '#888',
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 8,
  },
  cancelButtonText: {
    fontSize: 20,
    color: '#fff',
  },
  sendingContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  sendingText: {
    fontSize: 22,
    color: '#333',
    marginTop: 10,
  },
  mapContainer: {
    width: '100%',
    height: 200,
    marginTop: 20,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#ccc',
  },
  map: {
    width: '100%',
    height: '100%',
  },
});
