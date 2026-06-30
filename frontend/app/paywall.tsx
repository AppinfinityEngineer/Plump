import { useEffect, useState } from 'react';
import { View, StyleSheet, Pressable, ScrollView, ActivityIndicator, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Screen, AppText, Badge } from '@/src/components/ui';
import { Mascot, type MascotVariant } from '@/src/components/Mascot';
import { PlumpCard } from '@/src/components/PlumpCard';
import { useApp, useTheme } from '@/src/state/AppProvider';
import { radius, spacing, shadow, fontSize, fonts, type CardPaletteId } from '@/src/theme/theme';
import { haptics } from '@/src/haptics/haptics';
import { track } from '@/src/services/telemetryService';
import type { PlumpProductId } from '@/src/services/iapService';
import { CHALLENGE_TEMPLATES } from '@/src/models/challenge';

type PlanId = PlumpProductId;

type PaywallMode = 'dev' | 'testflight' | 'review' | 'production';

// Keep this as 'dev' while building so we do not lock ourselves out.
// Before App Review / production release, switch to 'review' or 'production' so the hard paywall has no visible X.
const PAYWALL_MODE: PaywallMode = 'dev';

const TERMS_URL = 'https://www.apple.com/legal/internet-services/itunes/dev/stdeula/';
const PRIVACY_URL = 'https://docs.google.com/document/d/e/2PACX-1vQzXNr50T8jjdN3oYoszMwBshdex7y3PSh0a3p7tE6zEKG5Jb4k8dEmXLeVYYdr2T3bnqjJJIJQxQ5S/pub';

function shouldShowPaywallClose(mode: PaywallMode): boolean {
  return mode === 'dev' || mode === 'testflight';
}


const PREMIUM = {
  blush: '#F8DED2',
  sage: '#DDECCF',
  ivory: '#FFF9EF',
  cocoa: '#5A3F2B',
  gold: '#DDAA43',
};

