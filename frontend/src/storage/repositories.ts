// AsyncStorage-backed repositories. The shipped storage util only persists
// primitive values, so objects/arrays are JSON-encoded into a string here.
// Clean repository interfaces so storage can be swapped later (e.g. SQLite).

import { storage } from '@/src/utils/storage';
import type { Goal } from '@/src/models/goal';
import type { Deposit } from '@/src/models/deposit';
import type { Entitlement } from '@/src/models/entitlement';
import { FREE_ENTITLEMENT } from '@/src/models/entitlement';
import type { AppSettings, OnboardingDraft } from '@/src/models/settings';
import { DEFAULT_SETTINGS } from '@/src/models/settings';
import type { ReviewState } from '@/src/models/review';
import { INITIAL_REVIEW_STATE } from '@/src/models/review';
import { normalizeDeposit, normalizeGoal } from '@/src/models/sync';

const KEYS = {
  goals: 'plump.goals',
  deposits: 'plump.deposits',
  entitlement: 'plump.entitlement',
  settings: 'plump.settings',
  review: 'plump.review',
  draft: 'plump.onboarding.draft',
} as const;

async function readJSON<T>(key: string, fallback: T): Promise<T> {
  const raw = await storage.getItem(key, null);
  if (raw === null || typeof raw !== 'string') return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

async function writeJSON<T>(key: string, value: T): Promise<void> {
  await storage.setItem(key, JSON.stringify(value));
}

export const goalRepository = {
  async list(): Promise<Goal[]> {
    const goals = await readJSON<Goal[]>(KEYS.goals, []);
    return goals.map(normalizeGoal);
  },
  async get(id: string): Promise<Goal | undefined> {
    const goals = await this.list();
    return goals.find((g) => g.id === id);
  },
  async save(goal: Goal): Promise<void> {
    const normalized = normalizeGoal(goal);
    const goals = await this.list();
    const idx = goals.findIndex((g) => g.id === normalized.id);
    if (idx >= 0) goals[idx] = normalized;
    else goals.push(normalized);
    await writeJSON(KEYS.goals, goals);
  },
  async replaceAll(goals: Goal[]): Promise<void> {
    await writeJSON(KEYS.goals, goals.map(normalizeGoal));
  },
};

export const depositRepository = {
  async list(): Promise<Deposit[]> {
    const deposits = await readJSON<Deposit[]>(KEYS.deposits, []);
    return deposits.map(normalizeDeposit);
  },
  async listForGoal(goalId: string): Promise<Deposit[]> {
    const all = await this.list();
    return all
      .filter((d) => d.goalId === goalId)
      .sort((a, b) => b.date.localeCompare(a.date));
  },
  // Deposits are append-only in V1.
  async add(deposit: Deposit): Promise<void> {
    const normalized = normalizeDeposit(deposit);
    const all = await this.list();
    all.push(normalized);
    await writeJSON(KEYS.deposits, all);
  },
  async replaceAll(deposits: Deposit[]): Promise<void> {
    await writeJSON(KEYS.deposits, deposits.map(normalizeDeposit));
  },
  async clear(): Promise<void> {
    await writeJSON(KEYS.deposits, []);
  },
};

export const entitlementRepository = {
  async get(): Promise<Entitlement> {
    return readJSON<Entitlement>(KEYS.entitlement, FREE_ENTITLEMENT);
  },
  async set(e: Entitlement): Promise<void> {
    await writeJSON(KEYS.entitlement, e);
  },
};

export const settingsRepository = {
  async get(): Promise<AppSettings> {
    return readJSON<AppSettings>(KEYS.settings, DEFAULT_SETTINGS);
  },
  async set(s: AppSettings): Promise<void> {
    await writeJSON(KEYS.settings, s);
  },
};

export const reviewPromptRepository = {
  async get(): Promise<ReviewState> {
    return readJSON<ReviewState>(KEYS.review, INITIAL_REVIEW_STATE);
  },
  async set(s: ReviewState): Promise<void> {
    await writeJSON(KEYS.review, s);
  },
};

export const onboardingDraftRepository = {
  async get(): Promise<OnboardingDraft> {
    return readJSON<OnboardingDraft>(KEYS.draft, {});
  },
  async set(d: OnboardingDraft): Promise<void> {
    await writeJSON(KEYS.draft, d);
  },
  async clear(): Promise<void> {
    await writeJSON(KEYS.draft, {});
  },
};


export async function clearAllLocalPlumpData(): Promise<void> {
  await Promise.all(Object.values(KEYS).map((key) => storage.removeItem(key)));
}
