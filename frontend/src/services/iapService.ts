// iapService — ThoughtSnap Labs direct StoreKit pattern, aligned with proven Puffless/SnapBack flow.
//
// Real Apple IAP runs only in standalone/dev-client/TestFlight/App Store iOS builds.
// Expo Go/web/Android dev use a simulated local purchase so the app journey stays demoable.
// No RevenueCat. No backend entitlement authority. No Apple server validation in launch lane.
//
// The real StoreKit unlock happens from purchaseUpdatedListener, not from the request call.
// This matches the Puffless pattern that was proven to work.

import { Platform } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';

import { getConfig } from '@/src/services/remoteConfigService';
import type { Entitlement } from '@/src/models/entitlement';
import { entitlementRepository } from '@/src/storage/repositories';

export type PlumpProductId = 'plump.monthly' | 'plump.annual' | 'plump.lifetime';
export type PlumpPlan = 'monthly' | 'annual' | 'lifetime';

export const PLUMP_PRODUCT_IDS = {
  monthly: 'plump.monthly',
  annual: 'plump.annual',
  lifetime: 'plump.lifetime',
} as const;

export const PLUMP_PRODUCT_ID_LIST: PlumpProductId[] = [
  PLUMP_PRODUCT_IDS.monthly,
  PLUMP_PRODUCT_IDS.annual,
  PLUMP_PRODUCT_IDS.lifetime,
];

export function planForProductId(productId?: string): PlumpPlan | null {
  if (productId === PLUMP_PRODUCT_IDS.monthly) return 'monthly';
  if (productId === PLUMP_PRODUCT_IDS.annual) return 'annual';
  if (productId === PLUMP_PRODUCT_IDS.lifetime) return 'lifetime';
  return null;
}

export function isPlumpProduct(productId?: string): productId is PlumpProductId {
  return Boolean(productId && PLUMP_PRODUCT_ID_LIST.includes(productId as PlumpProductId));
}

export interface PlumpProduct {
  productId: PlumpProductId;
  title: string;
  priceLabel: string;
  isSubscription: boolean;
}

interface StoreProduct {
  productId?: string;
  price?: string;
  localizedPrice?: string;
  title?: string;
  description?: string;
}

interface IapPurchase {
  productId: string;
  transactionId?: string;
  transactionReceipt?: string;
  originalTransactionIdentifierIOS?: string;
}

interface IapModule {
  clearTransactionIOS?: () => Promise<void>;
  endConnection?: () => Promise<void>;
  fetchProducts?: (args: { skus: string[]; type?: 'subs' | 'in-app' }) => Promise<StoreProduct[]>;
  finishTransaction?: (args: { purchase: IapPurchase; isConsumable: boolean }) => Promise<void>;
  getAvailablePurchases?: () => Promise<IapPurchase[]>;
  getProducts?: (args: { skus: string[] }) => Promise<StoreProduct[]>;
  getSubscriptions?: (args: { skus: string[] }) => Promise<StoreProduct[]>;
  initConnection?: () => Promise<boolean>;
  purchaseErrorListener?: (callback: (error: unknown) => void) => { remove: () => void };
  purchaseUpdatedListener?: (callback: (purchase: IapPurchase) => void) => { remove: () => void };
  requestPurchase?: (args: unknown) => Promise<void>;
  requestSubscription?: (args: unknown) => Promise<void>;
}

let connected = false;
let nativeIap: IapModule | null = null;
let updateSubscription: { remove: () => void } | null = null;
let errorSubscription: { remove: () => void } | null = null;

function isExpoGo(): boolean {
  return Constants.executionEnvironment === ExecutionEnvironment.StoreClient || Constants.appOwnership === 'expo';
}

function canUseNativeIap(): boolean {
  return Platform.OS === 'ios' && !isExpoGo();
}

function getIapModule(): IapModule | null {
  if (!canUseNativeIap()) return null;
  if (nativeIap) return nativeIap;

  try {
    // Runtime require avoids crashing Expo Go while allowing TestFlight/App Store builds to load StoreKit.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    nativeIap = require('react-native-iap') as IapModule;
    return nativeIap;
  } catch {
    return null;
  }
}

export function isRealIapAvailable(): boolean {
  return canUseNativeIap() && Boolean(getIapModule());
}

function fallbackProducts(): PlumpProduct[] {
  const cfg = getConfig();
  return [
    { productId: PLUMP_PRODUCT_IDS.annual, title: 'Annual', priceLabel: cfg.prices.annual, isSubscription: true },
    { productId: PLUMP_PRODUCT_IDS.monthly, title: 'Monthly', priceLabel: cfg.prices.monthly, isSubscription: true },
    { productId: PLUMP_PRODUCT_IDS.lifetime, title: 'Lifetime', priceLabel: cfg.prices.lifetime, isSubscription: false },
  ];
}

