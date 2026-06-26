import React from 'react';
import { useAuth } from '../features/auth/AuthContext';
import { useProgress } from '../features/progress/ProgressContext';
import { Mail, Calendar, BookOpen, Award, CheckSquare, Clock, Bookmark } from 'lucide-react';

export const Profile: React.FC = () => {
  const { profile } = useAuth();
  const { stats } = useProgress();

  const joinDate = profile?.first_login
    ? new Date(profile.first_login).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : 'June 2026';

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (hrs > 0) return `${hrs}h ${mins}m`;
    return `${mins} mins`;
  };

  const statCards = [
    {
      label: 'Readiness Score',
      value: `${stats.readinessScore}%`,
      icon: Award,
      color: 'primary',
      bg: 'bg-primary-500',
      shadow: 'shadow-primary-500/25',
    },
    {
      label: 'Units Completed',
      value: `${stats.unitsCompleted} / ${stats.totalUnits}`,
      icon: BookOpen,
      color: 'indigo',
      bg: 'bg-indigo-500',
      shadow: 'shadow-indigo-500/25',
    },
    {
      label: 'Questions Solved',
      value: `${stats.questionsCompleted} / ${stats.totalQuestions}`,
      icon: CheckSquare,
      color: 'emerald',
      bg: 'bg-emerald-500',
      shadow: 'shadow-emerald-500/25',
    },
    {
      label: 'Study Duration',
      value: formatTime(stats.studyTimeSeconds),
      icon: Clock,
      color: 'amber',
      bg: 'bg-amber-500',
      shadow: 'shadow-amber-500/25',
    },
    {
      label: 'Bookmarks',
      value: stats.bookmarksCount.toString(),
      icon: Bookmark,
      color: 'rose',
      bg: 'bg-rose-500',
      shadow: 'shadow-rose-500/25',
    },
  ];

  return (
    <div className="space-y-8 select-none">
      {/* Profile Overview Banner */}
      <div className="glass-panel p-6 md:p-8 rounded-[24px] shadow-premium flex flex-col md:flex-row items-center gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/10 rounded-full blur-3xl pointer-events-none" />

        <img
          src={
            profile?.profile_photo ||
            `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='96' height='96' viewBox='0 0 96 96'%3E%3Crect width='96' height='96' rx='48' fill='%232dd4bf'/%3E%3Ctext x='50%25' y='55%25' dominant-baseline='middle' text-anchor='middle' fill='white' font-size='38' font-family='Inter,sans-serif' font-weight='700'%3E${(profile?.name || 'S').charAt(0).toUpperCase()}%3C/text%3E%3C/svg%3E`
          }
          alt="Avatar"
          className="w-24 h-24 rounded-full border-2 border-primary-500 shadow-md flex-shrink-0"
        />

        <div className="text-center md:text-left flex-1 min-w-0">
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">{profile?.name || 'Student'}</h1>
          <p className="inline-block text-[10px] uppercase font-black tracking-wider px-2.5 py-0.5 bg-primary-50 dark:bg-primary-950/40 text-primary-600 dark:text-primary-400 border border-primary-100 dark:border-primary-900/50 rounded-full mt-1.5">
            {profile?.role || 'Student'}
          </p>

          <div className="flex flex-wrap justify-center md:justify-start gap-4 mt-4 text-xs text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1">
              <Mail size={14} />
              {profile?.email || 'student@onecampus.edu'}
            </span>
            <span className="flex items-center gap-1">
              <Calendar size={14} />
              Joined {joinDate}
            </span>
          </div>

          {/* Readiness progress bar */}
          <div className="mt-4 max-w-xs">
            <div className="flex justify-between text-[10px] font-bold text-slate-400 mb-1">
              <span>Exam Readiness</span>
              <span className="text-primary-500">{stats.readinessScore}%</span>
            </div>
            <div className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary-500 to-teal-400 rounded-full transition-all duration-700"
                style={{ width: `${stats.readinessScore}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {statCards.map(({ label, value, icon: Icon, bg, shadow }) => (
          <div key={label} className="glass-panel p-4 rounded-[20px] shadow-sm flex flex-col items-center gap-3 text-center">
            <div className={`w-11 h-11 rounded-[12px] ${bg} text-white flex items-center justify-center shadow-lg ${shadow}`}>
              <Icon size={20} />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400 leading-none">{label}</p>
              <h3 className="text-xl font-extrabold text-slate-800 dark:text-white mt-1.5">{value}</h3>
            </div>
          </div>
        ))}
      </div>

      {/* Developer Feedback / Links */}
      <div className="glass-panel p-6 rounded-[24px] shadow-premium">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h3 className="font-bold text-sm text-slate-800 dark:text-white uppercase tracking-wider">Developer</h3>
            <p className="text-xs text-slate-400 mt-1">Meet the developer</p>
          </div>

          <a
            href="https://portfolio-theta-blue-68.vercel.app/"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-primary-500 text-white text-sm font-bold hover:bg-primary-600 transition-all duration-200 shadow-md shadow-primary-500/25 border border-primary-400/30 hover:-translate-y-0.5"
          >
            <span className="leading-none">Meet the developer</span>
          </a>
        </div>
      </div>

      {/* Enrolled Subjects Section */}
      <div className="glass-panel p-6 rounded-[24px] shadow-premium">
        <h3 className="font-bold text-sm text-slate-800 dark:text-white uppercase tracking-wider mb-4">
          Enrolled Subjects
        </h3>

        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-3">
              <span className="w-2.5 h-2.5 rounded-full bg-primary-500" />
              <div>
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">Engineering Chemistry II (22CH203)</h4>
                <p className="text-xs text-slate-400 mt-0.5">S2 Semester · Bannari Amman Institute of Technology</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs font-semibold text-slate-500">Exam: 29 June 2026</p>
              <p className="text-[10px] text-slate-400 mt-0.5">
                {stats.questionsCompleted}/{stats.totalQuestions} questions done
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
