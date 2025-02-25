// FakeCallScreen.js
import React from 'react';
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

const BACKGROUND_PINK = '#ffeef2';  // Soft pink background
const PINK = '#ff5f96';            // Vibrant pink for buttons/icons
const GREEN = '#4CAF50';           // "Call now" button color

export default function FakeCallScreen({ navigation }) {
  // Example: handle back arrow
  const handleBack = () => {
    navigation.goBack();
  };

  // Example: handle "Call now"
  const handleCallNow = () => {
    // Implement your "fake call" logic here
    alert('Initiating fake call...');
  };

  // Example: handle contact card edit
  const handleEditContact = (contactName) => {
    // Implement contact edit logic
    alert(`Editing contact: ${contactName}`);
  };

  // Example: handle add contact
  const handleAddContact = () => {
    // Implement add new contact logic
    alert('Add new contact');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={BACKGROUND_PINK} />

      {/* Header with back arrow & title */}
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

      {/* Scrollable area for contact cards, etc. */}
      <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 100 }}>
        
        {/* Example contact card: Mom */}
        <View style={styles.contactCard}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={styles.contactName}>Mom</Text>
            <Text style={styles.contactPhone}>+91 12345 678910</Text>
          </View>
          <TouchableOpacity onPress={() => handleEditContact('Mom')}>
            <MaterialIcons name="edit" size={20} color="#666" />
          </TouchableOpacity>
        </View>

        {/* Example contact card: Dad */}
        <View style={styles.contactCard}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={styles.contactName}>Dad</Text>
            <Text style={styles.contactPhone}>+91 12345 678910</Text>
          </View>
          <TouchableOpacity onPress={() => handleEditContact('Dad')}>
            <MaterialIcons name="edit" size={20} color="#666" />
          </TouchableOpacity>
        </View>

      </ScrollView>

      {/* Floating add contact button */}
      <TouchableOpacity style={styles.floatingButton} onPress={handleAddContact}>
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>

      {/* Call now button */}
      <TouchableOpacity style={styles.callButton} onPress={handleCallNow}>
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

// ================== STYLES ==================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BACKGROUND_PINK,  // Soft pink background
    paddingHorizontal: 20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#999',
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
  content: {
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
  contactName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginRight: 10,
  },
  contactPhone: {
    fontSize: 14,
    color: '#666',
  },
  floatingButton: {
    position: 'absolute',
    right: 20,
    bottom: 130,  // above the "Call now" button
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