function mergeStoreProduct(fallback: PlumpProduct, storeProducts: StoreProduct[]): PlumpProduct {
  const store = storeProducts.find((item) => item.productId === fallback.productId);
  if (!store) return fallback;

  return {
    ...fallback,
    title: store.title || fallback.title,
    priceLabel: store.localizedPrice || store.price || fallback.priceLabel,
  };
}

export async function initIAP(): Promise<void> {
  const iap = getIapModule();
  if (!iap) return;

  if (!connected) {
    try {
      connected = iap.initConnection ? await iap.initConnection() : true;
    } catch {
      connected = false;
      return;
    }

    try {
      await iap.clearTransactionIOS?.();
    } catch {
      // Ignore stale transaction cleanup failures.
    }
  }
}

export async function closeIAP(): Promise<void> {
  updateSubscription?.remove();
  errorSubscription?.remove();
  updateSubscription = null;
  errorSubscription = null;

  const iap = getIapModule();
  if (connected && iap?.endConnection) {
    await iap.endConnection();
    connected = false;
  }
}

export async function loadProducts(): Promise<PlumpProduct[]> {
  const fallback = fallbackProducts();
  await initIAP();

  const iap = getIapModule();
  if (!iap) return fallback;

  try {
    let subs: StoreProduct[] = [];
    let lifetime: StoreProduct[] = [];

    if (iap.fetchProducts) {
      subs = await iap.fetchProducts({ skus: [PLUMP_PRODUCT_IDS.monthly, PLUMP_PRODUCT_IDS.annual], type: 'subs' });
      lifetime = await iap.fetchProducts({ skus: [PLUMP_PRODUCT_IDS.lifetime], type: 'in-app' });
    } else {
      if (iap.getSubscriptions) {
        subs = await iap.getSubscriptions({ skus: [PLUMP_PRODUCT_IDS.monthly, PLUMP_PRODUCT_IDS.annual] });
      }
      if (iap.getProducts) {
        lifetime = await iap.getProducts({ skus: [PLUMP_PRODUCT_IDS.lifetime] });
      }
    }

    const storeProducts = [...subs, ...lifetime];
    return fallback.map((product) => mergeStoreProduct(product, storeProducts));
  } catch {
    return fallback;
  }
}

function entitlementForProduct(productId: PlumpProductId, environment: 'sandbox' | 'production' = 'sandbox'): Entitlement {
  if (productId === PLUMP_PRODUCT_IDS.lifetime) {
    return { isPro: true, productId, status: 'lifetime', environment };
  }

  if (productId === PLUMP_PRODUCT_IDS.annual) {
    const expires = new Date();
    expires.setFullYear(expires.getFullYear() + 1);
    return { isPro: true, productId, status: 'trial', expiresDate: expires.toISOString(), environment };
  }

  const expires = new Date();
  expires.setMonth(expires.getMonth() + 1);
  return { isPro: true, productId, status: 'active', expiresDate: expires.toISOString(), environment };
}

function purchaseCandidatesFromResult(result: unknown): IapPurchase[] {
  if (!result) return [];

  const asArray = Array.isArray(result) ? result : [result];
  const candidates: IapPurchase[] = [];

  for (const item of asArray) {
    if (!item || typeof item !== 'object') continue;

    const direct = item as Partial<IapPurchase>;
    if (typeof direct.productId === 'string') {
      candidates.push(direct as IapPurchase);
      continue;
    }

    const nestedPurchase = (item as { purchase?: Partial<IapPurchase> }).purchase;
    if (nestedPurchase && typeof nestedPurchase.productId === 'string') {
      candidates.push(nestedPurchase as IapPurchase);
      continue;
    }

    const nestedPurchases = (item as { purchases?: Partial<IapPurchase>[] }).purchases;
    if (Array.isArray(nestedPurchases)) {
      for (const nested of nestedPurchases) {
        if (nested && typeof nested.productId === 'string') candidates.push(nested as IapPurchase);
      }
    }
  }

  return candidates;
}

async function entitlementFromPurchaseResult(expectedProductId: PlumpProductId, result: unknown): Promise<Entitlement | undefined> {
  const purchase = purchaseCandidatesFromResult(result).find((candidate) => candidate.productId === expectedProductId);
  if (!purchase || !isPlumpProduct(purchase.productId)) return undefined;

  const entitlement = entitlementForProduct(purchase.productId, 'production');
  entitlement.originalTransactionId = purchase.originalTransactionIdentifierIOS ?? purchase.transactionId;

  await entitlementRepository.set(entitlement);
  await finishTransactionSafely(purchase);

  return entitlement;
}

export interface PurchaseResult {
  success: boolean;
  entitlement?: Entitlement;
  simulated: boolean;
  pending?: boolean;
  error?: string;
}

