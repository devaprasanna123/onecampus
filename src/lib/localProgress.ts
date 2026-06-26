/**
 * localProgress.ts
 * Single source of truth for all localStorage-based progress tracking.
 * Used as a fallback when Supabase is not configured / queries fail.
 */

export interface QuestionProgress {
  question_id: string;
  unit_id: string;
  user_id: string;
  completed: boolean;
  bookmarked: boolean;
  viewed: boolean;
  last_viewed: string;
}

export interface StudySession {
  id: string;
  unit_id: string;
  subject_id: string;
  started_at: string;
  ended_at?: string;
  duration_seconds?: number;
}

export interface UnitBookmark {
  unit_id: string;
  unit_number: number;
  unit_name: string;
  bookmarked_at: string;
}

const KEYS = {
  QUESTION_PROGRESS: 'onecampus_mock_question_progress',
  STUDY_SESSIONS: 'onecampus_study_sessions',
  UNIT_BOOKMARKS: 'onecampus_unit_bookmarks',
};

// ── Question Progress ─────────────────────────────────────────────────────────

export function getAllProgress(): QuestionProgress[] {
  try {
    const raw = localStorage.getItem(KEYS.QUESTION_PROGRESS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveAllProgress(progress: QuestionProgress[]): void {
  localStorage.setItem(KEYS.QUESTION_PROGRESS, JSON.stringify(progress));
}

export function getQuestionProgress(userId: string, questionId: string): QuestionProgress | null {
  return getAllProgress().find(p => p.user_id === userId && p.question_id === questionId) ?? null;
}

export function upsertQuestionProgress(entry: QuestionProgress): void {
  const all = getAllProgress();
  const idx = all.findIndex(p => p.user_id === entry.user_id && p.question_id === entry.question_id);
  if (idx !== -1) {
    all[idx] = { ...all[idx], ...entry };
  } else {
    all.push(entry);
  }
  saveAllProgress(all);
}

export function getUnitProgress(
  userId: string,
  unitId: string,
  totalQuestions: number
): { completed: number; total: number } {
  const all = getAllProgress();
  const unitEntries = all.filter(p => p.user_id === userId && p.unit_id === unitId);
  const done = unitEntries.filter(p => p.completed).length;
  return { completed: done, total: totalQuestions };
}

export function markAllUnitComplete(
  userId: string,
  unitId: string,
  unitNumber: number,
  questionCount: number,
  markComplete: boolean
): void {
  const all = getAllProgress();
  for (let i = 1; i <= questionCount; i++) {
    const qId = `q-u${unitNumber}-${i}`;
    const idx = all.findIndex(p => p.question_id === qId && p.user_id === userId);
    const entry: QuestionProgress = {
      question_id: qId,
      unit_id: unitId,
      user_id: userId,
      completed: markComplete,
      bookmarked: all[idx]?.bookmarked ?? false,
      viewed: true,
      last_viewed: new Date().toISOString(),
    };
    if (idx !== -1) all[idx] = entry;
    else all.push(entry);
  }
  saveAllProgress(all);
}

export function getBookmarkedQuestionIds(userId: string): string[] {
  return getAllProgress()
    .filter(p => p.user_id === userId && p.bookmarked)
    .map(p => p.question_id);
}

export function toggleQuestionBookmark(userId: string, questionId: string, unitId: string): boolean {
  const all = getAllProgress();
  const idx = all.findIndex(p => p.user_id === userId && p.question_id === questionId);
  let newValue: boolean;
  if (idx !== -1) {
    newValue = !all[idx].bookmarked;
    all[idx].bookmarked = newValue;
  } else {
    newValue = true;
    all.push({
      question_id: questionId,
      unit_id: unitId,
      user_id: userId,
      completed: false,
      bookmarked: true,
      viewed: true,
      last_viewed: new Date().toISOString(),
    });
  }
  saveAllProgress(all);
  return newValue;
}

// ── Study Sessions ─────────────────────────────────────────────────────────────

export function getAllSessions(): StudySession[] {
  try {
    const raw = localStorage.getItem(KEYS.STUDY_SESSIONS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function startLocalSession(unitId: string, subjectId: string): string {
  const id = `sess-local-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
  const sessions = getAllSessions();
  sessions.push({ id, unit_id: unitId, subject_id: subjectId, started_at: new Date().toISOString() });
  localStorage.setItem(KEYS.STUDY_SESSIONS, JSON.stringify(sessions));
  return id;
}

export function endLocalSession(sessionId: string, durationSeconds: number): void {
  const sessions = getAllSessions();
  const idx = sessions.findIndex(s => s.id === sessionId);
  if (idx !== -1) {
    sessions[idx].ended_at = new Date().toISOString();
    sessions[idx].duration_seconds = durationSeconds;
    localStorage.setItem(KEYS.STUDY_SESSIONS, JSON.stringify(sessions));
  }
}

export function getTotalStudySeconds(): number {
  return getAllSessions().reduce((acc, s) => acc + (s.duration_seconds ?? 0), 0);
}

// ── Unit Bookmarks ─────────────────────────────────────────────────────────────

export function getUnitBookmarks(): UnitBookmark[] {
  try {
    const raw = localStorage.getItem(KEYS.UNIT_BOOKMARKS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function toggleUnitBookmark(
  unitId: string,
  unitNumber: number,
  unitName: string
): boolean {
  const all = getUnitBookmarks();
  const idx = all.findIndex(b => b.unit_id === unitId);
  if (idx !== -1) {
    all.splice(idx, 1);
    localStorage.setItem(KEYS.UNIT_BOOKMARKS, JSON.stringify(all));
    return false;
  } else {
    all.push({ unit_id: unitId, unit_number: unitNumber, unit_name: unitName, bookmarked_at: new Date().toISOString() });
    localStorage.setItem(KEYS.UNIT_BOOKMARKS, JSON.stringify(all));
    return true;
  }
}

export function isUnitBookmarked(unitId: string): boolean {
  return getUnitBookmarks().some(b => b.unit_id === unitId);
}

// ── Aggregate Stats ────────────────────────────────────────────────────────────

export const SUBJECT_UNITS = [
  { id: 'unit-1', unit_number: 1, question_count: 42 },
  { id: 'unit-2', unit_number: 2, question_count: 35 },
  { id: 'unit-3', unit_number: 3, question_count: 40 },
  { id: 'unit-4', unit_number: 4, question_count: 45 },
  { id: 'unit-5', unit_number: 5, question_count: 45 },
];

export function getLocalStats(userId: string) {
  const totalQuestions = SUBJECT_UNITS.reduce((a, u) => a + u.question_count, 0);
  const all = getAllProgress();
  const userProgress = all.filter(p => p.user_id === userId);

  const questionsCompleted = userProgress.filter(p => p.completed).length;
  const bookmarksCount = userProgress.filter(p => p.bookmarked).length;
  const studyTimeSeconds = getTotalStudySeconds();

  let unitsCompleted = 0;
  SUBJECT_UNITS.forEach(unit => {
    const unitProg = userProgress.filter(p => p.unit_id === unit.id);
    const done = unitProg.filter(p => p.completed).length;
    if (unit.question_count > 0 && done / unit.question_count >= 0.7) {
      unitsCompleted++;
    }
  });

  const pQuestions = totalQuestions ? questionsCompleted / totalQuestions : 0;
  const pUnits = SUBJECT_UNITS.length ? unitsCompleted / SUBJECT_UNITS.length : 0;
  const pBookmarks = bookmarksCount ? 0.5 : 0; // simplified
  const readinessScore = Math.round((0.4 * pUnits + 0.3 * pQuestions + 0.2 * pBookmarks) * 100);

  return {
    unitsCompleted,
    totalUnits: SUBJECT_UNITS.length,
    questionsCompleted,
    totalQuestions,
    bookmarksCount,
    readinessScore: Math.min(readinessScore, 100),
    studyTimeSeconds,
  };
}
