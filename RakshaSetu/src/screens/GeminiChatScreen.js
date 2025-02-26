// GeminiChatScreen.js
import React, { useState,useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const PINK = '#ff5f96';
const AI_BUBBLE = '#f8f8f8';
const USER_BUBBLE = PINK;

export default function GeminiChatScreen({ navigation }) {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollViewRef = useRef();
  const dotAnim = useRef(new Animated.Value(0)).current;

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
    }
  }, [isLoading]);

  // Mock AI response
  const mockAIResponse = async (userMessage) => {
    try {
      setIsLoading(true);
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return {
        text: `I'm here to help with women's rights information. Could you please clarify: "${userMessage}"?`,
        isUser: false,
        timestamp: new Date(),
      };
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = async () => {
    if (!inputText.trim() || isLoading) return;

    const userMessage = {
      text: inputText,
      isUser: true,
      timestamp: new Date(),
    };

    try {
      setMessages(prev => [...prev, userMessage]);
      setInputText('');

      const aiResponse = await mockAIResponse(inputText);
      if (aiResponse) {
        setMessages(prev => [...prev, aiResponse]);
      }
    } catch (error) {
      alert('Failed to send message');
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
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Ionicons name="sparkles" size={18} color={PINK} />
          <Text style={styles.headerTitle}>Gemini Assistant</Text>
        </View>
        <View style={{ width: 24 }} />
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
          contentContainerStyle={styles.messagesContent}
        >
          {messages.length === 0 && (
            <View style={styles.emptyState}>
              <Ionicons name="chatbubbles-outline" size={48} color="#ddd" />
              <Text style={styles.emptyStateText}>Ask me about legal rights, safety tips, or community support</Text>
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
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Ask about women's rights..."
            placeholderTextColor="#999"
            value={inputText}
            onChangeText={setInputText}
            onSubmitEditing={handleSend}
            multiline
            maxLength={500}
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
    </SafeAreaView>
  );
}

// Keep the same styles as previous version
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
    flex: 1,
  },
  messagesContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  messagesContent: {
    paddingTop: 16,
    paddingBottom: 80,
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
    fontSize: 16,
    marginRight: 8,
    maxHeight: 120,
    lineHeight: 20,
  },
  sendButton: {
    padding: 8,
  },
  emptyState: {
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
    maxWidth: 300,
    lineHeight: 22,
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