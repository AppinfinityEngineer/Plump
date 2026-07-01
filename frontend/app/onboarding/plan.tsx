import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Screen, AppText, Button, OnboardingHeader, Card, Badge } from '@/src/components/ui';
import { Mascot, type MascotVariant } from '@/src/components/Mascot';
import { useApp, useTheme } from '@/src/state/AppProvider';
import { CHALLENGE_TEMPLATES, type ChallengeType } from '@/src/models/challenge';
import { slotAmount } from '@/src/services/challengeEngine';
import { formatGBP } from '@/src/utils/format';
import { radius, spacing, fontSize } from '@/src/theme/theme';

function blockerCopy(blocker?: string): string {
  if (blocker === 'forget') return 'Built to make saving harder to forget.';
  if (blocker === 'small_spends') return 'Built to make small saves feel visible.';
  if (blocker === 'drop_off') return 'Built to keep progress in front of you.';
  if (blocker === 'boring') return 'Built to make saving feel less boring.';
  if (blocker === 'next_save') return 'Built to show the next save clearly.';
  return 'Built around the way you want to save.';
}
function reminderCopy(preference?: string): string {
  if (preference === 'morning') return 'Morning boost';
  if (preference === 'lunch') return 'Lunchtime nudge';
  if (preference === 'evening') return 'Evening check-in';
  if (preference === 'none') return 'No reminders for now';
  return 'Evening check-in';
}
export default function PlanReady() {
  const router = useRouter();
  const { colors } = useTheme();
  const { draft } = useApp();
  const challengeType = (draft.challengeType as ChallengeType) ?? 'envelope_100';
  const template = CHALLENGE_TEMPLATES[challengeType];
  const target = draft.targetAmount ?? template.totalTarget;
  const firstAmount = slotAmount(challengeType, 1);
  const goalName = draft.goalName?.trim() || 'My savings goal';
  const ownerName = draft.userName?.trim();
  const mascot = (draft.mascotVariant as MascotVariant) ?? 'honey';
  const firstLabel = challengeType === 'penny_365' ? 'Day 1' : challengeType === 'week_52' ? 'Week 1' : 'Envelope 1';
  return (
    <Screen style={styles.container} testID="onboarding-plan-ready">
      <OnboardingHeader step={10} total={12} />
      <View style={styles.hero}><Mascot variant={mascot} plumpness={0.5} size={124} smug /><Badge label="PLAN READY" bg={colors.brandTertiary} color="#25451D" /></View>
      <AppText variant="title" style={styles.title}>{ownerName ? `${ownerName}, your saving plan is ready` : 'Your saving plan is ready'}</AppText>
      <AppText variant="body" color={colors.muted} style={styles.sub}>We have your goal, challenge, first save, and reminder style. Now Plump can build your card.</AppText>
      <Card style={styles.summaryCard} testID="plan-ready-summary">
        <SummaryRow icon="flag" label="Goal" value={goalName} />
        <SummaryRow icon="albums" label="Challenge" value={`${template.shortName} · ${formatGBP(target)} target`} />
        <SummaryRow icon="cash" label="First save" value={`${firstLabel} · ${formatGBP(firstAmount)}`} />
        <SummaryRow icon="notifications" label="Reminder" value={reminderCopy(draft.reminderPreference)} />
        <SummaryRow icon="sparkles" label="Focus" value={blockerCopy(draft.savingBlocker)} last />
      </Card>
      <Button label="Build my Plump card" testID="plan-ready-continue-button" onPress={() => router.push('/onboarding/generation' as never)} />
    </Screen>
  );
}
function SummaryRow({ icon, label, value, last }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string; last?: boolean }) {
  const { colors } = useTheme();
  return (<View style={[styles.row, last ? styles.rowLast : null, { borderBottomColor: colors.border }]}><View style={[styles.iconWrap, { backgroundColor: colors.surfaceTertiary }]}><Ionicons name={icon} size={17} color={colors.brandPrimary} /></View><View style={{ flex: 1 }}><AppText variant="caption">{label}</AppText><AppText variant="bodyBold" style={{ marginTop: 1 }}>{value}</AppText></View></View>);
}
const styles = StyleSheet.create({
  container: { paddingHorizontal: spacing.xl, paddingTop: spacing.md, paddingBottom: spacing.xl },
  hero: { alignItems: 'center', gap: spacing.sm, marginTop: spacing.sm },
  title: { marginTop: spacing.lg, fontSize: fontSize['2xl'], textAlign: 'center' },
  sub: { textAlign: 'center', marginTop: spacing.sm, marginBottom: spacing.lg, lineHeight: 23 },
  summaryCard: { padding: 0, marginBottom: spacing.lg, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.lg, borderBottomWidth: 1 },
  rowLast: { borderBottomWidth: 0 },
  iconWrap: { width: 38, height: 38, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
});
