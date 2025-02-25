// FakeCallScreen.js
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';

const PINK_BG = '#ffd1e1';  // Soft pink background from screenshot
const PINK = '#ff5f96';     // Vibrant pink for icons/floating button
const GREEN = '#4CAF50';    // "Call now" button color

export default function FakeCallScreen({ navigation }) {
  // Example: list of contacts
  const [contacts, setContacts] = useState([
    {
      id: '1',
      name: 'Mom',
      phone: '+91 12345 678910',
      avatar: 'https://via.placeholder.com/50/FFC0CB/000000?text=M', // Example placeholder
    },
    {
      id: '2',
      name: 'Dad',
      phone: '+91 12345 678910',
      avatar: 'https://via.placeholder.com/50/FFC0CB/000000?text=D', // Example placeholder
    },
  ]);

  // Handle back arrow
  const handleBack = () => {
    navigation.goBack();
  };

  // Handle adding a new contact
  const handleAddContact = () => {
    // e.g. open a modal or navigate to "AddContactScreen"
    alert('Add new contact');
  };

  // Handle editing a contact
  const handleEditContact = (contact) => {
    // e.g. open an edit screen or modal
    alert(`Editing contact: ${contact.name}`);
  };

  // Handle "Call now" button
  const handleCallNow = () => {
    // Implement your "fake call" logic
    alert('Initiating fake call...');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={PINK_BG} />

      {/* Top row: circle back arrow & title */}
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>Fake Call</Text>
      </View>

      {/* Subtitle */}
      <Text style={styles.subtitle}>
        The Fake Call feature allows users to simulate an incoming call at any moment,
        providing a discreet way to escape uncomfortable or potentially dangerous situations.
      </Text>

      {/* Scrollable contact list */}
      <ScrollView style={styles.contactList} contentContainerStyle={{ paddingBottom: 140 }}>
        {contacts.map((contact) => (
          <View key={contact.id} style={styles.contactCard}>
            {/* Left side: small avatar + name & phone */}
            <View style={styles.contactInfo}>
              <Image
                source={{ uri: contact.avatar }}
                style={styles.avatar}
              />
              <View style={{ marginLeft: 10 }}>
                <Text style={styles.contactName}>{contact.name}</Text>
                <Text style={styles.contactPhone}>{contact.phone}</Text>
              </View>
            </View>
            {/* Right side: edit icon */}
            <TouchableOpacity onPress={() => handleEditContact(contact)}>
              <MaterialIcons name="edit" size={20} color="#666" />
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>

      {/* Floating add contact button (pink) */}
      <TouchableOpacity style={styles.floatingButton} onPress={handleAddContact}>
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>

      {/* "Call now" button (green) */}
      <TouchableOpacity style={styles.callButton} onPress={handleCallNow}>
        <Ionicons name="call-outline" size={18} color="#fff" style={{ marginRight: 8 }} />
        <Text style={styles.callButtonText}>Call now</Text>
      </TouchableOpacity>

      {/* Note at bottom */}
      <Text style={styles.note}>
        Note: The Fake Call feature is designed to help you stay safe by giving you a quick
        and discreet way to exit any uncomfortable or risky situation.
      </Text>
    </SafeAreaView>
  );
}

// =============== STYLES ===============
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: PINK_BG, // Pink background
    paddingHorizontal: 20,
    position: 'relative',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: PINK,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
  },
  subtitle: {
    marginTop: 15,
    fontSize: 14,
    lineHeight: 20,
    color: '#333',
  },
  contactList: {
    flex: 1,
    marginTop: 20,
  },
  contactCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingVertical: 15,
    paddingHorizontal: 15,
    marginBottom: 15,
    justifyContent: 'space-between',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  contactInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#ddd',
  },
  contactName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  contactPhone: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  floatingButton: {
    position: 'absolute',
    right: 20,
    bottom: 140, // leave space above the "Call now" button
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: PINK,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 4,
  },
  callButton: {
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: 60,
    backgroundColor: GREEN,
    borderRadius: 25,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 6,
  },
  callButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  note: {
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: 10,
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    lineHeight: 16,
  },
});
