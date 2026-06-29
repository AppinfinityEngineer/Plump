import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Screen, AppText, Button, OnboardingHeader, Badge } from '@/src/components/ui';
import { Mascot } from '@/src/components/Mascot';
import { useApp, useTheme } from '@/src/state/AppProvider';
import { radius, spacing, shadow, fontSize } from '@/src/theme/theme';
import { haptics } from '@/src/haptics/haptics';
import { track } from '@/src/services/telemetryService';

type SavingReason = 'holiday' | 'emergency' | 'christmas' | 'glow_up';

const REASONS: Array<{
  id: SavingReason;
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
}> = [
  { id: 'holiday', title: 'A dream trip', subtitle: 'Turn small saves into a flight, hotel, or adventure fund.', icon: 'airplane' },
  { id: 'emergency', title: 'A safety cushion', subtitle: 'Build calm money you can see growing.', icon: 'shield-checkmark' },
  { id: 'christmas', title: 'Christmas / gifts', subtitle: 'Stop future-you getting ambushed by December.', icon: 'gift' },
  { id: 'glow_up', title: 'My money glow-up', subtitle: 'I just want saving to finally feel good.', icon: 'sparkles' },
];

export default function SavingsPersonality() {
  const router = useRouter();
  const { colors } = useTheme();
  const { draft, setDraft } = useApp();
  const [selected, setSelected] = useState<SavingReason>((draft.savingReason as SavingReason) ?? 'holiday');

  const onSelect = (id: SavingReason) => {
    void haptics.selection();
    setSelected(id);
    void setDraft({ savingReason: id });
    track('onboarding_saving_reason_selected', { reason: id });
  };

  return (
    <Screen style={styles.container} testID="onboarding-personality">
      <OnboardingHeader step={1} total={10} />
      <View style={styles.hero}>
        <Mascot variant="honey" plumpness={0.18} size={118} />
        <Badge label="Step 1 of your savings identity" bg={colors.brandTertiary} color="#25451D" />
      </View>

      <AppText variant="title" style={styles.title}>
        What are you saving for?
      </AppText>
      <AppText variant="body" color={colors.muted} style={styles.sub}>
        Plump works better when your card has a reason. Make it feel personal before the paywall ever appears.
      </AppText>

      <View style={styles.options}>
        {REASONS.map((reason) => {
          const isSelected = selected === reason.id;
          return (
            <Pressable
              key={reason.id}
              testID={`saving-reason-${reason.id}`}
              onPress={() => onSelect(reason.id)}
              style={[
                styles.option,
                shadow(colors),
                {
                  backgroundColor: colors.surfaceSecondary,
                  borderColor: isSelected ? colors.brandPrimary : colors.border,
                  borderWidth: isSelected ? 2.5 : 1,
                },
              ]}
            >
              <View style={[styles.iconWrap, { backgroundColor: isSelected ? colors.brandPrimary : colors.surfaceTertiary }]}>
                <Ionicons name={reason.icon} size={20} color={isSelected ? colors.onBrandPrimary : colors.onSurface} />
              </View>
              <View style={{ flex: 1 }}>
                <AppText variant="bodyBold">{reason.title}</AppText>
                <AppText variant="caption" style={{ marginTop: 2 }}>{reason.subtitle}</AppText>
              </View>
              {isSelected ? <Ionicons name="checkmark-circle" size={22} color={colors.brandPrimary} /> : null}
            </Pressable>
          );
        })}
      </View>

      <Button
        label="Choose challenge"
        testID="personality-continue-button"
        onPress={() => {
          void setDraft({ savingReason: selected });
          router.push('/onboarding/challenge');
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: spacing.xl, paddingTop: spacing.md, paddingBottom: spacing.xl },
  hero: { alignItems: 'center', gap: spacing.sm, marginTop: spacing.sm },
  title: { marginTop: spacing.lg, fontSize: fontSize['2xl'], textAlign: 'center' },
  sub: { textAlign: 'center', marginTop: spacing.sm, marginBottom: spacing.lg, lineHeight: 23 },
  options: { flex: 1, gap: spacing.md },
  option: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, borderRadius: radius.md, padding: spacing.lg },
  iconWrap: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
});
