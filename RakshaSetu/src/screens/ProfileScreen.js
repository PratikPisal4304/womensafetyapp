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
import { auth, db } from '../../config/firebaseConfig'; // Adjust path if needed
import { ShakeDetectionContext } from '../../src/context/ShakeDetectionContext'; // Adjust path if needed

const ProfileScreen = ({ navigation }) => {
  // State for user profile data
  const [name, setName] = useState('Lucy');
  const [phone, setPhone] = useState('+91 12345 678910');
  const [isLoading, setIsLoading] = useState(true);

  // Get shake detection setting from context
  const { isShakeEnabled, setIsShakeEnabled } = useContext(ShakeDetectionContext);

  // Preferences and More arrays remain unchanged
  const preferences = [
    { title: 'My Posts', icon: 'account', screen: 'MyPosts' },
    { title: 'My Reports', icon: 'file-document', screen: 'MyReports' },
    { title: 'Manage Friends', icon: 'account-group', screen: 'ManageFriends' },
    { title: 'Change Language', icon: 'translate', screen: 'ChangeLanguage' },
    { title: 'Notification Settings', icon: 'bell', screen: 'NotificationSettings' },
    { title: 'Customize / Themes', icon: 'palette', screen: 'CustomiseThemes' },
  ];

  const moreItems = [
    { title: 'Help Line Numbers', icon: 'phone', screen: 'EmergencyHelpline' },
    { title: 'Help & Support', icon: 'lifebuoy', screen: 'HelpSupport' },
    { title: 'About Us', icon: 'information', screen: 'AboutUs' },
  ];

  // Use onSnapshot to listen to realtime updates on the user document
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
          Alert.alert('No Data', 'No profile data found for this user.');
        }
        setIsLoading(false);
      },
      (error) => {
        Alert.alert('Error', error.message);
        setIsLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'You have been logged out successfully.',
      [
        {
          text: 'OK',
          onPress: () => {
            // Place your logout logic here (e.g., auth.signOut())
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
        <Text style={styles.loadingText}>Loading Profile...</Text>
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
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => navigation.navigate('EditProfile')}
        >
          <MaterialCommunityIcons name="account-edit" size={28} color="#000" />
        </TouchableOpacity>
      </View>

      {/* Main Content */}
      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* Preferences Section */}
        <Text style={styles.sectionTitle}>Preferences</Text>
        <View style={styles.sectionContainer}>
          {preferences.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.listItem}
              onPress={() => navigation.navigate(item.screen)}
            >
              <MaterialCommunityIcons name={item.icon} size={24} color="#555" />
              <Text style={styles.itemText}>{item.title}</Text>
              <MaterialCommunityIcons name="chevron-right" size={24} color="#999" />
            </TouchableOpacity>
          ))}
        </View>

        {/* More Section */}
        <Text style={styles.sectionTitle}>More</Text>
        <View style={styles.sectionContainer}>
          {moreItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.listItem}
              onPress={() => item.screen && navigation.navigate(item.screen)}
            >
              <MaterialCommunityIcons name={item.icon} size={24} color="#555" />
              <Text style={styles.itemText}>{item.title}</Text>
              <MaterialCommunityIcons name="chevron-right" size={24} color="#999" />
            </TouchableOpacity>
          ))}
        </View>

        {/* Shake Detection Toggle Section */}
        <Text style={styles.sectionTitle}>Shake Detection</Text>
        <View style={[styles.sectionContainer, { paddingHorizontal: 20, paddingVertical: 15 }]}>
          <View style={styles.toggleRow}>
            <Text style={styles.itemText}>Enable Shake to Activate SOS</Text>
            <Switch
              value={isShakeEnabled}
              onValueChange={(value) => setIsShakeEnabled(value)}
              thumbColor={isShakeEnabled ? "#ff5f96" : "#ccc"}
              trackColor={{ false: "#eee", true: "#ffd1e1" }}
            />
          </View>
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

/* =========================
          STYLES
========================= */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
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
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#ddd',
  },
  name: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 10,
  },
  phone: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.8,
  },
  editButton: {
    position: 'absolute',
    right: 20,
    top: 70,
    backgroundColor: 'rgba(255,255,255,0.4)',
    padding: 8,
    borderRadius: 20,
  },
  content: {
    flex: 1,
    marginTop: 20,
  },
  contentContainer: {
    paddingBottom: 100,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 20,
    marginVertical: 10,
    color: '#555',
  },
  sectionContainer: {
    backgroundColor: '#fff',
    borderRadius: 10,
    marginHorizontal: 15,
    paddingVertical: 5,
    elevation: 2,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  itemText: {
    flex: 1,
    fontSize: 16,
    marginLeft: 15,
    color: '#333',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoutButton: {
    backgroundColor: '#FF4B8C',
    marginHorizontal: 60,
    marginTop: 30,
    marginBottom: 20,
    paddingVertical: 16,
    borderRadius: 20,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  logoutText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});

export default ProfileScreen;
