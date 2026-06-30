// Fire-and-forget telemetry. Batches locally; posts when possible. Never throws.

import { backendMirrorConfigured, signedBackendPost } from './backendClient';

export type TelemetryEvent =
  | 'app_open'
  | 'onboarding_start'
  | 'challenge_selected'
  | 'challenge_style_selected'
  | 'goal_named'
  | 'mascot_customized'
  | 'card_generated'
  | 'onboarding_saving_reason_selected'
  | 'card_generation_started'
  | 'card_generation_ready'
  | 'review_prompt_shown'
  | 'review_prompt_accepted'
  | 'review_prompt_dismissed'
  | 'paywall_shown'
  | 'paywall_variant_assigned'
  | 'trial_started'
  | 'purchase_completed'
  | 'lifetime_purchase_completed'
  | 'restore_tapped'
  | 'restore_completed'
  | 'paywall_dismissed'
  | 'holding_state_shown'
  | 'blocked_action_paywall_triggered'
  | 'deposit_made'
  | 'envelope_filled'
  | 'milestone_hit'
  | 'card_shared'
  | 'goal_completed'
  | 'streak_milestone';

interface QueuedEvent {
  name: TelemetryEvent;
  props?: Record<string, string | number | boolean>;
  ts: string;
}

let queue: QueuedEvent[] = [];
let flushing = false;

export function track(
  name: TelemetryEvent,
  props?: Record<string, string | number | boolean>,
): void {
  queue.push({ name, props, ts: new Date().toISOString() });
  void flush();
}

async function flush(): Promise<void> {
  if (flushing || queue.length === 0 || !backendMirrorConfigured()) return;
  flushing = true;
  const batch = queue;
  queue = [];
  try {
    const ok = await signedBackendPost('/api/v1/events', { events: batch });
    if (!ok) throw new Error('telemetry mirror failed');
  } catch {
    // put them back; app keeps working regardless
    queue = [...batch, ...queue];
  } finally {
    flushing = false;
  }
}
