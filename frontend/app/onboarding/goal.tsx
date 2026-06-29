import { useState } from 'react';
import { View, StyleSheet, TextInput, KeyboardAvoidingView, Platform, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';

import { Screen, AppText, Button, OnboardingHeader } from '@/src/components/ui';
import { useApp, useTheme } from '@/src/state/AppProvider';
import { CHALLENGE_TEMPLATES, type ChallengeType } from '@/src/models/challenge';
import { radius, spacing, fonts, fontSize } from '@/src/theme/theme';
import { formatGBP } from '@/src/utils/format';
import { track } from '@/src/services/telemetryService';

export default function GoalSetup() {
  const router = useRouter();
  const { colors } = useTheme();
  const { draft, setDraft } = useApp();
  const challengeType = (draft.challengeType as ChallengeType) ?? 'envelope_100';
  const template = CHALLENGE_TEMPLATES[challengeType];

  const [name, setName] = useState(draft.goalName ?? '');
  const [target, setTarget] = useState(String(draft.targetAmount ?? template.totalTarget));

  const targetNum = parseFloat(target) || template.totalTarget;
  const isFixed = template.type === 'envelope_100' || template.type === 'week_52' || template.type === 'penny_365';

  const onContinue = () => {
    void setDraft({ goalName: name.trim() || 'My savings goal', targetAmount: targetNum });
    track('goal_named', { challenge: challengeType });
    router.push('/onboarding/mascot');
  };

  return (
    <Screen style={styles.container} testID="onboarding-goal">
      <OnboardingHeader step={3} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          style={{ flex: 1 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: spacing.xl }}
        >
          <AppText variant="title" style={styles.title}>
            Name your goal
          </AppText>
          <AppText variant="body" color={colors.muted} style={styles.sub}>
            What are you plumping up for?
          </AppText>

          <AppText variant="caption" style={styles.label}>GOAL NAME</AppText>
          <TextInput
            testID="goal-name-input"
            value={name}
            onChangeText={setName}
            placeholder="Japan trip"
            placeholderTextColor={colors.muted}
            style={[styles.input, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border, color: colors.onSurface }]}
            returnKeyType="next"
          />

          <AppText variant="caption" style={styles.label}>TARGET AMOUNT</AppText>
          <View style={[styles.input, styles.amountRow, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
            <AppText style={{ fontFamily: fonts.display, fontSize: fontSize['2xl'] }} color={colors.brandPrimary}>£</AppText>
            <TextInput
              testID="goal-target-input"
              value={target}
              onChangeText={setTarget}
              keyboardType="decimal-pad"
              style={{ flex: 1, fontFamily: fonts.display, fontSize: fontSize['2xl'], color: colors.brandPrimary, marginLeft: 4 }}
            />
          </View>
          {isFixed ? (
            <Pressable onPress={() => setTarget(String(template.totalTarget))}>
              <AppText variant="caption" style={{ marginTop: spacing.sm }} color={colors.brand}>
                {template.name} suggests {formatGBP(template.totalTarget)} — tap to use
              </AppText>
            </Pressable>
          ) : null}
        </ScrollView>
        <Button label="Choose mascot" testID="goal-continue-button" onPress={onContinue} />
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: spacing.xl, paddingTop: spacing.md, paddingBottom: spacing.xl },
  title: { marginTop: spacing.lg, fontSize: fontSize['2xl'] },
  sub: { marginBottom: spacing.xl },
  label: { marginBottom: spacing.sm, marginTop: spacing.md, letterSpacing: 1 },
  input: { borderRadius: radius.md, borderWidth: 1.5, paddingHorizontal: spacing.lg, paddingVertical: spacing.md, fontFamily: fonts.body, fontSize: fontSize.lg, minHeight: 56 },
  amountRow: { flexDirection: 'row', alignItems: 'center' },
});
