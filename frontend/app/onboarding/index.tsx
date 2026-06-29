import { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';

import { Screen, AppText, Button, OnboardingHeader } from '@/src/components/ui';
import { Mascot } from '@/src/components/Mascot';
import { useTheme } from '@/src/state/AppProvider';
import { spacing } from '@/src/theme/theme';
import { track } from '@/src/services/telemetryService';

export default function OnboardingIntro() {
  const router = useRouter();
  const { colors } = useTheme();

  useEffect(() => {
    track('onboarding_start');
  }, []);

  return (
    <Screen style={styles.container} testID="onboarding-intro">
      <OnboardingHeader step={0} total={10} showBack={false} />
      <View style={styles.body}>
        <AppText variant="title" style={styles.headline} color={colors.brandPrimary}>
          Save money.{'\n'}Make it cute.
        </AppText>
        <View style={styles.mascot}>
          <Mascot variant="honey" plumpness={0.45} size={220} />
        </View>
        <AppText variant="body" style={styles.sub} color={colors.muted}>
          Build your savings identity, design your card, then unlock the satisfying daily save loop.
        </AppText>
      </View>
      <Button
        label="Start my setup"
        testID="onboarding-start-button"
        onPress={() => router.push('/onboarding/personality' as never)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: spacing.xl, paddingTop: spacing.lg, paddingBottom: spacing.xl },
  body: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  headline: { textAlign: 'center', lineHeight: 44 },
  mascot: { marginVertical: spacing.xl },
  sub: { textAlign: 'center', paddingHorizontal: spacing.lg, lineHeight: 24 },
});
