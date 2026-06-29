import type { Goal } from '@/src/models/goal';
import type { ChallengeProgress } from '@/src/services/challengeEngine';
import { slotAmount } from '@/src/services/challengeEngine';

export type LuckySaveMode = 'next' | 'easy' | 'lucky' | 'bold' | 'tiny';

export interface LuckySaveSuggestion {
  mode: LuckySaveMode;
  eyebrow: string;
  title: string;
  label: string;
  amount: number;
  slot?: number;
  tagline: string;
  ctaLabel: string;
}

function stableDaySeed(goalId: string): number {
  const today = new Date();
  const stamp = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}-${goalId}`;
  return stamp.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
}

function pickSlot(slots: number[], mode: LuckySaveMode, seed: number): number | undefined {
  if (slots.length === 0) return undefined;
  const sorted = [...slots].sort((a, b) => a - b);
  if (mode === 'easy') return sorted[0];
  if (mode === 'bold') return sorted[Math.max(0, sorted.length - 1)];
  if (mode === 'lucky') return sorted[seed % sorted.length];
  return sorted[0];
}

function envelopeMode(seed: number): LuckySaveMode {
  const modes: LuckySaveMode[] = ['easy', 'lucky', 'bold'];
  return modes[seed % modes.length];
}

function envelopeCopy(mode: LuckySaveMode, slot: number): Pick<LuckySaveSuggestion, 'eyebrow' | 'title' | 'tagline' | 'ctaLabel'> {
  if (mode === 'easy') {
    return {
      eyebrow: 'EASY WIN',
      title: `Envelope ${slot}`,
      tagline: 'Small enough to do today. Cute enough to count.',
      ctaLabel: `Save envelope ${slot}`,
    };
  }
  if (mode === 'bold') {
    return {
      eyebrow: 'FEELING BOLD?',
      title: `Envelope ${slot}`,
      tagline: 'A bigger bite for a smugger Plump.',
      ctaLabel: `Take envelope ${slot}`,
    };
  }
  return {
    eyebrow: 'LUCKY SAVE',
    title: `Envelope ${slot}`,
    tagline: 'Plump picked this one for today.',
    ctaLabel: `Save lucky pick`,
  };
}

export function getLuckySaveSuggestion(goal: Goal, progress: ChallengeProgress): LuckySaveSuggestion {
  const seed = stableDaySeed(goal.id);

  if (goal.challengeType === 'envelope_100') {
    const mode = envelopeMode(seed);
    const slot = pickSlot(progress.remainingSlots, mode, seed) ?? progress.nextSuggestedSlot;
    const safeSlot = slot ?? 1;
    const amount = slotAmount(goal.challengeType, safeSlot);
    const copy = envelopeCopy(mode, safeSlot);
    return {
      mode,
      ...copy,
      label: `Envelope ${safeSlot}`,
      amount,
      slot: safeSlot,
    };
  }

  if (goal.challengeType === 'week_52') {
    const slot = progress.nextSuggestedSlot ?? progress.filledCount + 1;
    return {
      mode: 'next',
      eyebrow: 'THIS WEEK',
      title: `Week ${slot}`,
      label: `Week ${slot}`,
      amount: progress.nextSuggestedAmount,
      slot,
      tagline: 'Keep the weekly rhythm going.',
      ctaLabel: `Log week ${slot}`,
    };
  }

  if (goal.challengeType === 'penny_365') {
    const slot = progress.nextSuggestedSlot ?? progress.filledCount + 1;
    return {
      mode: 'tiny',
      eyebrow: 'TINY WIN',
      title: `Day ${slot}`,
      label: `Day ${slot}`,
      amount: progress.nextSuggestedAmount,
      slot,
      tagline: 'One tiny save. One rounder mascot.',
      ctaLabel: `Log day ${slot}`,
    };
  }

  return {
    mode: 'tiny',
    eyebrow: 'NO-SPEND WIN',
    title: 'Log today’s save',
    label: 'Saved',
    amount: progress.nextSuggestedAmount,
    tagline: 'Count the money you kept, not the thing you skipped.',
    ctaLabel: 'Log no-spend win',
  };
}

export function routeForLuckySave(goal: Goal, suggestion: LuckySaveSuggestion): string {
  if (typeof suggestion.slot === 'number') return `/goal/${goal.id}/save?slot=${suggestion.slot}`;
  return `/goal/${goal.id}/save`;
}
