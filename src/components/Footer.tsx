import React from 'react';
import logoImg from '../assets/images/a4_sudan_green_logo_1785943554845.jpg';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-gradient-to-br from-emerald-900 via-emerald-800 to-emerald-950 text-emerald-100 border-t border-emerald-700/80 pt-8 pb-6 mt-12 text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Brand Info & Description */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-4 text-center sm:text-right">
          <div className="flex items-center gap-3">
            <img
              src={logoImg}
              alt="A4 SUDAN - Student Services Center"
              referrerPolicy="no-referrer"
              className="h-11 w-auto rounded-xl object-contain shadow-md border border-emerald-400/50"
            />
            <div>
              <span className="font-extrabold text-xl text-white tracking-tight block">
                A4 SUDAN
              </span>
              <span className="text-[10px] text-emerald-300 block -mt-1 font-mono tracking-wider font-bold">
                STUDENT SERVICES CENTER
              </span>
            </div>
          </div>
          <p className="text-xs text-emerald-100/80 max-w-xl leading-relaxed">
            منصة وتطبيق مكتبة A4 Sudan الأولى لطباعة المستندات والشيتات التعليمية والمذكرات الجامعية مع التوصيل السريع لجميع الولايات والجامعات السودانية.
          </p>
        </div>

        {/* Social Follow Links */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-emerald-800/80">
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-200">
            <span>تابع صفحاتنا الرسمية:</span>
            <span className="font-mono text-amber-300 font-black">A4SUDAN</span>
          </div>

          <div className="flex items-center gap-3 flex-wrap justify-center">
            {/* Facebook Button */}
            <a
              href="https://www.facebook.com/A4SUDAN"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-[#1877F2] hover:bg-[#166fe5] text-white text-xs font-bold px-3.5 py-1.5 rounded-xl transition-transform hover:scale-105 shadow-sm"
              title="صفحة A4 SUDAN على فيسبوك"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
              <span>فيسبوك (A4SUDAN)</span>
            </a>

            {/* TikTok Button */}
            <a
              href="https://www.tiktok.com/@A4SUDAN"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-slate-950 hover:bg-black text-white text-xs font-bold px-3.5 py-1.5 rounded-xl border border-slate-700 transition-transform hover:scale-105 shadow-sm"
              title="حساب A4 SUDAN على تيك توك"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
              </svg>
              <span>تيك توك (A4SUDAN)</span>
            </a>
          </div>
        </div>

        {/* Copyright Notice */}
        <div className="pt-4 border-t border-emerald-900/80 text-center text-xs text-emerald-400/70 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>© {new Date().getFullYear()} A4 Sudan Printing Services. جميع الحقوق محفوظة.</span>
          <span className="flex items-center gap-1 text-emerald-300">
            تم التطوير لطلاب ومؤسسات السودان 🇸🇩
          </span>
        </div>
      </div>
    </footer>
  );
};

