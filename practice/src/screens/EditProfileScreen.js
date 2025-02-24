// EditProfileScreen.js
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  TextInput,
  ScrollView,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const EditProfileScreen = ({ navigation }) => {
  // Example local state for editing
  const [name, setName] = useState('Lucy');
  const [phone, setPhone] = useState('+91 12345 678910');
  const [email, setEmail] = useState('lucy@example.com');
  const [address, setAddress] = useState('');
  const [gender, setGender] = useState('');
  const [birthday, setBirthday] = useState('');

  const handleSave = () => {
    // TODO: Save logic here (API call, Redux dispatch, etc.)
    console.log('Saving changes:', { name, phone, email, address, gender, birthday });
    // After saving, you could navigate back:
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      {/* Pink Header */}
      <View style={styles.headerContainer}>
        <View style={styles.headerCurve} />

        {/* Avatar */}
        <Image source={{ uri: 'https://via.placeholder.com/80' }} style={styles.avatar} />

        {/* Edit avatar icon (optional) */}
        <TouchableOpacity style={styles.avatarEditButton}>
          <MaterialCommunityIcons name="camera" size={18} color="#fff" />
        </TouchableOpacity>

        {/* Back Arrow */}
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={28} color="#fff" />
        </TouchableOpacity>

        {/* Screen Title */}
        <Text style={styles.headerTitle}>Edit Profile</Text>
      </View>

      {/* Content */}
      <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Name */}
        <Text style={styles.label}>Name</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Your Name"
          placeholderTextColor="#999"
        />

        {/* Phone */}
        <Text style={styles.label}>Phone</Text>
        <TextInput
          style={styles.input}
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          placeholder="Your Phone Number"
          placeholderTextColor="#999"
        />

        {/* Email */}
        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          placeholder="Your Email"
          placeholderTextColor="#999"
          autoCapitalize="none"
        />

        {/* Address */}
        <Text style={styles.label}>Address</Text>
        <TextInput
          style={styles.input}
          value={address}
          onChangeText={setAddress}
          placeholder="Your Address"
          placeholderTextColor="#999"
        />

        {/* Gender */}
        <Text style={styles.label}>Gender</Text>
        <TextInput
          style={styles.input}
          value={gender}
          onChangeText={setGender}
          placeholder="Male / Female / Other"
          placeholderTextColor="#999"
        />

        {/* Birthday */}
        <Text style={styles.label}>Birthday</Text>
        <TextInput
          style={styles.input}
          value={birthday}
          onChangeText={setBirthday}
          placeholder="DD/MM/YYYY"
          placeholderTextColor="#999"
        />

        {/* Save Button */}
        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>Save Changes</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

/* 
  =========================
        STYLES
  =========================
  - Maintains the pink header style
  - Includes new gender & birthday fields
  - Removes bio
*/
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  headerContainer: {
    backgroundColor: '#ff5f96',
    paddingTop: 50,
    paddingBottom: 30,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    alignItems: 'center',
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
  avatarEditButton: {
    position: 'absolute',
    bottom: 20,
    right: 130,
    backgroundColor: '#00000050',
    padding: 5,
    borderRadius: 20,
  },
  backButton: {
    position: 'absolute',
    left: 20,
    top: 50,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    marginTop: 10,
  },
  content: {
    flex: 1,
    marginTop: 20,
    paddingHorizontal: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#555',
    marginTop: 20,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginTop: 5,
    fontSize: 16,
    color: '#333',
    borderWidth: 1,
    borderColor: '#eee',
  },
  saveButton: {
    backgroundColor: '#FF4B8C',
    marginTop: 30,
    marginBottom: 20,
    paddingVertical: 16,
    marginHorizontal: 60,
    borderRadius: 20,
    alignItems: 'center',
    elevation: 3,
    // iOS shadow
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});

export default EditProfileScreen;
