// Routes.js
import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createStackNavigator } from "@react-navigation/stack";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import Animated from "react-native-reanimated";
import KeyboardAwareWrapper from "./components/KeyboardAwareWrapper";
import HomeScreen from "./screens/HomeScreen";
import ProfileScreen from "./screens/ProfileScreen";
import EditProfileScreen from "./screens/EditProfileScreen";
import SettingScreen from "./screens/SettingScreen";
import CommunityScreen from "./screens/CommunityScreen";
import FrostedTabBar from "./components/FrostedTabBar"; // <-- Our new custom bar

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Wrapper function to add KeyboardAwareWrapper to screens
const withKeyboardAwareWrapper = (Component) => (props) => (
  <KeyboardAwareWrapper>
    <Component {...props} />
  </KeyboardAwareWrapper>
);

// HomeStack
const HomeStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="HomeMain" component={withKeyboardAwareWrapper(HomeScreen)} />
  </Stack.Navigator>
);

// ProfileStack
const ProfileStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="ProfileMain" component={withKeyboardAwareWrapper(ProfileScreen)} />
    <Stack.Screen name="EditProfile" component={withKeyboardAwareWrapper(EditProfileScreen)} />
  </Stack.Navigator>
);

export default function Routes() {
  return (
    <Tab.Navigator
      // Use our custom frosted tab bar
      tabBar={(props) => <FrostedTabBar {...props} />}
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: "#FF4B8C",
        tabBarInactiveTintColor: "#8e8e8e",
        tabBarShowLabel: true,
        tabBarLabelStyle: {
          fontSize: 12,
          marginTop: 2,   // reduce the gap between icons & labels
          fontWeight: "500",
        },
        tabBarItemStyle: {
          padding: 0,    // reduce padding so icons & labels are closer
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
                backgroundColor: focused ? "rgba(255, 75, 140, 0.1)" : "transparent",
                padding: 5, // smaller padding around icon
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
                style={{
                  transform: [{ translateY: focused ? -2 : 0 }],
                }}
              />
            </Animated.View>
          );
        },
      })}
    >
      {/* 1) Home */}
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

      {/* 2) Navigation */}
      <Tab.Screen
        name="Navigation"
        component={HomeStack}
        options={{
          tabBarLabel: () => null,
        }}
      />

      {/* 3) SOS */}
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

      {/* 4) Community */}
      <Tab.Screen
        name="Community"
        component={withKeyboardAwareWrapper(CommunityScreen)}
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

      {/* 5) Profile */}
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
