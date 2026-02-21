import React, { useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withDelay } from 'react-native-reanimated';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useSOS } from '@/lib/sos-context';
import { TRANSLATIONS, AgeGroup } from '@/lib/emergency-data';

function TimerDisplay() {
  const { formatElapsedTime, isTimerRunning } = useSOS();
  const [time, setTime] = React.useState('00:00');

  React.useEffect(() => {
    if (!isTimerRunning) return;
    const interval = setInterval(() => setTime(formatElapsedTime()), 1000);
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  return (
    <View style={styles.timerContainer}>
      <Ionicons name="time-outline" size={16} color={Colors.accent} />
      <Text style={styles.timerText}>{time}</Text>
    </View>
  );
}

const AGE_OPTIONS: { key: AgeGroup; icon: string; color: string }[] = [
  { key: 'child', icon: 'happy', color: '#4CAF50' },
  { key: 'adult', icon: 'person', color: '#2196F3' },
  { key: 'senior', icon: 'accessibility', color: '#FF9800' },
  { key: 'pregnant', icon: 'heart', color: '#E91E63' },
];

function AgeCard({ ageKey, icon, color, label, delay, onPress }: { ageKey: string; icon: string; color: string; label: string; delay: number; onPress: () => void }) {
  const translateY = useSharedValue(30);
  const opacity = useSharedValue(0);

  useEffect(() => {
    translateY.value = withDelay(delay, withTiming(0, { duration: 400 }));
    opacity.value = withDelay(delay, withTiming(1, { duration: 400 }));
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[animStyle, { flex: 1 }]}>
      <Pressable
        style={({ pressed }) => [styles.ageCard, { borderColor: color, opacity: pressed ? 0.8 : 1, transform: [{ scale: pressed ? 0.95 : 1 }] }]}
        onPress={onPress}
      >
        <View style={[styles.ageIcon, { backgroundColor: color }]}>
          <Ionicons name={icon as any} size={28} color={Colors.white} />
        </View>
        <Text style={styles.ageLabel} numberOfLines={2}>{label}</Text>
      </Pressable>
    </Animated.View>
  );
}

export default function AgeScreen() {
  const insets = useSafeAreaInsets();
  const { language, setAgeGroup } = useSOS();
  const t = TRANSLATIONS[language];
  const topInset = Platform.OS === 'web' ? 67 : insets.top;

  const handleSelect = (age: AgeGroup) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setAgeGroup(age);
    router.push('/emergency');
  };

  const labels: Record<AgeGroup, string> = {
    child: t.child,
    adult: t.adult,
    senior: t.senior,
    pregnant: t.pregnant,
  };

  return (
    <View style={[styles.container, { paddingTop: topInset }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.white} />
        </Pressable>
        <TimerDisplay />
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>{t.selectAge}</Text>

        <View style={styles.grid}>
          {AGE_OPTIONS.map((opt, i) => (
            <AgeCard
              key={opt.key}
              ageKey={opt.key}
              icon={opt.icon}
              color={opt.color}
              label={labels[opt.key]}
              delay={i * 100}
              onPress={() => handleSelect(opt.key)}
            />
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,82,82,0.15)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,82,82,0.3)',
  },
  timerText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 16,
    color: Colors.accent,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  title: {
    fontFamily: 'Inter_700Bold',
    fontSize: 24,
    color: Colors.white,
    textAlign: 'center',
    marginBottom: 32,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
  },
  ageCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: '45%',
    gap: 10,
  },
  ageIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ageLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: Colors.white,
    textAlign: 'center',
  },
});
