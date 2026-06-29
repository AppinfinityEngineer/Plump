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

export default function SaveAction() {
  const router = useRouter();
  const { colors } = useTheme();
  const { id, slot } = useLocalSearchParams<{ id: string; slot?: string }>();
  const { goals, getDeposits, addDeposit } = useApp();
  const goal = goals.find((g) => g.id === id);

  const slotNum = slot ? parseInt(slot, 10) : undefined;
  const deposits = goal ? getDeposits(goal.id) : [];
  const progress = goal ? computeProgress(goal, deposits) : null;
  const suggested = slotNum && goal
    ? slotAmount(goal.challengeType, slotNum)
    : progress?.nextSuggestedAmount ?? 0;

  const [amount, setAmount] = useState(String(suggested));
  const [note, setNote] = useState('');
  const [done, setDone] = useState(false);
  const [milestone, setMilestone] = useState<MilestonePercent | null>(null);

  if (!goal) return null;
  const variant = goal.mascotVariant as MascotVariant;
  const amountNum = parseFloat(amount) || 0;

  const onSave = async () => {
    if (amountNum <= 0) return;
    const result = await addDeposit(goal.id, amountNum, slotNum, note.trim() || undefined);
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
        <Mascot variant={variant} plumpness={newProgress.percent} size={220} smug={newProgress.percent >= 1} />
        <AppText variant="title" style={{ textAlign: 'center', marginTop: spacing.lg, fontSize: fontSize['2xl'] }} color={colors.brandPrimary}>
          Thunk.
        </AppText>
        <AppText variant="body" style={{ textAlign: 'center' }}>Your Plump got rounder.</AppText>
        <AppText variant="number" style={{ marginTop: spacing.md }}>{formatGBP(newProgress.saved)}</AppText>
        <Button label="Done" testID="save-done-button" style={{ marginTop: spacing.xl, alignSelf: 'stretch' }} onPress={() => router.replace(`/goal/${goal.id}`)} />

        <MilestoneModal
          visible={milestone !== null}
          percent={milestone}
          mascotVariant={variant}
          onShare={() => {
            setMilestone(null);
            router.replace(`/goal/${goal.id}/card`);
          }}
          onKeepSaving={() => {
            setMilestone(null);
            router.replace(`/goal/${goal.id}`);
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
        <AppText variant="heading">{slotNum ? `Envelope ${slotNum}` : 'Log a save'}</AppText>
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

          <AppText variant="caption" style={styles.label}>NOTE (OPTIONAL)</AppText>
          <TextInput
            testID="save-note-input"
            value={note}
            onChangeText={setNote}
            placeholder="Skipped coffee + lunch deal"
            placeholderTextColor={colors.muted}
            style={[styles.noteInput, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border, color: colors.onSurface }]}
          />
        </ScrollView>
        <Button label="Thunk save" testID="thunk-save-button" disabled={amountNum <= 0} onPress={onSave} />
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.xl, paddingTop: spacing.lg, paddingBottom: spacing.sm },
  scroll: { paddingHorizontal: spacing.xl, paddingTop: spacing.xl, flexGrow: 1 },
  amountBox: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderRadius: radius.lg, borderWidth: 1.5, paddingVertical: spacing.xl, marginBottom: spacing.lg },
  label: { marginBottom: spacing.sm, letterSpacing: 1 },
  noteInput: { borderRadius: radius.md, borderWidth: 1.5, padding: spacing.lg, fontFamily: fonts.body, fontSize: fontSize.lg, minHeight: 56 },
  successWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.xl },
});
