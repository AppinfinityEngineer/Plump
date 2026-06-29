import React from 'react';
import { Modal, View, StyleSheet } from 'react-native';

import { Mascot, type MascotVariant } from '@/src/components/Mascot';
import { Confetti } from '@/src/components/Confetti';
import { AppText, Button } from '@/src/components/ui';
import { useTheme } from '@/src/state/AppProvider';
import { radius, spacing } from '@/src/theme/theme';
import type { MilestonePercent } from '@/src/services/challengeEngine';

export function MilestoneModal({
  visible,
  percent,
  mascotVariant,
  onShare,
  onKeepSaving,
}: {
  visible: boolean;
  percent: MilestonePercent | null;
  mascotVariant: MascotVariant;
  onShare: () => void;
  onKeepSaving: () => void;
}) {
  const { colors } = useTheme();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onKeepSaving}>
      <View style={[styles.overlay, { backgroundColor: colors.overlay }]}>
        <Confetti play={visible} />
        <View style={[styles.sheet, { backgroundColor: colors.surfaceSecondary }]} testID="milestone-modal">
          <AppText variant="display" style={{ textAlign: 'center' }} color={colors.brandPrimary}>
            {percent ?? 0}%!
          </AppText>
          <AppText variant="heading" style={{ textAlign: 'center', marginTop: spacing.xs }}>
            Your mascot got rounder
          </AppText>
          <View style={{ alignItems: 'center', marginVertical: spacing.lg }}>
            <Mascot variant={mascotVariant} plumpness={(percent ?? 0) / 100} size={180} />
          </View>
          <Button label="Share milestone" onPress={onShare} testID="milestone-share-button" />
          <View style={{ height: spacing.md }} />
          <Button label="Keep saving" variant="secondary" onPress={onKeepSaving} testID="milestone-keep-button" />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  sheet: { width: '100%', maxWidth: 380, borderRadius: radius.lg, padding: spacing.xl },
});
