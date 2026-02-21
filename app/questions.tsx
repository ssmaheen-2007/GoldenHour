import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withSequence } from 'react-native-reanimated';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useSOS } from '@/lib/sos-context';
import { TRANSLATIONS, TRIAGE_QUESTIONS, EMERGENCY_COLORS } from '@/lib/emergency-data';

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

export default function QuestionsScreen() {
  const insets = useSafeAreaInsets();
  const { language, emergencyType, addTriageAnswer } = useSOS();
  const t = TRANSLATIONS[language];
  const [currentQ, setCurrentQ] = useState(0);
  const topInset = Platform.OS === 'web' ? 67 : insets.top;

  const questions = emergencyType ? TRIAGE_QUESTIONS[emergencyType] : [];
  const color = emergencyType ? EMERGENCY_COLORS[emergencyType] : Colors.primary;

  const cardOpacity = useSharedValue(1);
  const cardTranslate = useSharedValue(0);

  const animStyle = useAnimatedStyle(() => ({
    opacity: cardOpacity.value,
    transform: [{ translateX: cardTranslate.value }],
  }));

  const handleAnswer = (answer: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    addTriageAnswer(answer);

    if (currentQ < questions.length - 1) {
      cardOpacity.value = withSequence(
        withTiming(0, { duration: 150 }),
        withTiming(1, { duration: 150 })
      );
      cardTranslate.value = withSequence(
        withTiming(answer ? -50 : 50, { duration: 150 }),
        withTiming(0, { duration: 150 })
      );
      setTimeout(() => setCurrentQ(prev => prev + 1), 150);
    } else {
      router.push('/tips');
    }
  };

  if (!emergencyType || questions.length === 0) return null;

  const question = questions[currentQ];

  return (
    <View style={[styles.container, { paddingTop: topInset }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.white} />
        </Pressable>
        <TimerDisplay />
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>{t.triageQuestions}</Text>

        <View style={styles.progressRow}>
          {questions.map((_, i) => (
            <View
              key={i}
              style={[styles.progressDot, {
                backgroundColor: i < currentQ ? color : i === currentQ ? Colors.white : Colors.card,
              }]}
            />
          ))}
        </View>

        <Text style={styles.questionNumber}>
          {currentQ + 1} / {questions.length}
        </Text>

        <Animated.View style={[styles.questionCard, { borderColor: color }, animStyle]}>
          <Ionicons name="help-circle" size={40} color={color} />
          <Text style={styles.questionText}>
            {question.question[language]}
          </Text>
        </Animated.View>

        <View style={styles.buttonsRow}>
          <Pressable
            style={({ pressed }) => [styles.answerButton, styles.yesButton, { opacity: pressed ? 0.8 : 1, transform: [{ scale: pressed ? 0.95 : 1 }] }]}
            onPress={() => handleAnswer(true)}
          >
            <Ionicons name="checkmark-circle" size={28} color={Colors.white} />
            <Text style={styles.answerText}>{t.yes}</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.answerButton, styles.noButton, { opacity: pressed ? 0.8 : 1, transform: [{ scale: pressed ? 0.95 : 1 }] }]}
            onPress={() => handleAnswer(false)}
          >
            <Ionicons name="close-circle" size={28} color={Colors.white} />
            <Text style={styles.answerText}>{t.no}</Text>
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
    justifyContent: 'center',
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  title: {
    fontFamily: 'Inter_700Bold',
    fontSize: 22,
    color: Colors.white,
    marginBottom: 20,
  },
  progressRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  progressDot: {
    width: 40,
    height: 5,
    borderRadius: 3,
  },
  questionNumber: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 24,
  },
  questionCard: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    padding: 28,
    borderWidth: 2,
    alignItems: 'center',
    gap: 16,
    width: '100%',
    marginBottom: 32,
  },
  questionText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 18,
    color: Colors.white,
    textAlign: 'center',
    lineHeight: 26,
  },
  buttonsRow: {
    flexDirection: 'row',
    gap: 16,
    width: '100%',
  },
  answerButton: {
    flex: 1,
    paddingVertical: 18,
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  yesButton: {
    backgroundColor: '#388E3C',
  },
  noButton: {
    backgroundColor: '#D32F2F',
  },
  answerText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 18,
    color: Colors.white,
  },
});
