// JobMarketInsightsScreen.js
import React, { useState, useEffect, useCallback } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  TouchableWithoutFeedback,
  ActivityIndicator,
  SafeAreaView,
  Image,
  Dimensions,
  RefreshControl,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BarChart, LineChart } from 'react-native-chart-kit';

const screenWidth = Dimensions.get('window').width;

// Mock data - In a real app, this would come from an API
const mockJobData = {
  topSectors: [
    { id: 1, name: 'Information Technology', growth: '+12%', jobs: 45000, icon: 'laptop-outline' },
    { id: 2, name: 'Healthcare', growth: '+8%', jobs: 32000, icon: 'medical-outline' },
    { id: 3, name: 'Education', growth: '+5%', jobs: 28000, icon: 'school-outline' },
    { id: 4, name: 'Finance', growth: '+7%', jobs: 25000, icon: 'cash-outline' },
    { id: 5, name: 'E-commerce', growth: '+15%', jobs: 20000, icon: 'cart-outline' },
  ],
  salaryTrends: {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        data: [30000, 32000, 35000, 39000, 42000, 45000],
        color: (opacity = 1) => `rgba(255,95,150, ${opacity})`,
        strokeWidth: 2
      }
    ],
  },
  genderPayGap: {
    labels: ['IT', 'Healthcare', 'Education', 'Finance', 'Retail'],
    datasets: [
      {
        data: [15, 12, 8, 18, 10],
      }
    ]
  },
  featuredJobs: [
    { id: 1, title: 'Senior Software Developer', company: 'TechSolutions India', location: 'Bangalore', remote: true, salary: '₹18-25L' },
    { id: 2, title: 'HR Manager', company: 'Global Services Ltd', location: 'Mumbai', remote: false, salary: '₹12-15L' },
    { id: 3, title: 'Content Strategist', company: 'MediaMinds', location: 'Delhi NCR', remote: true, salary: '₹8-12L' },
    { id: 4, title: 'Finance Analyst', company: 'Finance First', location: 'Hyderabad', remote: false, salary: '₹10-14L' },
  ],
  skills: [
    { id: 1, name: 'Digital Marketing', demand: 'High' },
    { id: 2, name: 'Data Analysis', demand: 'Very High' },
    { id: 3, name: 'Project Management', demand: 'High' },
    { id: 4, name: 'UI/UX Design', demand: 'Medium' },
    { id: 5, name: 'Content Writing', demand: 'Medium' },
  ],
  resources: [
    { id: 1, title: 'Women in Tech Mentorship', org: 'TechLadies India', type: 'Mentorship' },
    { id: 2, title: 'Leadership Skills Workshop', org: 'Professional Women Network', type: 'Workshop' },
    { id: 3, title: 'Return to Work Program', org: 'JobsForHer', type: 'Program' },
    { id: 4, title: 'Financial Assistance for Training', org: 'Govt. Skill India', type: 'Financial Aid' },
  ]
};

// Enhanced modal component that handles tapping outside to dismiss and provides a close button.
const EnhancedModal = ({ visible, onClose, children }) => {
  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <TouchableOpacity 
        style={styles.modalOverlay} 
        activeOpacity={1} 
        onPress={onClose}
      >
        <TouchableWithoutFeedback>
          <View style={styles.modalContainer}>
            {children}
            <TouchableOpacity style={styles.modalCloseButton} onPress={onClose}>
              <Text style={styles.modalCloseButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </TouchableWithoutFeedback>
      </TouchableOpacity>
    </Modal>
  );
};

