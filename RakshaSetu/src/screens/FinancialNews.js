import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, Image, ActivityIndicator, StyleSheet, TouchableOpacity, RefreshControl, SafeAreaView, StatusBar, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons'; // Assuming you have Expo installed

const NewsScreen = () => {
    const [news, setNews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchNews = async () => {
        try {
            const response = await fetch(
                'https://newsapi.org/v2/everything?q=women&language=en&apiKey=479eb36d2cdf4453a5dc97c5ac585cec'
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

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric', 
            hour: '2-digit', 
            minute: '2-digit' 
        });
    };

    const openArticle = (url) => {
        if (url) {
            Linking.openURL(url);
        }
    };

    const renderItem = ({ item }) => (
        <TouchableOpacity 
            style={styles.card} 
            onPress={() => openArticle(item.url)}
            activeOpacity={0.7}
        >
            {item.urlToImage ? (
                <Image 
                    source={{ uri: item.urlToImage }} 
                    style={styles.image}
                    resizeMode="cover"
                />
            ) : (
                <View style={[styles.image, styles.imagePlaceholder]}>
                    <Ionicons name="image-outline" size={40} color="#ccc" />
                </View>
            )}
            
            <View style={styles.cardContent}>
                <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
                <Text style={styles.snippet} numberOfLines={3}>{item.description}</Text>
                
                <View style={styles.metaContainer}>
                    <View style={styles.sourceContainer}>
                        <Ionicons name="newspaper-outline" size={12} color="#6a5bc9" />
                        <Text style={styles.source}>{item.source?.name || 'Unknown'}</Text>
                    </View>
                    <View style={styles.dateContainer}>
                        <Ionicons name="time-outline" size={12} color="#8e8e8e" />
                        <Text style={styles.date}>{formatDate(item.publishedAt)}</Text>
                    </View>
                </View>
                
                {item.author && (
                    <View style={styles.authorContainer}>
                        <Ionicons name="person-outline" size={12} color="#8e8e8e" />
                        <Text style={styles.author} numberOfLines={1}>
                            {item.author}
                        </Text>
                    </View>
                )}
            </View>
        </TouchableOpacity>
    );

    const renderHeader = () => (
        <View style={styles.header}>
            <View style={styles.headerLeft}>
                <Text style={styles.headerTitle}>Women's News</Text>
                <Text style={styles.headerSubtitle}>Latest stories and updates</Text>
            </View>
            <TouchableOpacity style={styles.refreshButton} onPress={fetchNews}>
                <Ionicons name="refresh" size={24} color="#fff" />
            </TouchableOpacity>
        </View>
    );

    const renderEmpty = () => (
        <View style={styles.emptyContainer}>
            <Ionicons name="newspaper-outline" size={50} color="#ccc" />
            <Text style={styles.emptyText}>No news articles found</Text>
            <TouchableOpacity style={styles.retryButton} onPress={fetchNews}>
                <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
        </View>
    );

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="light-content" backgroundColor="#6a5bc9" />
            {renderHeader()}
            
            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#6a5bc9" />
                    <Text style={styles.loadingText}>Loading latest news...</Text>
                </View>
            ) : (
                <FlatList
                    data={news}
                    keyExtractor={(item, index) => item.url || `news-${index}`}
                    renderItem={renderItem}
                    contentContainerStyle={styles.listContainer}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            colors={["#6a5bc9"]}
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
        backgroundColor: '#f8f6ff',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#6a5bc9',
    },
    headerLeft: {
        flex: 1,
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#fff',
    },
    headerSubtitle: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.8)',
        marginTop: 2,
    },
    refreshButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContainer: {
        padding: 12,
        paddingBottom: 24,
    },
    card: {
        backgroundColor: '#fff',
        marginBottom: 16,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
        overflow: 'hidden',
    },
    image: {
        width: '100%',
        height: 180,
    },
    imagePlaceholder: {
        backgroundColor: '#f0f0f0',
        justifyContent: 'center',
        alignItems: 'center',
    },
    cardContent: {
        padding: 16,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 8,
    },
    snippet: {
        fontSize: 14,
        color: '#606060',
        marginBottom: 12,
        lineHeight: 20,
    },
    metaContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    sourceContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    source: {
        fontSize: 12,
        color: '#6a5bc9',
        fontWeight: '500',
        marginLeft: 4,
    },
    dateContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    date: {
        fontSize: 12,
        color: '#8e8e8e',
        marginLeft: 4,
    },
    authorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
    },
    author: {
        fontSize: 12,
        color: '#8e8e8e',
        marginLeft: 4,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 12,
        color: '#606060',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 60,
    },
    emptyText: {
        fontSize: 16,
        color: '#8e8e8e',
        marginTop: 12,
    },
    retryButton: {
        marginTop: 16,
        paddingHorizontal: 20,
        paddingVertical: 10,
        backgroundColor: '#6a5bc9',
        borderRadius: 8,
    },
    retryText: {
        color: '#fff',
        fontWeight: '500',
    },
});

export default NewsScreen;