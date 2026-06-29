import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Screen, AppText, Button, OnboardingHeader } from '@/src/components/ui';
import { Mascot, MASCOT_VARIANTS, type MascotVariant } from '@/src/components/Mascot';
import { useApp, useTheme } from '@/src/state/AppProvider';
import { radius, spacing, shadow, fontSize } from '@/src/theme/theme';
import { haptics } from '@/src/haptics/haptics';
import { track } from '@/src/services/telemetryService';

const MASCOT_CHOICES: MascotVariant[] = [
  'honey',
  'sage',
  'rosy',
  'cocoa',
  'mint',
  'blueberry',
  'lavender',
  'strawberry',
  'charcoal',
  'golden',
];

export default function MascotSetup() {
  const router = useRouter();
  const { colors } = useTheme();
  const { draft, setDraft } = useApp();
  const initial = (draft.mascotVariant as MascotVariant) ?? 'honey';
  const [selected, setSelected] = useState<MascotVariant>(initial);

  const onSelect = (variant: MascotVariant) => {
    void haptics.selection();
    setSelected(variant);
    void setDraft({ mascotVariant: variant });
    track('mascot_customized', { variant });
  };

  const onContinue = () => {
    void setDraft({ mascotVariant: selected });
    router.push('/onboarding/preview' as never);
  };

  return (
    <Screen style={styles.container} testID="onboarding-mascot">
      <OnboardingHeader step={6} total={10} />

      <AppText variant="title" style={styles.title}>
        Choose your Plump
      </AppText>
      <AppText variant="body" color={colors.muted} style={styles.sub}>
        Pick the colour that feels like yours. This little one grows with every save.
      </AppText>

      <View style={[styles.featured, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
        <Mascot variant={selected} plumpness={0.28} size={132} interactive />
        <View style={{ flex: 1 }}>
          <AppText variant="caption">SELECTED MASCOT</AppText>
          <AppText variant="heading">{MASCOT_VARIANTS[selected].name}</AppText>
          <AppText variant="caption" style={{ marginTop: spacing.xs }}>
            Tap your mascot later for tiny reactions.
          </AppText>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.grid}
        showsVerticalScrollIndicator={false}
      >
        {MASCOT_CHOICES.map((variant) => {
          const isSelected = selected === variant;
          return (
            <Pressable
              key={variant}
              testID={`mascot-choice-${variant}`}
              onPress={() => onSelect(variant)}
              style={[
                styles.choice,
                shadow(colors),
                {
                  backgroundColor: colors.surfaceSecondary,
                  borderColor: isSelected ? colors.brandPrimary : colors.border,
                  borderWidth: isSelected ? 2.5 : 1,
                },
              ]}
            >
              {isSelected ? (
                <View style={[styles.check, { backgroundColor: colors.brandPrimary }]}>
                  <Ionicons name="checkmark" size={14} color={colors.onBrandPrimary} />
                </View>
              ) : null}
              <Mascot variant={variant} plumpness={0.12} size={78} motion="none" interactive={false} />
              <AppText variant="caption" style={{ textAlign: 'center', marginTop: spacing.xs }}>
                {MASCOT_VARIANTS[variant].name.replace(' Plump', '')}
              </AppText>
            </Pressable>
          );
        })}
      </ScrollView>

      <Button label="Preview plumpness" testID="mascot-continue-button" onPress={onContinue} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
  },
  title: {
    marginTop: spacing.lg,
    fontSize: fontSize['2xl'],
    textAlign: 'center',
  },
  sub: {
    textAlign: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
    lineHeight: 23,
  },
  featured: {
    borderRadius: radius.lg,
    borderWidth: 1.5,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    marginBottom: spacing.lg,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    paddingBottom: spacing.xl,
  },
  choice: {
    width: '47%',
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 142,
  },
  check: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
});
