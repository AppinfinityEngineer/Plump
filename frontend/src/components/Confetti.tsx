import React, { useEffect, useRef } from 'react';
import { Animated, Dimensions, Easing, StyleSheet, View } from 'react-native';

const COLORS = ['#E8A765', '#3F8C32', '#F2A6A0', '#7FB86A', '#F6DCAE', '#BDE1A7'];
const { width: SCREEN_W } = Dimensions.get('window');

function Piece({ index, play }: { index: number; play: boolean }) {
  const fall = useRef(new Animated.Value(0)).current;
  const startX = (index / 28) * SCREEN_W + (Math.random() * 30 - 15);
  const color = COLORS[index % COLORS.length];
  const size = 8 + (index % 3) * 4;
  const delay = (index % 8) * 60;

  useEffect(() => {
    if (!play) return;
    fall.setValue(0);
    Animated.timing(fall, {
      toValue: 1,
      duration: 1600 + Math.random() * 800,
      delay,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  }, [play, fall, delay]);

  const translateY = fall.interpolate({ inputRange: [0, 1], outputRange: [-40, 640] });
  const rotate = fall.interpolate({ inputRange: [0, 1], outputRange: ['0deg', `${360 + index * 20}deg`] });
  const opacity = fall.interpolate({ inputRange: [0, 0.8, 1], outputRange: [1, 1, 0] });

  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute',
        left: startX,
        top: 0,
        width: size,
        height: size * 1.4,
        borderRadius: 2,
        backgroundColor: color,
        opacity,
        transform: [{ translateY }, { rotate }],
      }}
    />
  );
}

export function Confetti({ play }: { play: boolean }) {
  if (!play) return null;
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {Array.from({ length: 28 }).map((_, i) => (
        <Piece key={i} index={i} play={play} />
      ))}
    </View>
  );
}
