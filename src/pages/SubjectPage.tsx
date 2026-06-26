import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useProgress } from '../features/progress/ProgressContext';
import { EmptyState } from '../components/EmptyState';
import {
  BookOpen,
  ChevronRight,
  Clock,
  FileText,
  Bookmark,
  SearchX
} from 'lucide-react';

interface SubjectPageProps {
  globalSearchQuery: string;
}

export const STATIC_UNITS = [
  {
    id: 'unit-1',
    subject_id: 'subject-chem',
    unit_number: 1,
    unit_name: 'Electrochemistry & Corrosion Basics',
    description: 'OPEN IN DESKTOP',
    question_count: 42,
    estimated_hours: 4,
    answer_key_file: '/unit1_answer_key.html',
  },
  {
    id: 'unit-2',
    subject_id: 'subject-chem',
    unit_number: 2,
    unit_name: 'Electrochemical Cells & Applications',
    description: 'OPEN IN DESKTOP',
    question_count: 35,
    estimated_hours: 3,
    answer_key_file: '/unit2_answer_key.html',
  },
  {
    id: 'unit-3',
    subject_id: 'subject-chem',
    unit_number: 3,
    unit_name: 'Corrosion – Theory & Prevention',
    description: 'OPEN IN DESKTOP',
    question_count: 40,
    estimated_hours: 4,
    answer_key_file: '/unit3_answer_key.html',
  },
  {
    id: 'unit-4',
    subject_id: 'subject-chem',
    unit_number: 4,
    unit_name: 'Engineering Materials & Polymers',
    description: 'OPEN IN DESKTOP',
    question_count: 45,
    estimated_hours: 5,
    answer_key_file: '/unit4_answer_key.html',
  },
  {
    id: 'unit-5',
    subject_id: 'subject-chem',
    unit_number: 5,
    unit_name: 'Water Treatment & Fuels',
    description: 'OPEN IN DESKTOP',
    question_count: 45,
    estimated_hours: 5,
    answer_key_file: '/unit5_answer_key.html',
  }
];

const studyLinks: Record<string, string> = {
  "unit-1": "https://drive.google.com/file/d/1AvsDWHesRFQv-pX-JVA0xHj_lIEJJB4C/preview",
  "unit-2": "https://drive.google.com/file/d/1k-zFoqRi5kfBDXrtj6DHcynGmeJQK3Am/preview",
  "unit-3": "https://drive.google.com/file/d/1v2iRISIb8JQYC3Dt6GgPiaYhvvsTXjRc/preview",
  "unit-4": "https://drive.google.com/file/d/1Eo_lk0F_kLBFsXCTv50x0z97yKy485oD/preview",
  "unit-5": "https://drive.google.com/file/d/1T-Gex_tGGAybLp7cJOCCJicOrQIBZteD/preview",
};

