// Plump design system — tokens derived from ThoughtSnap Labs brand + design guidelines.
// No Emergent branding anywhere. Brand surfaces: Plump / plump.app / ThoughtSnap Labs.

export type ColorScheme = {
  surface: string;
  onSurface: string;
  surfaceSecondary: string;
  surfaceTertiary: string;
  brand: string;
  brandPrimary: string;
  onBrandPrimary: string;
  brandSecondary: string;
  brandTertiary: string;
  belly: string;
  rosy: string;
  border: string;
  borderStrong: string;
  muted: string;
  shadow: string;
  overlay: string;
};

export const lightColors: ColorScheme = {
  surface: '#FBF4E9',
  onSurface: '#5A4632',
  surfaceSecondary: '#FFFFFF',
  surfaceTertiary: '#F6DCAE',
  brand: '#E8A765',
  brandPrimary: '#3F8C32',
  onBrandPrimary: '#FFFFFF',
  brandSecondary: '#F2A6A0',
  brandTertiary: '#7FB86A',
  belly: '#F6DCAE',
  rosy: '#F2A6A0',
  border: '#E6DACB',
  borderStrong: '#5A4632',
  muted: '#9C8B76',
  shadow: '#5A4632',
  overlay: 'rgba(40,28,16,0.45)',
};

export const darkColors: ColorScheme = {
  surface: '#201B16',
  onSurface: '#FBF4E9',
  surfaceSecondary: '#302820',
  surfaceTertiary: '#4B3E34',
  brand: '#E8A765',
  brandPrimary: '#BDE1A7',
  onBrandPrimary: '#201B16',
  brandSecondary: '#F2A6A0',
  brandTertiary: '#7FB86A',
  belly: '#F6DCAE',
  rosy: '#F2A6A0',
  border: '#4B3E34',
  borderStrong: '#FBF4E9',
  muted: '#A8967F',
  shadow: '#000000',
  overlay: 'rgba(0,0,0,0.6)',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

export const radius = {
  sm: 12,
  md: 20,
  lg: 28,
  pill: 999,
} as const;

export const fonts = {
  display: 'Fredoka',
  displaySemi: 'Fredoka-SemiBold',
  body: 'Nunito',
  bodySemi: 'Nunito-SemiBold',
  bodyBold: 'Nunito-Bold',
  bodyBlack: 'Nunito-ExtraBold',
} as const;

export const fontSize = {
  sm: 12,
  base: 14,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 44,
  '5xl': 56,
} as const;

export const shadow = (scheme: ColorScheme) => ({
  shadowColor: scheme.shadow,
  shadowOffset: { width: 0, height: 6 },
  shadowOpacity: 0.12,
  shadowRadius: 14,
  elevation: 4,
});

// Card visual palettes (the "card style" chosen in onboarding).
export type CardPaletteId = 'cream' | 'sage' | 'rosy' | 'cocoa' | 'mint' | 'blueberry' | 'lavender' | 'strawberry' | 'charcoal' | 'golden' | 'green' | 'pink' | 'honey' | 'dark';

export interface CardPalette {
  id: CardPaletteId;
  name: string;
  bg: string;
  accent: string;
  text: string;
  sub: string;
}

export const CARD_PALETTES: Record<CardPaletteId, CardPalette> = {
  cream: { id: 'cream', name: 'Classic cream', bg: '#FBF4E9', accent: '#3F8C32', text: '#5A4632', sub: '#9C8B76' },
  sage: { id: 'sage', name: 'Sage Plump', bg: '#F4FAEE', accent: '#5E9B4C', text: '#33422D', sub: '#7B9072' },
  rosy: { id: 'rosy', name: 'Rosy Plump', bg: '#FFF2F0', accent: '#DE847D', text: '#5A3D3A', sub: '#A67D78' },
  cocoa: { id: 'cocoa', name: 'Cocoa Plump', bg: '#F8EFE7', accent: '#8A6446', text: '#4A3425', sub: '#947A66' },
  mint: { id: 'mint', name: 'Mint Plump', bg: '#F0FBF6', accent: '#4FA77D', text: '#30483E', sub: '#789387' },
  blueberry: { id: 'blueberry', name: 'Blueberry Plump', bg: '#F3F5FF', accent: '#5F72B8', text: '#343A5B', sub: '#7781A8' },
  lavender: { id: 'lavender', name: 'Lavender Plump', bg: '#FAF6FF', accent: '#9674C8', text: '#443555', sub: '#8C7CA2' },
  strawberry: { id: 'strawberry', name: 'Strawberry Plump', bg: '#FFF4F6', accent: '#D75F6C', text: '#59353A', sub: '#A6757B' },
  charcoal: { id: 'charcoal', name: 'Charcoal Plump', bg: '#F4F1ED', accent: '#4F4A45', text: '#2F2B28', sub: '#7D756E' },
  golden: { id: 'golden', name: 'Golden Plump', bg: '#FFF8E6', accent: '#D99A29', text: '#5A3F16', sub: '#9B7B45' },

  // Legacy aliases kept so existing local test goals/cards do not crash after the palette upgrade.
  green: { id: 'green', name: 'Legacy green', bg: '#EAF4E3', accent: '#3F8C32', text: '#2C4A22', sub: '#6E8A5E' },
  pink: { id: 'pink', name: 'Legacy pink', bg: '#FBE7E4', accent: '#D86A62', text: '#7A3F3A', sub: '#B98882' },
  honey: { id: 'honey', name: 'Legacy honey', bg: '#FBE9CF', accent: '#C97E2C', text: '#6B4A22', sub: '#A98552' },
  dark: { id: 'dark', name: 'Legacy dark', bg: '#2A221B', accent: '#BDE1A7', text: '#FBF4E9', sub: '#B7A78F' },
};
