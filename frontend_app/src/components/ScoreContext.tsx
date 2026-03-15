"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { fetchApi } from '../lib/api';

interface ScoreContextType {
  score: number;
  setScore: (score: number) => void;
  updateScore: (score: number) => void;
  refreshScore: () => Promise<void>;
}

const ScoreContext = createContext<ScoreContextType | undefined>(undefined);

export function ScoreProvider({ children }: { children: React.ReactNode }) {
  const [score, setScore] = useState(0);

  const refreshScore = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const data = await fetchApi('/words/GetMe');
      if (data && typeof data.TotalCorrect === 'number') {
        setScore(data.TotalCorrect);
      }
    } catch (error) {
      console.error('Failed to initialize score:', error);
    }
  }, []);

  useEffect(() => {
    refreshScore();
  }, [refreshScore]);

  const updateScore = (newScore: number) => {
    setScore(newScore);
  };

  return (
    <ScoreContext.Provider value={{ score, setScore, updateScore, refreshScore }}>
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
