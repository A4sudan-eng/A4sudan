import React from 'react';
import { PrintFileOptions } from '../types';
import { formatSDG } from '../utils/pricing';
import { 
  Trash2, Plus, Minus, BookOpen, GraduationCap, CheckCircle2
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

  const totalSheetsPrice = files.reduce((acc, f) => acc + (f.calculatedPrice || 0), 0);

  return (
    <div className="bg-slate-900 text-white rounded-2xl p-4 sm:p-5 border border-slate-700 shadow-lg space-y-4">
      
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

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-600 text-white rounded-xl font-bold shrink-0 shadow-sm">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-extrabold text-amber-400 flex items-center gap-2">
              <span>تفاصيل الشيتات ({files.length})</span>
            </h3>
            <p className="text-xs text-slate-300 font-medium mt-0.5">
              قائمة الشيتات والمواد المطلوبة مع الأسعار المعتمدة
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-slate-800/90 border border-slate-700 px-3 py-2 rounded-xl text-xs shrink-0 self-start sm:self-auto">
          <div className="text-right">
            <span className="text-slate-400 block text-[10px]">إجمالي قيمة الشيتات:</span>
            <strong className="text-amber-400 font-mono text-sm font-black">
              {formatSDG(totalSheetsPrice)}
            </strong>
          </div>
        </div>
      </div>

      {/* Grid / List of Sheets */}
      <div className={`grid grid-cols-1 ${files.length > 1 ? 'md:grid-cols-2' : 'grid-cols-1'} gap-3`}>
        {files.map((file, idx) => (
          <div 
            key={file.id}
            className="bg-slate-800/90 border border-slate-700/80 hover:border-emerald-500/50 rounded-xl p-3.5 flex flex-col justify-between gap-2.5 transition-all relative group"
          >
            {/* Sheet Title & Delete button */}
            <div className="flex items-start justify-between gap-2 border-b border-slate-700/60 pb-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-black flex items-center justify-center shrink-0">
                  {idx + 1}
                </span>
                <h4 className="text-xs sm:text-sm font-bold text-white truncate group-hover:text-emerald-300 transition-colors" title={file.fileName}>
                  {file.fileName}
                </h4>
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

            {/* Price & Copies Controls */}
            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-1.5 text-xs text-slate-300 font-bold">
                <span>النسخ:</span>
                <div className="flex items-center gap-1 bg-slate-900 px-2 py-0.5 rounded-lg border border-slate-700">
                  <button
                    type="button"
                    onClick={() => onUpdateFileOption(file.id, { copies: Math.max(1, file.copies - 1) })}
                    className="text-slate-400 hover:text-white p-0.5 transition-colors"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="font-mono text-amber-400 font-black px-1.5">{file.copies}</span>
                  <button
                    type="button"
                    onClick={() => onUpdateFileOption(file.id, { copies: file.copies + 1 })}
                    className="text-slate-400 hover:text-white p-0.5 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="bg-emerald-950/80 border border-emerald-700/80 px-2.5 py-1 rounded-lg text-right">
                <span className="text-[10px] text-emerald-300 block font-bold">السعر:</span>
                <strong className="text-amber-300 font-mono text-xs font-black">
                  {formatSDG(file.calculatedPrice)}
                </strong>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Clean Bottom Ribbon */}
      <div className="bg-slate-800/80 border border-slate-700 p-2.5 rounded-xl text-xs text-slate-300 flex items-center justify-between gap-2 flex-wrap font-medium">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>الشيتات والمذكرات جاهزة للطباعة والتسليم المباشر فور إتمام الطلب.</span>
        </div>
      </div>

    </div>
  );
};
