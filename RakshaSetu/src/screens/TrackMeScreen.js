import React, { useEffect, useState, useRef, useCallback } from 'react';
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
  FlatList,
  Image,
  ActivityIndicator,
  TouchableWithoutFeedback,
} from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import * as Location from 'expo-location';
import PolylineDecoder from '@mapbox/polyline';
import { Ionicons } from '@expo/vector-icons';

// Get device dimensions
const { width, height } = Dimensions.get('window');
// UI constant
const PINK = '#ff5f96';

// Replace with your actual Google Maps API Key
const GOOGLE_MAPS_API_KEY = 'AIzaSyBzqSJUt0MVs3xFjFWTvLwiyjXwnzbkXok';

// Custom Map Style (example)
const customMapStyle = [
  { elementType: 'geometry', stylers: [{ color: '#ebe3cd' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#523735' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#f5f1e6' }] },
];

// Helper: Haversine formula to calculate distance (in meters)
const haversineDistance = (coords1, coords2) => {
  const toRad = (value) => (value * Math.PI) / 180;
  const R = 6371000; // Earth's radius in meters
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

// Mock safety data service – replace with real API as needed
const fetchSafetyData = async (coordinates) => {
  await new Promise((resolve) => setTimeout(resolve, 1000));
  return {
    safety: Math.random() > 0.5 ? 'Safe' : 'Caution advised',
    lighting: Math.random() > 0.5 ? 'Well lit' : 'Poorly lit',
    visibility: Math.random() > 0.5 ? 'Good' : 'Limited',
    recentCrimes: [
      { type: 'Theft', date: '2 days ago', time: '9:45 PM' },
      { type: 'Vandalism', date: '1 week ago', time: '11:30 PM' },
    ],
    safetyScore: Math.floor(Math.random() * 40) + 60,
  };
};

// Safety Rating Indicator Component
const SafetyRatingIndicator = ({ score }) => {
  let color = '#4CAF50';
  if (score < 70) color = '#FFC107';
  if (score < 60) color = '#F44336';
  return (
    <View style={[styles.safetyScore, { backgroundColor: color }]}>
      <Text style={styles.safetyScoreText}>{score}</Text>
    </View>
  );
};

// --- Additional features states ---
// Alternative Route Options, Navigation Instructions, Customization Options
export default function TrackMeScreen() {
  const mapRef = useRef(null);
  const debounceTimerRef = useRef(null);

  // Basic state variables
  const [location, setLocation] = useState(null);
  const [destination, setDestination] = useState('');
  const [destinationCoord, setDestinationCoord] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [showTraffic, setShowTraffic] = useState(false);
  const [mapType, setMapType] = useState('standard');
  const [nearbyPlaces, setNearbyPlaces] = useState([]);
  const [showNearbyPlaces, setShowNearbyPlaces] = useState(false);
  const [nearbyCategory, setNearbyCategory] = useState('police');

  // Journey tracking state
  const [journeyStarted, setJourneyStarted] = useState(false);
  const [watcher, setWatcher] = useState(null);
  const [distanceTraveled, setDistanceTraveled] = useState(0);
  const [heading, setHeading] = useState(null);

  // Route and directions state
  const [routeCoords, setRouteCoords] = useState([]);
  const [ETA, setETA] = useState(null);
  const [directionsSteps, setDirectionsSteps] = useState([]);
  const [alternativeRoutes, setAlternativeRoutes] = useState([]);
  const [alternativeModalVisible, setAlternativeModalVisible] = useState(false);
  const [instructionsModalVisible, setInstructionsModalVisible] = useState(false);
  const [customizationModalVisible, setCustomizationModalVisible] = useState(false);

  // Safety Assessment state
  const [safetyData, setSafetyData] = useState(null);
  const [safetyModalVisible, setSafetyModalVisible] = useState(false);

  // Suggestions UI state
  const [suggestionsVisible, setSuggestionsVisible] = useState(false);

  // --- Location & Destination ---
  useEffect(() => {
    requestLocationPermission();
  }, []);

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required.');
        return;
      }
      const currentLoc = await Location.getCurrentPositionAsync({});
      setLocation(currentLoc.coords);
    } catch (error) {
      Alert.alert('Error', 'Failed to get your location.');
    }
  };

  // Toggle map type
  const toggleMapType = () => {
    const types = ['standard', 'satellite', 'hybrid', 'terrain'];
    const currentIndex = types.indexOf(mapType);
    setMapType(types[(currentIndex + 1) % types.length]);
  };

  // Fetch nearby places
  const fetchNearbyPlaces = async () => {
    if (!location) return;
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${location.latitude},${location.longitude}&radius=1500&type=${nearbyCategory}&key=${GOOGLE_MAPS_API_KEY}`
      );
      const data = await response.json();
      setNearbyPlaces(data.status === 'OK' ? data.results : []);
    } catch (error) {
      console.error('Error fetching nearby places:', error);
      setNearbyPlaces([]);
    }
  };

  // Cycle nearby category
  const cycleNearbyCategory = () => {
    const categories = ['police', 'hospital', 'gas_station', 'restaurant'];
    const currentIndex = categories.indexOf(nearbyCategory);
    const nextCategory = categories[(currentIndex + 1) % categories.length];
    setNearbyCategory(nextCategory);
    if (showNearbyPlaces) {
      fetchNearbyPlaces();
    }
  };

  // Fetch suggestions from Places Autocomplete API
  const fetchSuggestions = async (query) => {
    if (!query) {
      setSuggestions([]);
      return;
    }
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
          query
        )}&key=${GOOGLE_MAPS_API_KEY}`
      );
      const data = await response.json();
      setSuggestions(data.status === 'OK' ? data.predictions : []);
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      setSuggestions([]);
    }
  };

  // Handle destination input with debouncing
  const handleDestinationChange = (text) => {
    setDestination(text);
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    setSuggestionsLoading(true);
    debounceTimerRef.current = setTimeout(async () => {
      await fetchSuggestions(text);
      setSuggestionsLoading(false);
      setSuggestionsVisible(true);
    }, 500);
  };

  const selectSuggestion = (suggestion) => {
    setDestination(suggestion.description);
    setSuggestions([]);
    setSuggestionsVisible(false);
    handleSearch(suggestion.description);
    Keyboard.dismiss();
  };

  const handleSubmitEditing = () => {
    handleSearch(destination);
    Keyboard.dismiss();
  };

  // Search destination using Geocoding API and then fetch safety data
  const handleSearch = async (searchQuery) => {
    if (!searchQuery.trim()) {
      Alert.alert('Please enter a destination');
      return;
    }
    try {
      const geoResponse = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
          searchQuery
        )}&key=${GOOGLE_MAPS_API_KEY}`
      );
      const geoData = await geoResponse.json();
      if (geoData.status !== 'OK' || !geoData.results[0]) {
        Alert.alert('Location not found');
        return;
      }
      const { lat, lng } = geoData.results[0].geometry.location;
      const destCoord = { latitude: lat, longitude: lng };
      setDestinationCoord(destCoord);
      if (mapRef.current) {
        mapRef.current.animateToRegion(
          {
            latitude: lat,
            longitude: lng,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          },
          1000
        );
      }
      // Fetch safety data for the destination using the dummy API
      const safety = await fetchSafetyData([destCoord]);
      setSafetyData(safety);
      setSafetyModalVisible(true);
    } catch (error) {
      console.error('Geocoding Error:', error);
      Alert.alert('Error', 'Failed to find location');
    }
  };

  // Fetch route (primary route and alternatives) using Google Directions API
  const fetchRoute = async (mode = 'driving') => {
    if (!location || !destinationCoord) return;
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/directions/json?origin=${location.latitude},${location.longitude}&destination=${destinationCoord.latitude},${destinationCoord.longitude}&mode=${mode}&alternatives=true&key=${GOOGLE_MAPS_API_KEY}`
      );
      const data = await response.json();
      if (data.status !== 'OK' || !data.routes || data.routes.length === 0) {
        Alert.alert('Route not found');
        return;
      }
      const primaryRoute = data.routes[0];
      const points = PolylineDecoder.decode(primaryRoute.overview_polyline.points);
      const coords = points.map((point) => ({
        latitude: point[0],
        longitude: point[1],
      }));
      setRouteCoords(coords);
      if (primaryRoute.legs && primaryRoute.legs[0]) {
        setETA(primaryRoute.legs[0].duration.text);
        setDirectionsSteps(primaryRoute.legs[0].steps);
      }
      if (data.routes.length > 1) {
        setAlternativeRoutes(data.routes.slice(1));
        setAlternativeModalVisible(true);
      }
    } catch (error) {
      console.error('Error fetching route', error);
      Alert.alert('Error', 'Failed to fetch route');
    }
  };

  // Navigation Instructions Modal (for turn-by-turn steps)
  const renderInstructionsModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={instructionsModalVisible}
      onRequestClose={() => setInstructionsModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Navigation Instructions</Text>
            <TouchableOpacity style={styles.closeButton} onPress={() => setInstructionsModalVisible(false)}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalBody}>
            {directionsSteps && directionsSteps.length > 0 ? (
              directionsSteps.map((step, index) => (
                <View key={index} style={styles.directionStep}>
                  <Text style={styles.directionStepText}>
                    {index + 1}. {step.html_instructions.replace(/<[^>]*>/g, '')} ({step.distance.text})
                  </Text>
                </View>
              ))
            ) : (
              <Text style={styles.directionStepText}>No instructions available.</Text>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  // Alternative Routes Modal
  const renderAlternativeModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={alternativeModalVisible}
      onRequestClose={() => setAlternativeModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Alternative Routes</Text>
            <TouchableOpacity style={styles.closeButton} onPress={() => setAlternativeModalVisible(false)}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalBody}>
            {alternativeRoutes.map((route, index) => (
              <TouchableOpacity
                key={index}
                style={styles.altRouteItem}
                onPress={() => {
                  // Select this route
                  const points = PolylineDecoder.decode(route.overview_polyline.points);
                  const coords = points.map((point) => ({
                    latitude: point[0],
                    longitude: point[1],
                  }));
                  setRouteCoords(coords);
                  if (route.legs && route.legs[0]) {
                    setETA(route.legs[0].duration.text);
                    setDirectionsSteps(route.legs[0].steps);
                  }
                  setAlternativeModalVisible(false);
                }}
              >
                <Text style={styles.altRouteText}>
                  Route {index + 1}: {route.legs[0].duration.text} ({route.legs[0].distance.text})
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  // Customization Options Modal
  const renderCustomizationModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={customizationModalVisible}
      onRequestClose={() => setCustomizationModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Map Customization</Text>
            <TouchableOpacity style={styles.closeButton} onPress={() => setCustomizationModalVisible(false)}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>
          <View style={styles.modalBody}>
            <Text style={{ fontSize: 16, marginBottom: 10 }}>Map Type:</Text>
            {['standard', 'satellite', 'hybrid', 'terrain'].map((type) => (
              <TouchableOpacity key={type} onPress={() => setMapType(type)} style={styles.customOption}>
                <Text style={{ fontSize: 16, color: mapType === type ? PINK : '#333' }}>{type}</Text>
              </TouchableOpacity>
            ))}
            <View style={{ marginVertical: 15 }}>
              <Text style={{ fontSize: 16, marginBottom: 10 }}>Traffic:</Text>
              <TouchableOpacity onPress={() => setShowTraffic(!showTraffic)} style={styles.customOption}>
                <Text style={{ fontSize: 16, color: showTraffic ? PINK : '#333' }}>
                  {showTraffic ? 'On' : 'Off'}
                </Text>
              </TouchableOpacity>
            </View>
            <View style={{ marginVertical: 15 }}>
              <Text style={{ fontSize: 16, marginBottom: 10 }}>Nearby Places:</Text>
              <TouchableOpacity onPress={() => setShowNearbyPlaces(!showNearbyPlaces)} style={styles.customOption}>
                <Text style={{ fontSize: 16, color: showNearbyPlaces ? PINK : '#333' }}>
                  {showNearbyPlaces ? 'Show' : 'Hide'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );

  // Recenter map
  const handleRecenter = () => {
    if (mapRef.current && location) {
      mapRef.current.animateToRegion(
        {
          latitude: location.latitude,
          longitude: location.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        },
        1000
      );
    }
  };

  // Journey tracking functions
  const startJourney = async () => {
    try {
      const locWatcher = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, timeInterval: 5000, distanceInterval: 5 },
        (loc) => {
          if (location) {
            const d = haversineDistance(location, loc.coords);
            setDistanceTraveled((prev) => prev + d);
          }
          setLocation(loc.coords);
          if (loc.coords.heading != null) {
            setHeading(loc.coords.heading);
          }
        }
      );
      setWatcher(locWatcher);
      setJourneyStarted(true);
    } catch (error) {
      Alert.alert('Error', 'Failed to start journey');
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
    journeyStarted ? endJourney() : startJourney();
  };

  const resetRoute = () => {
    setDestination('');
    setDestinationCoord(null);
    setSuggestions([]);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Track Me</Text>
        <Text style={styles.headerSubtitle}>
          Distance: {(distanceTraveled / 1000).toFixed(2)} km | Heading: {heading ? `${Math.round(heading)}°` : 'N/A'} | ETA: {ETA ? ETA : 'N/A'}
        </Text>
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
            customMapStyle={customMapStyle}
            showsTraffic={showTraffic}
            mapType={mapType}
          >
            {destinationCoord && (
              <Marker coordinate={destinationCoord}>
                <Ionicons name="location" size={30} color="#FF6347" />
              </Marker>
            )}
            {routeCoords.length > 0 && (
              <Polyline coordinates={routeCoords} strokeWidth={4} strokeColor={PINK} />
            )}
            {showNearbyPlaces &&
              nearbyPlaces.map((place) => (
                <Marker
                  key={place.place_id}
                  coordinate={{
                    latitude: place.geometry.location.lat,
                    longitude: place.geometry.location.lng,
                  }}
                >
                  <Ionicons name="business" size={24} color={PINK} />
                </Marker>
              ))}
          </MapView>
        ) : (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Getting your location...</Text>
          </View>
        )}

        {/* Search Card */}
        <View style={styles.searchCard}>
          <Ionicons name="search" size={20} color="#666" style={{ marginLeft: 10 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Enter destination"
            placeholderTextColor="#666"
            value={destination}
            onChangeText={handleDestinationChange}
            onSubmitEditing={handleSubmitEditing}
          />
          {destination.length > 0 && (
            <TouchableOpacity onPress={resetRoute}>
              <Ionicons name="close-circle" size={20} color="#aaa" style={{ marginRight: 10 }} />
            </TouchableOpacity>
          )}
        </View>

        {/* Suggestions List */}
        {suggestionsVisible && suggestions.length > 0 && (
          <View style={styles.suggestionsContainer}>
            <FlatList
              data={suggestions}
              keyExtractor={(item) => item.place_id}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.suggestionItem} onPress={() => selectSuggestion(item)}>
                  <Text style={styles.suggestionText}>{item.description}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        )}

        {/* Map Controls */}
        <View style={styles.mapControlsContainer}>
          <TouchableOpacity style={styles.mapControlButton} onPress={() => setShowTraffic(!showTraffic)}>
            <Ionicons name="car" size={24} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.mapControlButton} onPress={toggleMapType}>
            <Ionicons name="map" size={24} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.mapControlButton}
            onPress={() => {
              cycleNearbyCategory();
              setShowNearbyPlaces((prev) => !prev);
              if (!showNearbyPlaces) fetchNearbyPlaces();
            }}
          >
            <Ionicons name="business" size={24} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.mapControlButton} onPress={() => setCustomizationModalVisible(true)}>
            <Ionicons name="options" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Recenter Button */}
        <TouchableOpacity style={styles.recenterButton} onPress={handleRecenter}>
          <Ionicons name="locate" size={24} color="#fff" />
        </TouchableOpacity>

        {/* Route Button */}
        {destinationCoord && (
          <TouchableOpacity style={styles.routeButton} onPress={() => fetchRoute()}>
            <Text style={styles.routeButtonText}>Show Route</Text>
          </TouchableOpacity>
        )}

        {/* Journey Button */}
        {destinationCoord && (
          <TouchableOpacity style={styles.journeyButton} onPress={toggleJourney}>
            <Text style={styles.journeyButtonText}>{journeyStarted ? 'End Journey' : 'Start Journey'}</Text>
          </TouchableOpacity>
        )}

        {/* Instructions Button */}
        {directionsSteps && directionsSteps.length > 0 && (
          <TouchableOpacity style={styles.instructionsButton} onPress={() => setInstructionsModalVisible(true)}>
            <Text style={styles.instructionsButtonText}>Instructions</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Safety Assessment Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={safetyModalVisible}
        onRequestClose={() => setSafetyModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Safety Assessment</Text>
              <TouchableOpacity style={styles.closeButton} onPress={() => setSafetyModalVisible(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody}>
              {safetyData ? (
                <>
                  <View style={styles.safetyHeaderRow}>
                    <Text style={styles.safetyTitle}>Overall Safety</Text>
                    <SafetyRatingIndicator score={safetyData.safetyScore} />
                  </View>
                  <View style={styles.safetyDetailRow}>
                    <View style={styles.safetyIconContainer}>
                      <Ionicons
                        name={safetyData.safety === 'Safe' ? 'shield-checkmark' : 'warning'}
                        size={24}
                        color={safetyData.safety === 'Safe' ? '#4CAF50' : '#FFC107'}
                      />
                    </View>
                    <View style={styles.safetyDetailContent}>
                      <Text style={styles.safetyDetailTitle}>Safety Status</Text>
                      <Text style={styles.safetyDetailText}>{safetyData.safety}</Text>
                    </View>
                  </View>
                  <View style={styles.safetyDetailRow}>
                    <View style={styles.safetyIconContainer}>
                      <Ionicons name={safetyData.lighting === 'Well lit' ? 'sunny' : 'moon'} size={24} color="#2196F3" />
                    </View>
                    <View style={styles.safetyDetailContent}>
                      <Text style={styles.safetyDetailTitle}>Lighting Conditions</Text>
                      <Text style={styles.safetyDetailText}>{safetyData.lighting}</Text>
                    </View>
                  </View>
                  <View style={styles.safetyDetailRow}>
                    <View style={styles.safetyIconContainer}>
                      <Ionicons name={safetyData.visibility === 'Good' ? 'eye' : 'eye-off'} size={24} color="#9C27B0" />
                    </View>
                    <View style={styles.safetyDetailContent}>
                      <Text style={styles.safetyDetailTitle}>Visibility</Text>
                      <Text style={styles.safetyDetailText}>{safetyData.visibility}</Text>
                    </View>
                  </View>
                  <Text style={styles.crimeTitle}>Recent Incidents</Text>
                  {safetyData.recentCrimes && safetyData.recentCrimes.length > 0 ? (
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
                    <Text style={styles.noCrimeText}>No recent incidents reported.</Text>
                  )}
                  <View style={styles.safetyButtonContainer}>
                    <TouchableOpacity style={styles.safetyButton} onPress={() => setSafetyModalVisible(false)}>
                      <Text style={styles.safetyButtonText}>Close</Text>
                    </TouchableOpacity>
                  </View>
                </>
              ) : (
                <ActivityIndicator size="large" color={PINK} />
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Alternative Routes Modal */}
      {renderAlternativeModal()}
      {/* Navigation Instructions Modal */}
      {renderInstructionsModal()}
      {/* Customization Options Modal */}
      {renderCustomizationModal()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: PINK },
  header: {
    paddingTop: 50,
    paddingBottom: 15,
    paddingHorizontal: 20,
    backgroundColor: PINK,
  },
  headerTitle: { fontSize: 26, fontWeight: '700', color: '#fff', marginBottom: 3 },
  headerSubtitle: { fontSize: 14, color: '#fff' },
  mapContainer: {
    flex: 1,
    backgroundColor: '#fff',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    overflow: 'hidden',
  },
  map: { width: '100%', height: '100%' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { fontSize: 16, color: '#333' },
  searchCard: {
    position: 'absolute',
    top: 20,
    alignSelf: 'center',
    width: width * 0.9,
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 10,
    elevation: 5,
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    height: 40,
    paddingHorizontal: 10,
    fontSize: 16,
    color: '#333',
  },
  suggestionsContainer: {
    position: 'absolute',
    top: 80,
    alignSelf: 'center',
    width: width * 0.9,
    backgroundColor: '#fff',
    borderRadius: 8,
    maxHeight: 200,
    elevation: 5,
    zIndex: 999,
  },
  suggestionItem: { padding: 10, borderBottomWidth: 0.5, borderBottomColor: '#ccc' },
  suggestionText: { fontSize: 14, color: '#333' },
  mapControlsContainer: {
    position: 'absolute',
    top: 80,
    right: 10,
    backgroundColor: 'rgba(255,105,180,0.9)',
    borderRadius: 25,
    padding: 10,
    gap: 10,
    elevation: 5,
  },
  mapControlButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: PINK,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
  },
  recenterButton: {
    position: 'absolute',
    bottom: 80,
    right: 20,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: PINK,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
  },
  journeyButton: {
    position: 'absolute',
    bottom: 50,
    alignSelf: 'center',
    backgroundColor: PINK,
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 25,
    elevation: 5,
  },
  journeyButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  // Route Button
  routeButton: {
    position: 'absolute',
    bottom: 120,
    alignSelf: 'center',
    backgroundColor: '#007AFF',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    elevation: 5,
  },
  routeButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  // Instructions Button
  instructionsButton: {
    position: 'absolute',
    bottom: 180,
    alignSelf: 'center',
    backgroundColor: '#4CAF50',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    elevation: 5,
  },
  instructionsButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
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
  modalTitle: { fontSize: 20, fontWeight: '700', color: '#333' },
  closeButton: { padding: 5 },
  modalBody: { paddingHorizontal: 20, paddingVertical: 10 },
  safetyHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  safetyTitle: { fontSize: 18, fontWeight: '600', color: '#333' },
  safetyScore: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center' },
  safetyScoreText: { color: '#fff', fontWeight: '700', fontSize: 18 },
  safetyDetailRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#eee' },
  safetyIconContainer: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f5f5', borderRadius: 20, marginRight: 15 },
  safetyDetailContent: { flex: 1 },
  safetyDetailTitle: { fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 3 },
  safetyDetailText: { fontSize: 14, color: '#666' },
  crimeTitle: { fontSize: 18, fontWeight: '600', color: '#333', marginTop: 20, marginBottom: 15 },
  crimeItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f9f9f9', padding: 12, borderRadius: 10, marginBottom: 10 },
  crimeIconContainer: { marginRight: 10 },
  crimeContent: { flex: 1 },
  crimeType: { fontSize: 16, fontWeight: '500', color: '#333' },
  crimeDate: { fontSize: 14, color: '#666', marginTop: 2 },
  noCrimeText: { fontSize: 14, color: '#4CAF50', fontStyle: 'italic', padding: 10 },
  safetyButtonContainer: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 20 },
  safetyButton: { backgroundColor: '#FF69B4', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 10 },
  safetyButtonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  // Additional Customization Modal Styles
  customOption: { paddingVertical: 10 },
  // Search Card & Suggestions
  searchContainer: { flexDirection: 'row', marginBottom: 15 },
  searchButton: { backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 15, justifyContent: 'center', elevation: 2 },
  searchButtonText: { color: '#FF69B4', fontWeight: '600', fontSize: 16 },
});

