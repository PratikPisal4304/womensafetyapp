import React, { useState, useRef } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Image,
  ActivityIndicator
} from 'react-native';
import { Audio } from 'expo-av';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import * as FileSystem from 'expo-file-system';

// Constants for Gemini API
const GEMINI_API_KEY = 'YOUR_GEMINI_API_KEY'; // Replace with your actual API key
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

const GenerateReportScreen = ({ navigation }) => {
  const [incidentType, setIncidentType] = useState(null);
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [images, setImages] = useState([]);
  const [recording, setRecording] = useState();
  const [recordingUri, setRecordingUri] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [generatedReport, setGeneratedReport] = useState(null);

  // Request location when component mounts
  React.useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        try {
          let location = await Location.getCurrentPositionAsync({});
          let address = await Location.reverseGeocodeAsync({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude
          });
          
          if (address && address.length > 0) {
            const addr = address[0];
            const locationString = `${addr.street || 'Unnamed Road'}, ${addr.city || ''}, ${addr.region || ''}, ${addr.postalCode || ''}, ${addr.country || ''}`;
            setLocation(locationString);
          }
        } catch (error) {
          console.log('Error getting location:', error);
        }
      }
    })();
  }, []);

  // Function to handle incident type selection
  const handleIncidentTypeSelection = (type) => {
    setIncidentType(type);
  };

  // Function to start recording
  const startRecording = async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        alert('Sorry, we need microphone permissions to record audio.');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
      
      const recording = new Audio.Recording();
      await recording.prepareToRecordAsync(Audio.RECORDING_OPTIONS_PRESET_HIGH_QUALITY);
      await recording.startAsync();
      setRecording(recording);
      setIsRecording(true);
    } catch (err) {
      console.error('Failed to start recording', err);
    }
  };

  // Function to stop recording
  const stopRecording = async () => {
    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecordingUri(uri);
      setIsRecording(false);
    } catch (err) {
      console.error('Failed to stop recording', err);
    }
  };

  // Function to pick an image from the camera
  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      alert('Sorry, we need camera permissions to take a photo.');
      return;
    }

    let result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setImages([...images, result.assets[0].uri]);
    }
  };

  // Function to pick an image from the gallery
  const uploadImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      alert('Sorry, we need camera roll permissions to upload an image.');
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setImages([...images, result.assets[0].uri]);
    }
  };

  // Function to encode image as base64
  const getBase64ForImage = async (uri) => {
    try {
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      return base64;
    } catch (error) {
      console.error('Error encoding image:', error);
      return null;
    }
  };

  // Function to analyze incident with Gemini AI
  const analyzeIncidentWithGemini = async () => {
    try {
      // Prepare input content for Gemini
      const contentParts = [
        {
          text: `Please analyze the following incident report and generate a comprehensive analysis:
                 
                 Incident Type: ${incidentType}
                 Location: ${location}
                 Description: ${description}
                 
                 Based on this information, please:
                 1. Summarize the key details
                 2. Identify potential severity level
                 3. Suggest immediate actions to be taken
                 4. Recommend follow-up procedures
                 5. Note any legal considerations`
        }
      ];

      // Add image data if available
      if (images.length > 0) {
        for (let i = 0; i < Math.min(images.length, 2); i++) { // Limiting to 2 images for simplicity
          const base64Data = await getBase64ForImage(images[i]);
          if (base64Data) {
            contentParts.push({
              inlineData: {
                data: base64Data,
                mimeType: "image/jpeg"
              }
            });
          }
        }
      }

      // Prepare request to Gemini API
      const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{ parts: contentParts }],
          generationConfig: {
            temperature: 0.4,
            topK: 32,
            topP: 1,
            maxOutputTokens: 4096,
          }
        }),
      });

      const responseData = await response.json();
      
      if (responseData.candidates && responseData.candidates.length > 0) {
        const generatedContent = responseData.candidates[0].content.parts[0].text;
        return generatedContent;
      } else {
        throw new Error('No response from Gemini API');
      }
    } catch (error) {
      console.error('Error with Gemini API:', error);
      throw error;
    }
  };

  // Function to generate AI report
  const generateAIReport = async () => {
    // Check if required fields are filled
    if (!incidentType) {
      alert('Please select an incident type');
      return;
    }
    if (!description) {
      alert('Please provide a description of the incident');
      return;
    }

    try {
      setIsGeneratingReport(true);
      
      // Call Gemini API for analysis
      const report = await analyzeIncidentWithGemini();
      setGeneratedReport(report);
      
      // In a real app, you'd probably save this report to your database
      // and possibly navigate to a detailed view
      
      // Example data structure you might save
      const reportData = {
        incidentType,
        location,
        description,
        recordingUri,
        images,
        aiAnalysis: report,
        timestamp: new Date().toISOString()
      };
      
      console.log('Report Data:', reportData);
      
      // Navigate to report view
      navigation.navigate('ReportView', { reportData });
      
    } catch (error) {
      alert('Error generating AI report: ' + error.message);
    } finally {
      setIsGeneratingReport(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView style={styles.scrollContainer}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="black" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>File Incident Report</Text>
        </View>

        <View style={styles.formContainer}>
          <Text style={styles.sectionTitle}>Type of Incident*</Text>
          <View style={styles.incidentTypeContainer}>
            {['Harassment', 'Stalking', 'Assault', 'Theft'].map((type) => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.incidentTypeButton,
                  incidentType === type && styles.selectedIncidentType
                ]}
                onPress={() => handleIncidentTypeSelection(type)}
              >
                <Text 
                  style={[
                    styles.incidentTypeText,
                    incidentType === type && styles.selectedIncidentTypeText
                  ]}
                >
                  {type}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.sectionTitle}>Location</Text>
          <View style={styles.locationContainer}>
            <MaterialIcons name="location-on" size={24} color="#ff80ab" style={styles.locationIcon} />
            <TextInput
              style={styles.locationInput}
              value={location}
              onChangeText={setLocation}
              placeholder="Enter location"
            />
          </View>

          <Text style={styles.sectionTitle}>Describe what happened*</Text>
          <TextInput
            style={styles.descriptionInput}
            value={description}
            onChangeText={setDescription}
            placeholder="Please provide details of the incident..."
            multiline
            textAlignVertical="top"
          />

          <TouchableOpacity 
            style={styles.voiceButton}
            onPress={isRecording ? stopRecording : startRecording}
          >
            <Ionicons name="mic" size={24} color="white" />
            <Text style={styles.voiceButtonText}>
              {isRecording ? 'Stop Recording' : 'Record Voice Statement'}
            </Text>
          </TouchableOpacity>

          <Text style={styles.sectionTitle}>Add Images (Optional)</Text>
          <View style={styles.imageOptionsContainer}>
            <TouchableOpacity style={styles.imageOption} onPress={takePhoto}>
              <Ionicons name="camera" size={24} color="#ff80ab" />
              <Text style={styles.imageOptionText}>Take Photo</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.imageOption} onPress={uploadImage}>
              <Ionicons name="images" size={24} color="#ff80ab" />
              <Text style={styles.imageOptionText}>Upload Image</Text>
            </TouchableOpacity>
          </View>

          {images.length > 0 && (
            <View style={styles.imagesContainer}>
              {images.map((uri, index) => (
                <Image key={index} source={{ uri }} style={styles.imagePreview} />
              ))}
            </View>
          )}

          <TouchableOpacity 
            style={[styles.generateButton, isGeneratingReport && styles.disabledButton]}
            onPress={generateAIReport}
            disabled={isGeneratingReport}
          >
            {isGeneratingReport ? (
              <>
                <ActivityIndicator size="small" color="white" />
                <Text style={styles.generateButtonText}>Generating Report...</Text>
              </>
            ) : (
              <>
                <MaterialIcons name="auto-awesome" size={24} color="white" />
                <Text style={styles.generateButtonText}>Generate AI Report</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContainer: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    marginRight: 15,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  formContainer: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  incidentTypeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  incidentTypeButton: {
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
    minWidth: '22%',
    alignItems: 'center',
    marginBottom: 10,
  },
  selectedIncidentType: {
    backgroundColor: '#ff80ab',
  },
  incidentTypeText: {
    color: '#333',
  },
  selectedIncidentTypeText: {
    color: 'white',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 16,
  },
  locationIcon: {
    marginRight: 8,
  },
  locationInput: {
    flex: 1,
    fontSize: 16,
  },
  descriptionInput: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    height: 120,
    fontSize: 16,
    marginBottom: 16,
  },
  voiceButton: {
    backgroundColor: '#ff80ab',
    borderRadius: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginVertical: 16,
  },
  voiceButtonText: {
    color: 'white',
    fontSize: 16,
    marginLeft: 8,
    fontWeight: '500',
  },
  imageOptionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  imageOption: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    width: '48%',
  },
  imageOptionText: {
    color: '#333',
    marginTop: 8,
  },
  imagesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  imagePreview: {
    width: 100,
    height: 100,
    margin: 4,
    borderRadius: 8,
  },
  generateButton: {
    backgroundColor: '#ff80ab',
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    marginTop: 16,
    marginBottom: 30,
  },
  disabledButton: {
    backgroundColor: '#ffb0c9',
  },
  generateButtonText: {
    color: 'white',
    fontSize: 18,
    marginLeft: 8,
    fontWeight: 'bold',
  },
});

export default GenerateReportScreen;