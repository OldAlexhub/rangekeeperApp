import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';

import { DashboardScreen } from '../screens/DashboardScreen';
import { HistoryScreen } from '../screens/HistoryScreen';
import { ForecastScreen } from '../screens/ForecastScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { VehiclesScreen } from '../screens/VehiclesScreen';
import { ReportsScreen } from '../screens/ReportsScreen';
import { VehicleFormScreen } from '../screens/VehicleFormScreen';
import { EntryFormScreen } from '../screens/EntryFormScreen';
import { EntryDetailScreen } from '../screens/EntryDetailScreen';

import { Colors } from '../theme/colors';
import { RootStackParamList, MainTabParamList } from '../types';

const Tab = createBottomTabNavigator<MainTabParamList>();
const Stack = createNativeStackNavigator<RootStackParamList>();

function TabIcon({ icon, focused }: { icon: string; focused: boolean }) {
  return (
    <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.5 }}>{icon}</Text>
  );
}

function TabLabel({ label, focused }: { label: string; focused: boolean }) {
  return (
    <Text
      style={{
        fontSize: 10,
        color: focused ? Colors.tabActive : Colors.tabInactive,
        fontWeight: focused ? '600' : '400',
        marginTop: 2,
      }}>
      {label}
    </Text>
  );
}

function MainTabs() {
  const insets = useSafeAreaInsets();
  const bottomInset = insets.bottom;

  return (
    <Tab.Navigator
      initialRouteName="Dashboard"
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors.tabBar,
          borderTopColor: Colors.tabBarBorder,
          borderTopWidth: 1,
          height: (Platform.OS === 'android' ? 60 : 80) + bottomInset,
          paddingBottom: (Platform.OS === 'android' ? 8 : 20) + bottomInset,
          paddingTop: 8,
        },
        tabBarShowLabel: true,
      }}>
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon icon="⚡" focused={focused} />,
          tabBarLabel: ({ focused }) => <TabLabel label="Dashboard" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="History"
        component={HistoryScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon icon="📋" focused={focused} />,
          tabBarLabel: ({ focused }) => <TabLabel label="History" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Forecast"
        component={ForecastScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon icon="📈" focused={focused} />,
          tabBarLabel: ({ focused }) => <TabLabel label="Forecast" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon icon="⚙️" focused={focused} />,
          tabBarLabel: ({ focused }) => <TabLabel label="Settings" focused={focused} />,
        }}
      />
    </Tab.Navigator>
  );
}

export function AppNavigator() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: Colors.background },
          }}>
          <Stack.Screen name="Main" component={MainTabs} />
          <Stack.Screen
            name="VehicleForm"
            component={VehicleFormScreen}
            options={{ presentation: 'modal' }}
          />
          <Stack.Screen
            name="EntryForm"
            component={EntryFormScreen}
            options={{ presentation: 'modal' }}
          />
          <Stack.Screen
            name="EntryDetail"
            component={EntryDetailScreen}
          />
          <Stack.Screen
            name="Vehicles"
            component={VehiclesScreen}
          />
          <Stack.Screen
            name="Reports"
            component={ReportsScreen}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
