// FakeCallScreen.js
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  StatusBar,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { Audio } from 'expo-av';

const PINK_BG = '#ffd1e1';  // Soft pink background
const PINK = '#ff5f96';     // Vibrant pink for icons/floating button
const GREEN = '#4CAF50';    // "Call now" button color

// Active Call Screen Component
function ActiveCallScreen({ contact, onEndCall }) {
  const [duration, setDuration] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setDuration(prev => prev + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m < 10 ? '0' + m : m}:${s < 10 ? '0' + s : s}`;
  };

  return (
    <View style={styles.activeCallContainer}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      <View style={styles.activeCallHeader}>
        <Text style={styles.activeCallTitle}>In Call</Text>
        <Text style={styles.activeCallTimer}>{formatTime(duration)}</Text>
      </View>
      <View style={styles.activeCallBody}>
        <Image source={{ uri: contact.avatar }} style={styles.activeCallAvatar} />
        <Text style={styles.activeCallName}>{contact.name}</Text>
        <Text style={styles.activeCallPhone}>{contact.phone}</Text>
      </View>
      <TouchableOpacity style={styles.endCallButton} onPress={onEndCall}>
        <Ionicons
          name="call"
          size={32}
          color="#fff"
          style={{ transform: [{ rotate: '135deg' }] }}
        />
        <Text style={styles.endCallText}>End Call</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function FakeCallScreen({ navigation }) {
  // Contacts state
  const [contacts, setContacts] = useState([
    {
      id: '1',
      name: 'Mom',
      phone: '+91 12345 678910',
      avatar: 'https://via.placeholder.com/50/FFC0CB/000000?text=M',
    },
    {
      id: '2',
      name: 'Dad',
      phone: '+91 12345 678910',
      avatar: 'https://via.placeholder.com/50/FFC0CB/000000?text=D',
    },
  ]);

  // States for incoming and active call
  const [activeCall, setActiveCall] = useState(null);
  const [inCall, setInCall] = useState(null);
  const [countdown, setCountdown] = useState(15);
  const ringtoneRef = useRef(null);

  // States for add/edit contact modal
  const [contactModalVisible, setContactModalVisible] = useState(false);
  const [currentContact, setCurrentContact] = useState({ name: '', phone: '', avatar: '' });
  const [isEditing, setIsEditing] = useState(false);

  // Navigation and basic actions
  const handleBack = () => navigation.goBack();

  // Open modal to add a new contact
  const handleAddContact = () => {
    setIsEditing(false);
    setCurrentContact({ name: '', phone: '', avatar: '' });
    setContactModalVisible(true);
  };

  // Open modal to edit an existing contact
  const handleEditContact = (contact) => {
    setIsEditing(true);
    setCurrentContact(contact);
    setContactModalVisible(true);
  };

  // Save the contact (add or update)
  const handleSaveContact = () => {
    if (!currentContact.name.trim()) {
      Alert.alert('Error', 'Name is required.');
      return;
    }
    if (!currentContact.phone.trim()) {
      Alert.alert('Error', 'Phone is required.');
      return;
    }
    if (isEditing) {
      setContacts((prev) =>
        prev.map((c) => (c.id === currentContact.id ? currentContact : c))
      );
    } else {
      const newContact = {
        ...currentContact,
        id: Date.now().toString(),
        avatar:
          currentContact.avatar ||
          'https://via.placeholder.com/50/FFC0CB/000000?text=New',
      };
      setContacts((prev) => [...prev, newContact]);
    }
    setContactModalVisible(false);
  };

  const handleCancelContact = () => {
    setContactModalVisible(false);
  };

  // Fake call logic: select a random contact and simulate incoming call
  const handleCallNow = () => {
    if (contacts.length === 0) {
      Alert.alert('No contacts', 'Please add a contact to simulate a fake call.');
      return;
    }
    const randomIndex = Math.floor(Math.random() * contacts.length);
    setActiveCall(contacts[randomIndex]);
  };

  const handleAnswerCall = () => {
    setActiveCall(null);
    setInCall(activeCall);
  };

  const handleDeclineCall = () => {
    setActiveCall(null);
    Alert.alert('Call Declined', 'You have declined the call.');
  };

  const handleEndCall = () => {
    setInCall(null);
    Alert.alert('Call Ended', 'The call has ended.');
  };

  // Countdown timer effect for incoming call
  useEffect(() => {
    let timer;
    if (activeCall) {
      setCountdown(15);
      timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            handleDeclineCall();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => timer && clearInterval(timer);
  }, [activeCall]);

  // Ringtone effect using Expo Audio API
  useEffect(() => {
    async function playRingtone() {
      try {
        const { sound } = await Audio.Sound.createAsync(
          require('../../assets/ringtone.mp3') // Adjust path if needed
        );
        ringtoneRef.current = sound;
        await sound.setIsLoopingAsync(true);
        await sound.playAsync();
      } catch (error) {
        console.log('Error playing ringtone:', error);
      }
    }
    if (activeCall) {
      playRingtone();
    } else if (ringtoneRef.current) {
      ringtoneRef.current.stopAsync();
      ringtoneRef.current.unloadAsync();
      ringtoneRef.current = null;
    }
    return () => {
      if (ringtoneRef.current) {
        ringtoneRef.current.stopAsync();
        ringtoneRef.current.unloadAsync();
        ringtoneRef.current = null;
      }
    };
  }, [activeCall]);

  // If in active call, show the ActiveCallScreen component
  if (inCall) {
    return <ActiveCallScreen contact={inCall} onEndCall={handleEndCall} />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={PINK_BG} />

      {/* Header */}
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>Fake Call</Text>
      </View>

      {/* Subtitle */}
      <Text style={styles.subtitle}>
        The Fake Call feature allows you to simulate an incoming call to quickly exit
        uncomfortable or risky situations.
      </Text>

      {/* Contact List */}
      <ScrollView style={styles.contactList} contentContainerStyle={{ paddingBottom: 140 }}>
        {contacts.map((contact) => (
          <View key={contact.id} style={styles.contactCard}>
            <View style={styles.contactInfo}>
              <Image source={{ uri: contact.avatar }} style={styles.avatar} />
              <View style={{ marginLeft: 10 }}>
                <Text style={styles.contactName}>{contact.name}</Text>
                <Text style={styles.contactPhone}>{contact.phone}</Text>
              </View>
            </View>
            <TouchableOpacity onPress={() => handleEditContact(contact)}>
              <MaterialIcons name="edit" size={20} color="#666" />
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>

      {/* Floating Add Contact Button */}
      <TouchableOpacity style={styles.floatingButton} onPress={handleAddContact}>
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>

      {/* "Call now" Button */}
      <TouchableOpacity style={styles.callButton} onPress={handleCallNow}>
        <Ionicons name="call-outline" size={18} color="#fff" style={{ marginRight: 8 }} />
        <Text style={styles.callButtonText}>Call now</Text>
      </TouchableOpacity>

      {/* Informational Note */}
      <Text style={styles.note}>
        Note: The Fake Call feature is designed to help you stay safe by giving you a quick
        and discreet way to exit any uncomfortable situation.
      </Text>

      {/* Incoming Call Modal */}
      {activeCall && (
        <Modal animationType="slide" transparent={true} visible={true}>
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalHeader}>Incoming Call</Text>
              <Text style={styles.countdownText}>Ringing... {countdown}s</Text>
              <Image source={{ uri: activeCall.avatar }} style={styles.modalAvatar} />
              <Text style={styles.modalName}>{activeCall.name}</Text>
              <Text style={styles.modalPhone}>{activeCall.phone}</Text>
              <View style={styles.modalButtons}>
                <TouchableOpacity style={styles.answerButton} onPress={handleAnswerCall}>
                  <Text style={styles.buttonText}>Answer</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.declineButton} onPress={handleDeclineCall}>
                  <Text style={styles.buttonText}>Decline</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* Add/Edit Contact Modal */}
      {contactModalVisible && (
        <Modal animationType="slide" transparent={true} visible={contactModalVisible}>
          <View style={styles.contactModalContainer}>
            <View style={styles.contactModalContent}>
              <Text style={styles.modalHeader}>
                {isEditing ? 'Edit Contact' : 'Add Contact'}
              </Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Name"
                value={currentContact.name}
                onChangeText={(text) =>
                  setCurrentContact({ ...currentContact, name: text })
                }
              />
              <TextInput
                style={styles.modalInput}
                placeholder="Phone"
                value={currentContact.phone}
                onChangeText={(text) =>
                  setCurrentContact({ ...currentContact, phone: text })
                }
                keyboardType="phone-pad"
              />
              <TextInput
                style={styles.modalInput}
                placeholder="Avatar URL (optional)"
                value={currentContact.avatar}
                onChangeText={(text) =>
                  setCurrentContact({ ...currentContact, avatar: text })
                }
              />
              <View style={styles.modalButtonsRow}>
                <TouchableOpacity style={styles.modalButton} onPress={handleSaveContact}>
                  <Text style={styles.buttonText}>Save</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, { backgroundColor: '#ccc' }]}
                  onPress={handleCancelContact}
                >
                  <Text style={[styles.buttonText, { color: '#333' }]}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: PINK_BG,
    paddingHorizontal: 20,
    position: 'relative',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: PINK,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
  },
  subtitle: {
    marginTop: 15,
    fontSize: 14,
    lineHeight: 20,
    color: '#333',
  },
  contactList: {
    flex: 1,
    marginTop: 20,
  },
  contactCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingVertical: 15,
    paddingHorizontal: 15,
    marginBottom: 15,
    justifyContent: 'space-between',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  contactInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#ddd',
  },
  contactName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  contactPhone: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  floatingButton: {
    position: 'absolute',
    right: 20,
    bottom: 140,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: PINK,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 4,
  },
  callButton: {
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: 60,
    backgroundColor: GREEN,
    borderRadius: 25,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 6,
  },
  callButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  note: {
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: 10,
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    lineHeight: 16,
  },
  // Enhanced Modal styles for incoming call
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    width: '100%',
    maxWidth: 350,
    paddingVertical: 30,
    paddingHorizontal: 25,
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 10,
  },
  modalHeader: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 10,
  },
  countdownText: {
    fontSize: 16,
    color: '#ff4b4b',
    marginBottom: 15,
  },
  modalAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#ddd',
    marginBottom: 15,
  },
  modalName: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 5,
  },
  modalPhone: {
    fontSize: 18,
    color: '#666',
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  answerButton: {
    backgroundColor: GREEN,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 25,
    marginRight: 10,
    flex: 1,
    alignItems: 'center',
  },
  declineButton: {
    backgroundColor: '#ff4b4b',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 25,
    flex: 1,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  // Enhanced styles for active call screen
  activeCallContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 50,
  },
  activeCallHeader: {
    alignItems: 'center',
  },
  activeCallTitle: {
    fontSize: 24,
    color: '#fff',
    fontWeight: '700',
  },
  activeCallTimer: {
    fontSize: 18,
    color: '#fff',
    marginTop: 5,
  },
  activeCallBody: {
    alignItems: 'center',
  },
  activeCallAvatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#ddd',
    marginBottom: 15,
  },
  activeCallName: {
    fontSize: 22,
    color: '#fff',
    fontWeight: '600',
    marginBottom: 5,
  },
  activeCallPhone: {
    fontSize: 18,
    color: '#fff',
  },
  endCallButton: {
    backgroundColor: '#ff4b4b',
    borderRadius: 50,
    padding: 20,
    alignItems: 'center',
  },
  endCallText: {
    color: '#fff',
    marginTop: 5,
    fontSize: 16,
    fontWeight: '700',
  },
  // Enhanced Modal styles for add/edit contact
  contactModalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  contactModalContent: {
    backgroundColor: '#fff',
    width: '100%',
    maxWidth: 350,
    padding: 20,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 10,
  },
  modalInput: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    marginVertical: 10,
  },
  modalButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    backgroundColor: GREEN,
    padding: 10,
    marginHorizontal: 5,
    borderRadius: 8,
    alignItems: 'center',
  },
});

