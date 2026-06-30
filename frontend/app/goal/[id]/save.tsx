import { useState } from 'react';
import { View, StyleSheet, TextInput, Pressable, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Screen, AppText, Button } from '@/src/components/ui';
import { Mascot, type MascotVariant } from '@/src/components/Mascot';
import { Confetti } from '@/src/components/Confetti';
import { MilestoneModal } from '@/src/components/MilestoneModal';
import { useApp, useTheme } from '@/src/state/AppProvider';
import { computeProgress, slotAmount, type MilestonePercent } from '@/src/services/challengeEngine';
import { spacing, fontSize, radius, fonts } from '@/src/theme/theme';
import { formatGBP } from '@/src/utils/format';
import { haptics } from '@/src/haptics/haptics';

function stepLabel(challengeType: string, slot?: number): string {
  if (!slot) return 'Log a save';
  if (challengeType === 'envelope_100') return `Envelope ${slot}`;
  if (challengeType === 'week_52') return `Week ${slot}`;
  if (challengeType === 'penny_365') return `Day ${slot}`;
  return 'Log a save';
}


function saveButtonLabel(challengeType: string): string {
  if (challengeType === 'envelope_100') return 'Fill envelope';
  if (challengeType === 'week_52') return 'Log this week';
  if (challengeType === 'penny_365') return "Log today's penny";
  if (challengeType === 'no_spend') return 'Log no-spend win';
  return 'Save it';
}

function notePlaceholder(challengeType: string): string {
  if (challengeType === 'no_spend') return 'Skipped the takeaway and kept the money';
  if (challengeType === 'penny_365') return 'Tiny save done';
  if (challengeType === 'envelope_100') return 'Moved it to my envelope or savings pot';
  return 'Moved it to my savings pot';
}

function successTitle(challengeType: string): string {
  if (challengeType === 'no_spend') return 'Money kept.';
  if (challengeType === 'penny_365') return 'Tiny win.';
  if (challengeType === 'envelope_100') return 'Envelope filled.';
  return 'Save logged.';
}

function successCopy(challengeType: string): string {
  if (challengeType === 'no_spend') return 'That no-spend win just plumped your progress.';
  if (challengeType === 'penny_365') return 'Small save. Rounder Plump.';
  if (challengeType === 'envelope_100') return 'Your envelope history just got cleaner.';
  return 'Your Plump got rounder.';
}

function duplicateCopy(challengeType: string): string {
  if (challengeType === 'envelope_100') return 'Envelope already filled';
  if (challengeType === 'week_52') return 'Week already logged';
  if (challengeType === 'penny_365') return 'Day already logged';
  return 'Save already logged';
}

