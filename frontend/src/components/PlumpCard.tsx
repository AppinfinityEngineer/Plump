import React, { forwardRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';

import { Mascot, type MascotVariant } from '@/src/components/Mascot';
import { ProgressBar } from '@/src/components/ui';
import { CARD_PALETTES, type CardPaletteId, fonts, fontSize, radius, spacing } from '@/src/theme/theme';
import { formatGBP, formatPercent } from '@/src/utils/format';

interface PlumpCardProps {
  goalName: string;
  challengeName: string;
  saved: number;
  target: number;
  percent: number;
  mascotVariant: MascotVariant;
  palette: CardPaletteId;
  subline?: string;
  watermark?: string;
  width?: number;
}

export const PlumpCard = forwardRef<View, PlumpCardProps>(function PlumpCard(
  { goalName, challengeName, saved, target, percent, mascotVariant, palette, subline, watermark = 'plump.app', width = 320 },
  ref,
) {
  const p = CARD_PALETTES[palette] ?? CARD_PALETTES.cream;
  return (
    <View ref={ref} collapsable={false} style={[styles.card, { backgroundColor: p.bg, width }]}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.challenge, { color: p.sub }]}>{challengeName}</Text>
          <Text style={[styles.goal, { color: p.text }]} numberOfLines={1}>
            {goalName}
          </Text>
        </View>
      </View>

      <View style={styles.mascotWrap}>
        <Mascot variant={mascotVariant} plumpness={percent} size={width * 0.55} />
      </View>

      <Text style={[styles.saved, { color: p.accent }]}>{formatGBP(saved)}</Text>
      <Text style={[styles.target, { color: p.sub }]}>
        saved of {formatGBP(target)}
      </Text>

      <View style={{ marginTop: spacing.lg }}>
        <ProgressBarStandalone percent={percent} track={p.sub} fill={p.accent} />
      </View>

      <View style={styles.footer}>
        <Text style={[styles.percent, { color: p.text }]}>{formatPercent(percent)} complete</Text>
        {subline ? <Text style={[styles.subline, { color: p.sub }]}>{subline}</Text> : null}
      </View>

      <Text style={[styles.watermark, { color: p.accent }]}>{watermark}</Text>
    </View>
  );
});

// Local progress bar that respects the card palette (independent of theme).
function ProgressBarStandalone({ percent, track, fill }: { percent: number; track: string; fill: string }) {
  return (
    <View style={{ height: 12, backgroundColor: track + '40', borderRadius: radius.pill, overflow: 'hidden' }}>
      <View
        style={{
          width: `${Math.max(2, Math.min(100, percent * 100))}%`,
          height: '100%',
          backgroundColor: fill,
          borderRadius: radius.pill,
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    padding: spacing.xl,
    alignItems: 'stretch',
  },
  header: { flexDirection: 'row', alignItems: 'center' },
  challenge: { fontFamily: fonts.bodySemi, fontSize: fontSize.sm, textTransform: 'uppercase', letterSpacing: 1 },
  goal: { fontFamily: fonts.display, fontSize: fontSize['2xl'], marginTop: 2 },
  mascotWrap: { alignItems: 'center', marginVertical: spacing.md },
  saved: { fontFamily: fonts.display, fontSize: fontSize['4xl'], textAlign: 'center' },
  target: { fontFamily: fonts.bodySemi, fontSize: fontSize.base, textAlign: 'center', marginTop: 2 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.md },
  percent: { fontFamily: fonts.bodyBold, fontSize: fontSize.base },
  subline: { fontFamily: fonts.bodySemi, fontSize: fontSize.base },
  watermark: { fontFamily: fonts.displaySemi, fontSize: fontSize.base, textAlign: 'center', marginTop: spacing.lg, opacity: 0.9 },
});
