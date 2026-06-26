import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { analyticsService } from '../services/analytics.service';

export function useBookmarks(userId: string | undefined) {
  const [bookmarks, setBookmarks] = useState<string[]>([]); // Array of bookmarked question IDs
  const [loading, setLoading] = useState(true);

  const fetchBookmarks = async () => {
    if (!userId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('question_progress')
      .select('question_id')
      .eq('user_id', userId)
      .eq('bookmarked', true);

    if (error) {
      console.error('[bookmarks] fetchBookmarks query failed', {
        user_id: userId,
        error
      });
    }

    if (!error && data) {
      setBookmarks(data.map((d: any) => d.question_id));
    }
    setLoading(false);
  };

  const toggleBookmark = async (questionId: string) => {
    if (!userId) return;
    const isBookmarked = bookmarks.includes(questionId);
    
    // Update local state first (Optimistic update)
    setBookmarks(prev => 
      isBookmarked ? prev.filter(id => id !== questionId) : [...prev, questionId]
    );

    try {
    const { data: existing, error: existingErr } = await supabase
        .from('question_progress')
        .select('id')
        .eq('user_id', userId)
        .eq('question_id', questionId)
        .single();

      if (existingErr) {
        console.error('[bookmarks] question_progress.select(id).single failed', {
          user_id: userId,
          question_id: questionId,
          error: existingErr
        });
      }

      if (existing) {
        const { error: updErr } = await supabase
          .from('question_progress')
          .update({ bookmarked: !isBookmarked })
          .eq('id', existing.id);

        if (updErr) {
          console.error('[bookmarks] question_progress.update(bookmarked) failed', {
            id: existing.id,
            user_id: userId,
            question_id: questionId,
            bookmarked: !isBookmarked,
            error: updErr
          });
        }
      } else {
        const { error: insErr } = await supabase
          .from('question_progress')
          .insert({
            user_id: userId,
            question_id: questionId,
            bookmarked: true,
            viewed: true,
            last_viewed: new Date().toISOString()
          });

        if (insErr) {
          console.error('[bookmarks] question_progress.insert(bookmarked) failed', {
            user_id: userId,
            question_id: questionId,
            error: insErr
          });
        }
      }

      // Log activity in activity log
      await analyticsService.logActivity(
        userId, 
        isBookmarked ? 'remove_bookmark' : 'add_bookmark', 
        { question_id: questionId }
      );
    } catch (e) {
      console.error('Error toggling bookmark:', e);
      // Revert local state on error
      setBookmarks(prev => 
        isBookmarked ? [...prev, questionId] : prev.filter(id => id !== questionId)
      );
    }
  };

  useEffect(() => {
    if (userId) {
      fetchBookmarks();
    }
  }, [userId]);

  return {
    bookmarks,
    loading,
    toggleBookmark,
    isBookmarked: (questionId: string) => bookmarks.includes(questionId),
    refreshBookmarks: fetchBookmarks
  };
}
export default useBookmarks;
