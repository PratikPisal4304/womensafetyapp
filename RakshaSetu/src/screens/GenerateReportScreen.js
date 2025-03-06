import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  ScrollView, 
  Image,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Modal
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { Audio } from 'expo-av';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GoogleGenerativeAI } from '@google/generative-ai';

const GEMINI_API_KEY = 'AIzaSyCUF0kBZIejCA-MqXx59nYyAj3CN-VNQmY'; // Use environment variables in production
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

const GenerateReportScreen = ({ navigation }) => {
  // State variables
  const [incidentType, setIncidentType] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recording, setRecording] = useState(null);
  const [recordingUri, setRecordingUri] = useState(null);
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [locationCoords, setLocationCoords] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  const [generatedReport, setGeneratedReport] = useState('');
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [reportData, setReportData] = useState(null);

  // Incident type options
  const incidentTypes = [
    { id: 1, name: 'Harassment' },
    { id: 2, name: 'Stalking' },
    { id: 3, name: 'Assault' },
    { id: 4, name: 'Theft' },
    { id: 5, name: 'Vandalism' },
    { id: 6, name: 'Trespassing' }
  ];

  // Request permissions on mount
  useEffect(() => {
    (async () => {
      const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
      const mediaLibraryPermission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      const locationPermission = await Location.requestForegroundPermissionsAsync();
      const audioPermission = await Audio.requestPermissionsAsync();
      
      if (!cameraPermission.granted || !mediaLibraryPermission.granted || 
          !locationPermission.granted || !audioPermission.granted) {
        Alert.alert(
          'Permissions Required',
          'This app requires camera, media library, location, and microphone permissions to function properly.',
          [{ text: 'OK' }]
        );
      }
    })();
  }, []);

  // Get current location
  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission was denied');
        setFormErrors({ ...formErrors, location: 'Location permission denied' });
        return;
      }
      
      setLocation('Getting your location...');
      const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      setLocationCoords({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude
      });
      
      const address = await Location.reverseGeocodeAsync({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude
      });
      
      if (address && address.length > 0) {
        const { street, name, city, region, postalCode, country } = address[0];
        const streetName = street || name || 'Unnamed Road';
        const formattedAddress = `${streetName}, ${city || ''}, ${region || ''}, ${postalCode || ''}, ${country || ''}`;
        setLocation(formattedAddress);
        if (formErrors.location) {
          const { location, ...rest } = formErrors;
          setFormErrors(rest);
        }
      }
    } catch (error) {
      Alert.alert('Location Error', error.message);
      setFormErrors({ ...formErrors, location: 'Failed to get location' });
    }
  };

  // Voice recording functions
  const startRecording = async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Microphone Permission Denied', 'Cannot access microphone');
        return;
      }
      
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        interruptionModeIOS: Audio.INTERRUPTION_MODE_IOS_DO_NOT_MIX,
        interruptionModeAndroid: Audio.INTERRUPTION_MODE_ANDROID_DO_NOT_MIX,
      });
      
      const newRecording = new Audio.Recording();
      await newRecording.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      await newRecording.startAsync();
      
      setRecording(newRecording);
      setIsRecording(true);
    } catch (error) {
      Alert.alert('Recording Error', error.message);
    }
  };

  const stopRecording = async () => {
    if (!recording) return;
    
    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecordingUri(uri);
      setIsRecording(false);
      Alert.alert('Recording Saved', 'Your voice statement has been saved.');
    } catch (error) {
      Alert.alert('Recording Error', error.message);
    }
  };

  const playRecording = async () => {
    if (!recordingUri) return;
    try {
      const { sound } = await Audio.Sound.createAsync({ uri: recordingUri });
      await sound.playAsync();
    } catch (error) {
      Alert.alert('Playback Error', error.message);
    }
  };

  // Image functions
  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Camera Permission Required', 'Please grant camera permission.');
        return;
      }
      
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });
      
      if (!result.canceled) {
        setImages([...images, result.assets[0].uri]);
      }
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Media Library Permission Required', 'Please grant media library permission.');
        return;
      }
      
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        allowsEditing: false,
        quality: 0.8,
      });
      
      if (!result.canceled) {
        const newImages = result.assets.map(asset => asset.uri);
        setImages([...images, ...newImages]);
      }
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  // Form validation
  const validateForm = () => {
    const errors = {};
    if (!incidentType) errors.incidentType = 'Select an incident type';
    if (!description || description.trim().length < 20) {
      errors.description = 'Provide a detailed description (min 20 characters)';
    }
    if (!location) errors.location = 'Add a location';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Build prompt for Gemini API (text-only)
  const buildPrompt = () => {
    return `
      INCIDENT REPORT

      Incident Type: ${incidentType}
      Date: ${new Date().toLocaleString()}
      Location: ${location}
      ${locationCoords ? `Coordinates: (${locationCoords.latitude.toFixed(6)}, ${locationCoords.longitude.toFixed(6)})` : ''}

      Description:
      ${description}

      Evidence:
      - ${images.length} Photo(s) (attached separately)
      - ${recordingUri ? "Audio statement attached" : "No audio statement"}

      ------------------------------------------------------------
      Please generate a structured report with the following sections:
      
      1. Summary: A brief overview of the incident.
      2. Severity Assessment: Analysis of the seriousness and any potential legal implications.
      3. Recommendations: Next steps for both the reporter and law enforcement.
      4. Safety Advice: Specific recommendations for the reporter’s safety.
      
      Format the report in a professional, formal style as if it were filed by law enforcement.
    `;
  };

  // Generate AI Report and display in modal (text-only)
  const generateAIReport = async () => {
    if (!validateForm()) {
      Alert.alert('Validation Error', 'Please fix the errors and try again.');
      return;
    }
    
    try {
      setLoading(true);
      const promptText = buildPrompt();
      
      // Call Gemini using text-only prompt
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
      const result = await model.generateContent(promptText);
      
      const aiResponse = await result.response;
      const aiReport = aiResponse.text();
      
      // Create report data
      const timestamp = new Date();
      const formattedReportData = {
        id: timestamp.toISOString(),
        timestamp: timestamp,
        incidentType,
        location,
        locationCoords,
        description,
        hasRecording: !!recordingUri,
        imageCount: images.length,
        reportContent: aiReport,
        attachedImages: images  // Save the image URIs to display later
      };
      
      await saveReport(formattedReportData);
      setReportData(formattedReportData);
      setGeneratedReport(aiReport);
      setReportModalVisible(true);
      setLoading(false);
    } catch (error) {
      setLoading(false);
      console.error('Gemini API error:', error);
      Alert.alert('Error', 'Failed to generate report. Please try again later.');
    }
  };

  // Save report data to AsyncStorage
  const saveReport = async (reportData) => {
    try {
      const reportsJson = await AsyncStorage.getItem('incident_reports');
      const reports = reportsJson ? JSON.parse(reportsJson) : [];
      reports.unshift(reportData);
      await AsyncStorage.setItem('incident_reports', JSON.stringify(reports));
    } catch (error) {
      console.error('Saving report error:', error);
    }
  };

  // Optional: Reset form after report generation
  const resetForm = () => {
    setIncidentType('');
    setLocation('');
    setDescription('');
    setRecordingUri(null);
    setImages([]);
    setLocationCoords(null);
    setFormErrors({});
  };

  // Render formatted report for modal, including attached photos
  const renderFormattedReport = () => {
    if (!reportData) return null;
    
    return (
      <View style={styles.reportContainer}>
        <Text style={styles.reportTitle}>{reportData.incidentType} Incident Report</Text>
        <Text style={styles.reportTimestamp}>
          {reportData.timestamp.toLocaleDateString()} {reportData.timestamp.toLocaleTimeString()}
        </Text>
        <Text style={styles.reportSectionTitle}>SUMMARY</Text>
        <Text style={styles.reportText}>
          On {reportData.timestamp.toLocaleDateString()} at approximately {reportData.timestamp.toLocaleTimeString()}, the complainant reported a {reportData.incidentType.toLowerCase()} incident at {reportData.location}
          {reportData.locationCoords ? ` (${reportData.locationCoords.latitude.toFixed(6)}, ${reportData.locationCoords.longitude.toFixed(6)})` : ''}.
        </Text>
        <Text style={styles.reportSectionTitle}>DETAILS</Text>
        <Text style={styles.reportText}>{reportData.description}</Text>
        <Text style={styles.reportSectionTitle}>EVIDENCE</Text>
        <Text style={styles.reportText}>• {reportData.imageCount} Photo(s) attached</Text>
        <Text style={styles.reportText}>• {reportData.hasRecording ? "Audio statement attached" : "No audio statement"}</Text>
        {reportData.attachedImages && reportData.attachedImages.length > 0 && (
          <>
            <Text style={styles.reportSectionTitle}>ATTACHED PHOTOS</Text>
            <ScrollView horizontal style={styles.photoScroll}>
              {reportData.attachedImages.map((uri, index) => (
                <Image key={index} source={{ uri }} style={styles.reportPhoto} />
              ))}
            </ScrollView>
          </>
        )}
        {reportData.reportContent && (
          <>
            <Text style={styles.reportSectionTitle}>AI ANALYSIS</Text>
            <Text style={styles.reportText}>{reportData.reportContent}</Text>
          </>
        )}
      </View>
    );
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar style="dark" />
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#555" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>File Incident Report</Text>
      </View>
      
      <ScrollView style={styles.scrollView}>
        {/* Incident Type */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Type of Incident<Text style={styles.required}>*</Text></Text>
          {formErrors.incidentType && <Text style={styles.errorText}>{formErrors.incidentType}</Text>}
          <View style={styles.incidentTypesContainer}>
            {incidentTypes.map((type) => (
              <TouchableOpacity
                key={type.id}
                style={[
                  styles.incidentTypeButton,
                  incidentType === type.name && styles.selectedIncidentType,
                  formErrors.incidentType && !incidentType && styles.errorBorder
                ]}
                onPress={() => {
                  setIncidentType(type.name);
                  if (formErrors.incidentType) {
                    const { incidentType, ...rest } = formErrors;
                    setFormErrors(rest);
                  }
                }}
              >
                <Text style={[styles.incidentTypeText, incidentType === type.name && styles.selectedIncidentTypeText]}>
                  {type.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        
        {/* Location */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Location<Text style={styles.required}>*</Text></Text>
          {formErrors.location && <Text style={styles.errorText}>{formErrors.location}</Text>}
          <TouchableOpacity 
            style={[styles.locationContainer, formErrors.location && styles.errorBorder]}
            onPress={getCurrentLocation}
          >
            <View style={styles.locationIconContainer}>
              <Ionicons name="location" size={24} color="#ff6b93" />
            </View>
            <Text style={styles.locationText}>
              {location || 'Tap to get your current location'}
            </Text>
            {!location && <Ionicons name="chevron-forward" size={20} color="#999" />}
          </TouchableOpacity>
          {location && (
            <TouchableOpacity style={styles.editLocationButton} onPress={() => {
              if (Platform.OS === 'ios') {
                Alert.prompt(
                  'Edit Location',
                  'Enter location manually:',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Save', onPress: (text) => {
                        if (text && text.trim()) {
                          setLocation(text.trim());
                          if (formErrors.location) {
                            const { location, ...rest } = formErrors;
                            setFormErrors(rest);
                          }
                        }
                      } 
                    },
                  ],
                  'plain-text',
                  location
                );
              } else {
                Alert.alert('Edit Location', 'Manual editing is only available on iOS.');
              }
            }}>
              <Text style={styles.editLocationText}>Edit manually</Text>
            </TouchableOpacity>
          )}
        </View>
        
        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Describe what happened<Text style={styles.required}>*</Text></Text>
          {formErrors.description && <Text style={styles.errorText}>{formErrors.description}</Text>}
          <TextInput
            style={[styles.descriptionInput, formErrors.description && styles.errorBorder]}
            placeholder="Provide details of the incident..."
            multiline
            textAlignVertical="top"
            value={description}
            onChangeText={(text) => {
              setDescription(text);
              if (formErrors.description && text.trim().length >= 20) {
                const { description, ...rest } = formErrors;
                setFormErrors(rest);
              }
            }}
          />
          <Text style={styles.characterCount}>
            {description.length} characters {description.length < 20 && '(min 20)'}
          </Text>
          {/* Voice Recording */}
          <TouchableOpacity
            style={[styles.voiceButton, isRecording && styles.recordingActive]}
            onPress={isRecording ? stopRecording : startRecording}
          >
            <Ionicons name={isRecording ? "stop" : "mic"} size={24} color="white" />
            <Text style={styles.voiceButtonText}>
              {isRecording ? 'Stop Recording' : 'Record Voice Statement'}
            </Text>
          </TouchableOpacity>
          {recordingUri && (
            <TouchableOpacity style={styles.playButton} onPress={playRecording}>
              <Ionicons name="play" size={20} color="#ff6b93" />
              <Text style={styles.playButtonText}>Play Recording</Text>
            </TouchableOpacity>
          )}
        </View>
        
        {/* Images */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Add Images (Optional)</Text>
          <View style={styles.imageOptionsContainer}>
            <TouchableOpacity style={styles.imageOption} onPress={takePhoto}>
              <View style={styles.imageOptionIconContainer}>
                <Ionicons name="camera" size={24} color="#ff6b93" />
              </View>
              <Text style={styles.imageOptionText}>Take Photo</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.imageOption} onPress={pickImage}>
              <View style={styles.imageOptionIconContainer}>
                <Ionicons name="image" size={24} color="#ff6b93" />
              </View>
              <Text style={styles.imageOptionText}>Upload Image</Text>
            </TouchableOpacity>
          </View>
          {images.length > 0 && (
            <View style={styles.selectedImagesContainer}>
              {images.map((uri, index) => (
                <View key={index} style={styles.imageContainer}>
                  <Image source={{ uri }} style={styles.selectedImage} />
                  <TouchableOpacity 
                    style={styles.removeImageButton}
                    onPress={() => {
                      const newImages = [...images];
                      newImages.splice(index, 1);
                      setImages(newImages);
                    }}
                  >
                    <Ionicons name="close-circle" size={24} color="#ff6b93" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>
        
        {/* Privacy Notice */}
        <View style={styles.section}>
          <Text style={styles.privacyNotice}>
            Your report will be processed using AI technology to assist law enforcement. All data is encrypted and handled according to our privacy policy.
          </Text>
        </View>
      </ScrollView>
      
      {/* Generate Report Button */}
      <TouchableOpacity 
        style={styles.generateButton}
        onPress={generateAIReport}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="white" size="small" />
        ) : (
          <>
            <MaterialIcons name="generating-tokens" size={24} color="white" />
            <Text style={styles.generateButtonText}>Generate AI Report</Text>
          </>
        )}
      </TouchableOpacity>

      {/* Report Modal */}
      <Modal
        visible={reportModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setReportModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>AI Generated Report</Text>
            </View>
            <ScrollView contentContainerStyle={styles.modalScroll}>
              {renderFormattedReport()}
            </ScrollView>
            <View style={styles.modalFooter}>
              <TouchableOpacity 
                style={styles.modalActionButton}
                onPress={() => {
                  Alert.alert('Share PDF', 'This would export a PDF of the report.');
                }}
              >
                <Ionicons name="share-outline" size={20} color="white" />
                <Text style={styles.modalActionButtonText}>Share PDF</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalActionButton, styles.submitButton]}
                onPress={() => {
                  Alert.alert('Submit to Police', 'This would submit the report to law enforcement.');
                }}
              >
                <Ionicons name="send-outline" size={20} color="white" />
                <Text style={styles.modalActionButtonText}>Submit to Police</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity 
              style={styles.closeModalButton} 
              onPress={() => {
                setReportModalVisible(false);
                // Optionally, reset the form here
                // resetForm();
              }}
            >
              <Text style={styles.closeModalButtonText}>Close Report</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#f8f8f8' 
  },
  header: {
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 16, 
    paddingTop: 50, 
    paddingBottom: 16,
    backgroundColor: 'white', 
    elevation: 2, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1, 
    shadowRadius: 2,
  },
  backButton: { 
    padding: 8 
  },
  headerTitle: { 
    marginLeft: 16, 
    fontSize: 20, 
    fontWeight: '600', 
    color: '#333' 
  },
  scrollView: { 
    flex: 1 
  },
  section: { 
    marginVertical: 12, 
    paddingHorizontal: 16 
  },
  sectionTitle: { 
    fontSize: 16, 
    fontWeight: '600', 
    marginBottom: 12, 
    color: '#333' 
  },
  required: { 
    color: '#ff4757' 
  },
  errorText: { 
    color: '#ff4757', 
    fontSize: 12, 
    marginBottom: 8 
  },
  errorBorder: { 
    borderColor: '#ff4757' 
  },
  incidentTypesContainer: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    marginHorizontal: -4 
  },
  incidentTypeButton: {
    backgroundColor: '#f1f1f1', 
    borderRadius: 50, 
    paddingHorizontal: 16, 
    paddingVertical: 10,
    margin: 4, 
    borderWidth: 1, 
    borderColor: '#e0e0e0',
  },
  incidentTypeText: { 
    fontSize: 14, 
    color: '#666' 
  },
  selectedIncidentType: { 
    backgroundColor: '#ffebf1', 
    borderColor: '#ff6b93' 
  },
  selectedIncidentTypeText: { 
    color: '#ff6b93', 
    fontWeight: '500' 
  },
  locationContainer: {
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: 'white', 
    borderRadius: 8, 
    padding: 12,
    borderWidth: 1, 
    borderColor: '#e0e0e0',
  },
  locationIconContainer: { 
    marginRight: 12 
  },
  locationText: { 
    flex: 1, 
    color: '#666', 
    fontSize: 14 
  },
  editLocationButton: { 
    alignSelf: 'flex-end', 
    marginTop: 8 
  },
  editLocationText: { 
    color: '#ff6b93', 
    fontSize: 12 
  },
  descriptionInput: {
    backgroundColor: 'white', 
    borderRadius: 8, 
    borderWidth: 1, 
    borderColor: '#e0e0e0', 
    padding: 12,
    height: 120, 
    fontSize: 14, 
    color: '#333',
  },
  characterCount: { 
    alignSelf: 'flex-end', 
    fontSize: 12, 
    color: '#999', 
    marginTop: 4 
  },
  voiceButton: {
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    backgroundColor: '#ff6b93',
    borderRadius: 50, 
    paddingVertical: 12, 
    marginTop: 16,
  },
  recordingActive: { 
    backgroundColor: '#ff4757' 
  },
  voiceButtonText: { 
    color: 'white', 
    fontWeight: '500', 
    marginLeft: 8 
  },
  playButton: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    marginTop: 8 
  },
  playButtonText: { 
    color: '#ff6b93', 
    marginLeft: 4, 
    fontWeight: '500' 
  },
  imageOptionsContainer: { 
    flexDirection: 'row', 
    justifyContent: 'space-between' 
  },
  imageOption: {
    flex: 1, 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: 'white', 
    borderRadius: 8,
    padding: 12, 
    marginHorizontal: 4, 
    borderWidth: 1, 
    borderColor: '#e0e0e0',
  },
  imageOptionIconContainer: { 
    marginRight: 12 
  },
  imageOptionText: { 
    color: '#666', 
    fontSize: 14 
  },
  selectedImagesContainer: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    marginTop: 16 
  },
  imageContainer: {
    width: '30%', 
    aspectRatio: 1, 
    margin: '1.5%', 
    position: 'relative',
  },
  selectedImage: { 
    width: '100%', 
    height: '100%', 
    borderRadius: 8 
  },
  removeImageButton: {
    position: 'absolute', 
    top: -8, 
    right: -8, 
    backgroundColor: 'white', 
    borderRadius: 12, 
    elevation: 2,
  },
  privacyNotice: { 
    fontSize: 12, 
    color: '#999', 
    textAlign: 'center', 
    marginTop: 16 
  },
  generateButton: {
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    backgroundColor: '#ff6b93',
    borderRadius: 8, 
    paddingVertical: 16, 
    margin: 16, 
    elevation: 2,
  },
  generateButtonText: { 
    color: 'white', 
    fontWeight: '600', 
    fontSize: 16, 
    marginLeft: 8 
  },
  // Modal styles
  modalOverlay: {
    flex: 1, 
    backgroundColor: 'rgba(0,0,0,0.5)', 
    justifyContent: 'center', 
    padding: 20,
  },
  modalContent: {
    backgroundColor: 'white', 
    borderRadius: 8, 
    padding: 20, 
    maxHeight: '80%',
  },
  modalHeader: {
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    paddingBottom: 8,
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 20, 
    fontWeight: '600', 
    color: '#333', 
    textAlign: 'center',
  },
  modalScroll: { 
    paddingBottom: 20 
  },
  reportContainer: {
    marginBottom: 20,
  },
  reportTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
    color: '#333',
    textAlign: 'center',
  },
  reportTimestamp: {
    fontSize: 12,
    color: '#666',
    marginBottom: 12,
    textAlign: 'center',
  },
  reportSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 4,
    color: '#444',
  },
  reportText: {
    fontSize: 14,
    color: '#444',
    lineHeight: 20,
  },
  photoScroll: {
    marginVertical: 8,
  },
  reportPhoto: {
    width: 120,
    height: 120,
    borderRadius: 8,
    marginRight: 8,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  modalActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ff6b93',
    paddingVertical: 10,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  modalActionButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
    marginLeft: 4,
  },
  closeModalButton: {
    backgroundColor: '#ff6b93',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  closeModalButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
});

export default GenerateReportScreen;
