import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView, 
  Platform 
} from 'react-native';
import * as Contacts from 'expo-contacts';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  doc, 
  getDoc, 
  updateDoc 
} from 'firebase/firestore';
import { auth, db } from '../../config/firebaseConfig';
import { Firestore } from 'firebase/firestore';


export default function AddFriendsScreen() {

  const [contacts, setContacts] = useState([]);
  const [filteredContacts, setFilteredContacts] = useState([]);
  const [selectedContacts, setSelectedContacts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch contacts from device
  useEffect(() => {
    (async () => {
      const { status } = await Contacts.requestPermissionsAsync();
      if (status === 'granted') {
        const { data } = await Contacts.getContactsAsync({
          fields: [Contacts.Fields.Name, Contacts.Fields.PhoneNumbers],
        });
        setContacts(data);
        setFilteredContacts(data);
      }
    })();
  }, []);

  // Fetch added friends from Firestore (stored in user's document under 'addedFriends')
  useEffect(() => {
    const fetchAddedFriends = async () => {
      const user = auth.currentUser;
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            if (data.addedFriends) {
              setSelectedContacts(data.addedFriends);
            }
          }
        } catch (error) {
          console.error("Error fetching added friends:", error);
        }
      }
    };
    fetchAddedFriends();
  }, []);

  const toggleContactSelection = (id) => {
    setSelectedContacts((prev) =>
      prev.includes(id)
        ? prev.filter((contactId) => contactId !== id)
        : [...prev, id]
    );
  };

  // Save selected contacts to Firestore under the current user's document
  const saveSelectedContacts = async () => {
    try {
      const user = auth.currentUser;
      console.log("User ID:", user?.uid);
      console.log("Selected Contacts:", selectedContacts);
      
      if (user) {
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        if (!userDoc.exists()) {
          console.error('User document does not exist!');
          return;
        }
  
        await updateDoc(userDocRef, {
          addedFriends: selectedContacts,
        });
        console.log("Contacts successfully saved!");
        alert('Contacts Saved Successfully');
      }
    } catch (error) {
      console.error('Error saving contacts:', error);
    }
  };
  

  const handleSearch = (query) => {
    setSearchQuery(query);
    if (query.trim() === '') {
      setFilteredContacts(contacts);
    } else {
      const filtered = contacts.filter((contact) =>
        contact.name?.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredContacts(filtered);
    }
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.searchBar}
        placeholder="Search Contacts"
        placeholderTextColor="#999"
        value={searchQuery}
        onChangeText={handleSearch}
      />
      <ScrollView>
        {filteredContacts.map((contact) => (
          <TouchableOpacity
            key={contact.id}
            style={styles.contactItem}
            onPress={() => {
              if (contact.id) {
                toggleContactSelection(contact.id);
              }
            }}
          >
            <Text style={styles.contactName}>{contact.name}</Text>
            {contact.id && selectedContacts.includes(contact.id) && (
              <Text style={styles.selectedIcon}>✓</Text>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
      <TouchableOpacity style={styles.saveButton} onPress={saveSelectedContacts}>
        <Text style={styles.saveButtonText}>Save</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: Platform.OS === 'android' ? 40 : 0,
  },
  searchBar: {
    backgroundColor: '#f0f0f0',
    padding: 12,
    margin: 16,
    borderRadius: 10,
    fontSize: 16,
    color: '#333',
  },
  contactItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  contactName: {
    fontSize: 16,
    color: '#333',
  },
  selectedIcon: {
    fontSize: 16,
    color: '#FF69B4',
  },
  saveButton: {
    backgroundColor: '#FF69B4',
    padding: 16,
    alignItems: 'center',
    // marginVertical: 70,
    // bottom: 60,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
