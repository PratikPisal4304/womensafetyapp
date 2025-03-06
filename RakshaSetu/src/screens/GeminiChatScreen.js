import { OPENAI_API_KEY } from '@env'; // Import API key from .env
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Clipboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

const PINK = '#ff5f96';
const AI_BUBBLE = '#f8f8f8';
const USER_BUBBLE = PINK;

const OPENAI_URL = "https://api.openai.com/v1/chat/completions";

export default function GeminiChatScreen({ navigation }) {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [showIntroduction, setShowIntroduction] = useState(true);
  const [previousChats, setPreviousChats] = useState([]);
  const [showChatHistory, setShowChatHistory] = useState(false);
  
  const scrollViewRef = useRef();
  const inputRef = useRef();
  const dotAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;

  // Load settings and chat history
  useEffect(() => {
    const loadData = async () => {
      try {
        const savedMessages = await AsyncStorage.getItem('chatMessages');
        if (savedMessages) {
          const parsedMessages = JSON.parse(savedMessages);
          setMessages(parsedMessages.map(msg => ({
            ...msg,
            timestamp: msg.timestamp ? new Date(msg.timestamp) : new Date(),
          })));
        } else {
          // If no messages, show introduction
          addWelcomeMessage();
        }
        
        // Load previous chats
        const savedChats = await AsyncStorage.getItem('previousLegalChats');
        if (savedChats) {
          setPreviousChats(JSON.parse(savedChats));
        }
      } catch (error) {
        console.error('Failed to load chat history:', error);
      }
    };

    loadData();
  }, []);
  
  // Add welcome message if needed
  const addWelcomeMessage = () => {
    if (showIntroduction && messages.length === 0) {
      const welcomeMessage = {
        text: "Welcome to Legal Assistant! I can help you understand legal concepts, provide information about laws, and guide you through legal issues. What legal question can I assist you with today?",
        isUser: false,
        timestamp: new Date().toISOString(),
        isIntroduction: true,
      };
      setMessages([welcomeMessage]);
    }
  };

  // Save chat history to AsyncStorage whenever messages change
  useEffect(() => {
    const saveData = async () => {
      try {
        await AsyncStorage.setItem('chatMessages', JSON.stringify(messages));
      } catch (error) {
        console.error('Failed to save chat history:', error);
      }
    };

    if (messages.length > 0) {
      saveData();
    }
  }, [messages, darkMode, showIntroduction]);

  // Animated loading dots
  useEffect(() => {
    if (isLoading) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(dotAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(dotAnim, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      dotAnim.setValue(0);
    }
  }, [isLoading]);
  
  // Fade in/out effect for new messages
  const fadeIn = () => {
    fadeAnim.setValue(0);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  // Call OpenAI API for legal advice
  const getLegalAdvice = async (userMessage, messageHistory = []) => {
    try {
      // Prepare context from previous messages
      const contextMessages = messageHistory.map(msg => ({
        role: msg.isUser ? 'user' : 'assistant',
        content: msg.text
      }));
      
      const response = await fetch(OPENAI_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo', // or 'gpt-4' if available
          messages: [
            { 
              role: 'system', 
              content: 'You are a legal assistant. Your role is to ask the user to specify their legal problem and then provide relevant laws and IPC sections. Always respond in a professional and concise manner.' 
            },
            { role: 'user', content: userMessage },
          ],
          temperature: 0.7,
        }),
      });

      const data = await response.json();
      if (data.error) {
        console.error('API error:', data.error);
        return `I'm sorry, I encountered an error: ${data.error.message}. Please try again later.`;
      }
      return data.choices?.[0]?.message?.content || 'Sorry, I am unable to provide legal advice at the moment.';
    } catch (error) {
      console.error('Error calling OpenAI API:', error);
      return 'Sorry, I am unable to provide legal advice at the moment.';
    }
  };

  const handleSend = async () => {
    if (!inputText.trim() || isLoading) return;

    // Haptic feedback
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const userMessage = {
      text: inputText.trim(),
      isUser: true,
      timestamp: new Date().toISOString(),
    };

    try {
      setMessages((prev) => [...prev, userMessage]);
      setInputText('');

      setIsLoading(true);
      
      // Simulate typing indicator
      setIsTyping(true);
      
      // Get context from previous messages (limit to last 10 for context)
      const context = [...messages].slice(-10);
      
      const aiResponseText = await getLegalAdvice(inputText, context);
      
      // Simulate typing delay for more natural feel
      await new Promise(resolve => setTimeout(resolve, 800));
      setIsTyping(false);
      
      const aiResponse = {
        text: aiResponseText,
        isUser: false,
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, aiResponse]);
      fadeIn();
    } catch (error) {
      alert('Failed to send message');
    } finally {
      setIsLoading(false);
    }
  };

  const renderDots = () => {
    const dotPosition = dotAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 10],
    });

    return (
      <View style={styles.loadingDots}>
        {[0, 1, 2].map((i) => (
          <Animated.View
            key={i}
            style={[
              styles.dot,
              {
                transform: [{
                  translateY: i === 1 ? dotPosition : -dotPosition
                }]
              }
            ]}
          />
        ))}
      </View>
    );
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    const now = new Date();
    const diff = now - timestamp;
    
    if (diff < 60000) return 'Just now';
    return timestamp.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
    return date.toLocaleDateString();
  };
  
  // Message actions
  const handleLongPress = (message, index) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedMessage({...message, index});
    setShowOptions(true);
  };
  
  const handleCopy = async () => {
    if (selectedMessage) {
      // Using React Native's built-in Clipboard API instead of Expo's
      Clipboard.setString(selectedMessage.text);
      Alert.alert('Copied', 'Message copied to clipboard');
      setShowOptions(false);
    }
  };
  
  const handleDelete = () => {
    if (selectedMessage) {
      Alert.alert(
        'Delete Message',
        'Are you sure you want to delete this message?',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Delete', 
            style: 'destructive',
            onPress: () => {
              setMessages(prev => prev.filter((_, i) => i !== selectedMessage.index));
              setShowOptions(false);
            }
          }
        ]
      );
    }
  };
  
  const handleTextToSpeech = () => {
    if (selectedMessage && !isSpeaking) {
      setIsSpeaking(true);
      Speech.speak(selectedMessage.text, {
        language: 'en',
        pitch: 1,
        rate: 0.9,
        onDone: () => setIsSpeaking(false),
        onError: () => {
          setIsSpeaking(false);
          Alert.alert('Error', 'Failed to play text-to-speech');
        }
      });
    } else if (isSpeaking) {
      Speech.stop();
      setIsSpeaking(false);
    }
    setShowOptions(false);
  };
  
  // Clear all messages
  const handleClearChat = () => {
    Alert.alert(
      'Clear Chat',
      'Are you sure you want to clear all messages? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Clear', 
          style: 'destructive',
          onPress: async () => {
            // Save current chat to history if it has user messages
            if (messages.some(msg => msg.isUser)) {
              try {
                const chatTitle = messages.find(msg => msg.isUser)?.text || 'Legal Chat';
                const newChat = {
                  id: Date.now().toString(),
                  title: chatTitle.substring(0, 30) + (chatTitle.length > 30 ? '...' : ''),
                  messages: messages,
                  timestamp: new Date().toISOString()
                };
                
                const updatedChats = [newChat, ...previousChats].slice(0, 10); // Keep only last 10 chats
                setPreviousChats(updatedChats);
                await AsyncStorage.setItem('previousLegalChats', JSON.stringify(updatedChats));
              } catch (error) {
                console.error('Failed to save chat history:', error);
              }
            }
            
            setMessages([]);
            addWelcomeMessage();
          }
        }
      ]
    );
  };
  
  // Load a previous chat
  const handleLoadChat = (chat) => {
    setMessages(chat.messages);
    setShowChatHistory(false);
  };

  // Toggle dark mode
  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  // Theme styles based on dark mode
  const theme = darkMode ? {
    background: '#1a1a2e',
    text: '#ffffff',
    lightText: '#aaaaaa',
    card: '#252542',
    border: '#333355',
    aiBackground: '#252542',
    statusBar: 'light',
  } : {
    background: THEME.background,
    text: THEME.text,
    lightText: THEME.lightText,
    card: '#ffffff',
    border: '#eeeeee',
    aiBackground: THEME.aiBackground,
    statusBar: 'dark',
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar style={theme.statusBar} />
      
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerIcon}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        
        <Text style={[styles.headerTitle, { color: theme.text }]}>Legal Assistant</Text>
        
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={toggleDarkMode} style={styles.headerIcon}>
            <Ionicons name={darkMode ? "sunny" : "moon"} size={22} color={theme.text} />
          </TouchableOpacity>
          
          <TouchableOpacity onPress={() => setShowChatHistory(true)} style={styles.headerIcon}>
            <Ionicons name="time-outline" size={22} color={theme.text} />
          </TouchableOpacity>
          
          <TouchableOpacity onPress={handleClearChat} style={styles.headerIcon}>
            <Ionicons name="trash-outline" size={22} color={theme.text} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Chat Messages */}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.flex}
        keyboardVerticalOffset={90}
      >
        <ScrollView
          
          ref={scrollViewRef}
          onContentSizeChange={() =>
            scrollViewRef.current?.scrollToEnd({ animated: true })
          }
          style={styles.messagesContainer}
          contentContainerStyle={[
            styles.messagesContent,
            messages.length === 0 && styles.emptyChat
          ]}
        >
          {messages.length === 0 && (
            <View style={styles.emptyState}>
              <Ionicons name="chatbubbles-outline" size={48} color="#ddd" />
              <Text style={styles.emptyStateText}>Please describe your legal problem, and I will provide relevant laws and IPC sections.</Text>
            </View>
          )}

          {messages.map((message, index) => (
            <View
              key={index}
              style={[
                styles.messageBubble,
                message.isUser ? styles.userBubble : styles.aiBubble,
                styles.messageShadow
              ]}
            >
              {!message.isUser && (
                <Ionicons 
                  name="sparkles" 
                  size={16} 
                  color="#666" 
                  style={styles.aiIcon} 
                />
              )}
              <Text style={message.isUser ? styles.userText : styles.aiText}>
                {message.text}
              </Text>
              <Text style={styles.timestamp}>
                {formatTimestamp(message.timestamp)}
                {message.isUser && ' • ✓'}
              </Text>
            </View>
          ))}

          {isLoading && (
            <View style={[styles.messageBubble, styles.aiBubble, styles.messageShadow]}>
              {renderDots()}
            </View>
          )}
        </ScrollView>

        {/* Input Area */}
        <View style={[styles.inputContainer, { borderTopColor: theme.border }]}>
          <TextInput
            ref={inputRef}
            style={[styles.input, { 
              backgroundColor: darkMode ? '#252542' : '#f5f5f5',
              color: theme.text,
              borderColor: theme.border 
            }]}
            placeholder="Describe your legal question..."
            placeholderTextColor={theme.lightText}
            value={inputText}
            onChangeText={setInputText}
            onSubmitEditing={handleSend}
            multiline
            maxLength={1000}
            editable={!isLoading}
          />
          <TouchableOpacity 
            style={styles.sendButton} 
            onPress={handleSend}
            disabled={isLoading || !inputText}
          >
            <Ionicons 
              name="send" 
              size={24} 
              color={inputText && !isLoading ? PINK : '#ddd'} 
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
      
      {/* Message Options Modal */}
      <Modal
        visible={showOptions}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowOptions(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowOptions(false)}
        >
          <View style={[styles.optionsContainer, { backgroundColor: theme.card }]}>
            <TouchableOpacity style={styles.optionItem} onPress={handleCopy}>
              <Ionicons name="copy-outline" size={24} color={theme.text} />
              <Text style={[styles.optionText, { color: theme.text }]}>Copy</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.optionItem} onPress={handleTextToSpeech}>
              <Ionicons name={isSpeaking ? "stop-circle" : "volume-high"} size={24} color={theme.text} />
              <Text style={[styles.optionText, { color: theme.text }]}>{isSpeaking ? 'Stop' : 'Speak'}</Text>
            </TouchableOpacity>
            
            {selectedMessage?.isUser && (
              <TouchableOpacity style={styles.optionItem} onPress={handleDelete}>
                <Ionicons name="trash-outline" size={24} color={THEME.danger} />
                <Text style={[styles.optionText, { color: THEME.danger }]}>Delete</Text>
              </TouchableOpacity>
            )}
          </View>
        </TouchableOpacity>
      </Modal>
      
      {/* Chat History Modal */}
      <Modal
        visible={showChatHistory}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowChatHistory(false)}
      >
        <View style={[styles.historyModalContainer, { backgroundColor: theme.background }]}>
          <View style={[styles.historyHeader, { borderBottomColor: theme.border }]}>
            <Text style={[styles.historyTitle, { color: theme.text }]}>Previous Conversations</Text>
            <TouchableOpacity onPress={() => setShowChatHistory(false)}>
              <Ionicons name="close" size={24} color={theme.text} />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.historyList}>
            {previousChats.length === 0 ? (
              <View style={styles.emptyChatContainer}>
                <Text style={[styles.emptyChatText, { color: theme.lightText }]}>
                  No previous conversations found
                </Text>
              </View>
            ) : (
              previousChats.map((chat) => (
                <TouchableOpacity 
                  key={chat.id} 
                  style={[styles.historyItem, { borderBottomColor: theme.border }]}
                  onPress={() => handleLoadChat(chat)}
                >
                  <View style={styles.historyItemContent}>
                    <MaterialIcons name="history" size={20} color={THEME.primary} />
                    <View style={styles.historyItemText}>
                      <Text style={[styles.historyItemTitle, { color: theme.text }]} numberOfLines={1}>
                        {chat.title}
                      </Text>
                      <Text style={[styles.historyItemDate, { color: theme.lightText }]}>
                        {new Date(chat.timestamp).toLocaleDateString()}
                      </Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={theme.lightText} />
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// Enhanced styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#fff',
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  flex: { 
    flex: 1 
  },
  messagesContainer: { 
    flex: 1, 
    padding: 16 
  },
  messagesContent: {
    paddingBottom: 10,
  },
  emptyChat: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyChatContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    marginTop: 40,
  },
  emptyChatText: {
    fontSize: 16,
    color: THEME.lightText,
    textAlign: 'center',
    marginTop: 16,
  },
  messageBubble: {
    maxWidth: '80%',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    position: 'relative',
  },
  aiBubble: {
    backgroundColor: AI_BUBBLE,
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
    marginLeft: 32,
  },
  userBubble: {
    backgroundColor: USER_BUBBLE,
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },
  messageShadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  aiIcon: {
    position: 'absolute',
    left: -28,
    top: 12,
  },
  aiText: {
    color: '#333',
    fontSize: 16,
    lineHeight: 22,
  },
  userText: {
    color: 'white',
    fontSize: 16,
    lineHeight: 22,
  },
  timestamp: {
    fontSize: 10,
    color: '#666',
    marginTop: 8,
    alignSelf: 'flex-end',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  input: {
    flex: 1,
    backgroundColor: '#f8f8f8',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 24,
    backgroundColor: '#f5f5f5',
    fontSize: 16,
    maxHeight: 120,
    marginRight: 10,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  sendButton: { 
    width: 46,
    height: 46,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonActive: {
    transform: [{ scale: 1 }],
  },
  sendButtonGradient: {
    width: 46,
    height: 46,
    borderRadius: 23,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
    gap: 16,
  },
  emptyStateText: {
    color: '#999',
    textAlign: 'center',
    fontSize: 16,
    marginLeft: 12,
  },
  historyModalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  historyTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  loadingDots: {
    flexDirection: 'row',
    height: 20,
    alignItems: 'center',
    gap: 4,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#666',
  },
});
