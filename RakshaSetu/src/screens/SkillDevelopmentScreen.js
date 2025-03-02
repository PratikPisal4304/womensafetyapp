import React, { useState, useEffect } from 'react';
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
  Animated
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { FontAwesome5 } from '@expo/vector-icons';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

export default function FinancialEmpowermentScreen({ navigation }) {
  const [activeTab, setActiveTab] = useState('All');
  const [skillRecommendations, setSkillRecommendations] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const scrollY = new Animated.Value(0);

  // Localized financial education tabs with focus on women's economic empowerment
  const tabs = ['All', 'Financial Basics', 'Investing', 'Entrepreneurship', 'Career Growth', 'Budgeting'];

  // Quick access categories
  const categories = [
    { id: 1, name: 'My Learning Path', icon: 'route', color: '#4caf50', gradient: ['#66BB6A', '#43A047'] },
    { id: 2, name: 'Mentorship Hub', icon: 'users', color: '#5e35b1', gradient: ['#7E57C2', '#5E35B1'] },
    { id: 3, name: 'Budget Tools', icon: 'calculator', color: '#ff7043', gradient: ['#FF8A65', '#FF5722'] },
  ];

  // Micro-learning financial modules
  const microLearningModules = [
    { 
      id: 1, 
      title: 'Negotiating Your Worth: Salary Talks',
      author: 'Dr. Maria Rodriguez',
      image: require('../../assets/icon.png'),
      tags: ['Career', 'Negotiation'],
      duration: '15 min',
      rating: 4.7,
      students: 1240,
      completion: '3/5 modules'
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
      completion: '2/4 modules'
    },
  ];

  // AI-recommended personalized courses based on user profile
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
      localContext: true
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
      localContext: true
    }
  ];

  // Header animation
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

  // Simulate AI skills analysis on component mount
  useEffect(() => {
    const getSkillRecommendations = async () => {
      setIsLoading(true);
      // Simulating API call to AI skills matching service
      setTimeout(() => {
        setSkillRecommendations([
          {
            skillName: 'Financial Analysis',
            relevance: 92,
            demandGrowth: '+34%',
            localJobs: 56
          },
          {
            skillName: 'Digital Literacy',
            relevance: 88,
            demandGrowth: '+28%',
            localJobs: 42
          }
        ]);
        setIsLoading(false);
      }, 1500);
    };

    getSkillRecommendations();
  }, []);

  return (
    <View style={styles.container}>
      {/* Status Bar */}
      <StatusBar barStyle="light-content" backgroundColor="#8E44AD" />
      
      {/* Header Section with gradient */}
      <Animated.View style={[styles.headerContainer, { height: headerHeight }]}>
        <LinearGradient 
          colors={['#9B59B6', '#8E44AD']} 
          start={[0, 0]} 
          end={[1, 1]}
          style={styles.headerGradient}
        >
          <SafeAreaView style={styles.headerContent}>
            <View style={styles.headerTop}>
              <View>
                <Text style={styles.welcomeText}>Hello, Maria</Text>
                <Text style={styles.headerTitle}>Financial Skills Hub</Text>
              </View>
              <View style={styles.headerIcons}>
                <TouchableOpacity style={styles.iconButton}>
                  <Ionicons name="notifications" size={24} color="white" />
                  <View style={styles.notificationBadge}>
                    <Text style={styles.badgeText}>2</Text>
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
                  placeholder="Find financial skills and courses..."
                  placeholderTextColor="gray"
                />
                <TouchableOpacity style={styles.filterButton}>
                  <Feather name="sliders" size={18} color="#8E44AD" />
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
              <Feather name="chevron-right" size={16} color="#8E44AD" />
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
        
        {/* AI Skill Analysis Section */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Your Skills Analysis</Text>
            <TouchableOpacity style={styles.refreshButton}>
              <Text style={styles.refreshText}>Refresh</Text>
              <Feather name="refresh-cw" size={16} color="#8E44AD" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.aiAnalysisCard}>
            <View style={styles.aiCardHeader}>
              <View style={styles.aiTitleContainer}>
                <FontAwesome5 name="brain" size={18} color="#8E44AD" style={styles.aiIcon} />
                <Text style={styles.aiCardTitle}>AI-Powered Skills Match</Text>
              </View>
              <Text style={styles.aiCardSubtitle}>Based on your profile, local market, and career goals</Text>
            </View>
            
            {isLoading ? (
              <View style={styles.loadingContainer}>
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
                        <Text style={styles.metricValue}>{skill.demandGrowth}</Text>
                      </View>
                      <View style={styles.skillMetric}>
                        <Text style={styles.metricLabel}>Local Jobs</Text>
                        <Text style={styles.metricValue}>{skill.localJobs}</Text>
                      </View>
                      <TouchableOpacity style={styles.exploreButton}>
                        <Text style={styles.exploreText}>Explore</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
                <TouchableOpacity style={styles.fullAnalysisButton}>
                  <Text style={styles.fullAnalysisText}>View Full Skills Analysis</Text>
                  <Feather name="arrow-right" size={16} color="#8E44AD" />
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
        
        {/* Micro-Learning Section */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Micro-Learning Modules</Text>
            <TouchableOpacity style={styles.seeAllButton}>
              <Text style={styles.seeAllText}>View all</Text>
              <Feather name="chevron-right" size={16} color="#8E44AD" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.microLearningContainer}>
            {microLearningModules.map(module => (
              <TouchableOpacity 
                key={module.id} 
                style={styles.microLearningCard}
                onPress={() => navigation.navigate('MicroLearning', { module })}
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
                      <View style={styles.progressFill} />
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
            <TouchableOpacity style={styles.seeAllButton}>
              <Text style={styles.seeAllText}>More</Text>
              <Feather name="chevron-right" size={16} color="#8E44AD" />
            </TouchableOpacity>
          </View>
          
          {aiRecommendedCourses.map(course => (
            <TouchableOpacity key={course.id} style={styles.recommendedCard}>
              <View style={styles.recommendedContent}>
                <View style={styles.recommendedInfo}>
                  <View style={styles.recommendedTopLabels}>
                    <View style={styles.recommendedLabelContainer}>
                      <Text style={styles.recommendedLabel}>{course.label}</Text>
                    </View>
                    {course.localContext && (
                      <View style={styles.localContextTag}>
                        <Ionicons name="location" size={12} color="#8E44AD" />
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
                      colors={['#9B59B6', '#8E44AD']} 
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
                <View style={styles.recommendedImageContainer}>
                  <Image source={course.image} style={styles.recommendedImage} />
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
        
        {/* Budget Challenge Section */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Monthly Budget Challenge</Text>
            <TouchableOpacity style={styles.seeAllButton}>
              <Text style={styles.seeAllText}>Details</Text>
              <Feather name="chevron-right" size={16} color="#8E44AD" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.budgetChallengeCard}>
            <LinearGradient 
              colors={['#3498DB', '#2980B9']} 
              start={[0, 0]} 
              end={[1, 1]}
              style={styles.budgetGradient}
            >
              <View style={styles.budgetContent}>
                <View>
                  <Text style={styles.budgetTitle}>30-Day Savings Challenge</Text>
                  <Text style={styles.budgetSubtitle}>Save $300 this month</Text>
                  <View style={styles.budgetProgress}>
                    <View style={styles.budgetProgressBar}>
                      <View style={[styles.budgetProgressFill, { width: '45%' }]} />
                    </View>
                    <Text style={styles.budgetProgressText}>$135 of $300 saved</Text>
                  </View>
                  <View style={styles.communityContainer}>
                    <Text style={styles.communityText}>328 women participating</Text>
                  </View>
                </View>
                <TouchableOpacity style={styles.budgetButton}>
                  <Text style={styles.budgetButtonText}>Update</Text>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </View>
        </View>
        
        {/* Mentor Connection Section */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Connect with Mentors</Text>
            <TouchableOpacity style={styles.seeAllButton}>
              <Text style={styles.seeAllText}>Browse all</Text>
              <Feather name="chevron-right" size={16} color="#8E44AD" />
            </TouchableOpacity>
          </View>
          
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.mentorsScrollContent}
          >
            <TouchableOpacity style={styles.mentorCard}>
              <Image 
                source={require('../../assets/icon.png')} 
                style={styles.mentorImage}
              />
              <Text style={styles.mentorName}>Jennifer Taylor</Text>
              <Text style={styles.mentorTitle}>Financial Advisor</Text>
              <View style={styles.mentorButton}>
                <Text style={styles.mentorButtonText}>Connect</Text>
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.mentorCard}>
              <Image 
                source={require('../../assets/icon.png')} 
                style={styles.mentorImage}
              />
              <Text style={styles.mentorName}>Lisa Washington</Text>
              <Text style={styles.mentorTitle}>Entrepreneur</Text>
              <View style={styles.mentorButton}>
                <Text style={styles.mentorButtonText}>Connect</Text>
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.mentorCard}>
              <Image 
                source={require('../../assets/icon.png')} 
                style={styles.mentorImage}
              />
              <Text style={styles.mentorName}>Michelle Roberts</Text>
              <Text style={styles.mentorTitle}>Tech Leader</Text>
              <View style={styles.mentorButton}>
                <Text style={styles.mentorButtonText}>Connect</Text>
              </View>
            </TouchableOpacity>
          </ScrollView>
        </View>
        
        {/* Add some padding at the bottom */}
        <View style={{height: 80}} />
      </Animated.ScrollView>
      
      {/* Floating Action Button */}
      <TouchableOpacity style={styles.fab}>
        <LinearGradient 
          colors={['#9B59B6', '#8E44AD']} 
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
    backgroundColor: '#8E44AD',
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
    marginHorizontal: 10,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginHorizontal: 10,
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
    backgroundColor: '#FF8C00',
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
    backgroundColor: '#F5EEF8',
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
    backgroundColor: '#8E44AD',
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
    color: '#8E44AD',
    fontWeight: '500',
    marginRight: 2,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  refreshText: {
    fontSize: 14,
    color: '#8E44AD',
    fontWeight: '500',
    marginRight: 4,
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
  aiAnalysisCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    padding: 16,
  },
  aiCardHeader: {
    marginBottom: 16,
  },
  aiTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  aiIcon: {
    marginRight: 8,
  },
  aiCardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  aiCardSubtitle: {
    fontSize: 13,
    color: '#666',
    marginLeft: 26,
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 15,
    color: '#666',
    fontStyle: 'italic',
  },
  skillRecommendationsContainer: {
    marginTop: 8,
  },
  skillRecommendation: {
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    paddingBottom: 16,
  },
  skillNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  skillName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  relevanceTag: {
    backgroundColor: '#F5EEF8',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  relevanceText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8E44AD',
  },
  skillMetricsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  skillMetric: {
    marginRight: 24,
  },
  metricLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  metricValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  exploreButton: {
    backgroundColor: '#8E44AD',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 8,
    marginLeft: 'auto',
  },
  exploreText: {
    fontSize: 13,
    fontWeight: '600',
    color: 'white',
  },
  fullAnalysisButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    padding: 12,
    backgroundColor: '#F5EEF8',
    borderRadius: 8,
  },

    fullAnalysisText: {
      fontSize: 14,
      fontWeight: '600',
      color: '#8E44AD',
    },
    microLearningContainer: {
      marginBottom: 16,
    },
    microLearningCard: {
      backgroundColor: 'white',
      borderRadius: 16,
      overflow: 'hidden',
      marginBottom: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: 3,
    },
    moduleImageContainer: {
      width: '100%',
      height: 120,
      position: 'relative',
    },
    moduleImage: {
      width: '100%',
      height: '100%',
      resizeMode: 'cover',
    },
    moduleDurationTag: {
      position: 'absolute',
      bottom: 8,
      right: 8,
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
    },
    moduleDurationText: {
      color: 'white',
      fontSize: 12,
      marginLeft: 4,
    },
    moduleContent: {
      padding: 12,
    },
    tagContainer: {
      flexDirection: 'row',
      marginBottom: 8,
    },
    tag: {
      backgroundColor: '#F5EEF8',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 8,
      marginRight: 8,
    },
    tagText: {
      fontSize: 12,
      color: '#8E44AD',
    },
    moduleTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      color: '#333',
      marginBottom: 4,
    },
    moduleAuthor: {
      fontSize: 14,
      color: '#666',
      marginBottom: 8,
    },
    moduleProgressContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    progressBar: {
      flex: 1,
      height: 6,
      backgroundColor: '#eee',
      borderRadius: 3,
      marginRight: 8,
    },
    progressFill: {
      height: '100%',
      backgroundColor: '#8E44AD',
      borderRadius: 3,
      width: '50%', // This value can be dynamic based on progress
    },
    progressText: {
      fontSize: 12,
      color: '#666',
    },
    recommendedCard: {
      backgroundColor: 'white',
      borderRadius: 16,
      padding: 16,
      marginBottom: 16,
      flexDirection: 'row',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: 3,
    },
    recommendedContent: {
      flex: 1,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    recommendedInfo: {
      flex: 1,
      paddingRight: 12,
    },
    recommendedTopLabels: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },
    recommendedLabelContainer: {
      backgroundColor: '#F5EEF8',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 8,
      marginRight: 8,
    },
    recommendedLabel: {
      fontSize: 12,
      fontWeight: '600',
      color: '#8E44AD',
    },
    localContextTag: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#E8EAF6',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 8,
    },
    localContextText: {
      fontSize: 12,
      color: '#8E44AD',
      marginLeft: 4,
    },
    recommendedTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      color: '#333',
      marginBottom: 4,
    },
    recommendedAuthor: {
      fontSize: 14,
      color: '#666',
      marginBottom: 8,
    },
    courseMetaContainer: {
      flexDirection: 'row',
      marginBottom: 8,
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
    aiMatchContainer: {
      marginBottom: 8,
    },
    aiMatchGradient: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 8,
      alignSelf: 'flex-start',
    },
    aiMatchText: {
      fontSize: 12,
      color: 'white',
      fontWeight: '600',
    },
    progressContainer: {
      marginTop: 8,
    },
    recommendedImageContainer: {
      width: 80,
      height: 80,
      borderRadius: 16,
      overflow: 'hidden',
    },
    recommendedImage: {
      width: '100%',
      height: '100%',
      resizeMode: 'cover',
    },
    budgetChallengeCard: {
      borderRadius: 16,
      overflow: 'hidden',
      marginBottom: 16,
    },
    budgetGradient: {
      padding: 16,
    },
    budgetContent: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    budgetTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      color: 'white',
      marginBottom: 4,
    },
    budgetSubtitle: {
      fontSize: 14,
      color: 'white',
      marginBottom: 8,
    },
    budgetProgress: {
      marginBottom: 8,
    },
    budgetProgressBar: {
      height: 6,
      backgroundColor: 'rgba(255,255,255,0.3)',
      borderRadius: 3,
      marginBottom: 4,
    },
    budgetProgressFill: {
      height: '100%',
      backgroundColor: 'white',
      borderRadius: 3,
      width: '45%', // Adjust dynamically as needed
    },
    budgetProgressText: {
      fontSize: 12,
      color: 'white',
    },
    communityContainer: {
      marginTop: 4,
    },
    communityText: {
      fontSize: 12,
      color: 'white',
    },
    budgetButton: {
      backgroundColor: 'white',
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 8,
    },
    budgetButtonText: {
      fontSize: 14,
      fontWeight: 'bold',
      color: '#2980B9',
    },
    mentorsScrollContent: {
      paddingHorizontal: 16,
    },
    mentorCard: {
      width: 120,
      backgroundColor: 'white',
      borderRadius: 16,
      padding: 12,
      alignItems: 'center',
      marginRight: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: 3,
    },
    mentorImage: {
      width: 60,
      height: 60,
      borderRadius: 30,
      marginBottom: 8,
    },
    mentorName: {
      fontSize: 14,
      fontWeight: 'bold',
      color: '#333',
      marginBottom: 4,
      textAlign: 'center',
    },
    mentorTitle: {
      fontSize: 12,
      color: '#666',
      marginBottom: 8,
      textAlign: 'center',
    },
    mentorButton: {
      backgroundColor: '#8E44AD',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 8,
    },
    mentorButtonText: {
      fontSize: 12,
      fontWeight: '600',
      color: 'white',
    },
    fab: {
      position: 'absolute',
      bottom: 20,
      right: 20,
    },
    fabGradient: {
      width: 56,
      height: 56,
      borderRadius: 28,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
      elevation: 5,
    },
});