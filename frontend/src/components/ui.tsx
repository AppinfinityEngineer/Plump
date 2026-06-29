import React from 'react';
import {
  Text,
  type TextProps,
  Pressable,
  View,
  StyleSheet,
  ActivityIndicator,
  type ViewStyle,
  type StyleProp,
} from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { fonts, fontSize, radius, spacing, shadow, type ColorScheme } from '@/src/theme/theme';
import { useTheme } from '@/src/state/AppProvider';
import { haptics } from '@/src/haptics/haptics';

type TextVariant = 'display' | 'title' | 'heading' | 'body' | 'bodyBold' | 'caption' | 'number';

export function AppText({
  variant = 'body',
  style,
  color,
  ...rest
}: TextProps & { variant?: TextVariant; color?: string }) {
  const { colors } = useTheme();
  const base = {
    display: { fontFamily: fonts.display, fontSize: fontSize['4xl'], color: colors.onSurface },
    title: { fontFamily: fonts.display, fontSize: fontSize['3xl'], color: colors.onSurface },
    heading: { fontFamily: fonts.displaySemi, fontSize: fontSize.xl, color: colors.onSurface },
    body: { fontFamily: fonts.body, fontSize: fontSize.lg, color: colors.onSurface },
    bodyBold: { fontFamily: fonts.bodyBold, fontSize: fontSize.lg, color: colors.onSurface },
    caption: { fontFamily: fonts.bodySemi, fontSize: fontSize.base, color: colors.muted },
    number: { fontFamily: fonts.display, fontSize: fontSize['5xl'], color: colors.brandPrimary },
  }[variant];
  return <Text {...rest} style={[base, color ? { color } : null, style]} />;
}

export function Screen({
  children,
  style,
  edges = ['top', 'bottom'],
  bg,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  edges?: Edge[];
  bg?: string;
}) {
  const { colors } = useTheme();
  return (
    <SafeAreaView edges={edges} style={[{ flex: 1, backgroundColor: bg ?? colors.surface }, style]}>
      {children}
    </SafeAreaView>
  );
}

export function Card({
  children,
  style,
  testID,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}) {
  const { colors } = useTheme();
  return (
    <View
      testID={testID}
      style={[
        {
          backgroundColor: colors.surfaceSecondary,
          borderRadius: radius.lg,
          borderWidth: 1,
          borderColor: colors.border,
          padding: spacing.xl,
        },
        shadow(colors),
        style,
      ]}
    >
      {children}
    </View>
  );
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled,
  loading,
  testID,
  style,
}: {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  disabled?: boolean;
  loading?: boolean;
  testID?: string;
  style?: StyleProp<ViewStyle>;
}) {
  const { colors } = useTheme();
  const palette = buttonPalette(colors, variant);
  return (
    <Pressable
      testID={testID}
      disabled={disabled || loading}
      onPress={() => {
        void haptics.medium();
        onPress();
      }}
      style={({ pressed }) => [
        styles.btn,
        {
          backgroundColor: palette.bg,
          borderColor: palette.border,
          borderWidth: variant === 'ghost' ? 0 : variant === 'secondary' ? 1.5 : 0,
          opacity: disabled ? 0.5 : pressed ? 0.9 : 1,
          transform: [{ scale: pressed ? 0.98 : 1 }],
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={palette.text} />
      ) : (
        <Text style={[styles.btnText, { color: palette.text }]}>{label}</Text>
      )}
    </Pressable>
  );
}

function buttonPalette(colors: ColorScheme, variant: 'primary' | 'secondary' | 'ghost') {
  if (variant === 'primary') return { bg: colors.brandPrimary, text: colors.onBrandPrimary, border: 'transparent' };
  if (variant === 'secondary') return { bg: 'transparent', text: colors.onSurface, border: colors.borderStrong };
  return { bg: 'transparent', text: colors.brandPrimary, border: 'transparent' };
}

export function ProgressBar({ percent, height = 14 }: { percent: number; height?: number }) {
  const { colors } = useTheme();
  return (
    <View style={{ height, backgroundColor: colors.border, borderRadius: radius.pill, overflow: 'hidden' }}>
      <View
        style={{
          width: `${Math.max(2, Math.min(100, percent * 100))}%`,
          height: '100%',
          backgroundColor: colors.brandTertiary,
          borderRadius: radius.pill,
        }}
      />
    </View>
  );
}

export function ProgressDots({ total, index }: { total: number; index: number }) {
  const { colors } = useTheme();
  return (
    <View style={styles.dots}>
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          style={{
            width: i === index ? 22 : 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: i <= index ? colors.brandPrimary : colors.border,
          }}
        />
      ))}
    </View>
  );
}

// Onboarding top bar: optional back chevron + centered progress dots.
export function OnboardingHeader({
  step,
  total = 7,
  showBack = true,
  onBack,
}: {
  step: number;
  total?: number;
  showBack?: boolean;
  onBack?: () => void;
}) {
  const { colors } = useTheme();
  const router = useRouter();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', minHeight: 40, marginBottom: spacing.sm }}>
      <View style={{ width: 40 }}>
        {showBack ? (
          <Pressable testID="onboarding-back-button" onPress={onBack ?? (() => router.back())} hitSlop={12}>
            <Ionicons name="chevron-back" size={26} color={colors.onSurface} />
          </Pressable>
        ) : null}
      </View>
      <View style={{ flex: 1 }}>
        <ProgressDots total={total} index={step} />
      </View>
      <View style={{ width: 40 }} />
    </View>
  );
}

export function Badge({ label, bg, color }: { label: string; bg: string; color: string }) {
  return (
    <View style={{ backgroundColor: bg, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 4 }}>
      <Text style={{ fontFamily: fonts.bodyBold, fontSize: fontSize.sm, color }}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  btn: {
    height: 56,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  btnText: { fontFamily: fonts.displaySemi, fontSize: fontSize.xl },
  dots: { flexDirection: 'row', gap: 6, alignItems: 'center', justifyContent: 'center' },
});
