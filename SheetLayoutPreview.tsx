import React from 'react';
import { PrintSides, PrintColor } from '../types';
import { Layers, FileText, CheckCircle2 } from 'lucide-react';

interface SheetLayoutPreviewProps {
  pagesPerSheet?: number; // 2, 4, 8
  sides?: PrintSides; // 'single' | 'double'
  color?: PrintColor;
  pageCount?: number;
  onSelectPagesPerSheet?: (pps: number) => void;
  onSelectSides?: (sides: PrintSides) => void;
  interactive?: boolean;
}

export const SheetLayoutPreview: React.FC<SheetLayoutPreviewProps> = ({
  pagesPerSheet = 2,
  sides = 'double',
  color = 'bw',
  pageCount,
  onSelectPagesPerSheet,
  onSelectSides,
  interactive = true,
}) => {
  const ppsOptions = [
    {
      value: 2,
      title: 'عادي (صفحتين بالورقة)',
      subtitle: 'توزيع 2:1',
      desc: 'قراءة مريحة وواضحة (صفحتين لكل ورقة)',
      badge: '2:1 عادي',
    },
    {
      value: 4,
      title: 'شائع ⭐ (4 صفحات بالورقة)',
      subtitle: 'توزيع 4:1 ⭐',
      desc: 'الخيار الشائع والأكثر طلباً (4 صفحات لكل ورقة)',
      badge: '4:1 شائع ⭐',
    },
    {
      value: 8,
      title: 'اسلايت (8 صفحات بالورقة)',
      subtitle: 'توزيع 8:1',
      desc: 'مناسب لشرائح العروض والسلايدات (8 صفحات لكل ورقة)',
      badge: '8:1 اسلايت',
    },
  ];

  // Calculate actual printed physical papers
  const actualSheets = pageCount ? Math.ceil(pageCount / pagesPerSheet) : null;
  const doubleSidedPapers = actualSheets ? Math.ceil(actualSheets / (sides === 'double' ? 2 : 1)) : null;

  // Render miniature layout illustration inside a paper card
  const renderPaperLayout = (num: number) => {
    const isColorMode = color === 'color';
    const accentBg = isColorMode ? 'bg-amber-100 border-amber-300' : 'bg-slate-100 border-slate-300';
    const headerBg = isColorMode ? 'bg-amber-400' : 'bg-slate-400';

    if (num === 2) {
      return (
        <div className="w-full h-full p-2 flex flex-col gap-1.5 justify-center">
          <div className={`w-full h-full border rounded-sm ${accentBg} p-1.5 flex flex-col gap-1 shadow-xs`}>
            <div className={`h-1.5 ${headerBg} rounded-xs w-2/3`} />
            <div className="space-y-0.5 flex-1">
              <div className="h-1 bg-slate-200 rounded-xs w-full" />
              <div className="h-1 bg-slate-200 rounded-xs w-4/5" />
              <div className="h-1 bg-slate-200 rounded-xs w-full" />
            </div>
            <div className="text-[8px] font-bold text-center text-slate-500">صفحة 1</div>
          </div>
        </div>
      );
    }

    if (num === 4) {
      return (
        <div className="w-full h-full p-1.5 grid grid-cols-2 gap-1 justify-center items-center">
          {[1, 2].map(p => (
            <div key={p} className={`h-full border rounded-xs ${accentBg} p-1 flex flex-col gap-1 shadow-xs`}>
              <div className={`h-1 ${headerBg} rounded-xs w-3/4`} />
              <div className="space-y-0.5 flex-1">
                <div className="h-0.5 bg-slate-200 rounded-xs w-full" />
                <div className="h-0.5 bg-slate-200 rounded-xs w-2/3" />
              </div>
              <div className="text-[7px] font-bold text-center text-slate-600">صفحة {p}</div>
            </div>
          ))}
        </div>
      );
    }

    // num === 8 or default
    return (
      <div className="w-full h-full p-1.5 grid grid-cols-2 grid-rows-2 gap-1 items-center">
        {[1, 2, 3, 4].map(p => (
          <div key={p} className={`h-full border rounded-xs ${accentBg} p-0.5 flex flex-col gap-0.5 shadow-xs`}>
            <div className={`h-0.5 ${headerBg} rounded-xs w-2/3`} />
            <div className="space-y-0.5 flex-1">
              <div className="h-0.5 bg-slate-200 rounded-xs w-full" />
              <div className="h-0.5 bg-slate-200 rounded-xs w-3/4" />
            </div>
            <div className="text-[6px] font-bold text-center text-slate-600">{p}</div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 sm:p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-emerald-100 text-emerald-800 rounded-lg">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-bold text-xs sm:text-sm text-slate-900">معاينة نمط وشكل الطباعة بالورقة</h4>
            <p className="text-[11px] text-slate-500">اختر كيفية توزيع الصفحات على الورقة المطبوعة لتوفير التكلفة</p>
          </div>
        </div>
        {actualSheets && (
          <div className="bg-emerald-800 text-white px-2.5 py-1 rounded-xl text-xs font-bold shadow-xs">
            {doubleSidedPapers} ورقة مطبوعة
          </div>
        )}
      </div>

      {/* Double Sided Printing Toggle Button Section */}
      {interactive && onSelectSides && (
        <div className="bg-emerald-50/80 border border-emerald-200 rounded-xl p-3 space-y-2">
          <label className="block text-xs font-black text-emerald-950 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
            <span>خيار الوجهين (طباعة على وجهين أم وجه واحد):</span>
          </label>
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => onSelectSides('double')}
              className={`py-3 px-4 rounded-xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer border-2 ${
                sides === 'double'
                  ? 'bg-emerald-800 text-amber-300 border-emerald-900 shadow-md ring-2 ring-emerald-600 scale-[1.01]'
                  : 'bg-white text-slate-700 border-slate-300 hover:border-emerald-400 hover:bg-emerald-50'
              }`}
            >
              <span className="text-base">📄🔄</span>
              <span>طباعة على الوجهين (وجهين)</span>
              {sides === 'double' && <CheckCircle2 className="w-4 h-4 text-amber-300 shrink-0" />}
            </button>

            <button
              type="button"
              onClick={() => onSelectSides('single')}
              className={`py-3 px-4 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer border-2 ${
                sides === 'single'
                  ? 'bg-emerald-800 text-amber-300 border-emerald-900 shadow-md ring-2 ring-emerald-600 scale-[1.01]'
                  : 'bg-white text-slate-700 border-slate-300 hover:border-emerald-400 hover:bg-emerald-50'
              }`}
            >
              <span className="text-base">📄</span>
              <span>طباعة وجه واحد</span>
              {sides === 'single' && <CheckCircle2 className="w-4 h-4 text-amber-300 shrink-0" />}
            </button>
          </div>
        </div>
      )}

      {/* Grid of Layout Options (Enlarged Buttons) */}
      {interactive && onSelectPagesPerSheet && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          {ppsOptions.map((opt) => {
            const isSelected = pagesPerSheet === opt.value;
            return (
              <button
                type="button"
                key={opt.value}
                onClick={() => onSelectPagesPerSheet(opt.value)}
                className={`relative flex flex-col items-center justify-between p-3.5 sm:p-4 rounded-2xl border-2 transition-all text-right group cursor-pointer ${
                  isSelected
                    ? 'bg-emerald-50 border-emerald-600 shadow-md ring-2 ring-emerald-600 scale-[1.01]'
                    : 'bg-white border-slate-300 hover:border-emerald-400 hover:bg-slate-50'
                }`}
              >
                {/* Badge */}
                <span className={`absolute -top-2.5 left-3 text-[10px] font-black px-2.5 py-0.5 rounded-full border shadow-xs ${
                  isSelected 
                    ? 'bg-emerald-700 text-amber-300 border-emerald-800'
                    : 'bg-slate-100 text-slate-700 border-slate-300'
                }`}>
                  {opt.badge}
                </span>

                {/* Paper Illustration Container (Enlarged) */}
                <div className="w-full h-32 sm:h-36 my-2 bg-white border-2 border-slate-300 rounded-xl shadow-sm overflow-hidden flex items-center justify-center relative group-hover:scale-[1.03] transition-transform">
                  {renderPaperLayout(opt.value)}
                  {isSelected && (
                    <div className="absolute top-1.5 right-1.5 bg-emerald-700 text-white p-1 rounded-full shadow-md">
                      <CheckCircle2 className="w-4 h-4 text-amber-300" />
                    </div>
                  )}
                </div>

                {/* Text Labels (Enlarged text) */}
                <div className="w-full text-center space-y-0.5">
                  <span className={`block font-black text-sm sm:text-base ${isSelected ? 'text-emerald-950' : 'text-slate-900'}`}>
                    {opt.title}
                  </span>
                  <span className="text-xs text-slate-500 font-bold block">{opt.subtitle}</span>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Visual Paper Live Mock Diagram (Enlarged Model Diagram) */}
      <div className="bg-white border-2 border-slate-200 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-center gap-5 justify-between shadow-sm">
        <div className="flex items-center gap-4">
          {/* Paper mock (Enlarged) */}
          <div className="relative shrink-0">
            {/* Base Paper */}
            <div className="w-32 h-44 sm:w-36 sm:h-48 bg-amber-50/20 border-2 border-slate-400 rounded-xl shadow-lg p-1.5 relative overflow-hidden bg-white">
              {renderPaperLayout(pagesPerSheet)}
            </div>

            {/* If Double Sided, show backing paper offset effect */}
            {sides === 'double' && (
              <div className="absolute -bottom-2 -left-2 w-32 h-44 sm:w-36 sm:h-48 bg-slate-100 border-2 border-emerald-400 rounded-xl -z-10 shadow-md flex items-end justify-start p-1.5">
                <span className="text-[10px] font-black text-emerald-950 bg-emerald-200 px-2 py-0.5 rounded-md border border-emerald-400 shadow-xs">
                  وجه خفي 🔄
                </span>
              </div>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-black text-sm text-slate-900">
                الشكل النموذجي للورقة المطبوعة:
              </span>
              <span className="text-xs font-black text-emerald-900 bg-amber-300 px-2.5 py-0.5 rounded-full border border-amber-400 shadow-xs">
                {pagesPerSheet} {pagesPerSheet === 1 ? 'صفحة' : 'صفحات'} بالورقة
              </span>
            </div>

            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
              تظهر كل ورقة مطبوعة مقسمة بوضوح إلى <strong>{pagesPerSheet}</strong> {pagesPerSheet === 1 ? 'صفحة' : 'صفحات'} بنفس ترتيب مستندك الأصلي مع الوضوح التام.
            </p>

            <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 w-fit">
              <span>نوع الطباعة الحالي:</span>
              <span className="text-emerald-950 font-black">
                {sides === 'double' ? 'وجهين 📄🔄 (مزدوج)' : 'وجه واحد 📄'}
              </span>
            </div>
          </div>
        </div>

        {/* Dynamic calculation summary badge */}
        {pageCount && pageCount > 0 && (
          <div className="bg-emerald-50 border border-emerald-200 p-2.5 rounded-xl text-center shrink-0 w-full sm:w-auto space-y-1">
            <div className="text-[11px] text-slate-600">المستند الأصلي: <strong>{pageCount} صفحة</strong></div>
            <div className="text-xs font-bold text-emerald-950">
              يصبح: <span className="text-amber-700 text-sm font-extrabold">{doubleSidedPapers}</span> ورقة فقط 🖨️
            </div>
            {pagesPerSheet > 1 && (
              <div className="text-[10px] text-emerald-800 font-bold bg-emerald-200/60 px-1.5 py-0.5 rounded">
                توفير {Math.round((1 - (doubleSidedPapers || 1)/pageCount) * 100)}% من الورق!
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
