import { useRef } from 'react';
import { View, StyleSheet, ScrollView, Pressable } from 'react-native';
import type { View as RNView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Screen, AppText, Button } from '@/src/components/ui';
import { PlumpCard } from '@/src/components/PlumpCard';
import { useApp, useTheme } from '@/src/state/AppProvider';
import { CHALLENGE_TEMPLATES, type ChallengeType } from '@/src/models/challenge';
import type { MascotVariant } from '@/src/components/Mascot';
import type { CardPaletteId } from '@/src/theme/theme';
import { computeProgress } from '@/src/services/challengeEngine';
import { spacing } from '@/src/theme/theme';
import { shareCard } from '@/src/services/share';
import { formatGBP } from '@/src/utils/format';
import { track } from '@/src/services/telemetryService';
import { haptics } from '@/src/haptics/haptics';


function shareSubline(challengeType: ChallengeType, progress: ReturnType<typeof computeProgress>): string | undefined {
  if (progress.totalSlots <= 0) return undefined;
  if (challengeType === 'envelope_100') return `${progress.filledCount} / ${progress.totalSlots} envelopes filled`;
  if (challengeType === 'week_52') return `${progress.filledCount} / ${progress.totalSlots} weeks logged`;
  if (challengeType === 'penny_365') return `${progress.filledCount} / ${progress.totalSlots} tiny saves`;
  if (challengeType === 'no_spend') return `${progress.filledCount} no-spend wins`;
  return `${progress.filledCount} saves logged`;
}

function shareMilestoneLabel(percent: number): string | undefined {
  if (percent >= 1) return 'Goal complete';
  if (percent >= 0.9) return 'Almost there';
  if (percent >= 0.75) return 'Chunky progress';
  if (percent >= 0.5) return 'Halfway plumped';
  if (percent >= 0.25) return 'Momentum building';
  if (percent >= 0.1) return 'First wobble unlocked';
  return undefined;
}

export default function GoalCard() {
  const router = useRouter();
  const { colors } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { goals, getDeposits } = useApp();
  const goal = goals.find((g) => g.id === id);
  const cardRef = useRef<RNView>(null);

  if (!goal) return null;
  const deposits = getDeposits(goal.id);
  const progress = computeProgress(goal, deposits);
  const template = CHALLENGE_TEMPLATES[goal.challengeType];
  const caption = `My Plump progress: ${goal.name} — ${formatGBP(progress.saved)} saved (${Math.round(progress.percent * 100)}%).`;

  const onShare = async () => {
    void haptics.medium();
    const ok = await shareCard(cardRef, caption);
    if (ok) track('card_shared');
  };

  return (
    <Screen edges={['top']} testID="goal-card-screen">
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} testID="card-back-button" hitSlop={12}>
          <Ionicons name="chevron-back" size={26} color={colors.onSurface} />
        </Pressable>
        <AppText variant="heading">Share card</AppText>
        <View style={{ width: 26 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={{ alignItems: 'center' }}>
          <PlumpCard
            ref={cardRef}
            goalName={goal.name}
            challengeName={template.shortName}
            saved={progress.saved}
            target={progress.target}
            percent={progress.percent}
            mascotVariant={goal.mascotVariant as MascotVariant}
            palette={goal.colorTheme as CardPaletteId}
            subline={shareSubline(goal.challengeType, progress)}
            milestoneLabel={shareMilestoneLabel(progress.percent)}
            width={320}
          />
        </View>
        <View style={{ height: spacing.xl }} />
        <Button label="Share card" testID="goalcard-share-button" onPress={onShare} />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.xl, paddingTop: spacing.lg, paddingBottom: spacing.sm },
  scroll: { paddingHorizontal: spacing.xl, paddingTop: spacing.lg, paddingBottom: spacing.xl },
});
