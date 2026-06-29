import { View, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Screen, AppText } from '@/src/components/ui';
import { useApp, useTheme } from '@/src/state/AppProvider';
import { CHALLENGE_TEMPLATES } from '@/src/models/challenge';
import { computeProgress, slotAmount } from '@/src/services/challengeEngine';
import { formatGBP } from '@/src/utils/format';
import { spacing, fontSize, radius, fonts } from '@/src/theme/theme';
import { haptics } from '@/src/haptics/haptics';

export default function Envelopes() {
  const router = useRouter();
  const { colors } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { goals, getDeposits } = useApp();
  const goal = goals.find((g) => g.id === id);

  if (!goal) return null;
  const deposits = getDeposits(goal.id);
  const progress = computeProgress(goal, deposits);
  const template = CHALLENGE_TEMPLATES[goal.challengeType];
  const slots = template.slots ?? [];

  const onTap = (slot: number, filled: boolean) => {
    if (filled) return;
    void haptics.light();
    router.push(`/goal/${goal.id}/save?slot=${slot}`);
  };

  return (
    <Screen edges={['top']} testID="envelopes-screen">
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} testID="envelopes-back-button" hitSlop={12}>
          <Ionicons name="chevron-back" size={26} color={colors.onSurface} />
        </Pressable>
        <AppText variant="heading">{slots.length} envelopes</AppText>
        <View style={{ width: 26 }} />
      </View>

      <View style={styles.summary}>
        <AppText variant="caption">
          {progress.filledCount} filled · {Math.max(0, slots.length - progress.filledCount)} remaining
        </AppText>
      </View>

      {slots.length === 0 ? (
        <View style={styles.center}>
          <AppText variant="body" color={colors.muted} style={{ textAlign: 'center' }}>
            This challenge saves a little each day. Tap Save on your goal to log today's amount.
          </AppText>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.grid} showsVerticalScrollIndicator={false}>
          {slots.map((slot) => {
            const filled = progress.filledSlots.includes(slot);
            return (
              <Pressable
                key={slot}
                testID={`envelope-${slot}`}
                onPress={() => onTap(slot, filled)}
                style={[
                  styles.env,
                  {
                    backgroundColor: filled ? colors.brandPrimary : colors.surfaceSecondary,
                    borderColor: filled ? colors.brandPrimary : colors.border,
                  },
                ]}
              >
                <AppText
                  style={{ fontFamily: fonts.bodyBold, fontSize: fontSize.base }}
                  color={filled ? colors.onBrandPrimary : colors.onSurface}
                >
                  {slot}
                </AppText>
                {filled ? (
                  <Ionicons name="checkmark" size={12} color={colors.onBrandPrimary} />
                ) : (
                  <AppText variant="caption" style={{ fontSize: 9 }}>{formatGBP(slotAmount(goal.challengeType, slot))}</AppText>
                )}
              </Pressable>
            );
          })}
        </ScrollView>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.xl, paddingTop: spacing.lg, paddingBottom: spacing.sm },
  summary: { paddingHorizontal: spacing.xl, paddingBottom: spacing.md },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, paddingHorizontal: spacing.xl, paddingBottom: spacing.xl, justifyContent: 'space-between' },
  env: { width: '17%', aspectRatio: 0.85, borderRadius: radius.sm, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', gap: 2 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.xl },
});
