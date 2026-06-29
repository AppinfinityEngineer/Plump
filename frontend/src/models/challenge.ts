export type ChallengeType =
  | 'envelope_100'
  | 'week_52'
  | 'penny_365'
  | 'no_spend'
  | 'custom';

export type Cadence = 'daily' | 'weekly' | 'custom';

export interface ChallengeTemplate {
  type: ChallengeType;
  name: string;
  shortName: string;
  description: string;
  totalTarget: number;
  durationDays: number;
  cadence: Cadence;
  slots?: number[];
  premium: boolean;
}

const slots100: number[] = Array.from({ length: 100 }, (_, i) => i + 1);
const slots52: number[] = Array.from({ length: 52 }, (_, i) => i + 1);

export const CHALLENGE_TEMPLATES: Record<ChallengeType, ChallengeTemplate> = {
  envelope_100: {
    type: 'envelope_100',
    name: '100 Envelope Challenge',
    shortName: '100 Envelopes',
    description: 'Fill envelopes 1 to 100',
    totalTarget: 5050,
    durationDays: 100,
    cadence: 'daily',
    slots: slots100,
    premium: false,
  },
  week_52: {
    type: 'week_52',
    name: '52 Week Challenge',
    shortName: '52 Weeks',
    description: 'Save the week number each week',
    totalTarget: 1378,
    durationDays: 364,
    cadence: 'weekly',
    slots: slots52,
    premium: false,
  },
  penny_365: {
    type: 'penny_365',
    name: 'Penny 365',
    shortName: 'Penny 365',
    description: 'Start tiny, finish proud',
    totalTarget: 667.95,
    durationDays: 365,
    cadence: 'daily',
    premium: false,
  },
  no_spend: {
    type: 'no_spend',
    name: 'No-Spend Challenge',
    shortName: 'No-Spend',
    description: "Track what you didn't spend",
    totalTarget: 1000,
    durationDays: 30,
    cadence: 'daily',
    premium: false,
  },
  custom: {
    type: 'custom',
    name: 'Custom Challenge',
    shortName: 'Custom',
    description: 'Build your own savings challenge',
    totalTarget: 1000,
    durationDays: 90,
    cadence: 'custom',
    premium: true,
  },
};

export const CHALLENGE_ORDER: ChallengeType[] = [
  'envelope_100',
  'week_52',
  'penny_365',
  'no_spend',
  'custom',
];
