import { Redirect } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';

import { useApp } from '@/src/state/AppProvider';
import { Mascot } from '@/src/components/Mascot';
import { lightColors } from '@/src/theme/theme';

export default function Index() {
  const { ready, settings, isPro } = useApp();

  if (!ready) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: lightColors.surface }}>
        <Mascot variant="honey" plumpness={0.5} size={140} />
        <ActivityIndicator color={lightColors.brandPrimary} style={{ marginTop: 16 }} />
      </View>
    );
  }

  if (!settings.onboardingComplete) return <Redirect href="/onboarding" />;
  if (isPro) return <Redirect href="/(tabs)" />;
  return <Redirect href="/holding" />;
}
