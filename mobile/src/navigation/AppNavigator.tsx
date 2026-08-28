import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';

// Screens
import { AuthScreen } from '../screens/AuthScreen';
import { OtpScreen } from '../screens/OtpScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { TextScanScreen } from '../screens/TextScanScreen';
import { ImageScanScreen } from '../screens/ImageScanScreen';
import { ResultScreen } from '../screens/ResultScreen';
import { HistoryScreen } from '../screens/HistoryScreen';
import { ProfileScreen } from '../screens/ProfileScreen';

const RootStack = createNativeStackNavigator();
const AuthStack = createNativeStackNavigator();
const HomeStack = createNativeStackNavigator();
const HistoryStack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Auth Flow Navigator
function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false, animation: 'fade' }}>
      <AuthStack.Screen name="AuthScreen" component={AuthScreen} />
      <AuthStack.Screen name="OtpScreen" component={OtpScreen} />
    </AuthStack.Navigator>
  );
}

// Home Stack Navigator (with Scan & Result screens)
function HomeStackNavigator() {
  return (
    <HomeStack.Navigator screenOptions={{ headerShown: false }}>
      <HomeStack.Screen name="HomeScreen" component={HomeScreen} />
      <HomeStack.Screen name="TextScan" component={TextScanScreen} />
      <HomeStack.Screen name="ImageScan" component={ImageScanScreen} />
      <HomeStack.Screen name="Result" component={ResultScreen} />
    </HomeStack.Navigator>
  );
}

// History Stack Navigator
function HistoryStackNavigator() {
  return (
    <HistoryStack.Navigator screenOptions={{ headerShown: false }}>
      <HistoryStack.Screen name="HistoryScreen" component={HistoryScreen} />
      <HistoryStack.Screen name="Result" component={ResultScreen} />
    </HistoryStack.Navigator>
  );
}

// Authenticated Bottom Tabs Navigator
function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#090D16',
          borderTopColor: 'rgba(255, 255, 255, 0.08)',
          borderTopWidth: 1,
          height: 62,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarActiveTintColor: '#06b6d4',
        tabBarInactiveTintColor: '#64748b',
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '700',
        },
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: any = 'home';

          if (route.name === 'HomeTab') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'TextTab') {
            iconName = focused ? 'document-text' : 'document-text-outline';
          } else if (route.name === 'ImageTab') {
            iconName = focused ? 'image' : 'image-outline';
          } else if (route.name === 'HistoryTab') {
            iconName = focused ? 'time' : 'time-outline';
          } else if (route.name === 'ProfileTab') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Ionicons name={iconName} size={20} color={color} />;
        },
      })}
    >
      <Tab.Screen name="HomeTab" component={HomeStackNavigator} options={{ title: 'Home' }} />
      <Tab.Screen name="TextTab" component={TextScanScreen} options={{ title: 'Text' }} />
      <Tab.Screen name="ImageTab" component={ImageScanScreen} options={{ title: 'Image' }} />
      <Tab.Screen name="HistoryTab" component={HistoryStackNavigator} options={{ title: 'History' }} />
      <Tab.Screen name="ProfileTab" component={ProfileScreen} options={{ title: 'Profile' }} />
    </Tab.Navigator>
  );
}

export const AppNavigator: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#090D16', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color="#06b6d4" size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <RootStack.Screen name="Main" component={MainTabNavigator} />
        ) : (
          <RootStack.Screen name="Auth" component={AuthNavigator} />
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
};
