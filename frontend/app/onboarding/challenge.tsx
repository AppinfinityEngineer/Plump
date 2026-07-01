import { useState } from 'react';
import { View, StyleSheet, Pressable, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';

import { Screen, AppText, Button, OnboardingHeader, Badge } from '@/src/components/ui';
import { useApp, useTheme } from '@/src/state/AppProvider';
import { CHALLENGE_ORDER, CHALLENGE_TEMPLATES, type ChallengeType } from '@/src/models/challenge';
import { radius, spacing, shadow, fontSize, fonts } from '@/src/theme/theme';
import { formatGBP } from '@/src/utils/format';
import { haptics } from '@/src/haptics/haptics';
import { track } from '@/src/services/telemetryService';

export default function ChallengePicker() {
  const router = useRouter();
  const { colors } = useTheme();
  const { draft, setDraft } = useApp();
  const [selected, setSelected] = useState<ChallengeType | undefined>(
    draft.challengeType as ChallengeType | undefined,
  );

  const onSelect = (type: ChallengeType) => {
    void haptics.selection();
    setSelected(type);
    const t = CHALLENGE_TEMPLATES[type];
    void setDraft({ challengeType: type, targetAmount: t.totalTarget });
    track('challenge_selected', { type });
  };

  return (
    <Screen style={styles.container} testID="onboarding-challenge">
      <OnboardingHeader step={3} total={12} />
      <AppText variant="title" style={styles.title}>
        Choose your challenge
      </AppText>
      <AppText variant="body" color={colors.muted} style={styles.sub}>
        Choose the saving path you want Plump to turn into visible progress.
      </AppText>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ gap: spacing.md, paddingBottom: spacing.lg }} showsVerticalScrollIndicator={false}>
        {CHALLENGE_ORDER.map((type) => {
          const t = CHALLENGE_TEMPLATES[type];
          const isSel = selected === type;
          return (
            <Pressable
              key={type}
              testID={`challenge-${type}`}
              onPress={() => onSelect(type)}
              style={[
                styles.card,
                shadow(colors),
                {
                  backgroundColor: colors.surfaceSecondary,
                  borderColor: isSel ? colors.brandPrimary : colors.border,
                  borderWidth: isSel ? 2.5 : 1,
                },
              ]}
            >
              <View style={{ flex: 1 }}>
                <View style={styles.row}>
                  <AppText variant="heading">{t.name}</AppText>
                  {t.premium ? <Badge label="Premium" bg={colors.rosy} color={colors.onSurface} /> : null}
                  {type === 'envelope_100' ? <Badge label="Popular" bg={colors.brandTertiary} color="#25451D" /> : null}
                </View>
                <AppText variant="caption" style={{ marginTop: 2 }}>
                  {t.description}
                </AppText>
                {!t.premium ? (
                  <AppText style={{ marginTop: 6, fontFamily: fonts.bodyBold, fontSize: fontSize.base }} color={colors.brandPrimary}>
                    Save {formatGBP(t.totalTarget)}
                  </AppText>
                ) : (
                  <AppText variant="caption" style={{ marginTop: 6 }} color={colors.brand}>
                    Build your own — unlock with Pro
                  </AppText>
                )}
              </View>
            </Pressable>
          );
        })}
      </ScrollView>

      <Button
        label="Continue"
        testID="challenge-continue-button"
        disabled={!selected}
        onPress={() => router.push('/onboarding/education' as never)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: spacing.xl, paddingTop: spacing.md, paddingBottom: spacing.xl },
  title: { marginTop: spacing.lg, fontSize: fontSize['2xl'] },
  sub: { marginBottom: spacing.lg },
  card: { borderRadius: radius.md, padding: spacing.lg, flexDirection: 'row', alignItems: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexWrap: 'wrap' },
});
