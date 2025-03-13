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
  FlatList,
  Modal,
  TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import {
  getFirestore,
  doc,
  getDoc,
  onSnapshot,
  updateDoc,
  collection,
  getDocs,
} from 'firebase/firestore';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { app } from '../../config/firebaseConfig';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');
const db = getFirestore(app);
const auth = getAuth(app);

// Modal component for updating interests
const UpdateInterestModal = ({ visible, onClose, onSave, recommendedTopics }) => {
  const [selectedTopics, setSelectedTopics] = useState([]);
  const [newTopic, setNewTopic] = useState('');

  const toggleTopic = (topic) => {
    if (selectedTopics.includes(topic)) {
      setSelectedTopics(selectedTopics.filter((t) => t !== topic));
    } else {
      setSelectedTopics([...selectedTopics, topic]);
    }
  };

  const handleAddTopic = () => {
    if (newTopic.trim() !== '' && !selectedTopics.includes(newTopic.trim())) {
      setSelectedTopics([...selectedTopics, newTopic.trim()]);
      setNewTopic('');
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>Update Your Interests</Text>
          <Text style={styles.modalSubtitle}>Select topics you're interested in:</Text>
          <FlatList
            data={recommendedTopics}
            keyExtractor={(item) => item}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => toggleTopic(item)}
                style={[
                  styles.topicItem,
                  selectedTopics.includes(item) && styles.topicItemSelected,
                ]}
              >
                <Text
                  style={[
                    styles.topicItemText,
                    selectedTopics.includes(item) && styles.topicItemTextSelected,
                  ]}
                >
                  {item}
                </Text>
              </TouchableOpacity>
            )}
            horizontal={false}
            numColumns={2}
            contentContainerStyle={styles.topicsList}
          />
          <View style={styles.addTopicContainer}>
            <TextInput
              style={styles.input}
              placeholder="Add a new topic"
              value={newTopic}
              onChangeText={setNewTopic}
            />
            <TouchableOpacity style={styles.addButton} onPress={handleAddTopic}>
              <Text style={styles.addButtonText}>Add</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.modalButtons}>
            <TouchableOpacity style={styles.modalButton} onPress={onClose}>
              <Text style={styles.modalButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalButton} onPress={() => onSave(selectedTopics)}>
              <Text style={styles.modalButtonText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

function MyLearningPathScreen() {
  // Core state variables
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userName, setUserName] = useState('');
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [completedCourses, setCompletedCourses] = useState([]);
  const [recommendedCourses, setRecommendedCourses] = useState([]);
  const [badges, setBadges] = useState([]);
  const [lastAccess, setLastAccess] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [learningStats, setLearningStats] = useState({ 
    totalHours: 0, 
    coursesCompleted: 0,
    streakDays: 0,
    nextMilestone: 0
  });
  const [activeTab, setActiveTab] = useState('enrolled');

  // State for inline course browsing and update interests modal
  const [isBrowsingCourses, setIsBrowsingCourses] = useState(false);
  const [allCourses, setAllCourses] = useState([]);
  const [isUpdateInterestModalVisible, setIsUpdateInterestModalVisible] = useState(false);
  const [userInterests, setUserInterests] = useState([]);

  // Example recommended topics (this could be fetched from your backend too)
  const recommendedTopics = ['React', 'React Native', 'Firebase', 'Node.js', 'UX/UI Design'];

  const navigation = useNavigation();

  // Update user's lastAccess field in Firestore
  const updateLastAccess = async (userId) => {
    try {
      const userDocRef = doc(db, 'users', userId);
      await updateDoc(userDocRef, { lastAccess: new Date() });
      setLastAccess(new Date());
    } catch (error) {
      console.error('Error updating last access:', error);
    }
  };

  // Fetch user data from Firestore
  const fetchUserData = async (userId) => {
    try {
      setIsLoading(true);
      const userDocRef = doc(db, 'users', userId);
      const userDocSnap = await getDoc(userDocRef);
      if (userDocSnap.exists()) {
        const userData = userDocSnap.data();
        setUserName(userData.name || userData.displayName || 'User');
        setBadges(userData.badges || []);
        if (userData.lastAccess) {
          setLastAccess(userData.lastAccess.toDate());
        } else if (userData.enrolledCourses) {
          const dates = userData.enrolledCourses
            .filter(course => course.lastAccessed)
            .map(course => course.lastAccessed.toDate().getTime());
          if (dates.length) {
            setLastAccess(new Date(Math.max(...dates)));
          }
        }
        if (userData.enrolledCourses) {
          const inProgress = [];
          const completed = [];
          userData.enrolledCourses.forEach(course => {
            if (course.progress >= 100) {
              completed.push(course);
            } else {
              inProgress.push(course);
            }
          });
          const sortedCourses = [...inProgress].sort((a, b) =>
            (b.lastAccessed?.toDate() || 0) - (a.lastAccessed?.toDate() || 0)
          );
          setEnrolledCourses(sortedCourses);
          setCompletedCourses(completed);
        }
        if (userData.recommendedCourses) {
          setRecommendedCourses(userData.recommendedCourses);
        }
        if (userData.interests) {
          setUserInterests(userData.interests);
        }
        setLearningStats({
          totalHours: userData.totalLearningHours || 0,
          coursesCompleted: userData.completedCourses?.length || completedCourses.length,
          streakDays: userData.learningStreak || 0,
          nextMilestone: userData.nextMilestone || 5,
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

  // Real-time Firestore listener for user data
  const setupUserListener = (userId) => {
    const userDocRef = doc(db, 'users', userId);
    return onSnapshot(userDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const userData = docSnap.data();
        setUserName(userData.name || userData.displayName || 'User');
        setBadges(userData.badges || []);
        if (userData.lastAccess) {
          setLastAccess(userData.lastAccess.toDate());
        }
        if (userData.enrolledCourses) {
          const inProgress = [];
          const completed = [];
          userData.enrolledCourses.forEach(course => {
            if (course.progress >= 100) {
              completed.push(course);
            } else {
              inProgress.push(course);
            }
          });
          const sortedCourses = [...inProgress].sort((a, b) =>
            (b.lastAccessed?.toDate() || 0) - (a.lastAccessed?.toDate() || 0)
          );
          setEnrolledCourses(sortedCourses);
          setCompletedCourses(completed);
        }
        if (userData.recommendedCourses) {
          setRecommendedCourses(userData.recommendedCourses);
        }
        if (userData.interests) {
          setUserInterests(userData.interests);
        }
        setLearningStats({
          totalHours: userData.totalLearningHours || 0,
          coursesCompleted: userData.completedCourses?.length || completedCourses.length,
          streakDays: userData.learningStreak || 0,
          nextMilestone: userData.nextMilestone || 5,
        });
      }
    }, (error) => {
      console.error('Real-time listener error:', error);
    });
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user);
        fetchUserData(user.uid);
        const userListener = setupUserListener(user.uid);
        return () => userListener();
      } else {
        setCurrentUser(null);
        setUserName('Guest');
        setIsLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  // Close the browse courses modal if activeTab is not 'enrolled'
  useEffect(() => {
    if (activeTab !== 'enrolled') {
      setIsBrowsingCourses(false);
    }
  }, [activeTab]);

  useFocusEffect(
    useCallback(() => {
      if (currentUser) {
        fetchUserData(currentUser.uid);
      }
    }, [currentUser])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    if (currentUser) {
      fetchUserData(currentUser.uid).then(() => setRefreshing(false));
    } else {
      setRefreshing(false);
    }
  }, [currentUser]);

  const handleCoursePress = useCallback((courseId) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (currentUser) {
      updateLastAccess(currentUser.uid);
    }
    navigation.navigate('CourseDetail', { courseId });
  }, [navigation, currentUser]);

  const getContinueCourse = () => {
    if (enrolledCourses && enrolledCourses.length > 0) {
      return enrolledCourses[0];
    }
    return null;
  };

  const renderStreakReminder = () => {
    if (lastAccess) {
      const hoursSince = (new Date() - lastAccess) / (1000 * 3600);
      if (hoursSince > 24) {
        return (
          <View style={styles.streakReminder}>
            <Text style={styles.streakReminderText}>
              Don't lose your streak! Complete a lesson today!
            </Text>
          </View>
        );
      }
    }
    return null;
  };

  const renderStatsCard = () => (
    <View style={styles.statsContainer}>
      <View style={styles.statCard}>
        <FontAwesome5 name="clock" size={20} color="#ff5f96" />
        <Text style={styles.statValue}>{learningStats.totalHours}h</Text>
        <Text style={styles.statLabel}>Learning</Text>
      </View>
      <View style={styles.statCard}>
        <FontAwesome5 name="fire" size={20} color="#ff5f96" />
        <Text style={styles.statValue}>{learningStats.streakDays}d</Text>
        <Text style={styles.statLabel}>Streak</Text>
      </View>
      {/* <View style={styles.statCard}>
        <FontAwesome5 name="bullseye" size={20} color="#ff5f96" />
        <Text style={styles.statValue}>{learningStats.nextMilestone}</Text>
        <Text style={styles.statLabel}>Next Goal</Text>
      </View> */}
      {/* <View style={styles.statCard}>
        <FontAwesome5 name="medal" size={20} color="#ff5f96" />
        <Text style={styles.statValue}>{badges.length}</Text>
        <Text style={styles.statLabel}>Badges</Text>
      </View> */}
    </View>
  );

  const renderTabSelector = () => (
    <View style={styles.tabContainer}>
      <TouchableOpacity 
        style={[styles.tab, activeTab === 'enrolled' && styles.activeTab]}
        onPress={() => setActiveTab('enrolled')}
      >
        <Text style={[styles.tabText, activeTab === 'enrolled' && styles.activeTabText]}>
          In Progress
        </Text>
      </TouchableOpacity>
      <TouchableOpacity 
        style={[styles.tab, activeTab === 'recommended' && styles.activeTab]}
        onPress={() => setActiveTab('recommended')}
      >
        <Text style={[styles.tabText, activeTab === 'recommended' && styles.activeTabText]}>
          Recommended
        </Text>
      </TouchableOpacity>
      <TouchableOpacity 
        style={[styles.tab, activeTab === 'completed' && styles.activeTab]}
        onPress={() => setActiveTab('completed')}
      >
        <Text style={[styles.tabText, activeTab === 'completed' && styles.activeTabText]}>
          Completed
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderContinueLearning = () => {
    const continueCourse = getContinueCourse();
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
            <Text style={styles.continueCourseTitle} numberOfLines={1}>
              {continueCourse.title}
            </Text>
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${continueCourse.progress}%` }]} />
              </View>
              <Text style={styles.continueCourseProgress}>
                {continueCourse.progress}% Complete
              </Text>
            </View>
          </View>
          <View style={styles.playIconContainer}>
            <Ionicons name="play" size={18} color="#fff" />
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  const renderCourseCard = (course, index, type = 'enrolled') => (
    <TouchableOpacity
      key={course.id}
      style={[styles.courseCard, index === 0 && styles.firstCard]}
      onPress={() => handleCoursePress(course.id)}
    >
      <Image source={{ uri: course.image }} style={styles.courseImage} />
      <View style={styles.courseInfo}>
        <Text style={styles.courseTitle} numberOfLines={1}>
          {course.title}
        </Text>
        {type === 'browsed' && (
          <>
            <Text style={styles.courseDescription} numberOfLines={2}>
              {course.description}
            </Text>
            <View style={styles.courseMetaContainer}>
              <View style={styles.courseMeta}>
                <Ionicons name="time-outline" size={12} color="#666" />
                <Text style={styles.courseMetaText}>
                  {course.duration || '3h 45m'}
                </Text>
              </View>
              <View style={styles.courseMeta}>
                <Ionicons name="star" size={12} color="#FFD700" />
                <Text style={styles.courseMetaText}>
                  {course.rating || '4.8'}
                </Text>
              </View>
            </View>
          </>
        )}
        {type !== 'browsed' && (
          <Text style={styles.courseAuthor} numberOfLines={1}>
            {course.author}
          </Text>
        )}
        {type === 'enrolled' && (
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${course.progress}%` }]} />
            </View>
            <Text style={styles.progressText}>{course.progress}% Complete</Text>
          </View>
        )}
        {type === 'completed' && (
          <View style={styles.completedBadge}>
            <Text style={styles.completedBadgeText}>Completed</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderCourseList = () => {
    if (activeTab === 'enrolled') {
      return enrolledCourses.length > 0 ? (
        enrolledCourses.map((course, index) => renderCourseCard(course, index, 'enrolled'))
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="book-outline" size={48} color="#ccc" />
          <Text style={styles.emptyStateText}>
            You are not enrolled in any courses yet.
          </Text>
          {activeTab === 'enrolled' && (
            <TouchableOpacity
              style={styles.emptyStateButton}
              onPress={() => setIsBrowsingCourses(true)}
            >
              <Text style={styles.emptyStateButtonText}>Browse Courses</Text>
            </TouchableOpacity>
          )}
        </View>
      );
    } else if (activeTab === 'recommended') {
      return recommendedCourses.length > 0 ? (
        recommendedCourses.map((course, index) => renderCourseCard(course, index, 'recommended'))
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="bulb-outline" size={48} color="#ccc" />
          <Text style={styles.emptyStateText}>
            No recommended courses at the moment.
          </Text>
          <TouchableOpacity
            style={styles.emptyStateButton}
            onPress={() => setIsUpdateInterestModalVisible(true)}
          >
            <Text style={styles.emptyStateButtonText}>Update Interests</Text>
          </TouchableOpacity>
        </View>
      );
    } else {
      return completedCourses.length > 0 ? (
        completedCourses.map((course, index) => renderCourseCard(course, index, 'completed'))
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="trophy-outline" size={48} color="#ccc" />
          <Text style={styles.emptyStateText}>
            Complete your first course to see it here!
          </Text>
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

  const fetchAllCourses = async () => {
    try {
      const coursesSnapshot = await getDocs(collection(db, 'courses'));
      const coursesList = coursesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setAllCourses(coursesList);
    } catch (error) {
      console.error('Error fetching courses:', error);
    }
  };

  useEffect(() => {
    if (isBrowsingCourses) {
      fetchAllCourses();
    }
  }, [isBrowsingCourses]);

  const renderBrowseCourses = () => (
    <View style={styles.browseCoursesContainer}>
      <View style={styles.browseHeader}>
        <Text style={styles.browseTitle}>Available Courses</Text>
        <TouchableOpacity onPress={() => setIsBrowsingCourses(false)}>
          <Text style={styles.closeBrowseText}>Close</Text>
        </TouchableOpacity>
      </View>
      {allCourses.length > 0 ? (
        <FlatList 
          data={allCourses}
          renderItem={({ item, index }) => renderCourseCard(item, index, 'browsed')}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.browseList}
        />
      ) : (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#ff5f96" />
          <Text>Loading Courses...</Text>
        </View>
      )}
    </View>
  );

  if (isLoading) {
    return (
      <View style={[styles.container, styles.center]}>
        <StatusBar barStyle="light-content" />
        <ActivityIndicator size="large" color="#ff5f96" />
        <Text style={styles.loadingText}>Loading your learning path...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      {/* Header with gradient */}
      <LinearGradient 
        colors={['#ff5f96', '#ff5f96']} 
        start={{ x: 0, y: 0 }} 
        end={{ x: 1, y: 1 }} 
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
        {renderStreakReminder()}
        {renderStatsCard()}
        {enrolledCourses.length > 0 && renderContinueLearning()}
        {renderTabSelector()}
        {/* Render "Browse Courses" button and modal only when In Progress is active */}
        {activeTab === 'enrolled' && (
          <View style={styles.browseButtonContainer}>
            {/* <TouchableOpacity 
              style={styles.emptyStateButton}
              onPress={() => setIsBrowsingCourses(true)}
            >
              <Text style={styles.emptyStateButtonText}>Browse Courses</Text>
            </TouchableOpacity> */}
          </View>
        )}
        {activeTab === 'enrolled' && isBrowsingCourses && renderBrowseCourses()}
        <View style={styles.coursesContainer}>{renderCourseList()}</View>
      </ScrollView>
      
      <TouchableOpacity 
        style={styles.fab}
        onPress={() => activeTab === 'enrolled' && setIsBrowsingCourses(true)}
      >
        <Ionicons name="add" size={24} color="white" />
      </TouchableOpacity>
      
      {/* Update Interest Modal */}      
      <UpdateInterestModal
        visible={isUpdateInterestModalVisible}
        recommendedTopics={recommendedTopics}
        onClose={() => setIsUpdateInterestModalVisible(false)}
        onSave={async (topics) => {
          console.log('Selected Topics:', topics);
          if (currentUser) {
            const userDocRef = doc(db, 'users', currentUser.uid);
            try {
              await updateDoc(userDocRef, { interests: topics });
              setUserInterests(topics);
              Alert.alert('Success', 'Interests updated successfully');
            } catch (error) {
              console.error('Error updating interests:', error);
              Alert.alert('Error', 'Failed to update interests');
            }
          }
          setIsUpdateInterestModalVisible(false);
        }}
      />
    </View>
  );
}

export default MyLearningPathScreen;

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#f8f9fc' 
  },
  center: { 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  loadingText: {
    marginTop: 20, 
    color: '#666', 
    fontWeight: '500'
  },
  header: { 
    paddingTop: Platform.OS === 'ios' ? 50 : StatusBar.currentHeight + 10,
    paddingBottom: 20,
    height: 150,
    paddingHorizontal: 20, 
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 25,
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
    fontWeight: 'bold' 
  },
  scrollContainer: { 
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 80,
  },
  streakReminder: {
    backgroundColor: '#ff5f96',
    marginHorizontal: 20,
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginTop: 10,
    marginBottom: 10,
  },
  streakReminderText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: 26,
    marginBottom: 16,
  },
  statCard: {
    backgroundColor: 'white',
    borderRadius: 15,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    width: 150,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 5,
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
  },
  continueContainer: {
    marginHorizontal: 20,
    marginBottom: 16,
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
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    backgroundColor: '#f0f0f4',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
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
    color: '#666',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#ff5f96',
    fontWeight: 'bold',
  },
  coursesContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
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
  completedBadge: {
    backgroundColor: '#4CAF50',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginTop: 8,
    alignSelf: 'flex-start'
  },
  completedBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold'
  },
  browseCoursesContainer: { 
    backgroundColor: '#fff', 
    padding: 16, 
    marginHorizontal: 20, 
    borderRadius: 16, 
    marginBottom: 20, 
    elevation: 3 
  },
  browseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  browseTitle: { 
    fontSize: 18, 
    fontWeight: 'bold', 
    color: '#333' 
  },
  closeBrowseText: { 
    fontSize: 14, 
    color: '#ff5f96', 
    fontWeight: 'bold' 
  },
  browseList: { 
    paddingBottom: 20 
  },
  browseButtonContainer: {
    alignItems: 'center',
    marginVertical: 10,
  },
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
    borderRadius: 12,
  },
  emptyStateButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  fab: {
    position: 'absolute',
    bottom: 20,
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
  loadingContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '80%',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
  },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 10, textAlign: 'center' },
  modalSubtitle: { fontSize: 14, color: '#666', marginBottom: 10, textAlign: 'center' },
  topicsList: { paddingBottom: 10 },
  topicItem: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 20,
    margin: 4,
  },
  topicItemSelected: { backgroundColor: '#ff5f96', borderColor: '#ff5f96' },
  topicItemText: { fontSize: 14, color: '#333' },
  topicItemTextSelected: { color: 'white' },
  addTopicContainer: { flexDirection: 'row', alignItems: 'center', marginVertical: 10 },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 40,
  },
  addButton: {
    marginLeft: 10,
    backgroundColor: '#ff5f96',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
  },
  addButtonText: { color: 'white', fontWeight: 'bold' },
  modalButtons: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 20 },
  modalButton: { marginLeft: 10 },
  modalButtonText: { fontSize: 16, color: '#ff5f96', fontWeight: 'bold' },
});
