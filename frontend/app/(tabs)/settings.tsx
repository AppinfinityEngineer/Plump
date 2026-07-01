import { View, StyleSheet, ScrollView, Switch, Pressable, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Screen, AppText, Card, Badge } from '@/src/components/ui';
import { Mascot, type MascotVariant } from '@/src/components/Mascot';
import { useApp, useTheme } from '@/src/state/AppProvider';
import { spacing, fontSize, radius, shadow } from '@/src/theme/theme';
import { requestNotificationPermission, scheduleCadenceReminder, cancelAllReminders } from '@/src/services/notifications';

const TERMS_URL = 'https://www.apple.com/legal/internet-services/itunes/dev/stdeula/';
const PRIVACY_URL = 'https://docs.google.com/document/d/e/2PACX-1vQzXNr50T8jjdN3oYoszMwBshdex7y3PSh0a3p7tE6zEKG5Jb4k8dEmXLeVYYdr2T3bnqjJJIJQxQ5S/pub';

function Row({
  icon,
  label,
  sublabel,
  right,
  onPress,
  testID,
  muted,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  sublabel?: string;
  right?: React.ReactNode;
  onPress?: () => void;
  testID?: string;
  muted?: boolean;
}) {
  const { colors, isDark } = useTheme();
  const separatorColor = isDark ? 'rgba(251,244,233,0.10)' : colors.border;
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      testID={testID}
      style={({ pressed }) => [
        styles.row,
        { borderBottomColor: separatorColor, opacity: muted ? 0.7 : pressed ? 0.85 : 1 },
      ]}
    >
      <View style={[styles.rowIcon, { backgroundColor: colors.surfaceTertiary }]}>
        <Ionicons name={icon} size={18} color={colors.brandPrimary} />
      </View>
      <View style={{ flex: 1 }}>
        <AppText variant="bodyBold">{label}</AppText>
        {sublabel ? <AppText variant="caption" style={{ marginTop: 2 }}>{sublabel}</AppText> : null}
      </View>
      {right ?? (onPress ? <Ionicons name="chevron-forward" size={18} color={colors.muted} /> : null)}
    </Pressable>
  );
}

export default function Settings() {
  const { colors } = useTheme();
  const { settings, entitlement, updateSettings, restore, activeGoal } = useApp();

  const statusLabel =
    entitlement.status === 'lifetime' ? 'Lifetime unlock active'
    : entitlement.status === 'trial' ? 'Annual access active'
    : entitlement.status === 'active' ? 'Monthly access active'
    : 'Locked';

  const ownerName = activeGoal?.ownerName?.trim();
  const title = ownerName ? `${ownerName}'s Plump` : 'Your Plump';

  const toggleNotifications = async (value: boolean) => {
    if (value) {
      const granted = await requestNotificationPermission();
      if (granted) {
        await scheduleCadenceReminder('Quick check-in: log today’s save and keep your Plump growing.');
      }
      await updateSettings({ notificationsEnabled: granted });
    } else {
      await cancelAllReminders();
      await updateSettings({ notificationsEnabled: false });
    }
  };

  return (
    <Screen edges={['top']} testID="settings-screen">
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <AppText variant="title" style={styles.pageTitle}>You</AppText>

        <View style={[styles.heroCard, shadow(colors), { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
          <View style={styles.heroTop}>
            <Mascot variant={(activeGoal?.mascotVariant as MascotVariant) ?? 'honey'} plumpness={0.72} size={82} smug />
            <View style={{ flex: 1 }}>
              <AppText variant="heading">{title}</AppText>
              <AppText variant="caption" style={{ marginTop: 2 }}>
                {activeGoal ? activeGoal.name : 'Savings challenge tracker'}
              </AppText>
              <View style={{ marginTop: spacing.sm, alignSelf: 'flex-start' }}>
                <Badge label={statusLabel} bg={colors.brandTertiary} color="#25451D" />
              </View>
            </View>
          </View>
          <AppText variant="caption" style={styles.heroCopy}>
            Plump keeps your savings progress on this device. You move money in your own bank, pot, binder, or envelope.
          </AppText>
        </View>

        <Card style={styles.section}>
          <Row icon="refresh" label="Restore purchases" testID="settings-restore" onPress={() => restore()} />
          <Row
            icon="card"
            label="Manage subscription"
            sublabel="Open your Apple subscription settings"
            testID="settings-manage"
            onPress={() => Linking.openURL('https://apps.apple.com/account/subscriptions')}
          />
        </Card>

        <Card style={styles.section}>
          <Row
            icon="notifications"
            label="Notifications"
            sublabel="Daily 7pm reminder to log your save"
            right={<Switch testID="settings-notifications" value={settings.notificationsEnabled} onValueChange={toggleNotifications} trackColor={{ true: colors.brandPrimary }} />}
          />
          <Row
            icon="sparkles"
            label="Haptics"
            sublabel="Tiny taps when you save, reveal, and complete"
            right={<Switch testID="settings-haptics" value={settings.hapticsEnabled} onValueChange={(v) => updateSettings({ hapticsEnabled: v })} trackColor={{ true: colors.brandPrimary }} />}
          />
          <Row
            icon="moon"
            label="Dark mode"
            sublabel="Switch Plump into a softer dark theme"
            right={<Switch testID="settings-darkmode" value={settings.darkMode} onValueChange={(v) => updateSettings({ darkMode: v })} trackColor={{ true: colors.brandPrimary }} />}
          />
        </Card>

        <Card style={styles.section}>
          <Row
            icon="cloud-upload"
            label="Cloud Sync"
            sublabel="Coming in version 2 — sync your Plump card across devices"
            testID="settings-cloud-sync"
            muted
          />
          <Row
            icon="document-text"
            label="Export ledger"
            sublabel="Coming soon — export your save history"
            testID="settings-export"
            muted
          />
        </Card>

        <Card style={styles.section}>
          <Row icon="shield-checkmark" label="Privacy policy" testID="settings-privacy" onPress={() => Linking.openURL(PRIVACY_URL)} />
          <Row icon="reader" label="Terms of use" testID="settings-terms" onPress={() => Linking.openURL(TERMS_URL)} />
        </Card>
<AppText variant="caption" style={styles.footer}>
          Plump: Saving Challenges{'\n'}A ThoughtSnap Labs product
        </AppText>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: spacing.xl, paddingTop: spacing.lg, paddingBottom: spacing.xl },
  pageTitle: { fontSize: fontSize['2xl'], marginBottom: spacing.lg },
  heroCard: { borderRadius: radius.lg, borderWidth: 1.5, padding: spacing.lg, marginBottom: spacing.lg },
  heroTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  heroCopy: { marginTop: spacing.md, lineHeight: 19 },
  section: { padding: 0, marginBottom: spacing.lg, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.lg, paddingVertical: spacing.lg, borderBottomWidth: 1, minHeight: 68 },
  rowIcon: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  footer: { textAlign: 'center', marginTop: spacing.sm, lineHeight: 20 },
});
