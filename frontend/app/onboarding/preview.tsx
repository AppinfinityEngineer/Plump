import { useState } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';

import { Screen, AppText, Button, OnboardingHeader } from '@/src/components/ui';
import { Mascot, type MascotVariant } from '@/src/components/Mascot';
import { useApp, useTheme } from '@/src/state/AppProvider';
import { radius, spacing, fontSize } from '@/src/theme/theme';
import { haptics } from '@/src/haptics/haptics';

const STATES = [
  { label: 'Scrawny', value: 0.05 },
  { label: 'Normal', value: 0.35 },
  { label: 'Round', value: 0.6 },
  { label: 'Chubby', value: 0.85 },
  { label: 'Smug', value: 1 },
];

export default function PlumpPreview() {
  const router = useRouter();
  const { colors } = useTheme();
  const { draft } = useApp();
  const variant = (draft.mascotVariant as MascotVariant) ?? 'honey';
  const [idx, setIdx] = useState(0);

  return (
    <Screen style={styles.container} testID="onboarding-preview">
      <OnboardingHeader step={5} />
      <AppText variant="title" style={styles.title}>
        Watch them plump up
      </AppText>
      <AppText variant="body" color={colors.muted} style={styles.sub}>
        The more you save, the rounder and smugger they get.
      </AppText>

      <View style={styles.hero}>
        <Mascot variant={variant} plumpness={STATES[idx].value} size={220} smug={idx === STATES.length - 1} />
        <AppText variant="heading" style={{ marginTop: spacing.md }} color={colors.brandPrimary}>
          {STATES[idx].label}
        </AppText>
      </View>

      <View style={styles.segments}>
        {STATES.map((s, i) => (
          <Pressable
            key={s.label}
            testID={`plump-state-${i}`}
            onPress={() => {
              void haptics.selection();
              setIdx(i);
            }}
            style={[
              styles.segment,
              { backgroundColor: i === idx ? colors.brandPrimary : colors.surfaceSecondary, borderColor: colors.border },
            ]}
          >
            <AppText variant="caption" color={i === idx ? colors.onBrandPrimary : colors.muted}>
              {Math.round(s.value * 100)}%
            </AppText>
          </Pressable>
        ))}
      </View>

      <Button label="Generate my card" testID="preview-generate-button" onPress={() => router.push('/onboarding/card-reveal')} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: spacing.xl, paddingTop: spacing.md, paddingBottom: spacing.xl },
  title: { marginTop: spacing.lg, fontSize: fontSize['2xl'] },
  sub: { marginBottom: spacing.md },
  hero: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  segments: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.xl, justifyContent: 'space-between' },
  segment: { flex: 1, height: 44, borderRadius: radius.pill, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
});
