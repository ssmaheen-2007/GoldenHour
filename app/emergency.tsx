import React, { useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withDelay } from 'react-native-reanimated';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useSOS } from '@/lib/sos-context';
import { TRANSLATIONS, EMERGENCY_ICONS, EMERGENCY_COLORS, getEmergencyTypes, EmergencyType } from '@/lib/emergency-data';

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

function EmergencyCard({ type, label, delay, onPress }: { type: EmergencyType; label: string; delay: number; onPress: () => void }) {
  const scale = useSharedValue(0.8);
  const opacity = useSharedValue(0);
  const color = EMERGENCY_COLORS[type];
  const iconInfo = EMERGENCY_ICONS[type];

  useEffect(() => {
    scale.value = withDelay(delay, withTiming(1, { duration: 350 }));
    opacity.value = withDelay(delay, withTiming(1, { duration: 350 }));
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[animStyle, styles.emergencyCardWrapper]}>
      <Pressable
        style={({ pressed }) => [styles.emergencyCard, { borderColor: color, opacity: pressed ? 0.8 : 1, transform: [{ scale: pressed ? 0.93 : 1 }] }]}
        onPress={onPress}
      >
        <View style={[styles.emergencyIcon, { backgroundColor: color }]}>
          <Ionicons name={iconInfo.name as any} size={22} color={Colors.white} />
        </View>
        <Text style={styles.emergencyLabel} numberOfLines={2}>{label}</Text>
      </Pressable>
    </Animated.View>
  );
}

export default function EmergencyScreen() {
  const insets = useSafeAreaInsets();
  const { language, ageGroup, setEmergencyType } = useSOS();
  const t = TRANSLATIONS[language];
  const topInset = Platform.OS === 'web' ? 67 : insets.top;

  const emergencies = getEmergencyTypes(ageGroup || 'adult');

  const handleSelect = (type: EmergencyType) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setEmergencyType(type);
    router.push('/questions');
  };

  return (
    <View style={[styles.container, { paddingTop: topInset }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.white} />
        </Pressable>
        <TimerDisplay />
      </View>

      <Text style={styles.title}>{t.selectEmergency}</Text>

      <View style={styles.grid}>
        {emergencies.map((type, i) => (
          <EmergencyCard
            key={type}
            type={type}
            label={t[type]}
            delay={i * 60}
            onPress={() => handleSelect(type)}
          />
        ))}
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
  title: {
    fontFamily: 'Inter_700Bold',
    fontSize: 22,
    color: Colors.white,
    textAlign: 'center',
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  grid: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 10,
    alignContent: 'center',
    justifyContent: 'center',
  },
  emergencyCardWrapper: {
    width: '30%',
    minWidth: 100,
  },
  emergencyCard: {
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    aspectRatio: 1,
  },
  emergencyIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emergencyLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
    color: Colors.white,
    textAlign: 'center',
  },
});
