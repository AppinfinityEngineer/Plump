import { useEffect, useRef } from 'react';
import { Animated, FlatList, Pressable, StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Screen, AppText, Button } from '@/src/components/ui';
import { useApp, useTheme } from '@/src/state/AppProvider';
import { CHALLENGE_TEMPLATES, type ChallengeType } from '@/src/models/challenge';
import { computeProgress, slotAmount } from '@/src/services/challengeEngine';
import { formatGBP, formatPercent } from '@/src/utils/format';
import { spacing, fontSize, radius, fonts } from '@/src/theme/theme';
import { haptics } from '@/src/haptics/haptics';

const NUM_COLUMNS = 5;

function fallbackSlots(type: ChallengeType): number[] {
  if (type === 'envelope_100') return Array.from({ length: 100 }, (_, i) => i + 1);
  if (type === 'week_52') return Array.from({ length: 52 }, (_, i) => i + 1);
  return [];
}

export default function Envelopes() {
  const router = useRouter();
  const { colors } = useTheme();
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const goalId = Array.isArray(params.id) ? params.id[0] : params.id;
  const { goals, getDeposits } = useApp();
  const goal = goals.find((g) => g.id === goalId);

  if (!goal) {
    return (
      <Screen style={styles.center} testID="envelopes-goal-not-found">
        <AppText variant="heading" style={{ textAlign: 'center' }}>Goal not found</AppText>
        <AppText variant="body" color={colors.muted} style={{ textAlign: 'center', marginTop: spacing.sm }}>
          We could not find this savings challenge. Head back and try again.
        </AppText>
        <Button label="Back to goals" variant="secondary" style={{ marginTop: spacing.xl }} onPress={() => router.replace('/(tabs)/goals')} />
      </Screen>
    );
  }

  const deposits = getDeposits(goal.id);
  const progress = computeProgress(goal, deposits);
  const template = CHALLENGE_TEMPLATES[goal.challengeType];
  const configuredSlots = template.slots ?? [];
  const slots = configuredSlots.length > 0 ? configuredSlots : fallbackSlots(goal.challengeType);
  const filledSet = new Set(progress.filledSlots);

  const onTap = (slot: number, filled: boolean) => {
    if (filled) {
      void haptics.light();
      return;
    }
    void haptics.selection();
    router.push(`/goal/${goal.id}/save?slot=${slot}`);
  };

  return (
    <Screen edges={['top']} testID="envelopes-screen">
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} testID="envelopes-back-button" hitSlop={12}>
          <Ionicons name="chevron-back" size={26} color={colors.onSurface} />
        </Pressable>
        <View style={styles.titleWrap}>
          <AppText variant="heading" style={{ textAlign: 'center' }}>
            {slots.length > 0 ? `${slots.length} envelopes` : template.shortName}
          </AppText>
          <AppText variant="caption" style={{ textAlign: 'center' }}>
            {goal.name}
          </AppText>
        </View>
        <View style={{ width: 26 }} />
      </View>

      <View style={[styles.summaryCard, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
        <View style={{ flex: 1 }}>
          <AppText variant="caption">ENVELOPE PROGRESS</AppText>
          <AppText variant="bodyBold" style={{ marginTop: 2 }}>
            {progress.filledCount} filled · {Math.max(0, slots.length - progress.filledCount)} remaining
          </AppText>
          <AppText variant="caption" style={{ marginTop: 2 }}>
            {formatGBP(progress.saved)} saved · {formatPercent(progress.percent)} complete
          </AppText>
        </View>
        {progress.nextSuggestedSlot ? (
          <Pressable
            testID="next-envelope-shortcut"
            onPress={() => onTap(progress.nextSuggestedSlot, false)}
            style={[styles.nextPill, { backgroundColor: colors.brandPrimary }]}
          >
            <AppText variant="caption" color={colors.onBrandPrimary}>Next</AppText>
            <AppText style={{ fontFamily: fonts.bodyBlack, fontSize: fontSize.base }} color={colors.onBrandPrimary}>
              £{progress.nextSuggestedSlot}
            </AppText>
          </Pressable>
        ) : null}
      </View>

      {slots.length === 0 ? (
        <View style={styles.center}>
          <AppText variant="body" color={colors.muted} style={{ textAlign: 'center', marginBottom: spacing.xl }}>
            This challenge saves a little each day rather than using envelopes. Log today's save to plump up your mascot.
          </AppText>
          <Button
            label="Log a save"
            testID="envelopes-log-save-button"
            style={{ alignSelf: 'stretch' }}
            onPress={() => router.push(`/goal/${goal.id}/save`)}
          />
        </View>
      ) : (
        <FlatList
          data={slots}
          keyExtractor={(slot) => String(slot)}
          numColumns={NUM_COLUMNS}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.grid}
          renderItem={({ item, index }) => (
            <EnvelopeTile
              slot={item}
              index={index}
              filled={filledSet.has(item)}
              suggested={progress.nextSuggestedSlot === item}
              amount={slotAmount(goal.challengeType, item)}
              onPress={() => onTap(item, filledSet.has(item))}
            />
          )}
        />
      )}
    </Screen>
  );
}

function EnvelopeTile({
  slot,
  index,
  filled,
  suggested,
  amount,
  onPress,
}: {
  slot: number;
  index: number;
  filled: boolean;
  suggested: boolean;
  amount: number;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  const fade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fade, {
      toValue: 1,
      duration: 260,
      delay: Math.min(index * 8, 420),
      useNativeDriver: true,
    }).start();
  }, [fade, index]);

  const translateY = fade.interpolate({ inputRange: [0, 1], outputRange: [8, 0] });

  return (
    <Animated.View style={[styles.tileWrap, { opacity: fade, transform: [{ translateY }] }]}>
      <Pressable
        testID={`envelope-${slot}`}
        accessibilityRole="button"
        accessibilityLabel={filled ? `Envelope ${slot} filled` : `Fill envelope ${slot} for ${formatGBP(amount)}`}
        onPress={onPress}
        style={({ pressed }) => [
          styles.env,
          {
            backgroundColor: filled ? colors.brandPrimary : suggested ? colors.surfaceTertiary : colors.surfaceSecondary,
            borderColor: filled || suggested ? colors.brandPrimary : colors.border,
            borderWidth: suggested ? 2 : 1.5,
            transform: [{ scale: pressed && !filled ? 0.96 : 1 }],
          },
        ]}
      >
        <View style={styles.envelopeLip} />
        <AppText
          style={{ fontFamily: fonts.bodyBlack, fontSize: fontSize.lg }}
          color={filled ? colors.onBrandPrimary : colors.onSurface}
        >
          {slot}
        </AppText>
        {filled ? (
          <Ionicons name="checkmark-circle" size={16} color={colors.onBrandPrimary} />
        ) : (
          <AppText variant="caption" style={{ fontSize: 10 }} color={suggested ? colors.brandPrimary : colors.muted}>
            {formatGBP(amount)}
          </AppText>
        )}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
  titleWrap: { flex: 1, paddingHorizontal: spacing.sm },
  summaryCard: {
    marginHorizontal: spacing.xl,
    marginBottom: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  nextPill: {
    minWidth: 58,
    height: 58,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  grid: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  tileWrap: {
    flex: 1,
    margin: spacing.xs,
    maxWidth: `${100 / NUM_COLUMNS}%`,
  },
  env: {
    minHeight: 72,
    aspectRatio: 0.9,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    gap: 1,
  },
  envelopeLip: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 12,
    opacity: 0.18,
    backgroundColor: '#5A4632',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
});
