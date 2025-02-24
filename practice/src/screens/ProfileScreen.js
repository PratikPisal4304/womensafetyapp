import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const ProfileScreen = ({ navigation }) => {
  const preferences = [
    { title: 'Manage Friends', icon: 'account-group', screen: 'ManageFriends' },
    { title: 'Change Language', icon: 'translate', screen: 'ChangeLanguage' },
    { title: 'Notification Settings', icon: 'bell', screen: 'NotificationSettings' },
    { title: 'Customize / Themes', icon: 'palette', screen: 'CustomiseThemes' },
  ];

  const moreItems = [
    { title: 'Help Line Numbers', icon: 'phone' },
    { title: 'Connectivity Settings', icon: 'wifi' },
    { title: 'Help & Support', icon: 'lifebuoy' },
    { title: 'About Us', icon: 'information' },
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerContainer}>
        <View style={styles.headerCurve} />
        <Image source={{ uri: 'https://via.placeholder.com/80' }} style={styles.avatar} />
        <Text style={styles.name}>Lucy</Text>
        <Text style={styles.phone}>+91 12345 678910</Text>
        <TouchableOpacity style={styles.editButton} onPress={() => navigation.navigate('EditProfileScreen')}>
          <MaterialCommunityIcons name="account-edit" size={28} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
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
            <TouchableOpacity key={index} style={styles.listItem}>
              <MaterialCommunityIcons name={item.icon} size={24} color="#555" />
              <Text style={styles.itemText}>{item.title}</Text>
              <MaterialCommunityIcons name="chevron-right" size={24} color="#999" />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
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
    top: 50,
  },
  content: {
    flex: 1,
    marginTop: 20,
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
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 10,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    elevation: 5,
  },
  sosButton: {
    backgroundColor: '#e63946',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 50,
    alignItems: 'center',
  },
  sosText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
});

export default ProfileScreen;