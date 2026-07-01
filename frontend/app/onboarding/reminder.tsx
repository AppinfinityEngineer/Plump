import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Screen, AppText, Button, OnboardingHeader } from '@/src/components/ui';
import { useApp, useTheme } from '@/src/state/AppProvider';
import { radius, spacing, shadow, fontSize } from '@/src/theme/theme';
import { haptics } from '@/src/haptics/haptics';

type ReminderPreference = 'morning' | 'lunch' | 'evening' | 'none';

const OPTIONS: Array<{ id: ReminderPreference; title: string; subtitle: string; icon: keyof typeof Ionicons.glyphMap }> = [
  { id: 'morning', title: 'Morning boost', subtitle: 'Start the day with your save in mind.', icon: 'sunny' },
  { id: 'lunch', title: 'Lunchtime nudge', subtitle: 'A midday check before spending creeps in.', icon: 'fast-food' },
  { id: 'evening', title: 'Evening check-in', subtitle: 'A calm reminder to log today’s save.', icon: 'moon' },
  { id: 'none', title: 'No reminders for now', subtitle: 'You can turn them on later in You.', icon: 'notifications-off' },
];

export default function ReminderPreferenceScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { draft, setDraft } = useApp();
  const [selected, setSelected] = useState<ReminderPreference>((draft.reminderPreference as ReminderPreference) ?? 'evening');

  const onSelect = (id: ReminderPreference) => {
    void haptics.selection();
    setSelected(id);
    void setDraft({ reminderPreference: id });
  };

  return (
    <Screen style={styles.container} testID="onboarding-reminder">
      <OnboardingHeader step={8} total={12} />
      <AppText variant="title" style={styles.title}>When should Plump nudge you?</AppText>
      <AppText variant="body" color={colors.muted} style={styles.sub}>
        Pick the moment that would make saving easiest. We will ask permission only when you turn reminders on.
      </AppText>
      <View style={styles.options}>
        {OPTIONS.map((option) => {
          const isSelected = selected === option.id;
          return (
            <Pressable key={option.id} testID={`reminder-${option.id}`} onPress={() => onSelect(option.id)}
              style={[styles.option, shadow(colors), { backgroundColor: colors.surfaceSecondary, borderColor: isSelected ? colors.brandPrimary : colors.border, borderWidth: isSelected ? 2.5 : 1 }]}>
              <View style={[styles.iconWrap, { backgroundColor: isSelected ? colors.brandPrimary : colors.surfaceTertiary }]}>
                <Ionicons name={option.icon} size={19} color={isSelected ? colors.onBrandPrimary : colors.onSurface} />
              </View>
              <View style={{ flex: 1 }}>
                <AppText variant="bodyBold">{option.title}</AppText>
                <AppText variant="caption" style={{ marginTop: 2 }}>{option.subtitle}</AppText>
              </View>
              {isSelected ? <Ionicons name="checkmark-circle" size={22} color={colors.brandPrimary} /> : null}
            </Pressable>
          );
        })}
      </View>
      <Button label="Preview plumpness" testID="reminder-continue-button" onPress={() => { void setDraft({ reminderPreference: selected }); router.push('/onboarding/preview' as never); }} />
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
