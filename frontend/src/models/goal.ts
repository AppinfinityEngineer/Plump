import type { ChallengeType, Cadence } from './challenge';
import type { LocalSyncFields } from './sync';

export type GoalStatus = 'active' | 'completed' | 'archived';

export interface Goal extends LocalSyncFields {
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
