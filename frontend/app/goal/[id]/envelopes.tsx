import { useEffect, useRef } from 'react';
import { Animated, FlatList, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Screen, AppText, Button } from '@/src/components/ui';
import { Mascot, type MascotVariant } from '@/src/components/Mascot';
import { useApp, useTheme } from '@/src/state/AppProvider';
import { CHALLENGE_TEMPLATES, type ChallengeType } from '@/src/models/challenge';
import type { Deposit } from '@/src/models/deposit';
import { computeProgress, slotAmount, type ChallengeProgress } from '@/src/services/challengeEngine';
import { formatDate, formatGBP, formatPercent } from '@/src/utils/format';
import { spacing, fontSize, radius, fonts } from '@/src/theme/theme';
import { haptics } from '@/src/haptics/haptics';

const NUM_COLUMNS = 5;

function fallbackSlots(type: ChallengeType): number[] {
  if (type === 'envelope_100') return Array.from({ length: 100 }, (_, i) => i + 1);
  if (type === 'week_52') return Array.from({ length: 52 }, (_, i) => i + 1);
  return [];
}

function pathNoun(type: ChallengeType): string {
  if (type === 'envelope_100') return 'Envelope';
  if (type === 'week_52') return 'Week';
  if (type === 'penny_365') return 'Day';
  if (type === 'no_spend') return 'Save';
  return 'Step';
}

function progressTitle(type: ChallengeType): string {
  if (type === 'envelope_100') return 'ENVELOPE PROGRESS';
  if (type === 'week_52') return 'WEEKLY PROGRESS';
  if (type === 'penny_365') return 'PENNY PATH PROGRESS';
  if (type === 'no_spend') return 'NO-SPEND LOG';
  return 'SAVINGS PROGRESS';
}


function saveCountLabel(count: number): string {
  return count === 1 ? '1 save' : `${count} saves`;
}

function saveLogTitle(type: ChallengeType): string {
  if (type === 'no_spend') return 'No-spend wins';
  if (type === 'envelope_100') return 'Envelope history';
  return 'Progress history';
}

function saveLogItemTitle(type: ChallengeType, deposit: Deposit): string {
  const noun = pathNoun(type);
  if (deposit.slotNumber) return `${noun} ${deposit.slotNumber}`;
  if (type === 'no_spend') return 'Money kept';
  if (type === 'penny_365') return 'Penny save';
  return 'Saved';
}

function actionLabel(type: ChallengeType): string {
  if (type === 'envelope_100') return 'Fill selected envelope';
  if (type === 'week_52') return 'Log this week';
  if (type === 'penny_365') return "Log today's penny save";
  return 'Log a save';
}

