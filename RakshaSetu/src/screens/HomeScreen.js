// src/screens/HomeScreen.js

import { FontAwesome5, Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  updateDoc,
  writeBatch,
} from "firebase/firestore";
import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Image,
  Linking,
  Modal,
  ScrollView,
  Share,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { auth, db } from "../../config/firebaseConfig";

const PINK = "#ff5f96";

const HomeScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const [username, setUsername] = useState("Lucy Patil"); // fallback name
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [notificationModalVisible, setNotificationModalVisible] = useState(false);

  // Notifications state
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);

  // Example Job Insights state (replace with your real data)
  const [jobInsights, setJobInsights] = useState({
    totalJobs: 0,
    trending: [],
    salaryData: {},
    loading: true,
  });

  const fetchJobInsights = async () => {
    try {
      // Replace this with a real API/Firestore call if needed
      setJobInsights({
        totalJobs: 1250,
        trending: [
          { title: "Software Engineer", growth: "+15%" },
          { title: "Data Analyst", growth: "+12%" },
          { title: "UX Designer", growth: "+8%" },
        ],
        salaryData: {
          labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
          datasets: [
            {
              data: [65000, 68000, 69500, 71000, 72500, 75000],
              color: () => PINK,
              strokeWidth: 2,
            },
          ],
        },
        loading: false,
      });
    } catch (error) {
      console.log("Error fetching job insights:", error);
      setJobInsights((prev) => ({ ...prev, loading: false }));
    }
  };

  useEffect(() => {
    fetchJobInsights();
  }, []);

  // Animated modal values for notifications
  const modalScale = useRef(new Animated.Value(0)).current;
  const modalOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (notificationModalVisible) {
      Animated.parallel([
        Animated.timing(modalScale, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(modalOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(modalScale, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(modalOpacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [notificationModalVisible]);

  // Fetch user data from Firestore
  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;
    (async () => {
      try {
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.name) setUsername(data.name);
          if (data.avatarUrl) setAvatarUrl(data.avatarUrl);
        }
      } catch (error) {
        console.log("Error fetching user data:", error.message);
      }
    })();
  }, []);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const user = auth.currentUser;
      if (!user) {
        setLoading(false);
        return;
      }
      const notificationsRef = collection(db, "users", user.uid, "notifications");
      const q = query(notificationsRef, orderBy("timestamp", "desc"));
      const querySnapshot = await getDocs(q);
      const notificationData = [];
      querySnapshot.forEach((docSnap) => {
        notificationData.push({
          id: docSnap.id,
          ...docSnap.data(),
        });
      });
      setNotifications(notificationData);
    } catch (error) {
      console.log("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (notificationModalVisible) {
      fetchNotifications();
    }
  }, [notificationModalVisible]);

  const markAsRead = async (notificationId) => {
    try {
      const user = auth.currentUser;
      if (!user) return;
      const notificationRef = doc(db, "users", user.uid, "notifications", notificationId);
      await updateDoc(notificationRef, { read: true });
      setNotifications(
        notifications.map((item) =>
          item.id === notificationId ? { ...item, read: true } : item
        )
      );
    } catch (error) {
      console.log("Error marking notification as read:", error);
    }
  };

  const clearAllNotifications = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;
      const batch = writeBatch(db);
      const notificationsRef = collection(db, "users", user.uid, "notifications");
      const querySnapshot = await getDocs(notificationsRef);
      querySnapshot.forEach((docSnap) => {
        batch.delete(docSnap.ref);
      });
      await batch.commit();
      setNotifications([]);
    } catch (error) {
      console.log("Error clearing notifications:", error);
    }
  };

  const openNearbyPoliceStations = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        alert(t("home.permissionDenied"));
        return;
      }
      const currentLocation = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = currentLocation.coords;
      const googleMapsURL = `https://www.google.com/maps/search/police+station/@${latitude},${longitude},15z`;
      await Linking.openURL(googleMapsURL);
    } catch (error) {
      console.error("Error fetching location:", error);
    }
  };

  const openNearbyHospitals = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        alert(t("home.permissionDenied"));
        return;
      }
      const currentLocation = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = currentLocation.coords;
      const googleMapsURL = `https://www.google.com/maps/search/hospital/@${latitude},${longitude},15z`;
      await Linking.openURL(googleMapsURL);
    } catch (error) {
      console.error("Error fetching location:", error);
    }
  };

  const openNearbyPharmacies = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        alert(t("home.permissionDenied"));
        return;
      }
      const currentLocation = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = currentLocation.coords;
      const googleMapsURL = `https://www.google.com/maps/search/pharmacy/@${latitude},${longitude},15z`;
      await Linking.openURL(googleMapsURL);
    } catch (error) {
      console.error("Error fetching location:", error);
    }
  };

  // ===== Location Sharing =====
  // Single button triggers an alert with two options:
  // "Live Location" navigates to LiveLocationScreen with a default timer (1 minute).
  // "Current Location" shares a one-time location.
  const handleShareLocation = () => {
    Alert.alert("Share Location", "Choose sharing option", [
      {
        text: "Live Location",
        onPress: () =>
          navigation.navigate("LiveLocationScreen", { duration: 1 }),
      },
      {
        text: "Current Location",
        onPress: shareCurrentLocation,
      },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  // One-time share current location
  const shareCurrentLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      alert(t("home.permissionDenied"));
      return;
    }
    const currentLocation = await Location.getCurrentPositionAsync({});
    const { latitude, longitude } = currentLocation.coords;
    const link = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
    Share.share({
      message: `Here's my current location: ${link}`,
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={["left", "right"]}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Notification Modal */}
      <Modal
        transparent={true}
        visible={notificationModalVisible}
        onRequestClose={() => setNotificationModalVisible(false)}
        animationType="none"
      >
        <TouchableWithoutFeedback onPress={() => setNotificationModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <Animated.View
              style={[
                styles.modalContainer,
                { transform: [{ scale: modalScale }], opacity: modalOpacity },
              ]}
            >
              <View style={styles.notificationHeader}>
                <Ionicons name="notifications" size={20} color="#fff" />
                <Text style={styles.notificationHeaderText}>
                  {t("notifications.header")}
                </Text>
              </View>
              <ScrollView style={styles.notificationBody}>
                {loading ? (
                  <ActivityIndicator color={PINK} size="small" style={{ padding: 20 }} />
                ) : notifications.length > 0 ? (
                  notifications.map((notification) => (
                    <TouchableOpacity
                      key={notification.id}
                      style={[
                        styles.notificationItem,
                        { backgroundColor: notification.read ? "#F8F8F8" : "#FFF0F5" },
                      ]}
                      onPress={() => markAsRead(notification.id)}
                    >
                      <Text style={styles.notificationTitle}>{notification.title}</Text>
                      <Text style={styles.notificationMessage}>{notification.message}</Text>
                      <Text style={styles.notificationTime}>
                        {notification.timestamp?.toDate().toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}{" "}
                        · {notification.timestamp?.toDate().toLocaleDateString()}
                      </Text>
                    </TouchableOpacity>
                  ))
                ) : (
                  <View style={styles.emptyNotification}>
                    <Ionicons name="notifications-off-outline" size={40} color="#DDD" />
                    <Text style={styles.emptyNotificationText}>
                      {t("notifications.empty")}
                    </Text>
                  </View>
                )}
              </ScrollView>
              <View style={{ flexDirection: "row" }}>
                {notifications.length > 0 && (
                  <TouchableOpacity
                    style={[
                      styles.closeButton,
                      { flex: 1, borderRightWidth: 1, borderRightColor: "#EEE" },
                    ]}
                    onPress={clearAllNotifications}
                  >
                    <Text style={styles.closeButtonText}>{t("notifications.clearAll")}</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={[styles.closeButton, { flex: 1 }]}
                  onPress={() => setNotificationModalVisible(false)}
                >
                  <Text style={styles.closeButtonText}>{t("notifications.dismiss")}</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      <ScrollView contentContainerStyle={{ flexGrow: 1, paddingBottom: 100 }}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.userInfo}>
            <Image
              source={
                avatarUrl
                  ? { uri: avatarUrl }
                  : require("../../assets/icon.png")
              }
              style={styles.avatar}
            />
            <Text style={styles.greeting}>{t("home.greeting")}</Text>
            <Text style={styles.username}>{username}</Text>
          </View>
          <View style={styles.headerIcons}>
            <TouchableOpacity onPress={() => setNotificationModalVisible(true)}>
              <Ionicons name="notifications-outline" size={24} color="black" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity
            onPress={() => navigation.navigate("FakeCall")}
            style={styles.actionButton}
          >
            <Image
              source={require("../../assets/fake-call.png")}
              style={styles.actionIcon}
            />
            <Text style={styles.actionText}>{t("home.fakeCall")}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleShareLocation}
          >
            <Image
              source={require("../../assets/livelocation.png")}
              style={styles.actionIcon}
            />
            <Text style={styles.actionText}>{t("home.shareLiveLocation")}</Text>
          </TouchableOpacity>
        </View>

        {/* Add Close People Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t("home.addClosePeopleTitle")}</Text>
            <Text style={styles.sectionSubtitle}>{t("home.addClosePeopleSubtitle")}</Text>
          </View>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => navigation.navigate("AddFriends")}
          >
            <Text style={styles.addButtonText}>{t("home.addFriendsButton")}</Text>
            <Ionicons name="person-add" size={20} color="white" />
          </TouchableOpacity>
        </View>

        {/* Skill Development Section */}
        <TouchableOpacity
          style={styles.skillSection}
          onPress={() => navigation.navigate("SkillDevelopment")}
        >
          <View style={styles.skillContent}>
            <View style={styles.skillIconContainer}>
              <Image
                source={require("../../assets/skill.png")}
                style={styles.skillIcon}
              />
            </View>
            <View style={styles.skillTextContainer}>
              <Text style={styles.skillTitle}>{t("home.skillTitle")}</Text>
              <Text style={styles.skillSubtitle}>{t("home.skillSubtitle")}</Text>
              <View style={styles.skillProgress}>
                <View style={styles.progressBar}>
                  <View style={styles.progressFill} />
                </View>
                <Text style={styles.progressText}>{t("home.skillProgressText")}</Text>
              </View>
            </View>
          </View>
          <View style={styles.skillArrowContainer}>
            <Ionicons name="chevron-forward" size={24} color={PINK} />
          </View>
        </TouchableOpacity>

        {/* AI Report Generator Section */}
        <TouchableOpacity
          style={styles.journeySection}
          onPress={() => navigation.navigate("GenerateReport")}
        >
          <View style={styles.journeyContent}>
            <Image
              source={require("../../assets/report.png")}
              style={styles.journeyIcon}
            />
            <View>
              <Text style={styles.journeyTitle}>{t("home.generateReportTitle")}</Text>
              <Text style={styles.journeySubtitle}>{t("home.generateReportSubtitle")}</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={24} color="black" />
        </TouchableOpacity>

        {/* Job Market Section */}
        <TouchableOpacity
          style={styles.jobMarketSection}
          onPress={() => navigation.navigate("JobMarket")}
        >
          <View style={styles.jobMarketContent}>
            <Image
              source={require("../../assets/job.png")}
              style={styles.jobMarketIcon}
            />
            <View>
              {/* Use t('jobMarket') and t('searchJobListings') instead of hardcoded text */}
              <Text style={styles.jobMarketTitle}>{t('home.jobMarket')}</Text>
              <Text style={styles.jobMarketSubtitle}>{t('home.searchJobListings')}</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={24} color="black" />
        </TouchableOpacity>

        {/* Journey Section */}
        <TouchableOpacity
          style={styles.journeySection}
          onPress={() => navigation.navigate("TrackMe")}
        >
          <View style={styles.journeyContent}>
            <Image
              source={require("../../assets/journey.png")}
              style={styles.journeyIcon}
            />
            <View>
              <Text style={styles.journeyTitle}>{t("home.journeyTitle")}</Text>
              <Text style={styles.journeySubtitle}>{t("home.journeySubtitle")}</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={24} color="black" />
        </TouchableOpacity>

        {/* Emergency Buttons */}
        <TouchableOpacity
          style={styles.emergencyButton}
          onPress={openNearbyPoliceStations}
        >
          <FontAwesome5 name="shield-alt" size={20} color="black" />
          <Text style={styles.emergencyText}>{t("home.policeNearMe")}</Text>
          <Ionicons name="chevron-forward" size={24} color="black" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.emergencyButton}
          onPress={openNearbyHospitals}
        >
          <FontAwesome5 name="hospital" size={20} color="black" />
          <Text style={styles.emergencyText}>{t("home.hospitalNearMe")}</Text>
          <Ionicons name="chevron-forward" size={24} color="black" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.emergencyButton}
          onPress={openNearbyPharmacies}
        >
          <FontAwesome5 name="clinic-medical" size={20} color="black" />
          <Text style={styles.emergencyText}>{t("home.pharmacyNearMe")}</Text>
          <Ionicons name="chevron-forward" size={24} color="black" />
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFF" },
  header: {
    backgroundColor: PINK,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    paddingHorizontal: 20,
    paddingTop: 70,
    paddingBottom: 40,
    marginBottom: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  userInfo: { flexDirection: "column" },
  avatar: { width: 40, height: 40, borderRadius: 20 },
  greeting: { fontSize: 16, color: "#666" },
  username: { fontSize: 24, fontWeight: "bold", color: "#000" },
  headerIcons: { flexDirection: "row", gap: 15 },
  quickActions: { flexDirection: "row", justifyContent: "space-around", padding: 20 },
  actionButton: {
    backgroundColor: "#FFF",
    padding: 20,
    borderRadius: 15,
    alignItems: "center",
    width: "45%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionIcon: { width: 40, height: 40, marginBottom: 10 },
  actionText: { textAlign: "center", color: "#000" },
  section: {
    padding: 20,
    backgroundColor: "#FFF",
    borderRadius: 15,
    marginHorizontal: 20,
    marginVertical: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionHeader: { marginBottom: 10 },
  sectionTitle: { fontSize: 18, fontWeight: "bold", color: "#000" },
  sectionSubtitle: { color: "#666", fontSize: 14 },
  addButton: {
    backgroundColor: "#FF4B8C",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 10,
    borderRadius: 25,
    gap: 10,
    marginTop: 10,
  },
  addButtonText: { color: "#FFF", fontWeight: "500" },
  skillSection: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 15,
    backgroundColor: "#FFF",
    borderRadius: 15,
    marginHorizontal: 20,
    marginVertical: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: PINK,
  },
  skillContent: { flexDirection: "row", alignItems: "center", flex: 1 },
  skillIconContainer: { backgroundColor: PINK + "15", padding: 10, borderRadius: 12, marginRight: 15 },
  skillIcon: { width: 40, height: 40 },
  skillTextContainer: { flex: 1 },
  skillTitle: { fontSize: 18, fontWeight: "bold", color: "#000", marginBottom: 4 },
  skillSubtitle: { color: "#666", fontSize: 13, lineHeight: 18, marginBottom: 8 },
  skillProgress: { width: "100%", marginTop: 5 },
  progressBar: { height: 6, backgroundColor: "#F0F0F0", borderRadius: 3, width: "100%", marginBottom: 5 },
  progressFill: { height: "100%", width: "40%", backgroundColor: PINK, borderRadius: 3 },
  progressText: { fontSize: 12, color: "#888" },
  skillArrowContainer: { backgroundColor: PINK + "10", padding: 8, borderRadius: 20 },
  journeySection: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 20,
    backgroundColor: "#FFF",
    borderRadius: 15,
    marginHorizontal: 20,
    marginVertical: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  journeyContent: { flexDirection: "row", alignItems: "center", flex: 1 },
  journeyIcon: { width: 40, height: 40, marginRight: 15 },
  journeyTitle: { fontSize: 18, fontWeight: "bold", color: "#000" },
  journeySubtitle: { color: "#666", fontSize: 12 },
  jobMarketSection: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 20,
    backgroundColor: "#FFF",
    borderRadius: 15,
    marginHorizontal: 20,
    marginVertical: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  jobMarketContent: { flexDirection: "row", alignItems: "center", flex: 1 },
  jobMarketIcon: { width: 40, height: 40, marginRight: 15 },
  jobMarketTitle: { fontSize: 18, fontWeight: "bold", color: "#000" },
  jobMarketSubtitle: { color: "#666", fontSize: 12 },
  emergencyButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 20,
    backgroundColor: "#FFF",
    borderRadius: 15,
    marginHorizontal: 20,
    marginVertical: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  emergencyText: { flex: 1, marginLeft: 15, fontSize: 16, color: "#000" },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
  },
  modalContainer: {
    position: 'absolute',
    top: StatusBar.currentHeight ? StatusBar.currentHeight + 15 : 55,
    right: 15,
    width: 300,
    backgroundColor: '#fff',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 10,
  },
  notificationHeader: {
    backgroundColor: PINK,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  notificationHeaderText: {
    color: '#fff',
    fontSize: 16,
    marginLeft: 10,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  notificationBody: {
    padding: 12,
    maxHeight: 350,
  },
  notificationItem: {
    backgroundColor: '#f9f9f9',
    padding: 14,
    borderRadius: 16,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: PINK,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  notificationTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  notificationMessage: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
  },
  notificationTime: {
    fontSize: 12,
    color: '#888',
    marginTop: 8,
    textAlign: 'right',
  },
  emptyNotification: {
    padding: 25,
    alignItems: 'center',
  },
  emptyNotificationText: {
    color: '#888',
    textAlign: 'center',
    marginTop: 10,
    fontSize: 14,
  },
  closeButton: {
    backgroundColor: '#f6f6f6',
    paddingVertical: 14,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  closeButtonText: {
    color: PINK,
    fontWeight: '600',
    fontSize: 15,
  },
  clearAllButton: {
    backgroundColor: '#fff',
    paddingVertical: 14,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    borderRightWidth: 1,
    borderRightColor: '#eee',
  },
  clearAllButtonText: {
    color: '#777',
    fontWeight: '500',
    fontSize: 15,
  },
});