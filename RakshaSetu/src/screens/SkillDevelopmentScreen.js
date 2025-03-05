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
import {
  getFirestore,
  doc,
  getDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  onSnapshot
} from 'firebase/firestore';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { app } from '../../config/firebaseConfig';

const { width, height } = Dimensions.get('window');
const HEADER_HEIGHT = 160;

// Initialize Firebase services
const db = getFirestore(app);
const auth = getAuth(app);

// Custom hook for debouncing search input
function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

// Sample data – in a real app, this would come from Firestore
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

// -----------------------
// Reusable UI Components
// -----------------------

const Header = ({
  userName,
  notifications,
  onNotificationPress,
  onProfilePress,
  searchQuery,
  setSearchQuery,
  onFocusSearch,
  onClearSearch
}) => {
  return (
    <SafeAreaView style={styles.fixedHeader}>
      <View style={styles.headerContent}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.welcomeText}>Hello, {userName}</Text>
            <Text style={styles.headerTitle}>Financial Skills Hub</Text>
          </View>
          <View style={styles.headerIcons}>
            <TouchableOpacity style={styles.iconButton} onPress={onNotificationPress}>
              <Ionicons name="notifications" size={24} color="white" />
              {notifications.some(n => !n.read) && (
                <View style={styles.notificationBadge}>
                  <Text style={styles.badgeText}>
                    {notifications.filter(n => !n.read).length}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity style={styles.profileButton} onPress={onProfilePress}>
              <Image source={require('../../assets/icon.png')} style={styles.profileImage} />
            </TouchableOpacity>
          </View>
        </View>
        <SearchBar
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onFocus={onFocusSearch}
          onClear={onClearSearch}
        />
      </View>
    </SafeAreaView>
  );
};

const SearchBar = ({ searchQuery, setSearchQuery, onFocus, onClear }) => (
  <View style={styles.searchBarContainer}>
    <View style={styles.searchBar}>
      <Feather name="search" size={20} color="gray" style={styles.searchIcon} />
      <TextInput
        style={styles.searchInput}
        placeholder="Find financial skills and courses..."
        placeholderTextColor="gray"
        value={searchQuery}
        onChangeText={setSearchQuery}
        onFocus={onFocus}
      />
      {searchQuery.length > 0 && (
        <TouchableOpacity onPress={onClear}>
          <Feather name="x" size={18} color="gray" style={{ marginRight: 8 }} />
        </TouchableOpacity>
      )}
      <TouchableOpacity
        style={styles.filterButton}
        onPress={() => Alert.alert('Filters', 'Advanced filters coming soon.')}
      >
        <Feather name="sliders" size={18} color="#ff5f96" />
      </TouchableOpacity>
    </View>
  </View>
);

const QuickActions = ({ categories, onCategoryPress }) => (
  <View style={styles.sectionContainer}>
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <TouchableOpacity
        style={styles.seeAllButton}
        onPress={() => Alert.alert('More Actions', 'Additional actions coming soon.')}
      >
        <Text style={styles.seeAllText}>See all</Text>
        <Feather name="chevron-right" size={16} color="#ff5f96" />
      </TouchableOpacity>
    </View>
    <View style={styles.categoriesContainer}>
      {categories.map(category => (
        <TouchableOpacity
          key={category.id}
          style={styles.categoryCard}
          onPress={() => onCategoryPress(category)}
          activeOpacity={0.7}
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
);

const ModuleCard = ({ module, onPress }) => (
  <TouchableOpacity
    style={styles.microLearningCard}
    onPress={() => onPress(module)}
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
);

const RecommendedCard = ({ course, onPress, onToggleFavorite, isFavorite }) => (
  <TouchableOpacity
    style={styles.recommendedCard}
    onPress={() => onPress(course)}
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
          <LinearGradient
            colors={['#9B59B6', '#ff5f96']}
            start={[0, 0]}
            end={[1, 0]}
            style={styles.aiMatchGradient}
          >
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
        <TouchableOpacity style={styles.favoriteButton} onPress={() => onToggleFavorite(course.id)}>
          <Ionicons
            name={isFavorite ? 'heart' : 'heart-outline'}
            size={20}
            color={isFavorite ? '#ff5f96' : '#666'}
          />
        </TouchableOpacity>
      </View>
    </View>
  </TouchableOpacity>
);

// -----------------------
// Main Screen Component
// -----------------------

function SkillDevelopmentScreen({ navigation }) {
  // State variables
  const [activeTab, setActiveTab] = useState('All');
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [microLearningModules, setMicroLearningModules] = useState(SAMPLE_MODULES);
  const [userName, setUserName] = useState('');
  const [budgetGoal, setBudgetGoal] = useState(0);
  const [budgetSaved, setBudgetSaved] = useState(0);
  const [budgetModalVisible, setBudgetModalVisible] = useState(false);
  const [updatedBudget, setUpdatedBudget] = useState('');
  const [favoriteCourses, setFavoriteCourses] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [notificationModalVisible, setNotificationModalVisible] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [userEnrolledCourses, setUserEnrolledCourses] = useState([]);
  const [userProgress, setUserProgress] = useState({});
  const [recommendedCourses, setRecommendedCourses] = useState([
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
  ]);

  // Tabs and quick access categories (Mentorship Hub removed)
  const tabs = ['All', 'Financial Basics', 'Investing', 'Entrepreneurship', 'Career Growth', 'Budgeting'];
  const categories = [
    { id: 1, name: 'My Learning Path', icon: 'route', gradient: ['#66BB6A', '#43A047'] },
    { id: 2, name: 'Budget Tools', icon: 'calculator', gradient: ['#FF8A65', '#FF5722'] }
  ];

  // Debounced search query for smoother filtering
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Scroll value (for pull-to-refresh)
  const scrollY = useRef(new Animated.Value(0)).current;

  // Fetch user data from Firestore
  const fetchUserData = async (userId) => {
    try {
      setIsLoading(true);
      const userDocRef = doc(db, 'users', userId);
      const userDocSnap = await getDoc(userDocRef);
      if (userDocSnap.exists()) {
        const userData = userDocSnap.data();
        setUserName(userData.name || userData.displayName || 'User');
        setBudgetGoal(userData.budgetGoal || 300);
        setBudgetSaved(userData.budgetSaved || 135);
        if (userData.favoriteCourses) {
          setFavoriteCourses(userData.favoriteCourses);
          setRecommendedCourses(prev =>
            prev.map(course => ({
              ...course,
              favorite: userData.favoriteCourses.includes(course.id)
            }))
          );
        }
        if (userData.enrolledCourses) {
          setUserEnrolledCourses(userData.enrolledCourses);
          const progressData = userData.courseProgress || {};
          setUserProgress(progressData);
          const updatedModules = [...microLearningModules];
          Object.keys(progressData).forEach(courseId => {
            const moduleIndex = updatedModules.findIndex(m => m.id.toString() === courseId);
            if (moduleIndex !== -1) {
              updatedModules[moduleIndex].completionPercent = progressData[courseId].percentComplete || 0;
              updatedModules[moduleIndex].completion = `${progressData[courseId].completedModules || 0}/${progressData[courseId].totalModules || 5} modules`;
            }
          });
          setMicroLearningModules(updatedModules);
        }
        const userNotificationsRef = collection(db, 'notifications');
        const q = query(userNotificationsRef, where('userId', '==', userId));
        const notificationsSnapshot = await getDocs(q);
        if (!notificationsSnapshot.empty) {
          const notificationsData = notificationsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          setNotifications(notificationsData);
        } else {
          setNotifications([
            { id: 1, title: 'New mentor available', read: false },
            { id: 2, title: 'Course completion reminder', read: false }
          ]);
        }
      } else {
        console.log('No such document!');
        setUserName('User');
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      Alert.alert('Error', 'Failed to load profile data. Please try again.');
      setUserName('User');
    } finally {
      setIsLoading(false);
    }
  };

  // Set up real-time listener for user document
  const setupUserListener = (userId) => {
    const userDocRef = doc(db, 'users', userId);
    return onSnapshot(
      userDocRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const userData = docSnap.data();
          setUserName(userData.name || userData.displayName || 'User');
          setBudgetGoal(userData.budgetGoal || 300);
          setBudgetSaved(userData.budgetSaved || 135);
          if (userData.favoriteCourses) {
            setFavoriteCourses(userData.favoriteCourses);
            setRecommendedCourses(prev =>
              prev.map(course => ({
                ...course,
                favorite: userData.favoriteCourses.includes(course.id)
              }))
            );
          }
        }
      },
      (error) => {
        console.error('Real-time listener error:', error);
      }
    );
  };

  // Authentication listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user);
        fetchUserData(user.uid);
        const userListener = setupUserListener(user.uid);
        return () => {
          userListener();
        };
      } else {
        setCurrentUser(null);
        setUserName('Guest');
        setIsLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  // Pull-to-refresh logic
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    if (currentUser) {
      fetchUserData(currentUser.uid).then(() => setRefreshing(false));
    } else {
      setRefreshing(false);
    }
  }, [currentUser]);

  // Filter courses based on search query and active tab
  const getFilteredCourses = () => {
    let filtered = [...microLearningModules];
    if (debouncedSearchQuery) {
      filtered = filtered.filter(
        (module) =>
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

  // Toggle favorite status for a course
  const toggleFavorite = async (courseId) => {
    try {
      if (!currentUser) {
        Alert.alert('Sign In Required', 'Please sign in to save favorites.');
        return;
      }
      const isCurrentlyFavorite = favoriteCourses.includes(courseId);
      const updatedFavorites = isCurrentlyFavorite
        ? favoriteCourses.filter(id => id !== courseId)
        : [...favoriteCourses, courseId];
      setFavoriteCourses(updatedFavorites);
      setRecommendedCourses(prev =>
        prev.map(course => {
          if (course.id === courseId) {
            return { ...course, favorite: !isCurrentlyFavorite };
          }
          return course;
        })
      );
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await AsyncStorage.setItem('favoriteCourses', JSON.stringify(updatedFavorites));
      const userDocRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userDocRef, {
        favoriteCourses: updatedFavorites
      });
    } catch (error) {
      console.error('Error updating favorites:', error);
      Alert.alert('Error', 'Failed to update favorites. Please try again.');
      fetchUserData(currentUser.uid);
    }
  };

  // Mark notifications as read and update Firestore
  const markNotificationsAsRead = async () => {
    try {
      if (!currentUser) return;
      const updatedNotifications = notifications.map(notification => ({
        ...notification,
        read: true
      }));
      setNotifications(updatedNotifications);
      for (const notification of updatedNotifications) {
        if (notification.id && !notification.read) {
          const notificationRef = doc(db, 'notifications', notification.id);
          await updateDoc(notificationRef, { read: true });
        }
      }
    } catch (error) {
      console.error('Error marking notifications as read:', error);
    }
  };

  // Navigation to course detail screen
  const navigateToCourseDetail = (course) => {
    navigation.navigate('CourseDetail', {
      courseId: course.id,
      courseName: course.title
    });
  };

  // Update user's budget goal in Firestore
  const updateBudgetGoal = async () => {
    try {
      if (!currentUser) {
        Alert.alert('Sign In Required', 'Please sign in to update your budget goal.');
        return;
      }
      const newBudgetGoal = parseFloat(updatedBudget);
      if (isNaN(newBudgetGoal) || newBudgetGoal <= 0) {
        Alert.alert('Invalid Amount', 'Please enter a valid budget amount.');
        return;
      }
      setBudgetGoal(newBudgetGoal);
      const userDocRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userDocRef, { budgetGoal: newBudgetGoal });
      setBudgetModalVisible(false);
      setUpdatedBudget('');
    } catch (error) {
      console.error('Error updating budget goal:', error);
      Alert.alert('Error', 'Failed to update budget goal. Please try again.');
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#ff5f96" />
        <Text style={{ marginTop: 20, color: '#666' }}>
          Loading your personalized content...
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header
        userName={userName}
        notifications={notifications}
        onNotificationPress={() => {
          setNotificationModalVisible(true);
          markNotificationsAsRead();
        }}
        onProfilePress={() => navigation.navigate('Profile')}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onFocusSearch={() => setShowSearch(true)}
        onClearSearch={() => setSearchQuery('')}
      />
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
        {/* Tabs Section */}
        <View style={styles.tabsContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsScrollContent}>
            {tabs.map(tab => (
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
        {/* Quick Actions Section */}
        <QuickActions
          categories={categories}
          onCategoryPress={(category) => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            if (category.name === 'Budget Tools') {
              navigation.navigate('BudgetTool');
            } else if (category.name === 'My Learning Path') {
              navigation.navigate('LearningPath', { userId: currentUser?.uid });
            } else {
              Alert.alert(category.name, `You selected: ${category.name}`);
            }
          }}
        />
        {/* Micro-Learning Modules */}
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
              <ModuleCard key={module.id} module={module} onPress={navigateToCourseDetail} />
            ))}
          </View>
        </View>
        {/* Personalized Recommendations */}
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
          {recommendedCourses.map(course => (
            <RecommendedCard
              key={course.id}
              course={course}
              onPress={navigateToCourseDetail}
              onToggleFavorite={toggleFavorite}
              isFavorite={favoriteCourses.includes(course.id)}
            />
          ))}
        </View>
        <View style={{ height: 80 }} />
      </Animated.ScrollView>

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
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setNotificationModalVisible(false)}
            >
              <Text style={styles.modalCloseButtonText}>Close</Text>
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
    zIndex: 100,
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
  searchBarContainer: { marginTop: 10 },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', borderRadius: 12, paddingHorizontal: 16, height: 48, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, fontSize: 15, color: '#333' },
  filterButton: { padding: 8, borderRadius: 8, backgroundColor: '#F5EEF8' },
  scrollContainer: { flex: 1, backgroundColor: '#f8f9fc' },
  tabsContainer: { backgroundColor: 'white', top: 25, marginBottom: 5, paddingVertical: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
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
  categoriesContainer: { flexDirection: 'row', justifyContent: 'space-between' },
  categoryCard: { width: '48%', backgroundColor: 'white', borderRadius: 16, padding: 16, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 3 },
  iconContainer: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  categoryName: { fontSize: 13, fontWeight: '500', textAlign: 'center', color: '#333' },
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
  progressFill: { height: '100%', backgroundColor: '#ff5f96', borderRadius: 3 },
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
  modalContainer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '80%', backgroundColor: 'white', borderRadius: 16, padding: 20, alignItems: 'center' },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 12 },
  modalScrollView: { maxHeight: 200, width: '100%', marginVertical: 10 },
  modalCloseButton: { marginTop: 10 },
  modalCloseButtonText: { color: '#ff5f96', fontSize: 16 },
  notificationItem: { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#eee', width: '100%' },
  notificationText: { fontSize: 16, color: '#333' },
});

export default SkillDevelopmentScreen;
