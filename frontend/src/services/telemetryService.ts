// Fire-and-forget telemetry. Batches locally; posts when possible. Never throws.

const BACKEND = process.env.EXPO_PUBLIC_BACKEND_URL;

export type TelemetryEvent =
  | 'app_open'
  | 'onboarding_start'
  | 'challenge_selected'
  | 'challenge_style_selected'
  | 'goal_named'
  | 'mascot_customized'
  | 'card_generated'
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
  if (flushing || queue.length === 0 || !BACKEND) return;
  flushing = true;
  const batch = queue;
  queue = [];
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 3000);
    await fetch(`${BACKEND}/v1/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ events: batch }),
      signal: ctrl.signal,
    });
    clearTimeout(t);
  } catch {
    // put them back; app keeps working regardless
    queue = [...batch, ...queue];
  } finally {
    flushing = false;
  }
}
