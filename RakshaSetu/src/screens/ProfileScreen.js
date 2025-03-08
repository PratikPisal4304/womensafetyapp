import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../../config/firebaseConfig';
import { ShakeDetectionContext } from '../../src/context/ShakeDetectionContext';
import { useTranslation } from 'react-i18next';

const languageMapping = {
  English: 'en',
  हिंदी: 'hi',
  मराठी: 'mr',
  ગુજરાતી: 'gu',
  தமிழ்: 'ta',
  తెలుగు: 'te',
  ಕನ್ನಡ: 'kn',
  ਪੰਜਾਬੀ: 'pa',
};

const PINK = '#ff5f96';

const DropdownItem = ({ title, icon, options, onOptionSelect }) => {
  const { t, i18n } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const handleOptionPress = (option) => {
    if (onOptionSelect) {
      onOptionSelect(option);
    } else {
      Alert.alert(title, `${t('profile.selectedOption')} ${option}`);
    }
    setExpanded(false);
  };
  return (
    <View style={styles.dropdownContainer}>
      <TouchableOpacity style={styles.listItem} onPress={() => setExpanded(!expanded)}>
        <MaterialCommunityIcons name={icon} size={24} color="#555" />
        <Text style={styles.itemText}>{title}</Text>
        <MaterialCommunityIcons name={expanded ? 'chevron-up' : 'chevron-down'} size={24} color="#999" />
      </TouchableOpacity>
      {expanded && (
        <View style={styles.dropdownContent}>
          {options.map((option, index) => {
            const isCurrent = onOptionSelect && languageMapping[option] === i18n.language;
            return (
              <TouchableOpacity key={index} style={styles.dropdownOption} onPress={() => handleOptionPress(option)}>
                <Text style={styles.dropdownText}>{option}</Text>
                {isCurrent && (
                  <MaterialCommunityIcons name="check" size={20} color={PINK} style={{ marginLeft: 10 }} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </View>
  );
};

const ToggleSetting = ({ title, icon, value, onValueChange }) => (
  <View style={styles.toggleSettingContainer}>
    <View style={styles.listItem}>
      <MaterialCommunityIcons name={icon} size={24} color="#555" />
      <Text style={styles.itemText}>{title}</Text>
      <Switch
        value={value}
        onValueChange={onValueChange}
        thumbColor={value ? "#ff5f96" : "#ccc"}
        trackColor={{ false: "#eee", true: "#ffd1e1" }}
      />
    </View>
  </View>
);

const ProfileScreen = ({ navigation }) => {
  const { t, i18n } = useTranslation();
  const [name, setName] = useState('Lucy');
  const [phone, setPhone] = useState('+91 12345 678910');
  const [isLoading, setIsLoading] = useState(true);
  const { isShakeEnabled, setIsShakeEnabled } = useContext(ShakeDetectionContext);

  const preferences = [
    { title: t('profile.myPosts'), icon: 'account', screen: 'MyPosts' },
    { title: t('profile.myReports'), icon: 'file-document', screen: 'MyReports' },
    { title: t('profile.manageFriends'), icon: 'account-group', screen: 'ManageFriends' },
  ];

  const dropdownSettings = [
    {
      title: t('profile.changeLanguage'),
      icon: 'translate',
      options: ['English', 'हिंदी', 'मराठी', 'ગુજરાતી', 'தமிழ்', 'తెలుగు', 'ಕನ್ನಡ', 'ਪੰਜਾਬੀ'],
      onOptionSelect: (option) => {
        const langCode = languageMapping[option];
        if (langCode) {
          i18n.changeLanguage(langCode);
        } else {
          Alert.alert(t('common.error'), `Language code not found for ${option}`);
        }
      },
    },
    {
      title: t('profile.notificationSettings'),
      icon: 'bell',
      options: [t('profile.allNotifications'), t('profile.mentionsOnly'), t('profile.muteAll')],
    },
    {
      title: t('profile.customizeThemes'),
      icon: 'palette',
      options: [t('profile.lightMode'), t('profile.darkMode'), t('profile.systemDefault')],
    },
  ];

  const moreItems = [
    { title: t('profile.helpLineNumbers'), icon: 'phone', screen: 'EmergencyHelpline' },
    { title: t('profile.helpSupport'), icon: 'lifebuoy', screen: 'HelpSupport' },
    { title: t('profile.aboutUs'), icon: 'information', screen: 'AboutUs' },
  ];

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      setIsLoading(false);
      return;
    }
    const docRef = doc(db, 'users', user.uid);
    const unsubscribe = onSnapshot(
      docRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.name) setName(data.name);
          if (data.phone) setPhone(data.phone);
        } else {
          Alert.alert(t('profile.noDataTitle'), t('profile.noDataMessage'));
        }
        setIsLoading(false);
      },
      (error) => {
        Alert.alert(t('common.error'), error.message);
        setIsLoading(false);
      }
    );
    return () => unsubscribe();
  }, [t]);

  const handleLogout = () => {
    Alert.alert(
      t('profile.logoutTitle'),
      t('profile.logoutMessage'),
      [
        {
          text: 'OK',
          onPress: () => {
            navigation.replace('Login');
          },
        },
      ],
      { cancelable: false }
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#ff5f96" />
        <Text style={styles.loadingText}>{t('profile.loadingProfile')}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerContainer}>
        <View style={styles.headerCurve} />
        <Image source={{ uri: 'https://via.placeholder.com/80' }} style={styles.avatar} />
        <Text style={styles.name}>{name}</Text>
        <Text style={styles.phone}>{phone}</Text>
        <TouchableOpacity style={styles.editButton} onPress={() => navigation.navigate('EditProfile')}>
          <MaterialCommunityIcons name="account-edit" size={28} color="#000" />
        </TouchableOpacity>
      </View>

      {/* Main Content */}
      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* Preferences Section */}
        <Text style={styles.sectionTitle}>{t('profile.preferencesTitle')}</Text>
        <View style={styles.sectionContainer}>
          {preferences.map((item, index) => (
            <TouchableOpacity key={index} style={styles.listItem} onPress={() => navigation.navigate(item.screen)}>
              <MaterialCommunityIcons name={item.icon} size={24} color="#555" />
              <Text style={styles.itemText}>{item.title}</Text>
              <MaterialCommunityIcons name="chevron-right" size={24} color="#999" />
            </TouchableOpacity>
          ))}
        </View>

        {/* Settings Section */}
        <Text style={styles.sectionTitle}>{t('profile.settingsTitle')}</Text>
        <View style={styles.sectionContainer}>
          {dropdownSettings.map((item, index) => (
            <DropdownItem
              key={index}
              title={item.title}
              icon={item.icon}
              options={item.options}
              onOptionSelect={item.onOptionSelect}
            />
          ))}
          <ToggleSetting
            title={t('profile.enableShake')}
            icon="gesture-swipe"
            value={isShakeEnabled}
            onValueChange={(value) => setIsShakeEnabled(value)}
          />
        </View>

        {/* More Section */}
        <Text style={styles.sectionTitle}>{t('profile.moreTitle')}</Text>
        <View style={styles.sectionContainer}>
          {moreItems.map((item, index) => (
            <TouchableOpacity key={index} style={styles.listItem} onPress={() => item.screen && navigation.navigate(item.screen)}>
              <MaterialCommunityIcons name={item.icon} size={24} color="#555" />
              <Text style={styles.itemText}>{item.title}</Text>
              <MaterialCommunityIcons name="chevron-right" size={24} color="#999" />
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>{t('profile.logout')}</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

export default ProfileScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { fontSize: 16, color: '#666', marginTop: 10 },
  headerContainer: {
    backgroundColor: '#ff5f96',
    alignItems: 'center',
    paddingTop: 50,
    paddingBottom: 30,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    position: 'relative',
  },
  headerCurve: {
    position: 'absolute',
    top: '100%',
    width: '100%',
    height: 30,
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
  },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#ddd' },
  name: { fontSize: 22, fontWeight: 'bold', color: '#fff', marginTop: 10 },
  phone: { fontSize: 14, color: '#fff', opacity: 0.8 },
  editButton: { position: 'absolute', right: 20, top: 70, backgroundColor: 'rgba(255,255,255,0.4)', padding: 8, borderRadius: 20 },
  content: { flex: 1, marginTop: 20 },
  contentContainer: { paddingBottom: 100 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', marginLeft: 20, marginVertical: 10, color: '#555' },
  sectionContainer: { backgroundColor: '#fff', borderRadius: 10, marginHorizontal: 15, paddingVertical: 5, elevation: 2 },
  listItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: '#eee' },
  itemText: { flex: 1, fontSize: 16, marginLeft: 15, color: '#333' },
  dropdownContainer: { borderBottomWidth: 1, borderBottomColor: '#eee' },
  dropdownContent: { backgroundColor: '#f2f2f2', paddingHorizontal: 20, paddingBottom: 10 },
  dropdownOption: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  dropdownText: { fontSize: 14, color: '#333' },
  toggleSettingContainer: { borderBottomWidth: 1, borderBottomColor: '#eee' },
  logoutButton: { backgroundColor: '#FF4B8C', marginHorizontal: 60, marginTop: 30, marginBottom: 20, paddingVertical: 16, borderRadius: 20, alignItems: 'center', elevation: 3, shadowColor: '#000', shadowOpacity: 0.15, shadowOffset: { width: 0, height: 2 }, shadowRadius: 4 },
  logoutText: { color: '#fff', fontSize: 17, fontWeight: '700', letterSpacing: 0.5 },
});
