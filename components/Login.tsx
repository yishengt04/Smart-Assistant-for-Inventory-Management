
import React, { useState, useEffect } from 'react';
import { auth, googleProvider } from '../firebaseConfig';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signInWithPopup,
  RecaptchaVerifier,
  signInWithPhoneNumber
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { LogIn, UserPlus, Package, Loader2, Chrome, Phone, ArrowRight, ShieldCheck } from 'lucide-react';

type AuthMode = 'email' | 'phone';

const Login: React.FC = () => {
  const [authMode, setAuthMode] = useState<AuthMode>('email');
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Phone Auth State
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [confirmationResult, setConfirmationResult] = useState<any>(null);
  const [showOtp, setShowOtp] = useState(false);

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (authMode === 'phone' && !window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible',
      });
    }
  }, [authMode]);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
    } catch (err: any) {
      setError(err.message.replace('Firebase:', '').trim());
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError('');
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      setError(err.message.replace('Firebase:', '').trim());
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const appVerifier = window.recaptchaVerifier;
      const result = await signInWithPhoneNumber(auth, phoneNumber, appVerifier);
      setConfirmationResult(result);
      setShowOtp(true);
    } catch (err: any) {
      setError(err.message.replace('Firebase:', '').trim());
      // Reset reCAPTCHA if it fails
      if (window.recaptchaVerifier) {
          window.recaptchaVerifier.clear();
          window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', { size: 'invisible' });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await confirmationResult.confirm(otp);
    } catch (err: any) {
      setError("Invalid verification code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#121212]">
      <div id="recaptcha-container"></div>
      
      <div className="w-full max-w-md bg-[#1e1e1e] border border-[#2e2e2e] rounded-2xl shadow-2xl p-8 auth-card">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600/10 rounded-2xl mb-4">
            <Package className="w-8 h-8 text-blue-500" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">
            SmartStock <span className="text-blue-500">Pro</span>
          </h1>
          <p className="text-slate-400 text-sm">
            {authMode === 'phone' 
              ? (showOtp ? 'Verification code sent' : 'Enter phone with country code')
              : (isLogin ? 'Welcome back! Please enter your details.' : 'Create an account to start managing.')
            }
          </p>
        </div>

        {error && (
          <div className="mb-6 bg-red-500/10 border border-red-500/50 text-red-500 text-xs p-3 rounded-lg font-medium text-center animate-shake">
            {error}
          </div>
        )}

        {/* Auth Mode Toggle */}
        <div className="flex bg-[#2a2a2a] p-1 rounded-xl mb-6">
          <button 
            onClick={() => { setAuthMode('email'); setShowOtp(false); }}
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg transition-all ${authMode === 'email' ? 'bg-[#3b82f6] text-white shadow-lg' : 'text-slate-400'}`}
          >
            Email
          </button>
          <button 
            onClick={() => setAuthMode('phone')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg transition-all ${authMode === 'phone' ? 'bg-[#3b82f6] text-white shadow-lg' : 'text-slate-400'}`}
          >
            Phone
          </button>
        </div>

        {authMode === 'email' ? (
          <form onSubmit={handleEmailAuth} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Email Address</label>
              <input
                required
                type="email"
                className="w-full px-4 py-3 bg-[#2a2a2a] border border-[#333] rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Password</label>
              <input
                required
                type="password"
                className="w-full px-4 py-3 bg-[#2a2a2a] border border-[#333] rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-900/20"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                isLogin ? <><LogIn className="w-4 h-4" /> Sign In</> : <><UserPlus className="w-4 h-4" /> Create Account</>
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={showOtp ? handleVerifyOtp : handlePhoneSignIn} className="space-y-4">
            {!showOtp ? (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Phone Number</label>
                <input
                  required
                  type="tel"
                  className="w-full px-4 py-3 bg-[#2a2a2a] border border-[#333] rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  placeholder="+1234567890"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                />
              </div>
            ) : (
              <div className="space-y-1.5 animate-in fade-in slide-in-from-right-4">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Verification Code</label>
                <div className="relative">
                  <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-500" />
                  <input
                    required
                    type="text"
                    className="w-full pl-10 pr-4 py-3 bg-[#2a2a2a] border border-[#333] rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all tracking-[0.5em] font-bold text-center"
                    placeholder="000000"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-900/20"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                showOtp ? <><ShieldCheck className="w-4 h-4" /> Verify OTP</> : <><Phone className="w-4 h-4" /> Send Code</>
              )}
            </button>
            
            {showOtp && (
              <button 
                type="button" 
                onClick={() => setShowOtp(false)}
                className="w-full text-xs text-slate-500 font-medium hover:text-white transition-colors"
              >
                Use a different number
              </button>
            )}
          </form>
        )}

        <div className="relative my-8 text-center">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-[#333]"></div></div>
          <span className="relative bg-[#1e1e1e] px-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Or continue with</span>
        </div>

        <button
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full py-3 bg-[#2a2a2a] border border-[#333] hover:bg-[#333] text-white rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-3"
        >
          <Chrome className="w-5 h-5" />
          Google Account
        </button>

        <div className="mt-8 pt-6 border-t border-[#333] text-center">
          {authMode === 'email' ? (
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm font-semibold text-blue-500 hover:text-blue-400 transition-colors"
            >
              {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
            </button>
          ) : (
            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Standard SMS rates may apply</p>
          )}
        </div>
      </div>
    </div>
  );
};

// Add to window for Firebase Phone Auth
declare global {
  interface Window {
    recaptchaVerifier: any;
  }
}

export default Login;
