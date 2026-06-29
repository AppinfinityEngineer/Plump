import { View, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Screen, AppText, ProgressBar } from '@/src/components/ui';
import { Mascot, type MascotVariant } from '@/src/components/Mascot';
import { useApp, useTheme } from '@/src/state/AppProvider';
import { CHALLENGE_TEMPLATES } from '@/src/models/challenge';
import { computeProgress } from '@/src/services/challengeEngine';
import { formatGBP } from '@/src/utils/format';
import { spacing, fontSize, radius, shadow } from '@/src/theme/theme';

export default function Goals() {
  const router = useRouter();
  const { colors } = useTheme();
  const { goals, getDeposits, setActiveGoal } = useApp();
  const visible = goals.filter((g) => g.status !== 'archived');

  const open = async (id: string) => {
    await setActiveGoal(id);
    router.push(`/goal/${id}`);
  };

  return (
    <Screen edges={['top']} testID="goals-screen">
      <View style={styles.header}>
        <AppText variant="title" style={{ fontSize: fontSize['2xl'] }}>My goals</AppText>
        <Pressable
          testID="new-goal-button"
          onPress={() => router.push('/onboarding/challenge')}
          style={[styles.add, { backgroundColor: colors.brandPrimary }]}
        >
          <Ionicons name="add" size={24} color={colors.onBrandPrimary} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {visible.map((g) => {
          const deposits = getDeposits(g.id);
          const progress = computeProgress(g, deposits);
          const template = CHALLENGE_TEMPLATES[g.challengeType];
          return (
            <Pressable
              key={g.id}
              testID={`goal-card-${g.id}`}
              onPress={() => open(g.id)}
              style={[styles.card, shadow(colors), { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}
            >
              <Mascot variant={g.mascotVariant as MascotVariant} plumpness={progress.percent} size={64} />
              <View style={{ flex: 1, marginLeft: spacing.md }}>
                <AppText variant="heading">{g.name}</AppText>
                <AppText variant="caption">{template.shortName}{g.status === 'completed' ? ' · Completed' : ''}</AppText>
                <View style={{ marginTop: spacing.sm }}>
                  <ProgressBar percent={progress.percent} height={10} />
                </View>
                <AppText variant="caption" style={{ marginTop: 4 }}>
                  {formatGBP(progress.saved)} / {formatGBP(progress.target)}
                </AppText>
              </View>
            </Pressable>
          );
        })}
        <AppText variant="caption" style={{ textAlign: 'center', marginTop: spacing.lg }}>
          Tap + to start a new sinking fund or custom challenge.
        </AppText>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.xl, paddingTop: spacing.lg, paddingBottom: spacing.sm },
  add: { width: 44, height: 44, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  scroll: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xl, gap: spacing.md },
  card: { flexDirection: 'row', alignItems: 'center', borderRadius: radius.md, borderWidth: 1, padding: spacing.lg },
});
