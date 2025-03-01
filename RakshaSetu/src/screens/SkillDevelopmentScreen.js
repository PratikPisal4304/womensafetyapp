import React from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TextInput, 
  ScrollView, 
  TouchableOpacity,
  Image,
  StatusBar,
  SafeAreaView
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Feather } from '@expo/vector-icons';
import { FontAwesome5 } from '@expo/vector-icons';
import { Ionicons } from '@expo/vector-icons';

export default function SkillDevelopmentScreen({ navigation }) {
  const categories = [
    { id: 1, name: 'My Enrolled Courses', icon: 'brain', color: '#4caf50' },
    { id: 2, name: 'Upcoming Events', icon: 'apple-alt', color: '#5e35b1' },
    { id: 3, name: 'Utility', icon: 'apple-alt', color: '#5e35b1' },
  ];

  const articles = [
    { 
      id: 1, 
      title: 'Want to Keep Your Heart and Brain Young?',
      author: 'Dr. Jane Robinson',
      image: require('../../assets/icon.png')
    },
    { 
      id: 2, 
      title: 'The Healthy Power of Making Art',
      author: 'Dr. Adam Smith',
      image: require('../../assets/icon.png')
    },
  ];



  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#00BFA5" />
      
      {/* Search Bar Section */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Feather name="search" size={20} color="gray" style={styles.searchIcon} />
          <TextInput 
            style={styles.searchInput}
            placeholder="Search for health"
            placeholderTextColor="gray"
          />
        </View>
      </View>
      
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Quick Action Section */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Quick Action</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>See all</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.categoriesContainer}>
            {categories.map(category => (
              <TouchableOpacity 
                key={category.id} 
                style={styles.categoryCard}
                onPress={() => navigation.navigate('Category', { category: category.name })}
              >
                <View style={[styles.iconContainer, {borderColor: category.color}]}>
                  <FontAwesome5 name={category.icon} size={24} color={category.color} />
                </View>
                <Text style={styles.categoryName}>{category.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        
        {/* Popular Courses Section */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Popular Courses</Text>
          
          <View style={styles.articlesContainer}>
            {articles.map(article => (
              <TouchableOpacity 
                key={article.id} 
                style={styles.articleCard}
                onPress={() => navigation.navigate('Article', { title: article.title, article })}
              >
                <Image source={article.image} style={styles.articleImage} />
                <Text style={styles.articleAuthor}>{article.author}</Text>
                <Text style={styles.articleTitle}>{article.title}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>   
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#f5f7fa',
    },
    searchContainer: {
      backgroundColor: '#00BFA5',
      paddingHorizontal: 16,
      paddingBottom: 16,
    },
    searchBar: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'white',
      borderRadius: 8,
      paddingHorizontal: 10,
      height: 48,
    },
    searchIcon: {
      marginRight: 10,
    },
    searchInput: {
      flex: 1,
      fontSize: 16,
      color: '#333',
    },
    sectionContainer: {
      marginTop: 24,
      paddingHorizontal: 16,
    },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: '#333',
    },
    seeAllText: {
      fontSize: 14,
      color: '#00BFA5',
    },
    categoriesContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    categoryCard: {
      width: '30%',
      backgroundColor: 'white',
      borderRadius: 12,
      padding: 12,
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    iconContainer: {
      width: 50,
      height: 50,
      borderRadius: 25,
      borderWidth: 1,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 8,
    },
    categoryName: {
      fontSize: 14,
      fontWeight: '500',
      textAlign: 'center',
      color: '#333',
    },
    articlesContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    articleCard: {
      width: '48%',
      backgroundColor: 'white',
      borderRadius: 12,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
      overflow: 'hidden',
    },
    articleImage: {
      width: '100%',
      height: 100,
      resizeMode: 'cover',
    },
    articleAuthor: {
      fontSize: 12,
      color: 'gray',
      marginTop: 8,
      marginHorizontal: 12,
    },
    articleTitle: {
      fontSize: 14,
      fontWeight: 'bold',
      marginTop: 4,
      marginBottom: 12,
      marginHorizontal: 12,
      color: '#333',
    },
    exerciseScrollView: {
      marginTop: 8,
    },
    exerciseCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'white',
      borderRadius: 24,
      paddingVertical: 8,
      paddingHorizontal: 16,
      marginRight: 12,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 1,
    },
    exerciseName: {
      fontSize: 14,
      fontWeight: '500',
      marginLeft: 8,
      marginRight: 8,
      color: '#333',
    },
    pointsContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    pointsText: {
      fontSize: 12,
      marginLeft: 2,
      color: '#333',
    },
  });