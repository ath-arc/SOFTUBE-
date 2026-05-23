import React, { useState } from 'react';
import { 
  auth, 
  db 
} from '../firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  sendPasswordResetEmail,
  signOut
} from 'firebase/auth';
import { 
  doc, 
  setDoc,
  serverTimestamp 
} from 'firebase/firestore';
import { 
  ShieldCheck, 
  Key, 
  Mail, 
  User, 
  ArrowRight,
  Sparkles,
  Info,
  CheckCircle2,
  AlertCircle,
  HardDrive
} from 'lucide-react';

interface AuthViewProps {
  onAuthSuccess: (user: any) => void;
  onGuestAccess: () => void;
}

export default function AuthView({ onAuthSuccess, onGuestAccess }: AuthViewProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfoMessage('');
    
    if (!email || !password) {
      setError('Please provide both email and password.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      if (isSignUp) {
        // Sign Up
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Bootstrap profile document in Firestore as per firebase-blueprint schema
        try {
          await setDoc(doc(db, 'users', user.uid), {
            uid: user.uid,
            email: user.email,
            createdAt: new Date().toISOString()
          });
        } catch (dbErr) {
          console.warn("Could not save to Firestore nodes tree instantly (rules may restrict), using state sync: ", dbErr);
        }

        setInfoMessage('Account created successfully! Auto-logging in...');
        onAuthSuccess(user);
      } else {
        // Log In
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        onAuthSuccess(userCredential.user);
      }
    } catch (err: any) {
      console.error(err);
      let friendlyError = err.message;
      if (err.code === 'auth/email-already-in-use') friendlyError = 'This email is already in use.';
      if (err.code === 'auth/invalid-credential') friendlyError = 'Incorrect email or password combination.';
      if (err.code === 'auth/user-not-found') friendlyError = 'No account detected for this email.';
      setError(friendlyError);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfoMessage('');

    if (!email) {
      setError('Please provide your email address.');
      return;
    }

    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setInfoMessage('Reset instructions have been transmitted. Please check your inbox!');
      setShowForgotPassword(false);
    } catch (err: any) {
      console.error(err);
      setError('Could not transmit password reset instructions: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-screen bg-slate-950 flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8 font-sans text-slate-100" id="auth-portal-shell">
      
      {/* Background Neon Accent Gradients */}
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,rgba(30,58,138,0.2),transparent_50%),radial-gradient(ellipse_at_bottom_left,rgba(8,47,73,0.25),transparent_50%)] pointer-events-none" />

      <div className="max-w-md w-full space-y-8 relative z-10" id="auth-card-wrapper">
        
        {/* SoftDrive Logo & Branded Header */}
        <div className="text-center" id="auth-brand-area">
          <div className="mx-auto h-12 w-12 bg-blue-600 rounded-2xl flex items-center justify-center font-black text-2xl text-white shadow-xl shadow-blue-500/20 mb-4 select-none" id="auth-logo">
            S
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight text-white font-sans">
            SOFTDRIVE CLOUD
          </h2>
          <p className="mt-2 text-xs text-slate-400">
            Secure browser workspace & media compilation engine.
          </p>
        </div>

        {/* Info/Notice banners */}
        {error && (
          <div className="bg-rose-950/40 border border-rose-500/30 text-rose-400 p-3.5 rounded-xl text-xs flex items-center gap-3" id="auth-error-banner">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span className="leading-snug">{error}</span>
          </div>
        )}

        {infoMessage && (
          <div className="bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 p-3.5 rounded-xl text-xs flex items-center gap-3" id="auth-info-banner">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span className="leading-snug">{infoMessage}</span>
          </div>
        )}

        {/* Core Interactive Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl" id="auth-login-card">
          
          {!showForgotPassword ? (
            <>
              <div className="flex border-b border-slate-800 pb-4 mb-6" id="auth-tab-row">
                <button
                  id="tab-signin-trigger"
                  onClick={() => { setIsSignUp(false); setError(''); setInfoMessage(''); }}
                  className={`flex-1 text-center pb-2 text-xs font-bold uppercase tracking-wider transition ${!isSignUp ? 'text-blue-500 border-b-2 border-blue-500' : 'text-slate-500 hover:text-slate-300'}`}
                >
                  Log In
                </button>
                <button
                  id="tab-signup-trigger"
                  onClick={() => { setIsSignUp(true); setError(''); setInfoMessage(''); }}
                  className={`flex-1 text-center pb-2 text-xs font-bold uppercase tracking-wider transition ${isSignUp ? 'text-blue-500 border-b-2 border-blue-500' : 'text-slate-500 hover:text-slate-300'}`}
                >
                  Sign Up
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4" id="auth-form-body">
                <div>
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Email Address</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-xs">
                      <Mail className="h-3.5 w-3.5" />
                    </span>
                    <input
                      id="auth-email-input"
                      type="email"
                      required
                      placeholder="you@domain.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 text-slate-100 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Password</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-xs">
                      <Key className="h-3.5 w-3.5" />
                    </span>
                    <input
                      id="auth-password-input"
                      type="password"
                      required
                      minLength={6}
                      placeholder="Enter security key (6+ chars)"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 text-slate-100 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1" id="auth-actions-remember">
                  <span className="text-[10px] text-slate-500 font-mono">
                    {isSignUp ? 'Account sync active' : 'SSL encrypted connection'}
                  </span>
                  
                  {!isSignUp && (
                    <button
                      id="forgot-password-trigger"
                      type="button"
                      onClick={() => { setShowForgotPassword(true); setError(''); setInfoMessage(''); }}
                      className="text-[10px] font-bold text-blue-400 hover:text-blue-500 transition cursor-pointer"
                    >
                      Forgot key?
                    </button>
                  )}
                </div>

                <button
                  id="auth-submit-btn"
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-800 text-white py-3 rounded-xl text-xs font-bold transition-all shadow-lg flex items-center justify-center gap-1.5 cursor-pointer mt-6"
                >
                  <span>{loading ? 'Verifying authentication...' : isSignUp ? 'Create SoftDrive Account' : 'Authenticate Key'}</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </form>
            </>
          ) : (
            <>
              <h3 className="text-sm font-bold text-slate-100 tracking-tight mb-4 flex items-center gap-2">
                <span>🔑</span> Reset Security Key
              </h3>
              <p className="text-xs text-slate-400 mb-6 leading-relaxed">
                Provide your registered email address and we will automatically transmit a secure link to reset your workspace key.
              </p>

              <form onSubmit={handleForgotPasswordSubmit} className="space-y-4" id="forgot-password-form">
                <div>
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Email Address</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-xs">
                      <Mail className="h-3.5 w-3.5" />
                    </span>
                    <input
                      id="reset-email-input"
                      type="email"
                      required
                      placeholder="you@domain.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 text-slate-100 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-4" id="forgot-ps-actions">
                  <button
                    id="cancel-reset-btn"
                    type="button"
                    onClick={() => { setShowForgotPassword(false); setError(''); }}
                    className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 py-2.5 rounded-xl text-xs font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    id="submit-reset-btn"
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-800 text-white py-2.5 rounded-xl text-xs font-bold cursor-pointer"
                  >
                    {loading ? 'Transmitting...' : 'Send Link'}
                  </button>
                </div>
              </form>
            </>
          )}

          {/* Quick Sandbox Bypass */}
          <div className="mt-8 border-t border-slate-800/80 pt-5 text-center" id="demo-mode-zone">
            <span className="text-[10px] text-slate-500 block mb-3 font-mono">OR EXPLORE IMMEDIATELY</span>
            <button
              id="guest-access-btn"
              onClick={onGuestAccess}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 hover:text-white text-slate-300 rounded-xl text-xs font-semibold tracking-tight transition cursor-pointer"
            >
              🚀 Bypass Authentication (Live Guest Mode)
            </button>
          </div>

        </div>

        {/* Security Disclaimers */}
        <p className="text-center text-[9px] text-slate-600 font-mono tracking-wide select-none" id="auth-copyright">
          SECURE ENCRYPTED KEY EXCHANGE • CLOUD DATA PROTECTION RULESETS ACTIVE
        </p>

      </div>
    </div>
  );
}
