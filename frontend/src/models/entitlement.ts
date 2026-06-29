export type EntitlementStatus =
  | 'free'
  | 'trial'
  | 'active'
  | 'lifetime'
  | 'grace'
  | 'expired';

export interface Entitlement {
  isPro: boolean;
  productId?: string;
  status: EntitlementStatus;
  expiresDate?: string;
  originalTransactionId?: string;
  environment?: 'sandbox' | 'production';
}

export const FREE_ENTITLEMENT: Entitlement = {
  isPro: false,
  status: 'free',
};
