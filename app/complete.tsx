import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withDelay, withSpring } from 'react-native-reanimated';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useSOS } from '@/lib/sos-context';
import { TRANSLATIONS, EMERGENCY_COLORS } from '@/lib/emergency-data';

export default function CompleteScreen() {
  const insets = useSafeAreaInsets();
  const { language, emergencyType, ageGroup, category, formatElapsedTime, reset } = useSOS();
  const t = TRANSLATIONS[language];
  const topInset = Platform.OS === 'web' ? 67 : insets.top;

  const [finalTime] = useState(formatElapsedTime());

  const checkScale = useSharedValue(0);
  const textOpacity = useSharedValue(0);
  const summaryTranslate = useSharedValue(40);
  const summaryOpacity = useSharedValue(0);

  useEffect(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    checkScale.value = withSpring(1, { damping: 8, stiffness: 100 });
    textOpacity.value = withDelay(400, withTiming(1, { duration: 600 }));
    summaryTranslate.value = withDelay(800, withTiming(0, { duration: 500 }));
    summaryOpacity.value = withDelay(800, withTiming(1, { duration: 500 }));
  }, []);

  const checkAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: checkScale.value }],
  }));

  const textAnimStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
  }));

  const summaryAnimStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: summaryTranslate.value }],
    opacity: summaryOpacity.value,
  }));

  const handleDone = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    reset();
    router.dismissAll();
    router.replace('/');
  };

  const color = emergencyType ? EMERGENCY_COLORS[emergencyType] : Colors.primary;

  const ageLabels: Record<string, Record<string, string>> = {
    child: { en: 'Child (0-12)', hi: 'बच्चा (0-12)', es: 'Niño (0-12)', fr: 'Enfant (0-12)', zh: '儿童 (0-12)' },
    adult: { en: 'Adult (13-60)', hi: 'वयस्क (13-60)', es: 'Adulto (13-60)', fr: 'Adulte (13-60)', zh: '成人 (13-60)' },
    senior: { en: 'Senior (60+)', hi: 'वरिष्ठ (60+)', es: 'Mayor (60+)', fr: 'Senior (60+)', zh: '老年人 (60+)' },
    pregnant: { en: 'Pregnant', hi: 'गर्भवती', es: 'Embarazada', fr: 'Enceinte', zh: '孕妇' },
  };

  const catLabels: Record<string, Record<string, string>> = {
    trauma: { en: 'Trauma Care', hi: 'आघात देखभाल', es: 'Atención Trauma', fr: 'Soins Trauma', zh: '创伤护理' },
    unconscious: { en: 'Unconscious', hi: 'बेहोश', es: 'Inconsciente', fr: 'Inconscient', zh: '失去意识' },
  };

  return (
    <View style={[styles.container, { paddingTop: topInset }]}>
      <View style={styles.content}>
        <Animated.View style={[styles.checkCircle, checkAnimStyle]}>
          <Ionicons name="checkmark" size={56} color={Colors.white} />
        </Animated.View>

        <Animated.View style={[styles.textContainer, textAnimStyle]}>
          <Text style={styles.wellDone}>{t.wellDone}</Text>
          <Text style={styles.thankYou}>{t.thankYou}</Text>
          <Text style={styles.breathe}>{t.breathe}</Text>
        </Animated.View>

        <Animated.View style={[styles.summaryCard, summaryAnimStyle]}>
          <Text style={styles.summaryTitle}>{t.summary}</Text>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>{t.emergencyType}</Text>
            <View style={[styles.summaryBadge, { backgroundColor: color }]}>
              <Text style={styles.summaryBadgeText}>{emergencyType ? t[emergencyType] : '-'}</Text>
            </View>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>{t.category}</Text>
            <Text style={styles.summaryValue}>{category ? catLabels[category]?.[language] || category : '-'}</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>{t.ageGroup}</Text>
            <Text style={styles.summaryValue}>{ageGroup ? ageLabels[ageGroup]?.[language] || ageGroup : '-'}</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>{t.timeTaken}</Text>
            <View style={styles.timeBox}>
              <Ionicons name="time" size={16} color={Colors.accent} />
              <Text style={styles.timeText}>{finalTime}</Text>
            </View>
          </View>
        </Animated.View>

        <Pressable
          style={({ pressed }) => [styles.doneButton, { opacity: pressed ? 0.85 : 1, transform: [{ scale: pressed ? 0.97 : 1 }] }]}
          onPress={handleDone}
        >
          <Ionicons name="home" size={22} color={Colors.white} />
          <Text style={styles.doneText}>
            {language === 'en' ? 'Back to Home' :
             language === 'hi' ? 'होम पर वापस जाएं' :
             language === 'es' ? 'Volver al Inicio' :
             language === 'fr' ? "Retour à l'Accueil" :
             '返回首页'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  checkCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.success,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: Colors.success,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: 28,
    gap: 8,
  },
  wellDone: {
    fontFamily: 'Inter_800ExtraBold',
    fontSize: 32,
    color: Colors.success,
  },
  thankYou: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 18,
    color: Colors.white,
    textAlign: 'center',
  },
  breathe: {
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
  },
  summaryCard: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    padding: 20,
    width: '100%',
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    gap: 14,
    marginBottom: 28,
  },
  summaryTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 18,
    color: Colors.white,
    marginBottom: 4,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: Colors.textSecondary,
  },
  summaryValue: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: Colors.white,
  },
  summaryBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
  },
  summaryBadgeText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
    color: Colors.white,
  },
  timeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  timeText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 16,
    color: Colors.accent,
  },
  doneButton: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 32,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  doneText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: Colors.white,
  },
});
