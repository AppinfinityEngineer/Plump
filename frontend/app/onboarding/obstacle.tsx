import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Screen, AppText, Button, OnboardingHeader } from '@/src/components/ui';
import { useApp, useTheme } from '@/src/state/AppProvider';
import { radius, spacing, shadow, fontSize } from '@/src/theme/theme';
import { haptics } from '@/src/haptics/haptics';

type SavingBlocker = 'forget' | 'small_spends' | 'drop_off' | 'boring' | 'next_save';

const BLOCKERS: Array<{ id: SavingBlocker; title: string; subtitle: string; icon: keyof typeof Ionicons.glyphMap }> = [
  { id: 'forget', title: 'I forget to save', subtitle: 'A gentle nudge would keep me moving.', icon: 'notifications' },
  { id: 'small_spends', title: 'Little spends leak out', subtitle: 'I want to notice the money I could keep.', icon: 'cafe' },
  { id: 'drop_off', title: 'I start strong, then stop', subtitle: 'I need progress to stay visible.', icon: 'trending-down' },
  { id: 'boring', title: 'Saving feels boring', subtitle: 'I want it to feel more like a game.', icon: 'sparkles' },
  { id: 'next_save', title: 'I never know what to save next', subtitle: 'I want Plump to pick the next step.', icon: 'shuffle' },
];

export default function SavingObstacle() {
  const router = useRouter();
  const { colors } = useTheme();
  const { draft, setDraft } = useApp();
  const [selected, setSelected] = useState<SavingBlocker>((draft.savingBlocker as SavingBlocker) ?? 'forget');

  const onSelect = (id: SavingBlocker) => {
    void haptics.selection();
    setSelected(id);
    void setDraft({ savingBlocker: id });
  };

  return (
    <Screen style={styles.container} testID="onboarding-obstacle">
      <OnboardingHeader step={2} total={12} />
      <AppText variant="title" style={styles.title}>What usually gets in the way?</AppText>
      <AppText variant="body" color={colors.muted} style={styles.sub}>
        Plump works best when it knows the habit you are trying to beat.
      </AppText>
      <View style={styles.options}>
        {BLOCKERS.map((blocker) => {
          const isSelected = selected === blocker.id;
          return (
            <Pressable key={blocker.id} testID={`saving-blocker-${blocker.id}`} onPress={() => onSelect(blocker.id)}
              style={[styles.option, shadow(colors), { backgroundColor: colors.surfaceSecondary, borderColor: isSelected ? colors.brandPrimary : colors.border, borderWidth: isSelected ? 2.5 : 1 }]}>
              <View style={[styles.iconWrap, { backgroundColor: isSelected ? colors.brandPrimary : colors.surfaceTertiary }]}>
                <Ionicons name={blocker.icon} size={19} color={isSelected ? colors.onBrandPrimary : colors.onSurface} />
              </View>
              <View style={{ flex: 1 }}>
                <AppText variant="bodyBold">{blocker.title}</AppText>
                <AppText variant="caption" style={{ marginTop: 2 }}>{blocker.subtitle}</AppText>
              </View>
              {isSelected ? <Ionicons name="checkmark-circle" size={22} color={colors.brandPrimary} /> : null}
            </Pressable>
          );
        })}
      </View>
      <Button label="Choose challenge" testID="obstacle-continue-button" onPress={() => { void setDraft({ savingBlocker: selected }); router.push('/onboarding/challenge' as never); }} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: spacing.xl, paddingTop: spacing.md, paddingBottom: spacing.xl },
  title: { marginTop: spacing.lg, fontSize: fontSize['2xl'], textAlign: 'center' },
  sub: { textAlign: 'center', marginTop: spacing.sm, marginBottom: spacing.lg, lineHeight: 23 },
  options: { flex: 1, gap: spacing.md },
  option: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, borderRadius: radius.md, padding: spacing.lg },
  iconWrap: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
});
