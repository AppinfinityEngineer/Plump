// Local entitlement cache for instant gating. Backend validation is stubbed
// and never blocks the app in V1.

import type { Entitlement } from '@/src/models/entitlement';
import { FREE_ENTITLEMENT } from '@/src/models/entitlement';
import { entitlementRepository } from '@/src/storage/repositories';

const BACKEND = process.env.EXPO_PUBLIC_BACKEND_URL;

export async function getCachedEntitlement(): Promise<Entitlement> {
  return entitlementRepository.get();
}

export async function setEntitlement(e: Entitlement): Promise<void> {
  await entitlementRepository.set(e);
}

export async function clearEntitlement(): Promise<void> {
  await entitlementRepository.set(FREE_ENTITLEMENT);
}

export function isProEntitlement(e: Entitlement): boolean {
  if (!e.isPro) return false;
  if (e.status === 'expired') return false;
  if (e.expiresDate && e.status !== 'lifetime') {
    return new Date(e.expiresDate).getTime() > Date.now();
  }
  return true;
}

// Stubbed server-side validation. Fire-and-forget; never blocks.
export async function validateTransactionRemote(
  receipt: string,
  productId: string,
): Promise<void> {
  if (!BACKEND) return;
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 3000);
    await fetch(`${BACKEND}/v1/validate-transaction`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ receipt, productId }),
      signal: ctrl.signal,
    });
    clearTimeout(t);
  } catch {
    // local cache is the source of truth in V1
  }
}
