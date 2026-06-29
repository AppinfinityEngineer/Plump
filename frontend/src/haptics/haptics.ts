import * as Haptics from 'expo-haptics';

let enabled = true;

export function setHapticsEnabled(value: boolean): void {
  enabled = value;
}

async function safe(fn: () => Promise<void>): Promise<void> {
  if (!enabled) return;
  try {
    await fn();
  } catch {
    // no-op when haptics unavailable (web / unsupported)
  }
}

export const haptics = {
  // satisfying "thunk" when a deposit lands
  thunk: () => safe(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)),
  light: () => safe(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)),
  medium: () => safe(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)),
  selection: () => safe(() => Haptics.selectionAsync()),
  success: () => safe(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)),
  // card reveal beat: a soft double tap
  revealBeat: async () => {
    await safe(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium));
    setTimeout(() => {
      void safe(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success));
    }, 160);
  },
};