function pathExplainer(type: ChallengeType): string {
  if (type === 'envelope_100') {
    return 'Pick an envelope. Save that amount in your real envelope, cash binder, or savings pot — then mark it filled here.';
  }
  if (type === 'week_52') {
    return 'Each row is a weekly save. Save the week amount in your pot, then mark that week done.';
  }
  if (type === 'penny_365') {
    return 'Penny 365 is a daily path, not physical envelopes. Each save creates a new row and plumps up your mascot.';
  }
  if (type === 'no_spend') {
    return 'Log money you avoided spending. Each no-spend win becomes part of your progress history.';
  }
  return 'Every save becomes part of your progress history.';
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
  const noun = pathNoun(goal.challengeType);

  const onTap = (slot: number, filled: boolean) => {
    if (filled) {
      void haptics.light();
      return;
    }
    void haptics.selection();
    router.push(`/goal/${goal.id}/save?slot=${slot}`);
  };

  const onLogNext = () => {
    const next = progress.nextSuggestedSlot;
    if (typeof next === 'number') router.push(`/goal/${goal.id}/save?slot=${next}`);
    else router.push(`/goal/${goal.id}/save`);
  };

  return (
    <Screen edges={['top']} testID="envelopes-screen">
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} testID="envelopes-back-button" hitSlop={12}>
          <Ionicons name="chevron-back" size={26} color={colors.onSurface} />
        </Pressable>
        <View style={styles.titleWrap}>
          <AppText variant="heading" style={{ textAlign: 'center' }}>
            {template.shortName}
          </AppText>
          <AppText variant="caption" style={{ textAlign: 'center' }}>
            {goal.name}
          </AppText>
        </View>
        <View style={{ width: 26 }} />
      </View>

      {slots.length === 0 ? (
        <SavingsPathScreen
          challengeType={goal.challengeType}
          mascotVariant={goal.mascotVariant as MascotVariant}
          progress={progress}
          deposits={deposits}
          onLog={onLogNext}
        />
      ) : (
        <FlatList
          data={slots}
          keyExtractor={(slot) => String(slot)}
          numColumns={NUM_COLUMNS}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.grid}
          ListHeaderComponent={
            <View>
              <ProgressSummary
                challengeType={goal.challengeType}
                progress={progress}
                onLogNext={() => {
                  const next = progress.nextSuggestedSlot;
                  if (typeof next === 'number') onTap(next, false);
                }}
              />
              <View style={[styles.explainerCard, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
                <AppText variant="bodyBold">How it works</AppText>
                <AppText variant="caption" style={{ marginTop: spacing.xs }}>
                  {pathExplainer(goal.challengeType)}
                </AppText>
                <View style={styles.legendRow}>
                  <LegendDot label="Empty" color={colors.surfaceSecondary} border={colors.border} />
                  <LegendDot label="Suggested" color={colors.surfaceTertiary} border={colors.brandPrimary} />
                  <LegendDot label="Filled" color={colors.brandPrimary} border={colors.brandPrimary} filled />
                </View>
              </View>
            </View>
          }
          ListFooterComponent={
            <RecentSaves
              challengeType={goal.challengeType}
              deposits={deposits}
              emptyCopy="Filled envelopes will appear here once you start building your history."
            />
          }
          renderItem={({ item, index }) => (
            <EnvelopeTile
              slot={item}
              index={index}
              filled={filledSet.has(item)}
              suggested={progress.nextSuggestedSlot === item}
              amount={slotAmount(goal.challengeType, item)}
              noun={noun}
              onPress={() => onTap(item, filledSet.has(item))}
            />
          )}
        />
      )}
    </Screen>
  );
}

