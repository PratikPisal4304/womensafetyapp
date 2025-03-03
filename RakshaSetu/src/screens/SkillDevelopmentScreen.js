import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  Animated,
  Alert,
  RefreshControl,
  ActivityIndicator,
  Modal
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Feather, FontAwesome5, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

const { width, height } = Dimensions.get('window');
const HEADER_HEIGHT = 160; // Adjust this constant to match your fixed header's height

// Custom hook for debouncing search input
function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

// Sample data - in a real app, this would come from an API
const SAMPLE_MODULES = [
  { 
    id: 1, 
    title: 'Negotiating Your Worth: Salary Talks',
    author: 'Dr. Maria Rodriguez',
    image: require('../../assets/icon.png'),
    tags: ['Career', 'Negotiation'],
    duration: '15 min',
    rating: 4.7,
    students: 1240,
    completion: '3/5 modules',
    completionPercent: 60
  },
  { 
    id: 2, 
    title: 'Emergency Funds: Building Financial Security',
    author: 'Sarah Johnson, CFP',
    image: require('../../assets/icon.png'),
    tags: ['Finance', 'Planning'],
    duration: '10 min',
    rating: 4.8,
    students: 985,
    completion: '2/4 modules',
    completionPercent: 50
  },
  { 
    id: 3, 
    title: 'Investment Basics: Start Your Portfolio',
    author: 'Rachel Chen, MBA',
    image: require('../../assets/icon.png'),
    tags: ['Investing', 'Basics'],
    duration: '12 min',
    rating: 4.6,
    students: 1580,
    completion: '0/5 modules',
    completionPercent: 0
  },
];

