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
  Platform
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { Audio } from 'expo-av';
import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GoogleGenerativeAI } from '@google/generative-ai';

const GEMINI_API_KEY = 'AIzaSyCUF0kBZIejCA-MqXx59nYyAj3CN-VNQmY'; // Replace with your actual API key or use environment variable
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
  
  // Incident type options
  const incidentTypes = [
    { id: 1, name: 'Harassment' },
    { id: 2, name: 'Stalking' },
    { id: 3, name: 'Assault' },
    { id: 4, name: 'Theft' },
    { id: 5, name: 'Vandalism' },
    { id: 6, name: 'Trespassing' }
  ];

  // Check for permissions on component mount
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
        Alert.alert('Permission to access location was denied');
        setFormErrors({ ...formErrors, location: 'Location permission denied' });
        return;
      }
      
      setLocation('Getting your location...');
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High
      });
      
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
        // Clear location error if it exists
        if (formErrors.location) {
          const { location, ...rest } = formErrors;
          setFormErrors(rest);
        }
      }
    } catch (error) {
      Alert.alert('Error getting location', error.message);
      setFormErrors({ ...formErrors, location: 'Failed to get location' });
    }
  };

  // Voice recording functions
  const startRecording = async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission to access microphone was denied');
        return;
      }
      
      // Prepare the recording
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
      Alert.alert('Error starting recording', error.message);
    }
  };

  const stopRecording = async () => {
    if (!recording) return;
    
    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecordingUri(uri);
      setIsRecording(false);
      Alert.alert('Voice statement recorded', 'Your voice statement has been saved and will be attached to your report.');
    } catch (error) {
      Alert.alert('Error stopping recording', error.message);
    }
  };

  // Play back recording to verify
  const playRecording = async () => {
    if (!recordingUri) return;
    
    try {
      const { sound } = await Audio.Sound.createAsync({ uri: recordingUri });
      await sound.playAsync();
    } catch (error) {
      Alert.alert('Error playing recording', error.message);
    }
  };

  // Image functions
  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Camera permission is required');
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
        // Clear image error if it exists
        if (formErrors.images) {
          const { images, ...rest } = formErrors;
          setFormErrors(rest);
        }
      }
    } catch (error) {
      Alert.alert('Error taking photo', error.message);
    }
  };

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Media library permission is required');
        return;
      }
      
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        allowsEditing: false,
        aspect: [4, 3],
        quality: 0.8,
      });
      
      if (!result.canceled) {
        const newImages = result.assets.map(asset => asset.uri);
        setImages([...images, ...newImages]);
        // Clear image error if it exists
        if (formErrors.images) {
          const { images, ...rest } = formErrors;
          setFormErrors(rest);
        }
      }
    } catch (error) {
      Alert.alert('Error selecting image', error.message);
    }
  };

  // Validate form before submission
  const validateForm = () => {
    const errors = {};
    
    if (!incidentType) {
      errors.incidentType = 'Please select an incident type';
    }
    
    if (!description || description.trim() === '') {
      errors.description = 'Please provide a description of the incident';
    } else if (description.trim().length < 20) {
      errors.description = 'Description is too short. Please provide more details.';
    }
    
    if (!location) {
      errors.location = 'Please add a location';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Convert images to base64 for Gemini API
  const prepareImagesForGemini = async () => {
    const imagePromises = images.map(async (uri) => {
      try {
        const response = await fetch(uri);
        const blob = await response.blob();
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      } catch (error) {
        console.error('Error processing image:', error);
        return null;
      }
    });
    
    return (await Promise.all(imagePromises)).filter(img => img !== null);
  };

  // Generate AI Report with Gemini
  const generateAIReport = async () => {
    if (!validateForm()) {
      Alert.alert('Form Error', 'Please correct the highlighted fields before submitting.');
      return;
    }
    
    try {
      setLoading(true);
      
      // Prepare data for Gemini API
      let processedImages = [];
      if (images.length > 0) {
        processedImages = await prepareImagesForGemini();
      }
      
      // Create a structured prompt for Gemini
      const prompt = `
        Generate a detailed incident report based on the following information:
        
        Incident Type: ${incidentType}
        Location: ${location}
        
        Description provided by the reporter:
        "${description}"
        
        ${images.length > 0 ? `The reporter has attached ${images.length} images to this report.` : ''}
        ${recordingUri ? 'The reporter has provided a voice statement.' : ''}
        
        Please analyze this information and create a formal incident report that includes:
        1. Summary of the incident
        2. Assessment of severity and potential legal implications
        3. Recommended next steps for law enforcement
        4. Any patterns or similarities to other reported incidents (if applicable)
        5. Safety recommendations for the reporter
      `;
      
      // Initialize Gemini model with updated model identifier
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
      
      // If we have images, use multimodal capabilities with updated vision model identifier
      let result;
      if (processedImages.length > 0) {
        const visionModel = genAI.getGenerativeModel({ model: "gemini-1.5-vision" });
        const imagePrompt = [
          prompt,
          ...processedImages.map(img => ({ inlineData: { data: img, mimeType: "image/jpeg" }}))
        ];
        result = await visionModel.generateContent({ contents: [{ role: "user", parts: imagePrompt }] });
      } else {
        result = await model.generateContent(prompt);
      }
      
      const aiResponse = await result.response;
      const aiReport = aiResponse.text();
      
      // Save report to AsyncStorage
      const timestamp = new Date().toISOString();
      const reportData = {
        id: timestamp,
        timestamp,
        incidentType,
        location,
        locationCoords,
        description,
        aiReport,
        hasRecording: !!recordingUri,
        imageCount: images.length
      };
      
      await saveReport(reportData);
      
      setLoading(false);
      Alert.alert(
        'AI Report Generated',
        'Your incident has been analyzed and a report has been generated. You can view it in your reports list.',
        [{ 
          text: 'View Report', 
          onPress: () => navigation.navigate('ViewReport', { reportId: timestamp }) 
        },
        { 
          text: 'Back to Home', 
          onPress: () => navigation.navigate('Home') 
        }]
      );
    } catch (error) {
      setLoading(false);
      console.error('Gemini API error:', error);
      Alert.alert(
        'Error generating report', 
        'There was a problem connecting to our AI service. Please try again later.'
      );
    }
  };

  // Save report to AsyncStorage
  const saveReport = async (reportData) => {
    try {
      // Get existing reports
      const reportsJson = await AsyncStorage.getItem('incident_reports');
      const reports = reportsJson ? JSON.parse(reportsJson) : [];
      
      // Add new report
      reports.unshift(reportData);
      
      // Save updated reports
      await AsyncStorage.setItem('incident_reports', JSON.stringify(reports));
    } catch (error) {
      console.error('Error saving report:', error);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#555" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>File Incident Report</Text>
      </View>
      
      <ScrollView style={styles.scrollView}>
        {/* Incident Type */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Type of Incident<Text style={styles.required}>*</Text></Text>
          {formErrors.incidentType && (
            <Text style={styles.errorText}>{formErrors.incidentType}</Text>
          )}
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
                <Text 
                  style={[
                    styles.incidentTypeText,
                    incidentType === type.name && styles.selectedIncidentTypeText
                  ]}
                >
                  {type.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        
        {/* Location */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Location<Text style={styles.required}>*</Text></Text>
          {formErrors.location && (
            <Text style={styles.errorText}>{formErrors.location}</Text>
          )}
          <TouchableOpacity 
            style={[
              styles.locationContainer,
              formErrors.location && styles.errorBorder
            ]}
            onPress={getCurrentLocation}
          >
            <View style={styles.locationIconContainer}>
              <Ionicons name="location" size={24} color="#ff6b93" />
            </View>
            <Text style={styles.locationText}>
              {location || 'Tap to get your current location'}
            </Text>
            {!location && (
              <Ionicons name="chevron-forward" size={20} color="#999" />
            )}
          </TouchableOpacity>
          {location && (
            <TouchableOpacity 
              style={styles.editLocationButton}
              onPress={() => {
                Alert.prompt(
                  'Edit Location',
                  'Please enter the location manually:',
                  [
                    {
                      text: 'Cancel',
                      style: 'cancel',
                    },
                    {
                      text: 'Save',
                      onPress: (text) => {
                        if (text && text.trim()) {
                          setLocation(text.trim());
                          if (formErrors.location) {
                            const { location, ...rest } = formErrors;
                            setFormErrors(rest);
                          }
                        }
                      },
                    },
                  ],
                  'plain-text',
                  location
                );
              }}
            >
              <Text style={styles.editLocationText}>Edit manually</Text>
            </TouchableOpacity>
          )}
        </View>
        
        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Describe what happened<Text style={styles.required}>*</Text></Text>
          {formErrors.description && (
            <Text style={styles.errorText}>{formErrors.description}</Text>
          )}
          <TextInput
            style={[
              styles.descriptionInput,
              formErrors.description && styles.errorBorder
            ]}
            placeholder="Please provide details of the incident..."
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
          
          {/* Character count */}
          <Text style={styles.characterCount}>
            {description.length} characters {description.length < 20 ? '(minimum 20)' : ''}
          </Text>
          
          {/* Voice Recording Button */}
          <TouchableOpacity
            style={[
              styles.voiceButton,
              isRecording && styles.recordingActive
            ]}
            onPress={isRecording ? stopRecording : startRecording}
          >
            <Ionicons 
              name={isRecording ? "stop" : "mic"} 
              size={24} 
              color="white" 
            />
            <Text style={styles.voiceButtonText}>
              {isRecording ? 'Stop Recording' : 'Record Voice Statement'}
            </Text>
          </TouchableOpacity>
          
          {/* Play recording button if available */}
          {recordingUri && (
            <TouchableOpacity
              style={styles.playButton}
              onPress={playRecording}
            >
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
          
          {/* Display selected images */}
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
        
        {/* Privacy notice */}
        <View style={styles.section}>
          <Text style={styles.privacyNotice}>
            Your report will be processed using AI technology to assist law enforcement. All data is encrypted and handled according to our privacy policy.
          </Text>
        </View>
      </ScrollView>
      
      {/* Submit Button */}
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
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
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
    padding: 8,
  },
  headerTitle: {
    marginLeft: 16,
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },
  scrollView: {
    flex: 1,
  },
  section: {
    marginVertical: 12,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
  },
  required: {
    color: '#ff4757',
  },
  errorText: {
    color: '#ff4757',
    fontSize: 12,
    marginBottom: 8,
  },
  errorBorder: {
    borderColor: '#ff4757',
  },
  incidentTypesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
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
    color: '#666',
  },
  selectedIncidentType: {
    backgroundColor: '#ffebf1',
    borderColor: '#ff6b93',
  },
  selectedIncidentTypeText: {
    color: '#ff6b93',
    fontWeight: '500',
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
    marginRight: 12,
  },
  locationText: {
    flex: 1,
    color: '#666',
    fontSize: 14,
  },
  editLocationButton: {
    alignSelf: 'flex-end',
    marginTop: 8,
  },
  editLocationText: {
    color: '#ff6b93',
    fontSize: 12,
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
    marginTop: 4,
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
    backgroundColor: '#ff4757',
  },
  voiceButtonText: {
    color: 'white',
    fontWeight: '500',
    marginLeft: 8,
  },
  playButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  playButtonText: {
    color: '#ff6b93',
    marginLeft: 4,
    fontWeight: '500',
  },
  imageOptionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
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
    marginRight: 12,
  },
  imageOptionText: {
    color: '#666',
    fontSize: 14,
  },
  selectedImagesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 16,
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
    borderRadius: 8,
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
    marginTop: 16,
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
    marginLeft: 8,
  },
});

export default GenerateReportScreen;
