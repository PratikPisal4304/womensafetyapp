// CreatePinScreen.js
import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  Dimensions,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';

const { width, height } = Dimensions.get('window');
const PINK = '#ff5f96';

export default function CreatePinScreen({ navigation }) {
  // PIN states
  const [enterPin, setEnterPin] = useState(['', '', '', '']);
  const [confirmPin, setConfirmPin] = useState(['', '', '', '']);

  // Show/hide PIN
  const [showEnterPin, setShowEnterPin] = useState(false);
  const [showConfirmPin, setShowConfirmPin] = useState(false);

  // Refs for auto-focusing next digit
  const enterRefs = [useRef(null), useRef(null), useRef(null), useRef(null)];
  const confirmRefs = [useRef(null), useRef(null), useRef(null), useRef(null)];

  // Update "Enter PIN"
  const handleEnterPinChange = (text, index) => {
    const newText = text.replace(/[^0-9]/g, '').slice(-1); // Only 1 digit
    const updated = [...enterPin];
    updated[index] = newText;
    setEnterPin(updated);

    // Auto-focus next if typed
    if (newText && index < 3) {
      enterRefs[index + 1].current?.focus();
    }
  };

  // Update "Confirm PIN"
  const handleConfirmPinChange = (text, index) => {
    const newText = text.replace(/[^0-9]/g, '').slice(-1);
    const updated = [...confirmPin];
    updated[index] = newText;
    setConfirmPin(updated);

    if (newText && index < 3) {
      confirmRefs[index + 1].current?.focus();
    }
  };

  // "Create PIN" button pressed
  const handleCreatePin = () => {
    if (enterPin.includes('') || confirmPin.includes('')) {
      Alert.alert('Error', 'Please fill out all 4 digits in each PIN field.');
      return;
    }
    const pin1 = enterPin.join('');
    const pin2 = confirmPin.join('');
    if (pin1 !== pin2) {
      Alert.alert('Error', 'PINs do not match. Please try again.');
      return;
    }
    Alert.alert('Success', `Your 4-digit PIN "${pin1}" has been set!`);
    // e.g. navigation.replace('Home')
  };

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      <KeyboardAwareScrollView contentContainerStyle={{ flexGrow: 1 }} bounces={false}>
        {/* Pink gradient background */}
        <LinearGradient
          colors={['#ff9dbf', PINK]}
          style={styles.gradientBackground}
        >
          {/* Top section: Title & Subtitle */}
          <View style={styles.topSection}>
            <Text style={styles.headerTitle}>Create new PIN</Text>
            <Text style={styles.headerSubtitle}>
              Please create a 4-digit PIN that will be used to access your account
            </Text>
          </View>

          {/* White "pill" container for PIN fields */}
          <View style={styles.formCard}>
            {/* Enter PIN */}
            <Text style={styles.label}>Enter PIN</Text>
            <View style={styles.pinRow}>
              {enterPin.map((digit, i) => (
                <View key={`enter-${i}`} style={styles.pinBox}>
                  <TextInput
                    ref={enterRefs[i]}
                    style={styles.pinInput}
                    keyboardType="numeric"
                    secureTextEntry={!showEnterPin && digit !== ''}
                    maxLength={1}
                    value={digit}
                    onChangeText={(text) => handleEnterPinChange(text, i)}
                  />
                </View>
              ))}
              {/* Eye icon */}
              <TouchableOpacity
                style={styles.eyeIcon}
                onPress={() => setShowEnterPin(!showEnterPin)}
              >
                <Ionicons
                  name={showEnterPin ? 'eye-off' : 'eye'}
                  size={24}
                  color="#999"
                />
              </TouchableOpacity>
            </View>

            {/* Confirm PIN */}
            <Text style={[styles.label, { marginTop: 20 }]}>Confirm PIN</Text>
            <View style={styles.pinRow}>
              {confirmPin.map((digit, i) => (
                <View key={`confirm-${i}`} style={styles.pinBox}>
                  <TextInput
                    ref={confirmRefs[i]}
                    style={styles.pinInput}
                    keyboardType="numeric"
                    secureTextEntry={!showConfirmPin && digit !== ''}
                    maxLength={1}
                    value={digit}
                    onChangeText={(text) => handleConfirmPinChange(text, i)}
                  />
                </View>
              ))}
              {/* Eye icon */}
              <TouchableOpacity
                style={styles.eyeIcon}
                onPress={() => setShowConfirmPin(!showConfirmPin)}
              >
                <Ionicons
                  name={showConfirmPin ? 'eye-off' : 'eye'}
                  size={24}
                  color="#999"
                />
              </TouchableOpacity>
            </View>

            {/* Create PIN Button */}
            <TouchableOpacity style={styles.createButton} onPress={handleCreatePin}>
              <Text style={styles.createButtonText}>Create PIN</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}

// ================== STYLES ==================
const CARD_HEIGHT = 350; // Adjust as needed

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  gradientBackground: {
    flex: 1,
  },
  topSection: {
    paddingTop: 40,
    paddingHorizontal: 20,
    height: height * 0.25, // top area for the text
    justifyContent: 'flex-end',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 10,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#fff',
    maxWidth: '90%',
    lineHeight: 18,
    marginBottom: 15,
  },
  formCard: {
    backgroundColor: '#fff',
    borderRadius: 40,
    padding: 25,
    minHeight: CARD_HEIGHT,
    marginTop: 20,
    marginHorizontal: 15,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 5 },
    shadowRadius: 8,
    elevation: 5,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#555',
    marginBottom: 10,
  },
  pinRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pinBox: {
    width: 50,
    height: 50,
    borderRadius: 10,
    backgroundColor: '#fff',
    marginRight: 15,
    borderWidth: 1.5,
    borderColor: PINK, // Pink outline
    justifyContent: 'center',
    alignItems: 'center',
  },
  pinInput: {
    fontSize: 20,
    textAlign: 'center',
    width: '100%',
    color: '#333',
  },
  eyeIcon: {
    padding: 5,
    marginLeft: 'auto',
  },
  createButton: {
    backgroundColor: PINK,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 30,
    elevation: 2,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
