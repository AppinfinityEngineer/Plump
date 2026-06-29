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
export type CardPaletteId = 'cream' | 'green' | 'pink' | 'honey' | 'dark';

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
  green: { id: 'green', name: 'Pretty green', bg: '#EAF4E3', accent: '#3F8C32', text: '#2C4A22', sub: '#6E8A5E' },
  pink: { id: 'pink', name: 'Pink cash-stuffing', bg: '#FBE7E4', accent: '#D86A62', text: '#7A3F3A', sub: '#B98882' },
  honey: { id: 'honey', name: 'Honey mascot', bg: '#FBE9CF', accent: '#C97E2C', text: '#6B4A22', sub: '#A98552' },
  dark: { id: 'dark', name: 'Dark cozy', bg: '#2A221B', accent: '#BDE1A7', text: '#FBF4E9', sub: '#B7A78F' },
};
