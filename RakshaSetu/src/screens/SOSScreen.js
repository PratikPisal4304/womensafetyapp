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
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../../config/firebaseConfig'; // Adjust path if needed

export default function SOSScreen() {
  const [isSOSActive, setIsSOSActive] = useState(false);
  const [countdown, setCountdown] = useState(10);
  const [isSendingSOS, setIsSendingSOS] = useState(false);
  const [location, setLocation] = useState(null);
  const [closeFriends, setcloseFriends] = useState([]); // Updated name to reflect your Firestore field

  // Fallback contacts in case no closeFriends are found
  const emergencyContacts = [
    { id: '1', name: 'Fallback Friend', phone: '+9112345678910' },
    { id: '2', name: 'Police', phone: '100' },
  ];

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const userDocRef = doc(db, 'users', user.uid);
    console.log("Listening for 'closeFriends' in user's doc...");

    // Listen to the user doc, reading the 'closeFriends' array
    const unsubscribe = onSnapshot(
      userDocRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          // Make sure to read the 'closeFriends' field exactly as named in Firestore
          if (data.closeFriends && Array.isArray(data.closeFriends)) {
            console.log("Fetched closeFriends:", data.closeFriends);
            setcloseFriends(data.closeFriends);
          } else {
            console.log("No 'closeFriends' array found in user doc.");
            setcloseFriends([]);
          }
        } else {
          console.log("User document does not exist.");
          setcloseFriends([]);
        }
      },
      (error) => {
        console.error("Error fetching user doc:", error);
        Alert.alert("Firestore Error", "Failed to fetch closeFriends data.");
      }
    );

    return () => unsubscribe();
  }, []);

  // Request location permission on mount
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required for SOS functionality.');
      }
    })();
  }, []);

  // Countdown logic with vibration
  useEffect(() => {
    let timer;
    if (isSOSActive && countdown > 0) {
      timer = setInterval(() => {
        Vibration.vibrate(500);
        setCountdown((prev) => prev - 1);
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
      const loc = await Location.getCurrentPositionAsync({});
      setLocation(loc.coords);
      const { latitude, longitude } = loc.coords;

      const message = `Emergency! I need help immediately. My location: https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;

      // If we have closeFriends in Firestore, use them; otherwise fallback
      const allContacts = closeFriends.length > 0 ? closeFriends : emergencyContacts;
      console.log("Sending SMS to:", allContacts);

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
      <Text style={styles.header}>RakshaSetu SOS</Text>
      <Text style={styles.infoText}>
        If you feel unsafe, press the button below. An alert with your current location will be sent to your emergency contacts.
      </Text>
      
      {!isSOSActive && !isSendingSOS && (
        <TouchableOpacity style={styles.sosButton} onPress={startSOS}>
          <Text style={styles.sosButtonText}>SOS</Text>
        </TouchableOpacity>
      )}

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

      {isSendingSOS && (
        <View style={styles.sendingContainer}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.sendingText}>Alerting emergency contacts...</Text>
        </View>
      )}

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
    backgroundColor: '#ffd1e1',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  header: {
    fontSize: 34,
    color: '#333',
    marginBottom: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  infoText: {
    fontSize: 16,
    color: '#444',
    textAlign: 'center',
    marginBottom: 40,
    paddingHorizontal: 20,
  },
  sosButton: {
    backgroundColor: '#e60000',
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
