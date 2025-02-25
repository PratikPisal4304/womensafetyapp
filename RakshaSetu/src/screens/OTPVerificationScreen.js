// OTPVerificationScreen.js
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';

const { width, height } = Dimensions.get('window');
const PINK = '#ff5f96';

export default function OTPVerificationScreen({ navigation }) {
  // 6-digit OTP array
  const [otp, setOtp] = useState(['', '', '', '', '', '']);

  // Refs for auto-focus
  const otpRefs = Array.from({ length: 6 }, () => useRef(null));

  // Handle digit input
  const handleOtpChange = (text, index) => {
    const newText = text.replace(/[^0-9]/g, '').slice(-1); // 1 digit only
    const updated = [...otp];
    updated[index] = newText;
    setOtp(updated);

    // Move to next box if typed
    if (newText && index < 5) {
      otpRefs[index + 1].current?.focus();
    }
  };

  // "Verify OTP" button
  const handleVerifyOTP = () => {
    if (otp.includes('')) {
      Alert.alert('Error', 'Please fill out all 6 digits of the OTP.');
      return;
    }
    const code = otp.join('');
    Alert.alert('Success', `OTP "${code}" has been verified!`);
    // e.g. navigation.replace('NextScreen')
  };

  // "Change Number"
  const handleChangeNumber = () => {
    Alert.alert('Change Number', 'Logic to change phone number goes here.');
    // e.g. navigation.goBack() or navigate to "EnterPhoneScreen"
  };

  // "Resend Code"
  const handleResendCode = () => {
    Alert.alert('Resend Code', 'Logic to resend OTP goes here.');
  };

  // "Back arrow" pressed
  const handleBack = () => {
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      <KeyboardAwareScrollView contentContainerStyle={{ flexGrow: 1 }} bounces={false}>
        {/* Pink gradient top section */}
        <LinearGradient
          colors={['#ff9dbf', PINK]}
          style={styles.gradientBackground}
        >
          <View style={styles.topSection}>
            {/* Back Arrow */}
            <TouchableOpacity onPress={handleBack} style={styles.backArrow}>
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>

            {/* Title */}
            <Text style={styles.title}>Phone Verification</Text>
          </View>

          {/* White pill container */}
          <View style={styles.formCard}>
            {/* Instruction text */}
            <Text style={styles.subtitle}>
              Enter 6 digit verification code sent to your phone number
            </Text>

            {/* OTP boxes */}
            <View style={styles.otpRow}>
              {otp.map((digit, i) => (
                <View key={`otp-${i}`} style={styles.otpBox}>
                  <TextInput
                    ref={otpRefs[i]}
                    style={styles.otpInput}
                    keyboardType="numeric"
                    maxLength={1}
                    value={digit}
                    onChangeText={(text) => handleOtpChange(text, i)}
                  />
                </View>
              ))}
            </View>

            {/* Change Number link */}
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.changeNumberText}>Change Number</Text>
            </TouchableOpacity>

            {/* Verify OTP button */}
            <TouchableOpacity style={styles.verifyButton} onPress={() => navigation.replace('MainTabs')}>
              <Text style={styles.verifyButtonText}>Verify OTP</Text>
            </TouchableOpacity>

            {/* Resend Code link */}
            <TouchableOpacity onPress={handleResendCode}>
              <Text style={styles.resendText}>Resend Code</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}

// ============= STYLES =============
const CARD_HEIGHT = 320; // Adjust as needed

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
    height: height * 0.25,
    justifyContent: 'flex-end',
  },
  backArrow: {
    position: 'absolute',
    top: 40,
    left: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 20,
    marginTop: 60, // extra space to accommodate arrow
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
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 25,
    textAlign: 'center',
    lineHeight: 18,
  },
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    marginBottom: 20,
  },
  otpBox: {
    width: 50,
    height: 50,
    borderRadius: 10,
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: PINK,
    justifyContent: 'center',
    alignItems: 'center',
  },
  otpInput: {
    fontSize: 20,
    textAlign: 'center',
    width: '100%',
    color: '#333',
  },
  changeNumberText: {
    color: PINK,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 30,
  },
  verifyButton: {
    backgroundColor: PINK,
    borderRadius: 25,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 20,
    elevation: 2,
  },
  verifyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  resendText: {
    color: '#666',
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '500',
  },
});
