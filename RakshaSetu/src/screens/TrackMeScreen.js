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
  FlatList,
  Image,
  ActivityIndicator,
} from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import * as Location from 'expo-location';
import PolylineDecoder from '@mapbox/polyline';
import { Ionicons } from '@expo/vector-icons';

// ============ Google API Key ============
// Replace with your actual key.
const GOOGLE_MAPS_API_KEY = 'AIzaSyBzqSJUt0MVs3xFjFWTvLwiyjXwnzbkXok';

// Basic UI constants
const PINK = '#ff5f96';
const { width, height } = Dimensions.get('window');

// Custom Map Style (example style)
const customMapStyle = [
  { elementType: 'geometry', stylers: [{ color: '#ebe3cd' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#523735' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#f5f1e6' }] },
];

// Helper: Haversine formula (meters)
const haversineDistance = (coords1, coords2) => {
  const toRad = (value) => (value * Math.PI) / 180;
  const R = 6371000;
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

// Strip HTML tags from a string (for directions instructions)
const stripHtml = (html) => html.replace(/<[^>]*>/g, '');

// Mock safety data service – replace with real API as needed
const fetchSafetyData = async (coordinates) => {
  const hour = new Date().getHours();
  const isNightTime = hour < 6 || hour > 19;
  const mockResponse = {
    safety: Math.random() > 0.3 ? 'Safe' : 'Caution advised',
    lighting: isNightTime
      ? Math.random() > 0.4
        ? 'Well lit'
        : 'Poorly lit'
      : 'Daylight',
    visibility: Math.random() > 0.3 ? 'Good' : 'Limited',
    recentCrimes: [
      isNightTime && Math.random() > 0.7
        ? { type: 'Theft', date: '2 days ago', time: '9:45 PM' }
        : null,
      Math.random() > 0.8
        ? { type: 'Vandalism', date: '1 week ago', time: '11:30 PM' }
        : null,
    ].filter(Boolean),
    safetyScore: Math.floor(Math.random() * 40) + 60,
  };
  await new Promise((resolve) => setTimeout(resolve, 1000));
  return mockResponse;
};

// Safety indicator component
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

export default function TrackMeScreen() {
  const mapRef = useRef(null);
  const [location, setLocation] = useState(null);
  const [destination, setDestination] = useState('');
  const [destinationCoord, setDestinationCoord] = useState(null);
  const [routeCoords, setRouteCoords] = useState([]);
  const [safetyData, setSafetyData] = useState(null);
  const [loading, setLoading] = useState(false);

  // Journey & Directions
  const [journeyStarted, setJourneyStarted] = useState(false);
  const [watcher, setWatcher] = useState(null);
  const [distanceTraveled, setDistanceTraveled] = useState(0);
  const [heading, setHeading] = useState(null);
  const [ETA, setETA] = useState(null);
  const [directionsSteps, setDirectionsSteps] = useState([]);
  const [directionsModalVisible, setDirectionsModalVisible] = useState(false);

  // Map & nearby places
  const [showTraffic, setShowTraffic] = useState(false);
  const [mapType, setMapType] = useState('standard');
  const [nearbyPlaces, setNearbyPlaces] = useState([]);
  const [showNearbyPlaces, setShowNearbyPlaces] = useState(false);
  const [nearbyCategory, setNearbyCategory] = useState('police');

  // Alternative routes
  const [alternativeRoutes, setAlternativeRoutes] = useState([]);
  const [alternativeModalVisible, setAlternativeModalVisible] = useState(false);

  // Street View Modal
  const [streetViewVisible, setStreetViewVisible] = useState(false);

  // Safety Assessment Modal
  const [safetyModalVisible, setSafetyModalVisible] = useState(false);

  // Autocomplete Suggestions & Loading State
  const [suggestions, setSuggestions] = useState([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const debounceTimerRef = useRef(null);

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

  // Toggle map type (standard, satellite, hybrid, terrain)
  const toggleMapType = () => {
    const types = ['standard', 'satellite', 'hybrid', 'terrain'];
    const currentIndex = types.indexOf(mapType);
    setMapType(types[(currentIndex + 1) % types.length]);
  };

  // Fetch nearby places by category
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

  // Cycle nearby category and fetch new places if visible
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
        `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(query)}&key=${GOOGLE_MAPS_API_KEY}`
      );
      const data = await response.json();
      setSuggestions(data.status === 'OK' ? data.predictions : []);
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      setSuggestions([]);
    }
  };

  // Enhanced destination input handler with debouncing and loading indicator
  const handleDestinationChange = (text) => {
    setDestination(text);
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    setSuggestionsLoading(true);
    debounceTimerRef.current = setTimeout(async () => {
      await fetchSuggestions(text);
      setSuggestionsLoading(false);
    }, 500);
  };

  const selectSuggestion = (suggestion) => {
    setDestination(suggestion.description);
    setSuggestions([]);
    handleSearch(suggestion.description);
    Keyboard.dismiss();
  };

  // onSubmitEditing triggers search
  const handleSubmitEditing = () => {
    handleSearch();
    Keyboard.dismiss();
  };

  // Search function using Geocoding API.
  // After geocoding, the map animates to the destination and the Safety Assessment Modal is opened.
  const handleSearch = async (query) => {
    const searchQuery = query || destination;
    if (!searchQuery.trim()) {
      Alert.alert('Please enter a destination');
      return;
    }
    setLoading(true);
    try {
      const geoResponse = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
          searchQuery
        )}&key=${GOOGLE_MAPS_API_KEY}`
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
      // Animate the map to the destination.
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
      // Fetch safety data (using destination coordinate as dummy route)
      const safety = await fetchSafetyData([destCoord]);
      setSafetyData(safety);
      // Open the safety assessment modal.
      setSafetyModalVisible(true);
    } catch (error) {
      console.error('Geocoding Error:', error);
      Alert.alert('Failed to find location');
    } finally {
      setLoading(false);
    }
  };

  // Fetch route for directions (called when "Show Directions" is pressed from Safety Modal)
  const fetchRoute = async (mode = 'driving') => {
    if (!location || !destinationCoord) return;
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/directions/json?origin=${location.latitude},${location.longitude}&destination=${destinationCoord.latitude},${destinationCoord.longitude}&mode=${mode}&alternatives=true&key=${GOOGLE_MAPS_API_KEY}`
      );
      const data = await response.json();
      if (data.status !== 'OK') {
        Alert.alert('Failed to fetch route');
        return;
      }
      const primaryRoute = data.routes[0];
      const points = PolylineDecoder.decode(primaryRoute.overview_polyline.points);
      const route = points.map((point) => ({
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
      if (primaryRoute.legs && primaryRoute.legs[0]) {
        if (primaryRoute.legs[0].duration) {
          setETA(primaryRoute.legs[0].duration.text);
        }
        if (primaryRoute.legs[0].steps) {
          setDirectionsSteps(primaryRoute.legs[0].steps);
        }
      }
      // Also set any alternative routes.
      setAlternativeRoutes(data.routes.length > 1 ? data.routes.slice(1) : []);
    } catch (error) {
      console.error('Route Fetch Error:', error);
      Alert.alert('Failed to fetch route');
    }
  };

  // Journey functions
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
    journeyStarted ? endJourney() : startJourney();
  };

  // When a route option is selected from the routes modal
  const selectRouteAndStart = (routeData) => {
    const points = PolylineDecoder.decode(routeData.overview_polyline.points);
    const route = points.map((point) => ({
      latitude: point[0],
      longitude: point[1],
    }));
    setRouteCoords(route);
    if (routeData.legs && routeData.legs[0] && routeData.legs[0].duration) {
      setETA(routeData.legs[0].duration.text);
    }
    // Close modals
    setAlternativeModalVisible(false);
    setSafetyModalVisible(false);
  };

  // Get Street View URL
  const getStreetViewUrl = () => {
    if (!destinationCoord) return '';
    return `https://maps.googleapis.com/maps/api/streetview?size=400x400&location=${destinationCoord.latitude},${destinationCoord.longitude}&key=${GOOGLE_MAPS_API_KEY}`;
  };

  // Reset current route and search
  const resetRoute = () => {
    setDestination('');
    setDestinationCoord(null);
    setRouteCoords([]);
    setETA(null);
    setDirectionsSteps([]);
    setSafetyData(null);
  };

  // Recenter the map to the user's current location
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

  // Utility functions for icons
  const getSafetyIcon = (type) => {
    switch (type) {
      case 'Safe': return 'shield-checkmark';
      case 'Caution advised': return 'warning';
      default: return 'information-circle';
    }
  };

  const getLightingIcon = (type) => {
    switch (type) {
      case 'Well lit': return 'sunny';
      case 'Poorly lit': return 'moon';
      case 'Daylight': return 'sunny';
      default: return 'flashlight';
    }
  };

  const getVisibilityIcon = (type) => {
    switch (type) {
      case 'Good': return 'eye';
      case 'Limited': return 'eye-off';
      default: return 'eye';
    }
  };

  return (
    <View style={styles.container}>
      {/* Header with current journey data */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Track Me</Text>
        <Text style={styles.headerSubtitle}>
          Distance: {(distanceTraveled / 1000).toFixed(2)} km | ETA: {ETA ? ETA : 'N/A'} | Heading: {heading ? `${Math.round(heading)}°` : 'N/A'}
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
            {/* Destination Marker */}
            {destinationCoord && (
              <Marker coordinate={destinationCoord}>
                <Ionicons name="location" size={30} color="#FF6347" />
              </Marker>
            )}
            {/* Render route polyline */}
            {routeCoords.length > 0 && (
              <Polyline coordinates={routeCoords} strokeWidth={4} strokeColor={PINK} />
            )}
            {/* Nearby Places Markers */}
            {showNearbyPlaces && nearbyPlaces.map((place) => (
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
            <TouchableOpacity onPress={() => { setDestination(''); setSuggestions([]); }}>
              <Ionicons name="close-circle" size={20} color="#aaa" style={{ marginRight: 10 }} />
            </TouchableOpacity>
          )}
        </View>

        {/* Suggestions List */}
        {suggestions.length > 0 && (
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

        {/* Top-right Map Controls */}
        <View style={styles.mapControlsContainer}>
          <TouchableOpacity 
            style={styles.mapControlButton}
            onPress={() => setShowTraffic(!showTraffic)}
          >
            <Ionicons name="car" size={24} color="#fff" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.mapControlButton}
            onPress={toggleMapType}
          >
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
        </View>

        {/* Bottom-right Recenter Button */}
        <TouchableOpacity style={styles.recenterButton} onPress={handleRecenter}>
          <Ionicons name="locate" size={24} color="#fff" />
        </TouchableOpacity>

        {/* Bottom Center Buttons */}
        {/* Alternative Routes Button placed above the journey button */}
        {alternativeRoutes.length > 0 && (
          <TouchableOpacity 
            style={styles.altRouteButton}
            onPress={() => setAlternativeModalVisible(true)}
          >
            <Text style={styles.altRouteButtonText}>Alternatives</Text>
          </TouchableOpacity>
        )}
        {destinationCoord && routeCoords.length > 1 && (
          <TouchableOpacity style={styles.journeyButton} onPress={toggleJourney}>
            <Text style={styles.journeyButtonText}>
              {journeyStarted ? 'End Journey' : 'Start Journey'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Directions Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={directionsModalVisible}
        onRequestClose={() => setDirectionsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Turn-by-Turn Directions</Text>
              <TouchableOpacity style={styles.closeButton} onPress={() => setDirectionsModalVisible(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody}>
              {directionsSteps.map((step, index) => (
                <View key={index} style={styles.directionStep}>
                  <Text style={styles.directionStepText}>
                    {index + 1}. {stripHtml(step.html_instructions)} ({step.distance.text})
                  </Text>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Alternative Routes Modal */}
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
                <TouchableOpacity key={index} style={styles.altRouteItem} onPress={() => selectRouteAndStart(route)}>
                  <Text style={styles.altRouteText}>
                    Route {index + 1}: {route.legs[0].duration.text} ({route.legs[0].distance.text})
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Street View Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={streetViewVisible}
        onRequestClose={() => setStreetViewVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Street View</Text>
              <TouchableOpacity style={styles.closeButton} onPress={() => setStreetViewVisible(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            <Image style={{ width: '100%', height: 400, borderRadius: 10 }} source={{ uri: getStreetViewUrl() }} resizeMode="cover" />
          </View>
        </View>
      </Modal>

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
              <Text style={styles.modalTitle}>Route Safety Assessment</Text>
              <TouchableOpacity style={styles.closeButton} onPress={() => setSafetyModalVisible(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            {safetyData && (
              <ScrollView style={styles.modalBody}>
                <View style={styles.safetyHeaderRow}>
                  <Text style={styles.safetyTitle}>Overall Safety</Text>
                  <SafetyRatingIndicator score={safetyData.safetyScore} />
                </View>
                <View style={styles.safetyDetailRow}>
                  <View style={styles.safetyIconContainer}>
                    <Ionicons
                      name={getSafetyIcon(safetyData.safety)}
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
                {/* Options Panel inside Safety Modal */}
                <View style={styles.safetyButtonContainer}>
                  <TouchableOpacity
                    style={styles.safetyButton}
                    onPress={async () => {
                      await fetchRoute('driving');
                      setSafetyModalVisible(false);
                      setDirectionsModalVisible(true);
                    }}
                  >
                    <Text style={styles.safetyButtonText}>Show Directions</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.safetyButton}
                    onPress={() => {
                      setSafetyModalVisible(false);
                      startJourney();
                    }}
                  >
                    <Text style={styles.safetyButtonText}>Start Journey</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
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
  // Top-right map controls for traffic, map type, and nearby places
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
  // Bottom-right recenter button
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
  // Bottom center journey button
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
  journeyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  // Alternative Routes Button placed above the journey button
  altRouteButton: {
    position: 'absolute',
    bottom: 100,
    alignSelf: 'center',
    backgroundColor: PINK,
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 20,
    elevation: 5,
  },
  altRouteButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 25, borderTopRightRadius: 25, paddingVertical: 20, maxHeight: height * 0.7 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 15, borderBottomWidth: 1, borderBottomColor: '#eee' },
  modalTitle: { fontSize: 20, fontWeight: '700', color: '#333' },
  closeButton: { padding: 5 },
  modalBody: { paddingHorizontal: 20, paddingVertical: 10 },
  directionStep: { paddingVertical: 8, borderBottomWidth: 0.5, borderBottomColor: '#eee' },
  directionStepText: { fontSize: 14, color: '#333' },
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
  altRouteItem: { padding: 15, borderBottomWidth: 1, borderBottomColor: '#eee', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  altRouteText: { fontSize: 16, color: '#333' },
});

export { TrackMeScreen };
