import React from 'react';
import ChatGPTFloatingButton from '../components/ChatGPTFloatingButton';

import { useAuth } from '../features/auth/AuthContext';

export const SignIn: React.FC = () => {
  const { signInWithGoogle, loading } = useAuth();

  return (
    <div className="min-height-screen min-h-screen flex items-center justify-center bg-gradient-to-tr from-slate-900 via-slate-800 to-slate-950 p-4 select-none">
      {/* Decorative premium background grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-20 pointer-events-none"></div>

      <div className="w-full max-w-md glass-panel p-8 rounded-[24px] shadow-2xl relative overflow-hidden transition-all duration-300 hover:scale-[1.01]">
        {/* Decorative corner glow */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none"></div>

        <div className="text-center mb-8 relative">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-[16px] bg-primary-500 text-white font-extrabold text-2xl shadow-lg shadow-primary-500/30 mb-4 animate-bounce">
            OC
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            OneCampus
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 font-medium">
            Smart Exam Preparation Platform
          </p>
        </div>

        <div className="border-t border-slate-200/50 dark:border-slate-800/50 py-6 text-center">
          <p className="text-sm text-slate-700 dark:text-slate-300 font-medium mb-6">
            Sign in with Google to continue
          </p>

          <button
            onClick={signInWithGoogle}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-white dark:bg-slate-800 text-slate-800 dark:text-white border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 hover:border-slate-300 active:scale-[0.98] py-3.5 px-5 rounded-premium text-sm font-semibold shadow-sm transition-all duration-200"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-slate-400 border-t-slate-800 dark:border-t-white rounded-full animate-spin"></div>
            ) : (
              <>
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#EA4335"
                    d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.2-5.136 4.2a5.79 5.79 0 0 1-5.79-5.79 5.79 5.79 0 0 1 5.79-5.79c1.944 0 3.738.784 5.034 2.16l3.225-3.225C19.782 3.655 16.22 2 12.24 2 6.64 2 2 6.64 2 12.24s4.64 10.24 10.24 10.24c6.262 0 10.41-4.4 10.41-10.59 0-.693-.08-1.21-.24-1.605H12.24z"
                  />
                </svg>
                <span>Continue with Google</span>
              </>
            )}
          </button>
        </div>

        <div className="text-center text-xs text-slate-600 dark:text-slate-500 mt-4 leading-relaxed">
          Secure, direct access to your exam study keys, schedules, and analytics dashboard.
        </div>
      </div>


      <ChatGPTFloatingButton className="bottom-20 right-6" />

    </div>
  );
};
export default SignIn;

