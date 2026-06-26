import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../features/auth/AuthContext';
import { useProgress } from '../features/progress/ProgressContext';
import {
  getAllProgress,
  startLocalSession,
  endLocalSession,
} from '../lib/localProgress';
import { emitProgressChanged } from '../features/progress/ProgressContext';
import {
  ArrowLeft,
  BookOpen,
  Bookmark,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  FileText,
  Maximize2,
  Minimize2,
  Search,
  Trophy,
  X,
  CheckCircle,
  Clipboard,
} from 'lucide-react';

/* ─── Static data ──────────────────────────────────────────────────────────── */
const STATIC_UNITS = [
  { id: 'unit-1', unit_number: 1, unit_name: 'Electrochemistry & Corrosion Basics', description: 'TRY DESKTOP TO GET SMOOTH OPERATIONS', question_count: 42, estimated_hours: 4 },
  { id: 'unit-2', unit_number: 2, unit_name: 'Electrochemical Cells & Applications', description: 'TRY DESKTOP TO GET SMOOTH OPERATIONS', question_count: 35, estimated_hours: 3 },
  { id: 'unit-3', unit_number: 3, unit_name: 'Corrosion – Theory & Prevention', description: 'TRY DESKTOP TO GET SMOOTH OPERATIONS', question_count: 40, estimated_hours: 4 },
  { id: 'unit-4', unit_number: 4, unit_name: 'Engineering Materials & Polymers', description: 'TRY DESKTOP TO GET SMOOTH OPERATIONS', question_count: 45, estimated_hours: 5 },
  { id: 'unit-5', unit_number: 5, unit_name: 'Water Treatment & Fuels', description: 'TRY DESKTOP TO GET SMOOTH OPERATIONS', question_count: 45, estimated_hours: 5 },
];

/* ─── Completion popup ─────────────────────────────────────────────────────── */
const CompletionPopup: React.FC<{ unit: (typeof STATIC_UNITS)[0]; onDismiss: () => void; onMarkComplete: () => void }> = ({
  unit, onDismiss, onMarkComplete,
}) => (
  <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-secondary-900/60 backdrop-blur-sm animate-fadeIn">
    <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-premium p-8 shadow-lg border border-secondary-200 dark:border-slate-800 text-center">
      <button onClick={onDismiss} className="absolute top-4 right-4 text-secondary-400 hover:text-secondary-900 dark:hover:text-white transition-colors">
        <X size={20} />
      </button>
      <div className="w-16 h-16 mx-auto mb-5 bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded-full flex items-center justify-center">
        <Trophy size={32} />
      </div>
      <h2 className="text-[24px] font-semibold text-secondary-900 dark:text-white leading-tight">Unit Complete!</h2>
      <p className="text-secondary-500 dark:text-slate-400 mt-2 text-[14px]">
        You've scrolled through all content in <span className="font-semibold text-secondary-900 dark:text-white">Unit {unit.unit_number}: {unit.unit_name}</span>
      </p>
      <p className="text-[12px] text-secondary-400 mt-1">Mark it complete to update your progress.</p>
      <div className="flex flex-col sm:flex-row gap-3 mt-6">
        <button
          onClick={onDismiss}
          className="flex-1 py-2 px-4 rounded-md border border-secondary-200 dark:border-slate-700 text-[14px] font-medium text-secondary-700 dark:text-slate-300 hover:bg-secondary-50 dark:hover:bg-slate-800 transition-colors"
        >
          Continue Reading
        </button>
        <button
          onClick={onMarkComplete}
          className="flex-1 py-2 px-4 rounded-md bg-primary-600 text-white text-[14px] font-medium hover:bg-primary-700 transition-colors flex items-center justify-center gap-2"
        >
          <CheckCircle2 size={16} />
          Mark Complete
        </button>
      </div>
    </div>
  </div>
);

