// iapService — ThoughtSnap Labs / SnapBack AI direct StoreKit pattern.
// Real Apple IAP runs ONLY in standalone/dev (EAS / TestFlight / App Store) builds.
// Expo Go, web preview and Android dev fall back to a simulated purchase so the
// full product flow is demoable. NO RevenueCat.
//
// IMPORTANT: react-native-iap is required lazily so it never loads (and never
// crashes) in Expo Go / web where the native module is unavailable.

import { Platform } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';

import { getConfig } from '@/src/services/remoteConfigService';
import type { Entitlement } from '@/src/models/entitlement';
import { entitlementRepository } from '@/src/storage/repositories';

export type PlumpProductId = 'plump.monthly' | 'plump.annual' | 'plump.lifetime';

export interface PlumpProduct {
  productId: PlumpProductId;
  title: string;
  priceLabel: string;
  isSubscription: boolean;
}

// Minimal shape of the native react-native-iap module we rely on.
interface IapPurchase {
  productId: string;
  transactionId?: string;
  transactionReceipt?: string;
  originalTransactionIdentifierIOS?: string;
}
interface IapModule {
  initConnection: () => Promise<boolean>;
  getProducts: (args: { skus: string[] }) => Promise<unknown[]>;
  getSubscriptions: (args: { skus: string[] }) => Promise<unknown[]>;
  requestPurchase: (args: { sku: string }) => Promise<void>;
  requestSubscription: (args: { sku: string }) => Promise<void>;
  getAvailablePurchases: () => Promise<IapPurchase[]>;
  finishTransaction: (args: { purchase: IapPurchase; isConsumable: boolean }) => Promise<void>;
  purchaseUpdatedListener: (cb: (p: IapPurchase) => void) => { remove: () => void };
  purchaseErrorListener: (cb: (e: unknown) => void) => { remove: () => void };
}

export function isRealIapAvailable(): boolean {
  return (
    Platform.OS === 'ios' &&
    Constants.executionEnvironment !== ExecutionEnvironment.StoreClient
  );
}

function loadIap(): IapModule | null {
  if (!isRealIapAvailable()) return null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('react-native-iap') as IapModule;
  } catch {
    return null;
  }
}

let initialized = false;

export async function initIAP(): Promise<void> {
  if (initialized) return;
  const iap = loadIap();
  if (!iap) {
    initialized = true; // simulated mode
    return;
  }
  try {
    await iap.initConnection();
    initialized = true;
  } catch {
    initialized = true;
  }
}

export async function loadProducts(): Promise<PlumpProduct[]> {
  const cfg = getConfig();
  const fallback: PlumpProduct[] = [
    { productId: 'plump.annual', title: 'Annual', priceLabel: cfg.prices.annual, isSubscription: true },
    { productId: 'plump.monthly', title: 'Monthly', priceLabel: cfg.prices.monthly, isSubscription: true },
    { productId: 'plump.lifetime', title: 'Lifetime', priceLabel: cfg.prices.lifetime, isSubscription: false },
  ];
  const iap = loadIap();
  if (!iap) return fallback;
  try {
    // Fetch from App Store; gracefully degrade to fallback labels while
    // App Store Connect propagation settles.
    await iap.getSubscriptions({ skus: [cfg.products.monthly, cfg.products.annual] });
    await iap.getProducts({ skus: [cfg.products.lifetime] });
    return fallback;
  } catch {
    return fallback;
  }
}

function entitlementForProduct(productId: PlumpProductId): Entitlement {
  if (productId === 'plump.lifetime') {
    return { isPro: true, productId, status: 'lifetime', environment: 'sandbox' };
  }
  if (productId === 'plump.annual') {
    const expires = new Date();
    expires.setFullYear(expires.getFullYear() + 1);
    return { isPro: true, productId, status: 'trial', expiresDate: expires.toISOString(), environment: 'sandbox' };
  }
  const expires = new Date();
  expires.setMonth(expires.getMonth() + 1);
  return { isPro: true, productId, status: 'active', expiresDate: expires.toISOString(), environment: 'sandbox' };
}

export interface PurchaseResult {
  success: boolean;
  entitlement?: Entitlement;
  simulated: boolean;
  error?: string;
}

export async function purchaseProduct(productId: PlumpProductId): Promise<PurchaseResult> {
  const iap = loadIap();
  if (!iap) {
    // Simulated purchase (preview / Expo Go / web / Android dev)
    const entitlement = entitlementForProduct(productId);
    await entitlementRepository.set(entitlement);
    return { success: true, entitlement, simulated: true };
  }
  try {
    if (productId === 'plump.lifetime') {
      await iap.requestPurchase({ sku: productId });
    } else {
      await iap.requestSubscription({ sku: productId });
    }
    // Real entitlement is granted by the purchaseUpdatedListener flow.
    return { success: true, simulated: false };
  } catch (e) {
    return { success: false, simulated: false, error: String(e) };
  }
}

export async function restorePurchases(): Promise<PurchaseResult> {
  const iap = loadIap();
  if (!iap) {
    const current = await entitlementRepository.get();
    return { success: current.isPro, entitlement: current, simulated: true };
  }
  try {
    const purchases = await iap.getAvailablePurchases();
    const active = purchases.find((p) =>
      ['plump.monthly', 'plump.annual', 'plump.lifetime'].includes(p.productId),
    );
    if (active) {
      const entitlement = entitlementForProduct(active.productId as PlumpProductId);
      entitlement.originalTransactionId = active.originalTransactionIdentifierIOS;
      entitlement.environment = 'production';
      await entitlementRepository.set(entitlement);
      return { success: true, entitlement, simulated: false };
    }
    return { success: false, simulated: false };
  } catch (e) {
    return { success: false, simulated: false, error: String(e) };
  }
}

export async function getCurrentEntitlement(): Promise<Entitlement> {
  return entitlementRepository.get();
}

export function listenForPurchaseUpdates(
  onEntitlement: (e: Entitlement) => void,
): () => void {
  const iap = loadIap();
  if (!iap) return () => {};
  const updateSub = iap.purchaseUpdatedListener(async (purchase) => {
    const entitlement = entitlementForProduct(purchase.productId as PlumpProductId);
    entitlement.originalTransactionId = purchase.originalTransactionIdentifierIOS;
    entitlement.environment = 'production';
    await entitlementRepository.set(entitlement);
    await finishTransactionSafely(purchase);
    onEntitlement(entitlement);
  });
  const errorSub = iap.purchaseErrorListener(() => {});
  return () => {
    updateSub.remove();
    errorSub.remove();
  };
}

export async function finishTransactionSafely(purchase: IapPurchase): Promise<void> {
  const iap = loadIap();
  if (!iap) return;
  try {
    const isConsumable = false;
    await iap.finishTransaction({ purchase, isConsumable });
  } catch {
    // ignore — will retry on next launch
  }
}