export const SubjectPage: React.FC<SubjectPageProps> = ({ globalSearchQuery }) => {
  const navigate = useNavigate();
  const { unitProgress, isUBookmarked, toggleUBookmark } = useProgress();

  const normalizedQuery = globalSearchQuery.trim().toLowerCase();
  const units = normalizedQuery
    ? STATIC_UNITS.filter((unit) =>
        unit.unit_name.toLowerCase().includes(normalizedQuery) ||
        unit.description.toLowerCase().includes(normalizedQuery) ||
        unit.subject_id.toLowerCase().includes(normalizedQuery) ||
        unit.unit_number.toString().includes(normalizedQuery)
      )
    : STATIC_UNITS;

  const totalQs = STATIC_UNITS.reduce((a, u) => a + u.question_count, 0);
  const completedQs = STATIC_UNITS.reduce((a, u) => a + (unitProgress[u.id]?.completed || 0), 0);
  const overallPct = totalQs ? Math.round((completedQs / totalQs) * 100) : 0;

  return (
    <div className="space-y-6">
      
      {/* Subject Header */}
      <div className="p-6 bg-white dark:bg-slate-900 border border-secondary-200 dark:border-slate-800 rounded-premium shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <span className="text-[12px] font-semibold text-primary-600 dark:text-primary-400 tracking-wider uppercase mb-1 block">
            22CH203 • Semester S2 • Bannari Amman Institute of Technology
          </span>
          <h1 className="text-[24px] font-semibold text-secondary-900 dark:text-white">
            Engineering Chemistry II
          </h1>
          <p className="text-[14px] text-secondary-500 dark:text-slate-400 mt-1">
            5 Units • {totalQs} Questions • Exam-ready answer keys included
          </p>
        </div>

        {/* Overall Progress Mini */}
        <div className="md:w-64 bg-secondary-50 dark:bg-slate-800/50 p-4 rounded-md border border-secondary-200 dark:border-slate-700">
          <div className="flex justify-between items-center text-[12px] font-medium text-secondary-700 dark:text-slate-300 mb-2">
            <span>Overall Progress</span>
            <span className="text-primary-600 font-semibold">{overallPct}%</span>
          </div>
          <div className="w-full h-2 bg-secondary-200 dark:bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary-600 rounded-full transition-all duration-500"
              style={{ width: `${overallPct}%` }}
            />
          </div>
          <p className="text-[11px] text-secondary-500 dark:text-slate-400 mt-2">
            {completedQs} / {totalQs} questions completed
          </p>
        </div>
      </div>

      {/* Units List */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-[16px] text-secondary-900 dark:text-white">
            Course Units
          </h3>
          {normalizedQuery && (
            <span className="text-[13px] text-secondary-500 dark:text-slate-400">
              Showing {units.length} result{units.length !== 1 && 's'}
            </span>
          )}
        </div>

        {units.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {units.map((unit) => {
              const progress = unitProgress[unit.id] || { completed: 0, total: unit.question_count };
              const ratio = progress.total ? progress.completed / progress.total : 0;
              const pct = Math.round(ratio * 100);
              const uBookmarked = isUBookmarked(unit.id);

              return (
                <div
                  key={unit.id}
                  className="bg-white dark:bg-slate-900 border border-secondary-200 dark:border-slate-800 rounded-premium shadow-sm hover-lift flex flex-col overflow-hidden"
                >
                  <div className="p-5 flex flex-col flex-1">
                    
                    <div className="flex items-start justify-between mb-3">
                      <span className="text-[11px] font-semibold text-primary-700 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20 px-2 py-0.5 rounded border border-primary-100 dark:border-primary-800 uppercase tracking-wider">
                        Unit {unit.unit_number}
                      </span>
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          toggleUBookmark(unit.id, unit.unit_number, unit.unit_name);
                        }}
                        className={`p-1.5 rounded-md transition-colors ${
                          uBookmarked
                            ? 'text-amber-500 bg-amber-50 dark:bg-amber-900/20'
                            : 'text-secondary-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-slate-800'
                        }`}
                      >
                        <Bookmark size={14} fill={uBookmarked ? 'currentColor' : 'none'} />
                      </button>
                    </div>

                    <h4 className="text-[16px] font-semibold text-secondary-900 dark:text-white leading-tight mb-2">
                      {unit.unit_name}
                    </h4>
                    <p className="text-[13px] text-secondary-500 dark:text-slate-400 mb-4 line-clamp-2">
                      {unit.description}
                    </p>

                    <div className="mt-auto">
                      <div className="flex items-center gap-4 text-[12px] text-secondary-500 dark:text-slate-400 mb-4">
                        <span className="flex items-center gap-1.5">
                          <BookOpen size={14} />
                          {unit.question_count} Qs
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Clock size={14} />
                          {unit.estimated_hours}h
                        </span>
                      </div>

                      <div className="mb-4">
                        <div className="flex justify-between text-[11px] font-medium text-secondary-500 dark:text-slate-400 mb-1">
                          <span>{pct}% Completed</span>
                          <span>{progress.completed}/{progress.total}</span>
                        </div>
                        <div className="w-full h-1.5 bg-secondary-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary-600 rounded-full transition-all duration-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-4 border-t border-secondary-100 dark:border-slate-800">
                        <button
                          onClick={() => navigate(`/subject/subject-chem/unit/${unit.unit_number}/answer-key`)}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-secondary-50 hover:bg-secondary-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-secondary-700 dark:text-slate-200 border border-secondary-200 dark:border-slate-700 text-[12px] font-medium rounded-md transition-colors"
                        >
                          <FileText size={14} />
                          Answer Key
                        </button>
                        <button
                          onClick={() => {
                            const link = studyLinks[unit.id];
                            if (link) {
                              window.open(link, "_blank", "noopener,noreferrer");
                            } else {
                              alert("Study material not available.");
                            }
                          }}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-primary-600 hover:bg-primary-700 text-white text-[12px] font-medium rounded-md transition-colors shadow-sm"
                        >
                          Study Now
                          <ChevronRight size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState 
            title="No units found" 
            description={`Try a different keyword or search for topics like "electrochemistry", "corrosion", or "cells".`}
            icon={<SearchX size={24} />}
            actionText="Clear Search"
            onAction={() => {}} // In a real scenario, we'd clear the global search
          />
        )}
      </div>
    </div>
  );
};

export default SubjectPage;