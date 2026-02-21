import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withDelay } from 'react-native-reanimated';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as Speech from 'expo-speech';
import Colors from '@/constants/colors';
import { useSOS } from '@/lib/sos-context';
import { TRANSLATIONS, FIRST_AID_TIPS, EMERGENCY_COLORS, EMERGENCY_ICONS } from '@/lib/emergency-data';

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

function TipItem({ step, index, delay }: { step: string; index: number; delay: number }) {
  const translateX = useSharedValue(-30);
  const opacity = useSharedValue(0);

  useEffect(() => {
    translateX.value = withDelay(delay, withTiming(0, { duration: 400 }));
    opacity.value = withDelay(delay, withTiming(1, { duration: 400 }));
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.tipItem, animStyle]}>
      <View style={styles.tipNumber}>
        <Text style={styles.tipNumberText}>{index + 1}</Text>
      </View>
      <Text style={styles.tipText}>{step}</Text>
    </Animated.View>
  );
}

export default function TipsScreen() {
  const insets = useSafeAreaInsets();
  const { language, emergencyType, ageGroup } = useSOS();
  const t = TRANSLATIONS[language];
  const [isSpeaking, setIsSpeaking] = useState(false);
  const topInset = Platform.OS === 'web' ? 67 : insets.top;

  const tips = emergencyType && ageGroup ? FIRST_AID_TIPS[emergencyType]?.[ageGroup] : null;
  const steps = tips?.steps[language] || [];
  const color = emergencyType ? EMERGENCY_COLORS[emergencyType] : Colors.primary;
  const iconInfo = emergencyType ? EMERGENCY_ICONS[emergencyType] : { name: 'medkit' };

  const LANG_CODES: Record<string, string> = {
    en: 'en-US', hi: 'hi-IN', es: 'es-ES', fr: 'fr-FR', zh: 'zh-CN',
  };

  const speakTips = () => {
    if (isSpeaking) {
      Speech.stop();
      setIsSpeaking(false);
      return;
    }

    const fullText = steps.join('. ');
    setIsSpeaking(true);
    Speech.speak(fullText, {
      language: LANG_CODES[language] || 'en-US',
      rate: 0.9,
      onDone: () => setIsSpeaking(false),
      onStopped: () => setIsSpeaking(false),
    });
  };

  useEffect(() => {
    if (steps.length > 0) {
      const timeout = setTimeout(() => {
        const fullText = steps.join('. ');
        setIsSpeaking(true);
        Speech.speak(fullText, {
          language: LANG_CODES[language] || 'en-US',
          rate: 0.9,
          onDone: () => setIsSpeaking(false),
          onStopped: () => setIsSpeaking(false),
        });
      }, 800);
      return () => clearTimeout(timeout);
    }
  }, []);

  useEffect(() => {
    return () => {
      Speech.stop();
    };
  }, []);

  const handleNext = () => {
    Speech.stop();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/hospital');
  };

  return (
    <View style={[styles.container, { paddingTop: topInset }]}>
      <View style={styles.header}>
        <Pressable onPress={() => { Speech.stop(); router.back(); }} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.white} />
        </Pressable>
        <TimerDisplay />
      </View>

      <View style={styles.content}>
        <View style={styles.titleRow}>
          <View style={[styles.emergencyBadge, { backgroundColor: color }]}>
            <Ionicons name={iconInfo.name as any} size={20} color={Colors.white} />
          </View>
          <Text style={styles.title}>{t.firstAidTips}</Text>
        </View>

        <View style={styles.tipsContainer}>
          {steps.map((step, i) => (
            <TipItem key={i} step={step} index={i} delay={i * 150} />
          ))}
        </View>

        <View style={styles.actionsRow}>
          <Pressable
            style={({ pressed }) => [styles.speakButton, { backgroundColor: isSpeaking ? Colors.accent : Colors.surface, opacity: pressed ? 0.8 : 1 }]}
            onPress={speakTips}
          >
            <Ionicons name={isSpeaking ? 'volume-mute' : 'volume-high'} size={22} color={Colors.white} />
            <Text style={styles.speakText}>
              {isSpeaking ? t.stopReading : t.readAloud}
            </Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.nextButton, { opacity: pressed ? 0.8 : 1, transform: [{ scale: pressed ? 0.97 : 1 }] }]}
            onPress={handleNext}
          >
            <Text style={styles.nextText}>{t.findHospital}</Text>
            <Ionicons name="arrow-forward" size={20} color={Colors.white} />
          </Pressable>
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
    paddingHorizontal: 20,
    justifyContent: 'space-between',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  emergencyBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontFamily: 'Inter_700Bold',
    fontSize: 22,
    color: Colors.white,
  },
  tipsContainer: {
    flex: 1,
    justifyContent: 'center',
    gap: 12,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  tipNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  tipNumberText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 13,
    color: Colors.white,
  },
  tipText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    color: Colors.white,
    flex: 1,
    lineHeight: 20,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
    paddingBottom: Platform.OS === 'web' ? 34 : 20,
    paddingTop: 12,
  },
  speakButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 14,
  },
  speakText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
    color: Colors.white,
  },
  nextButton: {
    flex: 1,
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  nextText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 15,
    color: Colors.white,
  },
});
