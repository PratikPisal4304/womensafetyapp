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
  Alert,
  TextInput,
  Share
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import {
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  doc,
  serverTimestamp,
  query,
  orderBy
} from 'firebase/firestore';
import { db } from '../../config/firebaseConfig'; // Adjust path as needed

import { BarChart, LineChart } from 'react-native-chart-kit';

const screenWidth = Dimensions.get('window').width;

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

  // Top Sectors (live from Firestore)
  const [topSectors, setTopSectors] = useState([]);

  // Job Listings (live from Firestore)
  const [jobs, setJobs] = useState([]);

  // Notifications (live from Firestore)
  const [notifications, setNotifications] = useState([]);

  // Searching & Filtering
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMode, setSelectedMode] = useState('All'); // "All", "Remote", "On-Site", "Hybrid"

  // For the apply modal (in-app application)
  const [applicantName, setApplicantName] = useState('');
  const [applicantEmail, setApplicantEmail] = useState('');
  const [coverNote, setCoverNote] = useState('');
  const [jobToApply, setJobToApply] = useState(null);

  // Pull-to-refresh
  const [refreshing, setRefreshing] = useState(false);

  // Modals
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState('');
  const [modalData, setModalData] = useState(null);

  // Chart Data (could also come from Firestore, but let's keep it mock for example)
  const salaryTrends = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        data: [30000, 32000, 35000, 39000, 42000, 45000],
        color: (opacity = 1) => `rgba(255,95,150, ${opacity})`,
        strokeWidth: 2
      }
    ],
  };
  const genderPayGap = {
    labels: ['IT', 'Healthcare', 'Education', 'Finance', 'Retail'],
    datasets: [
      {
        data: [15, 12, 8, 18, 10],
      }
    ]
  };

  // 1) Fetch topSectors from Firestore
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "topSectors"), (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setTopSectors(data);
    });
    return () => unsubscribe();
  }, []);

  // 2) Fetch jobListings from Firestore
  useEffect(() => {
    // Optionally order by postedAt descending
    const qJobs = query(collection(db, "jobListings"), orderBy("postedAt", "desc"));
    const unsubscribe = onSnapshot(qJobs, (snapshot) => {
      const fetchedJobs = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setJobs(fetchedJobs);
    });
    return () => unsubscribe();
  }, []);

  // 3) Fetch notifications from Firestore
  useEffect(() => {
    const qNotifs = query(collection(db, "notifications"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(qNotifs, (snapshot) => {
      const notifs = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setNotifications(notifs);
    });
    return () => unsubscribe();
  }, []);

  // Simulate loading delay for the entire screen
  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  // Pull to refresh
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    // If needed, re-fetch or just rely on onSnapshot real-time updates
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  }, []);

  // Format Firestore timestamp to a string
  const formatTimestamp = (ts) => {
    if (!ts) return null;
    if (ts.toDate) {
      return ts.toDate().toLocaleDateString();
    }
    return String(ts);
  };

  // Modal helpers
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

  // Mark all notifications as read in Firestore
  const handleMarkAllAsRead = async () => {
    try {
      // For each notification doc, set isRead = true
      for (const notif of notifications) {
        if (!notif.isRead) {
          const notifRef = doc(db, "notifications", notif.id);
          await updateDoc(notifRef, { isRead: true });
        }
      }
      Alert.alert("All notifications marked as read!");
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Failed to mark notifications as read.");
    }
    closeModal();
  };

  // Share a job
  const handleShareJob = async (job) => {
    try {
      await Share.share({
        message: `Check out this job: ${job.title}\nLocation: ${job.companyLocation}\nSalary Range: ${job.salaryRange}`,
      });
    } catch (error) {
      alert(error.message);
    }
  };

  // Open the "Apply" modal
  const handleOpenApplyModal = (job) => {
    setJobToApply(job);
    // Reset the input fields
    setApplicantName('');
    setApplicantEmail('');
    setCoverNote('');
    // Show the apply modal
    openModal('apply', null);
  };

  // Submit the application to Firestore
  const handleSubmitApplication = async () => {
    if (!applicantName || !applicantEmail) {
      Alert.alert("Missing Info", "Please enter your name and email.");
      return;
    }
    if (!jobToApply) {
      Alert.alert("Error", "No job selected.");
      return;
    }
    try {
      await addDoc(collection(db, "jobApplications"), {
        jobId: jobToApply.id,
        applicantName,
        applicantEmail,
        coverNote,
        appliedAt: serverTimestamp(),
      });
      Alert.alert("Success", "Application submitted!");
      closeModal();
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Failed to submit application. Please try again.");
    }
  };

  // Filter & search the jobs
  const filteredJobs = jobs.filter((job) => {
    // 1) Match search query on job.title
    const matchesSearch = job.title
      .toLowerCase()
      .includes(searchQuery.toLowerCase());

    // 2) Match selected work mode
    const matchesMode =
      selectedMode === 'All' ? true : job.workMode === selectedMode;

    return matchesSearch && matchesMode;
  });

  // Render modal content
  const renderModalContent = () => {
    switch(modalType) {
      case 'notifications':
        return (
          <View>
            <Text style={styles.modalTitle}>Notifications</Text>
            {notifications.length === 0 ? (
              <Text style={styles.modalText}>No notifications found.</Text>
            ) : (
              notifications.map((notif) => (
                <Text
                  key={notif.id}
                  style={[
                    styles.modalText,
                    { fontWeight: notif.isRead ? 'normal' : 'bold' }
                  ]}
                >
                  • {notif.message}
                </Text>
              ))
            )}
            <TouchableOpacity style={styles.markAllButton} onPress={handleMarkAllAsRead}>
              <Text style={styles.markAllButtonText}>Mark All as Read</Text>
            </TouchableOpacity>
          </View>
        );

      case 'job':
        // Show job details
        if (!modalData) return null;
        return (
          <View>
            <Text style={styles.modalTitle}>{modalData.title}</Text>
            <Text style={styles.modalSubtitle}>
              {modalData.companyLocation}
            </Text>
            <Text style={styles.modalText}>
              Salary Range: {modalData.salaryRange || 'N/A'}
            </Text>
            <Text style={styles.modalText}>
              Work Mode: {modalData.workMode || 'N/A'}
            </Text>
            {modalData.applyBefore && (
              <Text style={styles.modalText}>
                Apply Before: {modalData.applyBefore}
              </Text>
            )}
            {modalData.postedAt && (
              <Text style={styles.modalText}>
                Posted At: {formatTimestamp(modalData.postedAt)}
              </Text>
            )}
            <Text style={styles.modalText}>
              Description: {modalData.detailedDescription || 'N/A'}
            </Text>

            {/* Buttons: Apply, Share */}
            <View style={{ flexDirection: 'row', marginTop: 10 }}>
              <TouchableOpacity
                style={[styles.applyButton, { marginRight: 10 }]}
                onPress={() => handleOpenApplyModal(modalData)}
              >
                <Text style={styles.applyButtonText}>Apply Now</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.shareButton]}
                onPress={() => handleShareJob(modalData)}
              >
                <Text style={styles.applyButtonText}>Share</Text>
              </TouchableOpacity>
            </View>
          </View>
        );

      case 'apply':
        // Show in-app application form
        return (
          <View>
            <Text style={styles.modalTitle}>Apply for Job</Text>
            <Text style={styles.modalSubtitle}>
              {jobToApply ? jobToApply.title : ''}
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Your Name"
              value={applicantName}
              onChangeText={setApplicantName}
            />
            <TextInput
              style={styles.input}
              placeholder="Your Email"
              keyboardType="email-address"
              value={applicantEmail}
              onChangeText={setApplicantEmail}
            />
            <TextInput
              style={[styles.input, { height: 80 }]}
              multiline
              placeholder="Cover Note (optional)"
              value={coverNote}
              onChangeText={setCoverNote}
            />

            <TouchableOpacity
              style={styles.applyButton}
              onPress={handleSubmitApplication}
            >
              <Text style={styles.applyButtonText}>Submit Application</Text>
            </TouchableOpacity>
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
        <Text style={styles.loadingText}>Loading data...</Text>
      </View>
    );
  }

  // Single "Overview" content
  const renderOverview = () => (
    <ScrollView
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Header / Stats */}
      <View style={styles.headerContainer}>
        <LinearGradient
          colors={['#ff5f96', '#ff85b8']}
          style={styles.headerGradient}
        >
          {/* Notification Panel */}
          <TouchableOpacity 
            style={styles.notificationPanel} 
            onPress={() => openModal('notifications')}
          >
            <Ionicons name="notifications-outline" size={28} color="#fff" />
            {/* Show unread count if any are isRead === false */}
            {notifications.some(notif => !notif.isRead) && (
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationBadgeText}>
                  {notifications.filter(n => !n.isRead).length}
                </Text>
              </View>
            )}
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Job Market Insights</Text>
          <Text style={styles.headerSubtitle}>For Indian Women Professionals</Text>
          
          {/* Example dynamic stats: total job count, total sectors, unread notifications */}
          <View style={styles.statsContainer}>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>{jobs.length}</Text>
              <Text style={styles.statLabel}>Total Jobs</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>{topSectors.length}</Text>
              <Text style={styles.statLabel}>Sectors</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>
                {notifications.filter(n => !n.isRead).length}
              </Text>
              <Text style={styles.statLabel}>Unread Notifs</Text>
            </View>
          </View>
        </LinearGradient>
      </View>

      {/* Top Sectors from Firestore */}
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Top Sectors Hiring Women</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {topSectors.map((sector) => (
            <TouchableOpacity
              key={sector.id}
              style={styles.sectorCard}
              onPress={() => openModal('sector', sector)}
            >
              <View style={styles.sectorIconContainer}>
                <Ionicons name={sector.icon || 'briefcase-outline'} size={28} color="#ff5f96" />
              </View>
              <Text style={styles.sectorName}>{sector.name}</Text>
              <Text style={styles.sectorGrowth}>{sector.growth} growth</Text>
              <Text style={styles.sectorJobs}>{(sector.jobs / 1000).toFixed(1)}K jobs</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Salary Trends (mock data) */}
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Average Salary Trends</Text>
        <View style={styles.chartContainer}>
          <LineChart
            data={salaryTrends}
            width={screenWidth - 40}
            height={220}
            chartConfig={{
              backgroundGradientFrom: '#fff',
              backgroundGradientTo: '#fff',
              color: (opacity = 1) => `rgba(255,95,150, ${opacity})`,
              strokeWidth: 2,
            }}
            bezier
            style={styles.chart}
          />
          <Text style={styles.chartCaption}>Monthly trends for entry-level positions (₹)</Text>
        </View>
      </View>

      {/* Gender Pay Gap (mock data) */}
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Gender Pay Gap by Sector</Text>
        <Text style={styles.sectionSubtitle}>Pay difference percentage, 2024</Text>
        <View style={styles.chartContainer}>
          <BarChart
            data={genderPayGap}
            width={screenWidth - 40}
            height={220}
            chartConfig={{
              backgroundGradientFrom: '#fff',
              backgroundGradientTo: '#fff',
              color: (opacity = 1) => `rgba(255,95,150, ${opacity})`,
              strokeWidth: 2,
            }}
            style={styles.chart}
          />
        </View>
      </View>

      {/* Search & Filter UI */}
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Search & Filter Jobs</Text>
        <View style={styles.filterRow}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search by job title..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <View style={styles.filterSelect}>
            <TouchableOpacity onPress={() => setSelectedMode('All')}>
              <Text style={[
                styles.filterOption,
                selectedMode === 'All' && styles.filterOptionActive
              ]}>All</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setSelectedMode('Remote')}>
              <Text style={[
                styles.filterOption,
                selectedMode === 'Remote' && styles.filterOptionActive
              ]}>Remote</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setSelectedMode('On-Site')}>
              <Text style={[
                styles.filterOption,
                selectedMode === 'On-Site' && styles.filterOptionActive
              ]}>On-Site</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setSelectedMode('Hybrid')}>
              <Text style={[
                styles.filterOption,
                selectedMode === 'Hybrid' && styles.filterOptionActive
              ]}>Hybrid</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Filtered Jobs from Firestore */}
      <View style={styles.sectionContainer}>
        <View style={styles.rowBetween}>
          <Text style={styles.sectionTitle}>Job Listings</Text>
          <TouchableOpacity onPress={() => Alert.alert('View All', 'Implement a separate screen if needed')}>
            <Text style={styles.viewAllButton}>View All</Text>
          </TouchableOpacity>
        </View>
        {filteredJobs.length === 0 ? (
          <Text style={{ color: '#666', marginTop: 5 }}>No matching jobs found.</Text>
        ) : (
          filteredJobs.map((job) => (
            <TouchableOpacity
              key={job.id}
              style={styles.jobCard}
              onPress={() => openModal('job', job)}
            >
              <View style={styles.jobCardHeader}>
                <Text style={styles.jobTitle}>{job.title}</Text>
                <Text style={styles.jobSalary}>{job.salaryRange || 'N/A'}</Text>
              </View>
              <Text style={styles.companyName}>{job.companyLocation}</Text>
              <View style={styles.jobDetails}>
                <View style={styles.jobDetailItem}>
                  <Ionicons name="location-outline" size={16} color="#666" />
                  <Text style={styles.jobDetailText}>
                    {job.workMode || 'N/A'}
                  </Text>
                </View>
                <View style={styles.jobBadge}>
                  <Text style={styles.jobBadgeText}>
                    {job.workMode === 'Remote' ? 'Remote' : 'On-site'}
                  </Text>
                </View>
              </View>
              {job.applyBefore && (
                <Text style={[styles.jobDetailText, { marginTop: 8 }]}>
                  Apply Before: {job.applyBefore}
                </Text>
              )}
            </TouchableOpacity>
          ))
        )}
      </View>
    </ScrollView>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {renderOverview()}
      </View>

      {/* Enhanced Modal */}
      <EnhancedModal visible={modalVisible} onClose={closeModal}>
        {renderModalContent()}
      </EnhancedModal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f8f8' },
  content: { flex: 1 },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
  },
  loadingText: { marginTop: 16, fontSize: 16, color: "#ff5f96" },

  headerContainer: { marginBottom: 20 },
  headerGradient: {
    paddingTop: 40,
    paddingBottom: 30,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
  },
  notificationPanel: { position: 'absolute', top: 40, right: 20 },
  notificationBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: 'red',
    borderRadius: 10,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  notificationBadgeText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },

  headerTitle: { fontSize: 28, fontWeight: 'bold', color: '#fff', marginTop: 10 },
  headerSubtitle: { fontSize: 16, color: 'rgba(255,255,255,0.9)', marginTop: 5 },
  statsContainer: { flexDirection: 'row', marginTop: 25, justifyContent: 'space-between' },
  statBox: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
    padding: 15,
    width: '30%',
    alignItems: 'center',
  },
  statNumber: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  statLabel: { fontSize: 12, color: 'rgba(255,255,255,0.9)', marginTop: 5, textAlign: 'center' },

  sectionContainer: { marginBottom: 25, paddingHorizontal: 20 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 15, color: '#333' },
  sectionSubtitle: { fontSize: 14, color: '#666', marginBottom: 15, marginTop: -10 },
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
  sectorName: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  sectorGrowth: { fontSize: 14, color: '#4CAF50', marginTop: 5, fontWeight: '500' },
  sectorJobs: { fontSize: 14, color: '#666', marginTop: 5 },

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
  chart: { borderRadius: 12, marginVertical: 8 },
  chartCaption: { fontSize: 12, color: '#666', marginTop: 5, textAlign: 'center' },

  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  viewAllButton: { color: "#ff5f96", fontSize: 14, fontWeight: '500' },

  // Search & Filter
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginRight: 10,
    fontSize: 14,
    color: '#333',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  filterSelect: {
    flexDirection: 'row',
  },
  filterOption: {
    marginLeft: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    backgroundColor: '#eee',
    fontSize: 12,
    color: '#666',
  },
  filterOptionActive: {
    backgroundColor: '#ff5f96',
    color: '#fff',
  },

  // Jobs
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
  jobTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', flex: 1 },
  jobSalary: { fontSize: 15, fontWeight: 'bold', color: "#ff5f96" },
  companyName: { fontSize: 14, color: '#666', marginBottom: 10 },
  jobDetails: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  jobDetailItem: { flexDirection: 'row', alignItems: 'center' },
  jobDetailText: { fontSize: 14, color: '#666', marginLeft: 5 },
  jobBadge: {
    backgroundColor: 'rgba(255,95,150,0.1)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
  },
  jobBadgeText: { fontSize: 12, color: "#ff5f96", fontWeight: '500' },

  // Modal
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
  modalCloseButton: { alignSelf: 'flex-end', marginTop: 10 },
  modalCloseButtonText: { fontSize: 16, color: '#ff5f96' },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#333', marginBottom: 10 },
  modalSubtitle: { fontSize: 16, color: '#666', marginBottom: 10 },
  modalText: { fontSize: 14, color: '#444', marginBottom: 10 },
  markAllButton: {
    backgroundColor: "#ff5f96",
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginTop: 10,
  },
  markAllButtonText: { color: '#fff', fontSize: 14, fontWeight: '500' },

  // In-app Apply
  input: {
    backgroundColor: '#f2f2f2',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 10,
    fontSize: 14,
    color: '#333',
  },
  applyButton: {
    backgroundColor: '#ff5f96',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  shareButton: {
    backgroundColor: '#ff5f96',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  applyButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
});

export default JobMarketInsightsScreen;
