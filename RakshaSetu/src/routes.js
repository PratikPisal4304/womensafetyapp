// Routes.js
import React from "react";
import { View, StyleSheet } from "react-native";
import {
  createBottomTabNavigator,
  BottomTabBar,
} from "@react-navigation/bottom-tabs";
import { createStackNavigator } from "@react-navigation/stack";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import Animated from "react-native-reanimated";
import { getFocusedRouteNameFromRoute } from "@react-navigation/native";
import KeyboardAwareWrapper from "./components/KeyboardAwareWrapper";

/** Import your screens below **/
import SplashScreen from "./screens/SplashScreen";
import LoginScreen from "./screens/LoginScreen";
import OTPVerificationScreen from "./screens/OTPVerificationScreen";
import SignUpScreen from "./screens/SignUpScreen";
import CreatePinScreen from "./screens/CreatePinScreen";
import TellUsAboutYourselfScreen from "./screens/TellUsAboutYourselfScreen";
import HomeScreen from "./screens/HomeScreen";
import FakeCallScreen from "./screens/FakeCallScreen";
import TrackMeScreen from "./screens/TrackMeScreen";
import ProfileScreen from "./screens/ProfileScreen";
import EditProfileScreen from "./screens/EditProfileScreen";
import EmergencyHelplineScreen from "./screens/EmergencyHelplineScreen";
import CommunityScreen from "./screens/CommunityScreen";

// Create navigators
const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Wrap screens in KeyboardAwareWrapper if needed
const withKeyboardAwareWrapper = (Component) => (props) => (
  <KeyboardAwareWrapper>
    <Component {...props} />
  </KeyboardAwareWrapper>
);

/** ========== 1) Home Stack ========== **/
const HomeStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="HomeMain" component={HomeScreen} />
    <Stack.Screen name="FakeCall" component={FakeCallScreen} />
  </Stack.Navigator>
);

/** ========== 2) Profile Stack ========== **/
const ProfileStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen
      name="ProfileMain"
      component={withKeyboardAwareWrapper(ProfileScreen)}
    />
    <Stack.Screen
      name="EditProfile"
      component={withKeyboardAwareWrapper(EditProfileScreen)}
    />
    <Stack.Screen
      name="EmergencyHelpline"
      component={withKeyboardAwareWrapper(EmergencyHelplineScreen)}
    />
  </Stack.Navigator>
);

/** ========== Custom Tab Bar (inline) ========== **/
function CustomTabBar(props) {
  // Get the current tab route (e.g., "Home", "Navigation", "Profile", etc.)
  const currentTabRoute = props.state.routes[props.state.index].name;

  // We'll hide the tab bar if the user is on certain child routes
  let hideTabBar = false;

  // If user is on "Home" tab, check if child route is "FakeCall"
  if (currentTabRoute === "Home") {
    const childRouteName =
      getFocusedRouteNameFromRoute(props.state.routes[props.state.index]) ??
      "HomeMain";
    if (childRouteName === "FakeCall") {
      hideTabBar = true;
    }
  }
  // If user is on "Profile" tab, check if child route is "EditProfile" or "EmergencyHelpline"
  else if (currentTabRoute === "Profile") {
    const childRouteName =
      getFocusedRouteNameFromRoute(props.state.routes[props.state.index]) ??
      "ProfileMain";
    if (childRouteName === "EditProfile" || childRouteName === "EmergencyHelpline") {
      hideTabBar = true;
    }
  }

  // If we want to hide the tab bar, return null so it doesn't render at all
  if (hideTabBar) {
    return null;
  }

  // Otherwise, render a white tab bar with a slight shadow
  return (
    <View style={styles.tabBarContainer}>
      <View style={styles.tabBarBackground}>
        <BottomTabBar {...props} />
      </View>
    </View>
  );
}

