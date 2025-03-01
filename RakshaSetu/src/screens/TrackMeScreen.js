import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  Keyboard,
  Dimensions,
  Modal,
  ScrollView,
} from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import * as Location from 'expo-location';
import PolylineDecoder from '@mapbox/polyline';
import { Ionicons } from '@expo/vector-icons';

// ============ Google API Key ============
const GOOGLE_MAPS_API_KEY = 'AIzaSyBzqSJUt0MVs3xFjFWTvLwiyjXwnzbkXok';

// Basic UI constants
const PINK = '#ff5f96';
const { width, height } = Dimensions.get('window');

// Helper: Haversine formula to calculate distance between two coordinates (in meters)
const haversineDistance = (coords1, coords2) => {
  const toRad = (value) => (value * Math.PI) / 180;
  const R = 6371000; // Radius of Earth in meters
  const dLat = toRad(coords2.latitude - coords1.latitude);
  const dLon = toRad(coords2.longitude - coords1.longitude);
  const lat1 = toRad(coords1.latitude);
  const lat2 = toRad(coords2.latitude);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLon / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// Mock safety data service - in a real app, you would use an actual API
const fetchSafetyData = async (coordinates) => {
  const hour = new Date().getHours();
  const isNightTime = hour < 6 || hour > 19;
  const midPointIndex = Math.floor(coordinates.length / 2);
  const midPoint = coordinates[midPointIndex];
  const mockResponse = {
    safety: Math.random() > 0.3 ? 'Safe' : 'Caution advised',
    lighting: isNightTime ? (Math.random() > 0.4 ? 'Well lit' : 'Poorly lit') : 'Daylight',
    visibility: Math.random() > 0.3 ? 'Good' : 'Limited',
    recentCrimes: [
      isNightTime && Math.random() > 0.7 ? {
        type: 'Theft',
        date: '2 days ago',
        time: '9:45 PM',
      } : null,
      Math.random() > 0.8 ? {
        type: 'Vandalism',
        date: '1 week ago',
        time: '11:30 PM',
      } : null,
    ].filter(Boolean),
    safetyScore: Math.floor(Math.random() * 40) + 60,
  };
  await new Promise(resolve => setTimeout(resolve, 1000));
  return mockResponse;
};

// Safety rating component
const SafetyRatingIndicator = ({ score }) => {
  let color = '#4CAF50';
  if (score < 70) {
    color = '#FFC107';
  }
  if (score < 60) {
    color = '#F44336';
  }
  return (
    <View style={[styles.safetyScore, { backgroundColor: color }]}>
      <Text style={styles.safetyScoreText}>{score}</Text>
    </View>
  );
};

export default function TrackMeScreen() {
  const mapRef = useRef(null);
  const [location, setLocation] = useState(null);
  const [destination, setDestination] = useState('');
  const [destinationCoord, setDestinationCoord] = useState(null);
  const [routeCoords, setRouteCoords] = useState([]);
  const [safetyData, setSafetyData] = useState(null);
  const [safetyModalVisible, setSafetyModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  // New state for journey tracking
  const [journeyStarted, setJourneyStarted] = useState(false);
  const [watcher, setWatcher] = useState(null);
  const [distanceTraveled, setDistanceTraveled] = useState(0);

  useEffect(() => {
    requestLocationPermission();
  }, []);

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission to access location was denied');
        return;
      }
      const currentLoc = await Location.getCurrentPositionAsync({});
      setLocation(currentLoc.coords);
    } catch (error) {
      Alert.alert('Error getting location');
    }
  };

  const handleSearch = async () => {
    if (!destination.trim()) {
      Alert.alert('Please enter a destination');
      return;
    }
    Keyboard.dismiss();
    setLoading(true);
    try {
      const geoResponse = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(destination)}&key=${GOOGLE_MAPS_API_KEY}`
      );
      const geoData = await geoResponse.json();
      if (geoData.status !== 'OK' || !geoData.results[0]) {
        Alert.alert('Location not found');
        setLoading(false);
        return;
      }
      const { lat, lng } = geoData.results[0].geometry.location;
      const destCoord = { latitude: lat, longitude: lng };
      setDestinationCoord(destCoord);
      if (location) {
        await fetchRoute(location, destCoord);
      }
    } catch (error) {
      console.error('Geocoding Error:', error);
      Alert.alert('Failed to find location');
    } finally {
      setLoading(false);
    }
  };

  const fetchRoute = async (start, end) => {
    if (!start || !end) return;
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/directions/json?origin=${start.latitude},${start.longitude}&destination=${end.latitude},${end.longitude}&mode=driving&key=${GOOGLE_MAPS_API_KEY}`
      );
      const data = await response.json();
      if (data.status !== 'OK') {
        Alert.alert('Failed to fetch route');
        return;
      }
      const points = PolylineDecoder.decode(data.routes[0].overview_polyline.points);
      const route = points.map(point => ({
        latitude: point[0],
        longitude: point[1],
      }));
      setRouteCoords(route);
      if (mapRef.current && route.length > 1) {
        mapRef.current.fitToCoordinates(route, {
          edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
          animated: true,
        });
      }
      const safety = await fetchSafetyData(route);
      setSafetyData(safety);
      setSafetyModalVisible(true);
    } catch (error) {
      console.error('Route Fetch Error:', error);
      Alert.alert('Failed to fetch route');
    }
  };

  // New functions for journey toggle
  const startJourney = async () => {
    try {
      const locWatcher = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, timeInterval: 5000, distanceInterval: 5 },
        (loc) => {
          if (location) {
            const d = haversineDistance(location, loc.coords);
            setDistanceTraveled(prev => prev + d);
          }
          setLocation(loc.coords);
        }
      );
      setWatcher(locWatcher);
      setJourneyStarted(true);
    } catch (error) {
      Alert.alert('Error starting journey');
    }
  };

  const endJourney = () => {
    if (watcher) {
      watcher.remove();
      setWatcher(null);
    }
    setJourneyStarted(false);
    Alert.alert('Journey Ended', `Total distance: ${(distanceTraveled / 1000).toFixed(2)} km`);
  };

  const toggleJourney = () => {
    if (!journeyStarted) {
      startJourney();
    } else {
      endJourney();
    }
  };

  const getSafetyIcon = (type) => {
    switch (type) {
      case 'Safe':
        return 'shield-checkmark';
      case 'Caution advised':
        return 'warning';
      default:
        return 'information-circle';
    }
  };

  const getLightingIcon = (type) => {
    switch (type) {
      case 'Well lit':
        return 'sunny';
      case 'Poorly lit':
        return 'moon';
      case 'Daylight':
        return 'sunny';
      default:
        return 'flashlight';
    }
  };

  const getVisibilityIcon = (type) => {
    switch (type) {
      case 'Good':
        return 'eye';
      case 'Limited':
        return 'eye-off';
      default:
        return 'eye';
    }
  };

  return (
    <View style={styles.container}>
      {/* Pink Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Track Me</Text>
        <Text style={styles.headerSubtitle}>Search your destination & see the route</Text>
      </View>

      {/* Map Section */}
      <View style={styles.mapContainer}>
        {location ? (
          <MapView
            ref={mapRef}
            style={styles.map}
            initialRegion={{
              latitude: location.latitude,
              longitude: location.longitude,
              latitudeDelta: 0.05,
              longitudeDelta: 0.05,
            }}
            showsUserLocation
          >
            {/* User Location Marker */}
            <Marker coordinate={location} title="Your Location" />
            {/* Destination Marker */}
            {destinationCoord && <Marker coordinate={destinationCoord} title="Destination" />}
            {/* Route Polyline */}
            {routeCoords.length > 1 && (
              <Polyline coordinates={routeCoords} strokeWidth={4} strokeColor="blue" />
            )}
          </MapView>
        ) : (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Getting your location...</Text>
          </View>
        )}

        {/* Overlaid card for input & button */}
        <View style={styles.searchCard}>
          <TextInput
            style={styles.searchInput}
            placeholder="Enter destination"
            value={destination}
            onChangeText={setDestination}
          />
          <TouchableOpacity 
            style={styles.searchButton} 
            onPress={handleSearch}
            disabled={loading}
          >
            <Text style={styles.searchButtonText}>
              {loading ? 'Loading...' : 'Search & Route'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Journey Toggle Button over maps */}
        {destinationCoord && routeCoords.length > 1 && (
          <TouchableOpacity style={styles.journeyButton} onPress={toggleJourney}>
            <Text style={styles.journeyButtonText}>
              {journeyStarted ? 'End Journey' : 'Start Journey'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Safety Data Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={safetyModalVisible}
        onRequestClose={() => setSafetyModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Route Safety Assessment</Text>
              <TouchableOpacity 
                onPress={() => setSafetyModalVisible(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            
            {safetyData && (
              <ScrollView style={styles.safetyContent}>
                <View style={styles.safetyHeaderRow}>
                  <Text style={styles.safetyTitle}>Overall Safety</Text>
                  <SafetyRatingIndicator score={safetyData.safetyScore} />
                </View>
                
                <View style={styles.safetyDetailRow}>
                  <View style={styles.safetyIconContainer}>
                    <Ionicons name={getSafetyIcon(safetyData.safety)} size={24} color={safetyData.safety === "Safe" ? "#4CAF50" : "#FFC107"} />
                  </View>
                  <View style={styles.safetyDetailContent}>
                    <Text style={styles.safetyDetailTitle}>Safety Status</Text>
                    <Text style={styles.safetyDetailText}>{safetyData.safety}</Text>
                  </View>
                </View>
                
                <View style={styles.safetyDetailRow}>
                  <View style={styles.safetyIconContainer}>
                    <Ionicons name={getLightingIcon(safetyData.lighting)} size={24} color="#2196F3" />
                  </View>
                  <View style={styles.safetyDetailContent}>
                    <Text style={styles.safetyDetailTitle}>Lighting Conditions</Text>
                    <Text style={styles.safetyDetailText}>{safetyData.lighting}</Text>
                  </View>
                </View>
                
                <View style={styles.safetyDetailRow}>
                  <View style={styles.safetyIconContainer}>
                    <Ionicons name={getVisibilityIcon(safetyData.visibility)} size={24} color="#9C27B0" />
                  </View>
                  <View style={styles.safetyDetailContent}>
                    <Text style={styles.safetyDetailTitle}>Area Visibility</Text>
                    <Text style={styles.safetyDetailText}>{safetyData.visibility}</Text>
                  </View>
                </View>
                
                <Text style={styles.crimeTitle}>Recent Incidents</Text>
                {safetyData.recentCrimes.length > 0 ? (
                  safetyData.recentCrimes.map((crime, index) => (
                    <View key={index} style={styles.crimeItem}>
                      <View style={styles.crimeIconContainer}>
                        <Ionicons name="alert-circle" size={20} color="#F44336" />
                      </View>
                      <View style={styles.crimeContent}>
                        <Text style={styles.crimeType}>{crime.type}</Text>
                        <Text style={styles.crimeDate}>{crime.date} at {crime.time}</Text>
                      </View>
                    </View>
                  ))
                ) : (
                  <Text style={styles.noCrimeText}>No recent incidents reported in this area</Text>
                )}
                
                <TouchableOpacity 
                  style={styles.acknowledgeButton}
                  onPress={() => setSafetyModalVisible(false)}
                >
                  <Text style={styles.acknowledgeButtonText}>Got It</Text>
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: PINK,
  },
  // Header Styles
  header: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#fff',
  },
  // Map Section Styles
  mapContainer: {
    flex: 1,
    backgroundColor: '#fff',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    overflow: 'hidden',
  },
  map: {
    width: '100%',
    height: '100%',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  // Search Card Styles
  searchCard: {
    position: 'absolute',
    top: 20,
    alignSelf: 'center',
    width: width * 0.9,
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 15,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  searchInput: {
    flex: 1,
    height: 45,
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    paddingHorizontal: 10,
  },
  searchButton: {
    backgroundColor: '#FF69B4',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 10,
  },
  searchButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  // Journey Toggle Button Styles
  journeyButton: {
    position: 'absolute',
    bottom: 30,
    alignSelf: 'center',
    backgroundColor: '#FF69B4',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 25,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  journeyButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    paddingVertical: 20,
    maxHeight: height * 0.7,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
  },
  closeButton: {
    padding: 5,
  },
  safetyContent: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  safetyHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  safetyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  safetyScore: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  safetyScoreText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 18,
  },
  safetyDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  safetyIconContainer: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    marginRight: 15,
  },
  safetyDetailContent: {
    flex: 1,
  },
  safetyDetailTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 3,
  },
  safetyDetailText: {
    fontSize: 14,
    color: '#666',
  },
  crimeTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 20,
    marginBottom: 15,
  },
  crimeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
  },
  crimeIconContainer: {
    marginRight: 10,
  },
  crimeContent: {
    flex: 1,
  },
  crimeType: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  crimeDate: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  noCrimeText: {
    fontSize: 14,
    color: '#4CAF50',
    fontStyle: 'italic',
    padding: 10,
  },
  acknowledgeButton: {
    backgroundColor: PINK,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 10,
  },
  acknowledgeButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});
