// GeminiChatScreen.js
import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const PINK = '#ff5f96';
const AI_BUBBLE = '#f0f0f0';
const USER_BUBBLE = PINK;

export default function GeminiChatScreen({ navigation }) {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Mock AI response - replace with actual API call
  const mockAIResponse = async (userMessage) => {
    setIsLoading(true);
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return {
      text: `This is a mock response to: "${userMessage}". In a real implementation, this would connect to Gemini AI.`,
      isUser: false,
      timestamp: new Date().toISOString(),
    };
  };

  const handleSend = async () => {
    if (!inputText.trim()) return;

    // Add user message
    const userMessage = {
      text: inputText,
      isUser: true,
      timestamp: new Date().toISOString(),
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputText('');

    // Get AI response
    const aiResponse = await mockAIResponse(inputText);
    setMessages(prev => [...prev, aiResponse]);
    setIsLoading(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Gemini Assistant</Text>
        <View style={{ width: 24 }} /> 
      </View>

      {/* Chat Messages */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
        keyboardVerticalOffset={90}
      >
        <ScrollView 
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          ref={ref => this.scrollView = ref}
          onContentSizeChange={() => this.scrollView.scrollToEnd({ animated: true })}
        >
          {messages.map((message, index) => (
            <View
              key={index}
              style={[
                styles.messageBubble,
                message.isUser ? styles.userBubble : styles.aiBubble
              ]}
            >
              <Text style={message.isUser ? styles.userText : styles.aiText}>
                {message.text}
              </Text>
              <Text style={styles.timestamp}>
                {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </View>
          ))}

          {isLoading && (
            <View style={[styles.messageBubble, styles.aiBubble]}>
              <Text style={styles.aiText}>Gemini is thinking...</Text>
            </View>
          )}
        </ScrollView>

        {/* Input Area */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Ask me about women's rights..."
            placeholderTextColor="#999"
            value={inputText}
            onChangeText={setInputText}
            onSubmitEditing={handleSend}
            multiline
          />
          <TouchableOpacity 
            style={styles.sendButton} 
            onPress={handleSend}
            disabled={isLoading}
          >
            <Ionicons 
              name="send" 
              size={24} 
              color={inputText ? PINK : '#ccc'} 
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

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
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
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
    padding: 12,
    marginBottom: 16,
  },
  aiBubble: {
    backgroundColor: AI_BUBBLE,
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
  },
  userBubble: {
    backgroundColor: USER_BUBBLE,
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },
  aiText: {
    color: '#333',
    fontSize: 16,
  },
  userText: {
    color: 'white',
    fontSize: 16,
  },
  timestamp: {
    fontSize: 10,
    color: '#666',
    marginTop: 4,
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
  },
  sendButton: {
    padding: 8,
  },
});