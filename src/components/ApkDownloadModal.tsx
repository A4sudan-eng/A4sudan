import React, { useEffect, useState } from 'react';
import { Download, Smartphone, CheckCircle2, ShieldCheck, ArrowRight, ExternalLink, Sparkles, X, Share2, Copy, Check, Info, PlusSquare, AlertTriangle, Layers } from 'lucide-react';
import logoImg from '../assets/images/a4_sudan_green_logo_1785943554845.jpg';

interface ApkDownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  deferredPrompt?: any;
  setDeferredPrompt?: (prompt: any) => void;
}

export const ApkDownloadModal: React.FC<ApkDownloadModalProps> = ({
  isOpen,
  onClose,
  deferredPrompt,
  setDeferredPrompt
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [isInstalledPwa, setIsInstalledPwa] = useState(false);
  const [customApkUrl, setCustomApkUrl] = useState<string>('');
  const [showManualGuide, setShowManualGuide] = useState(false);

  useEffect(() => {
    // Read custom compiled APK link from LocalStorage if set by Admin
    const savedUrl = localStorage.getItem('a4_custom_apk_url') || '';
    setCustomApkUrl(savedUrl);

    if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone) {
      setIsInstalledPwa(true);
    }
  }, []);

  // Trigger Native PWA Chrome One-Tap Installation
  const handleInstallPWA = async () => {
    if (deferredPrompt) {
      try {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
          setIsInstalledPwa(true);
        }
        if (setDeferredPrompt) setDeferredPrompt(null);
      } catch (e) {
        setShowManualGuide(true);
      }
    } else {
      setShowManualGuide(true);
    }
  };

  const handleDownloadApkFile = () => {
    if (customApkUrl) {
      window.open(customApkUrl, '_blank');
    } else {
      // Direct server route or PWABuilder fallback
      const link = document.createElement('a');
      link.href = '/api/download-apk';
      link.download = 'A4_Sudan_Printing_v2.4.apk';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const copyShareLink = () => {
    const url = `${window.location.origin}?download_apk=true`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 dir-rtl animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl border border-emerald-200 max-w-lg w-full overflow-hidden relative transform transition-all max-h-[92vh] flex flex-col">
        
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-emerald-900 text-white p-5 relative overflow-hidden shrink-0">
          <button
            onClick={onClose}
            className="absolute top-4 left-4 bg-emerald-800/80 hover:bg-emerald-700 text-white p-2 rounded-full transition-colors cursor-pointer"
            title="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-4 dir-rtl">
            <img
              src={logoImg}
              alt="A4 Sudan App"
              referrerPolicy="no-referrer"
              className="w-14 h-14 rounded-2xl object-cover border-2 border-amber-400 shadow-xl shrink-0"
            />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-extrabold text-white">تثبيت تطبيق مكتبة A4 السودان</h3>
                <span className="bg-amber-400 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-full">
                  Android & Chrome
                </span>
              </div>
              <p className="text-xs text-emerald-200 mt-0.5">
                تثبيت مباشر وسريع كـ تطبيق أندرويد على الشاشة الرئيسية
              </p>
            </div>
          </div>
        </div>

        {/* Content Body - Scrollable */}
        <div className="p-5 space-y-5 overflow-y-auto">

          {/* Alert Notice regarding "Parse Package Error" */}
          <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-4 text-xs space-y-2 text-amber-950">
            <div className="flex items-center gap-2 font-black text-amber-900 text-sm">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
              <span>حل مشكلة "حدثت مشكلة أثناء تحليل الحزمة":</span>
            </div>
            <p className="text-xs leading-relaxed text-amber-900 font-medium">
              تظهر هذه الرسالة في أندرويد لأن المتصفح يتطلب تثبيت التطبيقات عبر <strong>"ميزة التطبيقات المثبتة PWA"</strong> المعتمَدة رسمياً من قوقل كروم لمنع تنزيل الملفات الضارة.
            </p>
          </div>

          {/* METHOD 1: One-Tap Native Chrome WebAPK Install */}
          <div className="bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 rounded-2xl p-4 text-slate-950 shadow-xl border-2 border-amber-400 flex flex-col gap-3">
            <div className="flex items-start gap-3">
              <div className="bg-slate-950 text-amber-400 p-2.5 rounded-2xl shrink-0 mt-0.5 shadow-md">
                <Smartphone className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h4 className="font-black text-sm text-slate-950">
                  {isInstalledPwa ? 'التطبيق مثبت بالفعل على جهازك! 🎉' : 'الحل الأضمن 100%: تثبيت التطبيق بنقرة واحدة'}
                </h4>
                <p className="text-xs font-bold text-slate-900 leading-relaxed">
                  يقوم متصفح كروم بتثبيت تطبيق A4 السودان بآيقونته الرسمية على شاشة الجوال فوراً بدون تنزيل ملفات وبدون أي أخطاء!
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleInstallPWA}
              className="w-full bg-slate-950 hover:bg-slate-900 active:scale-95 text-amber-300 font-black py-3.5 px-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 text-sm cursor-pointer border border-amber-400/40"
            >
              <PlusSquare className="w-5 h-5 text-amber-300" />
              <span>{deferredPrompt ? 'تثبيت التطبيق الآن على الجوال' : 'اضغط هنا لتثبيت التطبيق على الجوال'}</span>
            </button>
          </div>

          {/* Step-by-step Visual Manual Guide for Chrome */}
          {(showManualGuide || !deferredPrompt) && (
            <div className="bg-emerald-950 text-white rounded-2xl p-4 space-y-3 border border-emerald-800 animate-fadeIn">
              <div className="flex items-center gap-2 text-amber-300 font-extrabold text-xs">
                <Info className="w-4 h-4 text-amber-300 shrink-0" />
                <span>طريقة التثبيت اليدوية البسيطة في متصفح قوقل كروم (Chrome):</span>
              </div>

              <div className="space-y-2 text-xs font-medium text-emerald-100">
                <div className="flex items-center gap-3 bg-emerald-900/80 p-2.5 rounded-xl border border-emerald-700">
                  <span className="bg-amber-400 text-slate-950 font-black w-6 h-6 rounded-full flex items-center justify-center text-xs shrink-0">1</span>
                  <span>اضغط على زر القائمة <strong>(الثلاث نقاط ⋮)</strong> في أعلى يسار المتصفح.</span>
                </div>

                <div className="flex items-center gap-3 bg-emerald-900/80 p-2.5 rounded-xl border border-emerald-700">
                  <span className="bg-amber-400 text-slate-950 font-black w-6 h-6 rounded-full flex items-center justify-center text-xs shrink-0">2</span>
                  <span>اختر <strong>"التثبيت على الشاشة الرئيسية"</strong> أو <strong>"إضافة إلى الشاشة الرئيسية"</strong>.</span>
                </div>

                <div className="flex items-center gap-3 bg-emerald-900/80 p-2.5 rounded-xl border border-emerald-700">
                  <span className="bg-amber-400 text-slate-950 font-black w-6 h-6 rounded-full flex items-center justify-center text-xs shrink-0">3</span>
                  <span>تأكيد الضغط على <strong>"تثبيت" (Install)</strong>، وسيظهر آيقونة التطبيق فوراً على شاشة هاتفك!</span>
                </div>
              </div>
            </div>
          )}

          {/* METHOD 2: Custom APK Link or Direct Download */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                <Download className="w-4 h-4 text-emerald-700" />
                <span>تحميل ملف APK المباشر</span>
              </span>
              <span className="text-[10px] bg-emerald-100 text-emerald-900 font-bold px-2 py-0.5 rounded-md">
                {customApkUrl ? 'رابط خارجي مباشر' : 'v2.4'}
              </span>
            </div>

            <p className="text-[11px] text-slate-600 leading-relaxed font-medium">
              {customApkUrl
                ? 'يتوفر رابط تنزيل مباشر مجمع لملف APK من خادم المكتبة.'
                : 'تنزيل حزمة الملف المباشرة أو نسخ رابط المشاركة لفتح التطبيق في متصفح الجوال.'}
            </p>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleDownloadApkFile}
                className="flex-1 bg-emerald-800 hover:bg-emerald-900 text-white font-bold py-2.5 px-4 rounded-xl text-xs shadow flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-amber-300" />
                <span>تحميل ملف APK</span>
              </button>

              <button
                type="button"
                onClick={copyShareLink}
                className="bg-slate-800 hover:bg-slate-700 text-white font-bold px-3 py-2.5 rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5 text-amber-300" />}
                <span>{copiedLink ? 'تم النسخ!' : 'مشاركة الرابط'}</span>
              </button>
            </div>
          </div>

          {/* Footer Action */}
          <div className="pt-1 flex justify-end border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold px-6 py-2 rounded-xl text-xs transition-colors cursor-pointer"
            >
              إغلاق
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};
