import { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';

import LoginScreen from './src/screens/Login';
import HomeScreen from './src/screens/Home';
import ReportScreen from './src/screens/Report';
import ProfileScreen from './src/screens/Profile';
import { colors } from './src/theme';

const Stack = createNativeStackNavigator();

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const stored = await AsyncStorage.getItem('drishti_user');
      if (stored) setUser(JSON.parse(stored));
      setLoading(false);
    })();
  }, []);

  if (loading) return null;

  return (
    <NavigationContainer>
      <StatusBar style="light" />
      <Stack.Navigator screenOptions={{
        headerStyle: { backgroundColor: colors.card },
        headerTintColor: colors.text,
        contentStyle: { backgroundColor: colors.bg }
      }}>
        {!user ? (
          <Stack.Screen name="Login" options={{ headerShown: false }}>
            {p => <LoginScreen {...p} onLogin={setUser} />}
          </Stack.Screen>
        ) : (
          <>
            <Stack.Screen name="Home" options={{ title: 'DRISHTI · Live Map' }}>
              {p => <HomeScreen {...p} user={user} />}
            </Stack.Screen>
            <Stack.Screen name="Report" component={ReportScreen} options={{ title: 'Report Hazard' }} />
            <Stack.Screen name="Profile">
              {p => <ProfileScreen {...p} user={user} onLogout={async () => { await AsyncStorage.clear(); setUser(null); }} />}
            </Stack.Screen>
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
