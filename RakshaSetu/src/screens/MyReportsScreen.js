import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  FlatList, 
  SafeAreaView,
  ScrollView,
  Image,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';

const MyReportScreen = ({ navigation }) => {
  const [reports, setReports] = useState([]);
  const [currentView, setCurrentView] = useState('list'); // 'list' or 'detail'
  const [selectedReport, setSelectedReport] = useState(null);

  useEffect(() => {
    const loadReports = async () => {
      try {
        const reportsJson = await AsyncStorage.getItem('incident_reports');
        const loadedReports = reportsJson ? JSON.parse(reportsJson) : [];
        setReports(loadedReports);
      } catch (error) {
        Alert.alert('Error', 'Failed to load reports');
      }
    };
    const unsubscribe = navigation.addListener('focus', loadReports);
    return unsubscribe;
  }, [navigation]);

  const viewReportDetails = (report) => {
    setSelectedReport(report);
    setCurrentView('detail');
  };

  const goBackToList = () => {
    setCurrentView('list');
    setSelectedReport(null);
  };

  const deleteReport = async (id) => {
    try {
      const updatedReports = reports.filter(report => report.id !== id);
      setReports(updatedReports);
      await AsyncStorage.setItem('incident_reports', JSON.stringify(updatedReports));
    } catch (error) {
      Alert.alert('Error', 'Failed to delete report');
    }
  };

  const renderReportItem = ({ item }) => (
    <TouchableOpacity style={styles.reportCard} onPress={() => viewReportDetails(item)}>
      <View style={styles.reportHeader}>
        <Text style={styles.reportType}>{item.incidentType}</Text>
        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>{item.status || 'Draft'}</Text>
        </View>
      </View>
      <Text style={styles.reportDate}>{item.timestamp ? new Date(item.timestamp).toLocaleString() : ''}</Text>
      <Text style={styles.reportDescription} numberOfLines={2}>{item.description}</Text>
      <View style={styles.cardActions}>
        <TouchableOpacity onPress={() => viewReportDetails(item)}>
          <Ionicons name="eye-outline" size={20} color="#555" />
          <Text style={styles.actionText}>View</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => deleteReport(item.id)}>
          <Ionicons name="trash-outline" size={20} color="#FF3B30" />
          <Text style={[styles.actionText, { color: '#FF3B30' }]}>Delete</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const ReportListView = () => (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Reports</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => navigation.navigate('GenerateReport')}>
          <Ionicons name="add" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>
      <FlatList
        data={reports}
        renderItem={renderReportItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.reportsList}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );

  const ReportDetailView = () => {
    if (!selectedReport) return null;
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={goBackToList}>
            <Ionicons name="chevron-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Report Details</Text>
          <TouchableOpacity style={styles.shareButton}>
            <Ionicons name="share-outline" size={24} color="#FF9EC3" />
          </TouchableOpacity>
        </View>
        <ScrollView style={styles.detailContainer} showsVerticalScrollIndicator={false}>
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
          <Text style={styles.sectionTitle}>INCIDENT SUMMARY</Text>
          <Text style={styles.summaryText}>{selectedReport.description}</Text>
          <Text style={styles.sectionTitle}>LOCATION</Text>
          <Text style={styles.locationText}>{selectedReport.location}</Text>
          <Text style={styles.sectionTitle}>EVIDENCE</Text>
          <Text style={styles.detailsText}>• {selectedReport.imageCount} Photo(s) attached</Text>
          <Text style={styles.detailsText}>• {selectedReport.hasRecording ? "Audio statement attached" : "No audio statement"}</Text>
        </ScrollView>
      </SafeAreaView>
    );
  };

  return currentView === 'list' ? <ReportListView /> : <ReportDetailView />;
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
    backgroundColor: '#FFFFFF',
  },
  backButton: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#000000' },
  addButton: { padding: 4 },
  shareButton: { padding: 4 },
  reportsList: { padding: 16 },
  reportCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  reportHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  reportType: { fontSize: 16, fontWeight: '600', color: '#000000', flex: 1 },
  statusBadge: { backgroundColor: '#FF9EC3', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusText: { color: '#FFFFFF', fontSize: 12, fontWeight: '600' },
  reportDate: { fontSize: 14, color: '#8E8E93', marginBottom: 8 },
  reportDescription: { fontSize: 14, color: '#3A3A3C', marginBottom: 16, lineHeight: 20 },
  cardActions: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#E5E5EA', paddingTop: 12 },
  actionText: { fontSize: 14, fontWeight: '500', color: '#555', marginLeft: 4 },
  detailContainer: { flex: 1, backgroundColor: '#F2F2F7', paddingHorizontal: 16 },
  titleContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, marginBottom: 4 },
  detailTitle: { fontSize: 22, fontWeight: '600', color: '#000000', flex: 1 },
  detailStatusBadge: { backgroundColor: '#FF9EC3', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
  detailStatusText: { color: '#FFFFFF', fontSize: 14, fontWeight: '600' },
  detailDateTime: { fontSize: 16, color: '#8E8E93', marginBottom: 16 },
  infoCard: { flexDirection: 'row', backgroundColor: '#F2F2F7', padding: 16, borderRadius: 8, marginBottom: 24 },
  infoLabel: { fontSize: 16, fontWeight: '600', color: '#000000' },
  infoValue: { fontSize: 16, color: '#000000' },
  sectionTitle: { fontSize: 14, fontWeight: '600', color: '#6C6C6C', marginTop: 20, marginBottom: 10 },
  summaryText: { fontSize: 16, color: '#3A3A3C', lineHeight: 22, marginBottom: 16 },
  locationText: { fontSize: 16, color: '#3A3A3C', marginBottom: 12 },
  detailsText: { fontSize: 16, color: '#3A3A3C', marginBottom: 16 },
  bottomSpacing: { height: 40 },
  reportContainer: { marginBottom: 20 },
  reportTitle: { fontSize: 18, fontWeight: '600', marginBottom: 4, color: '#333', textAlign: 'center' },
  reportTimestamp: { fontSize: 12, color: '#666', marginBottom: 12, textAlign: 'center' },
  reportSectionTitle: { fontSize: 16, fontWeight: '600', marginTop: 12, marginBottom: 4, color: '#444' },
  reportText: { fontSize: 14, color: '#444', lineHeight: 20 },
  photoScroll: { marginVertical: 8 },
  reportPhoto: { width: 120, height: 120, borderRadius: 8, marginRight: 8 },
});

export default MyReportScreen;
