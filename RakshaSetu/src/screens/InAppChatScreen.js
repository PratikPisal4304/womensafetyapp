import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Image,
  ActivityIndicator,
} from 'react-native';

// For the pink gradient
import { LinearGradient } from 'expo-linear-gradient';

// Firebase imports (MODULAR SYNTAX v9+)
import {
  collection,
  doc,
  onSnapshot,
  query,
  where,
  updateDoc,
  addDoc,
  setDoc,
  getDocs,
  serverTimestamp,
  orderBy,
  limit,
} from 'firebase/firestore';

import { db } from '../../config/firebaseConfig'; // <-- Your Firestore instance

const InAppChatScreen = () => {
  // ---------------------------------------
  // 1. STATES
  // ---------------------------------------
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  // "Close Friends" from Firestore
  const [closeFriends, setCloseFriends] = useState([]);
  const [loadingCloseFriends, setLoadingCloseFriends] = useState(true);

  // "Requests" from Firestore
  const [requests, setRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(true);

  // "Messages" list (accepted chats)
  const [messagesList, setMessagesList] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(true);

  // Chat data: for each threadId, store an array of messages
  const [chatData, setChatData] = useState({});

  // Which user's chat is currently open?
  const [selectedChat, setSelectedChat] = useState(null);

  // Input for sending a new message in Chat Detail
  const [inputText, setInputText] = useState('');

  // For demonstration, assume we have a current user ID (replace with real auth)
  const currentUserId = 'CURRENT_USER_ID'; // e.g. from Firebase Auth

  // We'll store an unsubscribe reference for the chat detail's real-time listener
  const unsubscribeRef = useRef(null);

  // ---------------------------------------
  // 2. USE EFFECTS: FETCH DATA ON MOUNT
  // ---------------------------------------
  // Example: fetch "close friends" from Firestore
  useEffect(() => {
    // Suppose each user doc has a subcollection "closeFriends"
    // We'll assume doc path: users/CURRENT_USER_ID/closeFriends
    const closeFriendsRef = collection(db, 'users', currentUserId, 'closeFriends');
    const unsubscribe = onSnapshot(closeFriendsRef, (snapshot) => {
      const friends = [];
      snapshot.forEach((docSnap) => {
        friends.push({ id: docSnap.id, ...docSnap.data() });
      });
      setCloseFriends(friends);
      setLoadingCloseFriends(false);
    });

    return () => unsubscribe();
  }, [currentUserId]);

  // Example: fetch "requests" from Firestore
  useEffect(() => {
    // Suppose there's a collection "requests" with docs containing
    // { fromUserId, toUserId, status, fromUserName, fromUserImage, ... }
    // We only fetch requests where toUserId == currentUserId and status == "pending"
    const requestsRef = collection(db, 'requests');
    const q = query(
      requestsRef,
      where('toUserId', '==', currentUserId),
      where('status', '==', 'pending')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const reqs = [];
      snapshot.forEach((docSnap) => {
        reqs.push({ id: docSnap.id, ...docSnap.data() });
      });
      setRequests(reqs);
      setLoadingRequests(false);
    });

    return () => unsubscribe();
  }, [currentUserId]);

  // Example: fetch "messagesList" (active chats) from Firestore
  useEffect(() => {
    // Suppose there's a collection "threads" that references participants
    // We fetch any doc where participants array includes currentUserId
    const messagesRef = collection(db, 'threads');
    const q = query(messagesRef, where('participants', 'array-contains', currentUserId));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        // The other user info for display (assuming we store in doc)
        // "userData" might be an array of objects for each participant
        const otherUser = data?.userData?.find((u) => u.id !== currentUserId);

        msgs.push({
          threadId: docSnap.id,
          ...otherUser, // e.g. name, image, etc.
          lastMessage: data.lastMessage || '',
          lastTimestamp: data.lastTimestamp || null,
        });
      });
      setMessagesList(msgs);
      setLoadingMessages(false);
    });

    return () => unsubscribe();
  }, [currentUserId]);

  // ---------------------------------------
  // 3. SEARCH LOGIC
  // ---------------------------------------
  const handleSearch = useCallback(async () => {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    try {
      // Example: search in "users" collection by name
      const usersRef = collection(db, 'users');
      // naive "startsWith" style query (case sensitive)
      const q = query(
        usersRef,
        where('name', '>=', searchTerm),
        where('name', '<=', searchTerm + '\uf8ff'),
        limit(10)
      );
      const snap = await getDocs(q);
      const results = [];
      snap.forEach((docSnap) => {
        results.push({ id: docSnap.id, ...docSnap.data() });
      });
      setSearchResults(results);
    } catch (error) {
      console.log('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  }, [searchTerm]);

  // ---------------------------------------
  // 4. REQUEST HANDLERS
  // ---------------------------------------
  // Accept a request => update request doc => create "thread"
  const handleAcceptRequest = async (requestItem) => {
    try {
      // 1. Update request doc to "accepted"
      const requestDocRef = doc(db, 'requests', requestItem.id);
      await updateDoc(requestDocRef, { status: 'accepted' });

      // 2. Create or update a "thread" doc in "threads"
      const newThread = {
        participants: [requestItem.fromUserId, requestItem.toUserId],
        lastMessage: '',
        lastTimestamp: serverTimestamp(),
        userData: [
          {
            id: requestItem.fromUserId,
            name: requestItem.fromUserName,
            image: requestItem.fromUserImage,
          },
          {
            id: requestItem.toUserId,
            name: 'CurrentUserName', // replace with real user name
            image: 'CurrentUserImage', // replace with real user image
          },
        ],
      };

      await addDoc(collection(db, 'threads'), newThread);
    } catch (error) {
      console.log('Accept request error:', error);
    }
  };

  // Decline a request => update request doc to "declined"
  const handleDeclineRequest = async (requestItem) => {
    try {
      const requestDocRef = doc(db, 'requests', requestItem.id);
      await updateDoc(requestDocRef, { status: 'declined' });
    } catch (error) {
      console.log('Decline request error:', error);
    }
  };

  // ---------------------------------------
  // 5. OPEN CHAT & LOAD MESSAGES
  // ---------------------------------------
  const handleSelectChat = async (chatItem) => {
    // chatItem might contain { threadId, name, image, ... }
    setSelectedChat(chatItem);

    // Listen to real-time messages for this thread
    // subcollection: threads/{threadId}/messages
    const messagesRef = collection(db, 'threads', chatItem.threadId, 'messages');
    const q = query(messagesRef, orderBy('createdAt', 'asc'));

    // unsubscribe any previous
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const loadedMessages = [];
      snapshot.forEach((docSnap) => {
        loadedMessages.push({ id: docSnap.id, ...docSnap.data() });
      });

      // Convert to local chat format
      // { id, sender: 'me'|'them', text, time }
      const formatted = loadedMessages.map((msg) => {
        const senderType = msg.senderId === currentUserId ? 'me' : 'them';
        let timeString = '';
        if (msg.createdAt?.toDate) {
          timeString = msg.createdAt.toDate().toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          });
        }
        return {
          id: msg.id,
          sender: senderType,
          text: msg.text,
          time: timeString,
        };
      });

      setChatData((prev) => ({
        ...prev,
        [chatItem.threadId]: formatted,
      }));
    });

    unsubscribeRef.current = unsubscribe;
  };

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, []);

  // ---------------------------------------
  // 6. SEND MESSAGE
  // ---------------------------------------
  const handleSendMessage = async () => {
    if (!inputText.trim() || !selectedChat?.threadId) return;
    const threadId = selectedChat.threadId;
    const textToSend = inputText.trim();

    try {
      // 1. Add a new doc to subcollection "threads/{threadId}/messages"
      await addDoc(collection(db, 'threads', threadId, 'messages'), {
        senderId: currentUserId,
        text: textToSend,
        createdAt: serverTimestamp(),
      });

      // 2. Update parent "threads/{threadId}" doc's lastMessage & lastTimestamp
      const threadDocRef = doc(db, 'threads', threadId);
      await updateDoc(threadDocRef, {
        lastMessage: textToSend,
        lastTimestamp: serverTimestamp(),
      });

      setInputText('');
    } catch (error) {
      console.log('Send message error:', error);
    }
  };

  // ---------------------------------------
  // 7. RENDER: MAIN LIST (Search, Close Friends, Requests, Messages)
  // ---------------------------------------
  const renderMainList = () => (
    <View style={styles.container}>
      <Text style={styles.screenTitle}>RaskhaSetu Chat</Text>

      {/* SEARCH BAR */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search users by name..."
          placeholderTextColor="#999"
          value={searchTerm}
          onChangeText={setSearchTerm}
        />
        <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
          <Text style={styles.searchButtonText}>Search</Text>
        </TouchableOpacity>
      </View>

      {/* SEARCH RESULTS */}
      {isSearching && <ActivityIndicator color="#333" style={{ marginBottom: 10 }} />}
      {searchResults.length > 0 && (
        <View style={{ marginBottom: 20 }}>
          <Text style={styles.sectionTitle}>Search Results</Text>
          <FlatList
            data={searchResults}
            horizontal
            keyExtractor={(item) => item.id}
            showsHorizontalScrollIndicator={false}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.requestCard}
                onPress={() => console.log('Open profile or request chat:', item.name)}
              >
                <Image source={{ uri: item.image }} style={styles.requestAvatar} />
                <Text style={styles.requestName}>{item.name}</Text>
              </TouchableOpacity>
            )}
          />
        </View>
      )}

      {/* CLOSE FRIENDS */}
      <Text style={styles.sectionTitle}>Close Friends</Text>
      {loadingCloseFriends ? (
        <ActivityIndicator color="#333" style={{ marginBottom: 10 }} />
      ) : closeFriends.length === 0 ? (
        <Text style={styles.noMessagesText}>No close friends found.</Text>
      ) : (
        <FlatList
          data={closeFriends}
          horizontal
          keyExtractor={(item) => item.id}
          showsHorizontalScrollIndicator={false}
          style={{ marginBottom: 20 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.requestCard}
              onPress={() => console.log('Close friend tapped:', item.name)}
            >
              <Image source={{ uri: item.image }} style={styles.requestAvatar} />
              <Text style={styles.requestName}>{item.name}</Text>
            </TouchableOpacity>
          )}
        />
      )}

      {/* REQUESTS */}
      {loadingRequests ? (
        <ActivityIndicator color="#333" style={{ marginBottom: 10 }} />
      ) : requests.length > 0 ? (
        <>
          <Text style={styles.sectionTitle}>Requests</Text>
          <FlatList
            data={requests}
            horizontal
            keyExtractor={(item) => item.id}
            showsHorizontalScrollIndicator={false}
            style={{ marginBottom: 20 }}
            renderItem={({ item }) => (
              <View style={styles.requestCard}>
                <Image source={{ uri: item.fromUserImage }} style={styles.requestAvatar} />
                <Text style={styles.requestName}>{item.fromUserName}</Text>
                <View style={styles.requestButtons}>
                  <TouchableOpacity
                    style={styles.acceptButton}
                    onPress={() => handleAcceptRequest(item)}
                  >
                    <Text style={styles.requestButtonText}>Accept</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.declineButton}
                    onPress={() => handleDeclineRequest(item)}
                  >
                    <Text style={styles.requestButtonText}>Decline</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          />
        </>
      ) : null}

      {/* MESSAGES (Active Chats) */}
      <Text style={styles.sectionTitle}>Messages</Text>
      {loadingMessages ? (
        <ActivityIndicator color="#333" />
      ) : messagesList.length === 0 ? (
        <Text style={styles.noMessagesText}>No active chats yet.</Text>
      ) : (
        <FlatList
          data={messagesList}
          keyExtractor={(item) => item.threadId}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            // Format lastTimestamp if it exists
            let dateStr = '';
            if (item.lastTimestamp?.toDate) {
              dateStr = item.lastTimestamp
                .toDate()
                .toLocaleDateString([], { month: 'short', day: 'numeric' });
            }

            return (
              <TouchableOpacity
                style={styles.messageItem}
                onPress={() => handleSelectChat(item)}
              >
                <Image source={{ uri: item.image }} style={styles.avatar} />
                <View style={{ marginLeft: 10, flex: 1 }}>
                  <Text style={styles.messageName}>{item.name}</Text>
                  <Text style={styles.messageText}>{item.lastMessage}</Text>
                </View>
                <Text style={styles.messageTime}>{dateStr}</Text>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </View>
  );

  // ---------------------------------------
  // 8. RENDER: CHAT DETAIL SCREEN
  // ---------------------------------------
  const renderChatDetailScreen = () => {
    // Grab messages from chatData for the thread
    const threadId = selectedChat?.threadId;
    const conversation = chatData[threadId] || [];

    return (
      <View style={styles.container}>
        {/* Header with "Back" button */}
        <View style={styles.chatHeader}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setSelectedChat(null)}
          >
            <Text style={styles.backButtonText}>{'<'} Back</Text>
          </TouchableOpacity>
          <Text style={styles.chatHeaderText}>{selectedChat?.name}</Text>
        </View>

        {/* Conversation Messages */}
        <FlatList
          data={conversation}
          keyExtractor={(item) => item.id}
          style={styles.chatList}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <View
              style={[
                styles.chatBubble,
                item.sender === 'me' ? styles.myMessage : styles.theirMessage,
              ]}
            >
              <Text style={styles.chatBubbleText}>{item.text}</Text>
              <Text style={styles.chatBubbleTime}>{item.time}</Text>
            </View>
          )}
        />

        {/* Input to send new message */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            placeholder="Type your message..."
            placeholderTextColor="#999"
            value={inputText}
            onChangeText={setInputText}
          />
          <TouchableOpacity style={styles.sendButton} onPress={handleSendMessage}>
            <Text style={styles.sendButtonText}>Send</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // ---------------------------------------
  // MAIN RETURN
  // ---------------------------------------
  return (
    <LinearGradient
      // Light pink gradient
      colors={['#FFC0CB', '#FFB6C1']}
      style={styles.gradientWrapper}
    >
      <SafeAreaView style={{ flex: 1 }}>
        {selectedChat ? renderChatDetailScreen() : renderMainList()}
      </SafeAreaView>
    </LinearGradient>
  );
};

export default InAppChatScreen;

// ---------------------------------------
// STYLES
// ---------------------------------------
const styles = StyleSheet.create({
  gradientWrapper: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 15,
    paddingTop: 10,
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
    color: '#333',
  },
  noMessagesText: {
    color: '#333',
    fontStyle: 'italic',
    marginBottom: 10,
  },

  // Search
  searchContainer: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#FFF',
    borderRadius: 8,
    paddingHorizontal: 10,
    marginRight: 5,
    color: '#333',
  },
  searchButton: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    paddingHorizontal: 15,
    justifyContent: 'center',
  },
  searchButtonText: {
    color: '#FF69B4',
    fontWeight: 'bold',
  },

  // Request Cards / Close Friends
  requestCard: {
    width: 120,
    backgroundColor: 'rgba(255,255,255,0.4)',
    borderRadius: 10,
    padding: 10,
    marginRight: 10,
    alignItems: 'center',
  },
  requestAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginBottom: 5,
    backgroundColor: '#FFF',
  },
  requestName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
    textAlign: 'center',
  },
  requestButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  acceptButton: {
    flex: 1,
    backgroundColor: '#6BFFB4',
    paddingVertical: 6,
    borderRadius: 6,
    marginRight: 5,
    alignItems: 'center',
  },
  declineButton: {
    flex: 1,
    backgroundColor: '#FF6B6B',
    paddingVertical: 6,
    borderRadius: 6,
    marginLeft: 5,
    alignItems: 'center',
  },
  requestButtonText: {
    color: '#333',
    fontWeight: 'bold',
  },

  // Messages
  messageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.5)',
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FFF',
  },
  messageName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  messageText: {
    fontSize: 14,
    color: '#666',
  },
  messageTime: {
    color: '#666',
    fontSize: 12,
    marginLeft: 'auto',
  },

  // Chat Detail
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.6)',
    paddingVertical: 15,
    borderRadius: 10,
    marginBottom: 10,
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    left: 15,
    padding: 5,
  },
  backButtonText: {
    color: '#333',
    fontWeight: '600',
    fontSize: 16,
  },
  chatHeaderText: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  chatList: {
    flex: 1,
    marginBottom: 10,
  },
  chatBubble: {
    maxWidth: '75%',
    padding: 10,
    borderRadius: 12,
    marginBottom: 10,
  },
  myMessage: {
    backgroundColor: '#FFF',
    alignSelf: 'flex-end',
  },
  theirMessage: {
    backgroundColor: 'rgba(255,255,255,0.4)',
    alignSelf: 'flex-start',
  },
  chatBubbleText: {
    fontSize: 14,
    color: '#333',
  },
  chatBubbleTime: {
    fontSize: 10,
    color: '#666',
    marginTop: 5,
    textAlign: 'right',
  },

  // Message Input
  inputContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderRadius: 25,
    alignItems: 'center',
    paddingHorizontal: 10,
    marginBottom: 20,
  },
  textInput: {
    flex: 1,
    padding: 10,
    color: '#333',
  },
  sendButton: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 15,
    marginLeft: 5,
  },
  sendButtonText: {
    fontWeight: 'bold',
    color: '#FF69B4',
  },
});
