import type { Deposit } from '@/src/models/deposit';
import type { Goal } from '@/src/models/goal';

import { getOrCreateDeviceId } from './deviceIdentityService';
import { signedBackendPost } from './backendClient';

export type SyncMirrorReason =
  | 'app_open'
  | 'goal_created'
  | 'goal_archived'
  | 'deposit_added'
  | 'goal_completed';

let inFlight = false;
let queued: { goals: Goal[]; deposits: Deposit[]; reason: SyncMirrorReason } | null = null;

export async function mirrorLocalState(
  goals: Goal[],
  deposits: Deposit[],
  reason: SyncMirrorReason,
): Promise<void> {
  queued = { goals, deposits, reason };
  if (inFlight) return;

  inFlight = true;

  try {
    while (queued) {
      const next = queued;
      queued = null;

      const deviceId = await getOrCreateDeviceId();
      await signedBackendPost('/api/v1/sync', {
        device_id: deviceId,
        reason: next.reason,
        goals: next.goals,
        deposits: next.deposits,
      });
    }
  } catch {
    // Local-first rule: sync mirror never blocks or breaks the app.
  } finally {
    inFlight = false;
  }
}
