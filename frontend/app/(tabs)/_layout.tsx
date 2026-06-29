import { Tabs } from 'expo-router';
import { Redirect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Platform } from 'react-native';

import { useApp } from '@/src/state/AppProvider';
import { fonts } from '@/src/theme/theme';

export default function TabsLayout() {
  const { ready, isPro, colors } = useApp();
  if (!ready) return null;
  // Tabs are Pro-only. Non-entitled users are sent to the holding state.
  if (!isPro) return <Redirect href="/holding" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.brandPrimary,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: {
          backgroundColor: colors.surfaceSecondary,
          borderTopColor: colors.border,
          height: Platform.OS === 'ios' ? 88 : 64,
          paddingTop: 6,
        },
        tabBarLabelStyle: { fontFamily: fonts.bodySemi, fontSize: 11 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => <Ionicons name="home" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="goals"
        options={{
          title: 'Goals',
          tabBarIcon: ({ color, size }) => <Ionicons name="albums" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="card"
        options={{
          title: 'Card',
          tabBarIcon: ({ color, size }) => <Ionicons name="share-social" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'You',
          tabBarIcon: ({ color, size }) => <Ionicons name="person" size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
