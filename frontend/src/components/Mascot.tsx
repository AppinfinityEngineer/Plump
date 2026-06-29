import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, View } from 'react-native';
import Svg, { Circle, Ellipse, Path, G } from 'react-native-svg';

import { AppText } from '@/src/components/ui';
import { haptics } from '@/src/haptics/haptics';

export type MascotVariant = 'honey' | 'sage' | 'rosy' | 'cocoa';
export type MascotMotion = 'none' | 'idle' | 'success';

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
const DEFAULT_TAP_PHRASES = [
  'Thunk me.',
  'Tiny save, rounder belly.',
  'Feed me savings.',
  'I believe in this goal.',
];

interface MascotProps {
  variant?: MascotVariant;
  plumpness?: number; // 0..1
  size?: number;
  smug?: boolean;
  motion?: MascotMotion;
  interactive?: boolean;
  tapPhrases?: string[];
  testID?: string;
}

export function Mascot({
  variant = 'honey',
  plumpness = 0,
  size = 160,
  smug,
  motion = 'idle',
  interactive,
  tapPhrases = DEFAULT_TAP_PHRASES,
  testID = 'plump-mascot',
}: MascotProps) {
  const c = MASCOT_VARIANTS[variant];
  const p = Math.max(0, Math.min(1, plumpness));
  const canInteract = interactive ?? size >= 120;
  const idle = useRef(new Animated.Value(0)).current;
  const tapScale = useRef(new Animated.Value(1)).current;
  const bubbleOpacity = useRef(new Animated.Value(0)).current;
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [bubbleVisible, setBubbleVisible] = useState(false);
  const bubbleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (motion === 'none') return undefined;

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(idle, {
          toValue: 1,
          duration: motion === 'success' ? 820 : 1450,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(idle, {
          toValue: 0,
          duration: motion === 'success' ? 820 : 1450,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );

    loop.start();
    return () => loop.stop();
  }, [idle, motion]);

  useEffect(() => {
    if (motion !== 'success') return;
    Animated.sequence([
      Animated.spring(tapScale, { toValue: 1.14, friction: 4, tension: 130, useNativeDriver: true }),
      Animated.spring(tapScale, { toValue: 0.96, friction: 5, tension: 120, useNativeDriver: true }),
      Animated.spring(tapScale, { toValue: 1, friction: 5, tension: 110, useNativeDriver: true }),
    ]).start();
  }, [motion, tapScale]);

  useEffect(() => {
    return () => {
      if (bubbleTimer.current) clearTimeout(bubbleTimer.current);
    };
  }, []);

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
  const height = size * (230 / 200);
  const idleTranslateY = motion === 'none'
    ? 0
    : idle.interpolate({ inputRange: [0, 1], outputRange: [0, motion === 'success' ? -7 : -4] });
  const idleScale = motion === 'none'
    ? 1
    : idle.interpolate({ inputRange: [0, 1], outputRange: [1, motion === 'success' ? 1.025 : 1.012] });

  const onPress = () => {
    if (!canInteract) return;
    void haptics.selection();
    setPhraseIndex((current) => (current + 1) % tapPhrases.length);
    setBubbleVisible(true);

    Animated.sequence([
      Animated.spring(tapScale, { toValue: 1.1, friction: 3, tension: 150, useNativeDriver: true }),
      Animated.spring(tapScale, { toValue: 0.98, friction: 4, tension: 140, useNativeDriver: true }),
      Animated.spring(tapScale, { toValue: 1, friction: 5, tension: 110, useNativeDriver: true }),
    ]).start();

    Animated.sequence([
      Animated.timing(bubbleOpacity, { toValue: 1, duration: 120, useNativeDriver: true }),
      Animated.delay(950),
      Animated.timing(bubbleOpacity, { toValue: 0, duration: 180, useNativeDriver: true }),
    ]).start();

    if (bubbleTimer.current) clearTimeout(bubbleTimer.current);
    bubbleTimer.current = setTimeout(() => setBubbleVisible(false), 1300);
  };

  const svg = (
    <Svg width={size} height={height} viewBox="0 0 200 230">
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

  const mascotBody = (
    <View style={[styles.wrap, { width: size, minHeight: height }]}>
      {bubbleVisible ? (
        <Animated.View
          pointerEvents="none"
          testID={`${testID}-reaction-bubble`}
          style={[
            styles.bubble,
            {
              opacity: bubbleOpacity,
              transform: [{ translateY: bubbleOpacity.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }) }],
            },
          ]}
        >
          <AppText variant="caption" style={styles.bubbleText}>
            {tapPhrases[phraseIndex]}
          </AppText>
        </Animated.View>
      ) : null}

      <Animated.View
        testID={`${testID}-animated-body`}
        style={{
          transform: [{ translateY: idleTranslateY }, { scale: idleScale }, { scale: tapScale }],
        }}
      >
        {svg}
      </Animated.View>
    </View>
  );

  if (!canInteract) return mascotBody;

  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel="Tap Plump mascot"
      onPress={onPress}
      hitSlop={10}
    >
      {mascotBody}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  bubble: {
    position: 'absolute',
    top: 0,
    zIndex: 10,
    borderRadius: 999,
    backgroundColor: '#FFF8EC',
    borderColor: '#E7D7C3',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  bubbleText: {
    color: BROWN,
    fontSize: 11,
  },
});
