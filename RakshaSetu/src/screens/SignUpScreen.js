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
import { auth, db } from '../../config/firebaseConfig';

// Expo Auth Session & WebBrowser for Google Sign-In
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';

import { useTranslation } from 'react-i18next';

// Import the client IDs from environment variables
import { EXPO_CLIENT_ID, IOS_CLIENT_ID, ANDROID_CLIENT_ID, WEB_CLIENT_ID } from '@env';

const { width, height } = Dimensions.get('window');
const PINK = '#ff5f96';

WebBrowser.maybeCompleteAuthSession();

function SignUpScreen({ navigation }) {
  // Form fields for email sign up
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');

  // Language dropdown state
  const { t, i18n } = useTranslation();
  const [selectedLanguage, setSelectedLanguage] = useState(i18n.language || 'en');
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const languages = [
    { label: 'English', value: 'en' },
    { label: 'हिंदी', value: 'hi' },
    { label: 'मराठी', value: 'mr' },
    { label: 'ગુજરાતી', value: 'gu' },
    { label: 'தமிழ்', value: 'ta' },
    { label: 'తెలుగు', value: 'te' },
    { label: 'ಕನ್ನಡ', value: 'kn' },
    { label: 'ਪੰਜਾਬੀ', value: 'pa' }
  ];

  // Log i18n object for debugging
  useEffect(() => {
    console.log('i18n object:', i18n);
  }, [i18n]);

  // Google sign-in hook using environment variables for client IDs
  const [request, response, promptAsync] = Google.useAuthRequest({
    expoClientId: EXPO_CLIENT_ID,
    iosClientId: IOS_CLIENT_ID,
    androidClientId: ANDROID_CLIENT_ID,
    webClientId: WEB_CLIENT_ID,
  });

  // Monitor Google sign-in response
  useEffect(() => {
    if (response?.type === 'success') {
      const { idToken, accessToken } = response.authentication;
      const credential = GoogleAuthProvider.credential(idToken, accessToken);
      signInWithCredential(auth, credential)
        .then(async (userCredential) => {
          const user = userCredential.user;
          await setDoc(
            doc(db, 'users', user.uid),
            {
              email: user.email,
              phone: user.phoneNumber || '',
              createdAt: new Date(),
            },
            { merge: true }
          );
          Alert.alert(t('signup.successAlertTitle'), t('signup.successAlertMessage'));
          navigation.replace('CreatePinScreen');
        })
        .catch((error) => {
          Alert.alert(t('common.error'), error.message);
        });
    }
  }, [response, t, navigation]);

  // Toggle language modal
  const handleLanguagePress = () => setShowLanguageModal(true);
  const handleSelectLanguage = (lang) => {
    setSelectedLanguage(lang.value);
    i18n.changeLanguage(lang.value);
    setShowLanguageModal(false);
  };

  // Google Sign-In handler
  const handleGoogleSignIn = () => {
    promptAsync();
  };

  // Email/Password Sign Up Logic
  const handleSignUp = async () => {
    if (!email.trim() || !phone.trim() || !password.trim()) {
      Alert.alert(t('common.error'), t('signup.allFieldsRequired'));
      return;
    }
    if (!phone.startsWith('+91') || phone.length !== 13) {
      Alert.alert(t('common.error'), t('signup.invalidPhoneError'));
      return;
    }
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      await setDoc(doc(db, 'users', user.uid), {
        phone: phone,
        email: email,
        createdAt: new Date(),
      });
      Alert.alert(t('signup.userCreated'), `${t('signup.userCreatedMessage')} ${email}`);
      navigation.replace('CreatePinScreen');
    } catch (error) {
      Alert.alert(t('common.error'), error.message);
    }
  };

  const handleGoToLogin = () => {
    navigation.replace('Login');
  };

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      <KeyboardAwareScrollView contentContainerStyle={{ flexGrow: 1 }} bounces={false}>
        <LinearGradient colors={['#ff9dbf', PINK]} style={styles.gradientBackground}>
          <View style={styles.topSection}>
            <Text style={styles.headerTitle}>{t('signup.headerTitle')}</Text>
            <Text style={styles.headerSubtitle}>{t('signup.headerSubtitle')}</Text>
            <TouchableOpacity style={styles.languageContainer} onPress={handleLanguagePress}>
              <Image
                source={require('../../assets/adaptive-icon.png')}
                style={styles.flagIcon}
              />
              <Text style={styles.languageText}>{selectedLanguage}</Text>
              <Ionicons name="chevron-down" size={18} color="#fff" />
            </TouchableOpacity>
          </View>

          <View style={styles.formCard}>
            <Text style={styles.label}>{t('signup.emailLabel')}</Text>
            <TextInput
              style={styles.input}
              placeholder={t('signup.emailPlaceholder')}
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />

            <Text style={styles.label}>{t('signup.phoneLabel')}</Text>
            <TextInput
              style={styles.input}
              placeholder={t('signup.phonePlaceholder')}
              keyboardType="phone-pad"
              value={phone}
              onChangeText={(text) => {
                const cleaned = text.replace(/[^0-9+]/g, '');
                setPhone(cleaned);
              }}
            />

            <Text style={styles.label}>{t('signup.passwordLabel')}</Text>
            <TextInput
              style={styles.input}
              placeholder={t('signup.passwordPlaceholder')}
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />

            <TouchableOpacity style={styles.googleButton} onPress={handleGoogleSignIn}>
              <Ionicons name="logo-google" size={20} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.googleButtonText}>{t('signup.googleButtonText')}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.signUpButton} onPress={handleSignUp}>
              <Text style={styles.signUpButtonText}>{t('signup.signUpButtonText')}</Text>
            </TouchableOpacity>

            <View style={styles.footerContainer}>
              <Text style={styles.footerText}>
                {t('signup.footerText')}
              </Text>
              <View style={styles.signupContainer}>
                <Text style={styles.footerText}>{t('signup.alreadyHaveAccount')}</Text>
                <TouchableOpacity onPress={handleGoToLogin}>
                  <Text style={[styles.footerText, styles.linkText]}>{t('signup.logInLink')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </LinearGradient>
      </KeyboardAwareScrollView>

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
            <Text style={styles.modalTitle}>{t('signup.selectLanguage')}</Text>
            <ScrollView>
              {languages.map((lang, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.languageItem}
                  onPress={() => handleSelectLanguage(lang)}
                >
                  <Text style={styles.languageItemText}>{lang.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const CARD_HEIGHT = 500; // Adjust height as needed

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  gradientBackground: { flex: 1 },
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
  languageText: { color: '#fff', fontSize: 14, marginRight: 4 },
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
  label: { fontSize: 17, color: '#333', fontWeight: '600', marginBottom: 8 },
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
  googleButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  signUpButton: {
    backgroundColor: '#ff5f96',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
    elevation: 3,
  },
  signUpButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
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
  linkText: { color: '#ff5f96', fontWeight: '600' },
  signupContainer: { flexDirection: 'row', marginTop: 10 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', padding: 20 },
  modalContainer: { backgroundColor: '#fff', borderRadius: 15, padding: 20, maxHeight: '60%', alignSelf: 'center', width: '100%' },
  modalTitle: { fontSize: 18, fontWeight: '700', marginBottom: 10, color: '#333' },
  languageItem: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#eee' },
  languageItemText: { fontSize: 16, color: '#333' },
});

export default SignUpScreen;
