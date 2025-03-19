import React, { useRef, useState, useEffect } from 'react';
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

// Firebase
import { GoogleAuthProvider, signInWithCredential, signInWithPhoneNumber } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../../config/firebaseConfig';

// reCAPTCHA for Phone Auth
import { FirebaseRecaptchaVerifierModal } from 'expo-firebase-recaptcha';

// Expo Auth Session & WebBrowser for Google Sign-In
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';

import { useTranslation } from 'react-i18next';
import { WEB_CLIENT_ID } from '@env';

const { width, height } = Dimensions.get('window');
const PINK = '#ff5f96';

WebBrowser.maybeCompleteAuthSession();

function SignUpScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  const recaptchaVerifier = useRef(null);

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
    { label: 'ਪੰਜਾਬੀ', value: 'pa' },
  ];

  useEffect(() => {
    console.log('i18n object:', i18n);
  }, [i18n]);

  // Google Auth
  const [request, response, promptAsync] = Google.useAuthRequest({
    webClientId: WEB_CLIENT_ID,
    iosClientId: WEB_CLIENT_ID,
    androidClientId: WEB_CLIENT_ID,
    responseType: 'id_token',
  });

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
          navigation.replace('TellUsAboutYourselfScreen');
        })
        .catch((error) => {
          Alert.alert(t('common.error'), error.message);
        });
    }
  }, [response, t, navigation]);

  // Language modal
  const handleLanguagePress = () => setShowLanguageModal(true);
  const handleSelectLanguage = (lang) => {
    setSelectedLanguage(lang.value);
    i18n.changeLanguage(lang.value);
    setShowLanguageModal(false);
  };

  // Google Sign-In
  const handleGoogleSignIn = () => {
    promptAsync();
  };

  // Send OTP (no password)
  const handleSendOTP = async () => {
    if (!email.trim() || !phone.trim()) {
      Alert.alert(t('common.error'), t('signup.allFieldsRequired'));
      return;
    }
    if (!phone.startsWith('+91') || phone.length !== 13) {
      Alert.alert(t('common.error'), t('signup.invalidPhoneError'));
      return;
    }
    if (!recaptchaVerifier.current) {
      Alert.alert(t('common.error'), 'reCAPTCHA not ready');
      return;
    }

    try {
      const confirmationResult = await signInWithPhoneNumber(auth, phone, recaptchaVerifier.current);
      Alert.alert(t('login.otpSuccessTitle'), t('login.otpSuccessMessage', { mobile: phone }));

      // fromScreen = 'Signup'
      navigation.replace('OTPVerificationScreen', {
        verificationId: confirmationResult.verificationId,
        phone,
        email,
        fromScreen: 'Signup',
      });
    } catch (error) {
      Alert.alert(t('common.error'), error.message);
    }
  };

  const handleGoToLogin = () => {
    navigation.replace('Login');
  };

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      <FirebaseRecaptchaVerifierModal
        ref={recaptchaVerifier}
        firebaseConfig={{
          apiKey: 'AIzaSyBRD6pmrMCcuAksz8hqxXAkP8hV3jih47c',
          authDomain: 'rakshasetu-c9e0b.firebaseapp.com',
          projectId: 'rakshasetu-c9e0b',
          storageBucket: 'rakshasetu-c9e0b.firebasestorage.app',
          messagingSenderId: '704291591905',
          appId: '1:704291591905:web:ffde7bd519cfad3106c9a0',
        }}
        attemptInvisibleVerification={false}
      />

      <KeyboardAwareScrollView contentContainerStyle={{ flexGrow: 1 }} bounces={false}>
        <LinearGradient colors={['#ff9dbf', PINK]} style={styles.gradientBackground}>
          <View style={styles.topSection}>
            <Text style={styles.headerTitle}>{t('signup.headerTitle')}</Text>
            <Text style={styles.headerSubtitle}>{t('signup.headerSubtitle')}</Text>
            <TouchableOpacity style={styles.languageContainer} onPress={handleLanguagePress}>
              <Image
                source={require('../../assets/languages.png')}
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
              onChangeText={(text) => setPhone(text.replace(/[^0-9+]/g, ''))}
            />

            {/* Google Sign-In */}
            <TouchableOpacity style={styles.googleButton} onPress={handleGoogleSignIn}>
              <Ionicons name="logo-google" size={20} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.googleButtonText}>{t('signup.googleButtonText')}</Text>
            </TouchableOpacity>

            {/* Phone OTP */}
            <TouchableOpacity style={styles.signUpButton} onPress={handleSendOTP}>
              <Text style={styles.signUpButtonText}>{t('login.sendOtpButtonText')}</Text>
            </TouchableOpacity>

            <View style={styles.footerContainer}>
              <Text style={styles.footerText}>{t('signup.footerText')}</Text>
              <View style={styles.signupContainer}>
                <Text style={styles.footerText}>{t('signup.alreadyHaveAccount')}</Text>
                <TouchableOpacity onPress={handleGoToLogin}>
                  <Text style={[styles.footerText, styles.linkText]}>
                    {t('signup.logInLink')}
                  </Text>
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

const CARD_HEIGHT = 500; // Adjust as needed

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
  modalTitle: { fontSize: 18, fontWeight: '700', marginBottom: 10, color: '#333' },
  languageItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  languageItemText: { fontSize: 16, color: '#333' },
});

export default SignUpScreen;