/* ─── Question card (inline, no Supabase deps) ──────────────────────────────── */
const InlineQuestionCard: React.FC<{
  question: any;
  userId: string | undefined;
  unitId: string;
  isBookmarked: boolean;
  isCompleted: boolean;
  onToggleBookmark: () => void;
  onToggleComplete: () => void;
  searchQuery: string;
  forwardRef?: React.Ref<HTMLDivElement>;
}> = ({ question, userId, unitId, isBookmarked, isCompleted, onToggleBookmark, onToggleComplete, searchQuery, forwardRef }) => {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const sessionRef = useRef<{ id: string; start: number } | null>(null);

  const handleExpand = () => {
    const next = !expanded;
    setExpanded(next);
    if (userId) {
      if (next) {
        const id = startLocalSession(unitId, 'subject-chem');
        sessionRef.current = { id, start: Date.now() };
      } else {
        if (sessionRef.current) {
          const dur = Math.round((Date.now() - sessionRef.current.start) / 1000);
          endLocalSession(sessionRef.current.id, dur);
          sessionRef.current = null;
          emitProgressChanged();
        }
      }
    }
  };

  const handleCopy = () => {
    const text = question.answer_html?.replace(/<[^>]*>/g, '') ?? '';
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const highlight = (text: string) => {
    if (!searchQuery) return text;
    const re = new RegExp(`(${searchQuery.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')})`, 'gi');
    return text.split(re).map((p, i) =>
      re.test(p) ? <mark key={i} className="bg-yellow-200 dark:bg-yellow-900/50 text-secondary-900 dark:text-white rounded-sm px-0.5">{p}</mark> : p
    );
  };

  return (
    <div
      ref={forwardRef}
      className={`bg-white dark:bg-slate-900 border rounded-premium overflow-hidden transition-all duration-200 ${
        isCompleted
          ? 'border-primary-200 dark:border-primary-900/50 bg-primary-50/30 dark:bg-primary-900/10'
          : 'border-secondary-200 dark:border-slate-800'
      }`}
    >
      <div onClick={handleExpand} className="flex items-start gap-4 p-5 cursor-pointer hover:bg-secondary-50 dark:hover:bg-slate-800/50 select-none">
        <span className={`flex-shrink-0 w-8 h-8 rounded-md flex items-center justify-center font-bold text-[14px] ${isCompleted ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400' : 'bg-secondary-100 dark:bg-slate-800 text-secondary-600 dark:text-slate-300'}`}>
          {question.question_number}
        </span>
        <div className="flex-1 min-w-0">
          <h4 className="text-[14px] font-semibold leading-snug text-secondary-900 dark:text-white">
            {highlight(question.question_text ?? '')}
          </h4>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {(question.keywords ?? []).map((kw: string, idx: number) => (
              <span key={idx} className="inline-block text-[11px] font-medium px-2 py-0.5 rounded-full bg-secondary-100 dark:bg-slate-800 text-secondary-500 dark:text-slate-400">
                {kw}
              </span>
            ))}
          </div>
        </div>
        <span className="text-secondary-400 ml-2 flex-shrink-0">{expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}</span>
      </div>

      {expanded && (
        <div className="p-5 border-t border-secondary-200 dark:border-slate-800">
          <div
            className="prose dark:prose-invert max-w-none text-[14px] text-secondary-700 dark:text-slate-300 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: question.answer_html ?? '' }}
          />
          <div className="flex flex-wrap items-center gap-3 mt-6 pt-4 border-t border-secondary-100 dark:border-slate-800">
            <button onClick={handleCopy} className="flex items-center gap-1.5 text-[12px] font-medium text-secondary-500 hover:text-secondary-900 dark:text-slate-400 dark:hover:text-white transition-colors">
              <Clipboard size={14} /><span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
            <button onClick={onToggleBookmark} className={`flex items-center gap-1.5 text-[12px] font-medium transition-colors ${isBookmarked ? 'text-amber-500' : 'text-secondary-500 hover:text-secondary-900 dark:text-slate-400 dark:hover:text-white'}`}>
              <Bookmark size={14} fill={isBookmarked ? 'currentColor' : 'none'} /><span>Bookmark</span>
            </button>
            <button onClick={onToggleComplete} className={`ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] font-medium transition-colors ${isCompleted ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400' : 'bg-secondary-50 text-secondary-700 dark:bg-slate-800 dark:text-slate-300 hover:bg-secondary-100'}`}>
              <CheckCircle size={14} /><span>{isCompleted ? 'Marked Complete' : 'Mark Complete'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

/* ─── Main StudyPage ─────────────────────────────────────────────────────────── */
export const StudyPage: React.FC<{ globalSearchQuery?: string }> = ({ globalSearchQuery = '' }) => {
  const { unitId } = useParams<{ unitId: string }>();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { unitProgress, isQBookmarked, isUBookmarked, toggleQBookmark, toggleUBookmark, markQuestionComplete, markUnitAllComplete } = useProgress();

  const unit = STATIC_UNITS.find(u => u.id === unitId);

  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(globalSearchQuery);
  const [expandedAll, setExpandedAll] = useState(false);
  const [showCompletionPopup, setShowCompletionPopup] = useState(false);
  const [completionShown, setCompletionShown] = useState(false);
  const [sessionStart] = useState(Date.now());
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const bottomSentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!unit) return;
    setLoading(true);
    try {
      const stored = localStorage.getItem('onecampus_mock_questions');
      let qs: any[] = stored ? JSON.parse(stored) : [];
      qs = qs.filter((q: any) => q.unit_id === unit.id);
      qs.sort((a: any, b: any) => (a.question_number || 0) - (b.question_number || 0));
      setQuestions(qs);
    } catch {
      setQuestions([]);
    } finally {
      setLoading(false);
    }
  }, [unit]);

  useEffect(() => {
    if (!profile?.id || !unit) return;
    const id = startLocalSession(unit.id, 'subject-chem');
    return () => {
      const dur = Math.round((Date.now() - sessionStart) / 1000);
      if (id) endLocalSession(id, dur);
      emitProgressChanged();
    };
  }, [profile?.id, unit?.id]);

  useEffect(() => {
    setSearchQuery(globalSearchQuery);
  }, [globalSearchQuery]);

  useEffect(() => {
    if (!bottomSentinelRef.current || completionShown) return;
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0]?.isIntersecting && !completionShown) {
          setShowCompletionPopup(true);
          setCompletionShown(true);
        }
      },
      { threshold: 0.8 }
    );
    observer.observe(bottomSentinelRef.current);
    return () => observer.disconnect();
  }, [completionShown, loading]);

  if (!unit) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <BookOpen size={48} className="text-secondary-300 dark:text-slate-700" />
        <p className="text-secondary-500 text-[16px] font-medium">Unit not found.</p>
        <button onClick={() => navigate('/subject/subject-chem')} className="px-4 py-2 bg-primary-600 text-white rounded-md text-[13px] font-medium hover:bg-primary-700 transition-colors">
          Back to Subject
        </button>
      </div>
    );
  }

  const progress = unitProgress[unit.id] || { completed: 0, total: unit.question_count };
  const pct = progress.total ? Math.round((progress.completed / progress.total) * 100) : 0;
  const isComplete = progress.completed >= progress.total;
  const uBookmarked = isUBookmarked(unit.id);

  const filteredQuestions = questions.filter(q => {
    const hay = ((q.question_text ?? '') + ' ' + (q.question_title ?? '') + ' ' + (q.keywords ?? []).join(' ')).toLowerCase();
    return hay.includes(searchQuery.toLowerCase());
  });

  const handleMarkComplete = () => {
    if (!profile?.id) return;
    markUnitAllComplete(profile.id, unit.id, unit.unit_number, unit.question_count, true);
    setShowCompletionPopup(false);
  };

  const handleToggleUnitComplete = () => {
    if (!profile?.id) return;
    markUnitAllComplete(profile.id, unit.id, unit.unit_number, unit.question_count, !isComplete);
  };

  return (
    <div className="space-y-6" ref={scrollContainerRef}>
      {showCompletionPopup && (
        <CompletionPopup
          unit={unit}
          onDismiss={() => setShowCompletionPopup(false)}
          onMarkComplete={handleMarkComplete}
        />
      )}

      <button
        onClick={() => navigate('/subject/subject-chem')}
        className="flex items-center gap-2 text-[13px] font-medium text-secondary-500 hover:text-secondary-900 dark:text-slate-400 dark:hover:text-white transition-colors w-fit"
      >
        <ArrowLeft size={16} /><span>Back to Units</span>
      </button>

      {/* Unit Header */}
      <div className="p-6 bg-white dark:bg-slate-900 border border-secondary-200 dark:border-slate-800 rounded-premium shadow-sm">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="flex-1">
            <span className="text-[12px] font-semibold text-primary-600 uppercase tracking-wider block mb-1">
              Unit {unit.unit_number}
            </span>
            <h1 className="text-[24px] font-semibold text-secondary-900 dark:text-white leading-tight">
              {unit.unit_name}
            </h1>
            <p className="text-secondary-500 dark:text-slate-400 text-[14px] mt-1">
              {unit.question_count} Questions • {unit.estimated_hours}h Estimated
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap md:flex-nowrap">
            <button
              onClick={() => toggleUBookmark(unit.id, unit.unit_number, unit.unit_name)}
              className={`flex items-center justify-center p-2 rounded-md transition-colors ${
                uBookmarked
                  ? 'text-amber-500 bg-amber-50 dark:bg-amber-900/20'
                  : 'text-secondary-500 bg-secondary-50 dark:bg-slate-800 hover:text-amber-500'
              }`}
            >
              <Bookmark size={18} fill={uBookmarked ? 'currentColor' : 'none'} />
            </button>
            <button
              onClick={() => navigate(`/subject/subject-chem/unit/${unit.unit_number}/answer-key`)}
              className="flex items-center gap-2 py-2 px-4 bg-secondary-50 dark:bg-slate-800 border border-secondary-200 dark:border-slate-700 text-secondary-700 dark:text-slate-200 text-[13px] font-medium rounded-md hover:bg-secondary-100 transition-colors"
            >
              <FileText size={16} /> Answer Key
            </button>
            <button
              onClick={handleToggleUnitComplete}
              className={`flex items-center gap-2 py-2 px-4 text-[13px] font-medium rounded-md transition-colors ${
                isComplete
                  ? 'bg-primary-50 text-primary-700 border border-primary-200 dark:bg-primary-900/20 dark:text-primary-400 dark:border-primary-800'
                  : 'bg-primary-600 text-white hover:bg-primary-700'
              }`}
            >
              <CheckCircle2 size={16} />
              {isComplete ? 'Completed' : 'Mark Complete'}
            </button>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-secondary-100 dark:border-slate-800">
          <div className="flex justify-between text-[13px] font-medium text-secondary-700 dark:text-slate-300 mb-2">
            <span>Study Progress</span>
            <span className="text-primary-600">{pct}% ({progress.completed}/{progress.total})</span>
          </div>
          <div className="w-full h-2 bg-secondary-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary-600 rounded-full transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search questions..."
            className="w-full pl-9 pr-4 py-2 text-[13px] bg-white dark:bg-slate-900 border border-secondary-200 dark:border-slate-800 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          <span className="text-[13px] text-secondary-500">{filteredQuestions.length} questions</span>
          <button
            onClick={() => setExpandedAll(!expandedAll)}
            className="flex items-center gap-1.5 py-1.5 px-3 bg-white dark:bg-slate-900 border border-secondary-200 dark:border-slate-800 rounded-md text-[12px] font-medium text-secondary-700 dark:text-slate-300 hover:bg-secondary-50 transition-colors"
          >
            {expandedAll ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
            {expandedAll ? 'Collapse All' : 'Expand All'}
          </button>
        </div>
      </div>

      {/* Questions List */}
      {loading ? (
        <div className="py-16 text-center text-secondary-500">
          <div className="w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <span className="text-[13px]">Loading questions...</span>
        </div>
      ) : filteredQuestions.length === 0 ? (
        <div className="py-12 text-center bg-white dark:bg-slate-900 border border-secondary-200 dark:border-slate-800 rounded-premium">
          <FileText size={32} className="mx-auto text-secondary-300 dark:text-slate-600 mb-3" />
          <p className="text-secondary-900 dark:text-white font-medium text-[14px]">No questions loaded.</p>
          <p className="text-secondary-500 text-[13px] mt-1">View the answer key to study all questions.</p>
          <button
            onClick={() => navigate(`/subject/subject-chem/unit/${unit.unit_number}/answer-key`)}
            className="mt-4 inline-flex items-center gap-2 py-2 px-4 bg-primary-600 text-white text-[13px] font-medium rounded-md hover:bg-primary-700 transition-colors"
          >
            Open Answer Key
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredQuestions.map(q => {
            const qCompleted = getAllProgress().some(p => p.user_id === profile?.id && p.question_id === q.id && p.completed);
            const qBookmarked = isQBookmarked(q.id);
            return (
              <InlineQuestionCard
                key={q.id}
                question={q}
                userId={profile?.id}
                unitId={unit.id}
                isBookmarked={qBookmarked}
                isCompleted={qCompleted}
                onToggleBookmark={() => {
                  if (profile?.id) toggleQBookmark(profile.id, q.id, unit.id);
                }}
                onToggleComplete={() => {
                  if (profile?.id) markQuestionComplete(profile.id, q.id, unit.id, !qCompleted);
                }}
                searchQuery={searchQuery}
              />
            );
          })}
          <div ref={bottomSentinelRef} className="h-4" />
        </div>
      )}
    </div>
  );
};

export default StudyPage;
