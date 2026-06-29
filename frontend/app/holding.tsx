import { useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';

import { Screen, AppText, Button } from '@/src/components/ui';
import { PlumpCard } from '@/src/components/PlumpCard';
import { useApp } from '@/src/state/AppProvider';
import { CHALLENGE_TEMPLATES } from '@/src/models/challenge';
import type { MascotVariant } from '@/src/components/Mascot';
import type { CardPaletteId } from '@/src/theme/theme';
import { spacing, fontSize } from '@/src/theme/theme';
import { track } from '@/src/services/telemetryService';

export default function Holding() {
  const router = useRouter();
  const { colors, activeGoal, draft, getDeposits } = useApp();

  useEffect(() => {
    track('holding_state_shown');
  }, []);

  const goalName = activeGoal?.name ?? draft.goalName ?? 'My savings goal';
  const challengeType = activeGoal?.challengeType ?? (draft.challengeType as 'envelope_100') ?? 'envelope_100';
  const template = CHALLENGE_TEMPLATES[challengeType];
  const target = activeGoal?.targetAmount ?? draft.targetAmount ?? template.totalTarget;
  const variant = (activeGoal?.mascotVariant as MascotVariant) ?? (draft.mascotVariant as MascotVariant) ?? 'honey';
  const palette = (activeGoal?.colorTheme as CardPaletteId) ?? (draft.cardPalette as CardPaletteId) ?? 'cream';
  const saved = activeGoal ? getDeposits(activeGoal.id).reduce((s, d) => s + d.amount, 0) : 0;

  return (
    <Screen style={styles.container} testID="holding-state">
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <AppText variant="title" style={styles.title}>
          Your card is waiting.
        </AppText>
        <AppText variant="body" color={colors.muted} style={styles.sub}>
          Subscribe to start filling it.
        </AppText>

        <View style={{ marginVertical: spacing.lg }}>
          <PlumpCard
            goalName={goalName}
            challengeName={template.shortName}
            saved={saved}
            target={target}
            percent={target > 0 ? saved / target : 0}
            mascotVariant={variant}
            palette={palette}
            subline="Locked"
            width={320}
          />
        </View>
      </ScrollView>

      <Button label="Unlock Plump" testID="holding-unlock-button" onPress={() => router.push('/paywall')} />
      <View style={{ height: spacing.sm }} />
      <Button
        label="Edit my card"
        variant="secondary"
        testID="holding-edit-button"
        onPress={() => router.replace('/onboarding/challenge')}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: spacing.xl, paddingTop: spacing.lg, paddingBottom: spacing.xl },
  scroll: { flexGrow: 1, alignItems: 'center', justifyContent: 'center' },
  title: { textAlign: 'center', fontSize: fontSize['2xl'] },
  sub: { textAlign: 'center' },
});
