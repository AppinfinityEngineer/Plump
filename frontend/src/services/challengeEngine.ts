import { CHALLENGE_TEMPLATES, type ChallengeTemplate, type ChallengeType } from '@/src/models/challenge';
import type { Deposit } from '@/src/models/deposit';
import type { Goal, Streak } from '@/src/models/goal';

export interface ChallengeProgress {
  saved: number;
  target: number;
  remaining: number;
  percent: number; // 0..1
  filledSlots: number[];
  remainingSlots: number[];
  nextSuggestedSlot?: number;
  nextSuggestedAmount: number;
  totalSlots: number;
  filledCount: number;
  remainingCount: number;
  projectedFinish?: string;
  plumpness: number; // 0..1 mascot roundness
  milestone?: MilestonePercent;
}

export type MilestonePercent = 10 | 25 | 50 | 75 | 90 | 100;
export const MILESTONES: MilestonePercent[] = [10, 25, 50, 75, 90, 100];

export function getTemplate(type: ChallengeType): ChallengeTemplate {
  return CHALLENGE_TEMPLATES[type];
}

export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function computeStreak(deposits: Deposit[]): Streak {
  if (deposits.length === 0) return { current: 0, longest: 0 };
  const days = Array.from(
    new Set(deposits.map((d) => d.date.slice(0, 10))),
  ).sort();
  let longest = 1;
  let run = 1;
  for (let i = 1; i < days.length; i++) {
    const prev = new Date(days[i - 1]);
    const cur = new Date(days[i]);
    const diff = Math.round((cur.getTime() - prev.getTime()) / 86400000);
    if (diff === 1) run += 1;
    else run = 1;
    if (run > longest) longest = run;
  }
  // current streak counts back from latest save day
  let current = 1;
  for (let i = days.length - 1; i > 0; i--) {
    const prev = new Date(days[i - 1]);
    const cur = new Date(days[i]);
    const diff = Math.round((cur.getTime() - prev.getTime()) / 86400000);
    if (diff === 1) current += 1;
    else break;
  }
  return { current, longest, lastSaveDate: days[days.length - 1] };
}

export function getStreak(deposits: Deposit[]): Streak {
  return computeStreak(deposits);
}

export function computeProgress(goal: Goal, deposits: Deposit[]): ChallengeProgress {
  const template = getTemplate(goal.challengeType);
  const target = goal.targetAmount || template.totalTarget;
  const saved = round2(deposits.reduce((sum, d) => sum + d.amount, 0));
  const remaining = round2(Math.max(0, target - saved));
  const percent = target > 0 ? Math.min(1, saved / target) : 0;

  const slots = template.slots ?? [];
  const filledSlots = Array.from(
    new Set(
      deposits
        .map((d) => d.slotNumber)
        .filter((s): s is number => typeof s === 'number' && Number.isFinite(s)),
    ),
  ).sort((a, b) => a - b);
  const filledSet = new Set(filledSlots);
  const remainingSlots = slots.filter((s) => !filledSet.has(s));

  let nextSuggestedSlot: number | undefined;
  let nextSuggestedAmount: number;
  if (slots.length > 0) {
    nextSuggestedSlot = remainingSlots[0];
    nextSuggestedAmount = slotAmount(goal.challengeType, nextSuggestedSlot ?? 1);
  } else if (goal.challengeType === 'penny_365') {
    const day = deposits.length + 1;
    nextSuggestedSlot = day;
    nextSuggestedAmount = round2(day / 100);
  } else {
    nextSuggestedAmount = remaining > 0 ? Math.min(20, remaining) : 0;
  }

  const projectedFinish = projectFinish(goal, deposits, remaining);

  return {
    saved,
    target,
    remaining,
    percent,
    filledSlots,
    remainingSlots,
    nextSuggestedSlot,
    nextSuggestedAmount,
    totalSlots: slots.length || (goal.challengeType === 'penny_365' ? 365 : 0),
    filledCount: slots.length > 0 ? filledSlots.length : deposits.length,
    remainingCount: Math.max(
      0,
      (slots.length || (goal.challengeType === 'penny_365' ? 365 : 0)) - (slots.length > 0 ? filledSlots.length : deposits.length),
    ),
    projectedFinish,
    plumpness: percent,
    milestone: highestMilestone(percent),
  };
}

export function slotAmount(type: ChallengeType, slot: number): number {
  switch (type) {
    case 'envelope_100':
      return slot;
    case 'week_52':
      return slot;
    case 'penny_365':
      return round2(slot / 100);
    default:
      return slot;
  }
}

function projectFinish(goal: Goal, deposits: Deposit[], remaining: number): string | undefined {
  if (remaining <= 0) return undefined;
  if (deposits.length === 0) return undefined;
  const avgPerDay = deposits.reduce((s, d) => s + d.amount, 0) / Math.max(1, deposits.length);
  const cadenceDays = goal.cadence === 'weekly' ? 7 : 1;
  const remainingSaves = Math.ceil(remaining / Math.max(1, avgPerDay));
  const days = remainingSaves * cadenceDays;
  const finish = new Date();
  finish.setDate(finish.getDate() + days);
  return finish.toISOString();
}

function highestMilestone(percent: number): MilestonePercent | undefined {
  const p = percent * 100;
  let hit: MilestonePercent | undefined;
  for (const m of MILESTONES) {
    if (p >= m) hit = m;
  }
  return hit;
}

// Which milestone (if any) was newly crossed moving from before->after saved.
export function newlyCrossedMilestone(
  beforeSaved: number,
  afterSaved: number,
  target: number,
): MilestonePercent | undefined {
  if (target <= 0) return undefined;
  const beforeP = (beforeSaved / target) * 100;
  const afterP = (afterSaved / target) * 100;
  let crossed: MilestonePercent | undefined;
  for (const m of MILESTONES) {
    if (beforeP < m && afterP >= m) crossed = m;
  }
  return crossed;
}

// Mascot plumpness "state name" for art selection.
export type PlumpState = 'scrawny' | 'normal' | 'round' | 'chubby' | 'smug';
export function plumpState(percent: number): PlumpState {
  const p = percent * 100;
  if (p < 20) return 'scrawny';
  if (p < 50) return 'normal';
  if (p < 75) return 'round';
  if (p < 100) return 'chubby';
  return 'smug';
}
