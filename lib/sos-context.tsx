import React, { createContext, useContext, useState, useMemo, useCallback, ReactNode } from 'react';
import { AgeGroup, Category, EmergencyType, Language } from './emergency-data';

interface SOSState {
  language: Language;
  category: Category | null;
  ageGroup: AgeGroup | null;
  emergencyType: EmergencyType | null;
  timerStart: number | null;
  triageAnswers: boolean[];
  isTimerRunning: boolean;
}

interface SOSContextValue extends SOSState {
  setLanguage: (lang: Language) => void;
  setCategory: (cat: Category) => void;
  setAgeGroup: (age: AgeGroup) => void;
  setEmergencyType: (type: EmergencyType) => void;
  startTimer: () => void;
  addTriageAnswer: (answer: boolean) => void;
  getElapsedTime: () => number;
  formatElapsedTime: () => string;
  reset: () => void;
}

const SOSContext = createContext<SOSContextValue | null>(null);

const initialState: SOSState = {
  language: 'en',
  category: null,
  ageGroup: null,
  emergencyType: null,
  timerStart: null,
  triageAnswers: [],
  isTimerRunning: false,
};

export function SOSProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<SOSState>(initialState);

  const setLanguage = useCallback((language: Language) => {
    setState(prev => ({ ...prev, language }));
  }, []);

  const setCategory = useCallback((category: Category) => {
    setState(prev => ({ ...prev, category }));
  }, []);

  const setAgeGroup = useCallback((ageGroup: AgeGroup) => {
    setState(prev => ({ ...prev, ageGroup }));
  }, []);

  const setEmergencyType = useCallback((emergencyType: EmergencyType) => {
    setState(prev => ({ ...prev, emergencyType }));
  }, []);

  const startTimer = useCallback(() => {
    setState(prev => ({ ...prev, timerStart: Date.now(), isTimerRunning: true }));
  }, []);

  const addTriageAnswer = useCallback((answer: boolean) => {
    setState(prev => ({ ...prev, triageAnswers: [...prev.triageAnswers, answer] }));
  }, []);

  const getElapsedTime = useCallback(() => {
    if (!state.timerStart) return 0;
    return Math.floor((Date.now() - state.timerStart) / 1000);
  }, [state.timerStart]);

  const formatElapsedTime = useCallback(() => {
    const seconds = getElapsedTime();
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, [getElapsedTime]);

  const reset = useCallback(() => {
    setState(initialState);
  }, []);

  const value = useMemo(() => ({
    ...state,
    setLanguage,
    setCategory,
    setAgeGroup,
    setEmergencyType,
    startTimer,
    addTriageAnswer,
    getElapsedTime,
    formatElapsedTime,
    reset,
  }), [state, setLanguage, setCategory, setAgeGroup, setEmergencyType, startTimer, addTriageAnswer, getElapsedTime, formatElapsedTime, reset]);

  return (
    <SOSContext.Provider value={value}>
      {children}
    </SOSContext.Provider>
  );
}

export function useSOS() {
  const context = useContext(SOSContext);
  if (!context) {
    throw new Error('useSOS must be used within SOSProvider');
  }
  return context;
}
