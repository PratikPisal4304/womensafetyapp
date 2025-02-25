// OnboardingScreen.js
import React, { useRef, useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  Image,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';

const { width } = Dimensions.get('window');

// Example slides data (customize as you wish)
const slides = [
  {
    id: '1',
    title: 'Your Safety, Our Priority',
    subtitle: 'Access real-time alerts, emergency contacts, fake calls, and more.',
    image: require('../assets/onboarding1.png'), // replace with your own image
    bgColor: ['#ffa0c1', '#ff5f96'], // Pinkish gradient
  },
  {
    id: '2',
    title: 'Stay Protected & Prepared',
    subtitle: 'Empower yourself with tools to stay safe anytime, anywhere.',
    image: require('../assets/onboarding2.png'),
    bgColor: ['#ffa0c1', '#ff5f96'],
  },
  {
    id: '3',
    title: 'Welcome to SafeLine',
    subtitle: 'Easily connect with loved ones & handle any situation with confidence.',
    image: require('../assets/onboarding3.png'),
    bgColor: ['#ffa0c1', '#ff5f96'],
  },
];

export default function OnboardingScreen({ navigation }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef(null);

  // Move to next slide
  const goToNextSlide = () => {
    if (currentIndex < slides.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
    } else {
      // Last slide => navigate or do something
      navigation.replace('Home'); // for example, navigate to 'Home'
    }
  };

  // Skip to last slide
  const skipToEnd = () => {
    flatListRef.current?.scrollToIndex({ index: slides.length - 1 });
  };

  // Listen for scroll position
  const onScrollEnd = (e) => {
    const contentOffsetX = e.nativeEvent.contentOffset.x;
    const newIndex = Math.round(contentOffsetX / width);
    setCurrentIndex(newIndex);
  };

  // Render each slide
  const renderItem = ({ item }) => {
    return (
      <View style={[styles.slideContainer, { width }]}>
        {/* Pinkish gradient background (or plain color) */}
        <View style={styles.gradientBackground} />
        {/* Title & subtitle */}
        <View style={styles.textContainer}>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.subtitle}>{item.subtitle}</Text>
        </View>
        {/* Image */}
        <Image
          source={item.image}
          style={styles.image}
          resizeMode="contain"
        />
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* FlatList for swiping through slides */}
      <FlatList
        ref={flatListRef}
        data={slides}
        renderItem={renderItem}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        onMomentumScrollEnd={onScrollEnd}
      />

      {/* Pagination dots */}
      <View style={styles.footer}>
        {/* Skip Button */}
        {currentIndex < slides.length - 1 ? (
          <TouchableOpacity onPress={skipToEnd}>
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 50 }} />
        )}

        {/* Dots */}
        <View style={styles.dotsContainer}>
          {slides.map((_, i) => {
            const isActive = i === currentIndex;
            return (
              <View
                key={`dot-${i}`}
                style={[styles.dot, isActive && styles.activeDot]}
              />
            );
          })}
        </View>

        {/* Next / Done Button */}
        <TouchableOpacity onPress={goToNextSlide}>
          <Text style={styles.nextText}>
            {currentIndex === slides.length - 1 ? 'Done' : 'Next'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// ============= STYLES =============
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ff5f96', // fallback color
  },
  slideContainer: {
    alignItems: 'center',
    justifyContent: 'flex-start',
    padding: 20,
  },
  gradientBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#ffacd9', // or use a real gradient library if desired
  },
  textContainer: {
    marginTop: 80,
    alignItems: 'center',
    paddingHorizontal: 15,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 10,
  },
  image: {
    width: '80%',
    height: 300,
    marginTop: 30,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    width: '100%',
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  skipText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '500',
  },
  nextText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '500',
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  activeDot: {
    backgroundColor: '#fff',
    width: 10,
    height: 10,
    borderRadius: 5,
  },
});
