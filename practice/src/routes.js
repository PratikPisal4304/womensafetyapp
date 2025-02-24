import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createStackNavigator } from "@react-navigation/stack";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import Animated from "react-native-reanimated";
import HomeScreen from "./screens/HomeScreen";
import ProfileScreen from "./screens/ProfileScreen";
import EditProfileScreen from "./screens/EditProfileScreen";
import SettingScreen from "./screens/SettingScreen";
// import LocationShareScreen from "./screens/LocationShareScreen";
// import FakeCallScreen from "./screens/FakeCallScreen";
// import StartJourneyScreen from "./screens/StartJourneyScreen";
// import EmergencyContactsScreen from "./screens/EmergencyContactsScreen";
// import NearbyPoliceScreen from "./screens/NearbyPoliceScreen";
// import NearbyHospitalScreen from "./screens/NearbyHospitalScreen";

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Stack Navigator for Home Section
const HomeStack = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="HomeMain" component={HomeScreen} />
      {/* <Stack.Screen name="LocationShare" component={LocationShareScreen} />
      <Stack.Screen name="FakeCall" component={FakeCallScreen} />
      <Stack.Screen name="StartJourney" component={StartJourneyScreen} />
      <Stack.Screen name="EmergencyContacts" component={EmergencyContactsScreen} />
      <Stack.Screen name="NearbyPolice" component={NearbyPoliceScreen} />
      <Stack.Screen name="NearbyHospital" component={NearbyHospitalScreen} /> */}
    </Stack.Navigator>
  );
};

// Stack Navigator for Profile Section
const ProfileStack = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen 
        name="ProfileMain" 
        component={ProfileScreen} 
        options={{ title: "Profile" }}
      />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} />
    </Stack.Navigator>
  );
};

// Main Tab Navigator
const Routes = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "rgba(253, 241, 252, 0.95)",
          borderTopWidth: 1,
          paddingVertical: 15,
          marginHorizontal: "5%",
          height: 65,
          position: "absolute",
          left: 20,
          right: 20,
          bottom: 20,
          borderRadius: 25,
          elevation: 25,
          shadowColor: "#000",
          shadowOpacity: 0.15,
          shadowOffset: { width: 0, height: 8 },
          shadowRadius: 25,
          borderWidth: 1,
          borderColor: "rgba(232, 108, 201, 0.57)",
        },
        tabBarActiveTintColor: "#FF4B8C",
        tabBarInactiveTintColor: "#8e8e8e",
        tabBarShowLabel: true,
        tabBarLabelStyle: {
          fontSize: 12,
          marginTop: 5,
          fontWeight: '500',
        },
        tabBarItemStyle: {
          padding: 2,
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
            iconName = "alert-circle-outline"; // You can pick any icon you like
          } else if (route.name === "Community") {
            iconName = focused ? "people" : "people-outline";
          } else if (route.name === "Profile") {
            iconName = focused ? "person" : "person-outline";
          }

          return (
            <Animated.View
              style={{
                transform: [{ scale: focused ? 1 : 1 }],
                backgroundColor: focused ? 'rgba(255, 75, 140, 0.1)' : 'transparent',
                padding: 8,
                borderRadius: 15,
                width: 40,
                height: 40,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <IconComponent
                name={iconName}
                size={size}
                color={color}
                style={{
                  transform: [{ translateY: focused ? -2 : 0 }]
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
                fontWeight: focused ? '600' : '400',
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

      {/** 
       * 3) SOS — inserted between Navigation & Community
       *    You can rename its icon, label, or target component as desired.
       */}
      <Tab.Screen
        name="SOS"
        component={HomeStack}
        options={{
          tabBarLabel: ({ focused }) => (
            <Animated.Text
              style={{
                color: focused ? "#FF4B8C" : "#8e8e8e",
                fontSize: 12,
                fontWeight: focused ? '600' : '400',
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
        component={HomeStack}
        options={{
          tabBarLabel: () => null,
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
                fontWeight: focused ? '600' : '400',
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
};

export default Routes;