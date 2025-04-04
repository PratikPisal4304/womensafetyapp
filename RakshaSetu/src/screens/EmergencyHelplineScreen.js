import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Linking,
  StatusBar,
} from 'react-native';
import { useTranslation } from 'react-i18next';

// Define HELPLINES with translation keys for labels.
const HELPLINES = [
  { id: '1', number: '112', label: 'emergencyHelpline.localPolice', icon: require('../../assets/localpolice.png') },
  { id: '2', number: '181', label: 'emergencyHelpline.womenHelpline', icon: require('../../assets/womenhelp.png') },
  { id: '3', number: '108', label: 'emergencyHelpline.localAmbulance', icon: require('../../assets/ambulance.png') },
  { id: '4', number: '101', label: 'emergencyHelpline.fireRescue', icon: require('../../assets/firerescue.png') },
  { id: '5', number: '1930', label: 'emergencyHelpline.cyberCrime', icon: require('../../assets/cybercrime.png') },
];

const EmergencyHelplineScreen = () => {
  const { t } = useTranslation();

  const handleCall = (phoneNumber) => {
    Linking.openURL(`tel:${phoneNumber}`);
  };

  return (
    <View style={styles.wrapper}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      
      {/* Header with bottom curves */}
      <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>{t('emergencyHelpline.header')}</Text>
        <Text style={styles.subHeader}>{t('emergencyHelpline.subHeader')}</Text>
      </View>
      
      {/* Main content */}
      <View style={styles.cardContainer}>
        {HELPLINES.map((item) => (
          <View key={item.id} style={styles.card}>
            <Image source={item.icon} style={styles.cardImage} />
            <View style={styles.cardTextContainer}>
              <Text style={styles.cardNumber}>{item.number}</Text>
              <Text style={styles.cardLabel}>{t(item.label)}</Text>
            </View>
            <TouchableOpacity
              style={styles.callButton}
              onPress={() => handleCall(item.number)}
            >
              <Image
                source={require('../../assets/call.png')}
                style={styles.callIcon}
              />
            </TouchableOpacity>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: '#FF5F96', // Pink fills the status bar area
    paddingTop: StatusBar.currentHeight || 20,
    overflow: 'hidden', // Prevent any scrolling or bouncing
  },
  headerContainer: {
    backgroundColor: '#FF5F96',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 50,
    borderBottomRightRadius: 50,
    overflow: 'hidden', // Ensure the curve is not affected by overflow
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 3,
  },
  subHeader: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  cardContainer: {
    flex: 1,
    backgroundColor: '#FFDDE5', // Content background
    paddingHorizontal: 20,
    paddingVertical: 20,
    justifyContent: 'center',
    overflow: 'hidden', // Prevent any bounce in the content area
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 3,
  },
  cardImage: {
    width: 50,
    height: 50,
    resizeMode: 'contain',
    marginRight: 15,
  },
  cardTextContainer: {
    flex: 1,
  },
  cardNumber: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  cardLabel: {
    fontSize: 14,
    color: '#777',
    marginTop: 4,
  },
  callButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FF82A9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  callIcon: {
    width: 24,
    height: 24,
    tintColor: '#fff',
    resizeMode: 'contain',
  },
});

export default EmergencyHelplineScreen;
