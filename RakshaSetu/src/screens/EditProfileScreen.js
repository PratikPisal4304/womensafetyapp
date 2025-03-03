import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { auth, db } from '../../config/firebaseConfig'; // Ensure these are correctly exported

const EditProfileScreen = ({ navigation }) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [gender, setGender] = useState('');
  const [birthday, setBirthday] = useState('');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [avatarUri, setAvatarUri] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Fetch the user data from Firestore when the component mounts
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const user = auth.currentUser;
        if (user) {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            setName(data.name || '');
            setPhone(data.phone || user.phoneNumber || '');
            setEmail(data.email || '');
            setAddress(data.address || '');
            setGender(data.gender || '');
            setBirthday(data.birthday || '');
            setAvatarUri(data.avatarUrl || '');
            if (data.birthday) {
              setDate(new Date(data.birthday));
            }
          } else {
            Alert.alert('No Data', 'No profile data found for this user.');
          }
        }
      } catch (error) {
        Alert.alert('Error', 'Failed to load profile data');
      }
    };

    fetchUserData();
  }, []);

  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(String(email).toLowerCase());
  };

  const validatePhone = (phone) => {
    const re = /^\+?[1-9]\d{1,14}$/;
    return re.test(phone);
  };

  // Handle saving changes to the profile
  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter your name');
      return;
    }
    if (!validateEmail(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }
    if (phone && !validatePhone(phone)) {
      Alert.alert('Error', 'Please enter a valid phone number');
      return;
    }
    try {
      setIsLoading(true);
      const user = auth.currentUser;
      if (!user) throw new Error('User not authenticated');

      const userData = {
        name,
        phone,
        email,
        address,
        gender,
        birthday: date.toISOString(),
        ...(avatarUri && { avatarUrl: avatarUri }),
      };

      await updateDoc(doc(db, 'users', user.uid), userData);
      Alert.alert('Success', 'Profile updated successfully!');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Image picking and upload logic
  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      const uri = result.assets[0].uri;
      try {
        const storage = getStorage();
        const storageRef = ref(storage, `avatars/${auth.currentUser.uid}`);
        
        const response = await fetch(uri);
        const blob = await response.blob();
        
        await uploadBytes(storageRef, blob);
        const downloadURL = await getDownloadURL(storageRef);
        setAvatarUri(downloadURL);
      } catch (error) {
        Alert.alert('Error', 'Failed to upload image');
      }
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Header Section */}
        <View style={styles.headerContainer}>
          <View style={styles.headerCurve} />
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <MaterialCommunityIcons name="arrow-left" size={28} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Profile</Text>
          <TouchableOpacity onPress={pickImage}>
            <Image
              source={{ uri: avatarUri || 'https://via.placeholder.com/80' }}
              style={styles.avatar}
            />
            <View style={styles.avatarEditButton}>
              <MaterialCommunityIcons name="camera" size={18} color="#fff" />
            </View>
          </TouchableOpacity>
        </View>

        {/* Form Section */}
        <View style={styles.content}>
          <Text style={styles.label}>Name</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Your Name"
            placeholderTextColor="#999"
          />

          <Text style={styles.label}>Phone</Text>
          <TextInput
            style={styles.input}
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            placeholder="+1 234 567 8901"
            placeholderTextColor="#999"
          />

          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            placeholder="your@email.com"
            placeholderTextColor="#999"
            autoCapitalize="none"
          />

          <Text style={styles.label}>Address</Text>
          <TextInput
            style={styles.input}
            value={address}
            onChangeText={setAddress}
            placeholder="123 Main St"
            placeholderTextColor="#999"
          />

          <Text style={styles.label}>Gender</Text>
          <View style={styles.genderContainer}>
            {['Male', 'Female', 'Other'].map((option) => (
              <TouchableOpacity
                key={option}
                style={[
                  styles.genderButton,
                  gender === option && styles.selectedGender,
                ]}
                onPress={() => setGender(option)}
              >
                <Text style={gender === option ? styles.selectedGenderText : styles.genderText}>
                  {option}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Birthday</Text>
          <TouchableOpacity
            style={styles.dateInputContainer}
            onPress={() => setShowDatePicker(true)}
          >
            <Text style={[styles.dateText, { color: birthday ? '#333' : '#999' }]}>
              {birthday ? birthday : 'Select your birthday'}
            </Text>
          </TouchableOpacity>
          {showDatePicker && (
            <DateTimePicker
              value={date}
              mode="date"
              display="default"
              maximumDate={new Date()}
              onChange={(event, selectedDate) => {
                setShowDatePicker(Platform.OS === 'ios');
                if (selectedDate) {
                  setDate(selectedDate);
                  setBirthday(selectedDate.toLocaleDateString());
                }
              }}
            />
          )}

          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleSave}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.saveButtonText}>Save Changes</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollContainer: {
    paddingBottom: 100,
  },
  genderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 5,
  },
  genderButton: {
    flex: 1,
    marginHorizontal: 4,
    padding: 12,
    borderRadius: 10,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#eee',
    alignItems: 'center',
  },
  selectedGender: {
    backgroundColor: '#FF4B8C',
    borderColor: '#FF4B8C',
  },
  genderText: {
    color: '#333',
    fontWeight: '500',
  },
  selectedGenderText: {
    color: '#fff',
    fontWeight: '500',
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
  backButton: {
    position: 'absolute',
    left: 20,
    top: 50,
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
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 5,
    borderRadius: 20,
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
  dateInputContainer: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginTop: 5,
    borderWidth: 1,
    borderColor: '#eee',
    justifyContent: 'center',
  },
  dateText: { fontSize: 16 },
  saveButton: {
    backgroundColor: '#FF4B8C',
    marginTop: 30,
    marginBottom: 20,
    paddingVertical: 16,
    marginHorizontal: 60,
    borderRadius: 20,
    alignItems: 'center',
    elevation: 3,
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
