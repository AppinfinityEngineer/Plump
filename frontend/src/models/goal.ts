import type { ChallengeType, Cadence } from './challenge';

export type GoalStatus = 'active' | 'completed' | 'archived';

export interface Goal {
  id: string;
  challengeType: ChallengeType;
  name: string;
  targetAmount: number;
  mascotVariant: string;
  colorTheme: string;
  cadence: Cadence;
  startDate: string;
  status: GoalStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Streak {
  current: number;
  longest: number;
  lastSaveDate?: string;
}
