// Remote config with safe local fallback. Mobile never blocks on the network.

const BACKEND = process.env.EXPO_PUBLIC_BACKEND_URL;

export interface RemoteConfig {
  paywallVariant: string;
  products: { monthly: string; annual: string; lifetime: string };
  prices: { monthly: string; annual: string; lifetime: string };
  annualTrialDays: number;
  reviewPromptEnabled: boolean;
  cardWatermark: string;
}

export const fallbackConfig: RemoteConfig = {
  paywallVariant: 'annual_hero_lifetime_alt',
  products: {
    monthly: 'plump.monthly',
    annual: 'plump.annual',
    lifetime: 'plump.lifetime',
  },
  prices: {
    monthly: '£6.99/month',
    annual: '£29.99/year',
    lifetime: '£49.99 once',
  },
  annualTrialDays: 3,
  reviewPromptEnabled: true,
  cardWatermark: 'plump.app',
};

let cached: RemoteConfig = fallbackConfig;

export async function fetchRemoteConfig(): Promise<RemoteConfig> {
  if (!BACKEND) return fallbackConfig;
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 3500);
    const res = await fetch(`${BACKEND}/v1/config`, { signal: ctrl.signal });
    clearTimeout(t);
    if (!res.ok) return fallbackConfig;
    const data = (await res.json()) as Partial<RemoteConfig>;
    cached = { ...fallbackConfig, ...data };
    return cached;
  } catch {
    return fallbackConfig;
  }
}

export function getConfig(): RemoteConfig {
  return cached;
}