/** ========== 3) Main Tabs ========== **/
function MainTabs() {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "transparent",
          position: "absolute",
          elevation: 0,
          borderTopWidth: 0,
        },
        tabBarActiveTintColor: "#FF4B8C",
        tabBarInactiveTintColor: "#8e8e8e",
        tabBarShowLabel: true,
        // Icon above label
        tabBarLabelPosition: "below-icon",
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "500",
        },
        tabBarItemStyle: {
          justifyContent: "center",
          alignItems: "center",
        },
      }}
    >
      {/** 1) Home Tab */}
      <Tab.Screen
        name="Home"
        component={HomeStack}
        options={{
          tabBarLabel: ({ focused }) => (
            <Animated.Text
              style={{
                color: focused ? "#FF4B8C" : "#8e8e8e",
                fontSize: 12,
                fontWeight: focused ? "600" : "400",
                opacity: focused ? 1 : 0.8,
              }}
            >
              Home
            </Animated.Text>
          ),
          tabBarIcon: ({ color, size, focused }) => (
            <Animated.View
              style={{
                transform: [{ scale: focused ? 1 : 1 }],
                backgroundColor: focused
                  ? "rgba(255, 75, 140, 0.1)"
                  : "transparent",
                padding: 5,
                borderRadius: 15,
                width: 40,
                height: 40,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons
                name={focused ? "home" : "home-outline"}
                size={size}
                color={color}
                style={{ transform: [{ translateY: focused ? -2 : 0 }] }}
              />
            </Animated.View>
          ),
        }}
      />

      {/** 2) Track Me Tab */}
      <Tab.Screen
        name="Navigation"
        component={TrackMeScreen}
        options={{
          title: "Track Me",
          tabBarLabel: ({ focused }) => (
            <Animated.Text
              style={{
                color: focused ? "#FF4B8C" : "#8e8e8e",
                fontSize: 12,
                fontWeight: focused ? "600" : "400",
                opacity: focused ? 1 : 0.8,
              }}
            >
              Track Me
            </Animated.Text>
          ),
          tabBarIcon: ({ color, size, focused }) => (
            <Animated.View
              style={{
                transform: [{ scale: focused ? 1 : 1 }],
                backgroundColor: focused
                  ? "rgba(255, 75, 140, 0.1)"
                  : "transparent",
                padding: 5,
                borderRadius: 15,
                width: 40,
                height: 40,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <MaterialCommunityIcons
                name="navigation-variant-outline"
                size={size}
                color={color}
                style={{ transform: [{ translateY: focused ? -2 : 0 }] }}
              />
            </Animated.View>
          ),
        }}
      />

      {/** 3) SOS Tab */}
      <Tab.Screen
        name="SOS"
        component={HomeStack}
        options={{
          tabBarLabel: ({ focused }) => (
            <Animated.Text
              style={{
                color: focused ? "#FF4B8C" : "#8e8e8e",
                fontSize: 12,
                fontWeight: focused ? "600" : "400",
                opacity: focused ? 1 : 0.8,
              }}
            >
              SOS
            </Animated.Text>
          ),
          tabBarIcon: ({ color, size, focused }) => (
            <Animated.View
              style={{
                transform: [{ scale: focused ? 1 : 1 }],
                backgroundColor: focused
                  ? "rgba(255, 75, 140, 0.1)"
                  : "transparent",
                padding: 5,
                borderRadius: 15,
                width: 40,
                height: 40,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons
                name="alert-circle-outline"
                size={size}
                color={color}
                style={{ transform: [{ translateY: focused ? -2 : 0 }] }}
              />
            </Animated.View>
          ),
        }}
      />

      {/** 4) Community Tab */}
      <Tab.Screen
        name="Community"
        component={CommunityScreen}
        options={{
          tabBarLabel: ({ focused }) => (
            <Animated.Text
              style={{
                color: focused ? "#FF4B8C" : "#8e8e8e",
                fontSize: 12,
                fontWeight: focused ? "600" : "400",
                opacity: focused ? 1 : 0.8,
              }}
            >
              Community
            </Animated.Text>
          ),
          tabBarIcon: ({ color, size, focused }) => (
            <Animated.View
              style={{
                transform: [{ scale: focused ? 1 : 1 }],
                backgroundColor: focused
                  ? "rgba(255, 75, 140, 0.1)"
                  : "transparent",
                padding: 5,
                borderRadius: 15,
                width: 40,
                height: 40,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons
                name={focused ? "people" : "people-outline"}
                size={size}
                color={color}
                style={{ transform: [{ translateY: focused ? -2 : 0 }] }}
              />
            </Animated.View>
          ),
        }}
      />

      {/** 5) Profile Tab */}
      <Tab.Screen
        name="Profile"
        component={ProfileStack}
        options={{
          tabBarLabel: ({ focused }) => (
            <Animated.Text
              style={{
                color: focused ? "#FF4B8C" : "#8e8e8e",
                fontSize: 12,
                fontWeight: focused ? "600" : "400",
                opacity: focused ? 1 : 0.8,
              }}
            >
              Profile
            </Animated.Text>
          ),
          tabBarIcon: ({ color, size, focused }) => (
            <Animated.View
              style={{
                transform: [{ scale: focused ? 1 : 1 }],
                backgroundColor: focused
                  ? "rgba(255, 75, 140, 0.1)"
                  : "transparent",
                padding: 5,
                borderRadius: 15,
                width: 40,
                height: 40,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons
                name={focused ? "person" : "person-outline"}
                size={size}
                color={color}
                style={{ transform: [{ translateY: focused ? -2 : 0 }] }}
              />
            </Animated.View>
          ),
        }}
      />
    </Tab.Navigator>
  );
}

/** ========== 4) Root Stack with Splash as initial route ========== **/
export default function Routes() {
  return (
    <Stack.Navigator
      initialRouteName="Splash"
      screenOptions={{ headerShown: false }}
    >
      {/* Splash as first */}
      <Stack.Screen name="Splash" component={SplashScreen} />

      {/* Login screen */}
      <Stack.Screen name="Login" component={LoginScreen} />

      {/* SignUp screen */}
      <Stack.Screen name="SignUpScreen" component={SignUpScreen} />

      {/* CreatePin screen */}
      <Stack.Screen name="CreatePinScreen" component={CreatePinScreen} />

      {/* TellUsAboutYourself screen */}
      <Stack.Screen name="TellUsAboutYourselfScreen" component={TellUsAboutYourselfScreen} />

      {/* OTPVerification screen */}
      <Stack.Screen name="OTPVerificationScreen" component={OTPVerificationScreen} />

      {/* Then main tabs */}
      <Stack.Screen name="MainTabs" component={MainTabs} />
    </Stack.Navigator>
  );
}

/** ========== STYLES FOR CUSTOM TAB BAR ========== **/
const styles = StyleSheet.create({
  tabBarContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 60,
    // White background for the tab bar
    backgroundColor: "#fff",
    // Minimal shadow/elevation so it looks like a standard bottom bar
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: -2 },
    shadowRadius: 4,
    elevation: 4,
  },
  tabBarBackground: {
    flex: 1,
    backgroundColor: "transparent",
  },
});
