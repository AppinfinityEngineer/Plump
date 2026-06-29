import React from 'react';
import Svg, { Circle, Ellipse, Path, G } from 'react-native-svg';

export type MascotVariant = 'honey' | 'sage' | 'rosy' | 'cocoa';

interface VariantColors {
  body: string;
  dark: string;
  belly: string;
}

export const MASCOT_VARIANTS: Record<MascotVariant, VariantColors & { name: string }> = {
  honey: { name: 'Honey Plump', body: '#E8A765', dark: '#D8924E', belly: '#F6DCAE' },
  sage: { name: 'Sage Plump', body: '#7FB86A', dark: '#5E9B4C', belly: '#D9EBC9' },
  rosy: { name: 'Rosy Plump', body: '#F2A6A0', dark: '#DE847D', belly: '#FBDDD9' },
  cocoa: { name: 'Cocoa Plump', body: '#A9805E', dark: '#8A6446', belly: '#E8CDB4' },
};

const ROSY = '#F2A6A0';
const BROWN = '#5A4632';

interface MascotProps {
  variant?: MascotVariant;
  plumpness?: number; // 0..1
  size?: number;
  smug?: boolean;
}

export function Mascot({ variant = 'honey', plumpness = 0, size = 160, smug }: MascotProps) {
  const c = MASCOT_VARIANTS[variant];
  const p = Math.max(0, Math.min(1, plumpness));
  const cx = 100;
  const bodyRx = 34 + p * 42;
  const bodyRy = 50 + p * 18;
  const by = 150 - p * 4;
  const headR = 42;
  const hy = by - bodyRy + 14;
  const armDx = bodyRx * (1 - p * 0.22);
  const footY = by + bodyRy - 4;
  const bellyRx = bodyRx * 0.62;
  const bellyRy = bodyRy * 0.7;
  const eyeY = hy - 4;
  const cheekY = hy + 10;
  const isSmug = smug ?? p >= 1;
  // smug => slightly closed happy eyes (use thin arcs), else dots
  return (
    <Svg width={size} height={size * (230 / 200)} viewBox="0 0 200 230">
      {/* ears */}
      <Ellipse cx={cx - 26} cy={hy - 30} rx={18} ry={20} fill={c.body} stroke={c.dark} strokeWidth={2} />
      <Ellipse cx={cx + 26} cy={hy - 30} rx={18} ry={20} fill={c.body} stroke={c.dark} strokeWidth={2} />
      <Ellipse cx={cx - 26} cy={hy - 28} rx={9} ry={11} fill={c.belly} />
      <Ellipse cx={cx + 26} cy={hy - 28} rx={9} ry={11} fill={c.belly} />
      {/* body */}
      <Ellipse cx={cx} cy={by} rx={bodyRx} ry={bodyRy} fill={c.body} stroke={c.dark} strokeWidth={2.5} />
      {/* arms */}
      <Ellipse cx={cx - armDx} cy={by} rx={12} ry={18} fill={c.body} stroke={c.dark} strokeWidth={2} />
      <Ellipse cx={cx + armDx} cy={by} rx={12} ry={18} fill={c.body} stroke={c.dark} strokeWidth={2} />
      {/* feet */}
      <Ellipse cx={cx - 22} cy={footY} rx={16} ry={11} fill={c.body} stroke={c.dark} strokeWidth={2} />
      <Ellipse cx={cx + 22} cy={footY} rx={16} ry={11} fill={c.body} stroke={c.dark} strokeWidth={2} />
      {/* belly */}
      <Ellipse cx={cx} cy={by + 6} rx={bellyRx} ry={bellyRy} fill={c.belly} />
      {/* head */}
      <Circle cx={cx} cy={hy} r={headR} fill={c.body} stroke={c.dark} strokeWidth={2.5} />
      {/* cheeks */}
      <Ellipse cx={cx - 26} cy={cheekY} rx={11} ry={8} fill={ROSY} opacity={0.85} />
      <Ellipse cx={cx + 26} cy={cheekY} rx={11} ry={8} fill={ROSY} opacity={0.85} />
      {/* eyes */}
      {isSmug ? (
        <G>
          <Path d={`M ${cx - 22} ${eyeY} q 6 -7 12 0`} fill="none" stroke={BROWN} strokeWidth={3} strokeLinecap="round" />
          <Path d={`M ${cx + 10} ${eyeY} q 6 -7 12 0`} fill="none" stroke={BROWN} strokeWidth={3} strokeLinecap="round" />
        </G>
      ) : (
        <G>
          <Circle cx={cx - 16} cy={eyeY} r={6} fill={BROWN} />
          <Circle cx={cx + 16} cy={eyeY} r={6} fill={BROWN} />
          <Circle cx={cx - 14} cy={eyeY - 2} r={2} fill="#FFFFFF" />
          <Circle cx={cx + 18} cy={eyeY - 2} r={2} fill="#FFFFFF" />
        </G>
      )}
      {/* mouth */}
      <Path
        d={`M ${cx - 9} ${eyeY + 12} q 4.5 6 9 0 q 4.5 6 9 0`}
        fill="none"
        stroke={BROWN}
        strokeWidth={2.6}
        strokeLinecap="round"
      />
    </Svg>
  );
}
