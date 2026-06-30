import type { LocalSyncFields } from './sync';

export interface Deposit extends LocalSyncFields {
  id: string;
  goalId: string;
  amount: number;
  slotNumber?: number;
  date: string;
  note?: string;
  createdAt: string;
  updatedAt: string;
}
