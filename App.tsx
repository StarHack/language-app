import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import Courses from './src/screens/Courses';
import Repeat from './src/screens/Repeat';
import Settings from './src/screens/Settings';
import TextView from './src/components/TextView';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function Tabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#1E90FF',
        tabBarInactiveTintColor: '#999',
        tabBarIcon: ({ color, size, focused }) => {
          let name: any = 'ellipse';
          if (route.name === 'Courses') name = focused ? 'book' : 'book-outline';
          else if (route.name === 'Repeat') name = focused ? 'repeat' : 'repeat-outline';
          else if (route.name === 'Settings') name = focused ? 'settings' : 'settings-outline';
          return <Ionicons name={name} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Courses" component={Courses} options={{ headerShown: true, title: 'Courses', tabBarLabel: 'Courses' }} />
      <Tab.Screen name="Repeat" component={Repeat} options={{ headerShown: true, title: 'Repeat', tabBarLabel: 'Repeat' }} />
      <Tab.Screen name="Settings" component={Settings} options={{ headerShown: true, title: 'Settings', tabBarLabel: 'Settings' }} />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="Root" component={Tabs} options={{ headerShown: false }} />
        <Stack.Screen name="TextView" component={TextView} options={{ title: 'Text' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
