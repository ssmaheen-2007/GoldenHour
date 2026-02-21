import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet, Platform, Linking, ActivityIndicator } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withDelay } from 'react-native-reanimated';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as Location from 'expo-location';
import Colors from '@/constants/colors';
import { useSOS } from '@/lib/sos-context';
import { TRANSLATIONS } from '@/lib/emergency-data';

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

export default function HospitalScreen() {
  const insets = useSafeAreaInsets();
  const { language } = useSOS();
  const t = TRANSLATIONS[language];
  const topInset = Platform.OS === 'web' ? 67 : insets.top;

  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [loading, setLoading] = useState(true);
  const [permDenied, setPermDenied] = useState(false);

  const cardOpacity = useSharedValue(0);
  const cardTranslate = useSharedValue(30);

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setPermDenied(true);
          setLoading(false);
          return;
        }
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        setLocation(loc);
      } catch (e) {
        console.log('Location error:', e);
      } finally {
        setLoading(false);
        cardOpacity.value = withDelay(200, withTiming(1, { duration: 500 }));
        cardTranslate.value = withDelay(200, withTiming(0, { duration: 500 }));
      }
    })();
  }, []);

  const cardAnimStyle = useAnimatedStyle(() => ({
    opacity: cardOpacity.value,
    transform: [{ translateY: cardTranslate.value }],
  }));

  const openMaps = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (location) {
      const { latitude, longitude } = location.coords;
      const query = encodeURIComponent('hospital');
      const url = Platform.select({
        ios: `maps:?q=${query}&sll=${latitude},${longitude}`,
        android: `geo:${latitude},${longitude}?q=${query}`,
        default: `https://www.google.com/maps/search/hospital+near+me/@${latitude},${longitude},14z`,
      });
      if (url) Linking.openURL(url);
    } else {
      const url = 'https://www.google.com/maps/search/hospital+near+me';
      Linking.openURL(url);
    }
  };

  const handleAdmitted = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    router.push('/complete');
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
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>
              {language === 'en' ? 'Getting your location...' :
               language === 'hi' ? 'आपका स्थान प्राप्त कर रहे हैं...' :
               language === 'es' ? 'Obteniendo su ubicación...' :
               language === 'fr' ? 'Obtention de votre position...' :
               '获取您的位置...'}
            </Text>
          </View>
        ) : (
          <Animated.View style={[styles.cardContainer, cardAnimStyle]}>
            <View style={styles.hospitalCard}>
              <View style={styles.hospitalIconContainer}>
                <Ionicons name="medical" size={48} color={Colors.white} />
              </View>
              <Text style={styles.hospitalTitle}>{t.nearestHospital}</Text>

              {permDenied ? (
                <Text style={styles.permText}>
                  {language === 'en' ? 'Location access needed to find nearby hospitals. You can still search manually.' :
                   language === 'hi' ? 'निकटतम अस्पताल खोजने के लिए स्थान एक्सेस आवश्यक।' :
                   language === 'es' ? 'Se necesita acceso a la ubicación para encontrar hospitales cercanos.' :
                   language === 'fr' ? 'Accès à la localisation nécessaire.' :
                   '需要位置权限来查找附近医院。'}
                </Text>
              ) : location ? (
                <Text style={styles.coordText}>
                  {location.coords.latitude.toFixed(4)}, {location.coords.longitude.toFixed(4)}
                </Text>
              ) : null}

              <Pressable
                style={({ pressed }) => [styles.navigateButton, { opacity: pressed ? 0.8 : 1, transform: [{ scale: pressed ? 0.97 : 1 }] }]}
                onPress={openMaps}
              >
                <Ionicons name="navigate" size={22} color={Colors.white} />
                <Text style={styles.navigateText}>{t.navigateToHospital}</Text>
              </Pressable>
            </View>

            <Pressable
              style={({ pressed }) => [styles.admittedButton, { opacity: pressed ? 0.85 : 1, transform: [{ scale: pressed ? 0.97 : 1 }] }]}
              onPress={handleAdmitted}
            >
              <Ionicons name="checkmark-done-circle" size={26} color={Colors.white} />
              <Text style={styles.admittedText}>{t.patientAdmitted}</Text>
            </Pressable>
          </Animated.View>
        )}
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
  loadingContainer: {
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 16,
    color: Colors.textSecondary,
  },
  cardContainer: {
    gap: 20,
  },
  hospitalCard: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    gap: 16,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  hospitalIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#1565C0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  hospitalTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 22,
    color: Colors.white,
  },
  permText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
  coordText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: Colors.textMuted,
  },
  navigateButton: {
    backgroundColor: '#1565C0',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    width: '100%',
    justifyContent: 'center',
  },
  navigateText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 16,
    color: Colors.white,
  },
  admittedButton: {
    backgroundColor: Colors.success,
    borderRadius: 16,
    paddingVertical: 18,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  admittedText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 18,
    color: Colors.white,
  },
});
