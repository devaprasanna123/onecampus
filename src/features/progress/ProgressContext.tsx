import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  getAllProgress,
  getLocalStats,
  getBookmarkedQuestionIds,
  getUnitBookmarks,
  upsertQuestionProgress,
  toggleQuestionBookmark,
  toggleUnitBookmark,
  markAllUnitComplete,
  SUBJECT_UNITS,
  type UnitBookmark,
} from '../../lib/localProgress';

export const PROGRESS_CHANGED_EVENT = 'onecampus_progress_changed';

export function emitProgressChanged() {
  window.dispatchEvent(new CustomEvent(PROGRESS_CHANGED_EVENT));
}

interface ProgressContextType {
  // Unit-level progress
  unitProgress: Record<string, { completed: number; total: number }>;
  // Question bookmarks
  questionBookmarks: string[];
  // Unit bookmarks
  unitBookmarks: UnitBookmark[];
  // Aggregate stats
  stats: {
    unitsCompleted: number;
    totalUnits: number;
    questionsCompleted: number;
    totalQuestions: number;
    bookmarksCount: number;
    readinessScore: number;
    studyTimeSeconds: number;
  };
  // Actions
  markQuestionComplete: (userId: string, questionId: string, unitId: string, completed: boolean) => void;
  toggleQBookmark: (userId: string, questionId: string, unitId: string) => void;
  toggleUBookmark: (unitId: string, unitNumber: number, unitName: string) => void;
  markUnitAllComplete: (userId: string, unitId: string, unitNumber: number, questionCount: number, done: boolean) => void;
  isQBookmarked: (questionId: string) => boolean;
  isUBookmarked: (unitId: string) => boolean;
  isQCompleted: (userId: string, questionId: string) => boolean;
  refresh: () => void;
}

const ProgressContext = createContext<ProgressContextType | undefined>(undefined);

function buildUnitProgress(userId: string): Record<string, { completed: number; total: number }> {
  const all = getAllProgress();
  const userProg = all.filter(p => p.user_id === userId);
  const map: Record<string, { completed: number; total: number }> = {};
  SUBJECT_UNITS.forEach(unit => {
    const done = userProg.filter(p => p.unit_id === unit.id && p.completed).length;
    map[unit.id] = { completed: done, total: unit.question_count };
  });
  return map;
}

export const ProgressProvider: React.FC<{ userId: string | undefined; children: React.ReactNode }> = ({
  userId,
  children,
}) => {
  const [unitProgress, setUnitProgress] = useState<Record<string, { completed: number; total: number }>>({});
  const [questionBookmarks, setQuestionBookmarks] = useState<string[]>([]);
  const [unitBookmarks, setUnitBookmarks] = useState<UnitBookmark[]>([]);
  const [stats, setStats] = useState({
    unitsCompleted: 0,
    totalUnits: 5,
    questionsCompleted: 0,
    totalQuestions: 207,
    bookmarksCount: 0,
    readinessScore: 0,
    studyTimeSeconds: 0,
  });

  const refresh = useCallback(() => {
    if (!userId) return;
    setUnitProgress(buildUnitProgress(userId));
    setQuestionBookmarks(getBookmarkedQuestionIds(userId));
    setUnitBookmarks(getUnitBookmarks());
    setStats(getLocalStats(userId));
  }, [userId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    const handler = () => refresh();
    window.addEventListener(PROGRESS_CHANGED_EVENT, handler);
    return () => window.removeEventListener(PROGRESS_CHANGED_EVENT, handler);
  }, [refresh]);

  const markQuestionComplete = useCallback(
    (uid: string, questionId: string, unitId: string, completed: boolean) => {
      const existing = getAllProgress().find(p => p.user_id === uid && p.question_id === questionId);
      upsertQuestionProgress({
        question_id: questionId,
        unit_id: unitId,
        user_id: uid,
        completed,
        bookmarked: existing?.bookmarked ?? false,
        viewed: true,
        last_viewed: new Date().toISOString(),
      });
      emitProgressChanged();
    },
    []
  );

  const toggleQBookmark = useCallback((uid: string, questionId: string, unitId: string) => {
    toggleQuestionBookmark(uid, questionId, unitId);
    emitProgressChanged();
  }, []);

  const toggleUBookmark = useCallback((unitId: string, unitNumber: number, unitName: string) => {
    toggleUnitBookmark(unitId, unitNumber, unitName);
    emitProgressChanged();
  }, []);

  const markUnitAllComplete = useCallback(
    (uid: string, unitId: string, unitNumber: number, questionCount: number, done: boolean) => {
      markAllUnitComplete(uid, unitId, unitNumber, questionCount, done);
      emitProgressChanged();
    },
    []
  );

  const isQBookmarked = useCallback((questionId: string) => questionBookmarks.includes(questionId), [questionBookmarks]);
  const isUBookmarked = useCallback(
    (unitId: string) => unitBookmarks.some(b => b.unit_id === unitId),
    [unitBookmarks]
  );
  const isQCompleted = useCallback(
    (uid: string, questionId: string) => {
      const all = getAllProgress();
      return all.some(p => p.user_id === uid && p.question_id === questionId && p.completed);
    },
    []
  );

  return (
    <ProgressContext.Provider
      value={{
        unitProgress,
        questionBookmarks,
        unitBookmarks,
        stats,
        markQuestionComplete,
        toggleQBookmark,
        toggleUBookmark,
        markUnitAllComplete,
        isQBookmarked,
        isUBookmarked,
        isQCompleted,
        refresh,
      }}
    >
      {children}
    </ProgressContext.Provider>
  );
};

export function useProgress() {
  const ctx = useContext(ProgressContext);
  if (!ctx) throw new Error('useProgress must be used within ProgressProvider');
  return ctx;
}