export default function Paywall() {
  const router = useRouter();
  const { colors, config, purchase, restore, activeGoal, isPro } = useApp();
  const { colors: themedColors } = useTheme();
  const [selected, setSelected] = useState<PlanId>('plump.annual');
  const [busy, setBusy] = useState<PlanId | 'restore' | null>(null);

  const template = activeGoal ? CHALLENGE_TEMPLATES[activeGoal.challengeType] : CHALLENGE_TEMPLATES.envelope_100;
  const goalName = activeGoal?.name ?? 'My savings goal';
  const target = activeGoal?.targetAmount ?? template.totalTarget;
  const mascotVariant = (activeGoal?.mascotVariant as MascotVariant) ?? 'honey';
  const palette = (activeGoal?.colorTheme as CardPaletteId) ?? 'cream';
  const showClose = shouldShowPaywallClose(PAYWALL_MODE);

  useEffect(() => {
    track('paywall_shown');
    track('paywall_variant_assigned', { variant: config.paywallVariant });
  }, [config.paywallVariant]);

  const goPaid = () => router.replace('/(tabs)');

  useEffect(() => {
    if (isPro) goPaid();
  }, [isPro]);

  const onPurchase = async (plan: PlanId) => {
    void haptics.medium();
    setBusy(plan);
    const result = await purchase(plan);
    setBusy(null);
    if (result.success && result.entitlement) {
      void haptics.success();
      goPaid();
    }
  };

  const onRestore = async () => {
    setBusy('restore');
    const result = await restore();
    setBusy(null);
    if (result.success) goPaid();
  };

  const onDismiss = () => {
    track('paywall_dismissed');
    router.replace('/holding');
  };

  const openLegalLink = (url: string) => {
    void Linking.openURL(url);
  };

  return (
    <Screen style={styles.container} testID="paywall">
      {showClose ? (
        <Pressable onPress={onDismiss} style={styles.close} testID="paywall-close-button" hitSlop={12}>
          <Ionicons name="close" size={26} color={colors.muted} />
        </Pressable>
      ) : null}

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={styles.topper}>
          <Badge label="PAID APP UNLOCK" bg={PREMIUM.sage} color={PREMIUM.cocoa} />
          <Mascot variant={mascotVariant} plumpness={0.82} size={92} smug />
        </View>

        <AppText variant="title" style={styles.headline} color={colors.brandPrimary}>
          Unlock Plump
        </AppText>
        <AppText variant="body" color={colors.muted} style={styles.sub}>
          Plump is a paid savings challenge app. Choose a subscription or lifetime unlock to continue with saving challenges, mascot progress, and share cards.
        </AppText>

        <View style={[styles.previewPanel, { backgroundColor: PREMIUM.ivory, borderColor: PREMIUM.blush }]}>
          <View style={{ transform: [{ scale: 0.82 }] }}>
            <PlumpCard
              goalName={goalName}
              challengeName={template.shortName}
              saved={0}
              target={target}
              percent={0}
              mascotVariant={mascotVariant}
              palette={palette}
              subline="Locked · ready to fill"
              width={270}
            />
          </View>
          <View style={styles.previewCopy}>
            <AppText variant="bodyBold" style={{ color: PREMIUM.cocoa }}>Unlock the app you just created</AppText>
            <AppText variant="caption" style={{ marginTop: 3 }}>
              Your card is ready. Payment is required to use Plump after onboarding.
            </AppText>
          </View>
        </View>

        <View style={styles.benefitStack}>
          <Benefit icon="checkbox" title="Log every save" body="Envelopes, penny days, weekly saves and no-spend wins become your progress history." />
          <Benefit icon="happy" title="Watch the mascot plump up" body="The mascot is the progress bar — cute enough to keep coming back." />
          <Benefit icon="share-social" title="Share progress cards" body="Every card is built for screenshots, social proof and motivation." />
        </View>

        <Pressable
          testID="plan-annual"
          onPress={() => setSelected('plump.annual')}
          style={[
            styles.hero,
            shadow(colors),
            { backgroundColor: colors.surfaceSecondary, borderColor: selected === 'plump.annual' ? colors.brandPrimary : colors.border, borderWidth: selected === 'plump.annual' ? 3 : 1 },
          ]}
        >
          <View style={styles.planRow}>
            <AppText variant="heading">Annual</AppText>
            <Badge label="Best value" bg={colors.brandTertiary} color="#25451D" />
          </View>
          <AppText variant="number" style={{ fontSize: fontSize['3xl'], marginTop: spacing.xs }}>
            3 days free
          </AppText>
          <AppText variant="bodyBold" style={{ marginTop: 2 }}>
            Then {config.prices.annual}
          </AppText>
          <AppText variant="caption" style={{ marginTop: spacing.sm }}>
            Less than two envelopes to help you finish a {template.shortName} card.
          </AppText>
        </Pressable>

        <Pressable
          testID="plan-monthly"
          onPress={() => setSelected('plump.monthly')}
          style={[styles.plan, { backgroundColor: colors.surfaceSecondary, borderColor: selected === 'plump.monthly' ? colors.brandPrimary : colors.border, borderWidth: selected === 'plump.monthly' ? 2.5 : 1 }]}
        >
          <View style={{ flex: 1 }}>
            <View style={styles.planRow}>
              <AppText variant="bodyBold">Monthly</AppText>
              <Badge label="Flexible" bg={colors.belly} color={colors.onSurface} />
            </View>
            <AppText variant="caption" style={{ marginTop: 2 }}>{config.prices.monthly} · No trial</AppText>
          </View>
        </Pressable>

        <Pressable
          testID="plan-lifetime"
          onPress={() => setSelected('plump.lifetime')}
          style={[styles.plan, { backgroundColor: colors.surfaceSecondary, borderColor: selected === 'plump.lifetime' ? colors.brandPrimary : colors.border, borderWidth: selected === 'plump.lifetime' ? 2.5 : 1 }]}
        >
          <View style={{ flex: 1 }}>
            <View style={styles.planRow}>
              <AppText variant="bodyBold">Lifetime</AppText>
              <Badge label="Pay once" bg={colors.rosy} color={colors.onSurface} />
            </View>
            <AppText variant="caption" style={{ marginTop: 2 }}>{config.prices.lifetime} · Pay once, plump forever</AppText>
          </View>
        </Pressable>

        <AppText variant="caption" style={styles.paradox} color={colors.brand}>
          Built to help you finish {goalName} — not just start another savings idea.
        </AppText>
      </ScrollView>

      <Pressable
        testID="paywall-cta-button"
        onPress={() => onPurchase(selected)}
        disabled={busy !== null}
        style={({ pressed }) => [styles.cta, { backgroundColor: colors.brandPrimary, opacity: busy ? 0.7 : pressed ? 0.9 : 1 }]}
      >
        {busy && busy !== 'restore' ? (
          <ActivityIndicator color={colors.onBrandPrimary} />
        ) : (
          <AppText style={{ fontFamily: fonts.displaySemi, fontSize: fontSize.xl }} color={colors.onBrandPrimary}>
            {selected === 'plump.annual' ? 'Start filling with 3 days free' : selected === 'plump.monthly' ? 'Continue monthly' : 'Unlock lifetime'}
          </AppText>
        )}
      </Pressable>

      <Pressable onPress={onRestore} style={styles.restore} testID="paywall-restore-button" disabled={busy !== null}>
        <AppText variant="caption" color={colors.brandPrimary}>
          {busy === 'restore' ? 'Restoring…' : 'Restore purchases'}
        </AppText>
      </Pressable>

      <View style={styles.legalBox}>
        <AppText variant="caption" style={styles.legal}>
          Subscriptions renew automatically unless cancelled at least 24 hours before renewal. Payment is charged to your Apple ID. Manage or cancel anytime in your Apple ID subscriptions.
        </AppText>
        <AppText variant="caption" style={styles.legal}>
          Lifetime unlock is a one-time purchase for this Apple ID.
        </AppText>
        <View style={styles.legalLinks}>
          <Pressable onPress={() => openLegalLink(TERMS_URL)} testID="paywall-terms-link" hitSlop={8}>
            <AppText variant="caption" color={colors.brandPrimary}>Terms</AppText>
          </Pressable>
          <AppText variant="caption" color={colors.muted}>•</AppText>
          <Pressable onPress={() => openLegalLink(PRIVACY_URL)} testID="paywall-privacy-link" hitSlop={8}>
            <AppText variant="caption" color={colors.brandPrimary}>Privacy Policy</AppText>
          </Pressable>
        </View>
      </View>
    </Screen>
  );
}

