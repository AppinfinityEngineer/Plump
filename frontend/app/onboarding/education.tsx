import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Screen, AppText, Button, OnboardingHeader, Card } from '@/src/components/ui';
import { Mascot } from '@/src/components/Mascot';
import { useApp, useTheme } from '@/src/state/AppProvider';
import { CHALLENGE_TEMPLATES, type ChallengeType } from '@/src/models/challenge';
import { radius, spacing, fontSize, fonts } from '@/src/theme/theme';
import { formatGBP } from '@/src/utils/format';

function challengeExplainer(type: ChallengeType): {
  title: string;
  body: string;
  rows: Array<{ label: string; value: string }>;
} {
  if (type === 'envelope_100') {
    return {
      title: 'How the 100 envelopes work',
      body: 'You save the envelope number in real cash, a binder, or a savings pot. Then you mark it filled in Plump.',
      rows: [
        { label: 'Envelope 1', value: 'Save £1' },
        { label: 'Envelope 50', value: 'Save £50' },
        { label: 'All 100 filled', value: '£5,050 saved' },
      ],
    };
  }
  if (type === 'week_52') {
    return {
      title: 'How the 52 weeks work',
      body: 'Each week has a suggested amount. Log the save and your card becomes more satisfying to share.',
      rows: [
        { label: 'Week 1', value: 'Save £1' },
        { label: 'Week 26', value: 'Save £26' },
        { label: 'All weeks done', value: '£1,378 saved' },
      ],
    };
  }
  if (type === 'penny_365') {
    return {
      title: 'How Penny 365 works',
      body: 'Start tiny. Each day grows by one penny. Every logged day becomes a row in your save log.',
      rows: [
        { label: 'Day 1', value: 'Save £0.01' },
        { label: 'Day 100', value: 'Save £1.00' },
        { label: 'Day 365', value: '£667.95 saved' },
      ],
    };
  }
  return {
    title: 'How your save log works',
    body: 'Every save becomes a row. Your mascot and card update whenever the number goes up.',
    rows: [
      { label: 'Log save', value: 'Add a row' },
      { label: 'Hit milestone', value: 'Card upgrades' },
      { label: 'Reach goal', value: 'Smug Plump' },
    ],
  };
}

export default function ChallengeEducation() {
  const router = useRouter();
  const { colors, draft } = useApp();
  const { colors: themedColors } = useTheme();
  const challengeType = (draft.challengeType as ChallengeType) ?? 'envelope_100';
  const template = CHALLENGE_TEMPLATES[challengeType];
  const explainer = challengeExplainer(challengeType);

  return (
    <Screen style={styles.container} testID="onboarding-education">
      <OnboardingHeader step={4} total={12} />
      <AppText variant="title" style={styles.title}>
        {explainer.title}
      </AppText>
      <AppText variant="body" color={themedColors.muted} style={styles.sub}>
        {explainer.body}
      </AppText>

      <Card style={styles.card} testID="challenge-education-card">
        <View style={styles.cardTop}>
          <Mascot variant="honey" plumpness={0.28} size={106} />
          <View style={{ flex: 1 }}>
            <AppText variant="caption">YOUR CHALLENGE</AppText>
            <AppText variant="heading">{template.shortName}</AppText>
            <AppText style={{ fontFamily: fonts.display, fontSize: fontSize['2xl'], marginTop: spacing.xs }} color={colors.brandPrimary}>
              {formatGBP(template.totalTarget)}
            </AppText>
          </View>
        </View>

        <View style={styles.rows}>
          {explainer.rows.map((row) => (
            <View key={row.label} style={[styles.row, { borderBottomColor: themedColors.border }]}>
              <View style={[styles.tick, { backgroundColor: themedColors.surfaceTertiary }]}>
                <Ionicons name="checkmark" size={15} color={themedColors.brandPrimary} />
              </View>
              <AppText variant="bodyBold" style={{ flex: 1 }}>{row.label}</AppText>
              <AppText variant="bodyBold" color={themedColors.brandPrimary}>{row.value}</AppText>
            </View>
          ))}
        </View>
      </Card>

      <View style={[styles.promise, { backgroundColor: themedColors.surfaceSecondary, borderColor: themedColors.border }]}>
        <AppText variant="bodyBold">Plump does not move your money.</AppText>
        <AppText variant="caption" style={{ marginTop: 4 }}>
          You save in your own envelope, cash binder, bank pot, or savings account. Plump makes the progress visible.
        </AppText>
      </View>

      <Button label="Design my card style" testID="education-continue-button" onPress={() => router.push('/onboarding/style')} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: spacing.xl, paddingTop: spacing.md, paddingBottom: spacing.xl },
  title: { marginTop: spacing.lg, fontSize: fontSize['2xl'], textAlign: 'center' },
  sub: { textAlign: 'center', marginTop: spacing.sm, marginBottom: spacing.lg, lineHeight: 23 },
  card: { gap: spacing.lg },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  rows: { gap: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingBottom: spacing.sm, borderBottomWidth: 1 },
  tick: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  promise: { borderRadius: radius.md, borderWidth: 1.5, padding: spacing.lg, marginTop: spacing.lg, marginBottom: spacing.lg },
});
