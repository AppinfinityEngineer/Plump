import { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Screen, AppText, Button, OnboardingHeader } from '@/src/components/ui';
import { PlumpCard } from '@/src/components/PlumpCard';
import { useApp, useTheme } from '@/src/state/AppProvider';
import { CHALLENGE_TEMPLATES, type ChallengeType } from '@/src/models/challenge';
import type { MascotVariant } from '@/src/components/Mascot';
import type { CardPaletteId } from '@/src/theme/theme';
import { radius, spacing, fontSize } from '@/src/theme/theme';
import { haptics } from '@/src/haptics/haptics';
import { track } from '@/src/services/telemetryService';

const BUILD_STEPS = [
  'Challenge path locked',
  'Mascot selected',
  'Card colours mixed',
  '£0 progress card ready',
];

export default function CardGeneration() {
  const router = useRouter();
  const { colors, draft } = useApp();
  const { colors: themedColors } = useTheme();
  const [ready, setReady] = useState(false);
  const pulse = useRef(new Animated.Value(0.95)).current;

  const challengeType = (draft.challengeType as ChallengeType) ?? 'envelope_100';
  const template = CHALLENGE_TEMPLATES[challengeType];

  useEffect(() => {
    track('card_generation_started', { challenge: challengeType });
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.02, duration: 560, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.95, duration: 560, useNativeDriver: true }),
      ]),
    ).start();

    const timer = setTimeout(() => {
      setReady(true);
      void haptics.revealBeat();
      track('card_generation_ready', { challenge: challengeType });
    }, 1250);

    return () => clearTimeout(timer);
  }, [challengeType, pulse]);

  return (
    <Screen style={styles.container} testID="onboarding-generation">
      <OnboardingHeader step={8} total={10} />
      <AppText variant="title" style={styles.title}>
        Building your card
      </AppText>
      <AppText variant="body" color={themedColors.muted} style={styles.sub}>
        This is the personalised £0 card you get before the paywall. Once it exists, you can unlock the save loop.
      </AppText>

      <Animated.View style={[styles.previewWrap, { transform: [{ scale: pulse }] }]}>
        <PlumpCard
          goalName={draft.goalName ?? 'My savings goal'}
          challengeName={template.shortName}
          saved={0}
          target={draft.targetAmount ?? template.totalTarget}
          percent={0}
          mascotVariant={(draft.mascotVariant as MascotVariant) ?? 'honey'}
          palette={(draft.cardPalette as CardPaletteId) ?? 'cream'}
          subline="Empty card · ready to fill"
          width={300}
        />
      </Animated.View>

      <View style={[styles.checklist, { backgroundColor: themedColors.surfaceSecondary, borderColor: themedColors.border }]}>
        {BUILD_STEPS.map((step, index) => {
          const complete = ready || index < 3;
          return (
            <View key={step} style={styles.checkRow}>
              <View style={[styles.checkIcon, { backgroundColor: complete ? colors.brandPrimary : themedColors.surfaceTertiary }]}>
                <Ionicons name={complete ? 'checkmark' : 'ellipsis-horizontal'} size={15} color={complete ? colors.onBrandPrimary : themedColors.onSurface} />
              </View>
              <AppText variant="bodyBold" style={{ flex: 1 }}>{step}</AppText>
            </View>
          );
        })}
      </View>

      <Button
        label={ready ? 'Reveal my card' : 'Mixing the cute stuff...'}
        disabled={!ready}
        loading={!ready}
        testID="generation-reveal-button"
        onPress={() => router.push('/onboarding/card-reveal')}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: spacing.xl, paddingTop: spacing.md, paddingBottom: spacing.xl },
  title: { marginTop: spacing.lg, fontSize: fontSize['2xl'], textAlign: 'center' },
  sub: { textAlign: 'center', marginTop: spacing.sm, marginBottom: spacing.md, lineHeight: 23 },
  previewWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  checklist: { borderRadius: radius.md, borderWidth: 1.5, padding: spacing.lg, gap: spacing.md, marginBottom: spacing.lg },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  checkIcon: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
});
