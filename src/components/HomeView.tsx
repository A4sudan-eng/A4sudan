import React from 'react';
import { 
  FileText, 
  Search, 
  Printer, 
  GraduationCap, 
  Truck, 
  Clock, 
  ShieldCheck, 
  BookOpen, 
  Sparkles, 
  ArrowLeft, 
  Phone, 
  CheckCircle2 
} from 'lucide-react';
import { motion } from 'motion/react';
import neelainLogo from '../assets/images/neelain_exact_logo_1785951359550.jpg';

interface HomeViewProps {
  onNavigateToSheets: () => void;
  onNavigateToTrack: () => void;
  onNavigateToCustomPrint?: () => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  onNavigateToSheets,
  onNavigateToTrack,
  onNavigateToCustomPrint
}) => {
  return (
    <div className="space-y-8 sm:space-y-12 pb-12">
      {/* Hero Welcome Banner */}
      <motion.section 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative bg-gradient-to-br from-emerald-950 via-emerald-900 to-emerald-950 text-white rounded-3xl p-6 sm:p-10 shadow-xl overflow-hidden border border-emerald-700/60"
      >
        {/* Background Decorative Element */}
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-800/80 border border-emerald-600/60 text-amber-300 text-xs sm:text-sm font-extrabold shadow-sm">
            <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
            <span>منصة الخدمات الطلابية الشاملة والطباعة الشيتات</span>
          </div>

          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black text-white leading-tight">
            أهلاً بك في <span className="text-amber-400">A4 SUDAN</span>
            <br />
            مكتبتك الإلكترونية لجميع الشيتات والمذكرات
          </h1>

          <p className="text-sm sm:text-base text-emerald-100/90 leading-relaxed font-medium">
            تصفّح شيتات ومذكرات جميع المستويات والتخصصات بالجامعات السودانية، واطلب طباعتها وتوصيلها مباشرة إلى بابك بكل يسر وسرعة.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              onClick={onNavigateToSheets}
              className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-black px-6 py-3.5 rounded-2xl text-sm sm:text-base inline-flex items-center gap-2 transition-all shadow-lg hover:shadow-amber-400/20 active:scale-[0.98] cursor-pointer"
            >
              <BookOpen className="w-5 h-5" />
              <span>دخول مكتبة الشيتات والمذكرات</span>
              <ArrowLeft className="w-4 h-4" />
            </button>

            <button
              onClick={onNavigateToTrack}
              className="bg-emerald-800/90 hover:bg-emerald-700 text-white font-bold px-5 py-3.5 rounded-2xl text-sm sm:text-base inline-flex items-center gap-2 transition-all border border-emerald-600/70 cursor-pointer"
            >
              <Search className="w-5 h-5 text-amber-300" />
              <span>تتبع حالة طلبك</span>
            </button>
          </div>
        </div>
      </motion.section>

      {/* Main Feature Cards Grid */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
        {/* Card 1: Sheets Library */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          onClick={onNavigateToSheets}
          className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm hover:shadow-md hover:border-emerald-500 transition-all cursor-pointer group flex flex-col justify-between space-y-6"
        >
          <div className="space-y-4">
            <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-800 font-black group-hover:bg-emerald-900 group-hover:text-amber-300 transition-colors">
              <FileText className="w-7 h-7" />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 group-hover:text-emerald-800 transition-colors">
                  مكتبة الشيتات والمذكرات
                </h2>
                <span className="bg-emerald-100 text-emerald-900 text-xs font-bold px-2.5 py-1 rounded-full">
                  شاملة ومحدثة
                </span>
              </div>
              <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
                تصفح الشيتات والمذكرات الدراسية مرتبة حسب الجامعة، الكلية، القسم، المستوى، والفصل الدراسي بكل يسر.
              </p>
            </div>

            {/* University Tag Preview */}
            <div className="pt-2 flex items-center gap-2 border-t border-slate-100">
              <div className="w-7 h-7 rounded-lg overflow-hidden border border-slate-200 shrink-0">
                <img src={neelainLogo} alt="جامعة النيلين" className="w-full h-full object-contain" />
              </div>
              <span className="text-xs font-extrabold text-slate-700">
                جامعة النيلين • كلية التجارة (المحاسبة، إدارة الأعمال، التأمين)
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs sm:text-sm font-black text-emerald-800 group-hover:translate-x-[-4px] transition-transform">
            <span>تصفح الشيتات الآن</span>
            <ArrowLeft className="w-4 h-4" />
          </div>
        </motion.div>

        {/* Card 2: Order Tracker */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          onClick={onNavigateToTrack}
          className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm hover:shadow-md hover:border-amber-400 transition-all cursor-pointer group flex flex-col justify-between space-y-6"
        >
          <div className="space-y-4">
            <div className="w-14 h-14 bg-amber-100 rounded-2xl flex items-center justify-center text-amber-800 font-black group-hover:bg-amber-400 group-hover:text-slate-950 transition-colors">
              <Search className="w-7 h-7" />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 group-hover:text-amber-800 transition-colors">
                  متابعة وتتبع الطلب
                </h2>
                <span className="bg-amber-100 text-amber-900 text-xs font-bold px-2.5 py-1 rounded-full">
                  تحديث مباشر
                </span>
              </div>
              <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
                تابع سريان طباعة وتغليف وتوصيل طلبك لحظة بلحظة باستخدام رقم الطلب أو رقم الهاتف.
              </p>
            </div>

            <div className="pt-2 flex items-center gap-3 border-t border-slate-100 text-xs text-slate-500 font-medium">
              <div className="flex items-center gap-1 text-emerald-700 font-bold">
                <CheckCircle2 className="w-4 h-4" />
                <span>إشعارات بالحالة</span>
              </div>
              <div className="flex items-center gap-1 text-emerald-700 font-bold">
                <CheckCircle2 className="w-4 h-4" />
                <span>تحديث الفاتورة وسندات الدفع</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs sm:text-sm font-black text-amber-800 group-hover:translate-x-[-4px] transition-transform">
            <span>تتبع طلبي الآن</span>
            <ArrowLeft className="w-4 h-4" />
          </div>
        </motion.div>
      </section>

      {/* Why Choose A4 SUDAN Section */}
      <section className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
        <div className="text-center max-w-xl mx-auto space-y-2">
          <h2 className="text-xl sm:text-2xl font-black text-slate-900">
            لماذا يختار الطلاب منصة A4 SUDAN؟
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            نوفر لك تجربة طباعة جامعية متكاملة وموثوقة بجودة عالية وأسعار مناسبة
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 space-y-2">
            <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-800 font-bold">
              <Printer className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-black text-slate-900">طباعة واضحة فاخرة</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              ورق A4 ممتاز مع خيارات التغليف الحلزوني البلاستيكي وحماية مستنداتك.
            </p>
          </div>

          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 space-y-2">
            <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-800 font-bold">
              <Truck className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-black text-slate-900">توصيل سريع وسهل</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              توصيل لجميع المدن: الخرطوم، أم درمان، بحري، بورتسودان، وود مدني.
            </p>
          </div>

          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 space-y-2">
            <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-800 font-bold">
              <Clock className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-black text-slate-900">توفير الوقت والجهد</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              احصل على شيتاتك ومذكراتك بنقرة زر دون الحاجة للانتظار في المكتبات.
            </p>
          </div>

          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 space-y-2">
            <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-800 font-bold">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-black text-slate-900">دفع آمن ومضمون</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              دفع عبر بنكك (Bankak) وسندات معتمدة وفحص تلقائي للإيصالات.
            </p>
          </div>
        </div>
      </section>

      {/* Support Banner */}
      <div className="bg-gradient-to-r from-emerald-900 to-emerald-800 text-white rounded-2xl p-5 sm:p-6 shadow-sm border border-emerald-700 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 text-center sm:text-right">
          <div className="w-12 h-12 bg-emerald-800 rounded-xl flex items-center justify-center text-amber-300 shrink-0 border border-emerald-600">
            <Phone className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-black text-white">هل تحتاج مساعدة أو استفسار؟</h3>
            <p className="text-xs text-emerald-200/90">تواصل مع فريق الدعم الفني والمكتبة مباشرة عبر الهواتف المعتمدة</p>
          </div>
        </div>

        <a 
          href="tel:0119636365"
          className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-black px-5 py-2.5 rounded-xl text-xs sm:text-sm whitespace-nowrap transition-colors shadow-sm"
        >
          اتصل بنا: 0119636365
        </a>
      </div>
    </div>
  );
};
