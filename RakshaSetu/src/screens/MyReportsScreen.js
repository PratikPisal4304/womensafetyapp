import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TextInput,
  TouchableOpacity, 
  FlatList, 
  SafeAreaView,
  ScrollView,
  Alert,
  Share,
  RefreshControl,
  ActivityIndicator,
  Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { Audio } from 'expo-av';
import { collection, query, orderBy, getDocs, deleteDoc, updateDoc, doc } from 'firebase/firestore';
import { db } from '../../config/firebaseConfig';

const MyReportScreen = ({ navigation }) => {
  const [reports, setReports] = useState([]);
  const [currentView, setCurrentView] = useState('list'); // 'list' or 'detail'
  const [selectedReport, setSelectedReport] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // States for inline editing in detail view
  const [isEditing, setIsEditing] = useState(false);
  const [editedIncidentType, setEditedIncidentType] = useState('');
  const [editedDescription, setEditedDescription] = useState('');
  const [editedLocation, setEditedLocation] = useState('');

  // Load reports from Firestore and sort them (newest first)
  const loadReports = async () => {
    try {
      setLoading(true);
      const q = query(collection(db, 'incident_reports'), orderBy('timestamp', 'desc'));
      const querySnapshot = await getDocs(q);
      const reportsArray = [];
      querySnapshot.forEach((docSnap) => {
        reportsArray.push({ id: docSnap.id, ...docSnap.data() });
      });
      setReports(reportsArray);
    } catch (error) {
      Alert.alert('Error', 'Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  // Refresh handler for pull-to-refresh
  const onRefresh = async () => {
    setRefreshing(true);
    await loadReports();
    setRefreshing(false);
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', loadReports);
    return unsubscribe;
  }, [navigation]);

  // Open report details
  const viewReportDetails = (report) => {
    setSelectedReport(report);
    setIsEditing(false); // reset editing mode when opening a report
    setCurrentView('detail');
  };

  const goBackToList = () => {
    setCurrentView('list');
    setSelectedReport(null);
    setIsEditing(false);
  };

  // Confirm and delete report from Firestore
  const deleteReport = (id) => {
    Alert.alert(
      "Confirm Delete",
      "Are you sure you want to delete this report?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive", 
          onPress: async () => {
            try {
              await deleteDoc(doc(db, 'incident_reports', id));
              setReports(reports.filter(report => report.id !== id));
              if (selectedReport && selectedReport.id === id) {
                goBackToList();
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to delete report');
            }
          } 
        }
      ],
      { cancelable: true }
    );
  };

  // Share report details
  const shareReport = async () => {
    if (!selectedReport) return;
    try {
      await Share.share({
        message: `Report Type: ${selectedReport.incidentType}\n\nDescription: ${selectedReport.description}\n\nLocation: ${selectedReport.location}\n\nStatus: ${selectedReport.status || 'Draft'}`,
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to share report');
    }
  };

  // Confirm submission before updating the report
  const confirmSubmitReport = () => {
    Alert.alert(
      "Confirm Submission",
      "Are you sure you want to submit this report?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Submit", onPress: () => submitReport() }
      ]
    );
  };

  // Submit a report: update status from Draft to Submitted and save in Firestore
  const submitReport = async () => {
    if (!selectedReport) return;
    const updatedReport = { ...selectedReport, status: 'Submitted' };
    try {
      await updateDoc(doc(db, 'incident_reports', selectedReport.id), { status: 'Submitted' });
      const updatedReports = reports.map(report => 
        report.id === selectedReport.id ? updatedReport : report
      );
      setReports(updatedReports);
      setSelectedReport(updatedReport);
      setIsEditing(false);
      Alert.alert('Success', 'Report submitted successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to submit report');
    }
  };

  // Inline Editing Functions

  const handleStartEditing = () => {
    // Pre-fill edit fields with current report data
    setEditedIncidentType(selectedReport.incidentType);
    setEditedDescription(selectedReport.description);
    setEditedLocation(selectedReport.location);
    setIsEditing(true);
  };

  const handleSaveEdit = async () => {
    // Create updated report using edited values
    const updatedReport = {
      ...selectedReport,
      incidentType: editedIncidentType,
      description: editedDescription,
      location: editedLocation
    };
    try {
      await updateDoc(doc(db, 'incident_reports', selectedReport.id), {
        incidentType: editedIncidentType,
        description: editedDescription,
        location: editedLocation
      });
      const updatedReports = reports.map(report =>
        report.id === selectedReport.id ? updatedReport : report
      );
      setReports(updatedReports);
      setSelectedReport(updatedReport);
      setIsEditing(false);
      Alert.alert('Success', 'Report updated successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to update report');
    }
  };

  // Filter reports based on search query (incident type or description)
  const filteredReports = reports.filter(report => {
    const query = searchQuery.toLowerCase();
    return (
      report.incidentType.toLowerCase().includes(query) ||
      report.description.toLowerCase().includes(query)
    );
  });

  // Play audio recording using Expo Audio API
  const playRecording = async (uri) => {
    try {
      const { sound } = await Audio.Sound.createAsync({ uri });
      await sound.playAsync();
    } catch (error) {
      Alert.alert('Error', 'Failed to play audio recording');
    }
  };

  // Render a single report card in the list
  const renderReportItem = ({ item }) => (
    <TouchableOpacity style={styles.reportCard} onPress={() => viewReportDetails(item)}>
      <View style={styles.reportHeader}>
        <Text style={styles.reportType}>{item.incidentType}</Text>
        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>{item.status || 'Draft'}</Text>
        </View>
      </View>
      <Text style={styles.reportDate}>
        {item.timestamp ? new Date(item.timestamp).toLocaleString() : ''}
      </Text>
      <Text style={styles.reportDescription} numberOfLines={2}>{item.description}</Text>
      <View style={styles.cardActions}>
        <TouchableOpacity style={styles.actionButton} onPress={() => viewReportDetails(item)}>
          <Ionicons name="eye-outline" size={20} color="#555" />
          <Text style={styles.actionText}>View</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={() => deleteReport(item.id)}>
          <Ionicons name="trash-outline" size={20} color="#FF3B30" />
          <Text style={[styles.actionText, { color: '#FF3B30' }]}>Delete</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  // List view of reports
  const ReportListView = () => (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <View style={styles.spacer} />
        <Text style={styles.headerTitle}>My Reports</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => navigation.navigate('GenerateReport')}>
          <Ionicons name="add" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>
      {loading ? (
        <ActivityIndicator size="large" color="#007AFF" style={styles.loadingIndicator} />
      ) : filteredReports.length > 0 ? (
        <FlatList
          data={filteredReports}
          renderItem={renderReportItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.reportsList}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        />
      ) : (
        <View style={styles.noReportsContainer}>
          <Text style={styles.noReportsText}>No reports found.</Text>
        </View>
      )}
    </SafeAreaView>
  );

  // Detailed view for a selected report with inline editing support
  const ReportDetailView = () => {
    if (!selectedReport) return null;
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={goBackToList}>
            <Ionicons name="chevron-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Report Details</Text>
          <TouchableOpacity style={styles.shareButton} onPress={shareReport}>
            <Ionicons name="share-outline" size={24} color="#007AFF" />
          </TouchableOpacity>
        </View>
        <ScrollView 
          style={styles.detailContainer} 
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {/* Title and status display */}
          <View style={styles.titleContainer}>
            <Text style={styles.detailTitle}>{selectedReport.incidentType} Incident Report</Text>
            <View style={styles.detailStatusBadge}>
              <Text style={styles.detailStatusText}>{selectedReport.status || 'Draft'}</Text>
            </View>
          </View>
          <Text style={styles.detailDateTime}>{new Date(selectedReport.timestamp).toLocaleString()}</Text>
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Report ID:</Text>
            <Text style={styles.infoValue}> {selectedReport.incidentId}</Text>
          </View>
          <View style={styles.statusContainer}>
            <Text style={styles.sectionTitle}>REPORT STATUS</Text>
            <View style={styles.statusDetail}>
              <Ionicons name="information-circle-outline" size={20} color="#007AFF" />
              <Text style={styles.statusValueText}> {selectedReport.status || 'Draft'}</Text>
            </View>
          </View>
          {/* If in editing mode, show inputs; otherwise, show text details */}
          {isEditing ? (
            <View style={styles.editForm}>
              <Text style={styles.sectionTitle}>Edit Incident Type</Text>
              <TextInput
                style={styles.editInput}
                value={editedIncidentType}
                onChangeText={setEditedIncidentType}
              />
              <Text style={styles.sectionTitle}>Edit Description</Text>
              <TextInput
                style={[styles.editInput, { height: 100 }]}
                value={editedDescription}
                onChangeText={setEditedDescription}
                multiline
              />
              <Text style={styles.sectionTitle}>Edit Location</Text>
              <TextInput
                style={styles.editInput}
                value={editedLocation}
                onChangeText={setEditedLocation}
              />
              <View style={styles.editButtonsContainer}>
                <TouchableOpacity style={styles.saveButton} onPress={handleSaveEdit}>
                  <Text style={styles.saveButtonText}>Save</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.cancelButton} onPress={() => setIsEditing(false)}>
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <>
              <Text style={styles.sectionTitle}>INCIDENT SUMMARY</Text>
              <Text style={styles.summaryText}>{selectedReport.description}</Text>
              <Text style={styles.sectionTitle}>LOCATION</Text>
              <Text style={styles.locationText}>{selectedReport.location}</Text>
              <Text style={styles.sectionTitle}>EVIDENCE</Text>
              {selectedReport.attachedImages && selectedReport.attachedImages.length > 0 ? (
                <View style={styles.imagesContainer}>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photoScroll}>
                    {selectedReport.attachedImages.map((uri, index) => (
                      <Image key={index} source={{ uri }} style={styles.reportPhoto} />
                    ))}
                  </ScrollView>
                </View>
              ) : (
                <Text style={styles.detailsText}>No images attached.</Text>
              )}
              {selectedReport.recordingUri ? (
                <TouchableOpacity style={styles.playButton} onPress={() => playRecording(selectedReport.recordingUri)}>
                  <Ionicons name="play-outline" size={20} color="#007AFF" />
                  <Text style={styles.playButtonText}>Play Audio Statement</Text>
                </TouchableOpacity>
              ) : (
                <Text style={styles.detailsText}>No audio recording attached.</Text>
              )}
              {/* Show edit and submit buttons if report is draft */}
              {(!selectedReport.status || selectedReport.status === 'Draft') && (
                <>
                  <TouchableOpacity style={styles.submitButton} onPress={confirmSubmitReport}>
                    <Text style={styles.submitButtonText}>Submit Report</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.editButton} onPress={handleStartEditing}>
                    <Text style={styles.editButtonText}>Edit Report</Text>
                  </TouchableOpacity>
                </>
              )}
            </>
          )}
          <View style={styles.bottomSpacing} />
        </ScrollView>
      </SafeAreaView>
    );
  };

  return currentView === 'list' ? <ReportListView /> : <ReportDetailView />;
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9F9F9' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  spacer: { width: 24 },
  backButton: { padding: 4 },
  addButton: { padding: 4 },
  shareButton: { padding: 4 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#333' },
  loadingIndicator: { marginTop: 40 },
  reportsList: { paddingBottom: 16 },
  noReportsContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 40 },
  noReportsText: { fontSize: 16, color: '#888' },
  reportCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  reportHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  reportType: { fontSize: 16, fontWeight: '600', color: '#333', flex: 1 },
  statusBadge: { backgroundColor: '#FF9EC3', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  statusText: { color: '#FFFFFF', fontSize: 12, fontWeight: '600', textTransform: 'uppercase' },
  reportDate: { fontSize: 14, color: '#8E8E93', marginBottom: 8 },
  reportDescription: { fontSize: 14, color: '#555', marginBottom: 16, lineHeight: 20 },
  cardActions: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#E5E5EA', paddingTop: 12, justifyContent: 'space-around' },
  actionButton: { flexDirection: 'row', alignItems: 'center' },
  actionText: { fontSize: 14, fontWeight: '500', color: '#555', marginLeft: 4 },
  detailContainer: { flex: 1, backgroundColor: '#F9F9F9', paddingHorizontal: 16 },
  titleContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, marginBottom: 8 },
  detailTitle: { fontSize: 24, fontWeight: '700', color: '#333', flex: 1 },
  detailStatusBadge: { backgroundColor: '#FF9EC3', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  detailStatusText: { color: '#FFFFFF', fontSize: 14, fontWeight: '600', textTransform: 'uppercase' },
  detailDateTime: { fontSize: 16, color: '#8E8E93', marginBottom: 16 },
  infoCard: { flexDirection: 'row', backgroundColor: '#EFEFF4', padding: 16, borderRadius: 12, marginBottom: 16 },
  infoLabel: { fontSize: 16, fontWeight: '600', color: '#333' },
  infoValue: { fontSize: 16, color: '#333' },
  statusContainer: { backgroundColor: '#EFEFF4', padding: 16, borderRadius: 12, marginBottom: 16 },
  statusDetail: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  statusValueText: { fontSize: 16, color: '#333', fontWeight: '600', marginLeft: 8 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#666', marginTop: 20, marginBottom: 10 },
  summaryText: { fontSize: 16, color: '#555', lineHeight: 22, marginBottom: 16 },
  locationText: { fontSize: 16, color: '#555', marginBottom: 12 },
  detailsText: { fontSize: 16, color: '#555', marginBottom: 16 },
  imagesContainer: { marginBottom: 16 },
  photoScroll: { marginVertical: 8 },
  reportPhoto: { width: 120, height: 120, borderRadius: 8, marginRight: 8 },
  playButton: { flexDirection: 'row', alignItems: 'center', marginVertical: 16 },
  playButtonText: { marginLeft: 8, fontSize: 16, color: '#007AFF' },
  submitButton: { backgroundColor: '#007AFF', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 8, alignItems: 'center', marginVertical: 20 },
  submitButtonText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
  editButton: { backgroundColor: '#FFA500', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 8, alignItems: 'center', marginBottom: 20 },
  editButtonText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
  bottomSpacing: { height: 40 },
  // New styles for inline edit form
  editForm: { marginVertical: 20, backgroundColor: '#fff', padding: 16, borderRadius: 8, elevation: 2 },
  editInput: { borderWidth: 1, borderColor: '#ccc', borderRadius: 4, padding: 8, marginBottom: 12, fontSize: 16, color: '#333' },
  editButtonsContainer: { flexDirection: 'row', justifyContent: 'space-around' },
  saveButton: { backgroundColor: '#28a745', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 4 },
  saveButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  cancelButton: { backgroundColor: '#dc3545', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 4 },
  cancelButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});

export default MyReportScreen;
