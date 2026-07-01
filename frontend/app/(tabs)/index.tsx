import { View, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';

import { Screen, AppText, Button, Card, ProgressBar } from '@/src/components/ui';
import { Mascot, type MascotVariant } from '@/src/components/Mascot';
import { useApp, useTheme } from '@/src/state/AppProvider';
import { CHALLENGE_TEMPLATES } from '@/src/models/challenge';
import { computeProgress, getStreak } from '@/src/services/challengeEngine';
import { getLuckySaveSuggestion, routeForLuckySave } from '@/src/services/luckySaveService';
import { formatGBP, formatPercent } from '@/src/utils/format';
import { spacing, fontSize, fonts, radius } from '@/src/theme/theme';

function pathButtonLabel(challengeType: string): string {
  if (challengeType === 'envelope_100') return 'View envelopes';
  if (challengeType === 'week_52') return 'View weeks';
  if (challengeType === 'penny_365') return 'View penny path';
  if (challengeType === 'no_spend') return 'View save log';
  return 'View path';
}

function nextSaveLabel(challengeType: string, slot?: number): string {
  if (!slot) return 'Add a save';
  if (challengeType === 'envelope_100') return `Envelope ${slot}`;
  if (challengeType === 'week_52') return `Week ${slot}`;
  if (challengeType === 'penny_365') return `Day ${slot}`;
  return 'Add a save';
}

function greetingForOwner(ownerName?: string): string {
  const cleaned = ownerName?.trim();
  return cleaned ? `Good morning, ${cleaned}` : 'Good morning';
}


function streakLabel(streak: number): string {
  return streak > 0 ? `🔥 ${streak} day streak` : '✨ Start your streak';
}

function suggestionBadge(mode: string): string {
  return mode === 'next' ? '✨ Next step' : '✨ Plump pick';
}

function displayGoalTitle(name: string): string {
  const trimmed = name.trim() || 'Savings goal';
  const lower = trimmed.toLowerCase();
  if (lower.includes('fund') || lower.includes('goal') || lower.includes('challenge')) return trimmed;
  return `${trimmed} fund`;
}

export default function Home() {
  const router = useRouter();
  const { colors } = useTheme();
  const { activeGoal, getDeposits } = useApp();

  if (!activeGoal) {
    return (
      <Screen style={styles.center} testID="home-empty">
        <Mascot variant="honey" plumpness={0.1} size={160} />
        <AppText variant="heading" style={{ marginTop: spacing.lg, textAlign: 'center' }}>
          No active goal yet
        </AppText>
        <Button label="Start a challenge" style={{ marginTop: spacing.lg }} onPress={() => router.push('/(tabs)/goals')} />
      </Screen>
    );
  }

  const deposits = getDeposits(activeGoal.id);
  const progress = computeProgress(activeGoal, deposits);
  const streak = getStreak(deposits);
  const template = CHALLENGE_TEMPLATES[activeGoal.challengeType];
  const variant = activeGoal.mascotVariant as MascotVariant;
  const luckySave = getLuckySaveSuggestion(activeGoal, progress);

  return (
    <Screen edges={['top']} testID="home-dashboard">
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <AppText variant="caption">{greetingForOwner(activeGoal.ownerName)}</AppText>
        <AppText variant="title" style={{ fontSize: fontSize['2xl'] }}>
          {displayGoalTitle(activeGoal.name)}
        </AppText>
        <AppText variant="caption" style={{ marginTop: 2 }}>
          {template.shortName} · {formatGBP(progress.target)} target
        </AppText>

        <View style={styles.mascotWrap}>
          <Mascot variant={variant} plumpness={progress.percent} size={220} smug={progress.percent >= 1} />
        </View>

        <AppText variant="number" style={{ textAlign: 'center' }}>{formatGBP(progress.saved)}</AppText>
        <AppText variant="body" color={colors.muted} style={{ textAlign: 'center' }}>
          saved of {formatGBP(progress.target)}
        </AppText>

        <View style={{ marginVertical: spacing.lg }}>
          <ProgressBar percent={progress.percent} />
          <View style={styles.statsRow}>
            <AppText variant="bodyBold">{formatPercent(progress.percent)} complete</AppText>
            <AppText variant="bodyBold" color={colors.brand}>{streakLabel(streak.current)}</AppText>
          </View>
        </View>

        <Card style={{ marginBottom: spacing.lg }} testID="home-lucky-save-card">
          <View style={styles.luckyEyebrowRow}>
            <AppText variant="caption">{luckySave.eyebrow}</AppText>
            <AppText variant="caption" color={colors.brandPrimary}>{suggestionBadge(luckySave.mode)}</AppText>
          </View>
          <View style={styles.nextRow}>
            <AppText variant="heading">
              {luckySave.label}
            </AppText>
            <AppText style={{ fontFamily: fonts.display, fontSize: fontSize['2xl'] }} color={colors.brandPrimary}>
              {formatGBP(luckySave.amount)}
            </AppText>
          </View>
          <AppText variant="caption" style={styles.luckyCopy}>
            {luckySave.tagline}
          </AppText>
        </Card>

        <Button label={luckySave.ctaLabel} testID="home-save-button" onPress={() => router.push(routeForLuckySave(activeGoal, luckySave) as never)} />
        <View style={{ height: spacing.sm }} />
        <View style={styles.secondaryRow}>
          <Button label={pathButtonLabel(activeGoal.challengeType)} variant="secondary" style={{ flex: 1 }} testID="home-envelopes-button" onPress={() => router.push(`/goal/${activeGoal.id}/envelopes`)} />
          <Button label="Share card" variant="secondary" style={{ flex: 1 }} testID="home-share-button" onPress={() => router.push(`/goal/${activeGoal.id}/card`)} />
        </View>
        <View style={{ height: spacing.sm }} />
        <Button label="View goal detail" variant="ghost" testID="home-detail-button" onPress={() => router.push(`/goal/${activeGoal.id}`)} />
        <AppText variant="caption" style={{ textAlign: 'center', marginTop: spacing.sm }}>
          {template.name}
        </AppText>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: spacing.xl, paddingTop: spacing.lg, paddingBottom: spacing.xl },
  center: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.xl },
  mascotWrap: { alignItems: 'center', marginVertical: spacing.md },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.sm },
  nextRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.xs },
  luckyEyebrowRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  luckyCopy: {
    marginTop: spacing.xs,
    lineHeight: 19,
  },
  secondaryRow: { flexDirection: 'row', gap: spacing.sm },
});
