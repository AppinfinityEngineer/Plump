import { useState } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';

import { Screen, AppText, Button, ProgressDots } from '@/src/components/ui';
import { Mascot, MASCOT_VARIANTS, type MascotVariant } from '@/src/components/Mascot';
import { useApp, useTheme } from '@/src/state/AppProvider';
import { radius, spacing, shadow, fontSize } from '@/src/theme/theme';
import { haptics } from '@/src/haptics/haptics';
import { track } from '@/src/services/telemetryService';

const VARIANTS: MascotVariant[] = ['honey', 'sage', 'rosy', 'cocoa'];

export default function MascotPicker() {
  const router = useRouter();
  const { colors } = useTheme();
  const { draft, setDraft } = useApp();
  const [selected, setSelected] = useState<MascotVariant>((draft.mascotVariant as MascotVariant) ?? 'honey');

  const onSelect = (v: MascotVariant) => {
    void haptics.selection();
    setSelected(v);
    void setDraft({ mascotVariant: v });
    track('mascot_customized', { variant: v });
  };

  return (
    <Screen style={styles.container} testID="onboarding-mascot">
      <ProgressDots total={7} index={4} />
      <AppText variant="title" style={styles.title}>
        Meet your Plump
      </AppText>
      <AppText variant="body" color={colors.muted} style={styles.sub}>
        Pick the little one who grows with your savings.
      </AppText>

      <View style={styles.hero}>
        <Mascot variant={selected} plumpness={0.55} size={200} />
        <AppText variant="heading" style={{ marginTop: spacing.sm }}>
          {MASCOT_VARIANTS[selected].name}
        </AppText>
      </View>

      <View style={styles.grid}>
        {VARIANTS.map((v) => {
          const isSel = selected === v;
          return (
            <Pressable
              key={v}
              testID={`mascot-${v}`}
              onPress={() => onSelect(v)}
              style={[
                styles.tile,
                shadow(colors),
                { backgroundColor: colors.surfaceSecondary, borderColor: isSel ? colors.brandPrimary : colors.border, borderWidth: isSel ? 2.5 : 1 },
              ]}
            >
              <Mascot variant={v} plumpness={0.6} size={72} />
            </Pressable>
          );
        })}
      </View>

      <Button label="Continue" testID="mascot-continue-button" onPress={() => router.push('/onboarding/preview')} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: spacing.xl, paddingTop: spacing.md, paddingBottom: spacing.xl },
  title: { marginTop: spacing.lg, fontSize: fontSize['2xl'] },
  sub: { marginBottom: spacing.md },
  hero: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  grid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.xl, gap: spacing.sm },
  tile: { flex: 1, aspectRatio: 1, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
});
