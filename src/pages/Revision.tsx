import React, { useEffect, useState } from 'react';
import { useAuth } from '../features/auth/AuthContext';
import { useBookmarks } from '../hooks/useBookmarks';
import { supabase } from '../lib/supabase';
import { QuestionCard } from '../components/QuestionCard';
import { RefreshCw, BookOpen, Clock, AlertCircle } from 'lucide-react';

export const Revision: React.FC = () => {
  const { profile } = useAuth();
  const { bookmarks, toggleBookmark } = useBookmarks(profile?.id);
  const [frequentQuestions, setFrequentQuestions] = useState<any[]>([]);
  const [highPriorityQuestions, setHighPriorityQuestions] = useState<any[]>([]);
  const [incompleteUnits, setIncompleteUnits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile?.id) {
      fetchRevisionData();
    }
  }, [profile, bookmarks]);

  const fetchRevisionData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Incomplete Units
      const { data: units } = await supabase.from('units').select('*').eq('subject_id', 'subject-chem');
      const { data: qlist } = await supabase.from('questions').select('id, unit_id');
      const { data: progress } = await supabase.from('question_progress').select('question_id, completed').eq('user_id', profile?.id);
      
      const incomplete = (units || []).filter((u: any) => {
        const qInUnit = (qlist || []).filter((q: any) => q.unit_id === u.id);
        const compInUnit = qInUnit.filter((q: any) => (progress || []).some((p: any) => p.question_id === q.id && p.completed));
        return qInUnit.length === 0 || (compInUnit.length / qInUnit.length) < 0.7;
      });
      setIncompleteUnits(incomplete);

      // 2. Fetch Frequently Viewed Questions (based on question progress entries that are viewed)
      const { data: viewedProgress } = await supabase
        .from('question_progress')
        .select('question_id')
        .eq('user_id', profile?.id)
        .eq('viewed', true)
        .order('last_viewed', { ascending: false });

      const viewedIds = (viewedProgress || []).map((p: any) => p.question_id).slice(0, 5);
      if (viewedIds.length > 0) {
        const { data: viewedQs } = await supabase.from('questions').select('*').in('id', viewedIds);
        setFrequentQuestions(viewedQs || []);
      }

      // 3. High Priority Questions
      const unitIds = incomplete.map((u: any) => u.id);
      if (unitIds.length > 0) {
        const { data: prioQs } = await supabase
          .from('questions')
          .select('*')
          .in('unit_id', unitIds)
          .order('question_number', { ascending: true });
        
        setHighPriorityQuestions((prioQs || []).slice(0, 8));
      } else {
        if (bookmarks.length > 0) {
          const { data: bookQs } = await supabase.from('questions').select('*').in('id', bookmarks);
          setHighPriorityQuestions(bookQs || []);
        }
      }
    } catch (e) {
      console.error('Error fetching revision data:', e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 select-none">
      
      {/* Header */}
      <div className="p-6 bg-white dark:bg-slate-900 border border-secondary-200 dark:border-slate-800 rounded-premium shadow-sm flex items-center gap-4">
        <div className="w-12 h-12 rounded-md bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 flex items-center justify-center">
          <RefreshCw size={24} />
        </div>
        <div>
          <h1 className="text-[24px] font-semibold text-secondary-900 dark:text-white">
            Revision Mode
          </h1>
          <p className="text-secondary-500 dark:text-slate-400 text-[14px] mt-1">
            Custom revision lists targeting high-priority, weak areas, and frequently studied concepts.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="py-12 text-center text-secondary-500 text-[14px]">
          <div className="w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          Loading revision lists...
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          {/* Main Revision Feed */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* High Priority */}
            <div>
              <h3 className="font-semibold text-[14px] text-secondary-900 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                <AlertCircle className="text-red-500" size={16} />
                <span>High Priority Questions</span>
              </h3>
              {highPriorityQuestions.length === 0 ? (
                <div className="p-6 bg-white dark:bg-slate-900 border border-secondary-200 dark:border-slate-800 rounded-premium text-secondary-500 text-center text-[13px] font-medium">
                  Syllabus is complete! No high priority questions.
                </div>
              ) : (
                <div className="space-y-3">
                  {highPriorityQuestions.map(q => (
                    <QuestionCard
                      key={q.id}
                      question={q}
                      userId={profile?.id}
                      isBookmarked={bookmarks.includes(q.id)}
                      onToggleBookmark={toggleBookmark}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Frequently Viewed */}
            <div>
              <h3 className="font-semibold text-[14px] text-secondary-900 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                <Clock className="text-primary-600 dark:text-primary-400" size={16} />
                <span>Frequently Viewed / Recent Questions</span>
              </h3>
              {frequentQuestions.length === 0 ? (
                <div className="p-6 bg-white dark:bg-slate-900 border border-secondary-200 dark:border-slate-800 rounded-premium text-secondary-500 text-center text-[13px] font-medium">
                  No recently studied questions found yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {frequentQuestions.map(q => (
                    <QuestionCard
                      key={q.id}
                      question={q}
                      userId={profile?.id}
                      isBookmarked={bookmarks.includes(q.id)}
                      onToggleBookmark={toggleBookmark}
                    />
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* Sidebar components */}
          <div className="space-y-6">
            
            {/* Incomplete Units */}
            <div className="p-5 bg-white dark:bg-slate-900 border border-secondary-200 dark:border-slate-800 rounded-premium shadow-sm">
              <h3 className="font-semibold text-[14px] text-secondary-900 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                <BookOpen size={16} className="text-primary-600 dark:text-primary-400" />
                <span>Incomplete Units</span>
              </h3>
              
              {incompleteUnits.length === 0 ? (
                <div className="text-center py-6 text-secondary-500">
                  <p className="text-[13px] font-semibold text-emerald-600 dark:text-emerald-400">All Units Completed!</p>
                  <p className="text-[12px] text-secondary-400 mt-1">Excellent syllabus coverage.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {incompleteUnits.map(unit => (
                    <div key={unit.id} className="p-3 bg-secondary-50 dark:bg-slate-800/50 rounded-md">
                      <span className="text-[11px] font-semibold text-primary-600 dark:text-primary-400 block uppercase tracking-wide">Unit {unit.unit_number}</span>
                      <h4 className="text-[14px] font-semibold text-secondary-900 dark:text-white mt-1 leading-snug">{unit.unit_name}</h4>
                      <p className="text-[12px] text-secondary-500 dark:text-slate-400 mt-1">{unit.question_count} Questions left to cover</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

        </div>
      )}

    </div>
  );
};
export default Revision;
