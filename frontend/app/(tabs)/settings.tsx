import { View, StyleSheet, ScrollView, Switch, Pressable, Linking } from 'react-native';
import { useRouter } from 'expo-router';

import { Screen, AppText, Card } from '@/src/components/ui';
import { useApp, useTheme } from '@/src/state/AppProvider';
import { spacing, fontSize, radius } from '@/src/theme/theme';
import { requestNotificationPermission, cancelAllReminders } from '@/src/services/notifications';

function Row({ label, sublabel, right, onPress, testID }: { label: string; sublabel?: string; right?: React.ReactNode; onPress?: () => void; testID?: string }) {
  const { colors } = useTheme();
  return (
    <Pressable onPress={onPress} testID={testID} style={[styles.row, { borderBottomColor: colors.border }]}>
      <View style={{ flex: 1 }}>
        <AppText variant="bodyBold">{label}</AppText>
        {sublabel ? <AppText variant="caption">{sublabel}</AppText> : null}
      </View>
      {right}
    </Pressable>
  );
}

export default function Settings() {
  const router = useRouter();
  const { colors } = useTheme();
  const { settings, entitlement, updateSettings, restore, resetDemoState } = useApp();

  const statusLabel =
    entitlement.status === 'lifetime' ? 'Lifetime · active'
    : entitlement.status === 'trial' ? 'Annual trial · active'
    : entitlement.status === 'active' ? 'Monthly · active'
    : 'Free';

  const toggleNotifications = async (value: boolean) => {
    if (value) {
      const granted = await requestNotificationPermission();
      await updateSettings({ notificationsEnabled: granted });
    } else {
      await cancelAllReminders();
      await updateSettings({ notificationsEnabled: false });
    }
  };

  return (
    <Screen edges={['top']} testID="settings-screen">
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <AppText variant="title" style={{ fontSize: fontSize['2xl'], marginBottom: spacing.lg }}>You</AppText>

        <Card style={{ marginBottom: spacing.lg, padding: spacing.lg }}>
          <AppText variant="heading" color={colors.brandPrimary}>Plump Pro</AppText>
          <AppText variant="caption" style={{ marginTop: 2 }}>{statusLabel}</AppText>
        </Card>

        <Card style={{ padding: 0, marginBottom: spacing.lg }}>
          <Row label="Restore purchases" testID="settings-restore" onPress={() => restore()} />
          <Row
            label="Manage subscription"
            testID="settings-manage"
            onPress={() => Linking.openURL('https://apps.apple.com/account/subscriptions')}
          />
          <Row
            label="Notifications"
            sublabel="Gentle cadence reminders"
            right={<Switch testID="settings-notifications" value={settings.notificationsEnabled} onValueChange={toggleNotifications} trackColor={{ true: colors.brandPrimary }} />}
          />
          <Row
            label="Haptics"
            right={<Switch testID="settings-haptics" value={settings.hapticsEnabled} onValueChange={(v) => updateSettings({ hapticsEnabled: v })} trackColor={{ true: colors.brandPrimary }} />}
          />
          <Row
            label="Dark mode"
            right={<Switch testID="settings-darkmode" value={settings.darkMode} onValueChange={(v) => updateSettings({ darkMode: v })} trackColor={{ true: colors.brandPrimary }} />}
          />
        </Card>

        <Card style={{ padding: 0, marginBottom: spacing.lg }}>
          <Row label="Export ledger" sublabel="Coming soon" testID="settings-export" />
          <Row label="Privacy policy" testID="settings-privacy" onPress={() => Linking.openURL('https://plump.app/privacy')} />
          <Row label="Terms of use" testID="settings-terms" onPress={() => Linking.openURL('https://plump.app/terms')} />
        </Card>

        {__DEV__ ? (
          <Card style={{ padding: 0, marginBottom: spacing.lg }}>
            <Row
              label="Reset everything / start onboarding"
              sublabel="Factory reset local test data, card, saves, entitlement and onboarding state."
              testID="settings-hard-reset-demo"
              onPress={async () => {
                await resetDemoState();
                router.replace('/onboarding' as never);
              }}
            />
          </Card>
        ) : null}

        <AppText variant="caption" style={{ textAlign: 'center', marginTop: spacing.md }}>
          Plump · plump.app{'\n'}A ThoughtSnap Labs product
        </AppText>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: spacing.xl, paddingTop: spacing.lg, paddingBottom: spacing.xl },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.lg, borderBottomWidth: 1, minHeight: 56 },
});
