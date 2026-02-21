import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet, Platform, Modal } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, withSequence, Easing, withDelay } from 'react-native-reanimated';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useSOS } from '@/lib/sos-context';
import { LANGUAGES, TRANSLATIONS, Language } from '@/lib/emergency-data';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function PulseRing({ delay }: { delay: number }) {
  const scale = useSharedValue(0.8);
  const opacity = useSharedValue(0.6);

  useEffect(() => {
    scale.value = withDelay(delay, withRepeat(
      withTiming(2.2, { duration: 2000, easing: Easing.out(Easing.ease) }),
      -1,
      false
    ));
    opacity.value = withDelay(delay, withRepeat(
      withTiming(0, { duration: 2000, easing: Easing.out(Easing.ease) }),
      -1,
      false
    ));
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.pulseRing, animStyle]} />
  );
}

export default function SOSScreen() {
  const insets = useSafeAreaInsets();
  const { language, setLanguage, startTimer, reset } = useSOS();
  const t = TRANSLATIONS[language];
  const [showLangModal, setShowLangModal] = useState(false);

  const buttonScale = useSharedValue(1);

  useEffect(() => {
    reset();
    buttonScale.value = withRepeat(
      withSequence(
        withTiming(1.05, { duration: 800, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.95, { duration: 800, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      true
    );
  }, []);

  const buttonAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  const handleSOS = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    startTimer();
    router.push('/category');
  };

  const topInset = Platform.OS === 'web' ? 67 : insets.top;

  return (
    <View style={[styles.container, { paddingTop: topInset }]}>
      <View style={styles.header}>
        <Text style={styles.appTitle}>SOS First Aid</Text>
        <Pressable
          onPress={() => setShowLangModal(true)}
          style={styles.langButton}
        >
          <Ionicons name="globe-outline" size={22} color={Colors.white} />
          <Text style={styles.langText}>
            {LANGUAGES.find(l => l.code === language)?.native}
          </Text>
        </Pressable>
      </View>

      <View style={styles.centerContent}>
        <View style={styles.sosContainer}>
          <PulseRing delay={0} />
          <PulseRing delay={666} />
          <PulseRing delay={1333} />
          <AnimatedPressable
            style={[styles.sosButton, buttonAnimStyle]}
            onPress={handleSOS}
            testID="sos-button"
          >
            <Ionicons name="medkit" size={48} color={Colors.white} />
            <Text style={styles.sosText}>{t.helpNow}</Text>
          </AnimatedPressable>
        </View>

        <Text style={styles.instruction}>
          {language === 'en' ? 'Tap the button in an emergency' :
           language === 'hi' ? 'आपातकाल में बटन दबाएं' :
           language === 'es' ? 'Toque el botón en una emergencia' :
           language === 'fr' ? "Appuyez sur le bouton en cas d'urgence" :
           '紧急情况下点击按钮'}
        </Text>
      </View>

      <View style={[styles.footer, { paddingBottom: Platform.OS === 'web' ? 34 : insets.bottom + 16 }]}>
        <Text style={styles.footerText}>
          {language === 'en' ? 'Works Offline' :
           language === 'hi' ? 'ऑफलाइन काम करता है' :
           language === 'es' ? 'Funciona sin conexión' :
           language === 'fr' ? 'Fonctionne hors ligne' :
           '离线可用'}
        </Text>
        <Ionicons name="wifi" size={16} color={Colors.textMuted} style={{ marginLeft: 6 }} />
      </View>

      <Modal visible={showLangModal} transparent animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={() => setShowLangModal(false)}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t.language}</Text>
            {LANGUAGES.map((lang) => (
              <Pressable
                key={lang.code}
                style={[styles.langOption, language === lang.code && styles.langOptionActive]}
                onPress={() => {
                  setLanguage(lang.code as Language);
                  setShowLangModal(false);
                  Haptics.selectionAsync();
                }}
              >
                <Text style={[styles.langOptionText, language === lang.code && styles.langOptionTextActive]}>
                  {lang.native}
                </Text>
                <Text style={styles.langOptionLabel}>{lang.label}</Text>
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>
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
  appTitle: {
    fontFamily: 'Inter_800ExtraBold',
    fontSize: 22,
    color: Colors.white,
  },
  langButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.card,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  langText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    color: Colors.white,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sosContainer: {
    width: 220,
    height: 220,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pulseRing: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 3,
    borderColor: Colors.primary,
  },
  sosButton: {
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 30,
    elevation: 20,
    gap: 8,
  },
  sosText: {
    fontFamily: 'Inter_800ExtraBold',
    fontSize: 22,
    color: Colors.white,
    letterSpacing: 2,
  },
  instruction: {
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    color: Colors.textSecondary,
    marginTop: 40,
    textAlign: 'center',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
  },
  footerText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: Colors.textMuted,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: Colors.backgroundLight,
    borderRadius: 20,
    padding: 24,
    width: '80%',
    maxWidth: 340,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  modalTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 20,
    color: Colors.white,
    marginBottom: 16,
    textAlign: 'center',
  },
  langOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 4,
  },
  langOptionActive: {
    backgroundColor: Colors.primary,
  },
  langOptionText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: Colors.white,
  },
  langOptionTextActive: {
    color: Colors.white,
  },
  langOptionLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: Colors.textSecondary,
  },
});
