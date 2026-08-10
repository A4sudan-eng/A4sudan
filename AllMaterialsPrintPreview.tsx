import React from 'react';
import { PrintFileOptions, PrintSides, PrintColor } from '../types';
import { formatSDG } from '../utils/pricing';
import { 
  Layers, FileText, CheckCircle2, Trash2, Plus, Minus, 
  BookOpen, Sparkles, Printer, Copy, RefreshCw, Palette, GraduationCap
} from 'lucide-react';

interface AllMaterialsPrintPreviewProps {
  files: PrintFileOptions[];
  onUpdateFileOption: (fileId: string, updates: Partial<PrintFileOptions>) => void;
  onRemoveFile: (fileId: string) => void;
  isLibraryOrder?: boolean;
  academicPath?: string;
}

export const AllMaterialsPrintPreview: React.FC<AllMaterialsPrintPreviewProps> = ({
  files,
  onUpdateFileOption,
  onRemoveFile,
  isLibraryOrder = false,
  academicPath
}) => {
  if (!files || files.length === 0) return null;

  // Extract shared academic path from notes if not explicitly passed
  const extractedPath = React.useMemo(() => {
    if (academicPath) return academicPath;
    for (const f of files) {
      if (f.notes) {
        const match = f.notes.match(/المسار(?: الأكاديمي)?:?\s*\(([^)]+)\)/);
        if (match && match[1]) return match[1];
      }
    }
    return null;
  }, [files, academicPath]);

  const totalOriginalPages = files.reduce((acc, f) => acc + (f.pageCount * f.copies), 0);
  const totalPrintedSheets = files.reduce((acc, f) => {
    const sheetsPerCopy = Math.ceil(f.pageCount / (f.pagesPerSheet || 1));
    const physicalPapers = Math.ceil(sheetsPerCopy / (f.sides === 'double' ? 2 : 1));
    return acc + (physicalPapers * f.copies);
  }, 0);

  const totalPaperSavedCount = Math.max(0, totalOriginalPages - totalPrintedSheets);
  const savingsPercent = totalOriginalPages > 0 
    ? Math.round((totalPaperSavedCount / totalOriginalPages) * 100) 
    : 0;

  // Mini paper layout renderer
  const renderMiniPaperDiagram = (pps: number, color: PrintColor, sides: PrintSides) => {
    const isColor = color === 'color';
    const accentBg = isColor ? 'bg-amber-100 border-amber-300' : 'bg-slate-100 border-slate-300';
    const headerBg = isColor ? 'bg-amber-500' : 'bg-slate-500';

    if (pps === 2) {
      return (
        <div className="w-16 h-20 bg-white border-2 border-slate-300 rounded shadow-xs p-1 flex flex-col justify-between relative overflow-hidden shrink-0">
          <div className={`w-full h-full border rounded-xs ${accentBg} p-1 flex flex-col gap-0.5`}>
            <div className={`h-1 ${headerBg} rounded-xs w-2/3`} />
            <div className="space-y-0.5 flex-1">
              <div className="h-0.5 bg-slate-300 rounded-xs w-full" />
              <div className="h-0.5 bg-slate-300 rounded-xs w-3/4" />
              <div className="h-0.5 bg-slate-300 rounded-xs w-full" />
            </div>
            <span className="text-[6px] font-bold text-center text-slate-600 block">صفحة 1</span>
          </div>
          {sides === 'double' && (
            <div className="absolute bottom-0.5 left-0.5 bg-emerald-600 text-white text-[6px] font-bold px-1 rounded-xs">
              2:1 🔄
            </div>
          )}
        </div>
      );
    }

    if (pps === 4) {
      return (
        <div className="w-16 h-20 bg-white border-2 border-slate-300 rounded shadow-xs p-1 grid grid-cols-2 gap-0.5 relative overflow-hidden shrink-0">
          {[1, 2].map(p => (
            <div key={p} className={`h-full border rounded-xs ${accentBg} p-0.5 flex flex-col justify-between`}>
              <div className={`h-0.5 ${headerBg} rounded-xs w-full`} />
              <div className="space-y-0.5">
                <div className="h-0.5 bg-slate-300 rounded-xs w-full" />
                <div className="h-0.5 bg-slate-300 rounded-xs w-2/3" />
              </div>
              <span className="text-[5px] font-bold text-center text-slate-600 block">{p}</span>
            </div>
          ))}
          {sides === 'double' && (
            <div className="absolute bottom-0.5 left-0.5 bg-emerald-600 text-white text-[6px] font-bold px-1 rounded-xs">
              4:1 ⭐
            </div>
          )}
        </div>
      );
    }

    // pps === 8
    return (
      <div className="w-16 h-20 bg-white border-2 border-slate-300 rounded shadow-xs p-1 grid grid-cols-2 grid-rows-2 gap-0.5 relative overflow-hidden shrink-0">
        {[1, 2, 3, 4].map(p => (
          <div key={p} className={`h-full border rounded-xs ${accentBg} p-0.5 flex flex-col justify-between`}>
            <div className={`h-0.5 ${headerBg} rounded-xs w-full`} />
            <span className="text-[5px] font-bold text-center text-slate-600 block">{p}</span>
          </div>
        ))}
        {sides === 'double' && (
          <div className="absolute bottom-0.5 left-0.5 bg-emerald-600 text-white text-[5px] font-bold px-0.5 rounded-xs">
            8:1 🔄
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-slate-900 text-white rounded-2xl p-4 sm:p-6 border border-slate-700 shadow-lg space-y-4">
      
      {/* Single Unified Academic Pathway Banner */}
      {extractedPath && (
        <div className="bg-emerald-950/90 border border-emerald-600/70 p-3 rounded-xl flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-1.5 bg-amber-400 text-slate-950 rounded-lg shrink-0">
              <GraduationCap className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] text-emerald-300 font-bold block">المسار الأكاديمي الموحد للطلب:</span>
              <strong className="text-xs sm:text-sm text-white font-extrabold truncate block">
                {extractedPath}
              </strong>
            </div>
          </div>
          <span className="text-[10px] bg-emerald-800 text-emerald-200 border border-emerald-600 px-2 py-0.5 rounded font-bold shrink-0">
            مسار موحد معتمد ✓
          </span>
        </div>
      )}

      {/* Top Header & Master Total Savings */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-amber-500 text-slate-950 rounded-xl font-bold shrink-0 shadow-sm">
            <Printer className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-extrabold text-amber-400 flex items-center gap-2">
              <span>المعاينة الشاملة والمختصرة لنمط طباعة المواد ({files.length})</span>
              <Sparkles className="w-4 h-4 text-amber-300" />
            </h3>
            <p className="text-xs text-slate-300 font-medium mt-0.5">
              استعراض مرئي مكثف ومبسط لكل المواد المطلوبة لشاشة واحدة بدون إطالة المسافات
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-slate-800/90 border border-slate-700 px-3 py-2 rounded-xl text-xs shrink-0 self-start sm:self-auto">
          <div className="text-right">
            <span className="text-slate-400 block text-[10px]">إجمالي الورق المطبوع فعلياً:</span>
            <strong className="text-amber-400 font-mono text-sm font-black">
              {totalPrintedSheets} ورقة
            </strong>
          </div>
          {savingsPercent > 0 && (
            <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[11px] font-extrabold px-2 py-1 rounded-lg">
              توفير {savingsPercent}% 🌱
            </span>
          )}
        </div>
      </div>

      {/* Grid of Materials (Compact Layout for Single or Multiple Items) */}
      <div className={`grid grid-cols-1 ${files.length > 1 ? 'md:grid-cols-2' : 'grid-cols-1'} gap-3.5`}>
        {files.map((file, idx) => {
          const pps = file.pagesPerSheet || 1;
          const calculatedSheets = Math.ceil(file.pageCount / pps);
          const physicalPapers = Math.ceil(calculatedSheets / (file.sides === 'double' ? 2 : 1));

          return (
            <div 
              key={file.id}
              className="bg-slate-800/90 border border-slate-700/80 hover:border-amber-500/50 rounded-xl p-3.5 flex flex-col justify-between gap-3 transition-all relative group"
            >
              {/* Item Top Bar */}
              <div className="flex items-start justify-between gap-2 border-b border-slate-700/60 pb-2.5">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-black flex items-center justify-center shrink-0">
                    {idx + 1}
                  </span>
                  <div className="min-w-0">
                    <h4 className="text-xs sm:text-sm font-bold text-white truncate group-hover:text-amber-300 transition-colors">
                      {file.fileName}
                    </h4>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {file.pageCount} صفحة أصلية ➔ <strong className="text-amber-300">{physicalPapers} ورقة مطبوعة</strong> (لكل نسخة)
                    </span>
                  </div>
                </div>

                {!isLibraryOrder && (
                  <button
                    type="button"
                    onClick={() => onRemoveFile(file.id)}
                    className="text-slate-400 hover:text-rose-400 p-1 rounded-lg transition-colors shrink-0"
                    title="حذف هذه المادة"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Main Content: Mini Diagram + Specs Controls */}
              <div className="flex items-center gap-3">
                
                {/* Visual Paper Layout Mock */}
                {renderMiniPaperDiagram(pps, file.color, file.sides)}

                {/* Quick Interactive Spec Switchers */}
                <div className="flex-1 space-y-2 text-xs">
                  
                  {/* Pages Per Sheet Picker */}
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block mb-1">توزيع الصفحات بالورقة:</span>
                    <div className="flex gap-1.5 flex-wrap">
                      {[
                        { val: 2, label: '2:1 عادي' },
                        { val: 4, label: '4:1 شائع ⭐' },
                        { val: 8, label: '8:1 اسلايت' }
                      ].map(opt => (
                        <button
                          type="button"
                          key={opt.val}
                          onClick={() => onUpdateFileOption(file.id, { pagesPerSheet: opt.val })}
                          className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-all border ${
                            pps === opt.val
                              ? 'bg-amber-500 text-slate-950 border-amber-400 font-black shadow-xs'
                              : 'bg-slate-700/80 text-slate-300 border-slate-600 hover:bg-slate-700'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Fixed Printing Specifications (Double-sided Guaranteed) */}
                  <div className="flex items-center gap-2 flex-wrap text-[11px]">
                    <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-1 rounded-lg font-bold flex items-center gap-1">
                      <RefreshCw className="w-3 h-3 text-emerald-400" />
                      <span>طباعة وجهين معتمدة 🔄</span>
                    </span>
                  </div>

                  {/* Copies Counter */}
                  <div className="flex items-center justify-between pt-1 border-t border-slate-700/60">
                    <div className="flex items-center gap-1 text-[11px] text-slate-300 font-bold">
                      <span>النسخ:</span>
                      <div className="flex items-center gap-1 bg-slate-900 px-1.5 py-0.5 rounded-lg border border-slate-700">
                        <button
                          type="button"
                          onClick={() => onUpdateFileOption(file.id, { copies: Math.max(1, file.copies - 1) })}
                          className="text-slate-400 hover:text-white p-0.5"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="font-mono text-amber-400 font-bold px-1.5">{file.copies}</span>
                        <button
                          type="button"
                          onClick={() => onUpdateFileOption(file.id, { copies: file.copies + 1 })}
                          className="text-slate-400 hover:text-white p-0.5"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block">السعر المستحق:</span>
                      <strong className="text-amber-400 font-mono text-xs font-bold">
                        {formatSDG(file.calculatedPrice)}
                      </strong>
                    </div>
                  </div>

                </div>

              </div>
            </div>
          );
        })}
      </div>

      {/* Footer Info Ribbon */}
      <div className="bg-slate-800/80 border border-slate-700 p-2.5 rounded-xl text-xs text-slate-300 flex items-center justify-between gap-2 flex-wrap font-medium">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-amber-400 shrink-0" />
          <span>تطبق إعدادات التوزيع والطباعة المحددة أعلاه تلقائياً على كل الشيتات والمستندات قبل الطباعة والتغليف.</span>
        </div>
        <span className="text-emerald-400 font-bold text-[11px] bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-700/60">
          معاينة مطابقة للنسخ الورقية 100% ✓
        </span>
      </div>

    </div>
  );
};
