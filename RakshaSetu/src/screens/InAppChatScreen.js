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
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Linking,
  Modal,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
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
  deleteDoc,
} from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getAuth } from 'firebase/auth';
import { Ionicons } from '@expo/vector-icons';
import { db } from '../../config/firebaseConfig';

// Initialize Firebase Storage and Auth
const storage = getStorage();
const auth = getAuth();

// Helper function to check if a string is a URL
const isURL = (text) => {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  return urlRegex.test(text);
};

// Render text with clickable URLs.
const renderMessageText = (text) => (
  <Text style={styles.chatBubbleText}>
    {text.split(' ').map((word, index) =>
      isURL(word) ? (
        <Text
          key={index}
          style={{ color: 'blue', textDecorationLine: 'underline' }}
          onPress={() => Linking.openURL(word)}
        >
          {word}{' '}
        </Text>
      ) : (
        word + ' '
      )
    )}
  </Text>
);

// ChatBubble component with fade-in animation.
const ChatBubble = ({ item, onLongPress, onMediaPress }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, []);
  return (
    <Animated.View style={{ opacity: fadeAnim }}>
      <TouchableOpacity
        onLongPress={onLongPress}
        activeOpacity={0.8}
        style={[
          styles.chatBubble,
          item.sender === 'me' ? styles.myMessage : styles.theirMessage,
        ]}
      >
        {item.sender === 'them' && <Text style={styles.senderName}>{item.senderName}</Text>}
        {item.media ? (
          <TouchableOpacity onPress={() => onMediaPress(item.media)}>
            <Image source={{ uri: item.media }} style={styles.mediaImage} />
          </TouchableOpacity>
        ) : (
          renderMessageText(item.text)
        )}
        <View style={styles.bubbleFooter}>
          <Text style={styles.chatBubbleTime}>{item.time}</Text>
          {item.sender === 'me' && <Text style={styles.readReceipt}>{item.read ? 'Read' : 'Sent'}</Text>}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const InAppChatScreen = () => {
  // ----------------------------
  // STATES
  // ----------------------------
  const [user, setUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [requests, setRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [messagesList, setMessagesList] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(true);
  const [chatData, setChatData] = useState({});
  const [selectedChat, setSelectedChat] = useState(null);
  const [inputText, setInputText] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [error, setError] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [typingDots, setTypingDots] = useState('');
  const [previewImage, setPreviewImage] = useState(null);
  const [deleteMessage, setDeleteMessage] = useState(null);
  const [deleteChatModalVisible, setDeleteChatModalVisible] = useState(false);

  // ----------------------------
  // REFS
  // ----------------------------
  const unsubscribeRef = useRef(null);
  const chatListRef = useRef(null);
  const searchTimeoutRef = useRef(null);
  const errorAnim = useRef(new Animated.Value(0)).current;

  // ----------------------------
  // GET CURRENT USER FROM AUTH
  // ----------------------------
  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged((currentUser) => {
      if (currentUser) {
        setUser(currentUser);
      } else {
        setError('User not authenticated');
        Animated.timing(errorAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
      }
    });
    return () => unsubscribeAuth();
  }, []);

  const currentUserId = user?.uid;
  const currentUserName = user?.uid || 'My Name';
  const currentUserImage = user?.photoURL || 'https://example.com/my-default.png';

  // ----------------------------
  // FETCH REQUESTS & MESSAGES
  // ----------------------------
  useEffect(() => {
    if (!currentUserId) return;
    const requestsRef = collection(db, 'requests');
    const q = query(requestsRef, where('toUserId', '==', currentUserId), where('status', '==', 'pending'));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const reqs = [];
        snapshot.forEach((docSnap) => reqs.push({ id: docSnap.id, ...docSnap.data() }));
        setRequests(reqs);
        setLoadingRequests(false);
      },
      (err) => setError('Error fetching requests')
    );
    return () => unsubscribe();
  }, [currentUserId]);

  useEffect(() => {
    if (!currentUserId) return;
    const messagesRef = collection(db, 'threads');
    const q = query(messagesRef, where('participants', 'array-contains', currentUserId));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const msgs = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          const otherUser = data?.userData?.find((u) => u.id !== currentUserId);
          msgs.push({
            threadId: docSnap.id,
            ...otherUser,
            lastMessage: data.lastMessage || '',
            lastTimestamp: data.lastTimestamp || null,
          });
        });
        msgs.sort((a, b) => (b.lastTimestamp?.seconds || 0) - (a.lastTimestamp?.seconds || 0));
        setMessagesList(msgs);
        setLoadingMessages(false);
      },
      (err) => setError('Error fetching messages')
    );
    return () => unsubscribe();
  }, [currentUserId]);

  // ----------------------------
  // DEBOUNCED SEARCH LOGIC
  // ----------------------------
  const debouncedSearch = useCallback(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
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
        snap.forEach((docSnap) => results.push({ id: docSnap.id, ...docSnap.data() }));
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
      await updateDoc(doc(db, 'requests', requestItem.id), { status: 'accepted' });
      const newThread = {
        participants: [requestItem.fromUserId, requestItem.toUserId],
        lastMessage: '',
        lastTimestamp: serverTimestamp(),
        userData: [
          { id: requestItem.fromUserId, name: requestItem.fromUserName, image: requestItem.fromUserImage },
          { id: requestItem.toUserId, name: currentUserName, image: currentUserImage },
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
      await updateDoc(doc(db, 'requests', requestItem.id), { status: 'declined' });
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
    setInputText('');
    setIsTyping(false);
    const messagesRef = collection(db, 'threads', chatItem.threadId, 'messages');
    const q = query(messagesRef, orderBy('createdAt', 'asc'));
    if (unsubscribeRef.current) unsubscribeRef.current();
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const loadedMessages = [];
        snapshot.forEach((docSnap) => loadedMessages.push({ id: docSnap.id, ...docSnap.data() }));
        const formatted = loadedMessages.map((msg) => {
          const senderType = msg.senderId === currentUserId ? 'me' : 'them';
          let timeString = '';
          if (msg.createdAt?.toDate) {
            timeString = msg.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          }
          return {
            id: msg.id,
            sender: senderType,
            senderName: senderType === 'them' ? chatItem.name : currentUserName,
            text: msg.text || '',
            media: msg.media || null,
            time: timeString,
            read: msg.read || false,
          };
        });
        setChatData((prev) => ({ ...prev, [chatItem.threadId]: formatted }));
        if (chatListRef.current) chatListRef.current.scrollToEnd({ animated: true });
      },
      (err) => setError('Error loading messages')
    );
    unsubscribeRef.current = unsubscribe;
  };

  useEffect(() => {
    return () => {
      if (unsubscribeRef.current) unsubscribeRef.current();
    };
  }, []);

  // ----------------------------
  // UPLOAD MEDIA HELPER
  // ----------------------------
  const uploadImageAsync = async (uri, path) => {
    const response = await fetch(uri);
    const blob = await response.blob();
    const storageRef = ref(storage, path);
    await uploadBytes(storageRef, blob);
    return await getDownloadURL(storageRef);
  };

  // ----------------------------
  // MESSAGE ACTIONS
  // ----------------------------
  const handleSendMessage = async () => {
    if (!inputText.trim() || !selectedChat?.threadId) return;
    const threadId = selectedChat.threadId;
    const textToSend = inputText.trim();
    setSendingMessage(true);
    setIsTyping(false);
    const newMsg = {
      id: Date.now().toString(),
      sender: 'me',
      senderName: currentUserName,
      text: textToSend,
      media: null,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      read: false,
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
        media: null,
        createdAt: serverTimestamp(),
        read: false,
      });
      await updateDoc(doc(db, 'threads', threadId), {
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

  const handleSendMedia = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert('Permission required', 'Permission to access media library is required!');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });
    if (result.canceled || result.cancelled) return;
    const localUri = result.assets ? result.assets[0].uri : result.uri;
    if (!localUri || !selectedChat?.threadId) return;
    setSendingMessage(true);
    const threadId = selectedChat.threadId;
    try {
      const filePath = `messages/${currentUserId}/${Date.now()}.jpg`;
      const downloadURL = await uploadImageAsync(localUri, filePath);
      const newMsg = {
        id: Date.now().toString(),
        sender: 'me',
        senderName: currentUserName,
        text: '',
        media: downloadURL,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        read: false,
      };
      setChatData((prev) => {
        const existing = prev[threadId] || [];
        return { ...prev, [threadId]: [...existing, newMsg] };
      });
      await addDoc(collection(db, 'threads', threadId, 'messages'), {
        senderId: currentUserId,
        text: '',
        media: downloadURL,
        createdAt: serverTimestamp(),
        read: false,
      });
      await updateDoc(doc(db, 'threads', threadId), {
        lastMessage: '[Media]',
        lastTimestamp: serverTimestamp(),
      });
    } catch (error) {
      console.log('Send media error:', error);
      setError('Failed to send media.');
      Alert.alert('Error', 'Media message failed to send.');
    } finally {
      setSendingMessage(false);
    }
  };

  const handleSendLocation = async () => {
    if (!selectedChat?.threadId) return;
    setSendingMessage(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Permission to access location is required!');
        setSendingMessage(false);
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Highest });
      const { latitude, longitude } = loc.coords;
      const message = `My current location: https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
      await addDoc(collection(db, 'threads', selectedChat.threadId, 'messages'), {
        senderId: currentUserId,
        text: message,
        media: null,
        createdAt: serverTimestamp(),
        read: false,
      });
      await updateDoc(doc(db, 'threads', selectedChat.threadId), {
        lastMessage: message,
        lastTimestamp: serverTimestamp(),
      });
      const newMsg = {
        id: Date.now().toString(),
        sender: 'me',
        senderName: currentUserName,
        text: message,
        media: null,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        read: false,
      };
      setChatData((prev) => {
        const existing = prev[selectedChat.threadId] || [];
        return { ...prev, [selectedChat.threadId]: [...existing, newMsg] };
      });
    } catch (error) {
      console.log('Send location error:', error);
      setError('Failed to send location.');
      Alert.alert('Error', 'Location message failed to send.');
    } finally {
      setSendingMessage(false);
    }
  };

  // ----------------------------
  // DELETE CONFIRMATION FOR INDIVIDUAL MESSAGES
  // ----------------------------
  const handleConfirmDeleteMessage = async () => {
    if (!deleteMessage || !selectedChat?.threadId) return;
    try {
      await deleteDoc(doc(db, 'threads', selectedChat.threadId, 'messages', deleteMessage.id));
      setChatData((prev) => {
        const updated = prev[selectedChat.threadId].filter((msg) => msg.id !== deleteMessage.id);
        return { ...prev, [selectedChat.threadId]: updated };
      });
    } catch (error) {
      console.log('Delete message error:', error);
      Alert.alert('Error', 'Unable to delete message.');
    } finally {
      setDeleteMessage(null);
    }
  };

  const handleDeleteMessagePress = (msg) => {
    if (msg.sender === 'me') setDeleteMessage(msg);
  };

  // ----------------------------
  // DELETE ENTIRE CHAT (Thread)
  // ----------------------------
  const handleConfirmDeleteChat = async () => {
    if (!selectedChat?.threadId) return;
    try {
      await deleteDoc(doc(db, 'threads', selectedChat.threadId));
      setSelectedChat(null);
      setDeleteChatModalVisible(false);
    } catch (error) {
      console.log('Delete chat error:', error);
      Alert.alert('Error', 'Unable to delete chat.');
    }
  };

  // ----------------------------
  // PROFILE CLICK HANDLER (Search Results)
  // ----------------------------
  const handleProfileClick = async (profile) => {
    const profileName = profile.name || 'Anonymous';
    const profileImage = profile.image || 'https://example.com/default-profile.png';
    const existingThread = messagesList.find((thread) => thread.id === profile.id);
    if (existingThread) {
      handleSelectChat(existingThread);
    } else {
      try {
        const newThread = {
          participants: [currentUserId, profile.id],
          lastMessage: '',
          lastTimestamp: serverTimestamp(),
          userData: [
            { id: currentUserId, name: currentUserName, image: currentUserImage },
            { id: profile.id, name: profileName, image: profileImage },
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
  // BACK BUTTON HANDLER
  // ----------------------------
  const handleBack = () => {
    if (inputText.trim().length > 0) {
      Alert.alert(
        'Discard Message?',
        'You have an unsent message. Are you sure you want to leave this chat?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Discard',
            style: 'destructive',
            onPress: () => {
              setInputText('');
              setIsTyping(false);
              setSelectedChat(null);
            },
          },
        ]
      );
    } else {
      setSelectedChat(null);
    }
  };

  // ----------------------------
  // TYPING INDICATOR ANIMATION
  // ----------------------------
  useEffect(() => {
    let interval;
    if (isTyping) {
      interval = setInterval(() => {
        setTypingDots((prev) => (prev.length >= 3 ? '' : prev + '.'));
      }, 500);
    } else {
      setTypingDots('');
    }
    return () => clearInterval(interval);
  }, [isTyping]);

  // ----------------------------
  // RENDER COMPONENTS
  // ----------------------------
  const renderMainList = () => (
    <View style={styles.container}>
      <Text style={styles.screenTitle}>RaskhaSetu Chat</Text>
      {error && <Animated.Text style={[styles.errorText, { opacity: errorAnim }]}>{error}</Animated.Text>}
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search users by name..."
          placeholderTextColor="#aaa"
          value={searchTerm}
          onChangeText={setSearchTerm}
        />
        <TouchableOpacity style={styles.searchButton} onPress={debouncedSearch} activeOpacity={0.8}>
          <Ionicons name="search" size={20} color="#FF69B4" />
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
              <TouchableOpacity style={styles.requestCard} onPress={() => handleProfileClick(item)} activeOpacity={0.8}>
                <Image source={{ uri: item.image }} style={styles.requestAvatar} />
                <Text style={styles.requestName}>{item.name}</Text>
              </TouchableOpacity>
            )}
          />
        </View>
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
                  <TouchableOpacity style={styles.acceptButton} onPress={() => handleAcceptRequest(item)} activeOpacity={0.8}>
                    <Ionicons name="checkmark-circle" size={18} color="#333" />
                    <Text style={styles.requestButtonText}>Accept</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.declineButton} onPress={() => handleDeclineRequest(item)} activeOpacity={0.8}>
                    <Ionicons name="close-circle" size={18} color="#333" />
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
          refreshing={loadingMessages}
          onRefresh={() => setLoadingMessages(true)}
          renderItem={({ item }) => {
            let dateStr = '';
            if (item.lastTimestamp?.toDate) {
              dateStr = item.lastTimestamp.toDate().toLocaleDateString([], { month: 'short', day: 'numeric' });
            }
            return (
              <TouchableOpacity
                style={styles.chatListItem}
                onPress={() => handleSelectChat(item)}
                activeOpacity={0.8}
              >
                <View style={styles.avatarContainer}>
                  <Image source={{ uri: item.image }} style={styles.chatAvatar} />
                  {item.unread && (
                    <View style={styles.unreadBadge}>
                      <Text style={styles.unreadBadgeText}>{item.unreadCount || 'New'}</Text>
                    </View>
                  )}
                </View>
                <View style={styles.chatInfo}>
                  <View style={styles.chatHeaderRow}>
                    <Text style={styles.chatName}>{item.name}</Text>
                    <Text style={styles.chatTime}>{dateStr}</Text>
                  </View>
                  <Text style={styles.chatLastMessage} numberOfLines={1}>
                    {item.lastMessage}
                  </Text>
                </View>
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
          <TouchableOpacity style={styles.backButton} onPress={handleBack} activeOpacity={0.8}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.chatHeaderText}>{selectedChat?.name}</Text>
          <TouchableOpacity style={styles.deleteChatButton} onPress={() => setDeleteChatModalVisible(true)} activeOpacity={0.8}>
            <Ionicons name="trash" size={24} color="#FF3B30" />
          </TouchableOpacity>
        </View>
        <FlatList
          ref={chatListRef}
          data={conversation}
          keyExtractor={(item) => item.id}
          style={styles.chatList}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => chatListRef.current.scrollToEnd({ animated: true })}
          renderItem={({ item }) => (
            <ChatBubble
              item={item}
              onLongPress={() => handleDeleteMessagePress(item)}
              onMediaPress={(uri) => setPreviewImage(uri)}
            />
          )}
        />
        {isTyping && (
          <View style={styles.typingIndicator}>
            <Text style={styles.typingText}>Typing{typingDots}</Text>
          </View>
        )}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            placeholder="Type your message..."
            placeholderTextColor="#aaa"
            value={inputText}
            onChangeText={(text) => {
              setInputText(text);
              setIsTyping(text.length > 0);
            }}
            onSubmitEditing={handleSendMessage}
            returnKeyType="send"
          />
          <TouchableOpacity style={styles.locationButton} onPress={handleSendLocation} activeOpacity={0.8}>
            <Ionicons name="location" size={20} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.mediaButton} onPress={handleSendMedia} activeOpacity={0.8}>
            <Ionicons name="image" size={20} color="#FF69B4" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.sendButton} onPress={handleSendMessage} activeOpacity={0.8} disabled={sendingMessage}>
            {sendingMessage ? (
              <ActivityIndicator color="#FF69B4" />
            ) : (
              <>
                <Ionicons name="send" size={20} color="#FF69B4" />
                <Text style={styles.sendButtonText}>Send</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <LinearGradient colors={['#FFC0CB', '#FFB6C1']} style={styles.gradientWrapper}>
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            {selectedChat ? renderChatDetailScreen() : renderMainList()}
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </SafeAreaView>
      <Modal visible={!!previewImage} transparent={true} animationType="fade">
        <View style={styles.modalContainer}>
          <TouchableOpacity style={styles.modalClose} onPress={() => setPreviewImage(null)}>
            <Ionicons name="close" size={30} color="#fff" />
          </TouchableOpacity>
          <Image source={{ uri: previewImage }} style={styles.fullScreenImage} resizeMode="contain" />
        </View>
      </Modal>
      <Modal visible={!!deleteMessage} transparent={true} animationType="fade">
        <View style={styles.modalContainer}>
          <View style={styles.deleteModal}>
            <Text style={styles.deleteModalTitle}>Delete Message</Text>
            <Text style={styles.deleteModalText}>Are you sure you want to delete this message?</Text>
            <View style={styles.deleteModalButtons}>
              <TouchableOpacity style={styles.deleteModalButton} onPress={() => setDeleteMessage(null)}>
                <Text style={styles.deleteModalCancel}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.deleteModalButton} onPress={handleConfirmDeleteMessage}>
                <Text style={styles.deleteModalConfirm}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      <Modal visible={deleteChatModalVisible} transparent={true} animationType="fade">
        <View style={styles.modalContainer}>
          <View style={styles.deleteModal}>
            <Text style={styles.deleteModalTitle}>Delete Chat</Text>
            <Text style={styles.deleteModalText}>Are you sure you want to delete this chat?</Text>
            <View style={styles.deleteModalButtons}>
              <TouchableOpacity style={styles.deleteModalButton} onPress={() => setDeleteChatModalVisible(false)}>
                <Text style={styles.deleteModalCancel}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.deleteModalButton} onPress={handleConfirmDeleteChat}>
                <Text style={styles.deleteModalConfirm}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
};

export default InAppChatScreen;

const styles = StyleSheet.create({
  gradientWrapper: { flex: 1 },
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
  errorText: { color: '#FF6B6B', textAlign: 'center', marginBottom: 10 },
  sectionTitle: { fontSize: 20, fontWeight: '600', marginBottom: 10, color: '#333' },
  noMessagesText: { color: '#555', fontStyle: 'italic', marginBottom: 10 },
  searchContainer: { flexDirection: 'row', marginBottom: 15 },
  searchInput: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginRight: 8,
    color: '#333',
    elevation: 2,
  },
  searchButton: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
  },
  searchButtonText: { color: '#FF69B4', fontWeight: '600', fontSize: 16, marginLeft: 5 },
  requestCard: {
    width: 130,
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderRadius: 15,
    padding: 12,
    marginRight: 12,
    alignItems: 'center',
    elevation: 3,
  },
  requestAvatar: { width: 70, height: 70, borderRadius: 35, marginBottom: 8, backgroundColor: '#fff' },
  requestName: { fontSize: 15, fontWeight: '600', color: '#333', marginBottom: 8, textAlign: 'center' },
  requestButtons: { flexDirection: 'row', justifyContent: 'space-between', width: '100%' },
  acceptButton: { flex: 1, backgroundColor: '#C8FACC', paddingVertical: 6, borderRadius: 8, marginRight: 5, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' },
  declineButton: { flex: 1, backgroundColor: '#FFC0C0', paddingVertical: 6, borderRadius: 8, marginLeft: 5, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' },
  requestButtonText: { color: '#333', fontWeight: 'bold', marginLeft: 3 },
  // Enhanced Chat List Styles
  chatListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 15,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  avatarContainer: {
    position: 'relative',
  },
  chatAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: '#FF69B4',
  },
  unreadBadge: {
    position: 'absolute',
    right: -5,
    top: -5,
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  unreadBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  chatInfo: {
    flex: 1,
    marginLeft: 15,
  },
  chatHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  chatName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  chatTime: {
    fontSize: 14,
    color: '#666',
  },
  chatLastMessage: {
    fontSize: 16,
    color: '#555',
    marginTop: 4,
  },
  // Chat Detail Screen Styles
  chatHeader: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.9)', paddingVertical: 18, borderRadius: 15, marginBottom: 12, elevation: 3, justifyContent: 'center' },
  backButton: { position: 'absolute', left: 20, padding: 8, zIndex: 1 },
  backButtonText: { color: '#333', fontWeight: '600', fontSize: 17 },
  chatHeaderText: { flex: 1, fontSize: 20, fontWeight: '700', color: '#333', textAlign: 'center' },
  deleteChatButton: { position: 'absolute', right: 20, padding: 8, zIndex: 1 },
  chatList: { flex: 1, marginBottom: 15 },
  chatBubble: { maxWidth: '75%', padding: 12, borderRadius: 15, marginBottom: 10 },
  myMessage: { backgroundColor: '#fff', alignSelf: 'flex-end', elevation: 2 },
  theirMessage: { backgroundColor: 'rgba(255,255,255,0.9)', alignSelf: 'flex-start', elevation: 2 },
  chatBubbleText: { fontSize: 16, color: '#333' },
  senderName: { fontSize: 13, fontWeight: 'bold', marginBottom: 3, color: '#555' },
  bubbleFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 5 },
  chatBubbleTime: { fontSize: 11, color: '#666' },
  readReceipt: { fontSize: 11, color: '#FF69B4' },
  inputContainer: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: 30, alignItems: 'center', paddingHorizontal: 15, paddingVertical: 8, marginBottom: 20, elevation: 3 },
  textInput: { flex: 1, paddingVertical: 0, paddingHorizontal: 10, color: '#333', fontSize: 16 },
  locationButton: { backgroundColor: '#007AFF', borderRadius: 20, padding: 8, marginLeft: 5, elevation: 2 },
  mediaButton: { backgroundColor: '#fff', borderRadius: 20, padding: 8, marginLeft: 5, elevation: 2 },
  sendButton: { backgroundColor: '#fff', borderRadius: 20, padding: 8, marginLeft: 5, elevation: 2, flexDirection: 'row', alignItems: 'center' },
  sendButtonText: { fontWeight: '600', color: '#FF69B4', fontSize: 16, marginLeft: 5 },
  typingIndicator: { alignItems: 'center', marginVertical: 5 },
  typingText: { fontStyle: 'italic', color: '#666', fontSize: 16 },
  mediaImage: { width: 200, height: 200, borderRadius: 10, marginBottom: 5 },
  modalContainer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center' },
  modalClose: { position: 'absolute', top: 40, right: 20 },
  fullScreenImage: { width: '90%', height: '70%' },
  deleteModal: {
    width: '80%',
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
  },
  deleteModalTitle: { fontSize: 20, fontWeight: '700', marginBottom: 10, color: '#333' },
  deleteModalText: { fontSize: 16, color: '#555', marginBottom: 20, textAlign: 'center' },
  deleteModalButtons: { flexDirection: 'row', justifyContent: 'space-around', width: '100%' },
  deleteModalButton: { padding: 10 },
  deleteModalCancel: { color: '#007AFF', fontSize: 16 },
  deleteModalConfirm: { color: '#FF3B30', fontSize: 16, fontWeight: '600' },
});
