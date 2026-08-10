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

      {/* Grid of Layout Options */}
      {interactive && onSelectPagesPerSheet && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {ppsOptions.map((opt) => {
            const isSelected = pagesPerSheet === opt.value;
            return (
              <button
                type="button"
                key={opt.value}
                onClick={() => onSelectPagesPerSheet(opt.value)}
                className={`relative flex flex-col items-center justify-between p-2.5 rounded-xl border-2 transition-all text-right group ${
                  isSelected
                    ? 'bg-emerald-50/90 border-emerald-600 shadow-sm ring-1 ring-emerald-600'
                    : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-100/50'
                }`}
              >
                {/* Badge */}
                <span className={`absolute -top-2 left-2 text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${
                  isSelected 
                    ? 'bg-emerald-600 text-white border-emerald-700'
                    : 'bg-slate-100 text-slate-600 border-slate-200'
                }`}>
                  {opt.badge}
                </span>

                {/* Paper Illustration Container */}
                <div className="w-full h-24 my-1.5 bg-white border border-slate-300 rounded-lg shadow-xs overflow-hidden flex items-center justify-center relative group-hover:scale-[1.02] transition-transform">
                  {renderPaperLayout(opt.value)}
                  {isSelected && (
                    <div className="absolute top-1 right-1 bg-emerald-600 text-white p-0.5 rounded-full shadow">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </div>
                  )}
                </div>

                {/* Text Labels */}
                <div className="w-full text-center">
                  <span className={`block font-bold text-xs ${isSelected ? 'text-emerald-950' : 'text-slate-800'}`}>
                    {opt.title}
                  </span>
                  <span className="text-[10px] text-slate-500 block">{opt.subtitle}</span>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Visual Paper Live Mock Diagram */}
      <div className="bg-white border border-slate-200 rounded-xl p-3 flex flex-col sm:flex-row items-center gap-4 justify-between">
        <div className="flex items-center gap-3">
          {/* Paper mock */}
          <div className="relative shrink-0">
            {/* Base Paper */}
            <div className="w-24 h-32 bg-amber-50/20 border-2 border-slate-400 rounded-md shadow-md p-1 relative overflow-hidden bg-white">
              {renderPaperLayout(pagesPerSheet)}
            </div>

            {/* If Double Sided, show backing paper offset effect */}
            {sides === 'double' && (
              <div className="absolute -bottom-1.5 -left-1.5 w-24 h-32 bg-slate-50 border border-slate-300 rounded-md -z-10 shadow-xs flex items-end justify-start p-1">
                <span className="text-[8px] font-bold text-emerald-800 bg-emerald-100 px-1 rounded border border-emerald-300">
                  وجه خفي 🔄
                </span>
              </div>
            )}
          </div>

          {/* Description */}
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-bold text-xs text-slate-900">
                الشكل النهائي للورقة المطبوعة:
              </span>
              <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300">
                {pagesPerSheet} {pagesPerSheet === 1 ? 'صفحة' : 'صفحات'} في الورقة
              </span>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              تظهر كل ورقة مطبوعة مقسمة بوضوح إلى <strong>{pagesPerSheet}</strong> {pagesPerSheet === 1 ? 'صفحة' : 'صفحات'} بنفس ترتيب مستندك الأصلي.
            </p>
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
