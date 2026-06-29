import { View, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Screen, AppText, Button, Card, ProgressBar } from '@/src/components/ui';
import { Mascot, type MascotVariant } from '@/src/components/Mascot';
import { useApp, useTheme } from '@/src/state/AppProvider';
import { CHALLENGE_TEMPLATES } from '@/src/models/challenge';
import { computeProgress, getStreak } from '@/src/services/challengeEngine';
import { formatGBP, formatPercent, formatDate } from '@/src/utils/format';
import { spacing, fontSize, radius } from '@/src/theme/theme';

export default function GoalDetail() {
  const router = useRouter();
  const { colors } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { goals, getDeposits, archiveGoal } = useApp();
  const goal = goals.find((g) => g.id === id);

  if (!goal) {
    return (
      <Screen style={styles.center} testID="goal-not-found">
        <AppText variant="heading">Goal not found</AppText>
        <Button label="Back" variant="secondary" style={{ marginTop: spacing.lg }} onPress={() => router.back()} />
      </Screen>
    );
  }

  const deposits = getDeposits(goal.id);
  const progress = computeProgress(goal, deposits);
  const streak = getStreak(deposits);
  const template = CHALLENGE_TEMPLATES[goal.challengeType];

  return (
    <Screen edges={['top']} testID="goal-detail">
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} testID="goal-back-button" hitSlop={12}>
          <Ionicons name="chevron-back" size={26} color={colors.onSurface} />
        </Pressable>
        <AppText variant="heading">{template.shortName}</AppText>
        <Pressable onPress={() => archiveGoal(goal.id)} testID="goal-archive-button" hitSlop={12}>
          <Ionicons name="archive-outline" size={22} color={colors.muted} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <AppText variant="title" style={{ fontSize: fontSize['2xl'] }}>{goal.name}</AppText>
        <View style={styles.mascotWrap}>
          <Mascot variant={goal.mascotVariant as MascotVariant} plumpness={progress.percent} size={200} smug={progress.percent >= 1} />
        </View>
        <AppText variant="number" style={{ textAlign: 'center' }}>{formatGBP(progress.saved)}</AppText>
        <AppText variant="body" color={colors.muted} style={{ textAlign: 'center' }}>
          {formatGBP(progress.remaining)} remaining
        </AppText>

        <View style={{ marginVertical: spacing.lg }}>
          <ProgressBar percent={progress.percent} />
        </View>

        <View style={styles.statsGrid}>
          <Stat label="Complete" value={formatPercent(progress.percent)} />
          <Stat label="Streak" value={`${streak.current} days`} />
          <Stat label="Projected" value={formatDate(progress.projectedFinish)} />
        </View>

        <Button label="Save" testID="detail-save-button" style={{ marginTop: spacing.lg }} onPress={() => router.push(`/goal/${goal.id}/save`)} />
        <View style={{ height: spacing.sm }} />
        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          <Button label="Envelopes" variant="secondary" style={{ flex: 1 }} testID="detail-envelopes-button" onPress={() => router.push(`/goal/${goal.id}/envelopes`)} />
          <Button label="Share card" variant="secondary" style={{ flex: 1 }} testID="detail-share-button" onPress={() => router.push(`/goal/${goal.id}/card`)} />
        </View>

        <AppText variant="heading" style={{ marginTop: spacing.xl, marginBottom: spacing.sm }}>Recent saves</AppText>
        {deposits.length === 0 ? (
          <AppText variant="caption">No saves yet — tap Save to fill your first envelope.</AppText>
        ) : (
          deposits.slice(0, 12).map((d) => (
            <View key={d.id} style={[styles.depositRow, { borderBottomColor: colors.border }]}>
              <View style={{ flex: 1 }}>
                <AppText variant="bodyBold">{d.slotNumber ? `Envelope ${d.slotNumber}` : 'Save'}</AppText>
                <AppText variant="caption">{formatDate(d.date)}{d.note ? ` · ${d.note}` : ''}</AppText>
              </View>
              <AppText variant="bodyBold" color={colors.brandPrimary}>+{formatGBP(d.amount)}</AppText>
            </View>
          ))
        )}
      </ScrollView>
    </Screen>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  const { colors } = useTheme();
  return (
    <Card style={{ flex: 1, padding: spacing.md, alignItems: 'center' }}>
      <AppText variant="bodyBold">{value}</AppText>
      <AppText variant="caption">{label}</AppText>
    </Card>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.xl, paddingTop: spacing.lg, paddingBottom: spacing.sm },
  scroll: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xl },
  center: { alignItems: 'center', justifyContent: 'center' },
  mascotWrap: { alignItems: 'center', marginVertical: spacing.md },
  statsGrid: { flexDirection: 'row', gap: spacing.sm },
  depositRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.md, borderBottomWidth: 1 },
});
