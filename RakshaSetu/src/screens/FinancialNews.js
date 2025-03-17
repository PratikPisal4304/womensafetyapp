import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  SafeAreaView,
  StatusBar,
  Linking,
  Dimensions,
  Platform,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');
const HEADER_HEIGHT = 190; // Increased header height

const NewsScreen = () => {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchNews = async () => {
    setLoading(true);
    try {
      // Use the searchTerm if provided, else default to 'women empowerment finance'
      const query = searchTerm.trim() ? encodeURIComponent(searchTerm.trim()) : 'women+empowerment+finance';
      const response = await fetch(
        `https://newsapi.org/v2/everything?q=${query}&language=en&sortBy=publishedAt&apiKey=479eb36d2cdf4453a5dc97c5ac585cec`
      );
      const data = await response.json();
      setNews(data.articles || []);
    } catch (error) {
      console.error('Error fetching news:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchNews();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchNews();
  };

  const handleSearchSubmit = () => {
    fetchNews();
  };

  const clearSearch = () => {
    setSearchTerm('');
    // Optionally, refresh news using the default query when cleared:
    fetchNews();
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric'
    });
  };

  const openArticle = (url) => {
    if (url) {
      Linking.openURL(url);
    }
  };

  const renderItem = ({ item, index }) => (
    <TouchableOpacity 
      style={[styles.card, index % 2 === 0 ? styles.cardEven : styles.cardOdd]}
      onPress={() => openArticle(item.url)}
      activeOpacity={0.8}
    >
      <View style={styles.cardHeader}>
        <View style={styles.sourceTag}>
          <Text style={styles.sourceText}>{item.source?.name || 'News'}</Text>
        </View>
        <Text style={styles.dateText}>{formatDate(item.publishedAt)}</Text>
      </View>
      
      <View style={styles.cardBody}>
        {item.urlToImage ? (
          <Image 
            source={{ uri: item.urlToImage }} 
            style={styles.image}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.image, styles.imagePlaceholder]}>
            <Ionicons name="images" size={40} color="#ffd3e0" />
          </View>
        )}
        
        <View style={styles.contentContainer}>
          <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
          <Text style={styles.snippet} numberOfLines={2}>{item.description}</Text>
          
          <View style={styles.cardFooter}>
            <View style={styles.authorContainer}>
              <Ionicons name="person" size={14} color="#ff5f96" />
              <Text style={styles.author} numberOfLines={1}>
                {item.author || 'Unknown author'}
              </Text>
            </View>
            <View style={styles.readMoreContainer}>
              <Text style={styles.readMore}>Read more</Text>
              <Ionicons name="arrow-forward" size={14} color="#ff5f96" />
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="newspaper" size={60} color="#ffd3e0" />
      <Text style={styles.emptyText}>No news articles found</Text>
      <TouchableOpacity style={styles.retryButton} onPress={fetchNews}>
        <Text style={styles.retryText}>Refresh</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#ff5f96" />
      {/* Fixed Header that extends to the notification panel */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerTitle}>Women's Pulse</Text>
            <Text style={styles.headerSubtitle}>Stories that matter</Text>
          </View>
          <TouchableOpacity style={styles.refreshButton} onPress={fetchNews}>
            <Ionicons name="refresh" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
        
        <View style={styles.searchContainer}>
          <View style={styles.searchBox}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search for articles..."
              placeholderTextColor="#aaa"
              value={searchTerm}
              onChangeText={setSearchTerm}
              onSubmitEditing={handleSearchSubmit}
              returnKeyType="search"
            />
            {searchTerm ? (
              <TouchableOpacity onPress={clearSearch} style={styles.clearButton}>
                <Ionicons name="close" size={20} color="#ff5f96" />
              </TouchableOpacity>
            ) : null}
            <TouchableOpacity onPress={handleSearchSubmit}>
              <Ionicons name="search" size={20} color="#ff5f96" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#ff5f96" />
          <Text style={styles.loadingText}>Finding the latest stories...</Text>
        </View>
      ) : (
        <FlatList
          data={news}
          keyExtractor={(item, index) => item.url || `news-${index}`}
          renderItem={renderItem}
          contentContainerStyle={[styles.listContainer, { marginTop: HEADER_HEIGHT }]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#ff5f96"]}
            />
          }
          ListEmptyComponent={renderEmpty}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff5f8',
  },
  // Fixed header style extended vertically with increased HEADER_HEIGHT
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: HEADER_HEIGHT,
    backgroundColor: '#ff5f96',
    paddingBottom: 16,
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 16 : 65,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 10,
    zIndex: 999,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 2,
  },
  refreshButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    marginTop: 16,
  },
  searchBox: {
    backgroundColor: 'white',
    borderRadius: 30,
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    padding: 0,
    marginRight: 8,
  },
  clearButton: {
    marginRight: 8,
  },
  featuredContainer: {
    marginTop: 16,
    marginBottom: 8,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  seeAllText: {
    color: '#ff5f96',
    fontSize: 14,
  },
  listContainer: {
    paddingBottom: 24,
  },
  card: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 16,
    shadowColor: '#ff5f96',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  cardEven: {
    borderLeftWidth: 4,
    borderLeftColor: '#ff5f96',
  },
  cardOdd: {
    borderRightWidth: 4,
    borderRightColor: '#ff5f96',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  sourceTag: {
    backgroundColor: '#ffebf2',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  sourceText: {
    color: '#ff5f96',
    fontSize: 12,
    fontWeight: '500',
  },
  dateText: {
    color: '#888',
    fontSize: 12,
  },
  cardBody: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  image: {
    width: 80,
    height: 80,
    borderRadius: 12,
  },
  imagePlaceholder: {
    backgroundColor: '#ffebf2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentContainer: {
    flex: 1,
    marginLeft: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  snippet: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  authorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  author: {
    fontSize: 12,
    color: '#888',
    marginLeft: 4,
    maxWidth: width * 0.3,
  },
  readMoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  readMore: {
    fontSize: 12,
    color: '#ff5f96',
    fontWeight: '500',
    marginRight: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: '#ff5f96',
    fontSize: 16,
  },
  emptyContainer: {
    padding: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#888',
    marginTop: 16,
    marginBottom: 16,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#ff5f96',
    borderRadius: 30,
  },
  retryText: {
    color: '#fff',
    fontWeight: '500',
  },
});

export default NewsScreen;
