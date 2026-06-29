export interface AppSettings {
  notificationsEnabled: boolean;
  hapticsEnabled: boolean;
  darkMode: boolean;
  onboardingComplete: boolean;
  activeGoalId?: string;
}

export const DEFAULT_SETTINGS: AppSettings = {
  notificationsEnabled: false,
  hapticsEnabled: true,
  darkMode: false,
  onboardingComplete: false,
};

// The draft the user builds during the pre-paywall onboarding.
export interface OnboardingDraft {
  challengeType?: string;
  cardPalette?: string;
  goalName?: string;
  targetAmount?: number;
  startDate?: string;
  mascotVariant?: string;
}
