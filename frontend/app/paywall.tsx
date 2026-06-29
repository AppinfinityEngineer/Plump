import { useEffect, useState } from 'react';
import { View, StyleSheet, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Screen, AppText, Badge } from '@/src/components/ui';
import { Mascot } from '@/src/components/Mascot';
import { useApp, useTheme } from '@/src/state/AppProvider';
import { radius, spacing, shadow, fontSize, fonts } from '@/src/theme/theme';
import { haptics } from '@/src/haptics/haptics';
import { track } from '@/src/services/telemetryService';
import type { PlumpProductId } from '@/src/services/iapService';

type PlanId = PlumpProductId;

export default function Paywall() {
  const router = useRouter();
  const { colors, config, purchase, restore } = useApp();
  const [selected, setSelected] = useState<PlanId>('plump.annual');
  const [busy, setBusy] = useState<PlanId | 'restore' | null>(null);

  useEffect(() => {
    track('paywall_shown');
    track('paywall_variant_assigned', { variant: config.paywallVariant });
  }, [config.paywallVariant]);

  const goPaid = () => router.replace('/(tabs)');

  const onPurchase = async (plan: PlanId) => {
    void haptics.medium();
    setBusy(plan);
    const result = await purchase(plan);
    setBusy(null);
    if (result.success) {
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

  return (
    <Screen style={styles.container} testID="paywall">
      <Pressable onPress={onDismiss} style={styles.close} testID="paywall-close-button" hitSlop={12}>
        <Ionicons name="close" size={26} color={colors.muted} />
      </Pressable>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: spacing.xl }}>
        <View style={{ alignItems: 'center', marginTop: spacing.sm }}>
          <Mascot variant="honey" plumpness={0.85} size={120} />
        </View>
        <AppText variant="title" style={styles.headline} color={colors.brandPrimary}>
          Start filling your Plump card
        </AppText>
        <AppText variant="body" color={colors.muted} style={styles.sub}>
          You designed it. Now make it real.
        </AppText>

        {/* Annual hero */}
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
            Less than two envelopes to help you finish all 100. ~£2.50/month.
          </AppText>
        </Pressable>

        {/* Monthly anchor */}
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

        {/* Lifetime alt */}
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
          £29.99 to save £5,050 · your savings challenge, made cute enough to actually finish.
        </AppText>
      </ScrollView>

      {/* Primary CTA reflects the selected plan */}
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
            {selected === 'plump.annual' ? 'Start 3-day free trial' : selected === 'plump.monthly' ? 'Continue monthly' : 'Unlock lifetime'}
          </AppText>
        )}
      </Pressable>

      <Pressable onPress={onRestore} style={styles.restore} testID="paywall-restore-button" disabled={busy !== null}>
        <AppText variant="caption" color={colors.brandPrimary}>
          {busy === 'restore' ? 'Restoring…' : 'Restore purchases'}
        </AppText>
      </Pressable>

      <AppText variant="caption" style={styles.legal}>
        Auto-renews unless cancelled at least 24 hours before the end of the current period. Manage or cancel anytime in your App Store account settings. Terms · Privacy.
      </AppText>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: spacing.xl, paddingTop: spacing.lg, paddingBottom: spacing.md },
  close: { position: 'absolute', top: spacing.lg, right: spacing.lg, zIndex: 10, padding: 4 },
  headline: { textAlign: 'center', fontSize: fontSize['2xl'], marginTop: spacing.sm },
  sub: { textAlign: 'center', marginBottom: spacing.lg },
  hero: { borderRadius: radius.lg, padding: spacing.xl, marginBottom: spacing.md },
  plan: { borderRadius: radius.md, padding: spacing.lg, marginBottom: spacing.md, flexDirection: 'row', alignItems: 'center' },
  planRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  paradox: { textAlign: 'center', marginTop: spacing.sm, lineHeight: 20 },
  cta: { height: 58, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center', marginTop: spacing.sm },
  restore: { alignItems: 'center', paddingVertical: spacing.md },
  legal: { textAlign: 'center', fontSize: 11, lineHeight: 16 },
});
