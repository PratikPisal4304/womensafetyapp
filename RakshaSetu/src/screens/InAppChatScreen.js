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
  Keyboard,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import {
  collection,
  doc,
  onSnapshot,
  query,
  where,
  updateDoc,
  addDoc,
  getDocs,
  serverTimestamp,
  orderBy,
  limit,
} from 'firebase/firestore';

import { db } from '../../config/firebaseConfig';

// Replace these with your auth user's actual data
const CURRENT_USER_ID = 'CURRENT_USER_ID';
const CURRENT_USER_NAME = 'My Name'; // Replace with actual name
const CURRENT_USER_IMAGE = 'https://example.com/my-default.png'; // Replace with actual image URL

const InAppChatScreen = () => {
  // ----------------------------
  // STATES
  // ----------------------------
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [closeFriends, setCloseFriends] = useState([]);
  const [loadingCloseFriends, setLoadingCloseFriends] = useState(true);
  const [requests, setRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [messagesList, setMessagesList] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(true);
  const [chatData, setChatData] = useState({});
  const [selectedChat, setSelectedChat] = useState(null);
  const [inputText, setInputText] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [error, setError] = useState(null);

  // Refs
  const unsubscribeRef = useRef(null);
  const chatListRef = useRef(null);
  const searchTimeoutRef = useRef(null);
  
  const currentUserId = CURRENT_USER_ID;

  // ----------------------------
  // FETCH DATA ON MOUNT
  // ----------------------------
  useEffect(() => {
    // Close Friends listener
    const closeFriendsRef = collection(db, 'users', currentUserId, 'closeFriends');
    const unsubscribe = onSnapshot(
      closeFriendsRef,
      (snapshot) => {
        const friends = [];
        snapshot.forEach((docSnap) => {
          friends.push({ id: docSnap.id, ...docSnap.data() });
        });
        setCloseFriends(friends);
        setLoadingCloseFriends(false);
      },
      (err) => setError('Error fetching close friends')
    );
    return () => unsubscribe();
  }, [currentUserId]);

  useEffect(() => {
    // Requests listener
    const requestsRef = collection(db, 'requests');
    const q = query(
      requestsRef,
      where('toUserId', '==', currentUserId),
      where('status', '==', 'pending')
    );
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const reqs = [];
        snapshot.forEach((docSnap) => {
          reqs.push({ id: docSnap.id, ...docSnap.data() });
        });
        setRequests(reqs);
        setLoadingRequests(false);
      },
      (err) => setError('Error fetching requests')
    );
    return () => unsubscribe();
  }, [currentUserId]);

  useEffect(() => {
    // Messages (active chats) listener
    const messagesRef = collection(db, 'threads');
    const q = query(messagesRef, where('participants', 'array-contains', currentUserId));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const msgs = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          // Find the other user's data from the userData array
          const otherUser = data?.userData?.find((u) => u.id !== currentUserId);
          msgs.push({
            threadId: docSnap.id,
            ...otherUser,
            lastMessage: data.lastMessage || '',
            lastTimestamp: data.lastTimestamp || null,
          });
        });
        // Sort chats by lastTimestamp (descending)
        msgs.sort((a, b) => (b.lastTimestamp?.seconds || 0) - (a.lastTimestamp?.seconds || 0));
        setMessagesList(msgs);
        setLoadingMessages(false);
      },
      (err) => setError('Error fetching messages')
    );
    return () => unsubscribe();
  }, [currentUserId]);

  // ----------------------------
  // SEARCH LOGIC (Debounced)
  // ----------------------------
  const debouncedSearch = useCallback(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    searchTimeoutRef.current = setTimeout(async () => {
      if (!searchTerm.trim()) {
        setSearchResults([]);
        return;
      }
      setIsSearching(true);
      try {
        const usersRef = collection(db, 'users');
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
        setError('Error during search.');
      } finally {
        setIsSearching(false);
      }
    }, 500);
  }, [searchTerm]);

  useEffect(() => {
    debouncedSearch();
    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [searchTerm, debouncedSearch]);

  // ----------------------------
  // REQUEST HANDLERS
  // ----------------------------
  const handleAcceptRequest = async (requestItem) => {
    try {
      const requestDocRef = doc(db, 'requests', requestItem.id);
      await updateDoc(requestDocRef, { status: 'accepted' });
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
            name: CURRENT_USER_NAME,
            image: CURRENT_USER_IMAGE,
          },
        ],
      };
      await addDoc(collection(db, 'threads'), newThread);
    } catch (error) {
      console.log('Accept request error:', error);
      setError('Failed to accept request.');
    }
  };

  const handleDeclineRequest = async (requestItem) => {
    try {
      const requestDocRef = doc(db, 'requests', requestItem.id);
      await updateDoc(requestDocRef, { status: 'declined' });
    } catch (error) {
      console.log('Decline request error:', error);
      setError('Failed to decline request.');
    }
  };

  // ----------------------------
  // CHAT DETAIL & MESSAGES
  // ----------------------------
  const handleSelectChat = async (chatItem) => {
    setSelectedChat(chatItem);
    // Listen to real-time messages for this thread
    const messagesRef = collection(db, 'threads', chatItem.threadId, 'messages');
    const q = query(messagesRef, orderBy('createdAt', 'asc'));

    // Unsubscribe previous listener if exists
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
    }

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const loadedMessages = [];
        snapshot.forEach((docSnap) => {
          loadedMessages.push({ id: docSnap.id, ...docSnap.data() });
        });
        // Format messages for UI
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
        // Auto-scroll to bottom
        if (chatListRef.current) {
          chatListRef.current.scrollToEnd({ animated: true });
        }
      },
      (err) => setError('Error loading messages')
    );
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

  const handleSendMessage = async () => {
    if (!inputText.trim() || !selectedChat?.threadId) return;
    const threadId = selectedChat.threadId;
    const textToSend = inputText.trim();
    setSendingMessage(true);

    // Optimistically update UI
    const newMsg = {
      id: Date.now().toString(), // temporary id
      sender: 'me',
      text: textToSend,
      time: new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      }),
    };
    setChatData((prev) => {
      const existing = prev[threadId] || [];
      return { ...prev, [threadId]: [...existing, newMsg] };
    });
    setInputText('');
    Keyboard.dismiss();

    try {
      await addDoc(collection(db, 'threads', threadId, 'messages'), {
        senderId: currentUserId,
        text: textToSend,
        createdAt: serverTimestamp(),
      });
      const threadDocRef = doc(db, 'threads', threadId);
      await updateDoc(threadDocRef, {
        lastMessage: textToSend,
        lastTimestamp: serverTimestamp(),
      });
    } catch (error) {
      console.log('Send message error:', error);
      setError('Failed to send message.');
      Alert.alert('Error', 'Message failed to send.');
    } finally {
      setSendingMessage(false);
    }
  };

  // ----------------------------
  // PROFILE CLICK HANDLER (Search Results)
  // ----------------------------
  const handleProfileClick = async (profile) => {
    // Provide fallback defaults for profile values
    const profileName = profile.name || 'Anonymous';
    const profileImage =
      profile.image || 'https://example.com/default-profile.png';

    // Check if a thread already exists with this profile by comparing the other user's id.
    // (Assumes messagesList items include an id field corresponding to the other user's id)
    const existingThread = messagesList.find((thread) => thread.id === profile.id);
    if (existingThread) {
      // Open existing chat
      handleSelectChat(existingThread);
    } else {
      // Create a new thread with the profile and then open it
      try {
        const newThread = {
          participants: [currentUserId, profile.id],
          lastMessage: '',
          lastTimestamp: serverTimestamp(),
          userData: [
            {
              id: currentUserId,
              name: CURRENT_USER_NAME,
              image: CURRENT_USER_IMAGE,
            },
            {
              id: profile.id,
              name: profileName,
              image: profileImage,
            },
          ],
        };
        const threadRef = await addDoc(collection(db, 'threads'), newThread);
        const threadObj = {
          threadId: threadRef.id,
          id: profile.id,
          name: profileName,
          image: profileImage,
          lastMessage: '',
          lastTimestamp: null,
        };
        handleSelectChat(threadObj);
      } catch (error) {
        console.log('Error creating thread:', error);
        setError('Failed to create new chat thread.');
      }
    }
  };

  // ----------------------------
  // RENDER COMPONENTS
  // ----------------------------
  const renderMainList = () => (
    <View style={styles.container}>
      <Text style={styles.screenTitle}>RaskhaSetu Chat</Text>
      
      {error && <Text style={styles.errorText}>{error}</Text>}

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search users by name..."
          placeholderTextColor="#aaa"
          value={searchTerm}
          onChangeText={setSearchTerm}
        />
        <TouchableOpacity
          style={styles.searchButton}
          onPress={debouncedSearch}
          activeOpacity={0.8}
        >
          <Text style={styles.searchButtonText}>Search</Text>
        </TouchableOpacity>
      </View>

      {/* Search Results */}
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
                onPress={() => handleProfileClick(item)}
                activeOpacity={0.8}
              >
                <Image source={{ uri: item.image }} style={styles.requestAvatar} />
                <Text style={styles.requestName}>{item.name}</Text>
              </TouchableOpacity>
            )}
          />
        </View>
      )}

      {/* Close Friends */}
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
              activeOpacity={0.8}
            >
              <Image source={{ uri: item.image }} style={styles.requestAvatar} />
              <Text style={styles.requestName}>{item.name}</Text>
            </TouchableOpacity>
          )}
        />
      )}

      {/* Requests */}
      {loadingRequests ? (
        <ActivityIndicator color="#333" style={{ marginBottom: 10 }} />
      ) : requests.length > 0 && (
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
                    activeOpacity={0.8}
                  >
                    <Text style={styles.requestButtonText}>Accept</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.declineButton}
                    onPress={() => handleDeclineRequest(item)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.requestButtonText}>Decline</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          />
        </>
      )}

      {/* Messages (Active Chats) */}
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
          onRefresh={() => {
            setLoadingMessages(true);
          }}
          refreshing={loadingMessages}
          renderItem={({ item }) => {
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
                activeOpacity={0.8}
              >
                <Image source={{ uri: item.image }} style={styles.avatar} />
                <View style={styles.messageContent}>
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

  const renderChatDetailScreen = () => {
    const threadId = selectedChat?.threadId;
    const conversation = chatData[threadId] || [];

    return (
      <View style={styles.container}>
        <View style={styles.chatHeader}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setSelectedChat(null)}
            activeOpacity={0.8}
          >
            <Text style={styles.backButtonText}>{'<'} Back</Text>
          </TouchableOpacity>
          <Text style={styles.chatHeaderText}>{selectedChat?.name}</Text>
        </View>

        <FlatList
          ref={chatListRef}
          data={conversation}
          keyExtractor={(item) => item.id}
          style={styles.chatList}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => chatListRef.current.scrollToEnd({ animated: true })}
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

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            placeholder="Type your message..."
            placeholderTextColor="#aaa"
            value={inputText}
            onChangeText={setInputText}
            onSubmitEditing={handleSendMessage}
            returnKeyType="send"
          />
          <TouchableOpacity
            style={styles.sendButton}
            onPress={handleSendMessage}
            activeOpacity={0.8}
            disabled={sendingMessage}
          >
            {sendingMessage ? (
              <ActivityIndicator color="#FF69B4" />
            ) : (
              <Text style={styles.sendButtonText}>Send</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <LinearGradient colors={['#FFC0CB', '#FFB6C1']} style={styles.gradientWrapper}>
      <SafeAreaView style={{ flex: 1 }}>
        {selectedChat ? renderChatDetailScreen() : renderMainList()}
      </SafeAreaView>
    </LinearGradient>
  );
};

export default InAppChatScreen;

const styles = StyleSheet.create({
  gradientWrapper: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 15,
    backgroundColor: 'transparent',
  },
  screenTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
    textShadowColor: '#fff',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  errorText: {
    color: '#FF6B6B',
    textAlign: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 10,
    color: '#333',
  },
  noMessagesText: {
    color: '#555',
    fontStyle: 'italic',
    marginBottom: 10,
  },
  searchContainer: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginRight: 8,
    color: '#333',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
  },
  searchButton: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 15,
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
  },
  searchButtonText: {
    color: '#FF69B4',
    fontWeight: '600',
    fontSize: 16,
  },
  requestCard: {
    width: 130,
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderRadius: 15,
    padding: 12,
    marginRight: 12,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 3,
  },
  requestAvatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    marginBottom: 8,
    backgroundColor: '#fff',
  },
  requestName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  requestButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  acceptButton: {
    flex: 1,
    backgroundColor: '#C8FACC',
    paddingVertical: 6,
    borderRadius: 8,
    marginRight: 5,
    alignItems: 'center',
  },
  declineButton: {
    flex: 1,
    backgroundColor: '#FFC0C0',
    paddingVertical: 6,
    borderRadius: 8,
    marginLeft: 5,
    alignItems: 'center',
  },
  requestButtonText: {
    color: '#333',
    fontWeight: 'bold',
  },
  messageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.95)',
    padding: 15,
    borderRadius: 15,
    marginBottom: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 3,
  },
  avatar: {
    width: 55,
    height: 55,
    borderRadius: 28,
    backgroundColor: '#fff',
  },
  messageContent: {
    marginLeft: 15,
    flex: 1,
  },
  messageName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 3,
  },
  messageText: {
    fontSize: 15,
    color: '#666',
  },
  messageTime: {
    color: '#666',
    fontSize: 13,
    marginLeft: 'auto',
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingVertical: 18,
    borderRadius: 15,
    marginBottom: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 3,
  },
  backButton: {
    position: 'absolute',
    left: 20,
    padding: 8,
  },
  backButtonText: {
    color: '#333',
    fontWeight: '600',
    fontSize: 17,
  },
  chatHeaderText: {
    flex: 1,
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    textAlign: 'center',
  },
  chatList: {
    flex: 1,
    marginBottom: 15,
  },
  chatBubble: {
    maxWidth: '75%',
    padding: 12,
    borderRadius: 15,
    marginBottom: 10,
  },
  myMessage: {
    backgroundColor: '#fff',
    alignSelf: 'flex-end',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
  },
  theirMessage: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignSelf: 'flex-start',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
  },
  chatBubbleText: {
    fontSize: 16,
    color: '#333',
  },
  chatBubbleTime: {
    fontSize: 11,
    color: '#666',
    marginTop: 5,
    textAlign: 'right',
  },
  inputContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 30,
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginBottom: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 3,
  },
  textInput: {
    flex: 1,
    padding: 10,
    color: '#333',
    fontSize: 16,
  },
  sendButton: {
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 15,
    marginLeft: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
  },
  sendButtonText: {
    fontWeight: '600',
    color: '#FF69B4',
    fontSize: 16,
  },
});
