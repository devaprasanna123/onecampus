import React from 'react';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '../features/auth/AuthContext';
import { useProgress } from '../features/progress/ProgressContext';
import { useCountdown } from '../hooks/useCountdown';
import { useStudyPlanner } from '../hooks/useStudyPlanner';
import { 
  Calendar, 
  BookCheck, 
  TrendingUp,
  Bookmark,
  CheckCircle,
  PlayCircle,
  BookOpen,
  ArrowRight,
  AlertCircle,
  FileText,
  X // Added X icon for dismiss button
} from 'lucide-react';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { stats } = useProgress();
  const countdown = useCountdown('2026-06-29T09:00:00');
  const { schedule, updateTask } = useStudyPlanner(profile?.id);

  // State to control visibility of the new Computer Problem Solving alert key banner
  const [showAlert, setShowAlert] = React.useState(true);

  const todayStr = new Date().toISOString().split('T')[0];
  const todaysTasks = schedule.filter(item => item.target_date === todayStr);
  const remainingQuestions = Math.max(stats.totalQuestions - stats.questionsCompleted, 0);

  return (
    <div className="space-y-6">
      
      {/* SECTION 1: Welcome & Quick Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 bg-white dark:bg-slate-900 border border-secondary-200 dark:border-slate-800 rounded-premium shadow-sm">
        <div>
          <h1 className="text-[24px] font-semibold text-secondary-900 dark:text-white">
            Good {new Date().getHours() < 12 ? 'morning' : 'afternoon'}, {profile?.name?.split(' ')[0] || 'Student'}
          </h1>
          <p className="text-[14px] text-secondary-500 dark:text-slate-400 mt-1">
            Engineering Chemistry II • Exam in {countdown.days} days
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => navigate('/revision')}
            className="px-4 py-2 bg-secondary-50 dark:bg-slate-800 border border-secondary-200 dark:border-slate-700 text-secondary-700 dark:text-slate-300 rounded-md text-[13px] font-medium hover:bg-secondary-100 dark:hover:bg-slate-700 transition-colors"
          >
            Revision Mode
          </button>
          <button
            onClick={() => navigate('/subject/subject-chem')}
            className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-md text-[13px] font-medium transition-colors shadow-sm inline-flex items-center gap-2"
          >
            <PlayCircle size={16} />
            Continue Studying
          </button>
        </div>
      </div>

      {/* NEW ALERT BANNER: Computer Problem Solving Answer Key */}
      {showAlert && (
        <div className="flex items-start justify-between gap-3 p-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50 rounded-premium shadow-sm animate-fade-in relative">
          <div className="flex items-start gap-3 pr-6">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-md text-blue-700 dark:text-blue-400 shrink-0">
              <AlertCircle size={18} />
            </div>
            <div>
              <h4 className="text-[14px] font-semibold text-blue-900 dark:text-blue-200">
                Answer Key Update!
              </h4>
              <p className="text-[13px] text-blue-700 dark:text-blue-400 mt-0.5">
                The answer key for <strong>Computer Problem Solving</strong> was updated on <strong>28.06.2026 Evening 6 PM</strong>. Check your email for more updates. Give feedback if you want pre-request access to answer keys; we respond respectively.
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowAlert(false)}
            className="p-1 text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-200 rounded-md hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors shrink-0"
            aria-label="Dismiss alert"
          >
            <X size={18} />
          </button>
        </div>
      )}

      {/* UPDATE NOTIFICATION BANNER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-premium shadow-sm animate-fade-in">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-amber-100 dark:bg-amber-900/50 rounded-md text-amber-700 dark:text-amber-400 shrink-0">
            <FileText size={18} />
          </div>
          <div>
            <h4 className="text-[14px] font-semibold text-amber-900 dark:text-amber-200">
              Formula Sheets Updated!
            </h4>
            <p className="text-[13px] text-amber-700 dark:text-amber-400 mt-0.5">
              The Engineering Chemistry II high-yield formula sheets have been updated with recent exam topics.
            </p>
          </div>
        </div>
        <button
          onClick={() => navigate('/revision')}
          className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-md text-[12px] font-medium transition-colors shadow-sm flex items-center gap-1.5 self-start sm:self-center shrink-0"
        >
          View Formula Sheets
          <ArrowRight size={14} />
        </button>
      </div>

      {/* SECTION 2: Statistics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Questions Done', value: stats.questionsCompleted, total: stats.totalQuestions, icon: BookCheck, color: 'text-primary-600' },
          { label: 'Units Completed', value: stats.unitsCompleted, total: 5, icon: CheckCircle, color: 'text-emerald-600' },
          { label: 'Readiness Score', value: `${stats.readinessScore}%`, icon: TrendingUp, color: 'text-blue-600' },
          { label: 'Bookmarks', value: stats.bookmarksCount, icon: Bookmark, color: 'text-amber-500' }
        ].map((stat, idx) => (
          <div key={idx} className="p-5 bg-white dark:bg-slate-900 border border-secondary-200 dark:border-slate-800 rounded-premium shadow-sm hover-lift">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[13px] font-medium text-secondary-500 dark:text-slate-400">{stat.label}</span>
              <stat.icon size={16} className={stat.color} />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-[24px] font-bold text-secondary-900 dark:text-white">{stat.value}</span>
              {stat.total && (
                <span className="text-[13px] text-secondary-400 dark:text-slate-500">/ {stat.total}</span>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* SECTION 3: Study Progress & Upcoming Exam */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Study Progress Card */}
          <div className="p-6 bg-white dark:bg-slate-900 border border-secondary-200 dark:border-slate-800 rounded-premium shadow-sm">
            <h2 className="text-[16px] font-semibold text-secondary-900 dark:text-white mb-4">Course Progress</h2>
            
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-[13px] mb-2">
                  <span className="font-medium text-secondary-700 dark:text-slate-300">Overall Completion</span>
                  <span className="font-semibold text-primary-600">{Math.round((stats.questionsCompleted / stats.totalQuestions) * 100)}%</span>
                </div>
                <div className="w-full h-2 bg-secondary-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary-600 rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${(stats.questionsCompleted / stats.totalQuestions) * 100}%` }}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4 pt-4 border-t border-secondary-100 dark:border-slate-800">
                <div>
                  <p className="text-[12px] text-secondary-500 dark:text-slate-400">Solved</p>
                  <p className="text-[15px] font-semibold text-secondary-900 dark:text-white">{stats.questionsCompleted}</p>
                </div>
                <div>
                  <p className="text-[12px] text-secondary-500 dark:text-slate-400">Remaining</p>
                  <p className="text-[15px] font-semibold text-secondary-900 dark:text-white">{remainingQuestions}</p>
                </div>
                <div>
                  <p className="text-[12px] text-secondary-500 dark:text-slate-400">Projected</p>
                  <p className="text-[15px] font-semibold text-emerald-600">{stats.readinessScore > 80 ? 'Excellent' : 'On Track'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 4: Recent & Schedule */}
          <div className="p-6 bg-white dark:bg-slate-900 border border-secondary-200 dark:border-slate-800 rounded-premium shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[16px] font-semibold text-secondary-900 dark:text-white">Today's Schedule</h2>
              <Calendar size={16} className="text-secondary-400" />
            </div>

            {todaysTasks.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-[13px] text-secondary-500 dark:text-slate-400">No specific targets scheduled for today.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {todaysTasks.map(task => (
                  <div key={task.id} className="flex items-center justify-between p-3 border border-secondary-200 dark:border-slate-700 rounded-md">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${task.status === 'completed' ? 'bg-emerald-500' : 'bg-primary-500'}`} />
                      <div>
                        <p className="text-[14px] font-medium text-secondary-900 dark:text-white">{task.unit_name}</p>
                        <p className="text-[12px] text-secondary-500 dark:text-slate-400">Unit {task.unit_number} • {task.estimated_hours}h est.</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => task.id && updateTask(task.id, task.status === 'completed' ? 'pending' : 'completed')}
                      className={`px-3 py-1.5 rounded text-[12px] font-medium transition-colors border ${
                        task.status === 'completed' 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800' 
                          : 'bg-white text-secondary-700 border-secondary-200 hover:bg-secondary-50 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-600'
                      }`}
                    >
                      {task.status === 'completed' ? 'Done' : 'Mark Done'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Right Column */}
        <div className="space-y-6">
          
          {/* SECTION 5: Upcoming Exam Widget */}
          <div className="p-6 bg-white dark:bg-slate-900 border border-secondary-200 dark:border-slate-800 rounded-premium shadow-sm">
            <h2 className="text-[14px] font-semibold text-secondary-900 dark:text-white mb-4">Upcoming Exam</h2>
            <div className="p-4 bg-secondary-50 dark:bg-slate-800/50 rounded-md border border-secondary-100 dark:border-slate-700">
              <p className="text-[14px] font-medium text-secondary-900 dark:text-white">Engineering Chemistry II</p>
              <p className="text-[12px] text-secondary-500 dark:text-slate-400 mt-1">29 June 2026 • 09:00 AM</p>
              
              <div className="mt-4 pt-4 border-t border-secondary-200 dark:border-slate-700 flex justify-between items-center">
                <div>
                  <p className="text-[12px] text-secondary-500 dark:text-slate-400">Time Left</p>
                  <p className="text-[15px] font-semibold text-secondary-900 dark:text-white">
                    {countdown.days}d {countdown.hours}h
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[12px] text-secondary-500 dark:text-slate-400">Readiness</p>
                  <p className="text-[15px] font-semibold text-primary-600">{stats.readinessScore}%</p>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 6: Recommended Actions */}
          <div className="p-6 bg-white dark:bg-slate-900 border border-secondary-200 dark:border-slate-800 rounded-premium shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <AlertCircle size={16} className="text-primary-600" />
              <h2 className="text-[14px] font-semibold text-secondary-900 dark:text-white">Recommended for you</h2>
            </div>
            
            <div className="space-y-2">
              <button onClick={() => navigate('/subject/subject-chem')} className="w-full flex items-center justify-between p-3 bg-secondary-50 dark:bg-slate-800/50 hover:bg-secondary-100 dark:hover:bg-slate-800 rounded-md transition-colors group text-left">
                <div className="flex items-center gap-3">
                  <BookOpen size={14} className="text-secondary-500" />
                  <span className="text-[13px] font-medium text-secondary-700 dark:text-slate-300">Resume Unit {stats.unitsCompleted + 1 || 1}</span>
                </div>
                <ArrowRight size={14} className="text-secondary-400 group-hover:text-primary-600 transition-colors" />
              </button>
              
              {stats.bookmarksCount > 0 && (
                <button onClick={() => navigate('/bookmarks')} className="w-full flex items-center justify-between p-3 bg-secondary-50 dark:bg-slate-800/50 hover:bg-secondary-100 dark:hover:bg-slate-800 rounded-md transition-colors group text-left">
                  <div className="flex items-center gap-3">
                    <Bookmark size={14} className="text-secondary-500" />
                    <span className="text-[13px] font-medium text-secondary-700 dark:text-slate-300">Review {stats.bookmarksCount} Bookmarks</span>
                  </div>
                  <ArrowRight size={14} className="text-secondary-400 group-hover:text-primary-600 transition-colors" />
                </button>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Dashboard;