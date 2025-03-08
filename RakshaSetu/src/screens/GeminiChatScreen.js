import { OPENAI_API_KEY } from '@env'; // Import API key from .env
import { Ionicons, MaterialIcons, AntDesign } from '@expo/vector-icons';
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
import * as Haptics from 'expo-haptics';
import * as Speech from 'expo-speech';
import { StatusBar } from 'expo-status-bar';

const PINK = '#ff5f96';
const AI_BUBBLE = '#f8f8f8';
const USER_BUBBLE = PINK;
const BORDER_COLOR = '#eee';
const TEXT_COLOR = '#333';
const LIGHT_TEXT = '#999';
const CARD_BG = '#fff';
const STATUS_BAR_STYLE = 'dark';
const DANGER_COLOR = '#ff5f96';

const OPENAI_URL = "https://api.openai.com/v1/chat/completions";

export default function GeminiChatScreen({ navigation }) {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showIntroduction, setShowIntroduction] = useState(true);
  const [previousChats, setPreviousChats] = useState([]);
  const [showChatHistory, setShowChatHistory] = useState(false);
  // Expanded sections: keys are `${messageKey}-${section.id}` with boolean values.
  const [expandedSections, setExpandedSections] = useState({});

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
          addWelcomeMessage();
        }
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

  // Save chat history whenever messages change
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
  }, [messages]);

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

  // Fade in effect for new messages
  const fadeIn = () => {
    fadeAnim.setValue(0);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  // Parse AI response into sections using common heading patterns.
  const parseSections = (text) => {
    const sections = [];
    const lines = text.split('\n');
    let currentSection = { title: 'Overview', content: [] };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (
        (line.match(/^[A-Z\s]+:/) ||
          line.match(/^[0-9]+\.\s+[A-Z]/) ||
          line.match(/^[A-Z\s]{5,}$/) ||
          line.startsWith('SECTION') ||
          line.startsWith('IPC') ||
          line.startsWith('PENALTIES') ||
          line.startsWith('LEGAL RECOURSE') ||
          line.startsWith('CONSEQUENCES') ||
          (i > 0 && line && !lines[i - 1])) &&
        line.length < 100
      ) {
        if (currentSection.content.length > 0) {
          sections.push({
            id: sections.length.toString(),
            title: currentSection.title,
            content: currentSection.content.join('\n'),
          });
        }
        currentSection = { title: line, content: [] };
      } else {
        if (line || currentSection.content.length > 0) {
          currentSection.content.push(line);
        }
      }
    }
    if (currentSection.content.length > 0) {
      sections.push({
        id: sections.length.toString(),
        title: currentSection.title,
        content: currentSection.content.join('\n'),
      });
    }
    return sections.length > 1 ? sections : [{ id: '0', title: 'Legal Analysis', content: text }];
  };

  // Call OpenAI API for legal advice
  const getLegalAdvice = async (userMessage, messageHistory = []) => {
    try {
      const contextMessages = messageHistory.map(msg => ({
        role: msg.isUser ? 'user' : 'assistant',
        content: msg.text || (msg.sections ? msg.sections.map(sec => `${sec.title}\n${sec.content}`).join('\n\n') : '')
      }));
      
      const response = await fetch(OPENAI_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            { role: 'system', content: 'You are a legal assistant. Ask the user to specify their legal problem and then provide relevant laws and IPC sections. Format your response with clear section headings.' },
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

  // Toggle individual section's state.
  const toggleSection = (sectionKey) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionKey]: !prev[sectionKey]
    }));
  };

  // Toggle all sections for a given message.
  const toggleAllSectionsForMessage = (messageKey, sections) => {
    let allExpanded = true;
    sections.forEach(section => {
      const key = `${messageKey}-${section.id}`;
      if (!expandedSections[key]) {
        allExpanded = false;
      }
    });
    const newState = { ...expandedSections };
    sections.forEach(section => {
      const key = `${messageKey}-${section.id}`;
      newState[key] = !allExpanded;
    });
    setExpandedSections(newState);
  };

  // Handle sending a message.
  const handleSend = async () => {
    if (!inputText.trim() || isLoading) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const userMessage = {
      text: inputText.trim(),
      isUser: true,
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);
    setIsTyping(true);

    const context = [...messages].slice(-10);
    const aiResponseText = await getLegalAdvice(inputText, context);
    await new Promise(resolve => setTimeout(resolve, 800));
    setIsTyping(false);

    // If the AI response indicates an error, mark it for retry.
    let aiResponse = {};
    const sections = parseSections(aiResponseText);
    if (sections.length > 1) {
      aiResponse.sections = sections;
    } else {
      aiResponse.text = aiResponseText;
    }
    aiResponse.isUser = false;
    aiResponse.timestamp = new Date().toISOString();

    // Add a retry flag if error message is detected.
    if (aiResponse.text && aiResponse.text.startsWith("I'm sorry, I encountered an error:")) {
      aiResponse.retry = true;
    }

    setMessages(prev => [...prev, aiResponse]);
    fadeIn();
    setIsLoading(false);

    // Auto-scroll to bottom.
    scrollViewRef.current?.scrollToEnd({ animated: true });
  };

  // Render collapsible sections.
  const renderSectionedMessage = (message, messageKey) => {
    return (
      <View style={styles.sectionedContainer}>
        {message.sections.map(section => {
          const key = `${messageKey}-${section.id}`;
          return (
            <View key={key} style={styles.section}>
              <TouchableOpacity style={styles.sectionHeader} onPress={() => toggleSection(key)}>
                <Text style={styles.sectionTitle}>{section.title}</Text>
                <AntDesign name={expandedSections[key] ? "up" : "down"} size={16} color="#666" />
              </TouchableOpacity>
              {expandedSections[key] && (
                <Text style={styles.sectionContent}>{section.content}</Text>
              )}
            </View>
          );
        })}
        <View style={styles.messageFooter}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => toggleAllSectionsForMessage(messageKey, message.sections)}
          >
            <Ionicons name="arrow-up-down-outline" size={16} color="#666" />
            <Text style={styles.actionButtonText}>Toggle All</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() =>
              Alert.alert('Copied', 'Legal information copied to clipboard')
            }
          >
            <Ionicons name="copy-outline" size={16} color="#666" />
            <Text style={styles.actionButtonText}>Copy</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() =>
              Alert.alert('Share', 'This would open the share dialog')
            }
          >
            <Ionicons name="share-outline" size={16} color="#666" />
            <Text style={styles.actionButtonText}>Share</Text>
          </TouchableOpacity>
          {message.retry && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleSend}
            >
              <Ionicons name="refresh" size={16} color="#666" />
              <Text style={styles.actionButtonText}>Retry</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  // Render loading dots.
  const renderDots = () => {
    const dotPosition = dotAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 10],
    });
    return (
      <View style={styles.loadingDots}>
        {[0, 1, 2].map(i => (
          <Animated.View
            key={i}
            style={[
              styles.dot,
              { transform: [{ translateY: i === 1 ? dotPosition : -dotPosition }] },
            ]}
          />
        ))}
      </View>
    );
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    const now = new Date();
    const diff = now - new Date(timestamp);
    if (diff < 60000) return 'Just now';
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Message actions: copy, delete, text-to-speech.
  const handleLongPress = (message, index) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedMessage({ ...message, index });
    setShowOptions(true);
  };

  const handleCopy = async () => {
    if (selectedMessage) {
      const textToCopy = selectedMessage.text || (selectedMessage.sections ? selectedMessage.sections.map(sec => `${sec.title}\n${sec.content}`).join('\n\n') : '');
      Clipboard.setString(textToCopy);
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
            },
          },
        ]
      );
    }
  };

  const handleTextToSpeech = () => {
    if (selectedMessage && !isSpeaking) {
      setIsSpeaking(true);
      const textToSpeak = selectedMessage.text || (selectedMessage.sections ? selectedMessage.sections.map(sec => sec.content).join('\n') : '');
      Speech.speak(textToSpeak, {
        language: 'en',
        pitch: 1,
        rate: 0.9,
        onDone: () => setIsSpeaking(false),
        onError: () => {
          setIsSpeaking(false);
          Alert.alert('Error', 'Failed to play text-to-speech');
        },
      });
    } else if (isSpeaking) {
      Speech.stop();
      setIsSpeaking(false);
    }
    setShowOptions(false);
  };

  // Clear all messages and save chat to history.
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
            if (messages.some(msg => msg.isUser)) {
              try {
                const chatTitle = messages.find(msg => msg.isUser)?.text || 'Legal Chat';
                const newChat = {
                  id: Date.now().toString(),
                  title: chatTitle.substring(0, 30) + (chatTitle.length > 30 ? '...' : ''),
                  messages: messages,
                  timestamp: new Date().toISOString()
                };
                const updatedChats = [newChat, ...previousChats].slice(0, 10);
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

  // Load a previous chat.
  const handleLoadChat = (chat) => {
    setMessages(chat.messages);
    setShowChatHistory(false);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: "#fff" }]}>
      <StatusBar style={STATUS_BAR_STYLE} />
      
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: BORDER_COLOR }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerIcon}>
          <Ionicons name="arrow-back" size={24} color={TEXT_COLOR} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: TEXT_COLOR }]}>Legal Assistant</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={() => setShowChatHistory(true)} style={styles.headerIcon}>
            <Ionicons name="time-outline" size={22} color={TEXT_COLOR} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleClearChat} style={styles.headerIcon}>
            <Ionicons name="trash-outline" size={22} color={TEXT_COLOR} />
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
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
          style={styles.messagesContainer}
          contentContainerStyle={[styles.messagesContent, messages.length === 0 && styles.emptyChat]}
        >
          {messages.length === 0 && (
            <View style={styles.emptyState}>
              <Ionicons name="chatbubbles-outline" size={48} color="#ddd" />
              <Text style={styles.emptyStateText}>Please describe your legal problem, and I will provide relevant laws and IPC sections.</Text>
            </View>
          )}

          {messages.map((message, index) => (
            <TouchableOpacity key={index} onLongPress={() => handleLongPress(message, index)}>
              <View style={[styles.messageBubble, message.isUser ? styles.userBubble : styles.aiBubble, styles.messageShadow]}>
                {!message.isUser && (
                  <Ionicons 
                    name="sparkles" 
                    size={16} 
                    color="#666" 
                    style={styles.aiIcon} 
                  />
                )}
                {message.sections ? (
                  renderSectionedMessage(message, index.toString())
                ) : (
                  <>
                    <Text style={message.isUser ? styles.userText : styles.aiText}>
                      {message.text}
                    </Text>
                    <View style={styles.messageFooter}>
                      <TouchableOpacity style={styles.actionButton} onPress={() => Alert.alert('Copied', 'Message copied to clipboard')}>
                        <Ionicons name="copy-outline" size={16} color="#666" />
                        <Text style={styles.actionButtonText}>Copy</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.actionButton} onPress={() => Alert.alert('Share', 'This would open the share dialog')}>
                        <Ionicons name="share-outline" size={16} color="#666" />
                        <Text style={styles.actionButtonText}>Share</Text>
                      </TouchableOpacity>
                    </View>
                  </>
                )}
                <Text style={styles.timestamp}>
                  {formatTimestamp(message.timestamp)}
                  {message.isUser && ' • ✓'}
                </Text>
              </View>
            </TouchableOpacity>
          ))}

          {isLoading && (
            <View style={[styles.messageBubble, styles.aiBubble, styles.messageShadow]}>
              {renderDots()}
            </View>
          )}
        </ScrollView>

        {/* Input Area */}
        <View style={[styles.inputContainer, { borderTopColor: BORDER_COLOR }]}>
          <TextInput
            ref={inputRef}
            style={[styles.input, { backgroundColor: '#f5f5f5', color: TEXT_COLOR, borderColor: BORDER_COLOR }]}
            placeholder="Describe your legal question..."
            placeholderTextColor={LIGHT_TEXT}
            value={inputText}
            onChangeText={setInputText}
            onSubmitEditing={handleSend}
            multiline
            maxLength={1000}
            editable={!isLoading}
          />
          <TouchableOpacity style={styles.sendButton} onPress={handleSend} disabled={isLoading || !inputText}>
            <Ionicons name="send" size={24} color={inputText && !isLoading ? PINK : '#ddd'} />
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
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowOptions(false)}>
          <View style={[styles.optionsContainer, { backgroundColor: CARD_BG }]}>
            <TouchableOpacity style={styles.optionItem} onPress={handleCopy}>
              <Ionicons name="copy-outline" size={24} color={TEXT_COLOR} />
              <Text style={[styles.optionText, { color: TEXT_COLOR }]}>Copy</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.optionItem} onPress={handleTextToSpeech}>
              <Ionicons name={isSpeaking ? "stop-circle" : "volume-high"} size={24} color={TEXT_COLOR} />
              <Text style={[styles.optionText, { color: TEXT_COLOR }]}>{isSpeaking ? 'Stop' : 'Speak'}</Text>
            </TouchableOpacity>
            {selectedMessage?.isUser && (
              <TouchableOpacity style={styles.optionItem} onPress={handleDelete}>
                <Ionicons name="trash-outline" size={24} color={DANGER_COLOR} />
                <Text style={[styles.optionText, { color: DANGER_COLOR }]}>Delete</Text>
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
        <View style={[styles.historyModalContainer, { backgroundColor: "#fff" }]}>
          <View style={[styles.historyHeader, { borderBottomColor: BORDER_COLOR }]}>
            <Text style={[styles.historyTitle, { color: TEXT_COLOR }]}>Previous Conversations</Text>
            <TouchableOpacity onPress={() => setShowChatHistory(false)}>
              <Ionicons name="close" size={24} color={TEXT_COLOR} />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.historyList}>
            {previousChats.length === 0 ? (
              <View style={styles.emptyChatContainer}>
                <Text style={[styles.emptyChatText, { color: LIGHT_TEXT }]}>No previous conversations found</Text>
              </View>
            ) : (
              previousChats.map(chat => (
                <TouchableOpacity key={chat.id} style={[styles.historyItem, { borderBottomColor: BORDER_COLOR }]} onPress={() => handleLoadChat(chat)}>
                  <View style={styles.historyItemContent}>
                    <MaterialIcons name="history" size={20} color={PINK} />
                    <View style={styles.historyItemText}>
                      <Text style={[styles.historyItemTitle, { color: TEXT_COLOR }]} numberOfLines={1}>
                        {chat.title}
                      </Text>
                      <Text style={[styles.historyItemDate, { color: LIGHT_TEXT }]}>
                        {new Date(chat.timestamp).toLocaleDateString()}
                      </Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={LIGHT_TEXT} />
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// Enhanced Styles (without an external theme object)
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 26,
    borderBottomWidth: 1,
    paddingTop: 30,
    backgroundColor: "#fff",
  },
  headerIcon: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
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
  emptyState: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyStateText: {
    color: "#999",
    textAlign: 'center',
    fontSize: 16,
    marginLeft: 12,
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
    color: "#333",
    fontSize: 16,
    lineHeight: 22,
  },
  userText: {
    color: "#fff",
    fontSize: 16,
    lineHeight: 22,
  },
  timestamp: {
    fontSize: 10,
    color: "#666",
    marginTop: 8,
    alignSelf: 'flex-end',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    paddingBottom: -40,
    bottom: -10,
    backgroundColor: "#fff",
    borderTopWidth: 1,
  },
  input: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    maxHeight: 120,
    marginRight: 10,
    borderWidth: 1,
    borderColor: 'transparent',
    borderRadius: 24,
  },
  sendButton: { 
    width: 46,
    height: 46,
    justifyContent: 'center',
    alignItems: 'center',
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
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
    gap: 16,
  },
  optionsContainer: {
    padding: 16,
    borderRadius: 8,
    flexDirection: 'row',
    gap: 16,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  optionText: {
    fontSize: 16,
  },
  historyModalContainer: {
    flex: 1,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    top: 30,
    bottom: 20,
    borderBottomWidth: 1,
  },
  historyTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  historyList: {
    paddingHorizontal: 16,
    top: 30,
  },
  historyItem: {
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    alignItems: 'center',
  },
  historyItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  historyItemText: {
    flex: 1,
  },
  historyItemTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  historyItemDate: {
    fontSize: 12,
  },
  sectionedContainer: {
    width: '100%',
  },
  section: {
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#EEE",
    borderRadius: 8,
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    backgroundColor: "#F5F5F5",
  },
  sectionTitle: {
    fontWeight: 'bold',
    fontSize: 15,
    color: "#333",
    flex: 1,
  },
  sectionContent: {
    padding: 12,
    fontSize: 14,
    lineHeight: 20,
    color: "#333",
  },
  messageFooter: {
    flexDirection: 'row',
    marginTop: 10,
    justifyContent: 'flex-end',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 16,
  },
  actionButtonText: {
    fontSize: 12,
    color: "#666",
    marginLeft: 4,
  },
});

