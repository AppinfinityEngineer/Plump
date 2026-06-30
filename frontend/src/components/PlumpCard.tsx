import React, { forwardRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Mascot, type MascotVariant } from '@/src/components/Mascot';
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
  milestoneLabel?: string;
  watermark?: string;
  width?: number;
}

function progressHeadline(percent: number): string {
  if (percent >= 1) return 'Goal complete';
  if (percent >= 0.9) return 'Almost there';
  if (percent >= 0.75) return 'Chunky progress';
  if (percent >= 0.5) return 'Halfway plumped';
  if (percent >= 0.25) return 'Momentum building';
  if (percent >= 0.1) return 'First wobble unlocked';
  return 'Saving in progress';
}

export const PlumpCard = forwardRef<View, PlumpCardProps>(function PlumpCard(
  {
    goalName,
    challengeName,
    saved,
    target,
    percent,
    mascotVariant,
    palette,
    subline,
    milestoneLabel,
    watermark = 'plump.app',
    width = 320,
  },
  ref,
) {
  const p = CARD_PALETTES[palette] ?? CARD_PALETTES.cream;
  const clampedPercent = Math.max(0, Math.min(1, percent));
  const headline = milestoneLabel ?? progressHeadline(clampedPercent);

  return (
    <View ref={ref} collapsable={false} style={[styles.card, { backgroundColor: p.bg, width }]}>
      <View style={styles.topRow}>
        <View style={[styles.brandPill, { backgroundColor: p.accent + '18' }]}>
          <Ionicons name="leaf" size={13} color={p.accent} />
          <Text style={[styles.brandText, { color: p.accent }]}>PLUMP</Text>
        </View>
        <Text style={[styles.watermarkTop, { color: p.sub }]}>{watermark}</Text>
      </View>

      <View style={styles.header}>
        <Text style={[styles.challenge, { color: p.sub }]}>{challengeName}</Text>
        <Text style={[styles.goal, { color: p.text }]} numberOfLines={2}>
          {goalName}
        </Text>
      </View>

      <View style={styles.heroRow}>
        <View style={[styles.mascotHalo, { backgroundColor: p.accent + '14' }]}>
          <Mascot variant={mascotVariant} plumpness={clampedPercent} size={width * 0.42} smug={clampedPercent >= 1} />
        </View>
        <View style={styles.numberBlock}>
          <Text style={[styles.saved, { color: p.accent }]}>{formatGBP(saved)}</Text>
          <Text style={[styles.target, { color: p.sub }]}>saved of {formatGBP(target)}</Text>
          <View style={[styles.milestonePill, { backgroundColor: p.accent + '16' }]}>
            <Ionicons name="sparkles" size={13} color={p.accent} />
            <Text style={[styles.milestoneText, { color: p.accent }]}>{headline}</Text>
          </View>
        </View>
      </View>

      <View style={styles.progressWrap}>
        <ProgressBarStandalone percent={clampedPercent} track={p.sub} fill={p.accent} />
      </View>

      <View style={styles.footer}>
        <View>
          <Text style={[styles.percent, { color: p.text }]}>{formatPercent(clampedPercent)} complete</Text>
          {subline ? <Text style={[styles.subline, { color: p.sub }]}>{subline}</Text> : null}
        </View>
        <View style={[styles.shareBadge, { backgroundColor: p.accent }]}>
          <Text style={[styles.shareBadgeText, { color: p.bg }]}>I’m plumping it</Text>
        </View>
      </View>
    </View>
  );
});

function ProgressBarStandalone({ percent, track, fill }: { percent: number; track: string; fill: string }) {
  return (
    <View style={{ height: 13, backgroundColor: track + '35', borderRadius: radius.pill, overflow: 'hidden' }}>
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
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  brandPill: { borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: 6, flexDirection: 'row', alignItems: 'center', gap: 5 },
  brandText: { fontFamily: fonts.bodyBlack, fontSize: fontSize.sm, letterSpacing: 1 },
  watermarkTop: { fontFamily: fonts.bodySemi, fontSize: fontSize.sm },
  header: { marginTop: spacing.lg },
  challenge: { fontFamily: fonts.bodySemi, fontSize: fontSize.sm, textTransform: 'uppercase', letterSpacing: 1 },
  goal: { fontFamily: fonts.display, fontSize: fontSize['2xl'], marginTop: 2, lineHeight: 32 },
  heroRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg, marginTop: spacing.lg },
  mascotHalo: { width: 132, height: 132, borderRadius: 66, alignItems: 'center', justifyContent: 'center' },
  numberBlock: { flex: 1 },
  saved: { fontFamily: fonts.display, fontSize: fontSize['4xl'] },
  target: { fontFamily: fonts.bodySemi, fontSize: fontSize.sm, marginTop: -2 },
  milestonePill: { alignSelf: 'flex-start', borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: 6, flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: spacing.sm },
  milestoneText: { fontFamily: fonts.bodyBold, fontSize: fontSize.sm },
  progressWrap: { marginTop: spacing.xl },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', gap: spacing.md, marginTop: spacing.md },
  percent: { fontFamily: fonts.bodyBold, fontSize: fontSize.base },
  subline: { fontFamily: fonts.bodySemi, fontSize: fontSize.sm, marginTop: 2 },
  shareBadge: { borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: 7 },
  shareBadgeText: { fontFamily: fonts.bodyBlack, fontSize: fontSize.sm },
});
