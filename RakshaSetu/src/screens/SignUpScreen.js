// SignUpScreen.js
import React, { useState, useEffect } from 'react';
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

// Firebase Auth & Firestore imports
import { createUserWithEmailAndPassword, GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../../config/firebaseConfig'; // <-- Adjust path as needed

// Expo Auth Session & WebBrowser for Google Sign-In
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';

const { width, height } = Dimensions.get('window');
const PINK = '#ff5f96';

// Complete any pending auth sessions
WebBrowser.maybeCompleteAuthSession();

export default function SignUpScreen({ navigation }) {
  // Form fields for email sign up
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');

  // Language dropdown state
  const [selectedLanguage, setSelectedLanguage] = useState('English');
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const languages = ['English', 'Hindi', 'Spanish', 'French'];

  // Google sign-in hook (Replace placeholder client IDs with your actual ones)
  const [request, response, promptAsync] = Google.useAuthRequest({
    expoClientId: 'YOUR_EXPO_CLIENT_ID.apps.googleusercontent.com',
    iosClientId: 'YOUR_IOS_CLIENT_ID.apps.googleusercontent.com',
    androidClientId: 'YOUR_ANDROID_CLIENT_ID.apps.googleusercontent.com',
    webClientId: 'YOUR_WEB_CLIENT_ID.apps.googleusercontent.com',
  });

  // Monitor Google sign-in response
  useEffect(() => {
    if (response?.type === 'success') {
      const { idToken, accessToken } = response.authentication;
      const credential = GoogleAuthProvider.credential(idToken, accessToken);
      signInWithCredential(auth, credential)
        .then(async (userCredential) => {
          const user = userCredential.user;
          // Optionally, create/update user profile in Firestore
          await setDoc(
            doc(db, 'users', user.uid),
            {
              email: user.email,
              phone: user.phoneNumber || '',
              createdAt: new Date(),
            },
            { merge: true }
          );
          Alert.alert('Success', 'Signed up with Google!');
          navigation.replace('CreatePinScreen');
        })
        .catch((error) => {
          Alert.alert('Error', error.message);
        });
    }
  }, [response]);

  // Toggle language modal
  const handleLanguagePress = () => setShowLanguageModal(true);
  const handleSelectLanguage = (lang) => {
    setSelectedLanguage(lang);
    setShowLanguageModal(false);
  };

  // Google Sign-In handler
  const handleGoogleSignIn = () => {
    promptAsync();
  };

  // Email/Password Sign Up Logic
  const handleSignUp = async () => {
    // Basic validation
    if (!email.trim() || !phone.trim() || !password.trim()) {
      Alert.alert('Error', 'All fields are required.');
      return;
    }
    // Must be in +91XXXXXXXXXX format (13 characters total)
    if (!phone.startsWith('+91') || phone.length !== 13) {
      Alert.alert(
        'Error',
        'Please enter a valid phone number in +91XXXXXXXXXX format.'
      );
      return;
    }

    try {
      // Create user in Firebase Authentication with email and password
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Save additional user data (e.g., phone number) in Firestore
      await setDoc(doc(db, 'users', user.uid), {
        phone: phone,
        email: email,
        createdAt: new Date(),
      });

      Alert.alert('Sign Up', `User created successfully: ${email}`);
      navigation.replace('CreatePinScreen'); // Navigate to the next screen
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  // Navigation for users who already have an account
  const handleGoToLogin = () => {
    Alert.alert('Login screen.');
    navigation.replace('Login');
  };

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      <KeyboardAwareScrollView contentContainerStyle={{ flexGrow: 1 }} bounces={false}>
        {/* Pink gradient background */}
        <LinearGradient colors={['#ff9dbf', PINK]} style={styles.gradientBackground}>
          {/* Top Section: Title & Language */}
          <View style={styles.topSection}>
            <Text style={styles.headerTitle}>Create Account</Text>
            <Text style={styles.headerSubtitle}>
              Sign up to access all safety features and more.
            </Text>

            {/* Language dropdown */}
            <TouchableOpacity style={styles.languageContainer} onPress={handleLanguagePress}>
              <Image
                source={require('../../assets/adaptive-icon.png')} // Replace with your own asset
                style={styles.flagIcon}
              />
              <Text style={styles.languageText}>{selectedLanguage}</Text>
              <Ionicons name="chevron-down" size={18} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* White pill container for form */}
          <View style={styles.formCard}>
            {/* Email field */}
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. name@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />

            {/* Phone field */}
            <Text style={styles.label}>Phone Number</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. +91XXXXXXXXXX"
              keyboardType="phone-pad"
              value={phone}
              onChangeText={(text) => {
                // Only allow digits and '+'
                const cleaned = text.replace(/[^0-9+]/g, '');
                setPhone(cleaned);
              }}
            />

            {/* Password field */}
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter a secure password"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />

            {/* Google Sign-In */}
            <TouchableOpacity style={styles.googleButton} onPress={handleGoogleSignIn}>
              <Ionicons name="logo-google" size={20} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.googleButtonText}>Sign up with Google</Text>
            </TouchableOpacity>

            {/* Sign Up Button */}
            <TouchableOpacity style={styles.signUpButton} onPress={handleSignUp}>
              <Text style={styles.signUpButtonText}>Sign Up</Text>
            </TouchableOpacity>

            {/* Footer text */}
            <View style={styles.footerContainer}>
              <Text style={styles.footerText}>
                By continuing, you have read and accepted our{' '}
                <Text style={styles.linkText}>T&Cs</Text> and{' '}
                <Text style={styles.linkText}>Privacy Policy</Text>
              </Text>
              <View style={styles.signupContainer}>
                <Text style={styles.footerText}>Already have an account? </Text>
                <TouchableOpacity onPress={handleGoToLogin}>
                  <Text style={[styles.footerText, styles.linkText]}>Log in</Text>
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
                  onPress={() => {
                    setSelectedLanguage(lang);
                    setShowLanguageModal(false);
                  }}
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

// ============== STYLES ==============
const CARD_HEIGHT = 500; // Adjust height as needed

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
    height: height * 0.3,
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
  formCard: {
    backgroundColor: '#fff',
    borderRadius: 40,
    padding: 25,
    paddingBottom: 65,
    minHeight: CARD_HEIGHT,
    marginTop: 20,
    marginHorizontal: 15,
    marginBottom: 30,
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
  signUpButton: {
    backgroundColor: '#ff5f96',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
    elevation: 3,
  },
  signUpButtonText: {
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
    color: '#ff5f96',
    fontWeight: '600',
  },
  signupContainer: {
    flexDirection: 'row',
    marginTop: 10,
  },
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
