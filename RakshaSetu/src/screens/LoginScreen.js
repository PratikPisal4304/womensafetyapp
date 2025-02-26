// LoginScreen.js
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  Dimensions,
  Image,
  Modal,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';

const { width, height } = Dimensions.get('window');
const PINK = '#ff5f96';

export default function LoginScreen({ navigation }) {
  const [mobileNumber, setMobileNumber] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('English');
  const [showLanguageModal, setShowLanguageModal] = useState(false);

  // Sample languages for the modal
  const languages = ['English', 'Hindi', 'Spanish', 'French'];

  // Toggle language modal
  const handleLanguagePress = () => setShowLanguageModal(true);
  const handleSelectLanguage = (lang) => {
    setSelectedLanguage(lang);
    setShowLanguageModal(false);
  };

  // Google sign-in placeholder
  const handleGoogleSignIn = () => {
    Alert.alert('Google Sign-In', 'Implement your Google sign-in logic here.');
  };

  // Send OTP placeholder
  const handleSendOTP = () => {
  // Must start with +91 and be exactly 13 chars total
  if (!mobileNumber.startsWith('+91') || mobileNumber.length !== 13) {
    Alert.alert(
      'Error',
      'Please enter a valid phone number in +91XXXXXXXXXX format.'
    );
    return;
  }
    Alert.alert('OTP Sent', `OTP has been sent to ${mobileNumber}`);
  };

  // Sign up placeholder
  const handleSignUp = () => {
    Alert.alert('Sign Up', 'Navigate to your sign-up logic or screen here.');
  };

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      {/* Wrap content in KeyboardAwareScrollView so inputs remain visible */}
      <KeyboardAwareScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        bounces={false}
      >
        {/* Full-screen pink gradient */}
        <LinearGradient
          colors={['#ff9dbf', PINK]} // Vibrant pink gradient
          style={styles.gradientBackground}
        >
          {/* Top Section: Title & Language */}
          <View style={styles.topSection}>
            <Text style={styles.headerTitle}>Log in / Sign up</Text>
            <Text style={styles.headerSubtitle}>
              Sign up to access safety features or log in to continue your journey.
            </Text>

            {/* Language dropdown */}
            <TouchableOpacity
              style={styles.languageContainer}
              onPress={handleLanguagePress}
            >
              <Image
                source={require('../../assets/adaptive-icon.png')} // Replace with your own
                style={styles.flagIcon}
              />
              <Text style={styles.languageText}>{selectedLanguage}</Text>
              <Ionicons name="chevron-down" size={18} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* White container for form (with top & bottom curves) */}
          <View style={styles.formCard}>
            <Text style={styles.label}>Mobile Number</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. +91XXXXXXXXXX"
              keyboardType="phone-pad"
              maxLength={13}  // Limit to 13 characters
              value={mobileNumber}
              onChangeText={(text) => {
                // Only allow digits & max length 10
                const cleaned = text.replace(/[^0-9]/g, '');
                setMobileNumber(cleaned);
              }}
            />

            {/* Google Sign-In */}
            <TouchableOpacity style={styles.googleButton} onPress={handleGoogleSignIn}>
              <Ionicons name="logo-google" size={20} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.googleButtonText}>Continue with Google</Text>
            </TouchableOpacity>

            {/* Send OTP */}
            <TouchableOpacity style={styles.sendOtpButton} onPress={() => navigation.replace('OTPVerificationScreen')}>
              <Text style={styles.sendOtpButtonText}>Send OTP</Text>
            </TouchableOpacity>

            {/* Footer text */}
            <View style={styles.footerContainer}>
              <Text style={styles.footerText}>
                By continuing, you have read and accepted our{' '}
                <Text style={styles.linkText}>T&Cs</Text> and{' '}
                <Text style={styles.linkText}>Privacy Policy</Text>
              </Text>
              <View style={styles.signupContainer}>
                <Text style={styles.footerText}>Don't have an account? </Text>
                <TouchableOpacity onPress={() => navigation.replace('SignUpScreen')}>
                  <Text style={[styles.footerText, styles.linkText]}>Sign up</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </LinearGradient>
      </KeyboardAwareScrollView>

      {/* Language Modal */}
      <Modal
        visible={showLanguageModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLanguageModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowLanguageModal(false)}
        >
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Select Language</Text>
            <ScrollView>
              {languages.map((lang, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.languageItem}
                  onPress={() => handleSelectLanguage(lang)}
                >
                  <Text style={styles.languageItemText}>{lang}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

// ============== STYLES =============
const CARD_HEIGHT = 420; // Adjust as needed

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
    height: height * 0.3, // top area for title & language
    justifyContent: 'flex-end',
  },
  headerTitle: {
    fontSize: 30,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 10,
  },
  headerSubtitle: {
    fontSize: 15,
    color: '#fff',
    maxWidth: '90%',
    lineHeight: 20,
    marginBottom: 15,
  },
  languageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 15,
  },
  flagIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 6,
  },
  languageText: {
    color: '#fff',
    fontSize: 14,
    marginRight: 4,
  },

  // White container with top & bottom curves
  formCard: {
    backgroundColor: '#fff',
    borderRadius: 40, // Curves on all corners
    padding: 25,
    minHeight: CARD_HEIGHT,
    marginTop: 20, // put it a bit lower than the top
    marginHorizontal: 15, // side margin
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 5 },
    shadowRadius: 8,
    elevation: 5,
  },
  label: {
    fontSize: 17,
    color: '#333',
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    height: 50,
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    paddingHorizontal: 15,
    fontSize: 15,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#eee',
  },
  googleButton: {
    flexDirection: 'row',
    backgroundColor: '#DB4437',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  googleButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  sendOtpButton: {
    backgroundColor: PINK,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
    elevation: 3,
  },
  sendOtpButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  footerContainer: {
    marginTop: 'auto',
    alignItems: 'center',
    marginHorizontal: 10,
  },
  footerText: {
    fontSize: 13,
    color: '#666',
    textAlign: 'center',
    lineHeight: 18,
  },
  linkText: {
    color: PINK,
    fontWeight: '600',
  },
  signupContainer: {
    flexDirection: 'row',
    marginTop: 10,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    maxHeight: '60%',
    alignSelf: 'center',
    width: '100%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 10,
    color: '#333',
  },
  languageItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  languageItemText: {
    fontSize: 16,
    color: '#333',
  },
});
