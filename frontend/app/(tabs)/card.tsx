import { useRef, useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import type { View as RNView } from 'react-native';

import { Screen, AppText, Button } from '@/src/components/ui';
import { PlumpCard } from '@/src/components/PlumpCard';
import { useApp, useTheme } from '@/src/state/AppProvider';
import { CHALLENGE_TEMPLATES } from '@/src/models/challenge';
import type { MascotVariant } from '@/src/components/Mascot';
import type { CardPaletteId } from '@/src/theme/theme';
import { computeProgress } from '@/src/services/challengeEngine';
import { spacing, fontSize } from '@/src/theme/theme';
import { buildCaption, shareCard } from '@/src/services/share';
import { formatGBP } from '@/src/utils/format';
import { track } from '@/src/services/telemetryService';
import { haptics } from '@/src/haptics/haptics';

export default function CardTab() {
  const { colors } = useTheme();
  const { activeGoal, getDeposits } = useApp();
  const cardRef = useRef<RNView>(null);
  const [copied, setCopied] = useState(false);

  if (!activeGoal) {
    return (
      <Screen style={styles.center} testID="card-empty">
        <AppText variant="heading" style={{ textAlign: 'center' }}>No card yet</AppText>
      </Screen>
    );
  }

  const deposits = getDeposits(activeGoal.id);
  const progress = computeProgress(activeGoal, deposits);
  const template = CHALLENGE_TEMPLATES[activeGoal.challengeType];
  const caption = buildCaption(activeGoal.name, formatGBP(progress.saved));

  const onShare = async () => {
    void haptics.medium();
    const ok = await shareCard(cardRef, caption);
    if (ok) track('card_shared');
  };

  return (
    <Screen edges={['top']} testID="card-tab">
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <AppText variant="title" style={{ fontSize: fontSize['2xl'], marginBottom: spacing.lg }}>
          Share your progress
        </AppText>

        <View style={{ alignItems: 'center' }}>
          <PlumpCard
            ref={cardRef}
            goalName={activeGoal.name}
            challengeName={template.shortName}
            saved={progress.saved}
            target={progress.target}
            percent={progress.percent}
            mascotVariant={activeGoal.mascotVariant as MascotVariant}
            palette={activeGoal.colorTheme as CardPaletteId}
            subline={progress.totalSlots ? `${progress.filledCount} / ${progress.totalSlots} envelopes` : undefined}
            width={320}
          />
        </View>

        <View style={{ height: spacing.xl }} />
        <Button label="Share card" testID="share-card-button" onPress={onShare} />
        <View style={{ height: spacing.sm }} />
        <Button label="Save image" variant="secondary" testID="save-image-button" onPress={onShare} />
        <View style={{ height: spacing.sm }} />
        <Button
          label={copied ? 'Caption copied ✓' : 'Copy caption'}
          variant="ghost"
          testID="copy-caption-button"
          onPress={() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          }}
        />
        <AppText variant="caption" style={{ textAlign: 'center', marginTop: spacing.md }} color={colors.muted}>
          {caption}
        </AppText>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: spacing.xl, paddingTop: spacing.lg, paddingBottom: spacing.xl },
  center: { alignItems: 'center', justifyContent: 'center' },
});
