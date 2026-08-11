import React from 'react';
import { Home, FileText, Search, ShieldCheck, Phone } from 'lucide-react';
import { User } from 'firebase/auth';
import logoImg from '../assets/images/a4_sudan_green_logo_1785943554845.jpg';

interface HeaderProps {
  currentView: 'home' | 'order' | 'sheets' | 'track' | 'admin';
  setCurrentView: (view: 'home' | 'order' | 'sheets' | 'track' | 'admin') => void;
  activeOrderCount: number;
  onOpenApkModal?: () => void;
  currentUser?: User | null;
  onOpenAuthModal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ 
  currentView, 
  setCurrentView, 
  activeOrderCount, 
  onOpenApkModal,
  currentUser,
  onOpenAuthModal 
}) => {
  return (
    <header className="sticky top-0 z-50 bg-gradient-to-r from-emerald-900 via-emerald-800 to-emerald-900 text-white shadow-xl border-b border-emerald-700/80">
      {/* Top Banner Notice */}
      <div className="bg-emerald-600 text-white px-4 py-1.5 text-xs sm:text-sm font-bold flex flex-wrap justify-between items-center gap-2 border-b border-emerald-500/40">
        <div className="flex items-center gap-2 mx-auto sm:mx-0">
          <span className="flex h-2 w-2 rounded-full bg-emerald-200 animate-ping"></span>
          <span>خدمة الطباعة والتوصيل متوفرة في <strong>الخرطوم، أم درمان، بحري، بورتسودان، وود مدني</strong> وجميع الجامعات</span>
        </div>
        <div className="hidden lg:flex items-center gap-2 text-xs">
          <span className="flex items-center gap-1 text-emerald-100">
            <Phone className="w-3.5 h-3.5 text-emerald-200" /> 0119636365
          </span>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          
          {/* Logo & Brand Name */}
          <div 
            onClick={() => setCurrentView('sheets')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <img
              src={logoImg}
              alt="A4 SUDAN - Student Services Center"
              referrerPolicy="no-referrer"
              className="h-10 sm:h-12 w-auto rounded-xl object-contain shadow-lg group-hover:scale-105 transition-transform border border-emerald-400/60"
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg sm:text-2xl tracking-tight text-white group-hover:text-emerald-300 transition-colors">
                  A4 SUDAN
                </span>
                <span className="bg-emerald-500/30 text-emerald-200 border border-emerald-400/40 text-[10px] px-2.5 py-0.5 rounded-full font-bold">
                  سودان
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-emerald-200/80 font-medium">
                مكتبة الطباعة الإلكترونية الشاملة والشيتات
              </p>
            </div>
          </div>

          {/* Desktop Nav Items */}
          <nav className="hidden lg:flex items-center gap-1.5 xl:gap-2">
            <button
              onClick={() => setCurrentView('home')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                currentView === 'home'
                  ? 'bg-amber-400 text-slate-950 shadow-sm'
                  : 'text-emerald-100 hover:text-white hover:bg-emerald-900/80'
              }`}
            >
              <Home className="w-4 h-4" />
              <span>الرئيسية</span>
            </button>

            <button
              onClick={() => setCurrentView('sheets')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                currentView === 'sheets'
                  ? 'bg-amber-400 text-slate-950 shadow-sm'
                  : 'text-emerald-100 hover:text-white hover:bg-emerald-900/80'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>مكتبة A4 Sudan</span>
            </button>

            <button
              onClick={() => setCurrentView('track')}
              className={`relative flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                currentView === 'track'
                  ? 'bg-amber-400 text-slate-950 shadow-sm'
                  : 'text-emerald-100 hover:text-white hover:bg-emerald-900/80'
              }`}
            >
              <Search className="w-4 h-4" />
              <span>متابعة الطلبات</span>
              {activeOrderCount > 0 && (
                <span className="bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  {activeOrderCount}
                </span>
              )}
            </button>
          </nav>

          {/* Admin Switcher Button */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentView('admin')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer border ${
                currentView === 'admin'
                  ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-xs'
                  : 'border-emerald-700/80 text-emerald-200 hover:border-emerald-500 hover:text-white hover:bg-emerald-900/50'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-emerald-300" />
              <span className="hidden sm:inline">إدارة المكتبة</span>
              <span className="sm:hidden">الإدارة</span>
            </button>
          </div>

        </div>

        {/* Mobile Navigation Row */}
        <div className="flex lg:hidden overflow-x-auto py-2 border-t border-emerald-800/60 gap-2 no-scrollbar text-xs">
          <button
            onClick={() => setCurrentView('home')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg whitespace-nowrap font-bold cursor-pointer transition-all ${
              currentView === 'home' ? 'bg-amber-400 text-slate-950 shadow-xs' : 'bg-emerald-900/80 text-emerald-100 hover:bg-emerald-800'
            }`}
          >
            <Home className="w-3.5 h-3.5" />
            <span>الرئيسية</span>
          </button>

          <button
            onClick={() => setCurrentView('sheets')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg whitespace-nowrap font-bold cursor-pointer transition-all ${
              currentView === 'sheets' ? 'bg-amber-400 text-slate-950 shadow-xs' : 'bg-emerald-900/80 text-emerald-100 hover:bg-emerald-800'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>المكتبة الشاملة</span>
          </button>

          <button
            onClick={() => setCurrentView('track')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg whitespace-nowrap font-bold cursor-pointer transition-all ${
              currentView === 'track' ? 'bg-amber-400 text-slate-950 shadow-xs' : 'bg-emerald-900/80 text-emerald-100 hover:bg-emerald-800'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            <span>تتبع الطلب</span>
            {activeOrderCount > 0 && (
              <span className="bg-rose-500 text-white text-[10px] font-bold px-1.5 rounded-full">
                {activeOrderCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
