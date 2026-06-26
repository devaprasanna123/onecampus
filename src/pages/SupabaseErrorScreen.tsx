import React from 'react';

export const SupabaseErrorScreen: React.FC<{ title?: string; message: string; details?: string }> = ({
  title = 'Supabase connection error',
  message,
  details,
}) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-tr from-slate-900 via-slate-800 to-slate-950 p-4">
      <div className="w-full max-w-2xl glass-panel p-8 rounded-[24px] shadow-2xl border border-red-500/30">
        <div className="text-center">
          <div className="text-red-500 font-black text-2xl">✖</div>
          <h1 className="mt-3 text-xl font-extrabold text-slate-100">{title}</h1>
          <p className="mt-3 text-sm text-slate-300 leading-relaxed">
            {message}
          </p>
          {details ? (
            <pre className="mt-4 text-left text-xs bg-black/20 border border-red-500/20 rounded-xl p-4 overflow-auto text-slate-200 whitespace-pre-wrap">
              {details}
            </pre>
          ) : null}
        </div>
      </div>
    </div>
  );
};