export async function purchaseProduct(productId: PlumpProductId): Promise<PurchaseResult> {
  await initIAP();

  const iap = getIapModule();
  if (!iap) {
    const entitlement = entitlementForProduct(productId, 'sandbox');
    await entitlementRepository.set(entitlement);
    return { success: true, entitlement, simulated: true };
  }

  try {
    if (productId === PLUMP_PRODUCT_IDS.lifetime) {
      if (!iap.requestPurchase) throw new Error('StoreKit purchase API is unavailable in this build.');

      try {
        const purchaseResult = await iap.requestPurchase({
          request: {
            ios: { sku: productId },
            android: { skus: [productId] },
          },
          type: 'in-app',
        });
        const entitlement = await entitlementFromPurchaseResult(productId, purchaseResult);
        if (entitlement) return { success: true, entitlement, simulated: false };
      } catch (error: any) {
        const message = String(error?.message || '');
        if (
          !message.includes('Missing purchase request configuration') &&
          !message.includes('request configuration') &&
          !message.includes('requestPurchase')
        ) {
          throw error;
        }
        const purchaseResult = await iap.requestPurchase({ sku: productId });
        const entitlement = await entitlementFromPurchaseResult(productId, purchaseResult);
        if (entitlement) return { success: true, entitlement, simulated: false };
      }

      return { success: true, simulated: false, pending: true };
    }

    if (iap.requestPurchase) {
      try {
        const purchaseResult = await iap.requestPurchase({
          request: {
            ios: { sku: productId },
            android: { skus: [productId] },
          },
          type: 'subs',
        });
        const entitlement = await entitlementFromPurchaseResult(productId, purchaseResult);
        if (entitlement) return { success: true, entitlement, simulated: false };
        return { success: true, simulated: false, pending: true };
      } catch (error: any) {
        const message = String(error?.message || '');
        if (
          !message.includes('Missing purchase request configuration') &&
          !message.includes('request configuration') &&
          !message.includes('requestPurchase')
        ) {
          throw error;
        }
      }
    }

    if (iap.requestSubscription) {
      const purchaseResult = await iap.requestSubscription({
        sku: productId,
        request: {
          ios: { sku: productId },
          android: { skus: [productId] },
        },
        type: 'subs',
      });
      const entitlement = await entitlementFromPurchaseResult(productId, purchaseResult);
      if (entitlement) return { success: true, entitlement, simulated: false };
      return { success: true, simulated: false, pending: true };
    }

    throw new Error('StoreKit subscription API is unavailable in this build.');
  } catch (error) {
    return { success: false, simulated: false, error: String(error) };
  }
}

export async function restorePurchases(): Promise<PurchaseResult> {
  await initIAP();

  const iap = getIapModule();
  if (!iap?.getAvailablePurchases) {
    const current = await entitlementRepository.get();
    return { success: current.isPro, entitlement: current, simulated: true };
  }

  try {
    const purchases = await iap.getAvailablePurchases();
    const active = purchases.find((purchase) => isPlumpProduct(purchase.productId));

    if (!active) {
      return { success: false, simulated: false };
    }

    const entitlement = entitlementForProduct(active.productId as PlumpProductId, 'production');
    entitlement.originalTransactionId = active.originalTransactionIdentifierIOS ?? active.transactionId;
    await entitlementRepository.set(entitlement);

    return { success: true, entitlement, simulated: false };
  } catch (error) {
    return { success: false, simulated: false, error: String(error) };
  }
}

export async function getCurrentEntitlement(): Promise<Entitlement> {
  return entitlementRepository.get();
}

export function listenForPurchaseUpdates(onEntitlement: (entitlement: Entitlement) => void): () => void {
  const iap = getIapModule();
  if (!iap) return () => {};

  if (!updateSubscription && iap.purchaseUpdatedListener) {
    updateSubscription = iap.purchaseUpdatedListener(async (purchase) => {
      if (!isPlumpProduct(purchase.productId)) return;

      const entitlement = entitlementForProduct(purchase.productId, 'production');
      entitlement.originalTransactionId = purchase.originalTransactionIdentifierIOS ?? purchase.transactionId;

      await entitlementRepository.set(entitlement);
      await finishTransactionSafely(purchase);

      onEntitlement(entitlement);
    });
  }

  if (!errorSubscription && iap.purchaseErrorListener) {
    errorSubscription = iap.purchaseErrorListener(() => {
      // Purchase errors are surfaced from request calls where available.
      // Listener is kept so StoreKit error events do not become unhandled.
    });
  }

  return () => {
    updateSubscription?.remove();
    errorSubscription?.remove();
    updateSubscription = null;
    errorSubscription = null;
  };
}

export async function finishTransactionSafely(purchase: IapPurchase): Promise<void> {
  const iap = getIapModule();
  if (!iap?.finishTransaction) return;

  try {
    await iap.finishTransaction({ purchase, isConsumable: false });
  } catch {
    // Ignore — StoreKit can retry unfinished transactions on next launch.
  }
}