function Benefit({ icon, title, body }: { icon: keyof typeof Ionicons.glyphMap; title: string; body: string }) {
  return (
    <View style={styles.benefit}>
      <View style={[styles.benefitIcon, { backgroundColor: PREMIUM.blush }]}>
        <Ionicons name={icon} size={15} color={PREMIUM.cocoa} />
      </View>
      <View style={{ flex: 1 }}>
        <AppText variant="bodyBold" style={{ color: PREMIUM.cocoa }}>{title}</AppText>
        <AppText variant="caption" style={{ marginTop: 2 }}>{body}</AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: spacing.xl, paddingTop: spacing.lg, paddingBottom: spacing.md },
  close: { position: 'absolute', top: spacing.lg, right: spacing.lg, zIndex: 10, padding: 4 },
  scroll: { paddingBottom: spacing.xl },
  topper: { alignItems: 'center', marginTop: spacing.sm, gap: spacing.xs },
  headline: { textAlign: 'center', fontSize: fontSize['2xl'], marginTop: spacing.sm },
  sub: { textAlign: 'center', marginTop: spacing.xs, marginBottom: spacing.lg, lineHeight: 22 },
  previewPanel: { borderRadius: radius.lg, borderWidth: 1.5, padding: spacing.md, marginBottom: spacing.lg, alignItems: 'center', overflow: 'hidden' },
  previewCopy: { marginTop: -spacing.lg, paddingHorizontal: spacing.md, paddingBottom: spacing.sm, alignItems: 'center' },
  benefitStack: { gap: spacing.sm, marginBottom: spacing.lg },
  benefit: { flexDirection: 'row', gap: spacing.md, alignItems: 'center' },
  benefitIcon: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  hero: { borderRadius: radius.lg, padding: spacing.xl, marginBottom: spacing.md },
  plan: { borderRadius: radius.md, padding: spacing.lg, marginBottom: spacing.md, flexDirection: 'row', alignItems: 'center' },
  planRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  paradox: { textAlign: 'center', marginTop: spacing.sm, lineHeight: 20 },
  cta: { height: 58, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center', marginTop: spacing.sm },
  restore: { alignItems: 'center', paddingVertical: spacing.md },
  legalBox: { gap: spacing.xs, paddingBottom: spacing.xs },
  legal: { textAlign: 'center', fontSize: 11, lineHeight: 16 },
  legalLinks: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
});
