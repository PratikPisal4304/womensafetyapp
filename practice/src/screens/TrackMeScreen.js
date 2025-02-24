import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Keyboard,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker, Polyline } from 'react-native-maps';
import * as Location from 'expo-location';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');
const PINK = '#ff5f96';

// Insert your actual OpenRouteService API key
const OPENROUTESERVICE_API_KEY = '5b3ce3597851110001cf6248079f5240b1ee4709bfc685d799ea21fc';

function TrackMeScreen() {
  // Text input states
  const [yourLocation, setYourLocation] = useState('Your Location');
  const [destination, setDestination] = useState('2 Buck St');

  // Real-time location
  const [userLocation, setUserLocation] = useState(null);
  const [locationErrorMsg, setLocationErrorMsg] = useState(null);

  // Subscription for location changes
  const locationSubscription = useRef(null);

  // Destination coordinate (dummy)
  const [destinationCoord, setDestinationCoord] = useState({
    latitude: 37.79025,
    longitude: -122.4344,
  });

  // Route coordinates from user location to destination
  const [routeCoordinates, setRouteCoordinates] = useState([]);

  // On mount, request location & watch changes
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationErrorMsg('Permission to access location was denied');
        return;
      }

      let initialLoc = await Location.getCurrentPositionAsync({});
      if (initialLoc) {
        const { latitude, longitude } = initialLoc.coords;
        setUserLocation({ latitude, longitude });
        fetchRouteFromORS({ latitude, longitude }, destinationCoord);
      }

      // Watch location changes
      locationSubscription.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          distanceInterval: 1,
        },
        (loc) => {
          const { latitude, longitude } = loc.coords;
          setUserLocation({ latitude, longitude });
          fetchRouteFromORS({ latitude, longitude }, destinationCoord);
        }
      );
    })();

    return () => {
      if (locationSubscription.current) {
        locationSubscription.current.remove();
      }
    };
  }, []);

  // Recompute route if destinationCoord changes
  useEffect(() => {
    if (userLocation) {
      fetchRouteFromORS(userLocation, destinationCoord);
    }
  }, [destinationCoord]);

  // Fetch route from ORS
  const fetchRouteFromORS = async (startCoord, endCoord) => {
    if (!startCoord || !endCoord) return;

    const bodyData = {
      coordinates: [
        [startCoord.longitude, startCoord.latitude],
        [endCoord.longitude, endCoord.latitude],
      ],
      format: 'geojson',
    };

    try {
      const response = await fetch(
        'https://api.openrouteservice.org/v2/directions/driving-car',
        {
          method: 'POST',
          headers: {
            Authorization: OPENROUTESERVICE_API_KEY,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(bodyData),
        }
      );
      if (!response.ok) {
        console.log('ORS error:', response.status, response.statusText);
        return;
      }
      const data = await response.json();
      if (data.features && data.features.length > 0) {
        const geometry = data.features[0].geometry;
        const coords = geometry.coordinates.map(([lon, lat]) => ({
          latitude: lat,
          longitude: lon,
        }));
        setRouteCoordinates(coords);
      }
    } catch (error) {
      console.log('Error fetching route:', error);
    }
  };

  // Called when user taps "Search"
  const handleSearch = () => {
    Keyboard.dismiss();
    // In real usage, you'd geocode the 'destination' => lat/lon
    // For now, toggling two dummy coords if includes 'buck'
    if (destination.toLowerCase().includes('buck')) {
      setDestinationCoord({ latitude: 37.79025, longitude: -122.4344 });
    } else {
      setDestinationCoord({ latitude: 37.79225, longitude: -122.4320 });
    }
  };

  // Render the map or a placeholder if location not ready
  const renderMap = () => {
    if (!userLocation) {
      return (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>
            {locationErrorMsg || 'Getting your location...'}
          </Text>
        </View>
      );
    }
    return (
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
      >
        {/* Marker: user location */}
        <Marker coordinate={userLocation} title="You are here" pinColor={PINK} />

        {/* Marker: destination */}
        <Marker
          coordinate={destinationCoord}
          title="Destination"
          description={destination}
        />

        {/* Polyline route */}
        {routeCoordinates.length > 1 && (
          <Polyline coordinates={routeCoordinates} strokeColor={PINK} strokeWidth={4} />
        )}
      </MapView>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['left','right']}>
      {/* Pink header */}
      <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>Track Me</Text>
        <Text style={styles.headerSubtitle}>
          This ensures your loved ones can monitor your location in real-time.
        </Text>
      </View>

      {/* Map container */}
      <View style={styles.mapContainer}>
        {renderMap()}

        {/* Overlaid card for inputs & search */}
        <View style={styles.inputCard}>
          <TextInput
            style={styles.input}
            value={yourLocation}
            onChangeText={setYourLocation}
            placeholder="Your Location"
          />
          <TextInput
            style={styles.input}
            value={destination}
            onChangeText={setDestination}
            placeholder="Destination"
          />

          <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
            <Ionicons name="search" size={20} color="#fff" />
            <Text style={styles.searchButtonText}>Search</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Bottom nav + SOS */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="location" size={24} color={PINK} />
          <Text style={styles.navLabel}>Track Me</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.sosButton}>
          <Ionicons name="alert-circle-outline" size={24} color="#fff" />
          <Text style={styles.sosText}>SOS</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="person-outline" size={24} color="#555" />
          <Text style={styles.navLabel}>Profile</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

export default TrackMeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  headerContainer: {
    backgroundColor: PINK,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    paddingTop: 60,
    paddingBottom: 25,
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
  },
  // The map covers the rest of the screen
  mapContainer: {
    flex: 1,
  },
  map: {
    width: '100%',
    height: '100%',
  },
  loadingContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#555',
    fontSize: 16,
  },
  // Overlaid card for inputs
  inputCard: {
    position: 'absolute',
    top: 20,
    alignSelf: 'center',
    width: width * 0.9,
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 15,
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 5,
  },
  input: {
    backgroundColor: '#f9f9f9',
    padding: 10,
    borderRadius: 10,
    marginBottom: 10,
    fontSize: 15,
  },
  searchButton: {
    backgroundColor: PINK,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 15,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
  },
  searchButtonText: {
    color: '#fff',
    marginLeft: 6,
    fontSize: 15,
    fontWeight: '600',
  },
  bottomNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: '#fff',
    paddingVertical: 10,
    borderTopColor: '#eee',
    borderTopWidth: 1,
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  navLabel: {
    fontSize: 12,
    color: PINK,
    marginTop: 2,
  },
  sosButton: {
    backgroundColor: PINK,
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 4,
    marginTop: -30,
  },
  sosText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
    marginTop: 2,
  },
});