function SkillDevelopmentScreen({ navigation }) {
  // State variables
  const [activeTab, setActiveTab] = useState('All');
  const [skillRecommendations, setSkillRecommendations] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [microLearningModules, setMicroLearningModules] = useState(SAMPLE_MODULES);
  const [userName, setUserName] = useState('Maria');
  const [budgetGoal, setBudgetGoal] = useState(300);
  const [budgetSaved, setBudgetSaved] = useState(135);
  const [budgetModalVisible, setBudgetModalVisible] = useState(false);
  const [updatedBudget, setUpdatedBudget] = useState('');
  const [favoriteCourses, setFavoriteCourses] = useState([]);
  const [notifications, setNotifications] = useState([
    { id: 1, title: 'New mentor available', read: false },
    { id: 2, title: 'Course completion reminder', read: false }
  ]);
  const [notificationModalVisible, setNotificationModalVisible] = useState(false);

  // Scroll value (for pull-to-refresh)
  const scrollY = useRef(new Animated.Value(0)).current;

  // Debounced search query for smoother filtering
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Tabs and quick access categories
  const tabs = ['All', 'Financial Basics', 'Investing', 'Entrepreneurship', 'Career Growth', 'Budgeting'];
  const categories = [
    { id: 1, name: 'My Learning Path', icon: 'route', gradient: ['#66BB6A', '#43A047'] },
    { id: 2, name: 'Mentorship Hub', icon: 'users', gradient: ['#7E57C2', '#5E35B1'] },
    { id: 3, name: 'Budget Tools', icon: 'calculator', gradient: ['#FF8A65', '#FF5722'] },
  ];

  // AI-recommended courses and mentors
  const aiRecommendedCourses = [
    {
      id: 1,
      title: 'Investment Fundamentals for Women',
      author: 'Financial Educator Network',
      duration: '3 weeks',
      level: 'Beginner',
      rating: 4.8,
      students: 2540,
      image: require('../../assets/icon.png'),
      progress: 30,
      label: 'PERSONALIZED',
      matchScore: '93% match',
      localContext: true,
      favorite: false
    },
    {
      id: 2,
      title: 'Digital Marketing for Small Business',
      author: 'Women Entrepreneurs Alliance',
      duration: '4 weeks',
      level: 'Intermediate',
      rating: 4.9,
      students: 3215,
      image: require('../../assets/icon.png'),
      progress: 0,
      label: 'IN DEMAND',
      matchScore: '87% match',
      localContext: true,
      favorite: false
    },
    {
      id: 3,
      title: 'Financial Independence Roadmap',
      author: 'Maya Johnson',
      duration: '6 weeks',
      level: 'All Levels',
      rating: 4.7,
      students: 1890,
      image: require('../../assets/icon.png'),
      progress: 15,
      label: 'TRENDING',
      matchScore: '85% match',
      localContext: false,
      favorite: false
    }
  ];


  // Load user data from AsyncStorage
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const savedName = await AsyncStorage.getItem('userName');
        const savedBudgetGoal = await AsyncStorage.getItem('budgetGoal');
        const savedBudgetSaved = await AsyncStorage.getItem('budgetSaved');
        const savedFavorites = await AsyncStorage.getItem('favoriteCourses');
        if (savedName) setUserName(savedName);
        if (savedBudgetGoal) setBudgetGoal(parseInt(savedBudgetGoal));
        if (savedBudgetSaved) setBudgetSaved(parseInt(savedBudgetSaved));
        if (savedFavorites) setFavoriteCourses(JSON.parse(savedFavorites));
      } catch (error) {
        console.error('Error loading user data:', error);
      }
    };
    loadUserData();
    getSkillRecommendations();
  }, []);

  // Pull-to-refresh logic
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    getSkillRecommendations(true);
  }, []);

  // Simulated API call for skill recommendations
  const getSkillRecommendations = (isRefreshing = false) => {
    if (!isRefreshing) setIsLoading(true);
    setTimeout(() => {
      setSkillRecommendations([
        { skillName: 'Financial Analysis', relevance: 92, demandGrowth: '+34%', localJobs: 56 },
        { skillName: 'Digital Literacy', relevance: 88, demandGrowth: '+28%', localJobs: 42 },
        { skillName: 'Leadership', relevance: 85, demandGrowth: '+18%', localJobs: 87 }
      ]);
      setIsLoading(false);
      setRefreshing(false);
    }, 1500);
  };

  // Filter courses based on debounced search query and active tab
  const getFilteredCourses = () => {
    let filtered = [...microLearningModules];
    if (debouncedSearchQuery) {
      filtered = filtered.filter(module => 
        module.title.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
        module.author.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
        module.tags.some(tag => tag.toLowerCase().includes(debouncedSearchQuery.toLowerCase()))
      );
    }
    if (activeTab !== 'All') {
      filtered = filtered.filter(module => 
        module.tags.some(tag => tag.includes(activeTab.split(' ')[0]))
      );
    }
    return filtered;
  };

  // Handle budget update with validation and haptic feedback
  const handleBudgetUpdate = () => {
    const newAmount = parseInt(updatedBudget);
    if (isNaN(newAmount) || newAmount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount');
      return;
    }
    setBudgetSaved(newAmount);
    AsyncStorage.setItem('budgetSaved', newAmount.toString());
    setBudgetModalVisible(false);
    setUpdatedBudget('');
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    if (newAmount >= budgetGoal) {
      Alert.alert(
        'Congratulations!',
        'You\'ve reached your savings goal! Would you like to set a new goal?',
        [
          { text: 'Not now', style: 'cancel' },
          { text: 'Set new goal', onPress: () => Alert.alert('Coming Soon', 'This feature will be available in the next update.') }
        ]
      );
    }
  };

  // Toggle course favorite status and persist state
  const toggleFavorite = (courseId) => {
    const updatedCourses = aiRecommendedCourses.map(course => {
      if (course.id === courseId) return { ...course, favorite: !course.favorite };
      return course;
    });
    const favoriteIds = updatedCourses.filter(course => course.favorite).map(course => course.id);
    setFavoriteCourses(favoriteIds);
    AsyncStorage.setItem('favoriteCourses', JSON.stringify(favoriteIds));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  // Mark notifications as read
  const markNotificationsAsRead = () => {
    const updatedNotifications = notifications.map(notification => ({ ...notification, read: true }));
    setNotifications(updatedNotifications);
  };

  // Navigation placeholder for course detail
  const navigateToCourseDetail = (course) => {
    Alert.alert('Course Selected', `You selected: ${course.title}`);
  };



  return (
    <View style={styles.container}>
      {/* Fixed Header (includes title and static search bar) */}
      <View style={styles.fixedHeader}>
        <SafeAreaView style={styles.headerContent}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.welcomeText}>Hello, {userName}</Text>
              <Text style={styles.headerTitle}>Financial Skills Hub</Text>
            </View>
            <View style={styles.headerIcons}>
              <TouchableOpacity 
                style={styles.iconButton}
                onPress={() => {
                  setNotificationModalVisible(true);
                  markNotificationsAsRead();
                }}
              >
                <Ionicons name="notifications" size={24} color="white" />
                {notifications.some(n => !n.read) && (
                  <View style={styles.notificationBadge}>
                    <Text style={styles.badgeText}>{notifications.filter(n => !n.read).length}</Text>
                  </View>
                )}
              </TouchableOpacity>
              <TouchableOpacity style={styles.profileButton} onPress={() => Alert.alert('Profile', 'Profile settings coming soon.')}>
                <Image source={require('../../assets/icon.png')} style={styles.profileImage} />
              </TouchableOpacity>
            </View>
          </View>
          {/* Static Search Bar */}
          <View style={styles.searchBarContainer}>
            <View style={styles.searchBar}>
              <Feather name="search" size={20} color="gray" style={styles.searchIcon} />
              <TextInput 
                style={styles.searchInput}
                placeholder="Find financial skills and courses..."
                placeholderTextColor="gray"
                value={searchQuery}
                onChangeText={setSearchQuery}
                onFocus={() => setShowSearch(true)}
              />
              <TouchableOpacity style={styles.filterButton} onPress={() => Alert.alert('Filters', 'Advanced filters coming soon.')}>
                <Feather name="sliders" size={18} color="#ff5f96" />
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </View>

      {/* Scrollable Content with Top Padding */}
      <Animated.ScrollView
        style={[styles.scrollContainer, { marginTop: HEADER_HEIGHT }]}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#ff5f96']} tintColor="#ff5f96" />
        }
      >
        {/* Category Tabs */}
        <View style={styles.tabsContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsScrollContent}>
            {tabs.map((tab) => (
              <TouchableOpacity 
                key={tab} 
                style={[styles.tabItem, activeTab === tab && styles.activeTabItem]}
                onPress={() => {
                  setActiveTab(tab);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
              >
                <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>{tab}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Quick Action Section */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <TouchableOpacity style={styles.seeAllButton} onPress={() => Alert.alert('More Actions', 'Additional actions coming soon.')}>
              <Text style={styles.seeAllText}>See all</Text>
              <Feather name="chevron-right" size={16} color="#ff5f96" />
            </TouchableOpacity>
          </View>
          <View style={styles.categoriesContainer}>
            {categories.map(category => (
              <TouchableOpacity 
                key={category.id} 
                style={styles.categoryCard}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  if (category.name === 'Budget Tools' ) {
                    navigation.navigate('BudgetTool');
                  } else {
                  Alert.alert(category.name, `You selected: ${category.name}`);
                  }
                }}
                activeOpacity={0.7}
              >
                <LinearGradient colors={category.gradient} start={[0, 0]} end={[1, 1]} style={styles.iconContainer}>
                  <FontAwesome5 name={category.icon} size={22} color="white" />
                </LinearGradient>
                <Text style={styles.categoryName}>{category.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* AI Skill Analysis Section */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Your Skills Analysis</Text>
            <TouchableOpacity 
              style={styles.refreshButton}
              onPress={() => { setIsLoading(true); getSkillRecommendations(); }}
              disabled={isLoading}
            >
              <Text style={styles.refreshText}>Refresh</Text>
              <Feather name="refresh-cw" size={16} color="#ff5f96" style={isLoading ? { transform: [{ rotate: '45deg' }] } : null} />
            </TouchableOpacity>
          </View>
          <View style={styles.aiAnalysisCard}>
            <View style={styles.aiCardHeader}>
              <View style={styles.aiTitleContainer}>
                <FontAwesome5 name="brain" size={18} color="#ff5f96" style={styles.aiIcon} />
                <Text style={styles.aiCardTitle}>AI-Powered Skills Match</Text>
              </View>
              <Text style={styles.aiCardSubtitle}>Based on your profile, local market, and career goals</Text>
            </View>
            {isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#ff5f96" style={{ marginBottom: 10 }} />
                <Text style={styles.loadingText}>Analyzing your skills profile...</Text>
              </View>
            ) : (
              <View style={styles.skillRecommendationsContainer}>
                {skillRecommendations.map((skill, index) => (
                  <View key={index} style={styles.skillRecommendation}>
                    <View style={styles.skillNameContainer}>
                      <Text style={styles.skillName}>{skill.skillName}</Text>
                      <View style={styles.relevanceTag}>
                        <Text style={styles.relevanceText}>{skill.relevance}% match</Text>
                      </View>
                    </View>
                    <View style={styles.skillMetricsContainer}>
                      <View style={styles.skillMetric}>
                        <Text style={styles.metricLabel}>Growth</Text>
                        <Text style={[styles.metricValue, { color: '#4CAF50' }]}>{skill.demandGrowth}</Text>
                      </View>
                      <View style={styles.skillMetric}>
                        <Text style={styles.metricLabel}>Local Jobs</Text>
                        <Text style={styles.metricValue}>{skill.localJobs}</Text>
                      </View>
                      <TouchableOpacity 
                        style={styles.exploreButton}
                        onPress={() => Alert.alert('Explore Skill', `Learn more about ${skill.skillName} opportunities`)}
                      >
                        <Text style={styles.exploreText}>Explore</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
                <TouchableOpacity 
                  style={styles.fullAnalysisButton}
                  onPress={() => Alert.alert('Full Analysis', 'Complete skills assessment coming soon.')}
                >
                  <Text style={styles.fullAnalysisText}>View Full Skills Analysis</Text>
                  <Feather name="arrow-right" size={16} color="#ff5f96" />
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>

        {/* Micro-Learning Section */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Micro-Learning Modules</Text>
            <TouchableOpacity 
              style={styles.seeAllButton}
              onPress={() => Alert.alert('All Modules', 'View all available learning modules')}
            >
              <Text style={styles.seeAllText}>View all</Text>
              <Feather name="chevron-right" size={16} color="#ff5f96" />
            </TouchableOpacity>
          </View>
          <View style={styles.microLearningContainer}>
            {getFilteredCourses().map(module => (
              <TouchableOpacity 
                key={module.id} 
                style={styles.microLearningCard}
                onPress={() => navigateToCourseDetail(module)}
                activeOpacity={0.8}
              >
                <View style={styles.moduleImageContainer}>
                  <Image source={module.image} style={styles.moduleImage} />
                  <View style={styles.moduleDurationTag}>
                    <Ionicons name="time-outline" size={12} color="white" />
                    <Text style={styles.moduleDurationText}>{module.duration}</Text>
                  </View>
                </View>
                <View style={styles.moduleContent}>
                  <View style={styles.tagContainer}>
                    {module.tags.map((tag, index) => (
                      <View key={index} style={styles.tag}>
                        <Text style={styles.tagText}>{tag}</Text>
                      </View>
                    ))}
                  </View>
                  <Text style={styles.moduleTitle}>{module.title}</Text>
                  <Text style={styles.moduleAuthor}>{module.author}</Text>
                  <View style={styles.moduleProgressContainer}>
                    <View style={styles.progressBar}>
                      <View style={[styles.progressFill, { width: `${module.completionPercent}%` }]} />
                    </View>
                    <Text style={styles.progressText}>{module.completion}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Personalized Recommendations Section */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Personalized For You</Text>
            <TouchableOpacity 
              style={styles.seeAllButton}
              onPress={() => Alert.alert('More Recommendations', 'View all personalized course recommendations')}
            >
              <Text style={styles.seeAllText}>More</Text>
              <Feather name="chevron-right" size={16} color="#ff5f96" />
            </TouchableOpacity>
          </View>
          {aiRecommendedCourses.map(course => (
            <TouchableOpacity 
              key={course.id} 
              style={styles.recommendedCard}
              onPress={() => navigateToCourseDetail(course)}
              activeOpacity={0.8}
            >
              <View style={styles.recommendedContent}>
                <View style={styles.recommendedInfo}>
                  <View style={styles.recommendedTopLabels}>
                    <View style={styles.recommendedLabelContainer}>
                      <Text style={styles.recommendedLabel}>{course.label}</Text>
                    </View>
                    {course.localContext && (
                      <View style={styles.localContextTag}>
                        <Ionicons name="location" size={12} color="#ff5f96" />
                        <Text style={styles.localContextText}>Local</Text>
                      </View>
                    )}
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
                  <View style={styles.aiMatchContainer}>
                    <LinearGradient colors={['#9B59B6', '#ff5f96']} start={[0, 0]} end={[1, 0]} style={styles.aiMatchGradient}>
                      <Text style={styles.aiMatchText}>{course.matchScore}</Text>
                    </LinearGradient>
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
                <View style={styles.recommendedActions}>
                  <TouchableOpacity style={styles.favoriteButton} onPress={() => toggleFavorite(course.id)}>
                    <Ionicons name={course.favorite ? "heart" : "heart-outline"} size={20} color={course.favorite ? "#ff5f96" : "#666"} />
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>


        {/* Bottom Padding */}
        <View style={{ height: 80 }} />
      </Animated.ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity style={styles.fab} onPress={() => Alert.alert('Add New', 'Floating action pressed')}>
        <LinearGradient colors={['#9B59B6', '#ff5f96']} start={[0, 0]} end={[1, 1]} style={styles.fabGradient}>
          <Feather name="plus" size={24} color="white" />
        </LinearGradient>
      </TouchableOpacity>

      {/* Notification Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={notificationModalVisible}
        onRequestClose={() => setNotificationModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Notifications</Text>
            <ScrollView style={styles.modalScrollView}>
              {notifications.map(notification => (
                <View key={notification.id} style={styles.notificationItem}>
                  <Text style={styles.notificationText}>{notification.title}</Text>
                </View>
              ))}
            </ScrollView>
            <TouchableOpacity style={styles.modalCloseButton} onPress={() => setNotificationModalVisible(false)}>
              <Text style={styles.modalCloseButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Budget Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={budgetModalVisible}
        onRequestClose={() => setBudgetModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Update Savings</Text>
            <TextInput 
              style={styles.modalInput}
              placeholder="Enter saved amount"
              keyboardType="numeric"
              value={updatedBudget}
              onChangeText={setUpdatedBudget}
            />
            <TouchableOpacity style={styles.modalButton} onPress={handleBudgetUpdate}>
              <Text style={styles.modalButtonText}>Update</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.modalButton, { backgroundColor: '#ccc' }]} onPress={() => setBudgetModalVisible(false)}>
              <Text style={styles.modalButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fc' },
  fixedHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: '#ff5f96',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    paddingBottom: 10,
    zIndex: 100, // Ensure it stays on top
    elevation: 3,
  },
  headerContent: { paddingHorizontal: 20 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 },
  welcomeText: { fontSize: 14, color: 'rgba(255,255,255,0.9)', marginBottom: 4 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: 'white' },
  headerIcons: { flexDirection: 'row', alignItems: 'center' },
  iconButton: { marginRight: 16, position: 'relative' },
  notificationBadge: { position: 'absolute', top: -5, right: -5, backgroundColor: '#FF8C00', borderRadius: 10, width: 16, height: 16, justifyContent: 'center', alignItems: 'center' },
  badgeText: { color: 'white', fontSize: 10, fontWeight: 'bold' },
  profileButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'white', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
  profileImage: { width: 36, height: 36, borderRadius: 18 },
  searchBarContainer: { marginTop: 10},
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', borderRadius: 12, paddingHorizontal: 16, height: 48, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, fontSize: 15, color: '#333' },
  filterButton: { padding: 8, borderRadius: 8, backgroundColor: '#F5EEF8' },
  scrollContainer: { flex: 1, backgroundColor: '#f8f9fc' },
  tabsContainer: { backgroundColor: 'white',top:25,marginBottom:5, paddingVertical:5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  tabsScrollContent: { paddingHorizontal: 16 },
  tabItem: { paddingHorizontal: 16, paddingVertical: 8, marginRight: 8, borderRadius: 20 },
  activeTabItem: { backgroundColor: '#ff5f96' },
  tabText: { fontSize: 14, fontWeight: '500', color: '#666' },
  activeTabText: { color: 'white', fontWeight: '600' },
  sectionContainer: { marginTop: 24, paddingHorizontal: 20 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  seeAllButton: { flexDirection: 'row', alignItems: 'center' },
  seeAllText: { fontSize: 14, color: '#ff5f96', fontWeight: '500', marginRight: 2 },
  refreshButton: { flexDirection: 'row', alignItems: 'center' },
  refreshText: { fontSize: 14, color: '#ff5f96', fontWeight: '500', marginRight: 4 },
  categoriesContainer: { flexDirection: 'row', justifyContent: 'space-between' },
  categoryCard: { width: '31%', backgroundColor: 'white', borderRadius: 16, padding: 16, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 3 },
  iconContainer: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  categoryName: { fontSize: 13, fontWeight: '500', textAlign: 'center', color: '#333' },
  aiAnalysisCard: { backgroundColor: 'white', borderRadius: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 3, padding: 16 },
  aiCardHeader: { marginBottom: 16 },
  aiTitleContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  aiIcon: { marginRight: 8 },
  aiCardTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  aiCardSubtitle: { fontSize: 13, color: '#666', marginLeft: 26 },
  loadingContainer: { padding: 20, alignItems: 'center' },
  loadingText: { fontSize: 15, color: '#666', fontStyle: 'italic' },
  skillRecommendationsContainer: { marginTop: 8 },
  skillRecommendation: { marginBottom: 16, borderBottomWidth: 1, borderBottomColor: '#F0F0F0', paddingBottom: 16 },
  skillNameContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  skillName: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  relevanceTag: { backgroundColor: '#F5EEF8', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  relevanceText: { fontSize: 12, fontWeight: '600', color: '#ff5f96' },
  skillMetricsContainer: { flexDirection: 'row', alignItems: 'center' },
  skillMetric: { marginRight: 24 },
  metricLabel: { fontSize: 12, color: '#666', marginBottom: 2 },
  metricValue: { fontSize: 14, fontWeight: '600', color: '#333' },
  exploreButton: { backgroundColor: '#ff5f96', paddingHorizontal: 16, paddingVertical: 6, borderRadius: 8, marginLeft: 'auto' },
  exploreText: { fontSize: 13, fontWeight: '600', color: 'white' },
  fullAnalysisButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 8, padding: 12, backgroundColor: '#F5EEF8', borderRadius: 8 },
  fullAnalysisText: { fontSize: 14, fontWeight: '600', color: '#ff5f96' },
  microLearningContainer: { marginBottom: 16 },
  microLearningCard: { backgroundColor: 'white', borderRadius: 16, overflow: 'hidden', marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 3 },
  moduleImageContainer: { width: '100%', height: 120, position: 'relative' },
  moduleImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  moduleDurationTag: { position: 'absolute', bottom: 8, right: 8, backgroundColor: 'rgba(0,0,0,0.6)', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  moduleDurationText: { color: 'white', fontSize: 12, marginLeft: 4 },
  moduleContent: { padding: 12 },
  tagContainer: { flexDirection: 'row', marginBottom: 8 },
  tag: { backgroundColor: '#F5EEF8', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, marginRight: 8 },
  tagText: { fontSize: 12, color: '#ff5f96' },
  moduleTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 4 },
  moduleAuthor: { fontSize: 14, color: '#666', marginBottom: 8 },
  moduleProgressContainer: { flexDirection: 'row', alignItems: 'center' },
  progressBar: { flex: 1, height: 6, backgroundColor: '#eee', borderRadius: 3, marginRight: 8 },
  progressFill: { height: '100%', backgroundColor: '#ff5f96', borderRadius: 3, width: '50%' },
  progressText: { fontSize: 12, color: '#666' },
  recommendedCard: { backgroundColor: 'white', borderRadius: 16, padding: 16, marginBottom: 16, flexDirection: 'row', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 3 },
  recommendedContent: { flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  recommendedInfo: { flex: 1, paddingRight: 12 },
  recommendedTopLabels: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  recommendedLabelContainer: { backgroundColor: '#F5EEF8', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, marginRight: 8 },
  recommendedLabel: { fontSize: 12, fontWeight: '600', color: '#ff5f96' },
  localContextTag: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#E8EAF6', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  localContextText: { fontSize: 12, color: '#ff5f96', marginLeft: 4 },
  recommendedTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 4 },
  recommendedAuthor: { fontSize: 14, color: '#666', marginBottom: 8 },
  courseMetaContainer: { flexDirection: 'row', marginBottom: 8 },
  courseMeta: { flexDirection: 'row', alignItems: 'center', marginRight: 16 },
  courseMetaText: { fontSize: 12, color: '#666', marginLeft: 4 },
  aiMatchContainer: { marginBottom: 8 },
  aiMatchGradient: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, alignSelf: 'flex-start' },
  aiMatchText: { fontSize: 12, color: 'white', fontWeight: '600' },
  progressContainer: { marginTop: 8 },
  recommendedActions: { justifyContent: 'center', alignItems: 'center' },
  favoriteButton: { padding: 8 },
  fab: { position: 'absolute', bottom: 20, right: 20 },
  fabGradient: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 5 },
  modalContainer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '80%', backgroundColor: 'white', borderRadius: 16, padding: 20, alignItems: 'center' },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 12 },
  modalInput: { width: '100%', borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 10, marginBottom: 12 },
  modalButton: { backgroundColor: '#ff5f96', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8, marginVertical: 6, width: '100%', alignItems: 'center' },
  modalButtonText: { color: 'white', fontSize: 16 },
  modalCloseButton: { marginTop: 10 },
  modalCloseButtonText: { color: '#ff5f96', fontSize: 16 },
  modalScrollView: { maxHeight: 200, width: '100%', marginVertical: 10 },
  notificationItem: { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#eee', width: '100%' },
  notificationText: { fontSize: 16, color: '#333' },
});

export default SkillDevelopmentScreen;
