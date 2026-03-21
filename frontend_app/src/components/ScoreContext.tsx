"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { fetchApi } from '../lib/api';

export interface UserLangs {
  source: string;
  target: string;
}

interface ScoreContextType {
  score: number;
  langs: UserLangs | null;
  setScore: (score: number) => void;
  updateScore: (score: number) => void;
  refreshScore: () => Promise<void>;
}

const ScoreContext = createContext<ScoreContextType | undefined>(undefined);

export function ScoreProvider({ children }: { children: React.ReactNode }) {
  const [score, setScore] = useState(0);
  const [langs, setLangs] = useState<UserLangs | null>(null);

  const refreshScore = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const data = await fetchApi('/words/GetMe');
      if (data) {
        const correctScore = data.totalCorrect ?? data.TotalCorrect;
        if (typeof correctScore === 'number') {
          setScore(correctScore);
        }
        
        const langData = data.langCodeResp || data.LangCodeResp;
        if (langData) {
          setLangs(langData);
        }
      }
    } catch (error) {
      console.error('Failed to initialize score:', error);
    }
  }, []);

  useEffect(() => {
    refreshScore();
  }, []);

  const updateScore = (newScore: number) => {
    setScore(newScore);
  };

  return (
    <ScoreContext.Provider value={{ score, langs, setScore, updateScore, refreshScore }}>
      {children}
    </ScoreContext.Provider>
  );
}

export function useScore() {
  const context = useContext(ScoreContext);
  if (context === undefined) {
    throw new Error('useScore must be used within a ScoreProvider');
  }
  return context;
}