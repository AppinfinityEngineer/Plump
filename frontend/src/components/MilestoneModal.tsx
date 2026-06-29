import React from 'react';
import { Modal, View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Mascot, type MascotVariant } from '@/src/components/Mascot';
import { Confetti } from '@/src/components/Confetti';
import { AppText, Button, Badge } from '@/src/components/ui';
import { useTheme } from '@/src/state/AppProvider';
import { radius, spacing, fontSize, fonts } from '@/src/theme/theme';
import type { ChallengeType } from '@/src/models/challenge';
import type { MilestonePercent } from '@/src/services/challengeEngine';

function milestoneHeadline(percent: MilestonePercent | null): string {
  if (percent === 100) return 'Goal complete';
  if (percent === 90) return 'Almost fully plumped';
  if (percent === 75) return 'Chunky mode unlocked';
  if (percent === 50) return 'Halfway plumped';
  if (percent === 25) return 'First quarter filled';
  if (percent === 10) return 'First wobble unlocked';
  return 'Milestone hit';
}

function milestoneBody(percent: MilestonePercent | null, goalName?: string): string {
  const name = goalName?.trim() || 'your goal';
  if (percent === 100) return `${name} is complete. Your Plump is officially smug.`;
  if (percent === 90) return `You are close enough to smell the finish line on ${name}.`;
  if (percent === 75) return `${name} is no longer a little idea. This is real progress.`;
  if (percent === 50) return `Halfway to ${name}. The hardest part is now behind you.`;
  if (percent === 25) return `A quarter of ${name} is done. Tiny saves are turning into something visible.`;
  if (percent === 10) return `You have started for real. That first bit of momentum matters.`;
  return `Your progress just crossed a new milestone.`;
}

function challengeReward(type?: ChallengeType): string {
  if (type === 'envelope_100') return 'Another envelope win for the history.';
  if (type === 'week_52') return 'Your weekly rhythm is working.';
  if (type === 'penny_365') return 'Tiny pennies are stacking up.';
  if (type === 'no_spend') return 'That money stayed yours.';
  return 'Your saving loop is working.';
}

export function MilestoneModal({
  visible,
  percent,
  mascotVariant,
  challengeType,
  goalName,
  onShare,
  onKeepSaving,
}: {
  visible: boolean;
  percent: MilestonePercent | null;
  mascotVariant: MascotVariant;
  challengeType?: ChallengeType;
  goalName?: string;
  onShare: () => void;
  onKeepSaving: () => void;
}) {
  const { colors } = useTheme();
  const safePercent = percent ?? 0;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onKeepSaving}>
      <View style={[styles.overlay, { backgroundColor: colors.overlay }]}>
        <Confetti play={visible} />
        <View style={[styles.sheet, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]} testID="milestone-modal">
          <Badge label="MILESTONE MOMENT" bg={colors.brandTertiary} color="#25451D" />

          <View style={styles.percentMedal} testID="milestone-percent-medal">
            <AppText style={styles.percentText} color={colors.brandPrimary}>
              {safePercent}%
            </AppText>
            <Ionicons name="sparkles" size={18} color={colors.brandPrimary} />
          </View>

          <AppText variant="heading" style={styles.headline}>
            {milestoneHeadline(percent)}
          </AppText>
          <AppText variant="body" color={colors.muted} style={styles.body}>
            {milestoneBody(percent, goalName)}
          </AppText>

          <View style={styles.mascotWrap}>
            <Mascot variant={mascotVariant} plumpness={safePercent / 100} size={190} smug={safePercent >= 75} motion="success" />
          </View>

          <View style={[styles.rewardStrip, { backgroundColor: colors.surfaceTertiary }]}>
            <Ionicons name="trophy" size={18} color={colors.brandPrimary} />
            <AppText variant="caption" style={{ flex: 1 }}>
              {challengeReward(challengeType)}
            </AppText>
          </View>

          <Button label="Share progress card" onPress={onShare} testID="milestone-share-button" />
          <View style={{ height: spacing.md }} />
          <Button label="Keep saving" variant="secondary" onPress={onKeepSaving} testID="milestone-keep-button" />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  sheet: {
    width: '100%',
    maxWidth: 390,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    padding: spacing.xl,
    alignItems: 'center',
  },
  percentMedal: {
    marginTop: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  percentText: {
    fontFamily: fonts.display,
    fontSize: fontSize['5xl'],
    lineHeight: 74,
  },
  headline: {
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  body: {
    textAlign: 'center',
    marginTop: spacing.sm,
    lineHeight: 23,
  },
  mascotWrap: {
    alignItems: 'center',
    marginVertical: spacing.lg,
  },
  rewardStrip: {
    width: '100%',
    borderRadius: radius.md,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
});
