import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView, 
  Platform,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  Alert
} from 'react-native';
import * as Contacts from 'expo-contacts';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  doc, 
  getDoc, 
  updateDoc,
  setDoc,
  serverTimestamp 
} from 'firebase/firestore';
import { auth, db } from '../../config/firebaseConfig';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

export default function AddFriendsScreen({ navigation }) {
  const [contacts, setContacts] = useState([]);
  const [filteredContacts, setFilteredContacts] = useState([]);
  const [selectedContacts, setSelectedContacts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [contactsCount, setContactsCount] = useState(0);

  // Function to fetch contacts with error handling and debug logs
  const fetchContacts = async () => {
    setLoading(true);
    setError(null);
    try {
      const { status } = await Contacts.requestPermissionsAsync();
      console.log("Contacts permission status:", status);
      
      if (status === 'granted') {
        console.log("Fetching contacts...");
        const { data } = await Contacts.getContactsAsync({
          fields: [Contacts.Fields.Name, Contacts.Fields.PhoneNumbers, Contacts.Fields.Image],
          sort: Contacts.SortTypes.FirstName
        });
        
        console.log("Total contacts retrieved:", data.length);
        
        // Log sample contact for debugging
        if (data.length > 0) {
          console.log("First contact sample:", JSON.stringify(data[0], null, 2));
        }
        
        // Filter out contacts without phone numbers
        const validContacts = data.filter(contact => 
          contact.phoneNumbers && contact.phoneNumbers.length > 0
        );
        
        console.log("Valid contacts after filtering:", validContacts.length);
        setContactsCount(validContacts.length);
        
        setContacts(validContacts);
        setFilteredContacts(validContacts);
      } else {
        console.log("Permission denied for contacts");
        setError('Permission to access contacts was denied');
      }
    } catch (err) {
      console.error("Error fetching contacts:", err);
      setError('Failed to load contacts. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch contacts when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchContacts();
      fetchAddedFriends();
      return () => {};
    }, [])
  );

  // Fetch added friends from Firestore with improved error handling
  const fetchAddedFriends = async () => {
    const user = auth.currentUser;
    if (!user) {
      setError('You must be logged in to view friends');
      return;
    }
    
    try {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        if (data.addedFriends) {
          console.log("Retrieved added friends:", data.addedFriends.length);
          setSelectedContacts(data.addedFriends);
        }
      } else {
        // Create user document if it doesn't exist
        await setDoc(doc(db, 'users', user.uid), {
          addedFriends: [],
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        setSelectedContacts([]);
      }
    } catch (error) {
      console.error("Error fetching added friends:", error);
      setError('Failed to load your friends list');
    }
  };

  const toggleContactSelection = (id) => {
    setSelectedContacts((prev) =>
      prev.includes(id)
        ? prev.filter((contactId) => contactId !== id)
        : [...prev, id]
    );
  };

  // Save selected contacts with improved error handling and feedback
  const saveSelectedContacts = async () => {
    setSaving(true);
    
    try {
      const user = auth.currentUser;
      if (!user) {
        Alert.alert('Error', 'You must be logged in to save contacts');
        return;
      }
      
      const userDocRef = doc(db, 'users', user.uid);
      
      // Try to get the document first
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        await updateDoc(userDocRef, {
          addedFriends: selectedContacts,
          updatedAt: serverTimestamp()
        });
      } else {
        // Create document if it doesn't exist
        await setDoc(userDocRef, {
          addedFriends: selectedContacts,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      }
      
      Alert.alert(
        'Success', 
        'Contacts saved successfully',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      console.error('Error saving contacts:', error);
      Alert.alert('Error', 'Failed to save contacts. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    if (query.trim() === '') {
      setFilteredContacts(contacts);
    } else {
      const filtered = contacts.filter((contact) =>
        contact.name?.toLowerCase().includes(query.toLowerCase()) ||
        (contact.phoneNumbers && contact.phoneNumbers.some(phone => 
          phone.number.replace(/\D/g, '').includes(query.replace(/\D/g, ''))
        ))
      );
      setFilteredContacts(filtered);
    }
  };

  // Get first letter of name for section header
  const getInitial = (name) => {
    return name && name.charAt(0).toUpperCase();
  };

  // Group contacts by first letter for section list
  const getGroupedContacts = () => {
    const groups = {};
    
    filteredContacts.forEach(contact => {
      if (contact.name) {
        const initial = getInitial(contact.name);
        if (!groups[initial]) {
          groups[initial] = [];
        }
        groups[initial].push(contact);
      }
    });
    
    // Convert to array and sort
    return Object.keys(groups)
      .sort()
      .map(key => ({
        initial: key,
        data: groups[key]
      }));
  };

  const groupedContacts = getGroupedContacts();

  const getContactPhoneNumber = (contact) => {
    if (contact.phoneNumbers && contact.phoneNumbers.length > 0) {
      return contact.phoneNumbers[0].number;
    }
    return '';
  };

  // Render contact list item with improved UI and already added indicator
  const renderContactItem = (contact) => {
    const isSelected = selectedContacts.includes(contact.id);
    
    return (
      <TouchableOpacity
        key={contact.id}
        style={styles.contactItem}
        onPress={() => {
          if (contact.id) {
            toggleContactSelection(contact.id);
          }
        }}
        activeOpacity={0.7}
      >
        <View style={styles.contactInfo}>
          <View style={[
            styles.contactAvatar, 
            isSelected ? styles.selectedAvatar : null
          ]}>
            <Text style={styles.avatarText}>
              {contact.name ? contact.name.charAt(0).toUpperCase() : '?'}
            </Text>
          </View>
          <View style={styles.contactTextContainer}>
            <Text style={styles.contactName} numberOfLines={1}>{contact.name}</Text>
            <Text style={styles.contactPhone} numberOfLines={1}>
              {getContactPhoneNumber(contact)}
            </Text>
          </View>
        </View>
        {contact.id && (
          <View style={styles.checkboxContainer}>
            {isSelected ? (
              <Ionicons name="checkmark-circle" size={24} color="#FF69B4" />
            ) : (
              <Ionicons name="ellipse-outline" size={24} color="#aaa" />
            )}
          </View>
        )}
      </TouchableOpacity>
    );
  };
  
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Add Friends</Text>
          <Text style={styles.selectedCountText}>
            {selectedContacts.length} selected
          </Text>
        </View>
        
        <View style={styles.searchContainer}>
          <Ionicons name="search-outline" size={20} color="#999" style={styles.searchIcon} />
          <TextInput
            style={styles.searchBar}
            placeholder="Search by name or phone number"
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={handleSearch}
          />
          {searchQuery !== '' && (
            <TouchableOpacity onPress={() => handleSearch('')} style={styles.clearButton}>
              <Ionicons name="close-circle" size={20} color="#999" />
            </TouchableOpacity>
          )}
        </View>
        
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity 
              style={styles.retryButton}
              onPress={fetchContacts}
            >
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}
        
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#FF69B4" />
            <Text style={styles.loadingText}>Loading contacts...</Text>
          </View>
        ) : (
          <>
            {contactsCount === 0 && (
              <View style={styles.diagnosticContainer}>
                <Text style={styles.diagnosticText}>
                  Debug: Found 0 contacts. Please check permissions or create test contacts.
                </Text>
              </View>
            )}
            
            {filteredContacts.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="people-outline" size={64} color="#ccc" />
                <Text style={styles.emptyText}>
                  {searchQuery ? 'No contacts match your search' : 'No contacts found'}
                </Text>
                <Text style={styles.emptySubtext}>
                  {contactsCount === 0 ? 
                    'Make sure your contacts are accessible and you have granted permissions.' : 
                    'Try adding some contacts to your device.'}
                </Text>
                <TouchableOpacity 
                  style={styles.refreshButton}
                  onPress={fetchContacts}
                >
                  <Text style={styles.refreshButtonText}>Refresh Contacts</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                <View style={styles.legendContainer}>
                  <View style={styles.legendItem}>
                    <View style={styles.selectedAvatar}>
                      <Text style={styles.avatarText}>A</Text>
                    </View>
                    <Text style={styles.legendText}>Already Added</Text>
                  </View>
                  <View style={styles.legendItem}>
                    <View style={styles.contactAvatar}>
                      <Text style={styles.avatarText}>N</Text>
                    </View>
                    <Text style={styles.legendText}>Not Added</Text>
                  </View>
                </View>
                
                <ScrollView style={styles.contactsList}>
                  {groupedContacts.map(group => (
                    <View key={group.initial}>
                      <Text style={styles.sectionHeader}>{group.initial}</Text>
                      {group.data.map(contact => renderContactItem(contact))}
                    </View>
                  ))}
                </ScrollView>
              </>
            )}
          </>
        )}
        
        <View style={styles.bottomActions}>
          <TouchableOpacity 
            style={[
              styles.saveButton, 
              (saving || selectedContacts.length === 0) ? styles.saveButtonDisabled : null
            ]} 
            onPress={saveSelectedContacts}
            disabled={saving || selectedContacts.length === 0}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.saveButtonText}>
                Save {selectedContacts.length > 0 ? `(${selectedContacts.length})` : ''}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  selectedCountText: {
    fontSize: 14,
    color: '#FF69B4',
    fontWeight: '500',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f6f6f6',
    margin: 16,
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchBar: {
    flex: 1,
    padding: 12,
    fontSize: 16,
    color: '#333',
  },
  clearButton: {
    padding: 8,
  },
  contactsList: {
    flex: 1,
  },
  sectionHeader: {
    backgroundColor: '#f9f9f9',
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontSize: 14,
    fontWeight: 'bold',
    color: '#666',
  },
  contactItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  contactInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  contactAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  selectedAvatar: {
    backgroundColor: '#ffd5e5',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
  },
  contactTextContainer: {
    flex: 1,
  },
  contactName: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  contactPhone: {
    fontSize: 14,
    color: '#777',
    marginTop: 2,
  },
  checkboxContainer: {
    padding: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
  },
  emptySubtext: {
    marginTop: 8,
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  refreshButton: {
    backgroundColor: '#FF69B4',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 16,
  },
  refreshButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#999',
  },
  errorContainer: {
    padding: 16,
    backgroundColor: '#ffeeee',
    marginHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  errorText: {
    color: '#d32f2f',
    textAlign: 'center',
    marginBottom: 8,
  },
  retryButton: {
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4,
  },
  retryButtonText: {
    color: '#666',
    fontWeight: '500',
  },
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 8,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 12,
  },
  legendText: {
    marginLeft: 8,
    color: '#666',
    fontSize: 14,
  },
  diagnosticContainer: {
    padding: 8,
    backgroundColor: '#fffde7',
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 4,
  },
  diagnosticText: {
    color: '#ff8f00',
    fontSize: 12,
    textAlign: 'center',
  },
  bottomActions: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  saveButton: {
    backgroundColor: '#FF69B4',
    padding: 16,
    alignItems: 'center',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  saveButtonDisabled: {
    backgroundColor: '#ffb6d3',
    opacity: 0.7,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});