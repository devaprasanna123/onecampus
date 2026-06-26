import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../features/auth/AuthContext';
import { useProgress } from '../features/progress/ProgressContext';
import { Bookmark, BookOpen, ChevronRight, HelpCircle, X } from 'lucide-react';
import { Clipboard, ChevronDown, ChevronUp, CheckCircle } from 'lucide-react';

/* ─── Inline Question display ───────────────────────────────────────────────── */
const BookmarkedQuestion: React.FC<{
  question: any;
  isCompleted: boolean;
  onRemoveBookmark: () => void;
}> = ({ question, isCompleted, onRemoveBookmark }) => {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  return (
    <div className={`bg-white dark:bg-slate-900 border rounded-premium overflow-hidden transition-all duration-200 ${isCompleted ? 'border-primary-200 dark:border-primary-900/50 bg-primary-50/30 dark:bg-primary-900/10' : 'border-secondary-200 dark:border-slate-800'}`}>
      <div onClick={() => setExpanded(!expanded)} className="flex items-start gap-4 p-5 cursor-pointer hover:bg-secondary-50 dark:hover:bg-slate-800/50 select-none">
        <span className={`flex-shrink-0 w-8 h-8 rounded-md flex items-center justify-center font-bold text-[14px] ${isCompleted ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400' : 'bg-secondary-100 dark:bg-slate-800 text-secondary-600 dark:text-slate-300'}`}>
          {question.question_number}
        </span>
        <div className="flex-1 min-w-0">
          <h4 className="text-[14px] font-semibold leading-snug text-secondary-900 dark:text-white">{question.question_text}</h4>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {(question.keywords ?? []).map((kw: string, idx: number) => (
              <span key={idx} className="inline-block text-[11px] font-medium px-2 py-0.5 rounded-full bg-secondary-100 dark:bg-slate-800 text-secondary-500 dark:text-slate-400">#{kw}</span>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={e => { e.stopPropagation(); onRemoveBookmark(); }}
            title="Remove bookmark"
            className="p-1.5 text-amber-500 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-md transition-colors"
          >
            <Bookmark size={16} fill="currentColor" />
          </button>
          <span className="text-secondary-400">{expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}</span>
        </div>
      </div>

      {expanded && (
        <div className="p-5 border-t border-secondary-200 dark:border-slate-800">
          <div className="prose dark:prose-invert max-w-none text-[14px] text-secondary-700 dark:text-slate-300 leading-relaxed" dangerouslySetInnerHTML={{ __html: question.answer_html ?? '' }} />
          <div className="flex gap-3 mt-6 pt-4 border-t border-secondary-100 dark:border-slate-800">
            <button
              onClick={() => {
                const text = question.answer_html?.replace(/<[^>]*>/g, '') ?? '';
                navigator.clipboard.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
              }}
              className="flex items-center gap-1.5 text-[12px] font-medium text-secondary-500 hover:text-secondary-900 dark:text-slate-400 dark:hover:text-white transition-colors"
            >
              <Clipboard size={14} /><span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
            {isCompleted && (
              <span className="flex items-center gap-1.5 text-[12px] font-medium text-primary-600 dark:text-primary-400">
                <CheckCircle size={14} /> Reviewed
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

/* ─── Main Bookmarks page ───────────────────────────────────────────────────── */
export const Bookmarks: React.FC = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { questionBookmarks, unitBookmarks, toggleQBookmark, toggleUBookmark, isQCompleted } = useProgress();
  const [bookmarkedQuestions, setBookmarkedQuestions] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'questions' | 'units'>('questions');

  useEffect(() => {
    try {
      const stored = localStorage.getItem('onecampus_mock_questions');
      const allQs: any[] = stored ? JSON.parse(stored) : [];
      const bqList = allQs.filter((q: any) => questionBookmarks.includes(q.id));
      setBookmarkedQuestions(bqList);
    } catch {
      setBookmarkedQuestions([]);
    }
  }, [questionBookmarks]);

  const totalBookmarks = questionBookmarks.length + unitBookmarks.length;

  return (
    <div className="space-y-6 select-none">
      {/* Page Header */}
      <div className="p-6 bg-white dark:bg-slate-900 border border-secondary-200 dark:border-slate-800 rounded-premium shadow-sm flex items-center gap-4">
        <div className="w-12 h-12 rounded-md bg-amber-50 dark:bg-amber-900/30 text-amber-500 flex items-center justify-center">
          <Bookmark size={24} fill="currentColor" />
        </div>
        <div>
          <h1 className="text-[24px] font-semibold text-secondary-900 dark:text-white">My Bookmarks</h1>
          <p className="text-secondary-500 dark:text-slate-400 text-[14px] mt-1">
            {totalBookmarks} saved item{totalBookmarks !== 1 ? 's' : ''} — questions & units for quick revision
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-secondary-200 dark:border-slate-800 w-full mb-6">
        <button
          onClick={() => setActiveTab('questions')}
          className={`px-4 py-3 text-[14px] font-medium border-b-2 transition-colors ${
            activeTab === 'questions'
              ? 'border-primary-600 text-primary-600 dark:text-primary-400'
              : 'border-transparent text-secondary-500 hover:text-secondary-800 dark:hover:text-slate-300'
          }`}
        >
          Questions ({questionBookmarks.length})
        </button>
        <button
          onClick={() => setActiveTab('units')}
          className={`px-4 py-3 text-[14px] font-medium border-b-2 transition-colors ${
            activeTab === 'units'
              ? 'border-primary-600 text-primary-600 dark:text-primary-400'
              : 'border-transparent text-secondary-500 hover:text-secondary-800 dark:hover:text-slate-300'
          }`}
        >
          Units ({unitBookmarks.length})
        </button>
      </div>

      {/* Questions Tab */}
      {activeTab === 'questions' && (
        <>
          {bookmarkedQuestions.length === 0 ? (
            <div className="p-12 text-center bg-white dark:bg-slate-900 border border-secondary-200 dark:border-slate-800 rounded-premium max-w-md mx-auto">
              <HelpCircle className="text-secondary-300 dark:text-slate-700 mx-auto mb-4" size={40} />
              <h3 className="text-[16px] font-semibold text-secondary-900 dark:text-slate-200">No question bookmarks</h3>
              <p className="text-[14px] text-secondary-500 dark:text-slate-400 mt-2">
                Open a unit's study page and click the Bookmark button on any question card.
              </p>
              <button
                onClick={() => navigate('/subject/subject-chem')}
                className="mt-6 inline-flex items-center gap-2 py-2 px-4 bg-primary-600 text-white text-[13px] font-medium rounded-md hover:bg-primary-700 transition-colors"
              >
                Go to Subject
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {bookmarkedQuestions.map(q => (
                <BookmarkedQuestion
                  key={q.id}
                  question={q}
                  isCompleted={profile?.id ? isQCompleted(profile.id, q.id) : false}
                  onRemoveBookmark={() => {
                    if (profile?.id) toggleQBookmark(profile.id, q.id, q.unit_id);
                  }}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* Units Tab */}
      {activeTab === 'units' && (
        <>
          {unitBookmarks.length === 0 ? (
            <div className="p-12 text-center bg-white dark:bg-slate-900 border border-secondary-200 dark:border-slate-800 rounded-premium max-w-md mx-auto">
              <BookOpen className="text-secondary-300 dark:text-slate-700 mx-auto mb-4" size={40} />
              <h3 className="text-[16px] font-semibold text-secondary-900 dark:text-slate-200">No unit bookmarks</h3>
              <p className="text-[14px] text-secondary-500 dark:text-slate-400 mt-2">
                Click the bookmark icon on any unit card to save it here for quick access.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {unitBookmarks.map(ub => (
                <div key={ub.unit_id} className="bg-white dark:bg-slate-900 p-5 rounded-premium border border-secondary-200 dark:border-slate-800 flex items-center justify-between gap-4 hover:border-amber-400 transition-all group">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-md bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center text-amber-500 flex-shrink-0">
                      <BookOpen size={20} />
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold text-amber-600 dark:text-amber-500 uppercase tracking-wider">Unit {ub.unit_number}</p>
                      <h4 className="text-[14px] font-semibold text-secondary-900 dark:text-white mt-0.5 leading-tight">{ub.unit_name}</h4>
                      <p className="text-[11px] text-secondary-400 mt-1">
                        Saved {new Date(ub.bookmarked_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => navigate(`/subject/subject-chem/unit/${ub.unit_id}/study`)}
                      className="flex items-center gap-1 py-1.5 px-3 bg-secondary-50 dark:bg-slate-800 border border-secondary-200 dark:border-slate-700 text-secondary-700 dark:text-slate-200 text-[12px] font-medium rounded-md hover:bg-secondary-100 transition-colors"
                    >
                      Study <ChevronRight size={14} />
                    </button>
                    <button
                      onClick={() => toggleUBookmark(ub.unit_id, ub.unit_number, ub.unit_name)}
                      title="Remove bookmark"
                      className="p-1.5 text-secondary-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Bookmarks;
