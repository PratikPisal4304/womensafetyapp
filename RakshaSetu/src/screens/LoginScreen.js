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
import { FirebaseRecaptchaVerifierModal } from 'expo-firebase-recaptcha';
import { auth, firestore } from '../../config/firebaseConfig';
import { signInWithPhoneNumber, GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { useTranslation } from 'react-i18next';
import i18next from '../i18n';

const { width, height } = Dimensions.get('window');
const PINK = '#ff5f96';

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen({ navigation }) {
  const { t, i18n } = useTranslation();
  const [mobileNumber, setMobileNumber] = useState('');
  // selectedLanguage is now managed with i18n.changeLanguage if needed
  const [selectedLanguage, setSelectedLanguage] = useState(i18n.language || 'en');
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const recaptchaVerifier = useRef(null);
  const [verificationId, setVerificationId] = useState(null);

  // Languages array for modal – you can customize this as needed
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
  useEffect(() => {
    console.log('i18n object:', i18n);
  }, []);

  const [request, response, promptAsync] = Google.useAuthRequest({
    expoClientId: 'YOUR_EXPO_CLIENT_ID.apps.googleusercontent.com',
    iosClientId: 'YOUR_IOS_CLIENT_ID.apps.googleusercontent.com',
    androidClientId: 'YOUR_ANDROID_CLIENT_ID.apps.googleusercontent.com',
    webClientId: '704291591905-l12877n9vn4koms6lj9un8fvanb6av0u.apps.googleusercontent.com',
  });

  useEffect(() => {
    if (response?.type === 'success') {
      const { idToken, accessToken } = response.authentication;
      const credential = GoogleAuthProvider.credential(idToken, accessToken);
      signInWithCredential(auth, credential)
        .then(async (userCredential) => {
          Alert.alert(t('login.successAlertTitle'), t('login.successAlertMessage'));
          const { uid, email, displayName } = userCredential.user;
          const userDocRef = doc(firestore, 'users', uid);
          const userDoc = await getDoc(userDocRef);
          if (!userDoc.exists()) {
            await setDoc(userDocRef, {
              email: email || '',
              displayName: displayName || '',
              createdAt: new Date().toISOString(),
            });
          }
          navigation.replace('HomeScreen');
        })
        .catch((error) => {
          Alert.alert(t('common.error'), error.message);
        });
    }
  }, [response, t, navigation]);

  const handleLanguagePress = () => setShowLanguageModal(true);
  const handleSelectLanguage = (lang) => {
    setSelectedLanguage(lang.value);
    i18n.changeLanguage(lang.value);
    setShowLanguageModal(false);
  };

  const handleGoogleSignIn = async () => {
    promptAsync();
  };

  const handleSendOTP = async () => {
    if (!mobileNumber.startsWith('+91') || mobileNumber.length !== 13) {
      Alert.alert(t('common.error'), t('login.invalidMobileError'));
      return;
    }
    if (!recaptchaVerifier.current) {
      Alert.alert(t('common.error'), t('login.recaptchaError'));
      return;
    }
    try {
      const confirmationResult = await signInWithPhoneNumber(auth, mobileNumber, recaptchaVerifier.current);
      setVerificationId(confirmationResult.verificationId);
      Alert.alert(t('login.otpSuccessTitle'), t('login.otpSuccessMessage', { mobile: mobileNumber }));
      navigation.replace('OTPVerificationScreen', {
        verificationId: confirmationResult.verificationId,
        mobileNumber,
      });
    } catch (error) {
      Alert.alert(t('common.error'), error.message);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      <FirebaseRecaptchaVerifierModal
        ref={recaptchaVerifier}
        firebaseConfig={{
          apiKey: "AIzaSyBRD6pmrMCcuAksz8hqxXAkP8hV3jih47c",
          authDomain: "rakshasetu-c9e0b.firebaseapp.com",
          projectId: "rakshasetu-c9e0b",
          storageBucket: "rakshasetu-c9e0b.firebasestorage.app",
          messagingSenderId: "704291591905",
          appId: "1:704291591905:web:ffde7bd519cfad3106c9a0",
          measurementId: "G-JJ881F4VBQ"
        }}
        attemptInvisibleVerification={false}
      />

      <KeyboardAwareScrollView contentContainerStyle={{ flexGrow: 1 }} bounces={false}>
        <LinearGradient colors={['#ff9dbf', PINK]} style={styles.gradientBackground}>
          <View style={styles.topSection}>
            <Text style={styles.headerTitle}>{t('login.headerTitle')}</Text>
            <Text style={styles.headerSubtitle}>{t('login.headerSubtitle')}</Text>
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
            <Text style={styles.label}>{t('login.mobileNumberLabel')}</Text>
            <TextInput
              style={styles.input}
              placeholder={t('login.mobileNumberPlaceholder')}
              keyboardType="phone-pad"
              maxLength={13}
              value={mobileNumber}
              onChangeText={(text) => setMobileNumber(text.replace(/[^0-9+]/g, ''))}
            />

            <TouchableOpacity style={styles.googleButton} onPress={handleGoogleSignIn}>
              <Ionicons name="logo-google" size={20} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.googleButtonText}>{t('login.googleButtonText')}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.sendOtpButton} onPress={handleSendOTP}>
              <Text style={styles.sendOtpButtonText}>{t('login.sendOtpButtonText')}</Text>
            </TouchableOpacity>

            <View style={styles.footerContainer}>
              <Text style={styles.footerText}>
                {t('login.footerText')}
              </Text>
              <View style={styles.signupContainer}>
                <Text style={styles.footerText}>{t('login.noAccount')}</Text>
                <TouchableOpacity onPress={() => navigation.replace('SignUpScreen')}>
                  <Text style={[styles.footerText, styles.linkText]}>{t('login.signUpLink')}</Text>
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
            <Text style={styles.modalTitle}>{t('login.selectLanguage')}</Text>
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
    minHeight: 420,
    marginTop: 20,
    marginHorizontal: 15,
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
  sendOtpButton: {
    backgroundColor: PINK,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
    elevation: 3,
  },
  sendOtpButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
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
