import React, { useState } from 'react';
import { Bookmark, Clipboard, CheckCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { analyticsService } from '../services/analytics.service';
import { supabase } from '../lib/supabase';

interface QuestionCardProps {
  question: {
    id: string;
    question_number: number;
    question_title: string;
    question_text: string;
    answer_html: string;
    keywords: string[];
    unit_id: string;
    subject_id: string;
  };
  userId: string | undefined;
  isBookmarked: boolean;
  onToggleBookmark: (qId: string) => void;
  searchQuery?: string;
}

export const QuestionCard: React.FC<QuestionCardProps> = ({
  question,
  userId,
  isBookmarked,
  onToggleBookmark,
  searchQuery = ''
}) => {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);

  React.useEffect(() => {
    if (userId) {
      supabase.from('question_progress')
        .select('completed')
        .eq('user_id', userId)
        .eq('question_id', question.id)
        .single()
        .then(({ data }: any) => {
          if (data) {
            setCompleted(data.completed);
          }
        });
    }
  }, [userId, question.id]);

  const handleToggleExpand = async () => {
    const nextState = !expanded;
    setExpanded(nextState);

    if (userId) {
      if (nextState) {
        const sessId = await analyticsService.startStudySession(
          userId,
          question.subject_id,
          question.unit_id,
          question.id
        );
        setActiveSessionId(sessId);
        setSessionStartTime(Date.now());

        await supabase.from('question_progress').upsert({
          user_id: userId,
          question_id: question.id,
          viewed: true,
          last_viewed: new Date().toISOString()
        });
        
        await analyticsService.logActivity(userId, 'view_question', { question_id: question.id });
      } else {
        if (activeSessionId && sessionStartTime) {
          const duration = Math.round((Date.now() - sessionStartTime) / 1000);
          await analyticsService.endStudySession(activeSessionId, duration);
          
          await analyticsService.logActivity(userId, 'complete_study_session', { 
            question_id: question.id, 
            duration_seconds: duration 
          });

          setActiveSessionId(null);
          setSessionStartTime(null);
        }
      }
    }
  };

  const handleCopyAnswer = () => {
    const rawAnswerText = question.answer_html.replace(/<[^>]*>/g, '');
    navigator.clipboard.writeText(rawAnswerText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      if (userId) {
        analyticsService.logActivity(userId, 'copy_answer', { question_id: question.id });
      }
    });
  };

  const handleToggleComplete = async () => {
    if (!userId) return;
    const nextState = !completed;
    setCompleted(nextState);

    try {
      await supabase.from('question_progress').upsert({
        user_id: userId,
        question_id: question.id,
        completed: nextState,
        viewed: true,
        last_viewed: new Date().toISOString()
      });

      await analyticsService.logActivity(
        userId,
        nextState ? 'complete_question' : 'incomplete_question',
        { question_id: question.id }
      );
    } catch (e) {
      console.error('Error toggling complete status:', e);
      setCompleted(!nextState);
    }
  };

  const highlightText = (text: string, query: string) => {
    if (!query) return text;
    const regex = new RegExp(`(${query.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    return parts.map((part, index) => 
      regex.test(part) ? <mark key={index} className="bg-yellow-200 dark:bg-yellow-900/50 text-secondary-900 dark:text-white rounded-sm px-0.5">{part}</mark> : part
    );
  };

  return (
    <div className={`bg-white dark:bg-slate-900 border rounded-premium overflow-hidden transition-all duration-200 ${
        completed
          ? 'border-primary-200 dark:border-primary-900/50 bg-primary-50/30 dark:bg-primary-900/10'
          : 'border-secondary-200 dark:border-slate-800'
      }`}
    >
      
      {/* Header */}
      <div 
        onClick={handleToggleExpand}
        className="flex items-start gap-4 p-5 cursor-pointer select-none hover:bg-secondary-50 dark:hover:bg-slate-800/50"
      >
        <span className={`flex-shrink-0 w-8 h-8 rounded-md flex items-center justify-center font-bold text-[14px] ${completed ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400' : 'bg-secondary-100 dark:bg-slate-800 text-secondary-600 dark:text-slate-300'}`}>
          {question.question_number}
        </span>
        <div className="flex-1 min-w-0">
          <h4 className="text-[14px] font-semibold leading-snug text-secondary-900 dark:text-white">
            {highlightText(question.question_text, searchQuery)}
          </h4>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {question.keywords.map((kw, idx) => (
              <span key={idx} className="inline-block text-[11px] font-medium px-2 py-0.5 rounded-full bg-secondary-100 dark:bg-slate-800 text-secondary-500 dark:text-slate-400">
                {kw}
              </span>
            ))}
          </div>
        </div>
        <button className="text-secondary-400 ml-2">
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>

      {/* Answer Body */}
      {expanded && (
        <div className="p-5 border-t border-secondary-200 dark:border-slate-800">
          <div 
            className="prose dark:prose-invert max-w-none text-[14px] text-secondary-700 dark:text-slate-300 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: question.answer_html }}
          />

          {/* Action Bar */}
          <div className="flex flex-wrap items-center gap-3 mt-6 pt-4 border-t border-secondary-100 dark:border-slate-800">
            <button
              onClick={handleCopyAnswer}
              className="flex items-center gap-1.5 text-[12px] font-medium text-secondary-500 hover:text-secondary-900 dark:text-slate-400 dark:hover:text-white transition-colors"
            >
              <Clipboard size={14} />
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>

            <button
              onClick={() => onToggleBookmark(question.id)}
              className={`flex items-center gap-1.5 text-[12px] font-medium transition-colors ${isBookmarked ? 'text-amber-500' : 'text-secondary-500 hover:text-secondary-900 dark:text-slate-400 dark:hover:text-white'}`}
            >
              <Bookmark size={14} fill={isBookmarked ? 'currentColor' : 'none'} />
              <span>Bookmark</span>
            </button>

            <button
              onClick={handleToggleComplete}
              className={`ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] font-medium transition-colors ${completed ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400' : 'bg-secondary-50 text-secondary-700 dark:bg-slate-800 dark:text-slate-300 hover:bg-secondary-100'}`}
            >
              <CheckCircle size={14} />
              <span>{completed ? 'Marked Complete' : 'Mark Complete'}</span>
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
export default QuestionCard;
