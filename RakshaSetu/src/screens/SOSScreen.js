import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Vibration,
  Modal,
  Image,
  Linking,
  StatusBar,
} from 'react-native';
import * as Location from 'expo-location';
import * as SMS from 'expo-sms';
import * as Battery from 'expo-battery';
import MapView, { Marker } from 'react-native-maps';
import {
  doc,
  onSnapshot,
  collection,
  query,
  where,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { auth, db } from '../../config/firebaseConfig';
import { useRoute, useFocusEffect, useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { GOOGLE_MAPS_API_KEY } from '@env';
import { v4 as uuidv4 } from 'uuid';

// Emergency helpline numbers.
const HELPLINES = [
  { id: '1', number: '112', label: 'emergencyHelpline.localPolice', icon: require('../../assets/localpolice.png') },
  { id: '2', number: '181', label: 'emergencyHelpline.womenHelpline', icon: require('../../assets/womenhelp.png') },
  { id: '3', number: '108', label: 'emergencyHelpline.localAmbulance', icon: require('../../assets/ambulance.png') },
  { id: '4', number: '101', label: 'emergencyHelpline.fireRescue', icon: require('../../assets/firerescue.png') },
  { id: '5', number: '1930', label: 'emergencyHelpline.cyberCrime', icon: require('../../assets/cybercrime.png') },
];

function SOSScreen() {
  const { t } = useTranslation();
  const route = useRoute();
  const navigation = useNavigation();

  // SOS states
  const [isSOSActive, setIsSOSActive] = useState(false);
  const [countdown, setCountdown] = useState(10);
  const [isSendingSOS, setIsSendingSOS] = useState(false);
  const [location, setLocation] = useState(null);
  const [closeFriends, setCloseFriends] = useState([]);

  // Live Location Sharing states (default duration: 1 hour)
  const [isLiveSharing, setIsLiveSharing] = useState(false);
  const [liveShareId, setLiveShareId] = useState(null);
  const [liveRemainingTime, setLiveRemainingTime] = useState(60 * 60); // seconds
  const [liveLocationSubscription, setLiveLocationSubscription] = useState(null);
  const liveEndTimeRef = useRef(null);

  // State for Emergency Helpline Modal visibility.
  const [isHelplineModalVisible, setIsHelplineModalVisible] = useState(false);

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

  // SOS Countdown logic with vibration.
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

  // Live sharing timer: update liveRemainingTime every second.
  useEffect(() => {
    if (!isLiveSharing) return;
    const interval = setInterval(() => {
      const newRemaining = Math.max(
        0,
        Math.ceil((liveEndTimeRef.current - Date.now()) / 1000)
      );
      setLiveRemainingTime(newRemaining);
      if (newRemaining <= 0) {
        clearInterval(interval);
        stopLiveLocationSharing();
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [isLiveSharing]);

  // Auto-activate SOS if route parameter is set.
  useFocusEffect(
    useCallback(() => {
      if (route.params?.autoActivate && !isSOSActive) {
        console.log("Auto-activating SOS due to autoActivate param on focus.");
        startSOS();
        navigation.setParams({ autoActivate: false });
      }
    }, [route.params, isSOSActive, navigation])
  );

  const startSOS = () => {
    setIsSOSActive(true);
    setCountdown(10);
  };

  const cancelSOS = () => {
    setIsSOSActive(false);
    setCountdown(10);
  };

  // Send an in-app chat message.
  const sendSOSInAppChat = async (message) => {
    const user = auth.currentUser;
    if (!user) return;
    try {
      const threadsQuery = query(
        collection(db, "threads"),
        where("participants", "array-contains", user.uid)
      );
      const querySnapshot = await getDocs(threadsQuery);
      querySnapshot.forEach(async (docSnap) => {
        const threadId = docSnap.id;
        await addDoc(collection(db, "threads", threadId, "messages"), {
          senderId: user.uid,
          text: message,
          media: null,
          createdAt: serverTimestamp(),
          read: false,
        });
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

  // Log the SOS event to Firestore.
  const logSOSEvent = async (data) => {
    try {
      await addDoc(collection(db, 'sosAlerts'), {
        ...data,
        userId: auth.currentUser?.uid,
        timestamp: serverTimestamp(),
      });
      console.log("SOS event logged in Firestore.");
    } catch (error) {
      console.error("Error logging SOS event:", error);
    }
  };

  // Update the user's document with the last SOS time.
  const updateUserLastSOS = async () => {
    const user = auth.currentUser;
    if (!user) return;
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        lastSOS: serverTimestamp()
      });
      console.log("User's last SOS time updated.");
    } catch (error) {
      console.error("Error updating user's last SOS:", error);
    }
  };

  // Start live location sharing (default: 1 hour) and return the live share ID.
  const startLiveLocationSharing = async () => {
    try {
      const liveId = uuidv4();
      setLiveShareId(liveId);
      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      const { latitude, longitude } = currentLocation.coords;
      const liveExpiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

      // Create Firestore document for live location sharing.
      await setDoc(doc(db, 'liveLocations', liveId), {
        location: { latitude, longitude },
        createdAt: new Date(),
        expiresAt: liveExpiresAt,
      });

      // Start watching location updates.
      const subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 5000, // every 5 seconds
          distanceInterval: 1,
        },
        async (loc) => {
          const { latitude, longitude } = loc.coords;
          await updateDoc(doc(db, 'liveLocations', liveId), {
            location: { latitude, longitude },
          });
        }
      );
      setLiveLocationSubscription(subscription);

      // Set the live sharing end time.
      liveEndTimeRef.current = Date.now() + 60 * 60 * 1000;
      setLiveRemainingTime(60 * 60);
      setIsLiveSharing(true);
      console.log("Live location sharing started with ID:", liveId);
      return liveId;
    } catch (error) {
      console.error("Error starting live location sharing:", error);
      Alert.alert("Error", "Could not start live location sharing.");
      return null;
    }
  };

  // Stop live location sharing manually.
  const stopLiveLocationSharing = async () => {
    if (liveLocationSubscription) {
      liveLocationSubscription.remove();
    }
    if (liveShareId) {
      await deleteDoc(doc(db, 'liveLocations', liveShareId));
    }
    Alert.alert("Live Location Sharing Ended", "Your live location sharing has ended.");
    setIsLiveSharing(false);
  };

  // Handle making a call from the modal.
  const handleCall = (phoneNumber) => {
    Linking.openURL(`tel:${phoneNumber}`);
  };

  // Trigger SOS: send SMS, in-app chat, log event (with battery indicator), update last SOS, and start live location sharing.
  const triggerSOS = async () => {
    setIsSendingSOS(true);
    try {
      // Get current location.
      const loc = await Location.getCurrentPositionAsync({});
      setLocation(loc.coords);
      const { latitude, longitude } = loc.coords;

      // Get the battery level.
      let batteryLevel = await Battery.getBatteryLevelAsync();
      console.log("Raw battery level:", batteryLevel);
      if (batteryLevel == null) {
        batteryLevel = 1; // fallback to full battery if null
      }
      const batteryPercentage = Math.round(batteryLevel * 100);
      console.log("Battery percentage:", batteryPercentage);

      // Verify API key.
      if (!GOOGLE_MAPS_API_KEY) {
        console.error("GOOGLE_MAPS_API_KEY is not defined!");
        Alert.alert(t('common.error'), "API key not found.");
        setIsSendingSOS(false);
        return;
      }
      console.log("GOOGLE_MAPS_API_KEY:", GOOGLE_MAPS_API_KEY);

      // Construct Street View URLs.
      const streetViewUrl1 = `https://maps.googleapis.com/maps/api/streetview?size=400x400&location=${latitude},${longitude}&fov=90&heading=0&pitch=10&key=${GOOGLE_MAPS_API_KEY}`;
      const streetViewUrl2 = `https://maps.googleapis.com/maps/api/streetview?size=400x400&location=${latitude},${longitude}&fov=90&heading=120&pitch=10&key=${GOOGLE_MAPS_API_KEY}`;
      const streetViewUrl3 = `https://maps.googleapis.com/maps/api/streetview?size=400x400&location=${latitude},${longitude}&fov=90&heading=240&pitch=10&key=${GOOGLE_MAPS_API_KEY}`;

      console.log("Street View URLs:", streetViewUrl1, streetViewUrl2, streetViewUrl3);

      // Start live location sharing and get its ID.
      const liveId = await startLiveLocationSharing();
      const liveLocationLink = liveId ? `https://rakshasetu-c9e0b.web.app/live?shareId=${liveId}` : '';

      // Build message text including battery level.
      const message = `${t('sos.header')}

${t('sos.emergencyMessage')}

Battery Level: ${batteryPercentage}%

  My location: https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}

  Street View 1: ${streetViewUrl1}

  Street View 2: ${streetViewUrl2}

  Street View 3: ${streetViewUrl3}

  Live Location: ${liveLocationLink}`;

      // Determine contacts (closeFriends or fallback contacts).
      const allContacts = closeFriends.length > 0 ? closeFriends : [
        { id: '1', name: 'Fallback Friend', phone: '+9112345678910' },
        { id: '2', name: 'Police', phone: '100' },
      ];
      console.log("Sending SMS to:", allContacts);

      // Send SMS if available.
      const isAvailable = await SMS.isAvailableAsync();
      if (isAvailable) {
        await SMS.sendSMSAsync(
          allContacts.map((contact) => contact.phone),
          message
        );
        Alert.alert(t('sos.sosSent'), t('sos.sosSentMessage'));
      } else {
        Alert.alert(t('sos.smsNotAvailable'), t('sos.smsNotAvailableMessage'));
      }

      // Send in-app chat messages.
      await sendSOSInAppChat(message);

      // Log SOS event to Firestore including battery percentage.
      await logSOSEvent({
        latitude,
        longitude,
        message,
        streetViewUrls: [streetViewUrl1, streetViewUrl2, streetViewUrl3],
        liveLocationLink,
        batteryPercentage, // <-- Battery indicator added here.
      });

      // Update user's last SOS time.
      await updateUserLastSOS();
    } catch (error) {
      console.error('Error triggering SOS:', error);
      Alert.alert(t('common.error'), t('sos.failedToSend'));
    }
    setIsSendingSOS(false);
    setIsSOSActive(false);
  };

  return (
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      <Text style={styles.header}>{t('sos.header')}</Text>
      <Text style={styles.infoText}>{t('sos.infoText')}</Text>

      {/* SOS Controls */}
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

      {/* Live Location Sharing Controls */}
      {isLiveSharing && (
        <View style={styles.liveSharingContainer}>
          <Text style={styles.liveTimer}>
            Live Sharing: {Math.floor(liveRemainingTime / 60)}:
            {String(liveRemainingTime % 60).padStart(2, '0')}
          </Text>
          <TouchableOpacity style={styles.buttonStop} onPress={stopLiveLocationSharing}>
            <Text style={styles.buttonText}>Stop Live Sharing</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Map showing current location */}
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

      {/* Emergency Helpline Button */}
      <TouchableOpacity
        style={styles.emergencyButton}
        onPress={() => setIsHelplineModalVisible(true)}
      >
        <Text style={styles.emergencyButtonText}>{t('emergencyHelpline.header')}</Text>
      </TouchableOpacity>

      {/* Emergency Helpline Modal */}
      <Modal
        visible={isHelplineModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsHelplineModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalHeader}>{t('emergencyHelpline.header')}</Text>
            {HELPLINES.map((item) => (
              <View key={item.id} style={styles.card}>
                <Image source={item.icon} style={styles.cardImage} />
                <View style={styles.cardTextContainer}>
                  <Text style={styles.cardNumber}>{item.number}</Text>
                  <Text style={styles.cardLabel}>{t(item.label)}</Text>
                </View>
                <TouchableOpacity
                  style={styles.callButton}
                  onPress={() => handleCall(item.number)}
                >
                  <Image
                    source={require('../../assets/call.png')}
                    style={styles.callIcon}
                  />
                </TouchableOpacity>
              </View>
            ))}
            <TouchableOpacity
              style={styles.closeModalButton}
              onPress={() => setIsHelplineModalVisible(false)}
            >
              <Text style={styles.closeModalButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    width: 200,
    height: 200,
    borderRadius: 100,
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
  liveSharingContainer: {
    alignItems: 'center',
    marginVertical: 20,
    padding: 10,
    backgroundColor: '#fff',
    borderRadius: 10,
    elevation: 4,
  },
  liveTimer: {
    fontSize: 24,
    color: '#333',
    marginBottom: 10,
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
  emergencyButton: {
    backgroundColor: '#FF5F96',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 8,
    marginTop: 20,
  },
  emergencyButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFDDE5',
    borderRadius: 15,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
    color: '#333',
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 3,
  },
  cardImage: {
    width: 50,
    height: 50,
    resizeMode: 'contain',
    marginRight: 15,
  },
  cardTextContainer: {
    flex: 1,
  },
  cardNumber: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  cardLabel: {
    fontSize: 14,
    color: '#777',
    marginTop: 4,
  },
  callButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FF82A9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  callIcon: {
    width: 24,
    height: 24,
    tintColor: '#fff',
    resizeMode: 'contain',
  },
  closeModalButton: {
    backgroundColor: '#e60000',
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 8,
    alignSelf: 'center',
  },
  closeModalButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});

export default SOSScreen;
