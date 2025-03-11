import React, { useState, useEffect, useRef } from 'react';
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
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import { GoogleGenerativeAI } from '@google/generative-ai';

// New Firestore imports
import { setDoc, doc } from 'firebase/firestore';
import { db } from '../../config/firebaseConfig';

const GEMINI_API_KEY = 'AIzaSyBzqSJUt0MVs3xFjFWTvLwiyjXwnzbkXok'; // Replace with your key or use env variables
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

const GenerateReportScreen = ({ navigation }) => {
  const [incidentType, setIncidentType] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recording, setRecording] = useState(null);
  const [recordingUri, setRecordingUri] = useState(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const recordingInterval = useRef(null);
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [locationCoords, setLocationCoords] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  const [generatedReport, setGeneratedReport] = useState('');
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [reportData, setReportData] = useState(null);

  const incidentTypesOptions = [
    { id: 1, name: 'Harassment' },
    { id: 2, name: 'Stalking' },
    { id: 3, name: 'Assault' },
    { id: 4, name: 'Theft' },
    { id: 5, name: 'Vandalism' },
    { id: 6, name: 'Trespassing' }
  ];

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
    return () => {
      if (recordingInterval.current) clearInterval(recordingInterval.current);
    };
  }, []);

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

  // Enhanced voice recording with timer and blinking dot indicator
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
        interruptionModeAndroid: Audio.INTERRUPTION_MODE_ANDROID_DUCK_OTHERS,
      });
      const newRecording = new Audio.Recording();
      await newRecording.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      await newRecording.startAsync();
      setRecording(newRecording);
      setIsRecording(true);
      setRecordingDuration(0);
      recordingInterval.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
    } catch (error) {
      Alert.alert('Recording Error', error.message);
    }
  };

  const stopRecording = async () => {
    if (!recording) return;
    try {
      await recording.stopAndUnloadAsync();
      clearInterval(recordingInterval.current);
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

  const buildPrompt = () => {
    const reportDate = new Date();
    return `
**FIRST INFORMATION REPORT (FIR)**

**1. FIR Number and Date:**
*   **FIR Number:** [To be assigned by Police Station]
*   **Date of Report:** ${reportDate.toLocaleDateString()}

**2. Complainant Information:**
*   **Name:** [To be provided by Complainant]
*   **Address:** [To be provided by Complainant]
*   **Contact Number:** [To be provided by Complainant]
*   **Email Address:** [To be provided by Complainant]
*   **Occupation:** [To be provided by Complainant]

**3. Nature of Incident:**
*   ${incidentType}

**4. Time and Date of Incident:**
*   **Date:** ${reportDate.toLocaleDateString()}
*   **Time:** ${reportDate.toLocaleTimeString()}

**5. Location Details:**
*   **Location:** ${location}
*   **Pin Code:** [To be provided if available]
*   **GPS Coordinates:** ${locationCoords ? `${locationCoords.latitude.toFixed(6)} (Latitude), ${locationCoords.longitude.toFixed(6)} (Longitude)` : '[Not Available]'}
*   **Landmark (if any):** [To be provided by Complainant, if available]

**6. Detailed Description:**
${description}

**7. Evidence:**
*   **Photographic Evidence:** ${images.length} photo(s) attached.
*   **Other Evidence:** [To be provided by Complainant and Investigating Officer.]

**8. Action Requested:**
The complainant requests that the police investigate this matter thoroughly, identify any perpetrator(s), and take appropriate legal action to prevent further incidents.

**9. Declaration Statement:**
I, [Complainant's Name], declare that the information provided above is true and correct to the best of my knowledge and belief. I understand that providing false information is a punishable offense.

____________________________
(Signature of Complainant)

____________________________
(Name of Complainant)

**FOR POLICE USE ONLY:**
*   **Police Station:** [To be filled by Police Station]
*   **Investigating Officer:** [To be filled by Police Officer]
*   **Designation:** [To be filled by Police Officer]
*   **Date and Time of Receipt:** [To be filled by Police Officer]
*   **Sections of Law Applied:** [To be filled by Police Officer]
*   **Actions Taken:** [To be filled by Police Officer]
____________________________
(Signature of Investigating Officer)

____________________________
(Name and Designation of Investigating Officer)
    `;
  };

  const generateAIReport = async () => {
    if (!validateForm()) {
      Alert.alert('Validation Error', 'Please fix the errors and try again.');
      return;
    }
    try {
      setLoading(true);
      const promptText = buildPrompt();
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
      const result = await model.generateContent(promptText);
      const aiResponse = await result.response;
      const aiReport = aiResponse.text();
      const timestamp = new Date();
      const formattedReportData = {
        id: timestamp.toISOString(),
        incidentId: timestamp.toISOString(),
        timestamp,
        incidentType,
        location,
        locationCoords,
        description,
        hasRecording: !!recordingUri,
        imageCount: images.length,
        reportContent: aiReport,
        attachedImages: images
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

  // Connect with Firestore: Save report to database
  const saveReport = async (reportData) => {
    try {
      await setDoc(doc(db, 'incident_reports', reportData.id), reportData);
    } catch (error) {
      console.error('Saving report error:', error);
    }
  };

  // Helper: Convert images to base64 strings using Expo FileSystem
  const convertImagesToBase64 = async () => {
    const imagePromises = images.map(async (uri) => {
      try {
        const base64 = await FileSystem.readAsStringAsync(uri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        return `data:image/jpeg;base64,${base64}`;
      } catch (error) {
        console.error('Image conversion error:', error);
        return null;
      }
    });
    return (await Promise.all(imagePromises)).filter(img => img !== null);
  };

  const sharePdf = async () => {
    if (!reportData) return;
    try {
      const base64Images = await convertImagesToBase64();
      let imagesHtml = '';
      if (base64Images.length > 0) {
        imagesHtml = base64Images
          .map(
            (img, index) =>
              `<img src="${img}" alt="Attachment ${index + 1}" style="width:120px; height:120px; margin:4px; border-radius:8px;" />`
          )
          .join('');
      }
      const htmlContent = `
        <html>
          <head>
            <meta charset="utf-8" />
            <title>FIR Report</title>
            <style>
              body { font-family: Arial, sans-serif; background: #f8f8f8; margin: 0; padding: 20px; }
              .header { text-align: center; background-color: #ff6b93; color: white; padding: 10px; border-radius: 8px; margin-bottom: 20px; }
              .header h1 { margin: 0; }
              .section { background: white; padding: 15px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 5px rgba(0,0,0,0.1); }
              .section h2 { color: #ff6b93; margin-bottom: 10px; border-bottom: 1px solid #e0e0e0; padding-bottom: 5px; }
              .section p { font-size: 14px; line-height: 1.5; margin: 5px 0; }
              .images { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 10px; }
              .images img { width: 120px; height: 120px; border-radius: 8px; border: 1px solid #e0e0e0; object-fit: cover; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>FIRST INFORMATION REPORT (FIR)</h1>
            </div>
            <div class="section">
              <h2>FIR Number and Date</h2>
              <p><strong>FIR Number:</strong> [To be assigned by Police Station]</p>
              <p><strong>Date of Report:</strong> ${reportData.timestamp.toLocaleDateString()}</p>
            </div>
            <div class="section">
              <h2>Incident Details</h2>
              <p><strong>Incident ID:</strong> ${reportData.incidentId}</p>
              <p><strong>Incident Type:</strong> ${reportData.incidentType}</p>
              <p><strong>Date & Time of Incident:</strong> ${reportData.timestamp.toLocaleString()}</p>
              <p><strong>Location:</strong> ${reportData.location}</p>
              ${reportData.locationCoords ? `<p><strong>GPS Coordinates:</strong> (${reportData.locationCoords.latitude.toFixed(6)}, ${reportData.locationCoords.longitude.toFixed(6)})</p>` : ''}
            </div>
            <div class="section">
              <h2>Detailed Description</h2>
              <p>${reportData.description}</p>
            </div>
            <div class="section">
              <h2>Evidence</h2>
              <p><strong>Photographic Evidence:</strong> ${reportData.imageCount} photo(s) attached.</p>
              <p><strong>Audio Statement:</strong> ${reportData.hasRecording ? "Attached" : "Not provided"}</p>
            </div>
            ${imagesHtml ? `<div class="section">
              <h2>Attached Photos</h2>
              <div class="images">
                ${imagesHtml}
              </div>
            </div>` : ''}
          </body>
        </html>
      `;
      const { uri } = await Print.printToFileAsync({ html: htmlContent });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri);
      } else {
        Alert.alert('Sharing not available', 'Your device does not support sharing files.');
      }
    } catch (error) {
      Alert.alert('PDF Sharing Error', error.message);
    }
  };

  const renderFormattedReport = () => {
    if (!reportData) return null;
    return (
      <View style={styles.reportContainer}>
        <Text style={styles.reportTitle}>Incident ID: {reportData.incidentId}</Text>
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
      </View>
    );
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar style="dark" />
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
            {incidentTypesOptions.map((type) => (
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
          <View style={styles.recordingContainer}>
            <TouchableOpacity
              style={[styles.voiceButton, isRecording && styles.recordingActive]}
              onPress={isRecording ? stopRecording : startRecording}
            >
              <Ionicons name={isRecording ? "stop" : "mic"} size={24} color="white" />
              <Text style={styles.voiceButtonText}>
                {isRecording ? 'Stop Recording' : 'Record Voice Statement'}
              </Text>
              {isRecording && <View style={styles.blinkingDot} />}
            </TouchableOpacity>
            {isRecording && (
              <Text style={styles.recordingTimer}>
                {new Date(recordingDuration * 1000).toISOString().substr(11, 8)}
              </Text>
            )}
            {recordingUri && (
              <TouchableOpacity style={styles.playButton} onPress={playRecording}>
                <Ionicons name="play" size={20} color="#ff6b93" />
                <Text style={styles.playButtonText}>Play Recording</Text>
              </TouchableOpacity>
            )}
          </View>
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
                onPress={sharePdf}
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
  container: { flex: 1, backgroundColor: '#f8f8f8' },
  header: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 50, paddingBottom: 16,
    backgroundColor: 'white', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1, shadowRadius: 2,
  },
  backButton: { padding: 8 },
  headerTitle: { marginLeft: 16, fontSize: 20, fontWeight: '600', color: '#333' },
  scrollView: { flex: 1 },
  section: { marginVertical: 12, paddingHorizontal: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '600', marginBottom: 12, color: '#333' },
  required: { color: '#ff4757' },
  errorText: { color: '#ff4757', fontSize: 12, marginBottom: 8 },
  errorBorder: { borderColor: '#ff4757' },
  incidentTypesContainer: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -4 },
  incidentTypeButton: {
    backgroundColor: '#f1f1f1', borderRadius: 50, paddingHorizontal: 16, paddingVertical: 10,
    margin: 4, borderWidth: 1, borderColor: '#e0e0e0',
  },
  incidentTypeText: { fontSize: 14, color: '#666' },
  selectedIncidentType: { backgroundColor: '#ffebf1', borderColor: '#ff6b93' },
  selectedIncidentTypeText: { color: '#ff6b93', fontWeight: '500' },
  locationContainer: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', borderRadius: 8, padding: 12,
    borderWidth: 1, borderColor: '#e0e0e0',
  },
  locationIconContainer: { marginRight: 12 },
  locationText: { flex: 1, color: '#666', fontSize: 14 },
  editLocationButton: { alignSelf: 'flex-end', marginTop: 8 },
  editLocationText: { color: '#ff6b93', fontSize: 12 },
  descriptionInput: {
    backgroundColor: 'white', borderRadius: 8, borderWidth: 1, borderColor: '#e0e0e0', padding: 12,
    height: 120, fontSize: 14, color: '#333',
  },
  characterCount: { alignSelf: 'flex-end', fontSize: 12, color: '#999', marginTop: 4 },
  voiceButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#ff6b93',
    borderRadius: 50, paddingVertical: 12, marginTop: 16, position: 'relative'
  },
  recordingActive: { backgroundColor: '#ff4757' },
  voiceButtonText: { color: 'white', fontWeight: '600', marginLeft: 8 },
  blinkingDot: { width: 10, height: 10, backgroundColor: 'red', borderRadius: 5, marginLeft: 8 },
  recordingTimer: { textAlign: 'center', marginTop: 8, fontSize: 14, color: '#333' },
  playButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  playButtonText: { color: '#ff6b93', marginLeft: 4, fontWeight: '500' },
  imageOptionsContainer: { flexDirection: 'row', justifyContent: 'space-between' },
  imageOption: {
    flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', borderRadius: 8,
    padding: 12, marginHorizontal: 4, borderWidth: 1, borderColor: '#e0e0e0',
  },
  imageOptionIconContainer: { marginRight: 12 },
  imageOptionText: { color: '#666', fontSize: 14 },
  selectedImagesContainer: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 16 },
  imageContainer: { width: '30%', aspectRatio: 1, margin: '1.5%', position: 'relative' },
  selectedImage: { width: '100%', height: '100%', borderRadius: 8 },
  removeImageButton: { position: 'absolute', top: -8, right: -8, backgroundColor: 'white', borderRadius: 12, elevation: 2 },
  privacyNotice: { fontSize: 12, color: '#999', textAlign: 'center', marginTop: 16 },
  generateButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#ff6b93',
    borderRadius: 8, paddingVertical: 16, margin: 16, elevation: 2,
  },
  generateButtonText: { color: 'white', fontWeight: '600', fontSize: 16, marginLeft: 8 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: 'white', borderRadius: 8, padding: 20, maxHeight: '80%' },
  modalHeader: { borderBottomWidth: 1, borderBottomColor: '#ddd', paddingBottom: 8, marginBottom: 12 },
  modalTitle: { fontSize: 20, fontWeight: '600', color: '#333', textAlign: 'center' },
  modalScroll: { paddingBottom: 20 },
  reportContainer: { marginBottom: 20 },
  reportTitle: { fontSize: 18, fontWeight: '600', marginBottom: 4, color: '#333', textAlign: 'center' },
  reportTimestamp: { fontSize: 12, color: '#666', marginBottom: 12, textAlign: 'center' },
  reportSectionTitle: { fontSize: 16, fontWeight: '600', marginTop: 12, marginBottom: 4, color: '#444' },
  reportText: { fontSize: 14, color: '#444', lineHeight: 20 },
  photoScroll: { marginVertical: 8 },
  reportPhoto: { width: 120, height: 120, borderRadius: 8, marginRight: 8 },
  aiAnalysisContainer: { marginTop: 8, backgroundColor: '#f0f0f0', borderRadius: 8, padding: 10 },
  aiAnalysisText: { fontSize: 14, color: '#333', lineHeight: 20 },
  modalFooter: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  modalActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ff6b93',
    paddingVertical: 5,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginHorizontal: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  modalActionButtonText: { color: 'white', fontWeight: '700', fontSize: 16, marginLeft: 8 },
  closeModalButton: {
    backgroundColor: '#ff6b93',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  closeModalButtonText: { color: 'white', fontWeight: '700', fontSize: 16 },
});

export default GenerateReportScreen;
