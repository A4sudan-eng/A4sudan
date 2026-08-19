import React, { useState, useEffect } from 'react';
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
  CheckCircle2,
  Flame,
  MessageCircle,
  Zap,
  Tag,
  Gift,
  ChevronLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import neelainLogo from '../assets/images/neelain_exact_logo_1785951359550.jpg';
import { PricingRates } from '../types';

interface HomeViewProps {
  rates?: PricingRates;
  onNavigateToSheets: () => void;
  onNavigateToTrack: () => void;
  onNavigateToCustomPrint?: () => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  rates,
  onNavigateToSheets,
  onNavigateToTrack,
  onNavigateToCustomPrint
}) => {
  const [localPromoPrice, setLocalPromoPrice] = useState<number>(() => {
    if (rates?.promoPaperPrice !== undefined) return rates.promoPaperPrice;
    try {
      const raw = localStorage.getItem('a4_pricing_rates');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed.promoPaperPrice === 'number') {
          return parsed.promoPaperPrice;
        }
      }
    } catch (e) {}
    return 99;
  });

  useEffect(() => {
    if (rates?.promoPaperPrice !== undefined) {
      setLocalPromoPrice(rates.promoPaperPrice);
    }
  }, [rates?.promoPaperPrice]);

  useEffect(() => {
    const handleRatesUpdated = (e: any) => {
      if (e?.detail && typeof e.detail.promoPaperPrice === 'number') {
        setLocalPromoPrice(e.detail.promoPaperPrice);
      }
    };
    window.addEventListener('a4_pricing_rates_updated', handleRatesUpdated);
    return () => {
      window.removeEventListener('a4_pricing_rates_updated', handleRatesUpdated);
    };
  }, []);

  const promoPrice = localPromoPrice;
  const whatsappNumber = '0119636365';
  const whatsappUrl = `https://wa.me/249119636365?text=${encodeURIComponent(
    `السلام عليكم A4 SUDAN، أرغب في الاستفادة من عرض طباعة الورقة بـ ${promoPrice} ج.س للشيتات والمذكرات الجامعية.`
  )}`;

  // Rotating Promo Banner State
  const [activePromoIndex, setActivePromoIndex] = useState(0);

  const promoOffers = [
    {
      id: 1,
      badge: '🔥 عرض حصري',
      title: `اطبع الورقة بـ ${promoPrice}ج في A4 SUDAN`,
      subtitle: 'أعلى جودة طباعة ليزرية للمذكرات والشيتات بأقل سعر في السودان',
      highlight: `${promoPrice} ج.س`,
      actionText: 'اطلب العرض عبر واتساب',
    },
    {
      id: 2,
      badge: '⚡ تخفيض خاص',
      title: `عرض خاص: الورقة بـ ${promoPrice} ج`,
      subtitle: 'توفير حقيقي لجميع طلاب الجامعات السودانية مع التوصيل السريع',
      highlight: `فقط ${promoPrice} ج`,
      actionText: 'تواصل مباشرة 0119636365',
    },
    {
      id: 3,
      badge: '🎓 للجامعات السودانية',
      title: `شيتات ومذكرات كاملة بسعر ${promoPrice}ج للورقة`,
      subtitle: 'تغليف سلك متين وتوصيل لبابك في الخرطوم، أمدرمان، بحري والولايات',
      highlight: `${promoPrice} ج.س / ورقة`,
      actionText: 'احجز طباعة شيتاتك الآن',
    },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setActivePromoIndex(prev => (prev + 1) % promoOffers.length);
    }, 3800);
    return () => clearInterval(timer);
  }, [promoOffers.length]);

  return (
    <div className="space-y-6 sm:space-y-10 pb-16">
      {/* 1. TOP ANIMATED ROTATING PROMO TICKER BANNER */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-slate-950 p-3 sm:p-4 shadow-lg border-2 border-amber-300">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Animated Text Content */}
          <div className="flex items-center gap-3 w-full sm:w-auto overflow-hidden">
            <span className="flex items-center justify-center w-8 h-8 rounded-xl bg-slate-950 text-amber-400 shrink-0 font-black shadow-inner animate-bounce">
              <Flame className="w-5 h-5 text-amber-400 fill-amber-400" />
            </span>

            <div className="relative h-7 sm:h-8 flex-1 overflow-hidden min-w-[240px] sm:min-w-[340px]">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activePromoIndex}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -20, opacity: 0 }}
                  transition={{ duration: 0.4, ease: 'easeOut' }}
                  className="absolute inset-0 flex items-center gap-2"
                >
                  <span className="bg-slate-950 text-amber-300 text-[11px] sm:text-xs font-black px-2 py-0.5 rounded-md shrink-0">
                    {promoOffers[activePromoIndex].badge}
                  </span>
                  <p className="text-xs sm:text-sm font-black text-slate-950 truncate">
                    {promoOffers[activePromoIndex].title}
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* Direct WhatsApp Call to Action Button */}
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto shrink-0 bg-slate-950 hover:bg-slate-900 text-amber-300 hover:text-amber-200 text-xs sm:text-sm font-black px-4 py-2 rounded-xl flex items-center justify-center gap-2 shadow-md transition-transform hover:scale-105 active:scale-95"
          >
            <MessageCircle className="w-4 h-4 text-emerald-400 fill-emerald-400" />
            <span>واتساب: {whatsappNumber}</span>
            <ChevronLeft className="w-4 h-4" />
          </a>
        </div>
      </div>

      {/* 2. HERO WELCOME BANNER WITH DYNAMIC PROMO INTEGRATION */}
      <motion.section 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative bg-gradient-to-br from-emerald-950 via-emerald-900 to-emerald-950 text-white rounded-3xl p-6 sm:p-10 shadow-xl overflow-hidden border border-emerald-700/60"
      >
        {/* Background Decorative Elements */}
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Left Column: Heading and CTAs */}
          <div className="lg:col-span-8 space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-800/80 border border-emerald-600/60 text-amber-300 text-xs sm:text-sm font-extrabold shadow-sm">
              <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
              <span>منصة الخدمات الطلابية الشاملة والطباعة الشيتات</span>
            </div>

            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black text-white leading-tight">
              أهلاً بك في <span className="text-amber-400">A4 SUDAN</span>
              <br />
              مكتبتك الإلكترونية لجميع الشيتات والمذكرات
            </h1>

            <p className="text-sm sm:text-base text-emerald-100/90 leading-relaxed font-medium max-w-2xl">
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

            {/* Social Media Follow Quick Links in Hero */}
            <div className="pt-3 border-t border-emerald-800/60 flex flex-wrap items-center gap-2.5 text-xs">
              <span className="text-emerald-200 font-bold text-[11px] sm:text-xs">تابعنا على:</span>
              
              {/* Facebook Pill */}
              <a
                href="https://www.facebook.com/A4SUDAN"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 bg-[#1877F2] hover:bg-[#166fe5] text-white font-bold px-3 py-1.5 rounded-xl transition-transform hover:scale-105 shadow-sm text-xs"
                title="متابعة صفحة فيسبوك A4SUDAN"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
                <span>فيسبوك (A4SUDAN)</span>
              </a>

              {/* TikTok Pill */}
              <a
                href="https://www.tiktok.com/@A4SUDAN"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 bg-slate-950 hover:bg-black text-white font-bold px-3 py-1.5 rounded-xl border border-slate-700 transition-transform hover:scale-105 shadow-sm text-xs"
                title="متابعة حساب تيك توك A4SUDAN"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
                  <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
                </svg>
                <span>تيك توك (A4SUDAN)</span>
              </a>
            </div>
          </div>

          {/* Right Column: Animated Interactive Offer Card */}
          <div className="lg:col-span-4">
            <motion.a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              className="block relative bg-gradient-to-b from-slate-900/95 to-emerald-950/95 border-2 border-amber-400/80 rounded-3xl p-5 shadow-2xl backdrop-blur-sm overflow-hidden group cursor-pointer"
            >
              {/* Glowing Corner Badge */}
              <div className="absolute top-0 left-0 bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 text-[11px] font-black px-3 py-1 rounded-br-2xl shadow-md">
                عرض خاص مفعّل 🚀
              </div>

              <div className="pt-3 text-center space-y-3">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-amber-400/20 border border-amber-400/40 text-amber-300">
                  <Zap className="w-6 h-6 animate-pulse" />
                </div>

                <div className="space-y-1">
                  <span className="text-xs text-amber-300 font-extrabold block">
                    عرض منصة A4 SUDAN الذهبي
                  </span>
                  <div className="text-3xl sm:text-4xl font-black text-white font-mono tracking-tight flex items-center justify-center gap-1">
                    <span className="text-amber-400">{promoPrice}</span>
                    <span className="text-sm text-slate-300 font-sans font-bold">ج.س / ورقة</span>
                  </div>
                </div>

                {/* Alternating Headline in Box */}
                <div className="bg-slate-950/60 rounded-xl p-2.5 border border-emerald-700/40 min-h-[50px] flex items-center justify-center">
                  <AnimatePresence mode="wait">
                    <motion.p
                      key={activePromoIndex}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 1.05 }}
                      transition={{ duration: 0.3 }}
                      className="text-xs font-black text-emerald-200"
                    >
                      {promoOffers[activePromoIndex].title}
                    </motion.p>
                  </AnimatePresence>
                </div>

                <div className="bg-emerald-600 hover:bg-emerald-500 text-white font-black py-2.5 px-4 rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg group-hover:shadow-emerald-500/30 transition-all">
                  <MessageCircle className="w-4 h-4 fill-white" />
                  <span>اطلب الآن عبر واتساب ({whatsappNumber})</span>
                </div>
              </div>
            </motion.a>
          </div>
        </div>
      </motion.section>

      {/* 3. MAIN FEATURE CARDS GRID */}
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

      {/* 3.5. FOLLOW OUR OFFICIAL SOCIAL MEDIA PAGES */}
      <motion.section
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="bg-gradient-to-br from-slate-900 via-slate-950 to-emerald-950 text-white rounded-3xl p-6 sm:p-8 border border-emerald-800/50 shadow-xl relative overflow-hidden"
      >
        {/* Subtle Background Glows */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-rose-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-6">
          {/* Header */}
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-800/60 border border-emerald-600/60 text-amber-300 text-xs font-bold shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
              <span>مجتمع منصة A4 SUDAN الرسمي</span>
            </div>
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-white">
              تابع صفحاتنا على <span className="text-[#1877F2]">فيسبوك</span> و <span className="text-pink-400">تيك توك</span>
            </h2>
            <p className="text-xs sm:text-sm text-emerald-100/80 leading-relaxed font-medium">
              انضم إلينا باليوزر <span className="font-mono text-amber-300 font-extrabold px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700">@A4SUDAN</span> لمتابعة أحدث الشيتات الجامعية، عروض التخفيض، وكواليس الطباعة السريعة.
            </p>
          </div>

          {/* Social Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {/* Facebook Card */}
            <motion.a
              href="https://www.facebook.com/A4SUDAN"
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="bg-slate-900/90 hover:bg-slate-850 rounded-2xl p-5 sm:p-6 border border-[#1877F2]/40 hover:border-[#1877F2] transition-all shadow-lg hover:shadow-[#1877F2]/20 flex flex-col justify-between space-y-4 group cursor-pointer"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-[#1877F2] text-white flex items-center justify-center shadow-md shadow-[#1877F2]/40 group-hover:scale-110 transition-transform">
                      <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-base sm:text-lg font-black text-white group-hover:text-blue-300 transition-colors">
                        صفحة فيسبوك الرسمية
                      </h3>
                      <span className="text-xs font-mono font-bold text-blue-400">
                        @A4SUDAN
                      </span>
                    </div>
                  </div>
                  <span className="bg-blue-900/60 text-blue-300 text-[11px] font-bold px-2.5 py-1 rounded-full border border-blue-700/50">
                    Facebook
                  </span>
                </div>

                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-normal">
                  تابع آخر إعلانات الشيتات، تنبيهات بداية السمستر، والمنشورات والمناقشات الدراسية للجامعات السودانية.
                </p>
              </div>

              <div className="bg-[#1877F2] hover:bg-[#166fe5] text-white font-black py-2.5 px-4 rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition-all">
                <span>متابعة صفحتنا على فيسبوك (A4SUDAN)</span>
                <ArrowLeft className="w-4 h-4" />
              </div>
            </motion.a>

            {/* TikTok Card */}
            <motion.a
              href="https://www.tiktok.com/@A4SUDAN"
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="bg-slate-900/90 hover:bg-slate-850 rounded-2xl p-5 sm:p-6 border border-pink-500/40 hover:border-pink-500 transition-all shadow-lg hover:shadow-pink-500/20 flex flex-col justify-between space-y-4 group cursor-pointer"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-black border border-slate-700 text-white flex items-center justify-center shadow-md relative overflow-hidden group-hover:scale-110 transition-transform">
                      {/* Neon glow effect */}
                      <span className="absolute inset-0 bg-gradient-to-tr from-cyan-500/30 to-pink-500/30" />
                      <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 relative z-10 text-white">
                        <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-base sm:text-lg font-black text-white group-hover:text-pink-300 transition-colors">
                        حساب تيك توك الرسمي
                      </h3>
                      <span className="text-xs font-mono font-bold text-pink-400">
                        @A4SUDAN
                      </span>
                    </div>
                  </div>
                  <span className="bg-pink-950/60 text-pink-300 text-[11px] font-bold px-2.5 py-1 rounded-full border border-pink-800/50">
                    TikTok
                  </span>
                </div>

                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-normal">
                  شاهد مقاطع حية لكواليس الطباعة، عروض التوصيل، وكوبونات الخصم والجوائز الحصرية عبر تيك توك.
                </p>
              </div>

              <div className="bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white font-black py-2.5 px-4 rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition-all">
                <span>متابعة حسابنا على تيك توك (A4SUDAN)</span>
                <ArrowLeft className="w-4 h-4" />
              </div>
            </motion.a>
          </div>
        </div>
      </motion.section>

      {/* 4. WHY CHOOSE A4 SUDAN */}
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

      {/* 5. SUPPORT BANNER */}
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
          href={`tel:${whatsappNumber}`}
          className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-black px-5 py-2.5 rounded-xl text-xs sm:text-sm whitespace-nowrap transition-colors shadow-sm"
        >
          اتصل بنا: {whatsappNumber}
        </a>
      </div>

      {/* 6. FLOATING ANIMATED PROMO & WHATSAPP BUTTON (FLOATING ACTION WIDGET) */}
      <aside aria-label="العرض الترويجي عبر واتساب" className="fixed bottom-6 left-6 z-50 pointer-events-auto">
        <motion.a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.95 }}
          className="group relative flex items-center gap-2.5 bg-gradient-to-r from-emerald-600 via-emerald-500 to-green-600 text-white p-2.5 pr-4 rounded-full shadow-2xl hover:shadow-emerald-500/50 border-2 border-emerald-300 cursor-pointer"
        >
          {/* Pulsing Outer Ring */}
          <span className="absolute -inset-1 rounded-full bg-emerald-400 opacity-40 group-hover:opacity-75 blur animate-pulse" />

          {/* WhatsApp Icon with Sparkle */}
          <div className="relative w-10 h-10 rounded-full bg-white text-emerald-600 flex items-center justify-center shadow-md shrink-0">
            <MessageCircle className="w-6 h-6 fill-emerald-600 text-white" />
            <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-amber-400 rounded-full border-2 border-white flex items-center justify-center">
              <span className="w-1.5 h-1.5 bg-amber-600 rounded-full animate-ping" />
            </span>
          </div>

          {/* Dynamic Alternating Text */}
          <div className="relative flex flex-col text-right pl-2">
            <div className="flex items-center gap-1">
              <span className="text-[10px] bg-amber-400 text-slate-950 font-black px-1.5 py-0.2 rounded font-mono">
                {promoPrice} ج.س
              </span>
              <span className="text-[10px] font-bold text-emerald-100">
                عرض A4 SUDAN
              </span>
            </div>

            <div className="h-5 overflow-hidden min-w-[140px] sm:min-w-[170px] relative">
              <AnimatePresence mode="wait">
                <motion.span
                  key={activePromoIndex}
                  initial={{ y: 15, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -15, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="absolute inset-0 text-xs font-black text-white whitespace-nowrap"
                >
                  {activePromoIndex % 2 === 0
                    ? `اطبع الورقة بـ ${promoPrice}ج`
                    : `اطلب بالواتساب: ${whatsappNumber}`}
                </motion.span>
              </AnimatePresence>
            </div>
          </div>
        </motion.a>
      </aside>
    </div>
  );
};

