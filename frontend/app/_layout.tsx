import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { LogBox } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import { StatusBar } from 'expo-status-bar';

import { useIconFonts } from '@/src/hooks/use-icon-fonts';
import { AppProvider, useApp } from '@/src/state/AppProvider';

LogBox.ignoreAllLogs(true);

// Keep the native splash visible from cold start until icon fonts register.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [iconsLoaded, iconsError] = useIconFonts();
  const [brandLoaded, brandError] = useFonts({
    Fredoka: require('../assets/fonts/Fredoka-Regular.ttf'),
    'Fredoka-SemiBold': require('../assets/fonts/Fredoka-SemiBold.ttf'),
    'Fredoka-Bold': require('../assets/fonts/Fredoka-Bold.ttf'),
    Nunito: require('../assets/fonts/Nunito-Regular.ttf'),
    'Nunito-SemiBold': require('../assets/fonts/Nunito-SemiBold.ttf'),
    'Nunito-Bold': require('../assets/fonts/Nunito-Bold.ttf'),
    'Nunito-ExtraBold': require('../assets/fonts/Nunito-ExtraBold.ttf'),
  });

  const iconsReady = iconsLoaded || iconsError;
  const brandReady = brandLoaded || brandError;

  useEffect(() => {
    if (iconsReady && brandReady) SplashScreen.hideAsync();
  }, [iconsReady, brandReady]);

  if (!iconsReady || !brandReady) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AppProvider>
          <AppShell />
        </AppProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

function AppShell() {
  const { isDark, colors } = useApp();

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} backgroundColor={colors.surface} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.surface } }}>
        <Stack.Screen name="paywall" options={{ presentation: 'modal' }} />
      </Stack>
    </>
  );
}
