import React, { useState } from 'react';
import { X, Mail, Lock, User as UserIcon, LogIn, UserPlus, Shield, CheckCircle2, AlertCircle, Sparkles, Loader2, RefreshCw } from 'lucide-react';
import { signUpWithEmail, signInWithEmail, signOutUser } from '../lib/firebase';
import { User } from 'firebase/auth';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  onAuthSuccess?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onAuthSuccess
}) => {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!email.trim() || !password.trim()) {
      setErrorMsg('يرجى ملء جميع الحقول المطلوبة.');
      return;
    }

    if (mode === 'signup' && password.length < 6) {
      setErrorMsg('كلمة المرور يجب أن تتكون من 6 أحرف أو أرقام على الأقل.');
      return;
    }

    setLoading(true);

    try {
      if (mode === 'signup') {
        await signUpWithEmail(email.trim(), password, displayName.trim() || 'طالب A4');
        setSuccessMsg('تم إنشاء الحساب بنجاح! تم ربط حسابك بجميع طلباتك.');
      } else {
        await signInWithEmail(email.trim(), password);
        setSuccessMsg('تم تسجيل الدخول بنجاح! جاري مزامنة طلباتك...');
      }

      setTimeout(() => {
        if (onAuthSuccess) onAuthSuccess();
        onClose();
        setLoading(false);
      }, 1200);

    } catch (err: any) {
      setLoading(false);
      console.error('Firebase Auth error:', err);
      const code = err?.code || '';
      
      if (code === 'auth/email-already-in-use') {
        setErrorMsg('هذا البريد الإلكتروني مسجل بالفعل. يرجى اختيار تسجيل الدخول.');
      } else if (code === 'auth/invalid-email') {
        setErrorMsg('البريد الإلكتروني غير صحيح.');
      } else if (code === 'auth/wrong-password' || code === 'auth/invalid-credential' || code === 'auth/user-not-found') {
        setErrorMsg('البريد الإلكتروني أو كلمة المرور غير صحيحة.');
      } else if (code === 'auth/weak-password') {
        setErrorMsg('كلمة المرور ضعيفة جداً. استخدم 6 أحرف على الأقل.');
      } else {
        setErrorMsg(err?.message || 'حدث خطأ أثناء الاتصال بالخادم. حاول مجدداً.');
      }
    }
  };

  const handleSignOut = async () => {
    setLoading(true);
    try {
      await signOutUser();
      setSuccessMsg('تم تسجيل الخروج بنجاح.');
      setTimeout(() => {
        setLoading(false);
        onClose();
      }, 800);
    } catch (err) {
      setLoading(false);
      setErrorMsg('حدث خطأ أثناء تسجيل الخروج.');
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div 
        className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-emerald-100 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-emerald-900 text-white p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 left-4 p-2 rounded-full text-emerald-200 hover:text-white hover:bg-emerald-900/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300 shadow-inner">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-black text-white">
                {currentUser ? 'حساب المستخدم' : (mode === 'signin' ? 'تسجيل الدخول' : 'إنشاء حساب جديد')}
              </h3>
              <p className="text-xs text-emerald-200/90 mt-0.5">
                مزامنة طلبات الطباعة عبر جميع الأجهزة والمستصفحات ☁️
              </p>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6">
          {currentUser ? (
            /* Logged In View */
            <div className="space-y-6 text-center">
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200/80 flex flex-col items-center gap-3">
                <div className="w-16 h-16 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-2xl shadow-lg">
                  {currentUser.displayName ? currentUser.displayName.charAt(0).toUpperCase() : (currentUser.email ? currentUser.email.charAt(0).toUpperCase() : 'U')}
                </div>
                <div>
                  <h4 className="font-extrabold text-slate-900 text-lg">
                    {currentUser.displayName || 'طالب A4'}
                  </h4>
                  <p className="text-xs text-slate-600 font-mono mt-0.5 dir-ltr">
                    {currentUser.email}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-bold bg-emerald-100/80 px-3 py-1 rounded-full border border-emerald-300/50">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>الحساب متصل ومزامن بـ Firebase Auth</span>
                </div>
              </div>

              <div className="text-right text-xs text-slate-600 space-y-2 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <p className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  مميزات الحساب المفعل:
                </p>
                <ul className="list-disc list-inside space-y-1 text-slate-600 pr-1">
                  <li>الوصول التلقائي لطلباتك من أي هاتف أو كمبيوتر آخر</li>
                  <li>حفظ بيانات التوصيل المفضل والعناوين</li>
                  <li>متابعة حالة طباعة وتوصيل المستندات مباشرة</li>
                </ul>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-sm transition-colors"
                >
                  إغلاق
                </button>
                <button
                  onClick={handleSignOut}
                  disabled={loading}
                  className="flex-1 py-3 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm transition-colors flex items-center justify-center gap-2 shadow-md"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'تسجيل الخروج'}
                </button>
              </div>
            </div>
          ) : (
            /* Auth Form View (SignIn / SignUp) */
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Mode Tabs */}
              <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200">
                <button
                  type="button"
                  onClick={() => { setMode('signin'); setErrorMsg(''); setSuccessMsg(''); }}
                  className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                    mode === 'signin'
                      ? 'bg-white text-emerald-900 shadow-sm font-black'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>تسجيل الدخول</span>
                </button>
                <button
                  type="button"
                  onClick={() => { setMode('signup'); setErrorMsg(''); setSuccessMsg(''); }}
                  className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                    mode === 'signup'
                      ? 'bg-white text-emerald-900 shadow-sm font-black'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>إنشاء حساب جديد</span>
                </button>
              </div>

              {errorMsg && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-bold flex items-center gap-2 animate-shake">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {successMsg && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>{successMsg}</span>
                </div>
              )}

              {mode === 'signup' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    الاسم الكامل / اسم الطالب
                  </label>
                  <div className="relative">
                    <UserIcon className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="مثال: محمد أحمد علي"
                      className="w-full pr-9 pl-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  البريد الإلكتروني <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="student@gmail.com"
                    className="w-full pr-9 pl-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none dir-ltr text-right placeholder:text-left"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  كلمة المرور <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pr-9 pl-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                  />
                </div>
                {mode === 'signup' && (
                  <p className="text-[11px] text-slate-500 mt-1">
                    يجب أن لا تقل عن 6 أحرف.
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-emerald-800 hover:bg-emerald-700 text-white font-extrabold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>جاري الاتصال بقوقل...</span>
                  </>
                ) : (
                  <>
                    {mode === 'signin' ? <LogIn className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                    <span>{mode === 'signin' ? 'تسجيل الدخول الآن' : 'تأكيد إنشاء الحساب'}</span>
                  </>
                )}
              </button>

              <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-100 text-[11px] text-emerald-800 leading-relaxed">
                ✨ <strong>فائدة الحساب:</strong> يُحفظ بريدك لمنحك حق الوصول المباشر لجميع شيتات وطلباتك من متصفح سفاري، كروم، أو التطبيق في أي وقت.
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
