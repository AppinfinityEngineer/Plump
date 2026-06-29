import { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Animated, Modal, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';

import { Screen, AppText, Button, ProgressDots } from '@/src/components/ui';
import { PlumpCard } from '@/src/components/PlumpCard';
import { useApp, useTheme } from '@/src/state/AppProvider';
import { CHALLENGE_TEMPLATES, type ChallengeType } from '@/src/models/challenge';
import { type MascotVariant } from '@/src/components/Mascot';
import { type CardPaletteId, radius, spacing, fontSize } from '@/src/theme/theme';
import { haptics } from '@/src/haptics/haptics';
import { shouldShowReviewAsk, requestNativeReview } from '@/src/review/reviewPromptService';
import { track } from '@/src/services/telemetryService';

export default function CardReveal() {
  const router = useRouter();
  const { colors, draft, isPro, completeOnboardingWithGoal } = useApp();
  const scale = useRef(new Animated.Value(0.8)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const [showReview, setShowReview] = useState(false);
  const ranRef = useRef(false);

  const challengeType = (draft.challengeType as ChallengeType) ?? 'envelope_100';
  const template = CHALLENGE_TEMPLATES[challengeType];

  useEffect(() => {
    (async () => {
      if (ranRef.current) return;
      ranRef.current = true;
      await completeOnboardingWithGoal();
      Animated.parallel([
        Animated.spring(scale, { toValue: 1, friction: 6, tension: 60, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 500, useNativeDriver: true }),
      ]).start();
      void haptics.revealBeat();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const proceedToPaywall = () => {
    // Already-subscribed users (creating an extra goal) skip the paywall.
    router.replace(isPro ? '/(tabs)' : '/paywall');
  };

  const onStart = async () => {
    const eligible = await shouldShowReviewAsk();
    if (eligible) {
      track('review_prompt_shown');
      setShowReview(true);
    } else {
      proceedToPaywall();
    }
  };

  const onReviewSure = async () => {
    track('review_prompt_accepted');
    setShowReview(false);
    await requestNativeReview();
    proceedToPaywall();
  };

  const onReviewNotNow = () => {
    track('review_prompt_dismissed');
    setShowReview(false);
    proceedToPaywall();
  };

  return (
    <Screen style={styles.container} testID="card-reveal">
      <ProgressDots total={7} index={6} />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <AppText variant="title" style={styles.title} color={colors.brandPrimary}>
          Your Plump card is ready.
        </AppText>
        <AppText variant="body" color={colors.muted} style={styles.sub}>
          Now start filling it.
        </AppText>

        <Animated.View style={{ transform: [{ scale }], opacity, marginVertical: spacing.lg }}>
          <PlumpCard
            goalName={draft.goalName ?? 'My savings goal'}
            challengeName={template.shortName}
            saved={0}
            target={draft.targetAmount ?? template.totalTarget}
            percent={0}
            mascotVariant={(draft.mascotVariant as MascotVariant) ?? 'honey'}
            palette={(draft.cardPalette as CardPaletteId) ?? 'cream'}
            subline={`0 / ${template.slots?.length ?? 0} filled`}
            width={320}
          />
        </Animated.View>
      </ScrollView>

      <Button label="Start filling my card" testID="card-reveal-start-button" onPress={onStart} />

      <Modal visible={showReview} transparent animationType="fade" onRequestClose={onReviewNotNow}>
        <View style={[styles.overlay, { backgroundColor: colors.overlay }]}>
          <View style={[styles.sheet, { backgroundColor: colors.surfaceSecondary }]} testID="review-ask-modal">
            <AppText variant="heading" style={{ textAlign: 'center' }}>
              That card turned out cute, didn't it?
            </AppText>
            <AppText variant="body" color={colors.muted} style={{ textAlign: 'center', marginTop: spacing.sm }}>
              If Plump made you smile, a tiny review would help us grow.
            </AppText>
            <View style={{ height: spacing.lg }} />
            <Button label="Sure" testID="review-sure-button" onPress={onReviewSure} />
            <View style={{ height: spacing.sm }} />
            <Button label="Not now" variant="ghost" testID="review-notnow-button" onPress={onReviewNotNow} />
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: spacing.xl, paddingTop: spacing.md, paddingBottom: spacing.xl },
  scroll: { flexGrow: 1, alignItems: 'center', justifyContent: 'center' },
  title: { textAlign: 'center', fontSize: fontSize['2xl'], marginTop: spacing.lg },
  sub: { textAlign: 'center' },
  overlay: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  sheet: { width: '100%', maxWidth: 380, borderRadius: radius.lg, padding: spacing.xl },
});
