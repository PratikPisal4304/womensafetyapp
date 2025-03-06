import { OPENAI_API_KEY } from '@env'; // Import API key from .env
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import * as Speech from 'expo-speech';
import { StatusBar } from 'expo-status-bar';
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
  View
} from 'react-native';

// Color scheme
const THEME = {
  primary: '#5271ff',
  secondary: '#7389ff',
  accent: '#ff5f96',
  background: '#ffffff',
  aiBackground: '#f0f4ff',
  userBackground: '#5271ff',
  text: '#333333',
  lightText: '#999999',
  danger: '#ff4d4d',
};

const OPENAI_URL = 'https://api.openai.com/v1/chat/completions';

export default function GeminiChatScreen({ navigation }) {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
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
        // Load settings
        const savedSettings = await AsyncStorage.getItem('legalAssistantSettings');
        if (savedSettings) {
          const settings = JSON.parse(savedSettings);
          setDarkMode(settings.darkMode || false);
          setShowIntroduction(settings.showIntroduction !== false); // Default to true
        }
        
        // Load current chat
        const savedMessages = await AsyncStorage.getItem('currentLegalChat');
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
        console.error('Failed to load data:', error);
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
        await AsyncStorage.setItem('currentLegalChat', JSON.stringify(messages));
        
        // Save settings
        const settings = {
          darkMode,
          showIntroduction,
        };
        await AsyncStorage.setItem('legalAssistantSettings', JSON.stringify(settings));
      } catch (error) {
        console.error('Failed to save data:', error);
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
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-4', // Using GPT-4 for better legal advice
          messages: [
            { 
              role: 'system', 
              content: `You are a legal assistant specialized in providing informative guidance on legal matters.
              
              Guidelines:
              1. Always provide information about relevant laws, statutes, and legal principles.
              2. When appropriate, mention specific sections of legal codes (like IPC sections in India).
              3. Explain legal concepts in clear, simple language.
              4. Provide context and examples when helpful.
              5. Acknowledge jurisdiction limitations and variations in law across regions.
              6. Clearly state when a question falls outside your expertise.
              7. Remind users that your information is for educational purposes only and not a substitute for professional legal advice.
              
              Current date: ${new Date().toLocaleDateString()}`
            },
            ...contextMessages,
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
      return 'Sorry, I am unable to provide legal advice at the moment due to a technical issue. Please check your internet connection and try again.';
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
      Alert.alert('Error', 'Failed to send message. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    if (isNaN(date)) return '';

    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return date.toLocaleTimeString([], { 
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
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
        keyboardVerticalOffset={90}
      >
        <ScrollView
          
          ref={scrollViewRef}
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
          style={styles.messagesContainer}
          contentContainerStyle={[
            styles.messagesContent,
            messages.length === 0 && styles.emptyChat
          ]}
        >
          {messages.length === 0 ? (
            <View style={styles.emptyChatContainer}>
              <MaterialIcons name="gavel" size={60} color={theme.lightText} />
              <Text style={[styles.emptyChatText, { color: theme.lightText }]}>
                Start a conversation with your legal assistant
              </Text>
            </View>
          ) : (
            messages.map((message, index) => (
              <Animated.View
                key={index}
                style={[
                  styles.messageBubble,
                  message.isUser 
                    ? [styles.userBubble, { backgroundColor: THEME.userBackground }] 
                    : [styles.aiBubble, { backgroundColor: theme.aiBackground }],
                  message.isIntroduction && styles.introductionBubble,
                  index === messages.length - 1 && { opacity: fadeAnim }
                ]}
              >
                {!message.isUser && (
                  <View style={styles.aiHeader}>
                    <View style={styles.aiAvatar}>
                      <MaterialIcons name="gavel" size={14} color="#fff" />
                    </View>
                    <Text style={[styles.aiName, { color: theme.text }]}>Legal Assistant</Text>
                  </View>
                )}
                
                <TouchableOpacity
                  activeOpacity={0.8}
                  onLongPress={() => handleLongPress(message, index)}
                  delayLongPress={300}
                >
                  <Text style={[
                    message.isUser ? styles.userText : styles.aiText,
                    { color: message.isUser ? '#fff' : theme.text }
                  ]}>
                    {message.text}
                  </Text>
                </TouchableOpacity>
                
                <View style={styles.messageFooter}>
                  <Text style={[styles.timestamp, { color: message.isUser ? '#e0e0e0' : theme.lightText }]}>
                    {formatTimestamp(message.timestamp)}
                  </Text>
                  {message.isUser && (
                    <Ionicons name="checkmark-done" size={14} color="#e0e0e0" />
                  )}
                </View>
              </Animated.View>
            ))
          )}

          {isTyping && (
            <View style={[styles.messageBubble, styles.aiBubble, { backgroundColor: theme.aiBackground }]}>
              <View style={styles.typingIndicator}>
                <View style={styles.typingDot} />
                <View style={[styles.typingDot, { animationDelay: '0.2s' }]} />
                <View style={[styles.typingDot, { animationDelay: '0.4s' }]} />
              </View>
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
            style={[
              styles.sendButton,
              inputText.trim() && !isLoading ? styles.sendButtonActive : {}
            ]} 
            onPress={handleSend}
            disabled={isLoading || !inputText.trim()}
          >
            <LinearGradient
              colors={inputText.trim() && !isLoading ? [THEME.primary, THEME.secondary] : ['#dddddd', '#cccccc']}
              style={styles.sendButtonGradient}
            >
              <Ionicons 
                name="send" 
                size={20} 
                color="#ffffff" 
              />
            </LinearGradient>
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
    backgroundColor: THEME.background 
  },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 16, 
    borderBottomWidth: 1, 
    borderBottomColor: '#eee',
    justifyContent: 'space-between' 
  },
  headerTitle: { 
    fontSize: 18, 
    fontWeight: '600', 
    color: THEME.text, 
    flex: 1, 
    textAlign: 'center' 
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIcon: {
    padding: 8,
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
    borderRadius: 20, 
    padding: 12, 
    marginBottom: 16,
    maxWidth: '85%',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  aiBubble: { 
    backgroundColor: THEME.aiBackground, 
    alignSelf: 'flex-start',
    borderTopLeftRadius: 4,
  },
  userBubble: { 
    backgroundColor: THEME.userBackground, 
    alignSelf: 'flex-end',
    borderTopRightRadius: 4,
  },
  introductionBubble: {
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  userText: { 
    color: 'white',
    fontSize: 16,
    lineHeight: 22,
  },
  aiText: { 
    color: THEME.text,
    fontSize: 16,
    lineHeight: 22,
  },
  aiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  aiAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: THEME.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  aiName: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
  },
  messageFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 6,
    gap: 4,
  },
  timestamp: { 
    fontSize: 12, 
    color: '#999', 
  },
  typingIndicator: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: THEME.primary,
    marginRight: 4,
    opacity: 0.6,
  },
  inputContainer: { 
    flexDirection: 'row', 
    padding: 12, 
    borderTopWidth: 1, 
    borderTopColor: '#eee',
    alignItems: 'flex-end',
  },
  input: { 
    flex: 1, 
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
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionsContainer: {
    width: 250,
    borderRadius: 12,
    backgroundColor: '#fff',
    overflow: 'hidden',
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  optionText: {
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
  historyList: {
    flex: 1,
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  historyItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  historyItemText: {
    marginLeft: 12,
    flex: 1,
  },
  historyItemTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  historyItemDate: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
});