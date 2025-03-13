import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  Alert,
  StatusBar,
  Platform,
  SafeAreaView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather, Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { getFirestore, doc, getDoc, onSnapshot } from 'firebase/firestore';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { app } from '../../config/firebaseConfig';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';

const { width, height } = Dimensions.get('window');
const db = getFirestore(app);
const auth = getAuth(app);

function MyLearningPathScreen() {
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userName, setUserName] = useState('');
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [recommendedCourses, setRecommendedCourses] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [learningStats, setLearningStats] = useState({ 
    totalHours: 0, 
    coursesCompleted: 0,
    streakDays: 0,
    nextMilestone: 5
  });
  const [activeTab, setActiveTab] = useState('enrolled');
  const navigation = useNavigation();

  // Fetch user data and learning path
  const fetchUserData = async (userId) => {
    try {
      setIsLoading(true);
      const userDocRef = doc(db, 'users', userId);
      const userDocSnap = await getDoc(userDocRef);
      if (userDocSnap.exists()) {
        const userData = userDocSnap.data();
        setUserName(userData.name || userData.displayName || 'User');
        
        if (userData.enrolledCourses) {
          // Sort by last accessed or progress percentage
          const sortedCourses = [...userData.enrolledCourses].sort((a, b) => 
            (b.lastAccessed?.toDate() || 0) - (a.lastAccessed?.toDate() || 0)
          );
          setEnrolledCourses(sortedCourses);
        }
        
        if (userData.recommendedCourses) {
          setRecommendedCourses(userData.recommendedCourses);
        }
        
        // Calculate learning stats
        setLearningStats({
          totalHours: userData.totalLearningHours || 0,
          coursesCompleted: userData.completedCourses?.length || 0,
          streakDays: userData.learningStreak || 0,
          nextMilestone: userData.nextMilestone || 5
        });
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

  // Set up Firestore real-time listener
  const setupUserListener = (userId) => {
    const userDocRef = doc(db, 'users', userId);
    return onSnapshot(
      userDocRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const userData = docSnap.data();
          setUserName(userData.name || userData.displayName || 'User');
          
          if (userData.enrolledCourses) {
            // Sort by last accessed or progress percentage
            const sortedCourses = [...userData.enrolledCourses].sort((a, b) => 
              (b.lastAccessed?.toDate() || 0) - (a.lastAccessed?.toDate() || 0)
            );
            setEnrolledCourses(sortedCourses);
          }
          
          if (userData.recommendedCourses) {
            setRecommendedCourses(userData.recommendedCourses);
          }
          
          // Calculate learning stats
          setLearningStats({
            totalHours: userData.totalLearningHours || 0,
            coursesCompleted: userData.completedCourses?.length || 0,
            streakDays: userData.learningStreak || 0,
            nextMilestone: userData.nextMilestone || 5
          });
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

  // Refresh data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (currentUser) {
        fetchUserData(currentUser.uid);
      }
    }, [currentUser])
  );

  // Pull-to-refresh logic
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    if (currentUser) {
      fetchUserData(currentUser.uid).then(() => setRefreshing(false));
    } else {
      setRefreshing(false);
    }
  }, [currentUser]);

  const handleCoursePress = useCallback((courseId) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate('CourseDetail', { courseId });
  }, [navigation]);

  // Render loading state
  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <StatusBar barStyle="light-content" backgroundColor="#ff5f96" />
        <ActivityIndicator size="large" color="#ff5f96" />
        <Text style={{ marginTop: 20, color: '#666', fontWeight: '500' }}>Loading your learning path...</Text>
      </SafeAreaView>
    );
  }

  // Render stats card
  const renderStatsCard = () => (
    <View style={styles.statsContainer}>
      <View style={styles.statCard}>
        <FontAwesome5 name="clock" size={20} color="#ff5f96" />
        <Text style={styles.statValue}>{learningStats.totalHours}h</Text>
        <Text style={styles.statLabel}>Learning</Text>
      </View>
      <View style={styles.statCard}>
        <FontAwesome5 name="award" size={20} color="#ff5f96" />
        <Text style={styles.statValue}>{learningStats.coursesCompleted}</Text>
        <Text style={styles.statLabel}>Completed</Text>
      </View>
      <View style={styles.statCard}>
        <FontAwesome5 name="fire" size={20} color="#ff5f96" />
        <Text style={styles.statValue}>{learningStats.streakDays}d</Text>
        <Text style={styles.statLabel}>Streak</Text>
      </View>
      <TouchableOpacity style={styles.statCard} onPress={() => navigation.navigate('LearningGoals')}>
        <FontAwesome5 name="bullseye" size={20} color="#ff5f96" />
        <Text style={styles.statValue}>{learningStats.nextMilestone}</Text>
        <Text style={styles.statLabel}>Next Goal</Text>
      </TouchableOpacity>
    </View>
  );

  // Render tab selector
  const renderTabSelector = () => (
    <View style={styles.tabContainer}>
      <TouchableOpacity 
        style={[styles.tab, activeTab === 'enrolled' && styles.activeTab]}
        onPress={() => setActiveTab('enrolled')}
      >
        <Text style={[styles.tabText, activeTab === 'enrolled' && styles.activeTabText]}>In Progress</Text>
      </TouchableOpacity>
      <TouchableOpacity 
        style={[styles.tab, activeTab === 'recommended' && styles.activeTab]}
        onPress={() => setActiveTab('recommended')}
      >
        <Text style={[styles.tabText, activeTab === 'recommended' && styles.activeTabText]}>Recommended</Text>
      </TouchableOpacity>
      <TouchableOpacity 
        style={[styles.tab, activeTab === 'completed' && styles.activeTab]}
        onPress={() => setActiveTab('completed')}
      >
        <Text style={[styles.tabText, activeTab === 'completed' && styles.activeTabText]}>Completed</Text>
      </TouchableOpacity>
    </View>
  );

  // Render continue learning section
  const renderContinueLearning = () => {
    // Get the most recently accessed or highest progress course
    const continueCourse = enrolledCourses.length > 0 ? enrolledCourses[0] : null;
    
    if (!continueCourse) return null;
    
    return (
      <View style={styles.continueContainer}>
        <View style={styles.continueHeader}>
          <Text style={styles.continueTitle}>Continue Learning</Text>
          <TouchableOpacity onPress={() => handleCoursePress(continueCourse.id)}>
            <Text style={styles.continueLink}>Resume</Text>
          </TouchableOpacity>
        </View>
        
        <TouchableOpacity 
          style={styles.continueCourseCard}
          onPress={() => handleCoursePress(continueCourse.id)}
        >
          <Image 
            source={{ uri: continueCourse.image }} 
            style={styles.continueCourseImage} 
          />
          <View style={styles.continueCourseOverlay}>
            <Text style={styles.continueCourseTitle}>{continueCourse.title}</Text>
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${continueCourse.progress}%` }]} />
              </View>
              <Text style={styles.continueCourseProgress}>{continueCourse.progress}% Complete</Text>
            </View>
          </View>
          <View style={styles.playIconContainer}>
            <Ionicons name="play" size={18} color="#fff" />
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  // Render course card
  const renderCourseCard = (course, index, isEnrolled = true) => (
    <TouchableOpacity
      key={course.id}
      style={[styles.courseCard, index === 0 && styles.firstCard]}
      onPress={() => handleCoursePress(course.id)}
    >
      <Image source={{ uri: course.image }} style={styles.courseImage} />
      <View style={styles.courseInfo}>
        <Text style={styles.courseTitle} numberOfLines={1}>{course.title}</Text>
        <Text style={styles.courseAuthor} numberOfLines={1}>{course.author}</Text>
        
        {isEnrolled ? (
          <>
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${course.progress}%` }]} />
              </View>
              <Text style={styles.progressText}>{course.progress}% Complete</Text>
            </View>
          </>
        ) : (
          <>
            <Text style={styles.courseDescription} numberOfLines={2}>{course.description}</Text>
            <View style={styles.courseMetaContainer}>
              <View style={styles.courseMeta}>
                <Ionicons name="time-outline" size={12} color="#666" />
                <Text style={styles.courseMetaText}>{course.duration || '3h 45m'}</Text>
              </View>
              <View style={styles.courseMeta}>
                <Ionicons name="star" size={12} color="#FFD700" />
                <Text style={styles.courseMetaText}>{course.rating || '4.8'}</Text>
              </View>
              <View style={styles.courseMeta}>
                <Ionicons name="people-outline" size={12} color="#666" />
                <Text style={styles.courseMetaText}>{course.students || '3.2k'}</Text>
              </View>
            </View>
          </>
        )}
      </View>
      {!isEnrolled && (
        <View style={styles.enrollButton}>
          <Text style={styles.enrollButtonText}>Enroll</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  // Render course lists based on active tab
  const renderCourseList = () => {
    if (activeTab === 'enrolled') {
      return (
        <>
          {enrolledCourses.length > 0 ? (
            enrolledCourses.map((course, index) => renderCourseCard(course, index))
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="book-outline" size={48} color="#ccc" />
              <Text style={styles.emptyStateText}>You are not enrolled in any courses yet.</Text>
              <TouchableOpacity 
                style={styles.emptyStateButton}
                onPress={() => navigation.navigate('BrowseCourses')}
              >
                <Text style={styles.emptyStateButtonText}>Browse Courses</Text>
              </TouchableOpacity>
            </View>
          )}
        </>
      );
    } else if (activeTab === 'recommended') {
      return (
        <>
          {recommendedCourses.length > 0 ? (
            recommendedCourses.map((course, index) => renderCourseCard(course, index, false))
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="bulb-outline" size={48} color="#ccc" />
              <Text style={styles.emptyStateText}>No recommended courses at the moment.</Text>
              <TouchableOpacity 
                style={styles.emptyStateButton}
                onPress={() => navigation.navigate('UpdateInterests')}
              >
                <Text style={styles.emptyStateButtonText}>Update Interests</Text>
              </TouchableOpacity>
            </View>
          )}
        </>
      );
    } else {
      // Completed courses tab (matches the screenshot)
      return (
        <View style={styles.emptyState}>
          <FontAwesome5 name="trophy" size={48} color="#ddd" />
          <Text style={styles.emptyStateText}>Complete your first course to see it here!</Text>
          <TouchableOpacity 
            style={styles.emptyStateButton}
            onPress={() => setActiveTab('enrolled')}
          >
            <Text style={styles.emptyStateButtonText}>Back to Learning</Text>
          </TouchableOpacity>
        </View>
      );
    }
  };

  // Render bottom tab navigation
  const renderBottomTabs = () => (
    <View style={styles.bottomTabContainer}>
      <TouchableOpacity 
        style={styles.bottomTab} 
        onPress={() => {/* Handle navigation */}}
      >
        <Ionicons name="home" size={24} color="#ff5f96" />
        <Text style={[styles.bottomTabText, {color: '#ff5f96'}]}>Home</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.bottomTab}
        onPress={() => {/* Handle navigation */}}
      >
        <Ionicons name="navigate-outline" size={24} color="#999" />
        <Text style={styles.bottomTabText}>Track Me</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.bottomTab}
        onPress={() => {/* Handle navigation */}}
      >
        <Ionicons name="alert-circle-outline" size={24} color="#999" />
        <Text style={styles.bottomTabText}>SOS</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.bottomTab}
        onPress={() => {/* Handle navigation */}}
      >
        <Ionicons name="people-outline" size={24} color="#999" />
        <Text style={styles.bottomTabText}>Community</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.bottomTab}
        onPress={() => {/* Handle navigation */}}
      >
        <Ionicons name="person-outline" size={24} color="#999" />
        <Text style={styles.bottomTabText}>Profile</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#ff5f96" />
      
      {/* Header Section */}
      <LinearGradient 
        colors={['#ff7eb3', '#ff5f96']} 
        start={{x: 0, y: 0}} 
        end={{x: 1, y: 0}} 
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.headerSubtitle}>Hello, {userName}</Text>
            <Text style={styles.headerTitle}>My Learning Path</Text>
          </View>
          <View style={styles.headerIcons}>
            <TouchableOpacity 
              style={styles.iconButton}
              onPress={() => navigation.navigate('Search')}
            >
              <Ionicons name="search" size={24} color="white" />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.iconButton}
              onPress={() => navigation.navigate('Notifications')}
            >
              <Ionicons name="notifications" size={24} color="white" />
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationBadgeText}>2</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>
      
      {/* Main Content */}
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh} 
            colors={['#ff5f96']} 
            tintColor="#ff5f96" 
          />
        }
      >
        {/* Stats Section */}
        {renderStatsCard()}
        
        {/* Tab Navigation */}
        {renderTabSelector()}
        
        {/* Course Lists */}
        <View style={styles.coursesContainer}>
          {renderCourseList()}
        </View>
        
        {/* Add padding to ensure content isn't hidden behind bottom tabs */}
        <View style={styles.bottomPadding} />
      </ScrollView>
      
      {/* Floating Action Button */}
      <TouchableOpacity 
        style={styles.fab}
        onPress={() => navigation.navigate('BrowseCourses')}
      >
        <Ionicons name="add" size={24} color="white" />
      </TouchableOpacity>
      
      {/* Bottom Tab Navigation */}
      {renderBottomTabs()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    // backgroundColor: '#f8f9fc',
    backgroundColor: '#fff5f8',
  },
  header: { 
    paddingTop: Platform.OS === 'ios' ? 10 : StatusBar.currentHeight,
    paddingBottom: 15,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: { 
    fontSize: 24, 
    fontWeight: 'bold', 
    color: 'white' 
  },
  headerSubtitle: { 
    fontSize: 14, 
    color: 'rgba(255,255,255,0.9)', 
    fontWeight: '500'
  },
  headerIcons: {
    flexDirection: 'row',
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  notificationBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#FFD700',
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationBadgeText: {
    color: '#333',
    fontSize: 10,
    fontWeight: 'bold',
  },
  scrollContainer: { 
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  
  // Stats Section
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: -20,
    marginBottom: 20,
  },
  statCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 10,
    alignItems: 'center',
    width: (width - 60) / 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 6,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
    textAlign: 'center', // Center align the text
  },

  // Continue Learning Section
  continueContainer: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  continueHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  continueTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  continueLink: {
    fontSize: 14,
    color: '#ff5f96',
    fontWeight: '500',
  },
  continueCourseCard: {
    height: 160,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#f0f0f0',
    position: 'relative',
  },
  continueCourseImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  continueCourseOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 16,
  },
  continueCourseTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  continueCourseProgress: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  playIconContainer: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,95,150,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Tab Navigation - Matching your screenshot
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    backgroundColor: '#f0f0f4',
    borderRadius: 24,
    padding: 4,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 20,
  },
  activeTab: {
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  tabText: {
    fontSize: 14,
    color: '#777',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#ff5f96',
    fontWeight: 'bold',
  },
  
  // Course Cards
  coursesContainer: {
    paddingHorizontal: 20,
  },
  courseCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  firstCard: {
    marginTop: 0,
  },
  courseImage: { 
    width: 90, 
    height: 90, 
    resizeMode: 'cover' 
  },
  courseInfo: { 
    flex: 1, 
    padding: 16,
    paddingRight: 8,
  },
  courseTitle: { 
    fontSize: 16, 
    fontWeight: 'bold', 
    color: '#333', 
    marginBottom: 4 
  },
  courseAuthor: { 
    fontSize: 14, 
    color: '#666', 
    marginBottom: 8 
  },
  courseDescription: { 
    fontSize: 14, 
    color: '#666',
    marginBottom: 8,
  },
  courseMetaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  courseMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  courseMetaText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  progressContainer: { 
    marginTop: 8 
  },
  progressBar: { 
    height: 6, 
    backgroundColor: '#eee', 
    borderRadius: 3 
  },
  progressFill: { 
    height: '100%', 
    backgroundColor: '#ff5f96', 
    borderRadius: 3 
  },
  progressText: { 
    fontSize: 12, 
    color: '#666', 
    marginTop: 4 
  },
  enrollButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255,95,150,0.15)',
    borderRadius: 8,
    marginRight: 12,
  },
  enrollButtonText: {
    color: '#ff5f96',
    fontSize: 12,
    fontWeight: 'bold',
  },
  
  // Empty States - Matching your screenshot
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    marginVertical: 20,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 20,
  },
  emptyStateButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: '#ff5f96',
    borderRadius: 25, // More rounded to match screenshot
  },
  emptyStateButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  
  // Floating Action Button
  fab: {
    position: 'absolute',
    bottom: 70, // Adjusted to be above the tab bar
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#ff5f96',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#ff5f96',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  
  // Bottom Tab Navigation - Matching your screenshot
  bottomTabContainer: {
    flexDirection: 'row',
    height: 60,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingBottom: Platform.OS === 'ios' ? 20 : 0, // Adjust for iPhone home indicator
  },
  bottomTab: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 8,
  },
  bottomTabText: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  bottomPadding: {
    height: 60, // Height to ensure content isn't hidden by bottom tabs
  }
});

export default MyLearningPathScreen;