export default function SaveAction() {
  const router = useRouter();
  const { colors } = useTheme();
  const params = useLocalSearchParams<{ id?: string | string[]; slot?: string | string[] }>();
  const rawId = Array.isArray(params.id) ? params.id[0] : params.id;
  const rawSlot = Array.isArray(params.slot) ? params.slot[0] : params.slot;
  const { goals, getDeposits, addDeposit } = useApp();
  const goal = goals.find((g) => g.id === rawId);

  const parsedSlot = rawSlot ? parseInt(rawSlot, 10) : undefined;
  const explicitSlotNum = Number.isFinite(parsedSlot) ? parsedSlot : undefined;
  const deposits = goal ? getDeposits(goal.id) : [];
  const progress = goal ? computeProgress(goal, deposits) : null;
  const supportsNumberedPath = goal
    ? goal.challengeType === 'envelope_100' || goal.challengeType === 'week_52' || goal.challengeType === 'penny_365'
    : false;
  const effectiveSlotNum = explicitSlotNum ?? (supportsNumberedPath ? progress?.nextSuggestedSlot : undefined);
  const isSlotAlreadyFilled = effectiveSlotNum !== undefined && (progress?.filledSlots.includes(effectiveSlotNum) ?? false);
  const suggested = effectiveSlotNum !== undefined && goal
    ? slotAmount(goal.challengeType, effectiveSlotNum)
    : progress?.nextSuggestedAmount ?? 0;

  const [amount, setAmount] = useState(String(suggested));
  const [note, setNote] = useState('');
  const [done, setDone] = useState(false);
  const [milestone, setMilestone] = useState<MilestonePercent | null>(null);

  if (!goal) {
    return (
      <Screen style={styles.successWrap} testID="save-goal-not-found">
        <AppText variant="heading" style={{ textAlign: 'center' }}>Goal not found</AppText>
        <Button label="Back to goals" variant="secondary" style={{ marginTop: spacing.xl, alignSelf: 'stretch' }} onPress={() => router.replace('/(tabs)/goals')} />
      </Screen>
    );
  }
  const variant = goal.mascotVariant as MascotVariant;
  const amountNum = parseFloat(amount) || 0;

  const onSave = async () => {
    if (amountNum <= 0 || isSlotAlreadyFilled) return;
    const result = await addDeposit(goal.id, amountNum, effectiveSlotNum, note.trim() || undefined);
    void haptics.thunk();
    setDone(true);
    if (result.milestone) setMilestone(result.milestone);
  };

  if (done) {
    const newDeposits = getDeposits(goal.id);
    const newProgress = computeProgress(goal, newDeposits);
    return (
      <Screen style={styles.successWrap} testID="save-success">
        <Confetti play={!milestone} />
        <Mascot variant={variant} plumpness={newProgress.percent} size={220} smug={newProgress.percent >= 1} motion="success" />
        <AppText variant="title" style={{ textAlign: 'center', marginTop: spacing.lg, fontSize: fontSize['2xl'] }} color={colors.brandPrimary}>
          {successTitle(goal.challengeType)}
        </AppText>
        <AppText variant="body" style={{ textAlign: 'center' }}>{successCopy(goal.challengeType)}</AppText>
        <AppText variant="number" style={{ marginTop: spacing.md }}>{formatGBP(newProgress.saved)}</AppText>
        <AppText variant="caption" style={{ textAlign: 'center', marginTop: spacing.xs }}>
          {formatGBP(newProgress.remaining)} left to finish {goal.name}.
        </AppText>
        <Button
          label="View progress"
          testID="save-done-button"
          style={{ marginTop: spacing.xl, alignSelf: 'stretch' }}
          onPress={() => router.replace(`/goal/${goal.id}/envelopes`)}
        />
        <Button
          label="Back to dashboard"
          variant="secondary"
          testID="save-home-button"
          style={{ marginTop: spacing.sm, alignSelf: 'stretch' }}
          onPress={() => router.replace('/(tabs)')}
        />

        <MilestoneModal
          visible={milestone !== null}
          percent={milestone}
          mascotVariant={variant}
          challengeType={goal.challengeType}
          goalName={goal.name}
          onShare={() => {
            setMilestone(null);
            router.replace(`/goal/${goal.id}/card`);
          }}
          onKeepSaving={() => {
            setMilestone(null);
            router.replace(`/goal/${goal.id}/envelopes`);
          }}
        />
      </Screen>
    );
  }

  return (
    <Screen edges={['top']} testID="save-screen">
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} testID="save-back-button" hitSlop={12}>
          <Ionicons name="close" size={26} color={colors.onSurface} />
        </Pressable>
        <AppText variant="heading">{stepLabel(goal.challengeType, effectiveSlotNum)}</AppText>
        <View style={{ width: 26 }} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={[styles.amountBox, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
            <AppText style={{ fontFamily: fonts.display, fontSize: fontSize['4xl'] }} color={colors.brandPrimary}>£</AppText>
            <TextInput
              testID="save-amount-input"
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
              style={{ fontFamily: fonts.display, fontSize: fontSize['4xl'], color: colors.brandPrimary, minWidth: 120, textAlign: 'center' }}
            />
          </View>

          <AppText variant="caption" style={styles.helperCopy}>
            This should match the money you actually moved into your savings pot, envelope, or account.
          </AppText>

          {isSlotAlreadyFilled ? (
            <View style={[styles.warningBox, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
              <AppText variant="bodyBold" color={colors.brandPrimary}>{duplicateCopy(goal.challengeType)}</AppText>
              <AppText variant="caption" style={{ marginTop: 2 }}>Pick the next available save to keep the ledger clean.</AppText>
            </View>
          ) : null}

          <AppText variant="caption" style={styles.label}>NOTE (OPTIONAL)</AppText>
          <TextInput
            testID="save-note-input"
            value={note}
            onChangeText={setNote}
            placeholder={notePlaceholder(goal.challengeType)}
            placeholderTextColor={colors.muted}
            style={[styles.noteInput, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border, color: colors.onSurface }]}
          />
        </ScrollView>
        <View style={styles.safeButtonWrap}>
          <Button label={saveButtonLabel(goal.challengeType)} testID="thunk-save-button" disabled={amountNum <= 0 || isSlotAlreadyFilled} onPress={onSave} />
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.xl, paddingTop: spacing.lg, paddingBottom: spacing.sm },
  scroll: { paddingHorizontal: spacing.xl, paddingTop: spacing.xl, paddingBottom: spacing.xxl, flexGrow: 1 },
  amountBox: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderRadius: radius.lg, borderWidth: 1.5, paddingVertical: spacing.xxl, marginBottom: spacing.xl },
  label: { marginBottom: spacing.sm, letterSpacing: 1 },
  helperCopy: { textAlign: 'center', marginTop: -spacing.md, marginBottom: spacing.xl, lineHeight: 19 },
  noteInput: { borderRadius: radius.md, borderWidth: 1.5, padding: spacing.lg, fontFamily: fonts.body, fontSize: fontSize.lg, minHeight: 60 },
  safeButtonWrap: { paddingHorizontal: spacing.xl, paddingBottom: spacing.lg },
  warningBox: { borderRadius: radius.md, borderWidth: 1.5, padding: spacing.lg, marginBottom: spacing.lg },
  successWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.xl },
});
