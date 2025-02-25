// TrackMeScreen.js (JavaScript only)
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
} from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import * as Location from 'expo-location';

// ============ ORS API Key (Replace with your own) ============
const OPENROUTESERVICE_API_KEY = '5b3ce3597851110001cf6248079f5240b1ee4709bfc685d799ea21fc';

// Basic UI constants
const PINK = '#ff5f96';
const { width, height } = Dimensions.get('window');

export default function TrackMeScreen() {
  const mapRef = useRef(null);

  // Current user location
  const [location, setLocation] = useState(null);

  // Destination typed by user
  const [destination, setDestination] = useState('');

  // Coordinates for the found destination
  const [destinationCoord, setDestinationCoord] = useState(null);

  // The route from user location to destination
  const [routeCoords, setRouteCoords] = useState([]);

  // Request location on mount
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

  // Handle searching & routing
  const handleSearch = async () => {
    if (!destination.trim()) {
      Alert.alert('Please enter a destination');
      return;
    }
    Keyboard.dismiss();
    try {
      // 1) Geocode the destination via ORS
      const geoResponse = await fetch(
        `https://api.openrouteservice.org/geocode/search?api_key=${OPENROUTESERVICE_API_KEY}&text=${destination}`
      );
      const geoData = await geoResponse.json();

      if (!geoData.features || geoData.features.length === 0) {
        Alert.alert('Location not found');
        return;
      }

      // Extract lon/lat
      const [lon, lat] = geoData.features[0].geometry.coordinates;
      const destCoord = { latitude: lat, longitude: lon };
      setDestinationCoord(destCoord);

      // 2) Fetch the route from user location => destination
      if (location) {
        fetchRoute(location, destCoord);
      }
    } catch (error) {
      console.error('Geocoding Error:', error);
      Alert.alert('Failed to find location');
    }
  };

  // Actually fetch the route from ORS
  const fetchRoute = async (start, end) => {
    if (!start || !end) return;

    const bodyData = {
      coordinates: [
        [start.longitude, start.latitude],
        [end.longitude, end.latitude],
      ],
      format: 'geojson',
    };

    try {
      const response = await fetch('https://api.openrouteservice.org/v2/directions/driving-car', {
        method: 'POST',
        headers: {
          Authorization: OPENROUTESERVICE_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bodyData),
      });

      if (!response.ok) {
        console.log('ORS error:', response.status, response.statusText);
        Alert.alert('Failed to fetch route');
        return;
      }

      const data = await response.json();
      if (!data.features || data.features.length === 0) {
        Alert.alert('No route found');
        return;
      }

      // Convert the route geometry to lat/long pairs
      const route = data.features[0].geometry.coordinates.map(([lon, lat]) => ({
        latitude: lat,
        longitude: lon,
      }));
      setRouteCoords(route);

      // Optionally animate camera to show entire route
      if (mapRef.current && route.length > 1) {
        mapRef.current.fitToCoordinates(route, {
          edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
          animated: true,
        });
      }
    } catch (error) {
      console.error('Route Fetch Error:', error);
      Alert.alert('Failed to fetch route');
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
          <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
            <Text style={styles.searchButtonText}>Search & Route</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

// ============== STYLES ==============
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: PINK,
  },
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
});
