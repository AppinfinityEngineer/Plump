import { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Animated, Modal, ScrollView, Easing } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Screen, AppText, Button, ProgressDots } from '@/src/components/ui';
import { PlumpCard } from '@/src/components/PlumpCard';
import { Mascot, type MascotVariant } from '@/src/components/Mascot';
import { useApp, useTheme } from '@/src/state/AppProvider';
import { CHALLENGE_TEMPLATES, type ChallengeType } from '@/src/models/challenge';
import { type CardPaletteId, radius, spacing, fontSize, fonts } from '@/src/theme/theme';
import { haptics } from '@/src/haptics/haptics';
import { shouldShowReviewAsk, requestNativeReview } from '@/src/review/reviewPromptService';
import { track } from '@/src/services/telemetryService';
import { formatGBP } from '@/src/utils/format';

const PREMIUM = {
  blush: '#F8DED2',
  honey: '#F4C766',
  sage: '#DDECCF',
  ivory: '#FFF9EF',
  cocoa: '#5A3F2B',
  gold: '#DDAA43',
  creamDeep: '#F3E7D5',
};

export default function CardReveal() {
  const router = useRouter();
  const { colors, draft, isPro, completeOnboardingWithGoal } = useApp();
  const { colors: themedColors } = useTheme();

  const cardScale = useRef(new Animated.Value(0.82)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;
  const cardY = useRef(new Animated.Value(92)).current;
  const cardX = useRef(new Animated.Value(28)).current;
  const cardSpin = useRef(new Animated.Value(0)).current;
  const panelOpacity = useRef(new Animated.Value(0)).current;
  const panelY = useRef(new Animated.Value(24)).current;
  const glow = useRef(new Animated.Value(0)).current;
  const mascotFloat = useRef(new Animated.Value(0)).current;
  const pillPulse = useRef(new Animated.Value(0)).current;

  const [showReview, setShowReview] = useState(false);
  const ranRef = useRef(false);

  const revealDraftRef = useRef({
    challengeType: (draft.challengeType as ChallengeType) ?? 'envelope_100',
    targetAmount: draft.targetAmount,
    mascotVariant: (draft.mascotVariant as MascotVariant) ?? 'honey',
    palette: (draft.cardPalette as CardPaletteId) ?? 'cream',
    goalName: draft.goalName ?? 'My savings goal',
    firstName: draft.userName?.trim(),
  });

  const challengeType = revealDraftRef.current.challengeType;
  const template = CHALLENGE_TEMPLATES[challengeType];
  const target = revealDraftRef.current.targetAmount ?? template.totalTarget;
  const mascotVariant = revealDraftRef.current.mascotVariant;
  const palette = revealDraftRef.current.palette;
  const goalName = revealDraftRef.current.goalName;
  const firstName = revealDraftRef.current.firstName;

  useEffect(() => {
    (async () => {
      if (ranRef.current) return;
      ranRef.current = true;

      await completeOnboardingWithGoal();
      track('card_generated');

      Animated.loop(
        Animated.sequence([
          Animated.timing(mascotFloat, { toValue: 1, duration: 1550, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          Animated.timing(mascotFloat, { toValue: 0, duration: 1550, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        ]),
      ).start();

      Animated.loop(
        Animated.sequence([
          Animated.timing(pillPulse, { toValue: 1, duration: 1150, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          Animated.timing(pillPulse, { toValue: 0, duration: 1150, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        ]),
      ).start();

      Animated.sequence([
        Animated.parallel([
          Animated.timing(glow, { toValue: 1, duration: 520, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
          Animated.spring(cardScale, { toValue: 1, friction: 5, tension: 78, useNativeDriver: true }),
          Animated.spring(cardY, { toValue: 0, friction: 6, tension: 80, useNativeDriver: true }),
          Animated.spring(cardX, { toValue: 0, friction: 6, tension: 72, useNativeDriver: true }),
          Animated.timing(cardSpin, { toValue: 1, duration: 560, easing: Easing.out(Easing.back(1.2)), useNativeDriver: true }),
          Animated.timing(cardOpacity, { toValue: 1, duration: 360, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(panelOpacity, { toValue: 1, duration: 360, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
          Animated.timing(panelY, { toValue: 0, duration: 360, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        ]),
      ]).start();

      void haptics.revealBeat();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const proceedToPaywall = () => {
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

  const glowOpacity = glow.interpolate({ inputRange: [0, 1], outputRange: [0, 0.28] });
  const mascotTranslate = mascotFloat.interpolate({ inputRange: [0, 1], outputRange: [0, -7] });
  const pillOpacity = pillPulse.interpolate({ inputRange: [0, 1], outputRange: [0.76, 1] });
  const rotate = cardSpin.interpolate({ inputRange: [0, 1], outputRange: ['-4deg', '0deg'] });

  return (
    <Screen style={styles.container} testID="card-reveal">
      <ProgressDots total={10} index={9} />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.heroCopy}>
          <Animated.View
            testID="card-reveal-ready-pill"
            style={[
              styles.readyPill,
              {
                backgroundColor: PREMIUM.ivory,
                borderColor: PREMIUM.gold,
                opacity: pillOpacity,
              },
            ]}
          >
            <Ionicons name="sparkles" size={15} color={colors.brandPrimary} />
            <AppText variant="caption" color={colors.brandPrimary}>
              CARD READY
            </AppText>
          </Animated.View>

          <AppText variant="title" style={styles.title} color={colors.brandPrimary}>
            {firstName ? `${firstName}, your card is ready` : 'Your Plump card is ready'}
          </AppText>
          <AppText variant="body" color={colors.muted} style={styles.sub}>
            This is your £0 starting card. Unlock the loop to start filling it for real.
          </AppText>
        </View>

        <View style={styles.revealStage}>
          <Animated.View
            pointerEvents="none"
            testID="card-reveal-premium-glow"
            style={[
              styles.glow,
              {
                backgroundColor: PREMIUM.honey,
                opacity: glowOpacity,
              },
            ]}
          />

          <Animated.View
            testID="card-reveal-main-card"
            style={{
              transform: [{ translateX: cardX }, { translateY: cardY }, { scale: cardScale }, { rotate }],
              opacity: cardOpacity,
              marginTop: spacing.md,
            }}
          >
            <PlumpCard
              goalName={goalName}
              challengeName={template.shortName}
              saved={0}
              target={target}
              percent={0}
              mascotVariant={mascotVariant}
              palette={palette}
              subline="Empty card · ready to fill"
              width={312}
            />
          </Animated.View>
        </View>

        <Animated.View
          testID="card-reveal-premium-future-panel"
          style={[
            styles.futurePanel,
            {
              backgroundColor: PREMIUM.ivory,
              borderColor: PREMIUM.blush,
              opacity: panelOpacity,
              transform: [{ translateY: panelY }],
            },
          ]}
        >
          <View style={styles.futureHeader}>
            <View style={[styles.futureIcon, { backgroundColor: PREMIUM.sage }]}>
              <Animated.View style={{ transform: [{ translateY: mascotTranslate }] }}>
                <Mascot variant={mascotVariant} plumpness={1} size={48} smug />
              </Animated.View>
            </View>
            <View style={{ flex: 1 }}>
              <AppText variant="bodyBold" style={{ color: PREMIUM.cocoa }}>
                Unlock the saving loop
              </AppText>
              <AppText variant="caption" style={{ marginTop: 2 }}>
                Turn this empty card into a living progress card.
              </AppText>
            </View>
          </View>

          <View style={styles.unlockRows}>
            <UnlockRow icon="checkbox" label="Fill envelopes and log every save" />
            <UnlockRow icon="trending-up" label={`Build towards ${formatGBP(target)}`} />
            <UnlockRow icon="share-social" label="Share cute progress cards with plump.app" />
          </View>

          <View style={[styles.completeStrip, { backgroundColor: PREMIUM.sage }]}>
            <View style={styles.completeLeft}>
              <AppText variant="caption" style={{ color: PREMIUM.cocoa }}>
                FUTURE STATE
              </AppText>
              <AppText style={{ fontFamily: fonts.display, fontSize: fontSize.xl }} color={colors.brandPrimary}>
                {formatGBP(target)}
              </AppText>
              <AppText variant="caption">saved · smug card unlocked</AppText>
            </View>
            <View style={[styles.lockPill, { backgroundColor: colors.brandPrimary }]}>
              <Ionicons name="lock-closed" size={12} color={colors.onBrandPrimary} />
              <AppText variant="caption" color={colors.onBrandPrimary}>
                Pro
              </AppText>
            </View>
          </View>
        </Animated.View>
      </ScrollView>

      <Button label="Start filling my card" testID="card-reveal-start-button" onPress={onStart} />

      <Modal visible={showReview} transparent animationType="fade" onRequestClose={onReviewNotNow}>
        <View style={[styles.overlay, { backgroundColor: colors.overlay }]}>
          <View style={[styles.sheet, { backgroundColor: colors.surfaceSecondary }]} testID="review-ask-modal">
            <AppText variant="heading" style={{ textAlign: 'center' }}>
              That card turned out cute, didn&apos;t it?
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

function UnlockRow({ icon, label }: { icon: keyof typeof Ionicons.glyphMap; label: string }) {
  return (
    <View style={styles.unlockRow}>
      <View style={[styles.unlockBullet, { backgroundColor: PREMIUM.blush }]}>
        <Ionicons name={icon} size={14} color={PREMIUM.cocoa} />
      </View>
      <AppText variant="caption" style={{ flex: 1, color: PREMIUM.cocoa }}>
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
  },
  scroll: {
    flexGrow: 1,
    alignItems: 'center',
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxxl + spacing.xxl,
  },
  heroCopy: {
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
  },
  readyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    marginBottom: spacing.sm,
  },
  title: {
    textAlign: 'center',
    fontSize: fontSize['2xl'],
  },
  sub: {
    textAlign: 'center',
    marginTop: spacing.xs,
    lineHeight: 22,
  },
  revealStage: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md,
    minHeight: 408,
  },
  glow: {
    position: 'absolute',
    width: 290,
    height: 290,
    borderRadius: 145,
    top: 56,
  },
  futurePanel: {
    width: '100%',
    borderRadius: radius.lg,
    borderWidth: 1.5,
    padding: spacing.lg,
    marginTop: spacing.sm,
    overflow: 'hidden',
  },
  futureHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  futureIcon: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unlockRows: {
    gap: spacing.sm,
    marginTop: spacing.md,
    marginBottom: spacing.md,
  },
  unlockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  unlockBullet: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  completeStrip: {
    borderRadius: radius.lg,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  completeLeft: {
    flex: 1,
  },
  lockPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
  },
  overlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  sheet: {
    width: '100%',
    maxWidth: 380,
    borderRadius: radius.lg,
    padding: spacing.xl,
  },
});
