// Routes.js
import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createStackNavigator } from "@react-navigation/stack";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import Animated from "react-native-reanimated";
import KeyboardAwareWrapper from "./components/KeyboardAwareWrapper";

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
import FrostedTabBar from "./components/FrostedTabBar"; // Our custom bar

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Wrap screens in KeyboardAwareWrapper if needed
const withKeyboardAwareWrapper = (Component) => (props) => (
  <KeyboardAwareWrapper>
    <Component {...props} />
  </KeyboardAwareWrapper>
);

// 1) HomeStack
const HomeStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen
      name="HomeMain"
      component={(HomeScreen)}
    />
    <Stack.Screen
      name="FakeCall"
      component={(FakeCallScreen)}
    />
  </Stack.Navigator>
);

// 2) ProfileStack
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

// 3) Define the Tab Navigator as MainTabs
function MainTabs() {
  return (
    <Tab.Navigator
      tabBar={(props) => <FrostedTabBar {...props} />} // custom bar
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: "#FF4B8C",
        tabBarInactiveTintColor: "#8e8e8e",
        tabBarShowLabel: true,
        tabBarLabelStyle: {
          fontSize: 12,
          marginTop: 2,
          fontWeight: "500",
        },
        tabBarItemStyle: {
          padding: 0,
        },
        tabBarIcon: ({ color, size, focused }) => {
          let iconName;
          let IconComponent = Ionicons;

          if (route.name === "Home") {
            iconName = focused ? "home" : "home-outline";
          } else if (route.name === "Navigation") {
            IconComponent = MaterialCommunityIcons;
            iconName = "navigation-variant-outline";
          } else if (route.name === "SOS") {
            iconName = "alert-circle-outline";
          } else if (route.name === "Community") {
            iconName = focused ? "people" : "people-outline";
          } else if (route.name === "Profile") {
            iconName = focused ? "person" : "person-outline";
          }

          return (
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
              <IconComponent
                name={iconName}
                size={size}
                color={color}
                style={{ transform: [{ translateY: focused ? -2 : 0 }] }}
              />
            </Animated.View>
          );
        },
      })}
    >
      {/* Tab 1) Home */}
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
        }}
      />

      {/* Tab 2) TrackMe */}
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
        }}
      />

      {/* Tab 3) SOS */}
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
        }}
      />

      {/* Tab 4) Community */}
      <Tab.Screen
        name="Community"
        component={(CommunityScreen)}
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
        }}
      />

      {/* Tab 5) Profile */}
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
        }}        
      />
    </Tab.Navigator>
  );
}

// 4) Root stack with Splash as initial route
export default function Routes() {
  return (
    <Stack.Navigator
      initialRouteName="Splash"
      screenOptions={{ headerShown: false }}
    >
      {/* Splash as first */}
      <Stack.Screen name="Splash" component={SplashScreen} />

      {/* Added Login screen */}
      <Stack.Screen name="Login" component={LoginScreen} />

      {/* Added SignUp screen */}
      <Stack.Screen name="SignUpScreen" component={SignUpScreen} />

      {/* Added CreatePin screen */}
      <Stack.Screen name="CreatePinScreen" component={CreatePinScreen} /> 

      {/* Added TellUsAboutYourself screen */}
      <Stack.Screen name="TellUsAboutYourselfScreen" component={TellUsAboutYourselfScreen} />

      {/* Added OTPVerification screen */}
      <Stack.Screen name="OTPVerificationScreen" component={OTPVerificationScreen} />

      {/* Then main tabs */}
      <Stack.Screen name="MainTabs" component={MainTabs} />
    </Stack.Navigator>
  );
}
