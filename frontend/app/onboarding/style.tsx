import { useState } from 'react';
import { View, StyleSheet, Pressable, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';

import { Screen, AppText, Button, OnboardingHeader } from '@/src/components/ui';
import { useApp, useTheme } from '@/src/state/AppProvider';
import { CARD_PALETTES, type CardPaletteId, radius, spacing, shadow, fontSize, fonts } from '@/src/theme/theme';
import { haptics } from '@/src/haptics/haptics';
import { track } from '@/src/services/telemetryService';

const PALETTE_ORDER: CardPaletteId[] = ['cream', 'green', 'pink', 'honey', 'dark'];

export default function StylePreview() {
  const router = useRouter();
  const { colors } = useTheme();
  const { draft, setDraft } = useApp();
  const [selected, setSelected] = useState<CardPaletteId>((draft.cardPalette as CardPaletteId) ?? 'cream');

  const onSelect = (id: CardPaletteId) => {
    void haptics.selection();
    setSelected(id);
    void setDraft({ cardPalette: id });
    track('challenge_style_selected', { palette: id });
  };

  const preview = CARD_PALETTES[selected];

  return (
    <Screen style={styles.container} testID="onboarding-style">
      <OnboardingHeader step={2} />
      <AppText variant="title" style={styles.title}>
        Pick your card style
      </AppText>
      <AppText variant="body" color={colors.muted} style={styles.sub}>
        This is the look of your envelopes and share card.
      </AppText>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: spacing.lg }}>
        {/* envelope grid preview */}
        <View style={[styles.previewCard, { backgroundColor: preview.bg }]}>
          <AppText style={{ fontFamily: fonts.bodySemi, fontSize: fontSize.sm, color: preview.sub, marginBottom: spacing.sm }}>
            ENVELOPE PREVIEW
          </AppText>
          <View style={styles.grid}>
            {Array.from({ length: 24 }).map((_, i) => (
              <View
                key={i}
                style={[
                  styles.envelope,
                  { backgroundColor: i < 6 ? preview.accent : preview.accent + '22', borderColor: preview.accent + '55' },
                ]}
              />
            ))}
          </View>
        </View>

        <View style={styles.chips}>
          {PALETTE_ORDER.map((id) => {
            const p = CARD_PALETTES[id];
            const isSel = selected === id;
            return (
              <Pressable
                key={id}
                testID={`style-${id}`}
                onPress={() => onSelect(id)}
                style={[
                  styles.chip,
                  shadow(colors),
                  { backgroundColor: colors.surfaceSecondary, borderColor: isSel ? colors.brandPrimary : colors.border, borderWidth: isSel ? 2.5 : 1 },
                ]}
              >
                <View style={[styles.swatch, { backgroundColor: p.bg, borderColor: p.accent }]} />
                <AppText variant="bodyBold" style={{ flex: 1 }}>{p.name}</AppText>
                {isSel ? <AppText color={colors.brandPrimary} variant="bodyBold">✓</AppText> : null}
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      <Button label="Continue" testID="style-continue-button" onPress={() => router.push('/onboarding/goal')} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: spacing.xl, paddingTop: spacing.md, paddingBottom: spacing.xl },
  title: { marginTop: spacing.lg, fontSize: fontSize['2xl'] },
  sub: { marginBottom: spacing.lg },
  previewCard: { borderRadius: radius.md, padding: spacing.lg, marginBottom: spacing.lg },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  envelope: { width: 34, height: 26, borderRadius: 6, borderWidth: 1 },
  chips: { gap: spacing.sm },
  chip: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, borderRadius: radius.md, padding: spacing.md },
  swatch: { width: 36, height: 36, borderRadius: 10, borderWidth: 2 },
});
