import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ExternalLink, Maximize2, Minimize2, FileText } from 'lucide-react';

const UNIT_META: Record<number, { name: string; questions: number; file: string }> = {
  1: { name: 'Electrochemistry & Corrosion Basics', questions: 42, file: '/unit1_answer_key.html' },
  2: { name: 'Electrochemical Cells & Applications', questions: 35, file: '/unit2_answer_key.html' },
  3: { name: 'Corrosion – Theory & Prevention', questions: 40, file: '/unit3_answer_key.html' },
  4: { name: 'Engineering Materials & Polymers', questions: 45, file: '/unit4_answer_key.html' },
  5: { name: 'Water Treatment & Fuels', questions: 45, file: '/unit5_answer_key.html' },
};

export const UnitAnswerKey: React.FC = () => {
  const { unitNumber } = useParams<{ unitNumber: string }>();
  const navigate = useNavigate();
  const [fullscreen, setFullscreen] = useState(false);

  const num = parseInt(unitNumber || '1', 10);
  const meta = UNIT_META[num];

  if (!meta) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <FileText size={48} className="text-slate-300 dark:text-slate-700" />
        <p className="text-slate-500 text-lg font-semibold">Unit not found.</p>
        <button
          onClick={() => navigate('/subject/subject-chem')}
          className="flex items-center gap-2 py-2 px-5 bg-primary-500 text-white rounded-xl text-sm font-bold hover:bg-primary-600 transition-colors"
        >
          <ArrowLeft size={14} /> Back to Subject
        </button>
      </div>
    );
  }

  return (
    <div className={`flex flex-col ${fullscreen ? 'fixed inset-0 z-50 bg-white dark:bg-slate-950' : 'h-full'}`}>
      {/* Top bar */}
      <div className={`flex items-center justify-between gap-3 px-4 py-3 bg-white/90 dark:bg-slate-900/90 border-b border-slate-200 dark:border-slate-800 backdrop-blur-md ${fullscreen ? '' : 'rounded-t-2xl'}`}>
        <button
          onClick={() => fullscreen ? setFullscreen(false) : navigate('/subject/subject-chem')}
          className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition-colors"
        >
          <ArrowLeft size={15} />
          {fullscreen ? 'Exit Fullscreen' : 'Back to Subject'}
        </button>

        <div className="flex-1 text-center hidden sm:block">
          <span className="text-xs font-bold text-primary-500 uppercase tracking-widest">Unit {num}</span>
          <p className="text-sm font-bold text-slate-800 dark:text-white leading-tight">{meta.name}</p>
        </div>

        <div className="flex items-center gap-2">
          <span className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2.5 py-1.5 rounded-lg">
            <FileText size={12} />
            {meta.questions} Questions
          </span>
          <button
            onClick={() => window.open(meta.file, '_blank')}
            className="flex items-center gap-1.5 py-1.5 px-3 text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors"
          >
            <ExternalLink size={13} />
            <span className="hidden sm:inline">Open in Tab</span>
          </button>
          <button
            onClick={() => setFullscreen(!fullscreen)}
            className="flex items-center gap-1.5 py-1.5 px-3 text-xs font-bold text-white bg-primary-500 hover:bg-primary-600 rounded-xl transition-colors shadow-sm shadow-primary-500/20"
          >
            {fullscreen ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
            <span className="hidden sm:inline">{fullscreen ? 'Exit' : 'Fullscreen'}</span>
          </button>
        </div>
      </div>

      {/* Unit selector tabs */}
      <div className="flex items-center gap-1 px-4 py-2 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800 overflow-x-auto">
        {[1, 2, 3, 4, 5].map((u) => (
          <button
            key={u}
            onClick={() => navigate(`/subject/subject-chem/unit/${u}/answer-key`)}
            className={`flex-shrink-0 text-xs font-bold px-3 py-1.5 rounded-lg transition-all ${
              u === num
                ? 'bg-primary-500 text-white shadow-sm shadow-primary-500/20'
                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
            }`}
          >
            Unit {u}
          </button>
        ))}
      </div>

      {/* IFrame with the HTML content */}
      <div className="flex-1 relative">
        <iframe
          key={meta.file}
          src={meta.file}
          title={`Unit ${num} Answer Key`}
          className="absolute inset-0 w-full h-full border-0"
          style={{ minHeight: fullscreen ? 'calc(100vh - 100px)' : '75vh' }}
          allow="fullscreen"
        />
      </div>
    </div>
  );
};

export default UnitAnswerKey;
