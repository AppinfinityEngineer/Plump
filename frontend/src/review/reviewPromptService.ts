// Weighted native review system. Request-only, never blocks, never incentivises,
// never shames, never asks after a negative action.

import * as StoreReview from 'expo-store-review';

import { reviewPromptRepository } from '@/src/storage/repositories';
import type { ReviewState } from '@/src/models/review';
import { getConfig } from '@/src/services/remoteConfigService';

export type PositiveEvent =
  | 'card_generated'
  | 'first_deposit'
  | 'milestone_25'
  | 'milestone_50'
  | 'goal_completed';

const EVENT_WEIGHTS: Record<PositiveEvent, number> = {
  card_generated: 50,
  first_deposit: 30,
  milestone_25: 60,
  milestone_50: 70,
  goal_completed: 100,
};

const THRESHOLD = 50;
const MIN_DAYS_BETWEEN = 21;
const MAX_LIFETIME = 3;

export async function recordPositiveEvent(event: PositiveEvent): Promise<void> {
  const state = await reviewPromptRepository.get();
  const next: ReviewState = {
    ...state,
    score: state.score + EVENT_WEIGHTS[event],
    events: [...state.events, event],
  };
  await reviewPromptRepository.set(next);
}

function eligible(state: ReviewState): boolean {
  if (!getConfig().reviewPromptEnabled) return false;
  if (state.score < THRESHOLD) return false;
  if (state.lifetimeRequests >= MAX_LIFETIME) return false;
  if (state.lastRequestedAt) {
    const days = (Date.now() - new Date(state.lastRequestedAt).getTime()) / 86400000;
    if (days < MIN_DAYS_BETWEEN) return false;
  }
  return true;
}

// Returns true if the in-app "cheeky" pre-prompt should be shown.
export async function shouldShowReviewAsk(): Promise<boolean> {
  const state = await reviewPromptRepository.get();
  return eligible(state);
}

// Fire the native review request. Caps are recorded regardless of whether the
// OS actually shows the sheet.
export async function requestNativeReview(): Promise<void> {
  const state = await reviewPromptRepository.get();
  await reviewPromptRepository.set({
    ...state,
    lastRequestedAt: new Date().toISOString(),
    lifetimeRequests: state.lifetimeRequests + 1,
    score: 0,
  });
  try {
    const available = await StoreReview.isAvailableAsync();
    if (available) await StoreReview.requestReview();
  } catch {
    // request-only; never block the flow
  }
}
