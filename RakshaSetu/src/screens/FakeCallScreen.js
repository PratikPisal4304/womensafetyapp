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
  Dimensions,
  Vibration,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialIcons, FontAwesome5, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';

const PINK_BG = '#ffd1e1';  // Soft pink background
const PINK = '#ff5f96';     // Vibrant pink for icons/floating button
const GREEN = '#4CAF50';    // "Call now" button color
const { width, height } = Dimensions.get('window');

// Enhanced Active Call Screen Component (looks more like a real call)
function ActiveCallScreen({ contact, onEndCall }) {
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeaker, setIsSpeaker] = useState(false);
  const [keypadVisible, setKeypadVisible] = useState(false);
  const [isVideoCall, setIsVideoCall] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setDuration(prev => prev + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m < 10 ? '0' + m : m}:${s < 10 ? '0' + s : s}`;
  };

  const toggleMute = () => setIsMuted(!isMuted);
  const toggleSpeaker = () => setIsSpeaker(!isSpeaker);
  const toggleKeypad = () => setKeypadVisible(!keypadVisible);
  const toggleVideo = () => setIsVideoCall(!isVideoCall);

  return (
    <View style={styles.activeCallContainer}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      <LinearGradient
        colors={['rgba(0,0,0,0.9)', 'rgba(0,0,0,0.7)', 'rgba(20,20,40,0.9)']}
        style={styles.activeCallGradient}
      >
        <View style={styles.activeCallStatusBar}>
          <View style={styles.activeCallNetworkInfo}>
            <Text style={styles.activeCallCarrier}>Carrier</Text>
            <MaterialIcons name="network-cell" size={15} color="#fff" />
            <MaterialIcons name="wifi" size={15} color="#fff" />
          </View>
        </View>

        <View style={styles.activeCallTop}>
          <Text style={styles.activeCallTimer}>{formatTime(duration)}</Text>
          {isVideoCall && <Text style={styles.videoQualityText}>HD</Text>}
        </View>

        <View style={styles.activeCallContent}>
          <Image source={{ uri: contact.avatar }} style={styles.activeCallAvatar} />
          <Text style={styles.activeCallName}>{contact.name}</Text>
          <Text style={styles.activeCallSubText}>
            {isVideoCall ? "Video call connected" : "Call connected"}
          </Text>
          
          {/* Connection quality indicator */}
          <View style={styles.connectionQualityContainer}>
            <View style={[styles.connectionBar, styles.connectionBarActive]} />
            <View style={[styles.connectionBar, styles.connectionBarActive]} />
            <View style={[styles.connectionBar, styles.connectionBarActive]} />
            <View style={[styles.connectionBar, styles.connectionBarActive]} />
            <View style={[styles.connectionBar]} />
          </View>
        </View>

        {/* Call Controls */}
        {keypadVisible ? (
          <View style={styles.keypadContainer}>
            <View style={styles.keypadRow}>
              <TouchableOpacity style={styles.keypadButton}><Text style={styles.keypadDigit}>1</Text></TouchableOpacity>
              <TouchableOpacity style={styles.keypadButton}>
                <Text style={styles.keypadDigit}>2</Text>
                <Text style={styles.keypadLetters}>ABC</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.keypadButton}>
                <Text style={styles.keypadDigit}>3</Text>
                <Text style={styles.keypadLetters}>DEF</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.keypadRow}>
              <TouchableOpacity style={styles.keypadButton}>
                <Text style={styles.keypadDigit}>4</Text>
                <Text style={styles.keypadLetters}>GHI</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.keypadButton}>
                <Text style={styles.keypadDigit}>5</Text>
                <Text style={styles.keypadLetters}>JKL</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.keypadButton}>
                <Text style={styles.keypadDigit}>6</Text>
                <Text style={styles.keypadLetters}>MNO</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.keypadRow}>
              <TouchableOpacity style={styles.keypadButton}>
                <Text style={styles.keypadDigit}>7</Text>
                <Text style={styles.keypadLetters}>PQRS</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.keypadButton}>
                <Text style={styles.keypadDigit}>8</Text>
                <Text style={styles.keypadLetters}>TUV</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.keypadButton}>
                <Text style={styles.keypadDigit}>9</Text>
                <Text style={styles.keypadLetters}>WXYZ</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.keypadRow}>
              <TouchableOpacity style={styles.keypadButton}><Text style={styles.keypadDigit}>*</Text></TouchableOpacity>
              <TouchableOpacity style={styles.keypadButton}>
                <Text style={styles.keypadDigit}>0</Text>
                <Text style={styles.keypadLetters}>+</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.keypadButton}><Text style={styles.keypadDigit}>#</Text></TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.keypadCloseButton} onPress={toggleKeypad}>
              <Text style={styles.keypadCloseText}>Close</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.callControlsRow}>
            <TouchableOpacity style={styles.callControlButton} onPress={toggleMute}>
              <Ionicons name={isMuted ? "mic-off" : "mic"} size={24} color="#fff" />
              <Text style={styles.callControlText}>{isMuted ? "Unmute" : "Mute"}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.callControlButton} onPress={toggleKeypad}>
              <Feather name="hash" size={24} color="#fff" />
              <Text style={styles.callControlText}>Keypad</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.callControlButton} onPress={toggleSpeaker}>
              <MaterialCommunityIcons name={isSpeaker ? "volume-high" : "volume-medium"} size={24} color={isSpeaker ? "#4CAF50" : "#fff"} />
              <Text style={[styles.callControlText, isSpeaker && {color: "#4CAF50"}]}>Speaker</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.callControlButton} onPress={toggleVideo}>
              <FontAwesome5 name="video" size={22} color={isVideoCall ? "#4CAF50" : "#fff"} />
              <Text style={[styles.callControlText, isVideoCall && {color: "#4CAF50"}]}>Video</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.callControlButton}>
              <Ionicons name="add" size={24} color="#fff" />
              <Text style={styles.callControlText}>Add</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.activeCallFooter}>
          <TouchableOpacity style={styles.endCallButton} onPress={onEndCall}>
            <Ionicons
              name="call"
              size={36}
              color="#fff"
              style={{ transform: [{ rotate: '135deg' }] }}
            />
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </View>
  );
}

// Upgraded Incoming Call UI
function IncomingCallModal({ activeCall, countdown, handleAnswerCall, handleDeclineCall }) {
  const [pulseAnimation, setPulseAnimation] = useState(false);
  
  // Create pulsing effect
  useEffect(() => {
    const interval = setInterval(() => {
      setPulseAnimation(prev => !prev);
      Vibration.vibrate(500);
    }, 2000);
    
    return () => {
      clearInterval(interval);
      Vibration.cancel();
    };
  }, []);

  // Call actions
  const callActions = [
    { icon: 'chatbubble-ellipses', text: 'Message' },
    { icon: 'alarm', text: 'Remind me' }
  ];

  return (
    <View style={styles.incomingCallModalContainer}>
      <LinearGradient
        colors={['rgba(0,0,0,0.9)', 'rgba(10,10,30,0.85)']}
        style={styles.incomingCallGradient}
      >
        <View style={styles.incomingStatusBar}>
          <Text style={styles.incomingCallTime}>
            {new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
          </Text>
        </View>
        
        <View style={styles.incomingCallHeader}>
          <View style={styles.incomingCallDot} />
          <Text style={styles.incomingCallTitle}>Incoming call</Text>
          <Text style={styles.incomingCallCountdown}>{countdown}s</Text>
        </View>
        
        <View style={styles.incomingContactInfo}>
          <Image 
            source={{ uri: activeCall.avatar }} 
            style={[
              styles.incomingCallAvatar,
              pulseAnimation && styles.pulsingAvatar
            ]} 
          />
          <Text style={styles.incomingCallName}>{activeCall.name}</Text>
          <Text style={styles.incomingCallNumber}>{activeCall.phone}</Text>
          <Text style={styles.incomingCallSubtitle}>Mobile • United States</Text>
        </View>
        
        {/* Call actions */}
        <View style={styles.incomingCallActions}>
          {callActions.map((action, index) => (
            <TouchableOpacity key={index} style={styles.incomingCallAction}>
              <View style={styles.incomingCallActionIconContainer}>
                <Ionicons name={action.icon} size={20} color="#fff" />
              </View>
              <Text style={styles.incomingCallActionText}>{action.text}</Text>
            </TouchableOpacity>
          ))}
        </View>
        
        {/* Accept/Decline buttons */}
        <View style={styles.incomingCallButtonsContainer}>
          <View style={styles.callButtonColumn}>
            <TouchableOpacity style={styles.declineButton} onPress={handleDeclineCall}>
              <Ionicons name="call" size={28} color="#fff" style={{ transform: [{ rotate: '135deg' }] }} />
            </TouchableOpacity>
            <Text style={styles.callButtonLabel}>Decline</Text>
          </View>
          
          <View style={styles.callButtonColumn}>
            <TouchableOpacity style={styles.answerButton} onPress={handleAnswerCall}>
              <Ionicons name="call" size={28} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.callButtonLabel}>Accept</Text>
          </View>
        </View>
        
        {/* Swipe to answer UI hint */}
        <View style={styles.swipeContainer}>
          <View style={styles.swipeIndicator}>
            <Text style={styles.swipeText}>Swipe up to answer</Text>
            <Ionicons name="chevron-up" size={18} color="#fff" style={styles.swipeIcon} />
          </View>
        </View>
      </LinearGradient>
    </View>
  );
}

export default function FakeCallScreen({ navigation }) {
  // Contacts state with improved avatar URLs
  const [contacts, setContacts] = useState([
    {
      id: '1',
      name: 'Mom',
      phone: '+1 (555) 123-4567',
      avatar: 'https://via.placeholder.com/200/E9967A/FFFFFF?text=M',
    },
    {
      id: '2',
      name: 'Dad',
      phone: '+1 (555) 987-6543',
      avatar: 'https://via.placeholder.com/200/6495ED/FFFFFF?text=D',
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
      // Generate a more realistic avatar with a better placeholder service
      const initial = currentContact.name.charAt(0).toUpperCase();
      const randomColor = Math.floor(Math.random()*16777215).toString(16);
      
      const newContact = {
        ...currentContact,
        id: Date.now().toString(),
        avatar: currentContact.avatar || 
          `https://via.placeholder.com/200/${randomColor}/FFFFFF?text=${initial}`,
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
          <IncomingCallModal 
            activeCall={activeCall}
            countdown={countdown}
            handleAnswerCall={handleAnswerCall}
            handleDeclineCall={handleDeclineCall}
          />
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

  // INCOMING CALL STYLES
  incomingCallModalContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  incomingCallGradient: {
    flex: 1,
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingBottom: 40,
  },
  incomingStatusBar: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
  },
  incomingCallTime: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  incomingCallHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 30,
  },
  incomingCallDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4CAF50',
    marginRight: 8,
  },
  incomingCallTitle: {
    fontSize: 18,
    fontWeight: '500',
    color: '#fff',
    marginRight: 10,
  },
  incomingCallCountdown: {
    fontSize: 16,
    color: '#ff4b4b',
    fontWeight: '600',
  },
  incomingContactInfo: {
    alignItems: 'center',
    marginBottom: 30,
  },
  incomingCallAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: '#4CAF50',
    marginBottom: 20,
  },
  pulsingAvatar: {
    borderColor: '#fff',
    transform: [{ scale: 1.05 }],
  },
  incomingCallName: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 5,
  },
  incomingCallNumber: {
    fontSize: 16,
    color: '#ccc',
    marginBottom: 5,
  },
  incomingCallSubtitle: {
    fontSize: 14,
    color: '#999',
  },
  incomingCallActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 50,
  },
  incomingCallAction: {
    alignItems: 'center',
    marginHorizontal: 20,
  },
  incomingCallActionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  incomingCallActionText: {
    fontSize: 12,
    color: '#fff',
  },
  incomingCallButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginHorizontal: 40,
    marginBottom: 30,
  },
  callButtonColumn: {
    alignItems: 'center',
  },
  answerButton: {
    backgroundColor: '#4CAF50',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  declineButton: {
    backgroundColor: '#ff4b4b',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  callButtonLabel: {
    color: '#fff',
    fontSize: 14,
  },
  swipeContainer: {
    alignItems: 'center',
  },
  swipeIndicator: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  swipeText: {
    color: '#fff',
    marginRight: 5,
  },
  swipeIcon: {
    marginTop: 2,
  },

  // ACTIVE CALL STYLES
  activeCallContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  activeCallGradient: {
    flex: 1,
    justifyContent: 'space-between',
  },
  activeCallStatusBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    height: 40,
  },
  activeCallNetworkInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  activeCallCarrier: {
    color: '#fff',
    fontSize: 12,
    marginRight: 5,
  },
  activeCallTop: {
    width: '100%',
    alignItems: 'center',
    paddingTop: 20,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  activeCallTimer: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
  },
  videoQualityText: {
    fontSize: 14,
    color: '#4CAF50',
    marginLeft: 10,
  },
  activeCallContent: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  activeCallAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: '#4CAF50',
    marginBottom: 15,
  },
  activeCallName: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 5,
  },
  activeCallSubText: {
    fontSize: 16,
    color: '#ccc',
    marginBottom: 20,
  },
  connectionQualityContainer: {
    flexDirection: 'row',
    marginTop: 10,
  },
  connectionBar: {
    width: 4,
    height: 20,
    backgroundColor: '#555',
    marginHorizontal: 2,
  },
  connectionBarActive: {
    backgroundColor: '#4CAF50',
  },
  keypadContainer: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 20,
    borderRadius: 10,
    margin: 20,
  },
  keypadRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 15,
  },
  keypadButton: {
    backgroundColor: '#333',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  keypadDigit: {
    fontSize: 22,
    color: '#fff',
  },
  keypadLetters: {
    fontSize: 10,
    color: '#ccc',
  },
  keypadCloseButton: {
    marginTop: 10,
    alignSelf: 'center',
  },
  keypadCloseText: {
    color: '#fff',
    fontSize: 16,
  },
  callControlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  callControlButton: {
    alignItems: 'center',
  },
  callControlText: {
    color: '#fff',
    marginTop: 5,
    fontSize: 12,
  },
  activeCallFooter: {
    alignItems: 'center',
    marginBottom: 30,
  },
  endCallButton: {
    backgroundColor: '#ff4b4b',
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // CONTACT MODAL STYLES
  contactModalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  contactModalContent: {
    width: '80%',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
  },
  modalHeader: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 15,
    textAlign: 'center',
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    marginBottom: 15,
  },
  modalButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 5,
    backgroundColor: PINK,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export { FakeCallScreen };
