import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withDelay } from 'react-native-reanimated';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useSOS } from '@/lib/sos-context';
import { TRANSLATIONS, Category } from '@/lib/emergency-data';

function TimerDisplay() {
  const { formatElapsedTime, isTimerRunning } = useSOS();
  const [time, setTime] = useState('00:00');

  useEffect(() => {
    if (!isTimerRunning) return;
    const interval = setInterval(() => {
      setTime(formatElapsedTime());
    }, 1000);
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  return (
    <View style={styles.timerContainer}>
      <Ionicons name="time-outline" size={16} color={Colors.accent} />
      <Text style={styles.timerText}>{time}</Text>
    </View>
  );
}

function CategoryCard({ title, icon, color, delay, onPress }: { title: string; icon: string; color: string; delay: number; onPress: () => void }) {
  const translateY = useSharedValue(40);
  const opacity = useSharedValue(0);

  useEffect(() => {
    translateY.value = withDelay(delay, withTiming(0, { duration: 500 }));
    opacity.value = withDelay(delay, withTiming(1, { duration: 500 }));
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={animStyle}>
      <Pressable
        style={({ pressed }) => [styles.card, { borderColor: color, opacity: pressed ? 0.8 : 1, transform: [{ scale: pressed ? 0.97 : 1 }] }]}
        onPress={onPress}
      >
        <View style={[styles.iconCircle, { backgroundColor: color }]}>
          <Ionicons name={icon as any} size={40} color={Colors.white} />
        </View>
        <Text style={styles.cardTitle}>{title}</Text>
      </Pressable>
    </Animated.View>
  );
}

export default function CategoryScreen() {
  const insets = useSafeAreaInsets();
  const { language, setCategory } = useSOS();
  const t = TRANSLATIONS[language];

  const topInset = Platform.OS === 'web' ? 67 : insets.top;

  const handleSelect = (cat: Category) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setCategory(cat);
    router.push('/age');
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
        <Text style={styles.title}>
          {language === 'en' ? 'What type of emergency?' :
           language === 'hi' ? 'किस प्रकार की आपातकाल?' :
           language === 'es' ? '¿Qué tipo de emergencia?' :
           language === 'fr' ? "Quel type d'urgence?" :
           '什么类型的紧急情况？'}
        </Text>

        <View style={styles.cardsContainer}>
          <CategoryCard
            title={t.traumaCare}
            icon="bandage"
            color="#E53935"
            delay={100}
            onPress={() => handleSelect('trauma')}
          />
          <CategoryCard
            title={t.unconscious}
            icon="pulse"
            color="#1565C0"
            delay={250}
            onPress={() => handleSelect('unconscious')}
          />
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
    fontSize: 26,
    color: Colors.white,
    textAlign: 'center',
    marginBottom: 40,
  },
  cardsContainer: {
    gap: 20,
  },
  card: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    padding: 28,
    borderWidth: 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 22,
    color: Colors.white,
    flex: 1,
  },
});
