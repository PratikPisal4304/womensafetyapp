import React, { useState } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TextInput, 
  ScrollView, 
  TouchableOpacity,
  Image,
  StatusBar,
  SafeAreaView,
  Platform,
  Dimensions,
  FlatList,
  Animated
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Feather } from '@expo/vector-icons';
import { FontAwesome5 } from '@expo/vector-icons';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

export default function SkillDevelopmentScreen({ navigation }) {
  const [activeTab, setActiveTab] = useState('All');
  const scrollY = new Animated.Value(0);

  const tabs = ['All', 'Design', 'Technology', 'Business', 'Health'];

  const categories = [
    { id: 1, name: 'My Enrolled Courses', icon: 'graduation-cap', color: '#4caf50', gradient: ['#66BB6A', '#43A047'] },
    { id: 2, name: 'Upcoming Events', icon: 'calendar-alt', color: '#5e35b1', gradient: ['#7E57C2', '#5E35B1'] },
    { id: 3, name: 'Utility', icon: 'tools', color: '#ff7043', gradient: ['#FF8A65', '#FF5722'] },
  ];

  const articles = [
    { 
      id: 1, 
      title: 'Want to Keep Your Heart and Brain Young?',
      author: 'Dr. Jane Robinson',
      image: require('../../assets/icon.png'),
      tags: ['Health', 'Wellness'],
      duration: '4 weeks',
      rating: 4.7,
      students: 1240
    },
    { 
      id: 2, 
      title: 'The Healthy Power of Making Art',
      author: 'Dr. Adam Smith',
      image: require('../../assets/icon.png'),
      tags: ['Creativity', 'Mental Health'],
      duration: '3 weeks',
      rating: 4.8,
      students: 985
    },
  ];

  const recommendedCourses = [
    {
      id: 1,
      title: 'Critical Thinking Mastery',
      author: 'Professor Michael Davis',
      duration: '6 weeks',
      level: 'Intermediate',
      rating: 4.8,
      students: 2540,
      image: require('../../assets/icon.png'),
      progress: 30,
      label: 'MOST POPULAR'
    },
    {
      id: 2,
      title: 'Data Science Fundamentals',
      author: 'Dr. Lisa Chen',
      duration: '8 weeks',
      level: 'Beginner',
      rating: 4.9,
      students: 3215,
      image: require('../../assets/icon.png'),
      progress: 0,
      label: 'NEW'
    }
  ];

  const headerHeight = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [200, 120],
    extrapolate: 'clamp'
  });

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 60, 90],
    outputRange: [1, 0.3, 0],
    extrapolate: 'clamp'
  });

  return (
    <View style={styles.container}>
      {/* Pink Status Bar */}
      <StatusBar barStyle="light-content" backgroundColor="#FF4081" />
      
      {/* Pink Header Section with gradient that covers notification panel */}
      <Animated.View style={[styles.headerContainer, { height: headerHeight }]}>
        <LinearGradient 
          colors={['#FF6B9C', '#FF4081']} 
          start={[0, 0]} 
          end={[1, 1]}
          style={styles.headerGradient}
        >
          <SafeAreaView style={styles.headerContent}>
            <View style={styles.headerTop}>
              <View>
                <Text style={styles.welcomeText}>Hello, Student</Text>
                <Text style={styles.headerTitle}>Skill Development</Text>
              </View>
              <View style={styles.headerIcons}>
                <TouchableOpacity style={styles.iconButton}>
                  <Ionicons name="notifications" size={24} color="white" />
                  <View style={styles.notificationBadge}>
                    <Text style={styles.badgeText}>3</Text>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity style={styles.profileButton}>
                  <Image 
                    source={require('../../assets/icon.png')} 
                    style={styles.profileImage}
                  />
                </TouchableOpacity>
              </View>
            </View>
            
            {/* Search Bar */}
            <Animated.View style={[styles.searchBarContainer, { opacity: headerOpacity }]}>
              <View style={styles.searchBar}>
                <Feather name="search" size={20} color="gray" style={styles.searchIcon} />
                <TextInput 
                  style={styles.searchInput}
                  placeholder="What do you want to learn?"
                  placeholderTextColor="gray"
                />
                <TouchableOpacity style={styles.filterButton}>
                  <Feather name="sliders" size={18} color="#FF4081" />
                </TouchableOpacity>
              </View>
            </Animated.View>
          </SafeAreaView>
        </LinearGradient>
      </Animated.View>
      
      <Animated.ScrollView 
        showsVerticalScrollIndicator={false} 
        style={styles.scrollContainer}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
      >
        {/* Category Tabs */}
        <View style={styles.tabsContainer}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabsScrollContent}
          >
            {tabs.map((tab) => (
              <TouchableOpacity 
                key={tab} 
                style={[
                  styles.tabItem, 
                  activeTab === tab && styles.activeTabItem
                ]}
                onPress={() => setActiveTab(tab)}
              >
                <Text 
                  style={[
                    styles.tabText, 
                    activeTab === tab && styles.activeTabText
                  ]}
                >
                  {tab}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Quick Action Section */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <TouchableOpacity style={styles.seeAllButton}>
              <Text style={styles.seeAllText}>See all</Text>
              <Feather name="chevron-right" size={16} color="#FF4081" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.categoriesContainer}>
            {categories.map(category => (
              <TouchableOpacity 
                key={category.id} 
                style={styles.categoryCard}
                onPress={() => navigation.navigate('Category', { category: category.name })}
              >
                <LinearGradient 
                  colors={category.gradient} 
                  start={[0, 0]} 
                  end={[1, 1]}
                  style={styles.iconContainer}
                >
                  <FontAwesome5 name={category.icon} size={22} color="white" />
                </LinearGradient>
                <Text style={styles.categoryName}>{category.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        
        {/* Popular Courses Section */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Popular Courses</Text>
            <TouchableOpacity style={styles.seeAllButton}>
              <Text style={styles.seeAllText}>View all</Text>
              <Feather name="chevron-right" size={16} color="#FF4081" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.articlesContainer}>
            {articles.map(article => (
              <TouchableOpacity 
                key={article.id} 
                style={styles.articleCard}
                onPress={() => navigation.navigate('Article', { title: article.title, article })}
              >
                <Image source={article.image} style={styles.articleImage} />
                <View style={styles.articleContent}>
                  <View style={styles.tagContainer}>
                    {article.tags.map((tag, index) => (
                      <View key={index} style={styles.tag}>
                        <Text style={styles.tagText}>{tag}</Text>
                      </View>
                    ))}
                  </View>
                  <Text style={styles.articleTitle}>{article.title}</Text>
                  <Text style={styles.articleAuthor}>{article.author}</Text>
                  
                  <View style={styles.courseMetaContainer}>
                    <View style={styles.courseMeta}>
                      <Ionicons name="time-outline" size={14} color="#666" />
                      <Text style={styles.courseMetaText}>{article.duration}</Text>
                    </View>
                    <View style={styles.courseMeta}>
                      <Ionicons name="star" size={14} color="#FFB400" />
                      <Text style={styles.courseMetaText}>{article.rating}</Text>
                    </View>
                    <View style={styles.courseMeta}>
                      <Ionicons name="person-outline" size={14} color="#666" />
                      <Text style={styles.courseMetaText}>{article.students.toLocaleString()}</Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        
        {/* Recommended for You Section */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recommended for You</Text>
            <TouchableOpacity style={styles.seeAllButton}>
              <Text style={styles.seeAllText}>More</Text>
              <Feather name="chevron-right" size={16} color="#FF4081" />
            </TouchableOpacity>
          </View>
          
          {recommendedCourses.map(course => (
            <TouchableOpacity key={course.id} style={styles.recommendedCard}>
              <View style={styles.recommendedContent}>
                <View style={styles.recommendedInfo}>
                  <View style={styles.recommendedLabelContainer}>
                    <Text style={styles.recommendedLabel}>{course.label}</Text>
                  </View>
                  <Text style={styles.recommendedTitle}>{course.title}</Text>
                  <Text style={styles.recommendedAuthor}>{course.author}</Text>
                  
                  <View style={styles.courseMetaContainer}>
                    <View style={styles.courseMeta}>
                      <Ionicons name="time-outline" size={14} color="#666" />
                      <Text style={styles.courseMetaText}>{course.duration}</Text>
                    </View>
                    <View style={styles.courseMeta}>
                      <Ionicons name="bar-chart-outline" size={14} color="#666" />
                      <Text style={styles.courseMetaText}>{course.level}</Text>
                    </View>
                  </View>
                  
                  <View style={styles.ratingContainer}>
                    <View style={styles.starsContainer}>
                      {Array(5).fill(0).map((_, index) => (
                        <Ionicons 
                          key={index} 
                          name={index < Math.floor(course.rating) ? "star" : "star-outline"} 
                          size={16} 
                          color="#FFB400" 
                        />
                      ))}
                    </View>
                    <Text style={styles.ratingText}>{course.rating} ({course.students.toLocaleString()})</Text>
                  </View>
                  
                  {course.progress > 0 && (
                    <View style={styles.progressContainer}>
                      <View style={styles.progressBar}>
                        <View style={[styles.progressFill, { width: `${course.progress}%` }]} />
                      </View>
                      <Text style={styles.progressText}>{course.progress}% Complete</Text>
                    </View>
                  )}
                </View>
                <View style={styles.recommendedImageContainer}>
                  <Image source={course.image} style={styles.recommendedImage} />
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
        
        {/* Continue Learning Section */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Continue Learning</Text>
            <TouchableOpacity style={styles.seeAllButton}>
              <Text style={styles.seeAllText}>View all</Text>
              <Feather name="chevron-right" size={16} color="#FF4081" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.continueCard}>
            <LinearGradient 
              colors={['#7E57C2', '#5E35B1']} 
              start={[0, 0]} 
              end={[1, 1]}
              style={styles.continueGradient}
            >
              <View style={styles.continueContent}>
                <View>
                  <Text style={styles.continueTitle}>Machine Learning Basics</Text>
                  <Text style={styles.continueSubtitle}>Next: Neural Networks Introduction</Text>
                  <View style={styles.continueProgress}>
                    <View style={styles.continueProgressBar}>
                      <View style={[styles.continueProgressFill, { width: '65%' }]} />
                    </View>
                    <Text style={styles.continueProgressText}>65% Complete</Text>
                  </View>
                </View>
                <TouchableOpacity style={styles.continueButton}>
                  <Ionicons name="play" size={20} color="white" />
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </View>
        </View>
        
        {/* Add some padding at the bottom */}
        <View style={{height: 80}} />
      </Animated.ScrollView>
      
      {/* Floating Action Button */}
      <TouchableOpacity style={styles.fab}>
        <LinearGradient 
          colors={['#FF6B9C', '#FF4081']} 
          start={[0, 0]} 
          end={[1, 1]}
          style={styles.fabGradient}
        >
          <Feather name="plus" size={24} color="white" />
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fc',
  },
  headerContainer: {
    backgroundColor: '#FF4081',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    overflow: 'hidden',
  },
  headerGradient: {
    flex: 1,
  },
  headerContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    flex: 1,
    justifyContent: 'space-between',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
  },
  welcomeText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    marginRight: 16,
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#FFB400',
    borderRadius: 10,
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  profileImage: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  searchBarContainer: {
    marginTop: 20,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 48,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#333',
  },
  filterButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#FFF0F5',
  },
  scrollContainer: {
    flex: 1,
    backgroundColor: '#f8f9fc',
  },
  tabsContainer: {
    backgroundColor: 'white',
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  tabsScrollContent: {
    paddingHorizontal: 16,
  },
  tabItem: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
  },
  activeTabItem: {
    backgroundColor: '#FF4081',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  activeTabText: {
    color: 'white',
    fontWeight: '600',
  },
  sectionContainer: {
    marginTop: 24,
    paddingHorizontal: 20,
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
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  seeAllText: {
    fontSize: 14,
    color: '#FF4081',
    fontWeight: '500',
    marginRight: 2,
  },
  categoriesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  categoryCard: {
    width: '31%',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryName: {
    fontSize: 13,
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
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
  },
  articleImage: {
    width: '100%',
    height: 110,
    resizeMode: 'cover',
  },
  articleContent: {
    padding: 12,
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  tag: {
    backgroundColor: '#FFF0F5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    marginRight: 6,
    marginBottom: 4,
  },
  tagText: {
    fontSize: 10,
    color: '#FF4081',
    fontWeight: '500',
  },
  articleTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 6,
    color: '#333',
  },
  articleAuthor: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  courseMetaContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  courseMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
    marginBottom: 4,
  },
  courseMetaText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  recommendedCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    padding: 16,
    marginBottom: 12,
  },
  recommendedContent: {
    flexDirection: 'row',
  },
  recommendedInfo: {
    flex: 1,
    paddingRight: 12,
  },
  recommendedLabelContainer: {
    backgroundColor: '#FFF0F5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  recommendedLabel: {
    fontSize: 10,
    color: '#FF4081',
    fontWeight: 'bold',
  },
  recommendedTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 6,
  },
  recommendedAuthor: {
    fontSize: 13,
    color: '#666',
    marginBottom: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
  },
  starsContainer: {
    flexDirection: 'row',
    marginRight: 8,
  },
  ratingText: {
    fontSize: 12,
    color: '#666',
  },
  progressContainer: {
    marginTop: 8,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#F0F0F0',
    borderRadius: 3,
    marginBottom: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FF4081',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    color: '#666',
  },
  recommendedImageContainer: {
    width: 80,
    height: 80,
    borderRadius: 16,
    backgroundColor: '#FFF0F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  recommendedImage: {
    width: 60,
    height: 60,
    resizeMode: 'contain',
  },
  continueCard: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  continueGradient: {
    padding: 20,
  },
  continueContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  continueTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  continueSubtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 12,
  },
  continueProgress: {
    width: '90%',
  },
  continueProgressBar: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 3,
    marginBottom: 4,
    overflow: 'hidden',
  },
  continueProgressFill: {
    height: '100%',
    backgroundColor: 'white',
    borderRadius: 3,
  },
  continueProgressText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  continueButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  fabGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  }
});