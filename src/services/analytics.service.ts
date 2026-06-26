import { supabase } from '../lib/supabase';

export interface UserStats {
  unitsCompleted: number;
  totalUnits: number;
  questionsCompleted: number;
  totalQuestions: number;
  bookmarksCount: number;
  readinessScore: number;
  studyTimeSeconds: number;
}

class AnalyticsService {
  async logActivity(userId: string | null, actionType: string, details: any = {}) {
    if (!userId) return;

    const { error } = await supabase.from('user_activity_logs').insert({
      user_id: userId,
      action_type: actionType,
      action_details: details,
    });

    if (error) {
      console.error('[analytics] user_activity_logs.insert failed:', error?.message, {
        user_id: userId,
        action_type: actionType,
      });
      throw error;
    }
  }


  async startStudySession(userId: string | null, subjectId: string, unitId: string, questionId?: string): Promise<string | null> {
    if (!userId) return null;

    const sessionPayload = {
      user_id: userId,
      subject_id: subjectId,
      unit_id: unitId,
      question_id: questionId,
      started_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('study_sessions')
      .insert(sessionPayload)
      .select('id')
      .maybeSingle();

    if (error) {
      console.error('[analytics] study_sessions.insert failed:', error?.message, sessionPayload);
      throw error;
    }

    return (data as any)?.id ?? null;
  }


  async endStudySession(sessionId: string, durationSeconds: number) {
    const { error } = await supabase
      .from('study_sessions')
      .update({
        ended_at: new Date().toISOString(),
        duration_seconds: durationSeconds,
      })
      .eq('id', sessionId);

    if (error) {
      console.error('[analytics] study_sessions.update failed:', error?.message, {
        sessionId,
        durationSeconds,
      });
      throw error;
    }
  }


  async getReadinessScore(userId: string | null, subjectId: string): Promise<number> {
    if (!userId) return 0;
    
    // If this fails, we want to see the exact Supabase error.

    try {
      // 1. Units Completed (40%)
      const { data: units, error: unitsErr } = await supabase
        .from('units')
        .select('id')
        .eq('subject_id', subjectId);

      if (unitsErr) {
        console.error('[analytics] getReadinessScore units select failed:', unitsErr?.message);
        throw unitsErr;
      }

      const unitIds = (units || []).map((u: any) => u.id);
      
      const { data: progress, error: progressErr } = await supabase
        .from('question_progress')
        .select('id, question_id, completed, revised')
        .eq('user_id', userId);

      if (progressErr) {
        console.error('[analytics] getReadinessScore question_progress select failed:', progressErr?.message);
        throw progressErr;
      }

      const userProgress = progress || [];


      // Fetch questions in subject
      const { data: questions } = await supabase.from('questions').select('id, unit_id').eq('subject_id', subjectId);
      const totalQuestions = questions || [];

      // Calculate unit completion
      let completedUnitsCount = 0;
      unitIds.forEach((uId: string) => {
        const qInUnit = totalQuestions.filter((q: any) => q.unit_id === uId);
        if (qInUnit.length === 0) return;
        const compInUnit = qInUnit.filter((q: any) => userProgress.some((up: any) => up.question_id === q.id && up.completed));
        // Unit is completed if at least 70% of questions are completed
        if (compInUnit.length / qInUnit.length >= 0.7) {
          completedUnitsCount++;
        }
      });

      const pUnits = unitIds.length ? (completedUnitsCount / unitIds.length) : 0;

      // 2. Questions Completed (30%)
      const completedQuestionsCount = userProgress.filter((up: any) => up.completed).length;
      const pQuestions = totalQuestions.length ? (completedQuestionsCount / totalQuestions.length) : 0;

      // 3. Revision Completed (20%)
      const bookmarked = userProgress.filter((up: any) => up.bookmarked).length;
      const revised = userProgress.filter((up: any) => up.bookmarked && up.revised).length;
      const pRevision = bookmarked ? (revised / bookmarked) : 0;

      // 4. Study Consistency (10%)
      const { data: schedule } = await supabase.from('generated_schedule').select('status').eq('user_id', userId);
      const recentSchedule = (schedule || []).slice(-7);
      const completedDays = recentSchedule.filter((s: any) => s.status === 'completed').length;
      const pConsistency = recentSchedule.length ? (completedDays / recentSchedule.length) : 0;

      // Readiness Score Formula
      const readiness = Math.round(
        (0.40 * pUnits + 0.30 * pQuestions + 0.20 * pRevision + 0.10 * pConsistency) * 100
      );

      return Math.min(Math.max(readiness, 0), 100);
    } catch (e) {
      console.error('Error calculating readiness score:', e);
      return 0;
    }
  }

  async getUserStats(userId: string, subjectId: string): Promise<UserStats> {
    try {
      const { data: subject } = await supabase.from('subjects').select('question_count, unit_count').eq('id', subjectId).single();
      const totalUnits = subject?.unit_count || 5;
      const totalQuestions = subject?.question_count || 207;

      const { data: progress } = await supabase.from('question_progress').select('completed, bookmarked').eq('user_id', userId);
      const completed = (progress || []).filter((p: any) => p.completed).length;
      const bookmarked = (progress || []).filter((p: any) => p.bookmarked).length;

      // Estimated active units
      const { data: units } = await supabase.from('units').select('id').eq('subject_id', subjectId);
      const { data: qlist } = await supabase.from('questions').select('id, unit_id').eq('subject_id', subjectId);
      
      let unitsCompleted = 0;
      (units || []).forEach((u: any) => {
        const qInUnit = (qlist || []).filter((q: any) => q.unit_id === u.id);
        const compInUnit = qInUnit.filter((q: any) => (progress || []).some((up: any) => (up as any).question_id === q.id && up.completed));
        if (qInUnit.length > 0 && compInUnit.length / qInUnit.length >= 0.7) {
          unitsCompleted++;
        }
      });

      const readinessScore = await this.getReadinessScore(userId, subjectId);

      // Fetch study sessions duration
      const { data: sessions } = await supabase.from('study_sessions').select('duration_seconds').eq('user_id', userId);
      const studyTimeSeconds = (sessions || []).reduce((acc: number, curr: any) => acc + (curr.duration_seconds || 0), 0);

      return {
        unitsCompleted,
        totalUnits,
        questionsCompleted: completed,
        totalQuestions,
        bookmarksCount: bookmarked,
        readinessScore,
        studyTimeSeconds
      };
    } catch (e) {
      console.error('Error fetching stats:', e);
      return {
        unitsCompleted: 0,
        totalUnits: 5,
        questionsCompleted: 0,
        totalQuestions: 207,
        bookmarksCount: 0,
        readinessScore: 0,
        studyTimeSeconds: 0
      };
    }
  }
}

export const analyticsService = new AnalyticsService();
