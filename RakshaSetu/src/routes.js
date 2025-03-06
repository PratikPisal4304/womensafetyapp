import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Animated } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createStackNavigator } from "@react-navigation/stack";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { getFocusedRouteNameFromRoute } from "@react-navigation/native";

import KeyboardAwareWrapper from "./components/KeyboardAwareWrapper";

import SplashScreen from "./screens/SplashScreen";
import LoginScreen from "./screens/LoginScreen";
import OTPVerificationScreen from "./screens/OTPVerificationScreen";
import SignUpScreen from "./screens/SignUpScreen";
import CreatePinScreen from "./screens/CreatePinScreen";
import TellUsAboutYourselfScreen from "./screens/TellUsAboutYourselfScreen";
import HomeScreen from "./screens/HomeScreen";
import FakeCallScreen from "./screens/FakeCallScreen";
import AddFriendsScreen from "./screens/AddCloseFriendsScreen";
import SkillDevelopmentScreen from "./screens/SkillDevelopmentScreen";
import TrackMeScreen from "./screens/TrackMeScreen";
import SOSScreen from "./screens/SOSScreen";
import ProfileScreen from "./screens/ProfileScreen";
import EditProfileScreen from "./screens/EditProfileScreen";
import MyPostsScreen from "./screens/MyPostsScreen";
import EmergencyHelplineScreen from "./screens/EmergencyHelplineScreen";
import CommunityScreen from "./screens/CommunityScreen";
import InAppChatScreen from "./screens/InAppChatScreen";
import GeminiChatScreen from "./screens/GeminiChatScreen";
import BudgetToolScreen from "./screens/BudgetToolScreen";
import FinancialNews from "./screens/FinancialNews";

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

const withKeyboardAwareWrapper = (Component) => (props) => (
  <KeyboardAwareWrapper>
    <Component {...props} />
  </KeyboardAwareWrapper>
);

/** ========== Home Stack ========== **/
function HomeStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="HomeMain" component={HomeScreen} />
      <Stack.Screen name="FakeCall" component={FakeCallScreen} />
      <Stack.Screen name="AddFriends" component={AddFriendsScreen} />
      <Stack.Screen name="SkillDevelopment" component={SkillDevelopmentScreen} />
      <Stack.Screen name="BudgetTool" component={BudgetToolScreen} />
      <Stack.Screen name="FinancialNews" component={FinancialNews} />
    </Stack.Navigator>
  );
}


/** ========== Profile Stack ========== **/
function ProfileStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ProfileMain" component={(ProfileScreen)} />
      <Stack.Screen name="EditProfile" component={(EditProfileScreen)} />
      <Stack.Screen name="MyPosts" component={(MyPostsScreen)} />
      <Stack.Screen name="EmergencyHelpline" component={(EmergencyHelplineScreen)} />
    </Stack.Navigator>
  );
}

function CommunityStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="CommunityMain" component={CommunityScreen} />
      <Stack.Screen name="GeminiChat" component={GeminiChatScreen} />
      <Stack.Screen name="InAppChat" component={InAppChatScreen} />
    </Stack.Navigator>
  );
}

/** ========== Example Floating Tab Bar ========== **/
function FloatingTabBar({ state, descriptors, navigation }) {
  // Decide if we hide the bar, e.g. on FakeCall or EditProfile
  const currentRouteName = state.routes[state.index].name;
  let hideTabBar = false;

  // Example: If inside HomeStack => FakeCall
  if (currentRouteName === "Home") {
    const childRoute = getFocusedRouteNameFromRoute(state.routes[state.index]) ?? "HomeMain";
    if (childRoute === "FakeCall" || childRoute === "AddFriends") {
      hideTabBar = true;
    }
  }
  // Example: If inside ProfileStack => EditProfile or EmergencyHelpline
  else if (currentRouteName === "Profile") {
    const childRoute = getFocusedRouteNameFromRoute(state.routes[state.index]) ?? "ProfileMain";
    if (childRoute === "EditProfile" || childRoute === "EmergencyHelpline" || childRoute === "MyPosts") {
      hideTabBar = true;
    }
  }
  else if (currentRouteName === "Community") {
    const childRoute = getFocusedRouteNameFromRoute(state.routes[state.index]) ?? "CommunityMain";
    if (childRoute === "GeminiChat" || childRoute === "InAppChat") {
      hideTabBar = true;
    }
  }
  if (hideTabBar) {
    return null;
  }

  return (
    <View style={styles.floatingContainer}>
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const isFocused = state.index === index;
        const label = options.title !== undefined ? options.title : route.name;

        let iconName = "";
        let IconComponent = Ionicons;

        if (route.name === "Home") {
          iconName = isFocused ? "home" : "home-outline";
        } else if (route.name === "Navigation") {
          IconComponent = MaterialCommunityIcons;
          iconName = "navigation-variant-outline";
        } else if (route.name === "SOS") {
          iconName = "alert-circle-outline";
        } else if (route.name === "Community") {
          iconName = isFocused ? "people" : "people-outline";
        } else if (route.name === "Profile") {
          iconName = isFocused ? "person" : "person-outline";
        }

        const onPress = () => {
          const event = navigation.emit({
            type: "tabPress",
            target: route.key,
            canPreventDefault: true,
          });
          if (!event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        return (
          <TouchableOpacity
            key={route.name}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={options.tabBarAccessibilityLabel}
            testID={options.tabBarTestID}
            onPress={onPress}
            style={styles.tabItem}
          >
            <Animated.View
              style={[
                styles.iconContainer,
                isFocused && styles.iconFocused,
              ]}
            >
              <IconComponent
                name={iconName}
                size={24}
                color={isFocused ? "#FF4B8C" : "#8e8e8e"}
                style={{ transform: [{ translateY: isFocused ? -2 : 0 }] }}
              />
            </Animated.View>
            <Text
              style={[
                styles.tabLabel,
                { color: isFocused ? "#FF4B8C" : "#8e8e8e" },
              ]}
            >
              {label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

/** ========== Main Tabs ========== **/
function MainTabs() {
  return (
    <Tab.Navigator
      // Our custom floating tab bar
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen name="Home" component={HomeStack} />
      <Tab.Screen name="Navigation" component={TrackMeScreen} options={{ title: "Track Me" }} />
      <Tab.Screen name="SOS" component={SOSScreen} />
      <Tab.Screen name="Community" component={CommunityStack} />
      <Tab.Screen name="Profile" component={ProfileStack} />
    </Tab.Navigator>
  );
}

/** ========== Root Stack ========== **/
export default function Routes() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName="Splash">
      <Stack.Screen name="Splash" component={SplashScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="SignUpScreen" component={SignUpScreen} />
      <Stack.Screen name="CreatePinScreen" component={CreatePinScreen} />
      <Stack.Screen name="TellUsAboutYourselfScreen" component={TellUsAboutYourselfScreen} />
      <Stack.Screen name="OTPVerificationScreen" component={OTPVerificationScreen} />
      <Stack.Screen name="MainTabs" component={MainTabs} />
    </Stack.Navigator>
  );
}

/** ========== STYLES ========== **/
const styles = StyleSheet.create({
  floatingContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    height: 60,
    backgroundColor: "#fff",
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    // shadow for iOS
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: -2 },
    shadowRadius: 6,
    // elevation for Android
    elevation: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  iconFocused: {
    backgroundColor: "rgba(255, 75, 140, 0.1)",
  },
  tabLabel: {
    fontSize: 11,
    marginTop: 2,
  },
});