function ProgressSummary({
  challengeType,
  progress,
  onLogNext,
}: {
  challengeType: ChallengeType;
  progress: ChallengeProgress;
  onLogNext: () => void;
}) {
  const { colors } = useTheme();
  const noun = pathNoun(challengeType).toLowerCase();
  const filledWord = challengeType === 'envelope_100' ? 'filled' : 'logged';

  return (
    <View style={[styles.summaryCard, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
      <View style={{ flex: 1 }}>
        <AppText variant="caption">{progressTitle(challengeType)}</AppText>
        <AppText variant="bodyBold" style={{ marginTop: 2 }}>
          {progress.filledCount} {filledWord} · {progress.remainingCount} remaining
        </AppText>
        <AppText variant="caption" style={{ marginTop: 2 }}>
          {formatGBP(progress.saved)} saved · {formatPercent(progress.percent)} complete
        </AppText>
      </View>
      {typeof progress.nextSuggestedSlot === 'number' ? (
        <Pressable
          testID="next-envelope-shortcut"
          onPress={onLogNext}
          style={[styles.nextPill, { backgroundColor: colors.brandPrimary }]}
        >
          <AppText variant="caption" color={colors.onBrandPrimary}>Next {noun}</AppText>
          <AppText style={{ fontFamily: fonts.bodyBlack, fontSize: fontSize.base }} color={colors.onBrandPrimary}>
            {formatGBP(progress.nextSuggestedAmount)}
          </AppText>
        </Pressable>
      ) : null}
    </View>
  );
}

function SavingsPathScreen({
  challengeType,
  mascotVariant,
  progress,
  deposits,
  onLog,
}: {
  challengeType: ChallengeType;
  mascotVariant: MascotVariant;
  progress: ChallengeProgress;
  deposits: Deposit[];
  onLog: () => void;
}) {
  const { colors } = useTheme();
  const next = progress.nextSuggestedSlot ?? progress.filledCount + 1;
  const noun = pathNoun(challengeType);
  const nextTitle = challengeType === 'penny_365' ? `Day ${next}` : 'Next save';

  return (
    <ScrollView contentContainerStyle={styles.pathScroll} showsVerticalScrollIndicator={false}>
      <ProgressSummary challengeType={challengeType} progress={progress} onLogNext={onLog} />

      <View style={[styles.pathHero, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
        <Mascot variant={mascotVariant} plumpness={progress.percent} size={132} smug={progress.percent >= 1} />
        <View style={{ flex: 1 }}>
          <AppText variant="caption">{nextTitle.toUpperCase()}</AppText>
          <AppText style={{ fontFamily: fonts.display, fontSize: fontSize['3xl'] }} color={colors.brandPrimary}>
            {formatGBP(progress.nextSuggestedAmount)}
          </AppText>
          <AppText variant="caption" style={{ marginTop: 2 }}>
            {pathExplainer(challengeType)}
          </AppText>
        </View>
      </View>

      <Button
        label={actionLabel(challengeType)}
        testID="envelopes-log-save-button"
        style={{ marginTop: spacing.lg }}
        onPress={onLog}
      />

      <RecentSaves
        challengeType={challengeType}
        deposits={deposits}
        emptyCopy={challengeType === 'no_spend' ? 'Money you keep will appear here as your no-spend wins.' : 'Your saves will appear here once you start filling your path.'}
      />
    </ScrollView>
  );
}

function RecentSaves({
  challengeType,
  deposits,
  emptyCopy,
}: {
  challengeType: ChallengeType;
  deposits: Deposit[];
  emptyCopy: string;
}) {
  const { colors } = useTheme();
  const rows = deposits.slice(0, 12);
  const noun = pathNoun(challengeType);

  return (
    <View style={[styles.logCard, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
      <View style={styles.logHeader}>
        <AppText variant="bodyBold">{saveLogTitle(challengeType)}</AppText>
        <AppText variant="caption">{saveCountLabel(deposits.length)}</AppText>
      </View>

      {rows.length === 0 ? (
        <AppText variant="caption" style={{ marginTop: spacing.sm }}>
          {emptyCopy}
        </AppText>
      ) : (
        rows.map((deposit, index) => (
          <View
            key={deposit.id}
            testID={`save-log-row-${index}`}
            style={[styles.logRow, index === rows.length - 1 ? styles.logRowLast : null, { borderBottomColor: colors.border }]}
          >
            <View style={[styles.logIcon, { backgroundColor: colors.surfaceTertiary }]}>
              <Ionicons name="checkmark" size={16} color={colors.brandPrimary} />
            </View>
            <View style={{ flex: 1 }}>
              <AppText variant="bodyBold">
                {saveLogItemTitle(challengeType, deposit)}
              </AppText>
              <AppText variant="caption">
                {deposit.note?.trim() ? deposit.note : formatDate(deposit.date)}
              </AppText>
            </View>
            <AppText variant="bodyBold" color={colors.brandPrimary}>
              {formatGBP(deposit.amount)}
            </AppText>
          </View>
        ))
      )}
    </View>
  );
}

function LegendDot({
  label,
  color,
  border,
  filled,
}: {
  label: string;
  color: string;
  border: string;
  filled?: boolean;
}) {
  const { colors } = useTheme();
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, { backgroundColor: color, borderColor: border }]}>
        {filled ? <Ionicons name="checkmark" size={10} color={colors.onBrandPrimary} /> : null}
      </View>
      <AppText variant="caption">{label}</AppText>
    </View>
  );
}

function EnvelopeTile({
  slot,
  index,
  filled,
  suggested,
  amount,
  noun,
  onPress,
}: {
  slot: number;
  index: number;
  filled: boolean;
  suggested: boolean;
  amount: number;
  noun: string;
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
        accessibilityLabel={filled ? `${noun} ${slot} filled` : `Fill ${noun.toLowerCase()} ${slot} for ${formatGBP(amount)}`}
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
    minWidth: 76,
    height: 64,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
  },
  explainerCard: {
    marginHorizontal: spacing.xl,
    marginBottom: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    padding: spacing.lg,
  },
  legendRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  legendDot: {
    width: 18,
    height: 18,
    borderRadius: 6,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  grid: {
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
  pathScroll: {
    paddingBottom: spacing.xl,
  },
  pathHero: {
    marginHorizontal: spacing.xl,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  logCard: {
    marginHorizontal: spacing.xl,
    marginTop: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    padding: spacing.lg,
  },
  logHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  logRowLast: {
    borderBottomWidth: 0,
    paddingBottom: 0,
  },
  logIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
});
