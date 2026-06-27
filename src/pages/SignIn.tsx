import React, { useState } from 'react';
import { useAuth } from '../features/auth/AuthContext';

export const SignIn: React.FC = () => {
  const { signInWithGoogle, loading } = useAuth();
  const [isAccepted, setIsAccepted] = useState<boolean>(false);
  const [showDisclaimerText, setShowDisclaimerText] = useState<boolean>(false);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] p-4 select-none relative">
      {/* Background pattern matching the clean dashboard background */}
      <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:24px_24px] opacity-70 pointer-events-none"></div>

      <div className="w-full max-w-md bg-white border border-[#e2e8f0] rounded-[20px] shadow-sm p-8 relative overflow-hidden transition-all duration-300">
        
        {/* Header Section */}
        <div className="text-center mb-6 relative">
          <div className="inline-flex items-center justify-center gap-2 mb-3">
            <div className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-[#2563eb] text-white font-bold text-sm shadow-sm">
              oc
            </div>
            <span className="text-xl font-bold text-[#0f172a] tracking-tight">
              OneCampus
            </span>
          </div>
          <p className="text-sm text-[#475569] font-medium">
            Smart Exam Preparation Platform
          </p>
        </div>

        {/* Collapsible Disclaimer Box - Only shows when showDisclaimerText is true */}
        {showDisclaimerText && (
          <div className="border border-[#fef08a] bg-[#fefce8] rounded-xl p-4 mb-4 text-left text-xs text-[#713f12] leading-relaxed transition-all duration-200 animate-fadeIn">
            <div className="flex items-center gap-2 mb-2 font-bold text-sm text-[#854d0e]">
              <svg className="w-4 h-4 text-[#a16207]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              Disclaimer
            </div>
            <p className="mb-2">
              Study at your own discretion. The answer keys provided on this platform are generated with the assistance of Artificial Intelligence (AI) and may contain inaccuracies or incomplete information. Students are strongly advised to verify the correctness of the answers using their textbooks, faculty guidance, or official reference materials before relying on them for examinations.
            </p>
            <p>
              OneCampus provides these materials only for learning and reference purposes. OneCampus Organization is not responsible for any incorrect answers, examination results, marks obtained, or knowledge gained or lost through the use of these materials. By accessing and using these resources, you acknowledge and accept this disclaimer.
            </p>
            <p className="font-semibold text-right text-[#a16207] mt-2">-TEAM OneCampus</p>
          </div>
        )}

        {/* Checkbox Container with the Underlined Disclaimer Link */}
        <div className="flex items-start gap-3 mb-6 px-1">
          <input
            id="disclaimer-checkbox"
            type="checkbox"
            checked={isAccepted}
            onChange={(e) => setIsAccepted(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-[#cbd5e1] text-[#2563eb] focus:ring-[#2563eb] cursor-pointer"
          />
          <label htmlFor="disclaimer-checkbox" className="text-xs font-medium text-[#475569] select-none">
            I have read, understood, and accept the AI{' '}
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                setShowDisclaimerText(!showDisclaimerText);
              }}
              className="underline text-[#2563eb] hover:text-[#1d4ed8] font-semibold focus:outline-none inline"
            >
              disclaimer
            </button>
            .
          </label>
        </div>

        {/* Action Button Section Container */}
        <div className="border-t border-[#f1f5f9] pt-5 text-center">
          <p className="text-xs text-[#64748b] font-medium mb-4">
            Sign in with Google to continue
          </p>

          <button
            onClick={signInWithGoogle}
            disabled={loading || !isAccepted}
            className={`w-full flex items-center justify-center gap-3 bg-white text-[#334155] border border-[#cbd5e1] py-3 px-5 rounded-xl text-sm font-semibold shadow-sm transition-all duration-200
              ${(!isAccepted || loading) 
                ? 'opacity-50 cursor-not-allowed bg-[#f8fafc]' 
                : 'hover:bg-[#f8fafc] hover:border-[#b4c6ef] active:scale-[0.99]'
              }`}
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-[#94a3b8] border-t-[#2563eb] rounded-full animate-spin"></div>
            ) : (
              <>
                {/* Official Multi-Color Google Brand Logo */}
                <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
                </svg>
                <span>Continue with Google</span>
              </>
            )}
          </button>
        </div>

        <div className="text-center text-xs text-[#94a3b8] mt-5 leading-relaxed">
          Secure, direct access to your exam study keys, schedules, and analytics dashboard.
        </div>
      </div>

   
    </div>
  );
};

export default SignIn;