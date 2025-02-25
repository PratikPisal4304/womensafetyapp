import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  StatusBar,
  TextInput,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';

const PINK = '#ff5f96';
const CARD_RADIUS = 10;

export default function CommunityScreen() {
  const [searchTerm, setSearchTerm] = useState('');

  const handleSearchSubmit = () => {
    console.log('Search submitted:', searchTerm);
    // Filter content or navigate based on searchTerm here
  };

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Pinned Pink Header */}
      <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>My Community</Text>

        {/* Search Bar */}
        <View style={styles.searchBar}>
          <MaterialIcons name="search" size={24} color="#666" style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search Legal Women Rights"
            placeholderTextColor="#666"
            value={searchTerm}
            onChangeText={setSearchTerm}
            onSubmitEditing={handleSearchSubmit}
            returnKeyType="search"
          />
        </View>
      </View>

      {/* Scrollable content below the pinned header */}
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Featured Articles */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Featured Articles</Text>
          <View style={styles.articleCard}>
            <Image
              source={{ uri: 'https://via.placeholder.com/300x150' }}
              style={styles.articleImage}
            />
            <Text style={styles.articleTitle}>Understanding Your Legal Rights</Text>
            <Text style={styles.articleDescription}>
              A comprehensive guide to legal rights for women.
            </Text>
          </View>
        </View>

        {/* Categories */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Categories</Text>
          <View style={styles.categoryContainer}>
            <TouchableOpacity style={styles.categoryCard} activeOpacity={0.8}>
              <MaterialIcons name="work" size={24} color="#ff69b4" />
              <Text style={styles.categoryText}>Employment Rights</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.categoryCard} activeOpacity={0.8}>
              <MaterialIcons name="security" size={24} color="#ff69b4" />
              <Text style={styles.categoryText}>Domestic Violence Laws</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.categoryCard} activeOpacity={0.8}>
              <MaterialIcons name="healing" size={24} color="#ff69b4" />
              <Text style={styles.categoryText}>Reproductive Rights</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.categoryCard} activeOpacity={0.8}>
              <MaterialIcons name="school" size={24} color="#ff69b4" />
              <Text style={styles.categoryText}>Education Rights</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Recent Discussions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Discussions</Text>
          <View style={styles.discussionCard}>
            <Text style={styles.discussionTitle}>How to report workplace harassment?</Text>
            <Text style={styles.discussionExcerpt}>
              Learn the steps to report harassment...
            </Text>
          </View>
          <View style={styles.discussionCard}>
            <Text style={styles.discussionTitle}>Legal aid for domestic violence victims</Text>
            <Text style={styles.discussionExcerpt}>
              Find out how to get legal help...
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ========== STYLES ==========
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  headerContainer: {
    backgroundColor: PINK,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    paddingHorizontal: 20,
    paddingTop: 70, // Enough space for iOS status bar area
    paddingBottom: 40,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  searchInput: {
    flex: 1,
    color: '#666',
    fontSize: 15,
  },

  // The scrollable area below the pinned header
  scrollContainer: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 100, // extra space if needed
  },

  section: {
    marginBottom: 24,
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },

  articleCard: {
    backgroundColor: '#fff',
    borderRadius: CARD_RADIUS,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  articleImage: {
    width: '100%',
    height: 160,
  },
  articleTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  articleDescription: {
    fontSize: 14,
    color: '#666',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },

  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  categoryCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: CARD_RADIUS,
    paddingVertical: 20,
    alignItems: 'center',
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  categoryText: {
    fontSize: 14,
    color: '#333',
    marginTop: 8,
    textAlign: 'center',
  },

  discussionCard: {
    backgroundColor: '#fff',
    borderRadius: CARD_RADIUS,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  discussionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  discussionExcerpt: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
  },
});
