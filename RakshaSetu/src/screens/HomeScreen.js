// HomeScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  StatusBar,
  ScrollView,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

// 1) Import Firestore + Auth (example)
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../../config/firebaseConfig'; // adjust path if needed

const PINK = '#ff5f96';

const HomeScreen = ({ navigation }) => {
  // 2) State for user info
  const [username, setUsername] = useState('Lucy Patil'); // fallback
  const [avatarUrl, setAvatarUrl] = useState(null);

  // 3) useEffect to fetch from Firestore on mount
  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    (async () => {
      try {
        const docRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.name) setUsername(data.name);
          if (data.avatarUrl) setAvatarUrl(data.avatarUrl);
          // add other fields as needed
        }
      } catch (error) {
        console.log('Error fetching user data:', error.message);
      }
    })();
  }, []);

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <ScrollView contentContainerStyle={{ flexGrow: 1, paddingBottom: 100 }}>
        {/* Pink Header with Curve */}
        <View style={styles.header}>
          <View style={styles.userInfo}>
            {/* 4) If we have an avatarUrl, display that. Otherwise use local icon. */}
            <Image
              source={avatarUrl ? { uri: avatarUrl } : require('../../assets/icon.png')}
              style={styles.avatar}
            />
            <Text style={styles.greeting}>Hey there👋,</Text>
            {/* Display from state */}
            <Text style={styles.username}>{username}</Text>
          </View>
          <View style={styles.headerIcons}>
            <TouchableOpacity>
              <Ionicons name="mic-outline" size={24} color="black" />
            </TouchableOpacity>
            <TouchableOpacity>
              <Ionicons name="notifications-outline" size={24} color="black" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity onPress={() => navigation.navigate('FakeCall')} style={styles.actionButton}>
            <Image
              source={require('../../assets/fake-call.png')}
              style={styles.actionIcon}
            />
            <Text style={styles.actionText}>Fake call</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
            <Image
              source={require('../../assets/livelocation.png')}
              style={styles.actionIcon}
            />
            <Text style={styles.actionText}>Share live{'\n'}location</Text>
          </TouchableOpacity>
        </View>

        {/* Add Close People Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Add Close people</Text>
            <Text style={styles.sectionSubtitle}>Add close people and friends for sos</Text>
          </View>
          <TouchableOpacity style={styles.addButton} onPress={() => navigation.navigate('AddFriends')}>
            <Text style={styles.addButtonText}>Add friends</Text>
            <Ionicons name="person-add" size={20} color="white" />
          </TouchableOpacity>
        </View>

        {/* Journey Section */}
        <TouchableOpacity style={styles.journeySection}>
          <View style={styles.journeyContent}>
            <Image
              source={require('../../assets/journey.png')}
              style={styles.journeyIcon}
            />
            <View>
              <Text style={styles.journeyTitle}>Start a journey</Text>
              <Text style={styles.journeySubtitle}>
                Enter your destination, and the app{'\n'}will track your route in real-time.
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={24} color="black" />
        </TouchableOpacity>

        {/* Emergency Buttons */}
        <TouchableOpacity style={styles.emergencyButton}>
          <FontAwesome5 name="shield-alt" size={20} color="black" />
          <Text style={styles.emergencyText}>Police station near me</Text>
          <Ionicons name="chevron-forward" size={24} color="black" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.emergencyButton}>
          <FontAwesome5 name="hospital" size={20} color="black" />
          <Text style={styles.emergencyText}>Hospital near me </Text>
          <Ionicons name="chevron-forward" size={24} color="black" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.emergencyButton}>
          <FontAwesome5 name="clinic-medical" size={20} color="black" />
          <Text style={styles.emergencyText}>Pharmacy near me </Text>
          <Ionicons name="chevron-forward" size={24} color="black" />
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

export default HomeScreen;

/* ============ STYLES (unchanged) ============ */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  header: {
    backgroundColor: PINK,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    paddingHorizontal: 20,
    paddingTop: 70,
    paddingBottom: 40,
    marginBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userInfo: {
    flexDirection: 'column',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  greeting: {
    fontSize: 16,
    color: '#666',
  },
  username: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
  },
  headerIcons: {
    flexDirection: 'row',
    gap: 15,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 20,
  },
  actionButton: {
    backgroundColor: '#FFF',
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
    width: '45%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionIcon: {
    width: 40,
    height: 40,
    marginBottom: 10,
  },
  actionText: {
    textAlign: 'center',
    color: '#000',
  },
  section: {
    padding: 20,
    backgroundColor: '#FFF',
    borderRadius: 15,
    marginHorizontal: 20,
    marginVertical: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionHeader: {
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  sectionSubtitle: {
    color: '#666',
    fontSize: 14,
  },
  addButton: {
    backgroundColor: '#FF4B8C',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    borderRadius: 25,
    gap: 10,
    marginTop: 10,
  },
  addButtonText: {
    color: '#FFF',
    fontWeight: '500',
  },
  journeySection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    backgroundColor: '#FFF',
    borderRadius: 15,
    marginHorizontal: 20,
    marginVertical: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  journeyContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  journeyIcon: {
    width: 40,
    height: 40,
    marginRight: 15,
  },
  journeyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  journeySubtitle: {
    color: '#666',
    fontSize: 12,
  },
  emergencyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    backgroundColor: '#FFF',
    borderRadius: 15,
    marginHorizontal: 20,
    marginVertical: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  emergencyText: {
    flex: 1,
    marginLeft: 15,
    fontSize: 16,
    color: '#000',
  },
});