const JobMarketInsightsScreen = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [jobData, setJobData] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [refreshing, setRefreshing] = useState(false);

  // Modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState('');
  const [modalData, setModalData] = useState(null);

  // Dummy notifications data
  const notificationsData = [
    { id: 1, message: 'Your application for Senior Software Developer has been viewed.' },
    { id: 2, message: 'New job posting in Information Technology.' },
    { id: 3, message: 'Reminder: Complete your profile for better matches.' },
  ];

  useEffect(() => {
    // Simulate an API call with a 1.5s delay
    const fetchData = async () => {
      setIsLoading(true);
      try {
        await new Promise(resolve => setTimeout(resolve, 1500));
        setJobData(mockJobData);
      } catch (error) {
        console.error('Error fetching job market data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    // Simulate a refresh delay
    setTimeout(() => {
      setRefreshing(false);
    }, 1500);
  }, []);

  const chartConfig = {
    backgroundGradientFrom: "#fff",
    backgroundGradientTo: "#fff",
    color: (opacity = 1) => `rgba(255,95,150, ${opacity})`,
    strokeWidth: 2,
    barPercentage: 0.5,
    useShadowColorFromDataset: false
  };

  // Modal open and close functions
  const openModal = (type, data) => {
    setModalType(type);
    setModalData(data);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setModalType('');
    setModalData(null);
  };

  // Additional action for notifications modal
  const handleMarkAllAsRead = () => {
    alert("All notifications marked as read!");
    closeModal();
  };

  // Render modal content based on type
  const renderModalContent = () => {
    switch(modalType) {
      case 'notifications':
        return (
          <View>
            <Text style={styles.modalTitle}>Notifications</Text>
            {modalData.map(notification => (
              <Text key={notification.id} style={styles.modalText}>• {notification.message}</Text>
            ))}
            <TouchableOpacity style={styles.markAllButton} onPress={handleMarkAllAsRead}>
              <Text style={styles.markAllButtonText}>Mark All as Read</Text>
            </TouchableOpacity>
          </View>
        );
      case 'sector':
        return (
          <View>
            <Text style={styles.modalTitle}>{modalData.name}</Text>
            <Text style={styles.modalText}>Growth: {modalData.growth}</Text>
            <Text style={styles.modalText}>Number of Jobs: {modalData.jobs}</Text>
            <Text style={styles.modalText}>Explore more opportunities in the {modalData.name} sector.</Text>
          </View>
        );
      case 'job':
        return (
          <View>
            <Text style={styles.modalTitle}>{modalData.title}</Text>
            <Text style={styles.modalSubtitle}>{modalData.company} - {modalData.location}</Text>
            <Text style={styles.modalText}>Salary Range: {modalData.salary}</Text>
            <Text style={styles.modalText}>Work Mode: {modalData.remote ? 'Remote' : 'On-site'}</Text>
            <Text style={styles.modalText}>Detailed Description: Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer nec odio. Praesent libero.</Text>
          </View>
        );
      case 'skill':
        return (
          <View>
            <Text style={styles.modalTitle}>{modalData.name}</Text>
            <Text style={styles.modalText}>Demand Level: {modalData.demand}</Text>
            <Text style={styles.modalText}>Enhance your career by developing this skill. Explore courses and tutorials to master {modalData.name}.</Text>
          </View>
        );
      case 'resource':
        return (
          <View>
            <Text style={styles.modalTitle}>{modalData.title}</Text>
            <Text style={styles.modalSubtitle}>{modalData.org}</Text>
            <Text style={styles.modalText}>Type: {modalData.type}</Text>
            <Text style={styles.modalText}>Detailed Information: This program offers extensive support to help you advance in your career. Check out eligibility criteria and application details.</Text>
          </View>
        );
      case 'govt':
        return (
          <View>
            <Text style={styles.modalTitle}>{modalData.title}</Text>
            <Image source={{ uri: modalData.image }} style={styles.modalImage} />
            <Text style={styles.modalText}>{modalData.description}</Text>
          </View>
        );
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#ff5f96" />
        <Text style={styles.loadingText}>Loading job insights...</Text>
      </View>
    );
  }

  // Overview Tab (with Header & Notification Panel)
  const renderOverviewTab = () => (
    <ScrollView 
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.headerContainer}>
        <LinearGradient
          colors={['#ff5f96', '#ff85b8']}
          style={styles.headerGradient}
        >
          {/* Notification Panel */}
          <TouchableOpacity 
            style={styles.notificationPanel} 
            onPress={() => openModal('notifications', notificationsData)}
          >
            <Ionicons name="notifications-outline" size={28} color="#fff" />
            <View style={styles.notificationBadge}>
              <Text style={styles.notificationBadgeText}>3</Text>
            </View>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Job Market Insights</Text>
          <Text style={styles.headerSubtitle}>For Indian Women Professionals</Text>
          
          <View style={styles.statsContainer}>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>4.2M</Text>
              <Text style={styles.statLabel}>Job Openings</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>+8.3%</Text>
              <Text style={styles.statLabel}>Growth Rate</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>28%</Text>
              <Text style={styles.statLabel}>Women in Workforce</Text>
            </View>
          </View>
        </LinearGradient>
      </View>

      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Top Sectors Hiring Women</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {jobData.topSectors.map(sector => (
            <TouchableOpacity key={sector.id} style={styles.sectorCard} onPress={() => openModal('sector', sector)}>
              <View style={styles.sectorIconContainer}>
                <Ionicons name={sector.icon} size={28} color="#ff5f96" />
              </View>
              <Text style={styles.sectorName}>{sector.name}</Text>
              <Text style={styles.sectorGrowth}>{sector.growth} growth</Text>
              <Text style={styles.sectorJobs}>{(sector.jobs/1000).toFixed(1)}K jobs</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Average Salary Trends</Text>
        <View style={styles.chartContainer}>
          <LineChart
            data={jobData.salaryTrends}
            width={screenWidth - 40}
            height={220}
            chartConfig={chartConfig}
            bezier
            style={styles.chart}
          />
          <Text style={styles.chartCaption}>Monthly trends for entry-level positions (₹)</Text>
        </View>
      </View>

      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Gender Pay Gap by Sector</Text>
        <Text style={styles.sectionSubtitle}>Pay difference percentage, 2024</Text>
        <View style={styles.chartContainer}>
          <BarChart
            data={jobData.genderPayGap}
            width={screenWidth - 40}
            height={220}
            chartConfig={{
              ...chartConfig,
              color: (opacity = 1) => `rgba(255,95,150, ${opacity})`,
            }}
            style={styles.chart}
          />
        </View>
      </View>

      <View style={styles.sectionContainer}>
        <View style={styles.rowBetween}>
          <Text style={styles.sectionTitle}>Featured Jobs</Text>
          <TouchableOpacity onPress={() => alert('Viewing All Jobs')}>
            <Text style={styles.viewAllButton}>View All</Text>
          </TouchableOpacity>
        </View>
        {jobData.featuredJobs.map(job => (
          <TouchableOpacity key={job.id} style={styles.jobCard} onPress={() => openModal('job', job)}>
            <View style={styles.jobCardHeader}>
              <Text style={styles.jobTitle}>{job.title}</Text>
              <Text style={styles.jobSalary}>{job.salary}</Text>
            </View>
            <Text style={styles.companyName}>{job.company}</Text>
            <View style={styles.jobDetails}>
              <View style={styles.jobDetailItem}>
                <Ionicons name="location-outline" size={16} color="#666" />
                <Text style={styles.jobDetailText}>{job.location}</Text>
              </View>
              <View style={styles.jobBadge}>
                <Text style={styles.jobBadgeText}>{job.remote ? 'Remote' : 'On-site'}</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );

  // Resources Tab
  const renderResourcesTab = () => (
    <ScrollView 
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.tabHeaderContainer}>
        <Text style={styles.tabHeaderTitle}>Resources & Support</Text>
        <Text style={styles.tabHeaderSubtitle}>Programs and organizations helping Indian women advance their careers</Text>
      </View>

      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>In-Demand Skills</Text>
        <Text style={styles.sectionSubtitle}>Skills with highest growth potential in 2024</Text>
        {jobData.skills.map(skill => (
          <View key={skill.id} style={styles.skillItem}>
            <View style={styles.skillInfo}>
              <Text style={styles.skillName}>{skill.name}</Text>
              <View style={[
                styles.demandBadge, 
                skill.demand === 'Very High' ? styles.veryHighDemand : 
                skill.demand === 'High' ? styles.highDemand : 
                styles.mediumDemand
              ]}>
                <Text style={styles.demandBadgeText}>{skill.demand}</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.learnButton} onPress={() => openModal('skill', skill)}>
              <Text style={styles.learnButtonText}>Learn</Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>

      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Support Programs</Text>
        {jobData.resources.map(resource => (
          <TouchableOpacity key={resource.id} style={styles.resourceCard} onPress={() => openModal('resource', resource)}>
            <View style={styles.resourceContent}>
              <Text style={styles.resourceTitle}>{resource.title}</Text>
              <Text style={styles.resourceOrg}>{resource.org}</Text>
            </View>
            <View style={styles.resourceTypeBadge}>
              <Text style={styles.resourceTypeText}>{resource.type}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Government Initiatives</Text>
        <View style={styles.govtCard}>
          <Image 
            source={{ uri: 'https://via.placeholder.com/80' }} 
            style={styles.govtLogo}
          />
          <View style={styles.govtCardContent}>
            <Text style={styles.govtCardTitle}>MUDRA Loan Scheme</Text>
            <Text style={styles.govtCardDesc}>Low-interest loans up to ₹10L for women entrepreneurs</Text>
            <TouchableOpacity style={styles.govtCardButton} onPress={() => openModal('govt', { title: 'MUDRA Loan Scheme', description: 'Low-interest loans up to ₹10L for women entrepreneurs. Detailed info about eligibility, process, and benefits.', image: 'https://via.placeholder.com/80' })}>
              <Text style={styles.govtCardButtonText}>Apply Now</Text>
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.govtCard}>
          <Image 
            source={{ uri: 'https://via.placeholder.com/80' }} 
            style={styles.govtLogo}
          />
          <View style={styles.govtCardContent}>
            <Text style={styles.govtCardTitle}>Skill India Mission</Text>
            <Text style={styles.govtCardDesc}>Free skill development courses for women returning to workforce</Text>
            <TouchableOpacity style={styles.govtCardButton} onPress={() => openModal('govt', { title: 'Skill India Mission', description: 'Free skill development courses for women returning to workforce. Detailed info about eligibility, process, and benefits.', image: 'https://via.placeholder.com/80' })}>
              <Text style={styles.govtCardButtonText}>Check Eligibility</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </ScrollView>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {activeTab === 'overview' ? renderOverviewTab() : renderResourcesTab()}
      </View>
      <View style={styles.tabBar}>
        <TouchableOpacity 
          style={[styles.tabButton, activeTab === 'overview' && styles.activeTabButton]} 
          onPress={() => setActiveTab('overview')}
        >
          <Ionicons 
            name={activeTab === 'overview' ? "stats-chart" : "stats-chart-outline"} 
            size={24} 
            color={activeTab === 'overview' ? "#ff5f96" : "#666"} 
          />
          <Text style={[styles.tabLabel, activeTab === 'overview' && styles.activeTabLabel]}>Overview</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tabButton, activeTab === 'resources' && styles.activeTabButton]} 
          onPress={() => setActiveTab('resources')}
        >
          <Ionicons 
            name={activeTab === 'resources' ? "briefcase" : "briefcase-outline"} 
            size={24} 
            color={activeTab === 'resources' ? "#ff5f96" : "#666"} 
          />
          <Text style={[styles.tabLabel, activeTab === 'resources' && styles.activeTabLabel]}>Resources</Text>
        </TouchableOpacity>
      </View>
      {/* Enhanced Modal */}
      <EnhancedModal visible={modalVisible} onClose={closeModal}>
        {renderModalContent()}
      </EnhancedModal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#ff5f96",
  },
  headerContainer: {
    marginBottom: 20,
  },
  headerGradient: {
    paddingTop: 40,
    paddingBottom: 30,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
  },
  notificationPanel: {
    position: 'absolute',
    top: 40,
    right: 20,
  },
  notificationBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: 'red',
    borderRadius: 10,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  notificationBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 10,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 5,
  },
  statsContainer: {
    flexDirection: 'row',
    marginTop: 25,
    justifyContent: 'space-between',
  },
  statBox: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
    padding: 15,
    width: '30%',
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 5,
    textAlign: 'center',
  },
  sectionContainer: {
    marginBottom: 25,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
    marginTop: -10,
  },
  sectorCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginRight: 15,
    width: 150,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectorIconContainer: {
    backgroundColor: 'rgba(255,95,150,0.1)',
    padding: 10,
    borderRadius: 10,
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  sectorName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  sectorGrowth: {
    fontSize: 14,
    color: '#4CAF50',
    marginTop: 5,
    fontWeight: '500',
  },
  sectorJobs: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  chartContainer: {
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  chart: {
    borderRadius: 12,
    marginVertical: 8,
  },
  chartCaption: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
    textAlign: 'center',
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  viewAllButton: {
    color: "#ff5f96",
    fontSize: 14,
    fontWeight: '500',
  },
  jobCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  jobCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  jobTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  jobSalary: {
    fontSize: 15,
    fontWeight: 'bold',
    color: "#ff5f96",
  },
  companyName: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  jobDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  jobDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  jobDetailText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 5,
  },
  jobBadge: {
    backgroundColor: 'rgba(255,95,150,0.1)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
  },
  jobBadgeText: {
    fontSize: 12,
    color: "#ff5f96",
    fontWeight: '500',
  },
  tabBar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    backgroundColor: '#fff',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeTabButton: {
    borderTopWidth: 3,
    borderTopColor: "#ff5f96",
  },
  tabLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 3,
  },
  activeTabLabel: {
    color: "#ff5f96",
    fontWeight: '500',
  },
  tabHeaderContainer: {
    backgroundColor: "#ff5f96",
    paddingVertical: 30,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    marginBottom: 20,
  },
  tabHeaderTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  tabHeaderSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 5,
    lineHeight: 20,
  },
  skillItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  skillInfo: {
    flex: 1,
  },
  skillName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 5,
  },
  demandBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    alignSelf: 'flex-start',
  },
  veryHighDemand: {
    backgroundColor: 'rgba(220,36,48,0.1)',
  },
  highDemand: {
    backgroundColor: 'rgba(255,152,0,0.1)',
  },
  mediumDemand: {
    backgroundColor: 'rgba(3,169,244,0.1)',
  },
  demandBadgeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  learnButton: {
    backgroundColor: 'rgba(255,95,150,0.1)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  learnButtonText: {
    color: "#ff5f96",
    fontWeight: '500',
    fontSize: 14,
  },
  resourceCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  resourceContent: {
    flex: 1,
  },
  resourceTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 5,
  },
  resourceOrg: {
    fontSize: 14,
    color: '#666',
  },
  resourceTypeBadge: {
    backgroundColor: 'rgba(33,150,243,0.1)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
  },
  resourceTypeText: {
    fontSize: 12,
    color: '#2196F3',
    fontWeight: '500',
  },
  govtCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  govtLogo: {
    width: 80,
    height: 80,
    borderRadius: 10,
    marginRight: 15,
  },
  govtCardContent: {
    flex: 1,
  },
  govtCardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  govtCardDesc: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
    lineHeight: 20,
  },
  govtCardButton: {
    backgroundColor: "#ff5f96",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  govtCardButtonText: {
    color: '#fff',
    fontWeight: '500',
    fontSize: 14,
  },
  // Enhanced Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '85%',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
  },
  modalCloseButton: {
    alignSelf: 'flex-end',
    marginTop: 10,
  },
  modalCloseButtonText: {
    fontSize: 16,
    color: '#ff5f96',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  modalSubtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 10,
  },
  modalText: {
    fontSize: 14,
    color: '#444',
    marginBottom: 10,
  },
  modalImage: {
    width: '100%',
    height: 150,
    borderRadius: 10,
    marginBottom: 10,
  },
  markAllButton: {
    backgroundColor: "#ff5f96",
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginTop: 10,
  },
  markAllButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
});

export default JobMarketInsightsScreen;
