import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { lightColors, darkColors, type ColorScheme } from '@/src/theme/theme';
import type { AppSettings, OnboardingDraft } from '@/src/models/settings';
import { DEFAULT_SETTINGS } from '@/src/models/settings';
import type { Entitlement } from '@/src/models/entitlement';
import { FREE_ENTITLEMENT } from '@/src/models/entitlement';
import type { Goal } from '@/src/models/goal';
import type { Deposit } from '@/src/models/deposit';
import { CHALLENGE_TEMPLATES, type ChallengeType } from '@/src/models/challenge';
import {
  goalRepository,
  depositRepository,
  settingsRepository,
  entitlementRepository,
  onboardingDraftRepository,
  clearAllLocalPlumpData,
  reviewPromptRepository,
} from '@/src/storage/repositories';
import {
  fetchRemoteConfig,
  fallbackConfig,
  type RemoteConfig,
} from '@/src/services/remoteConfigService';
import {
  initIAP,
  loadProducts,
  purchaseProduct,
  restorePurchases,
  listenForPurchaseUpdates,
  type PlumpProductId,
  type PlumpProduct,
  type PurchaseResult,
} from '@/src/services/iapService';
import { isProEntitlement } from '@/src/services/entitlementService';
import { setHapticsEnabled } from '@/src/haptics/haptics';
import { newlyCrossedMilestone, slotAmount, type MilestonePercent } from '@/src/services/challengeEngine';
import { recordPositiveEvent } from '@/src/review/reviewPromptService';
import { track } from '@/src/services/telemetryService';
import { INITIAL_REVIEW_STATE } from '@/src/models/review';
import { mirrorLocalState } from '@/src/services/syncMirrorService';
import { makeSyncFields, touchSyncFields } from '@/src/models/sync';

