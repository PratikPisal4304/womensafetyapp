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
import {
  doc,
  onSnapshot,
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  serverTimestamp
} from 'firebase/firestore';
import { auth, db } from '../../config/firebaseConfig';
import { useTranslation } from 'react-i18next';

// Replace with your actual valid Google API key
const GOOGLE_API_KEY = 'AIzaSyBzqSJUt0MVs3xFjFWTvLwiyjXwnzbkXok';

// Fallback emergency contacts if no "closeFriends" are found in Firestore.
const emergencyContacts = [
  { id: '1', name: 'Fallback Friend', phone: '+9112345678910' },
  { id: '2', name: 'Police', phone: '100' },
];

function SOSScreen() {
  const { t } = useTranslation();
  const [isSOSActive, setIsSOSActive] = useState(false);
  const [countdown, setCountdown] = useState(10);
  const [isSendingSOS, setIsSendingSOS] = useState(false);
  const [location, setLocation] = useState(null);
  const [closeFriends, setCloseFriends] = useState([]); // Firestore field "closeFriends"

  // Listen for changes to the user's "closeFriends" field.
  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const userDocRef = doc(db, 'users', user.uid);
    console.log("Listening for 'closeFriends' in user's doc...");

    const unsubscribe = onSnapshot(
      userDocRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          if (data.closeFriends && Array.isArray(data.closeFriends)) {
            console.log("Fetched closeFriends:", data.closeFriends);
            setCloseFriends(data.closeFriends);
          } else {
            console.log("No 'closeFriends' array found in user doc.");
            setCloseFriends([]);
          }
        } else {
          console.log("User document does not exist.");
          setCloseFriends([]);
        }
      },
      (error) => {
        console.error("Error fetching user doc:", error);
        Alert.alert(t('common.error'), t('sos.failedToSend'));
      }
    );

    return () => unsubscribe();
  }, [t]);

  // Request location permission on mount.
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(t('common.error'), t('sos.permissionDenied'));
      }
    })();
  }, [t]);

  // Countdown logic with vibration.
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

  // Function to send SOS message via in-app chat.
  const sendSOSInAppChat = async (message) => {
    const user = auth.currentUser;
    if (!user) return;
    try {
      // Query all threads where the current user is a participant.
      const threadsQuery = query(
        collection(db, "threads"),
        where("participants", "array-contains", user.uid)
      );
      const querySnapshot = await getDocs(threadsQuery);
      querySnapshot.forEach(async (docSnap) => {
        const threadId = docSnap.id;
        // Add the SOS message to each thread's messages subcollection.
        await addDoc(collection(db, "threads", threadId, "messages"), {
          senderId: user.uid,
          text: message,
          media: null,
          createdAt: serverTimestamp(),
          read: false,
        });
        // Optionally, update the thread's lastMessage.
        await updateDoc(doc(db, "threads", threadId), {
          lastMessage: message,
          lastTimestamp: serverTimestamp(),
        });
      });
      console.log("SOS in-app messages sent.");
    } catch (e) {
      console.error("Error sending SOS via in-app chat:", e);
    }
  };

  const triggerSOS = async () => {
    setIsSendingSOS(true);
    try {
      // Get current location.
      const loc = await Location.getCurrentPositionAsync({});
      setLocation(loc.coords);
      const { latitude, longitude } = loc.coords;
  
      // Create multiple Street View URLs with different headings.
      const streetViewUrl1 = `https://maps.googleapis.com/maps/api/streetview?size=400x400&location=${latitude},${longitude}&fov=90&heading=0&pitch=10&key=${GOOGLE_API_KEY}`;
      const streetViewUrl2 = `https://maps.googleapis.com/maps/api/streetview?size=400x400&location=${latitude},${longitude}&fov=90&heading=120&pitch=10&key=${GOOGLE_API_KEY}`;
      const streetViewUrl3 = `https://maps.googleapis.com/maps/api/streetview?size=400x400&location=${latitude},${longitude}&fov=90&heading=240&pitch=10&key=${GOOGLE_API_KEY}`;
  
      // Compose the SOS message:
      // Keep the header separate and add an emergency message.
      const message = `${t('sos.header')}
  
  ${t('sos.emergencyMessage')}
  
  My location: https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}
  
  Street View 1: ${streetViewUrl1}
  
  Street View 2: ${streetViewUrl2}
  
  Street View 3: ${streetViewUrl3}`;
  
      // Send SMS to emergency contacts (closeFriends if available, fallback otherwise).
      const allContacts = closeFriends.length > 0 ? closeFriends : emergencyContacts;
      console.log("Sending SMS to:", allContacts);
  
      const isAvailable = await SMS.isAvailableAsync();
      if (isAvailable) {
        await SMS.sendSMSAsync(
          allContacts.map(contact => contact.phone),
          message
        );
        Alert.alert(t('sos.sosSent'), t('sos.sosSentMessage'));
      } else {
        Alert.alert(t('sos.smsNotAvailable'), t('sos.smsNotAvailableMessage'));
      }
  
      // Also send the SOS message via in-app chat to all chats.
      await sendSOSInAppChat(message);
    } catch (error) {
      console.error('Error triggering SOS:', error);
      Alert.alert(t('common.error'), t('sos.failedToSend'));
    }
    setIsSendingSOS(false);
    setIsSOSActive(false);
  };
  

  return (
    <View style={styles.container}>
      <Text style={styles.header}>{t('sos.header')}</Text>
      <Text style={styles.infoText}>{t('sos.infoText')}</Text>
      
      {!isSOSActive && !isSendingSOS && (
        <TouchableOpacity style={styles.sosButton} onPress={startSOS}>
          <Text style={styles.sosButtonText}>{t('sos.sosButton')}</Text>
        </TouchableOpacity>
      )}

      {isSOSActive && (
        <View style={styles.countdownContainer}>
          <Text style={styles.countdownText}>
            {t('sos.countdown', { count: countdown })}
          </Text>
          <TouchableOpacity style={styles.cancelButton} onPress={cancelSOS}>
            <Text style={styles.cancelButtonText}>{t('sos.cancelAlert')}</Text>
          </TouchableOpacity>
        </View>
      )}

      {isSendingSOS && (
        <View style={styles.sendingContainer}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.sendingText}>{t('sos.sendingText')}</Text>
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
            <Marker coordinate={location} title={t('sos.header')} />
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

export default SOSScreen;
