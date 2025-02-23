import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, SafeAreaView, StatusBar, ScrollView, } from 'react-native';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';

const HomeScreen = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, paddingBottom: 100 }}>
        <StatusBar barStyle="dark-content" />
        
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.userInfo}>
            <Image
              source={require('../../assets/icon.png')} // Make sure to add an avatar image
              style={styles.avatar}
            />
            <Text style={styles.greeting}>Hey there👋,</Text>
            <Text style={styles.username}>Lucy Patil</Text>
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
          <TouchableOpacity style={styles.actionButton}>
            <Image
              source={require('../../assets/fake-call.png')} // Add icon image
              style={styles.actionIcon}
            />
            <Text style={styles.actionText}>Fake call</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton}>
            <Image
              source={require('../../assets/icon.png')} // Add icon image
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
          <TouchableOpacity style={styles.addButton}>
            <Text style={styles.addButtonText}>Add friends</Text>
            <Ionicons name="person-add" size={20} color="white" />
          </TouchableOpacity>
        </View>
        
        {/* Journey Section */}
        <TouchableOpacity style={styles.journeySection}>
          <View style={styles.journeyContent}>
            <Image
              source={require('../../assets/icon.png')} // Add journey icon
              style={styles.journeyIcon}
            />
            <View>
              <Text style={styles.journeyTitle}>Start a journey</Text>
              <Text style={styles.journeySubtitle}>
                Enter your destination, and the app will{'\n'}track your route in real-time.
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
          <Text style={styles.emergencyText}>Hospital Near</Text>
          <Ionicons name="chevron-forward" size={24} color="black" />
        </TouchableOpacity>

        {/* SOS Button */}
        <View style={styles.sosContainer}>
          <TouchableOpacity style={styles.sosButton}>
            <Text style={styles.sosText}>SOS</Text>
          </TouchableOpacity>
        </View>

        {/* Bottom Navigation */}
        {/* <View style={styles.bottomNav}>
          <TouchableOpacity style={styles.navItem}>
            <Ionicons name="home" size={24} color="#FF4B8C" />
            <Text style={styles.navText}>Home</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem}>
            <MaterialCommunityIcons name="navigation-variant-outline" size={24} color="gray" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem}>
            <Ionicons name="people-outline" size={24} color="gray" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem}>
            <Ionicons name="person-outline" size={24} color="gray" />
          </TouchableOpacity>
        </View> */}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
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
    flex: 1, // Expanded to take full width  
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
  sosContainer: {
    position: 'absolute',
    bottom: 65,
    alignSelf: 'center',
  },
  sosButton: {
    backgroundColor: '#FF4B8C',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FF4B8C',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
  },
  sosText: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#FFF',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#EEE',
    position: 'absolute',
    bottom: 0,
    width: '100%',
  },
  navItem: {
    alignItems: 'center',
  },
  navText: {
    fontSize: 12,
    color: '#FF4B8C',
    marginTop: 4,
  },
});

export default HomeScreen;