function uid(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

interface SaveResult {
  deposit: Deposit;
  milestone?: MilestonePercent;
  completed: boolean;
}

interface AppContextValue {
  ready: boolean;
  colors: ColorScheme;
  isDark: boolean;
  settings: AppSettings;
  entitlement: Entitlement;
  isPro: boolean;
  config: RemoteConfig;
  products: PlumpProduct[];
  goals: Goal[];
  activeGoal?: Goal;
  draft: OnboardingDraft;

  updateSettings: (patch: Partial<AppSettings>) => Promise<void>;
  setDraft: (patch: Partial<OnboardingDraft>) => Promise<void>;
  clearDraft: () => Promise<void>;
  resetDemoState: () => Promise<void>;
  completeOnboardingWithGoal: () => Promise<Goal | undefined>;

  purchase: (productId: PlumpProductId) => Promise<PurchaseResult>;
  restore: () => Promise<PurchaseResult>;

  createGoal: (input: {
    challengeType: ChallengeType;
    name: string;
    ownerName?: string;
    targetAmount: number;
    mascotVariant: string;
    colorTheme: string;
  }) => Promise<Goal>;
  setActiveGoal: (id: string) => Promise<void>;
  archiveGoal: (id: string) => Promise<void>;

  getDeposits: (goalId: string) => Deposit[];
  addDeposit: (
    goalId: string,
    amount: number,
    slotNumber?: number,
    note?: string,
  ) => Promise<SaveResult>;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [entitlement, setEntitlementState] = useState<Entitlement>(FREE_ENTITLEMENT);
  const [config, setConfig] = useState<RemoteConfig>(fallbackConfig);
  const [products, setProducts] = useState<PlumpProduct[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [draft, setDraftState] = useState<OnboardingDraft>({});

  useEffect(() => {
    let unlisten = () => {};
    (async () => {
      const [s, e, g, d, dr] = await Promise.all([
        settingsRepository.get(),
        entitlementRepository.get(),
        goalRepository.list(),
        depositRepository.list(),
        onboardingDraftRepository.get(),
      ]);
      setSettings(s);
      setHapticsEnabled(s.hapticsEnabled);
      setEntitlementState(e);
      setGoals(g);
      setDeposits(d);
      setDraftState(dr);
      void mirrorLocalState(g, d, 'app_open');
      setReady(true);
      track('app_open');

      await initIAP();
      const [cfg, prods] = await Promise.all([fetchRemoteConfig(), loadProducts()]);
      setConfig(cfg);
      setProducts(prods);
      unlisten = listenForPurchaseUpdates((ent) => setEntitlementState(ent));
    })();
    return () => unlisten();
  }, []);

  const isDark = settings.darkMode;
  const colors = isDark ? darkColors : lightColors;
  const isPro = isProEntitlement(entitlement);

  const activeGoal = useMemo(() => {
    const active = goals.filter((x) => x.status !== 'archived');
    return active.find((x) => x.id === settings.activeGoalId) ?? active[0];
  }, [goals, settings.activeGoalId]);

  const updateSettings = useCallback(async (patch: Partial<AppSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      void settingsRepository.set(next);
      if (patch.hapticsEnabled !== undefined) setHapticsEnabled(next.hapticsEnabled);
      return next;
    });
  }, []);

  const setDraft = useCallback(async (patch: Partial<OnboardingDraft>) => {
    setDraftState((prev) => {
      const next = { ...prev, ...patch };
      void onboardingDraftRepository.set(next);
      return next;
    });
  }, []);

  const clearDraft = useCallback(async () => {
    setDraftState({});
    await onboardingDraftRepository.clear();
  }, []);

  const resetDemoState = useCallback(async () => {
    const freshSettings = { ...DEFAULT_SETTINGS, onboardingComplete: false, activeGoalId: undefined };
    await clearAllLocalPlumpData();
    await Promise.all([
      settingsRepository.set(freshSettings),
      entitlementRepository.set(FREE_ENTITLEMENT),
      goalRepository.replaceAll([]),
      depositRepository.replaceAll([]),
      onboardingDraftRepository.clear(),
      reviewPromptRepository.set(INITIAL_REVIEW_STATE),
    ]);
    setSettings(freshSettings);
    setHapticsEnabled(freshSettings.hapticsEnabled);
    setEntitlementState(FREE_ENTITLEMENT);
    setGoals([]);
    setDeposits([]);
    setDraftState({});
  }, []);

  const createGoal = useCallback<AppContextValue['createGoal']>(async (input) => {
    const template = CHALLENGE_TEMPLATES[input.challengeType];
    const now = new Date().toISOString();
    const goal: Goal = {
      id: uid(),
      challengeType: input.challengeType,
      name: input.name,
      ownerName: input.ownerName,
      targetAmount: input.targetAmount,
      mascotVariant: input.mascotVariant,
      colorTheme: input.colorTheme,
      cadence: template.cadence,
      startDate: now,
      status: 'active',
      createdAt: now,
      updatedAt: now,
      ...makeSyncFields(now),
    };
    await goalRepository.save(goal);
    void mirrorLocalState([...goals, goal], deposits, 'goal_created');
    setGoals((prev) => [...prev, goal]);
    await updateSettings({ activeGoalId: goal.id });
    return goal;
  }, [updateSettings]);

  const completeOnboardingWithGoal = useCallback(async () => {
    const challengeType = (draft.challengeType as ChallengeType) ?? 'envelope_100';
    const template = CHALLENGE_TEMPLATES[challengeType];
    const goal = await createGoal({
      challengeType,
      name: draft.goalName || 'My savings goal',
      ownerName: draft.userName?.trim() || undefined,
      targetAmount: draft.targetAmount ?? template.totalTarget,
      mascotVariant: draft.mascotVariant ?? 'honey',
      colorTheme: draft.cardPalette ?? 'cream',
    });
    await updateSettings({ onboardingComplete: true });
    track('card_generated', { challenge: challengeType });
    await recordPositiveEvent('card_generated');
    await clearDraft();
    return goal;
  }, [draft, createGoal, updateSettings]);

  const purchase = useCallback<AppContextValue['purchase']>(async (productId) => {
    const result = await purchaseProduct(productId);
    if (result.success && result.entitlement) {
      setEntitlementState(result.entitlement);
      if (productId === 'plump.lifetime') track('lifetime_purchase_completed', { productId, plan: 'lifetime' });
      else if (productId === 'plump.annual') track('trial_started', { productId, plan: 'annual' });
      else track('purchase_completed', { productId, plan: 'monthly' });
    }
    return result;
  }, []);

  const restore = useCallback(async () => {
    track('restore_tapped');
    const result = await restorePurchases();
    if (result.success && result.entitlement) {
      setEntitlementState(result.entitlement);
      track('restore_completed');
    }
    return result;
  }, []);

  const setActiveGoal = useCallback(async (id: string) => {
    await updateSettings({ activeGoalId: id });
  }, [updateSettings]);

  const archiveGoal = useCallback(async (id: string) => {
    setGoals((prev) => {
      const next = prev.map((g) =>
        g.id === id ? { ...g, status: 'archived' as const, updatedAt: new Date().toISOString(), ...touchSyncFields(g, new Date().toISOString()) } : g,
      );
      void goalRepository.replaceAll(next);
      void mirrorLocalState(next, deposits, 'goal_archived');
      return next;
    });
  }, []);

  const getDeposits = useCallback(
    (goalId: string) =>
      deposits
        .filter((d) => d.goalId === goalId)
        .sort((a, b) => b.date.localeCompare(a.date)),
    [deposits],
  );

  const addDeposit = useCallback<AppContextValue['addDeposit']>(
    async (goalId, amount, slotNumber, note) => {
      const goal = goals.find((g) => g.id === goalId);
      const target = goal?.targetAmount ?? 0;
      const before = deposits
        .filter((d) => d.goalId === goalId)
        .reduce((s, d) => s + d.amount, 0);
      const after = before + amount;
      const now = new Date().toISOString();
      const deposit: Deposit = {
        id: uid(),
        goalId,
        amount,
        slotNumber,
        date: now,
        note,
        createdAt: now,
        updatedAt: now,
        ...makeSyncFields(now),
      };
      await depositRepository.add(deposit);
      const firstEver = deposits.filter((d) => d.goalId === goalId).length === 0;
      void mirrorLocalState(goals, [...deposits, deposit], 'deposit_added');
      setDeposits((prev) => [...prev, deposit]);

      track('deposit_made', { amount });
      if (slotNumber !== undefined) track('envelope_filled', { slot: slotNumber });
      if (firstEver) await recordPositiveEvent('first_deposit');

      const milestone = newlyCrossedMilestone(before, after, target);
      if (milestone) {
        track('milestone_hit', { milestone });
        if (milestone === 25) await recordPositiveEvent('milestone_25');
        if (milestone === 50) await recordPositiveEvent('milestone_50');
      }

      const completed = target > 0 && after >= target;
      if (completed && goal) {
        track('goal_completed');
        await recordPositiveEvent('goal_completed');
        setGoals((prev) => {
          const next = prev.map((g) =>
            g.id === goalId ? { ...g, status: 'completed' as const, updatedAt: now, ...touchSyncFields(g, now) } : g,
          );
          void goalRepository.replaceAll(next);
          void mirrorLocalState(next, [...deposits, deposit], 'goal_completed');
          return next;
        });
      }
      return { deposit, milestone, completed };
    },
    [goals, deposits],
  );

  const value = useMemo<AppContextValue>(
    () => ({
      ready,
      colors,
      isDark,
      settings,
      entitlement,
      isPro,
      config,
      products,
      goals,
      activeGoal,
      draft,
      updateSettings,
      setDraft,
      clearDraft,
      resetDemoState,
      completeOnboardingWithGoal,
      purchase,
      restore,
      createGoal,
      setActiveGoal,
      archiveGoal,
      getDeposits,
      addDeposit,
    }),
    [
      ready, colors, isDark, settings, entitlement, isPro, config, products, goals,
      activeGoal, draft, updateSettings, setDraft, clearDraft, resetDemoState, completeOnboardingWithGoal,
      purchase, restore, createGoal, setActiveGoal, archiveGoal, getDeposits, addDeposit,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}

export function useTheme(): { colors: ColorScheme; isDark: boolean } {
  const { colors, isDark } = useApp();
  return { colors, isDark };
}

// slot helper re-export for convenience in screens
export { slotAmount };
