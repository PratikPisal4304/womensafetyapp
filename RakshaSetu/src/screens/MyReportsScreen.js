import React, { useState } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  SafeAreaView, 
  FlatList, 
  StatusBar,
  ScrollView,
  Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const MyReportScreen = () => {
  // State to track which screen is currently being displayed
  const [currentView, setCurrentView] = useState('list'); // 'list' or 'detail'
  const [selectedReport, setSelectedReport] = useState(null);
  
  // Sample reports data
  const [reports, setReports] = useState([
    {
      id: '1',
      type: 'Harassment Incident Report',
      status: 'Draft',
      date: '6/3/2025',
      time: '1:04:42 am',
      reportId: 'RPT344612',
      description: 'On 6/3/2025 at approximately 12:58:20 am, the complainant reports experiencing harassment at Unnamed Road, Raigad, Maharashtra, 410208, India (19.060105, 73.138121).',
      location: 'Unnamed Road, Raigad, Maharashtra, 410208, India (19.060105, 73.138121)',
      details: 'Harass',
      evidence: [
        { type: 'photo', count: 0 },
        { type: 'audio', label: 'Audio Statement', attached: true }
      ]
    },
    {
      id: '2',
      type: 'Stalking Incident Report',
      status: 'Draft',
      date: '6/3/2025',
      time: '11:13:36 pm',
      reportId: 'RPT344613',
      description: 'On 6/3/2025 at approximately 11:13:36 pm, the complainant reports experiencing stalking at Unnamed Road, Raigad, Maharashtra, 410208, India (19.060105, 73.138121).',
      location: 'Unnamed Road, Raigad, Maharashtra, 410208, India (19.060105, 73.138121)',
      details: 'Stalking behavior observed over multiple days',
      evidence: [
        { type: 'photo', count: 2 },
        { type: 'audio', label: 'Audio Statement', attached: true }
      ]
    },
    {
      id: '3',
      type: 'Harassment Incident Report',
      status: 'Draft',
      date: '6/3/2025',
      time: '3:00:16 pm',
      reportId: 'RPT344614',
      description: 'On 6/3/2025 at approximately 3:00:16 pm, the complainant reports experiencing harassment at Unnamed Road, Raigad, Maharashtra, 410208, India (19.060105, 73.138121).',
      location: 'Unnamed Road, Raigad, Maharashtra, 410208, India (19.060105, 73.138121)',
      details: 'Verbal harassment',
      evidence: [
        { type: 'photo', count: 1 },
        { type: 'audio', label: 'Audio Statement', attached: false }
      ]
    }
  ]);

  // Handler to delete a report
  const deleteReport = (id) => {
    setReports(reports.filter(report => report.id !== id));
  };

  // Handler to view report details
  const viewReportDetails = (report) => {
    setSelectedReport(report);
    setCurrentView('detail');
  };

  // Handler to go back to list view
  const goBackToList = () => {
    setCurrentView('list');
    setSelectedReport(null);
  };

  // Render an item in the report list
  const renderReportItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.reportCard}
      onPress={() => viewReportDetails(item)}
    >
      <View style={styles.reportHeader}>
        <Text style={styles.reportType}>{item.type}</Text>
        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
      </View>
      
      <Text style={styles.reportDate}>{item.date} | {item.time}</Text>
      <Text style={styles.reportDescription} numberOfLines={2}>{item.description}</Text>
      
      <View style={styles.actionButtons}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => viewReportDetails(item)}
        >
          <Ionicons name="eye-outline" size={20} color="#555" />
          <Text style={styles.actionText}>View</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="share-outline" size={20} color="#555" />
          <Text style={styles.actionText}>Share</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.actionButton} 
          onPress={() => deleteReport(item.id)}
        >
          <Ionicons name="trash-outline" size={20} color="#FF3B30" />
          <Text style={[styles.actionText, { color: '#FF3B30' }]}>Delete</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  // Report list view
  const ReportListView = () => (
    <>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#333" />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>My Reports</Text>
        
        <TouchableOpacity style={styles.addButton}>
          <Ionicons name="add" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>
      
      <FlatList
        data={reports}
        renderItem={renderReportItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.reportsList}
        showsVerticalScrollIndicator={false}
      />
    </>
  );

  // Report detail view
  const ReportDetailView = () => {
    if (!selectedReport) return null;
    
    return (
      <>
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
            <Text style={styles.detailTitle}>{selectedReport.type}</Text>
            <View style={styles.detailStatusBadge}>
              <Text style={styles.detailStatusText}>{selectedReport.status}</Text>
            </View>
          </View>
          
          <Text style={styles.detailDateTime}>{selectedReport.date} {selectedReport.time}</Text>
          
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Report ID:</Text>
            <Text style={styles.infoValue}> {selectedReport.reportId}</Text>
          </View>
          
          <Text style={styles.sectionTitle}>INCIDENT SUMMARY</Text>
          <Text style={styles.summaryText}>{selectedReport.description}</Text>
          
          <Text style={styles.sectionTitle}>LOCATION</Text>
          <Text style={styles.locationText}>{selectedReport.location}</Text>
          
          <TouchableOpacity style={styles.mapContainer}>
            <View style={styles.mapPlaceholder}>
              <Ionicons name="map-outline" size={36} color="#888" />
              <Text style={styles.mapText}>Map View</Text>
            </View>
          </TouchableOpacity>
          
          <Text style={styles.sectionTitle}>INCIDENT DETAILS</Text>
          <Text style={styles.detailsText}>{selectedReport.details}</Text>
          
          <Text style={styles.sectionTitle}>EVIDENCE</Text>
          <View style={styles.evidenceContainer}>
            <Text style={styles.evidenceText}>• {selectedReport.evidence[0].count} Photo(s) attached</Text>
            <Text style={styles.evidenceText}>• Audio statement recording attached</Text>
            
            {selectedReport.evidence[1].attached && (
              <View style={styles.audioPlayer}>
                <Ionicons name="mic" size={24} color="#555" />
                <Text style={styles.audioLabel}>Audio Statement</Text>
                <TouchableOpacity style={styles.playButton}>
                  <Ionicons name="play" size={24} color="#FFF" />
                </TouchableOpacity>
              </View>
            )}
          </View>
          
          <Text style={styles.sectionTitle}>REPORT STATUS</Text>
          <View style={styles.statusContainer}>
            <View style={[styles.statusDot, styles.statusActive]}>
              <Text style={styles.statusStepText}>Draft</Text>
            </View>
            <View style={styles.statusLine} />
            <View style={styles.statusDot}>
              <Text style={styles.statusStepText}>Submitted</Text>
            </View>
            <View style={styles.statusLine} />
            <View style={styles.statusDot}>
              <Text style={styles.statusStepText}>Processing</Text>
            </View>
          </View>
          
          <TouchableOpacity style={styles.editButton}>
            <Ionicons name="create-outline" size={20} color="#FFF" />
            <Text style={styles.buttonText}>Edit Report</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.submitButton}>
            <Ionicons name="chevron-forward" size={20} color="#FFF" />
            <Text style={styles.buttonText}>Submit Report</Text>
          </TouchableOpacity>
          
          <View style={styles.bottomSpacing} />
        </ScrollView>
      </>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      {currentView === 'list' ? <ReportListView /> : <ReportDetailView />}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
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
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
  },
  addButton: {
    padding: 4,
  },
  shareButton: {
    padding: 4,
  },
  reportsList: {
    padding: 16,
  },
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
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  reportType: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    flex: 1,
  },
  statusBadge: {
    backgroundColor: '#FF9EC3',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  reportDate: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 8,
  },
  reportDescription: {
    fontSize: 14,
    color: '#3A3A3C',
    marginBottom: 16,
    lineHeight: 20,
  },
  actionButtons: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
    paddingTop: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 24,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#555',
    marginLeft: 4,
  },
  
  // Detail view styles
  detailContainer: {
    flex: 1,
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 16,
  },
  titleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 4,
  },
  detailTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#000000',
    flex: 1,
  },
  detailStatusBadge: {
    backgroundColor: '#FF9EC3',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  detailStatusText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  detailDateTime: {
    fontSize: 16,
    color: '#8E8E93',
    marginBottom: 16,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#F2F2F7',
    padding: 16,
    borderRadius: 8,
    marginBottom: 24,
  },
  infoLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  infoValue: {
    fontSize: 16,
    color: '#000000',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6C6C6C',
    marginTop: 20,
    marginBottom: 10,
  },
  summaryText: {
    fontSize: 16,
    color: '#3A3A3C',
    lineHeight: 22,
    marginBottom: 16,
  },
  locationText: {
    fontSize: 16,
    color: '#3A3A3C',
    marginBottom: 12,
  },
  mapContainer: {
    marginBottom: 24,
  },
  mapPlaceholder: {
    backgroundColor: '#EAEAEA',
    height: 150,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapText: {
    color: '#888',
    marginTop: 8,
    fontSize: 16,
  },
  detailsText: {
    fontSize: 16,
    color: '#3A3A3C',
    marginBottom: 16,
  },
  evidenceContainer: {
    marginBottom: 16,
  },
  evidenceText: {
    fontSize: 16,
    color: '#3A3A3C',
    marginBottom: 8,
  },
  audioPlayer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    padding: 14,
    borderRadius: 8,
    marginTop: 12,
    marginBottom: 16,
  },
  audioLabel: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    fontWeight: '500',
  },
  playButton: {
    backgroundColor: '#FF9EC3',
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 30,
    marginTop: 10,
    position: 'relative',
  },
  statusDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#D1D1D6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusActive: {
    backgroundColor: '#FF9EC3',
  },
  statusLine: {
    flex: 1,
    height: 2,
    backgroundColor: '#D1D1D6',
  },
  statusStepText: {
    position: 'absolute',
    top: 24,
    fontSize: 12,
    color: '#8E8E93',
    width: 80,
    textAlign: 'center',
    marginLeft: -30,
  },
  editButton: {
    backgroundColor: '#FF9EC3',
    borderRadius: 12,
    paddingVertical: 14,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButton: {
    backgroundColor: '#4CD964',
    borderRadius: 12,
    paddingVertical: 14,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  bottomSpacing: {
    height: 40,
  },
});

export default MyReportScreen;