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

