import React, { useState, useMemo, useEffect } from 'react';
import { 
  BarChart3, Users, ShoppingBag, DollarSign, TrendingUp, Calendar, 
  Printer, GraduationCap, Clock, Smartphone, Monitor, Tablet, 
  CreditCard, Truck, FileText, CheckCircle2, AlertCircle, RefreshCw, 
  Download, PieChart, Award, BookOpen, Layers, ChevronDown, ChevronUp,
  Flame, Sparkles, Filter, Trash2, RotateCcw
} from 'lucide-react';
import { PrintOrder, StudySheet, VisitorRecord } from '../types';
import { calculateAnalytics, getStoredVisitors, recordVisit, resetAllAnalyticsAndVisitors } from '../utils/analyticsTracker';
import { formatSDG } from '../utils/pricing';

interface AnalyticsDashboardViewProps {
  orders: PrintOrder[];
  sheets: StudySheet[];
  onClose?: () => void;
  onRefresh?: () => void;
}

export const AnalyticsDashboardView: React.FC<AnalyticsDashboardViewProps> = ({
  orders,
  sheets,
  onClose,
  onRefresh,
}) => {
  const [timeFilter, setTimeFilter] = useState<'all' | 'today' | 'week' | 'month' | 'last30'>('all');
  const [visitors, setVisitors] = useState<VisitorRecord[]>(() => getStoredVisitors());
  const [expandedUni, setExpandedUni] = useState<string | null>(null);
  const [activeTabSection, setActiveTabSection] = useState<'overview' | 'universities' | 'timeline' | 'printing' | 'behavior'>('overview');
  const [showResetConfirmModal, setShowResetConfirmModal] = useState(false);
  const [resetSuccessMessage, setResetSuccessMessage] = useState<string | null>(null);
  const [isResetting, setIsResetting] = useState(false);

  // Sync visitors on custom events
  useEffect(() => {
    const handleAnalyticsUpdate = () => {
      setVisitors(getStoredVisitors());
    };
    window.addEventListener('a4_analytics_updated', handleAnalyticsUpdate);
    return () => {
      window.removeEventListener('a4_analytics_updated', handleAnalyticsUpdate);
    };
  }, []);

  const handleRefresh = () => {
    setVisitors(getStoredVisitors());
    if (onRefresh) onRefresh();
  };

  const handleConfirmReset = async () => {
    setIsResetting(true);
    try {
      await resetAllAnalyticsAndVisitors();
      setVisitors([]);
      setShowResetConfirmModal(false);
      setResetSuccessMessage('تم تصفير وإعادة تعيين كافة إحصائيات وسجل الزيارات بنجاح! الإحصائيات الآن حقيقية 100% وتبدأ من اللحظة.');
      if (onRefresh) onRefresh();
      setTimeout(() => {
        setResetSuccessMessage(null);
      }, 5000);
    } catch (e) {
      alert('حدث خطأ أثناء تصفير الإحصائيات');
    } finally {
      setIsResetting(false);
    }
  };

  // Calculate stats based on current filter
  const analytics = useMemo(() => {
    return calculateAnalytics(orders, visitors, timeFilter);
  }, [orders, visitors, timeFilter]);

  // Export CSV Report
  const handleExportCSV = () => {
    let csv = '\uFEFF'; // BOM for UTF-8 Arabic support
    csv += `"تقرير الإحصائيات والتحليلات الشامل - مكتبة A4 للطباعة الذكية"\r\n`;
    csv += `"تاريخ التقرير:","${new Date().toLocaleDateString('ar-SD')} ${new Date().toLocaleTimeString('ar-SD')}"\r\n`;
    csv += `"الفترة المحددة:","${timeFilter === 'today' ? 'اليوم' : timeFilter === 'week' ? 'آخر 7 أيام' : timeFilter === 'month' ? 'هذا الشهر' : 'كافة الفترات'}"\r\n\r\n`;

    csv += `"المؤشرات العامة"\r\n`;
    csv += `"إجمالي الزوار","${analytics.visitors.total}"\r\n`;
    csv += `"زوار اليوم","${analytics.visitors.today}"\r\n`;
    csv += `"زوار الأسبوع","${analytics.visitors.thisWeek}"\r\n`;
    csv += `"زوار الشهر","${analytics.visitors.thisMonth}"\r\n`;
    csv += `"إجمالي الطلبات","${analytics.orders.total}"\r\n`;
    csv += `"طلبات اليوم","${analytics.orders.today}"\r\n`;
    csv += `"طلبات الأسبوع","${analytics.orders.thisWeek}"\r\n`;
    csv += `"طلبات الشهر","${analytics.orders.thisMonth}"\r\n`;
    csv += `"إجمالي المبيعات","${analytics.revenue.total} SDG"\r\n`;
    csv += `"مبيعات اليوم","${analytics.revenue.today} SDG"\r\n`;
    csv += `"معدل التحويل (Conversion)","${analytics.conversionRate}%"\r\n`;
    csv += `"متوسط قيمة الطلب","${analytics.revenue.avgOrderValue} SDG"\r\n\r\n`;

    csv += `"إحصائيات الجامعات والكليات"\r\n`;
    csv += `"اسم الجامعة","عدد الطلبات","نسبة الطلبات","عدد الزوار","إجمالي المبيعات (SDG)"\r\n`;
    analytics.universities.forEach(u => {
      csv += `"${u.name}","${u.ordersCount}","${u.percentage}%","${u.visitorsCount}","${u.revenue}"\r\n`;
      if (u.colleges.length > 0) {
        u.colleges.forEach(c => {
          csv += `"-- ${c.name}","${c.ordersCount}","-","-","${c.revenue}"\r\n`;
        });
      }
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `A4_Analytics_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Print Official Report
  const handlePrintReport = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('يرجى السماح بالنوافذ المنبثقة لطباعة التقرير');
      return;
    }

    const uniRows = analytics.universities.map((u, i) => `
      <tr style="background-color: ${i % 2 === 0 ? '#f8fafc' : '#ffffff'};">
        <td style="padding: 8px; border: 1px solid #cbd5e1; font-weight: bold;">${u.name}</td>
        <td style="padding: 8px; border: 1px solid #cbd5e1; text-align: center; font-weight: bold;">${u.ordersCount}</td>
        <td style="padding: 8px; border: 1px solid #cbd5e1; text-align: center;">${u.percentage}%</td>
        <td style="padding: 8px; border: 1px solid #cbd5e1; text-align: center;">${u.visitorsCount}</td>
        <td style="padding: 8px; border: 1px solid #cbd5e1; text-align: center; font-weight: bold; color: #059669;">${u.revenue.toLocaleString()} ج.س</td>
      </tr>
    `).join('');

    const topSheetsRows = analytics.topSheets.map((s, i) => `
      <tr style="background-color: ${i % 2 === 0 ? '#f8fafc' : '#ffffff'};">
        <td style="padding: 8px; border: 1px solid #cbd5e1; font-weight: bold;">${s.title}</td>
        <td style="padding: 8px; border: 1px solid #cbd5e1;">${s.institution} - ${s.facultyOrYear}</td>
        <td style="padding: 8px; border: 1px solid #cbd5e1; text-align: center; font-weight: bold; color: #d97706;">${s.ordersCount}</td>
      </tr>
    `).join('');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <title>التقرير الإحصائي الشامل - منصة A4</title>
        <style>
          body { font-family: system-ui, -apple-system, sans-serif; direction: rtl; padding: 25px; color: #0f172a; }
          .header { border-bottom: 2px solid #059669; padding-bottom: 15px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; }
          .title { font-size: 24px; font-weight: 900; color: #065f46; margin: 0; }
          .subtitle { font-size: 13px; color: #64748b; margin-top: 4px; }
          .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 25px; }
          .card { background: #f1f5f9; padding: 12px; border-radius: 8px; border: 1px solid #cbd5e1; }
          .card-label { font-size: 12px; color: #475569; font-weight: bold; }
          .card-value { font-size: 18px; font-weight: 900; color: #0f172a; margin-top: 4px; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; margin-bottom: 25px; font-size: 13px; }
          th { background: #065f46; color: white; padding: 10px; border: 1px solid #065f46; text-align: right; }
          .section-title { font-size: 16px; font-weight: 800; color: #1e293b; margin-top: 20px; margin-bottom: 8px; border-right: 4px solid #059669; padding-right: 8px; }
          .footer { margin-top: 40px; border-top: 1px solid #e2e8f0; padding-top: 15px; font-size: 11px; text-align: center; color: #94a3b8; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h1 class="title">تقرير الإحصائيات والتحليلات الشامل</h1>
            <div class="subtitle">منصة مكتبة A4 للطباعة الذكية وخدمات الجامعات السودانية</div>
          </div>
          <div style="text-align: left; font-size: 12px; color: #475569;">
            <div><strong>تاريخ الإصدار:</strong> ${new Date().toLocaleDateString('ar-SD')}</div>
            <div><strong>الفترة:</strong> ${timeFilter === 'today' ? 'اليوم' : timeFilter === 'week' ? 'آخر 7 أيام' : timeFilter === 'month' ? 'هذا الشهر' : 'كافة الفترات'}</div>
          </div>
        </div>

        <div class="grid">
          <div class="card">
            <div class="card-label">إجمالي الزوار</div>
            <div class="card-value">${analytics.visitors.total.toLocaleString()} زائر</div>
          </div>
          <div class="card">
            <div class="card-label">إجمالي الطلبات</div>
            <div class="card-value">${analytics.orders.total.toLocaleString()} طلب</div>
          </div>
          <div class="card">
            <div class="card-label">إجمالي المبيعات</div>
            <div class="card-value" style="color: #059669;">${analytics.revenue.total.toLocaleString()} ج.س</div>
          </div>
          <div class="card">
            <div class="card-label">معدل التحويل (طلبات/زيارات)</div>
            <div class="card-value" style="color: #d97706;">${analytics.conversionRate}%</div>
          </div>
        </div>

        <div class="grid">
          <div class="card">
            <div class="card-label">زوار اليوم</div>
            <div class="card-value">${analytics.visitors.today} زائر</div>
          </div>
          <div class="card">
            <div class="card-label">طلبات اليوم</div>
            <div class="card-value">${analytics.orders.today} طلب</div>
          </div>
          <div class="card">
            <div class="card-label">مبيعات اليوم</div>
            <div class="card-value">${analytics.revenue.today.toLocaleString()} ج.س</div>
          </div>
          <div class="card">
            <div class="card-label">متوسط قيمة الطلب</div>
            <div class="card-value">${analytics.revenue.avgOrderValue.toLocaleString()} ج.س</div>
          </div>
        </div>

        <div class="section-title">📊 تحليل الإقبال والمبيعات حسب الجامعة</div>
        <table>
          <thead>
            <tr>
              <th>اسم الجامعة</th>
              <th style="text-align: center;">عدد الطلبات</th>
              <th style="text-align: center;">النسبة</th>
              <th style="text-align: center;">عدد الزيارات</th>
              <th style="text-align: center;">إجمالي المبيعات</th>
            </tr>
          </thead>
          <tbody>
            ${uniRows}
          </tbody>
        </table>

        ${topSheetsRows.length > 0 ? `
          <div class="section-title">📚 أكثر الشيتات والملازم طلباً</div>
          <table>
            <thead>
              <tr>
                <th>عنوان المذكرة / الشيت</th>
                <th>الجامعة والكلية</th>
                <th style="text-align: center;">عدد مرات الطلب</th>
              </tr>
            </thead>
            <tbody>
              ${topSheetsRows}
            </tbody>
          </table>
        ` : ''}

        <div class="footer">
          تم استخراج هذا التقرير آلياً من لوحة تحكم إدارة منصة A4 للطباعة الذكية • جميع الحقوق محفوظة © ${new Date().getFullYear()}
        </div>
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 500);
  };

  // Find max daily visitors for scale
  const maxDailyVisitors = Math.max(1, ...analytics.dailyTrend.map(d => d.visitors));
  const maxHourlyCount = Math.max(1, ...analytics.hourlyDistribution);

  return (
    <div className="space-y-6 animate-in fade-in duration-200" dir="rtl">
      
      {/* Top Header & Actions */}
      <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-950 p-5 sm:p-6 rounded-3xl border border-emerald-500/20 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-400/20 border border-amber-400/30 flex items-center justify-center text-amber-300 shadow-inner">
              <BarChart3 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                  مركز الإحصائيات والتحليلات الشاملة
                </h2>
                <span className="bg-emerald-500/20 text-emerald-300 text-xs px-2.5 py-0.5 rounded-full border border-emerald-500/30 font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  مباشر ولحظي
                </span>
              </div>
              <p className="text-emerald-200/70 text-xs sm:text-sm mt-1">
                تتبع كامل للزوار (يومي، أسبوعي، شهري)، عدد الطلبات، تحليل كل جامعة، ومؤشرات المبيعات
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleRefresh}
            className="px-3.5 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
            title="تحديث البيانات"
          >
            <RefreshCw className="w-4 h-4 text-emerald-400" />
            <span>تحديث</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
            title="تصدير ملف Excel / CSV"
          >
            <Download className="w-4 h-4 text-amber-400" />
            <span>تصدير CSV</span>
          </button>

          <button
            onClick={handlePrintReport}
            className="px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-amber-950 text-xs sm:text-sm font-black flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
            title="طباعة تقرير رسمي"
          >
            <Printer className="w-4 h-4" />
            <span>طباعة التقرير</span>
          </button>

          <button
            onClick={() => setShowResetConfirmModal(true)}
            className="px-3.5 py-2.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
            title="تصفير الإحصائيات وسجل الزيارات للبدء من الصفر حقيقياً"
          >
            <Trash2 className="w-4 h-4 text-rose-400" />
            <span>تصفير الإحصائيات 0</span>
          </button>
        </div>
      </div>

      {/* Reset Success Message Banner */}
      {resetSuccessMessage && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 p-4 rounded-2xl flex items-center justify-between gap-3 text-emerald-800 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="text-xs sm:text-sm font-black">{resetSuccessMessage}</span>
          </div>
          <button 
            onClick={() => setResetSuccessMessage(null)}
            className="text-xs text-emerald-700 hover:text-emerald-900 font-bold px-2 py-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* Time-Range Filter Bar & Section Navigation */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Time Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          <span className="text-xs font-bold text-slate-500 flex items-center gap-1 pl-2 shrink-0">
            <Filter className="w-3.5 h-3.5 text-emerald-600" />
            <span>الفترة:</span>
          </span>
          {[
            { id: 'all', label: 'كافة الأوقات' },
            { id: 'today', label: 'اليوم فقط' },
            { id: 'week', label: 'آخر 7 أيام' },
            { id: 'month', label: 'هذا الشهر' },
            { id: 'last30', label: 'آخر 30 يوماً' },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setTimeFilter(f.id as any)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer shrink-0 ${
                timeFilter === f.id
                  ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-500/30'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Section Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto w-full md:w-auto border-t md:border-t-0 pt-2 md:pt-0 border-slate-100">
          {[
            { id: 'overview', label: 'نظرة عامة', icon: BarChart3 },
            { id: 'universities', label: 'الجامعات والكليات', icon: GraduationCap },
            { id: 'timeline', label: 'المخطط اليومي والذروة', icon: Calendar },
            { id: 'printing', label: 'خيارات الطباعة', icon: Printer },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTabSection(tab.id as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
                  activeTabSection === tab.id
                    ? 'bg-amber-100 text-amber-900 border border-amber-300/60 font-black'
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4 Major KPI Scorecards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Visitors Card */}
        <div className="bg-gradient-to-br from-white to-blue-50/40 p-5 rounded-3xl border border-blue-100 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-blue-900">إحصائيات الزوار</span>
            <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-900">
                {analytics.visitors.total.toLocaleString()}
              </span>
              <span className="text-xs font-bold text-slate-400">إجمالي الزيارات</span>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-1.5 mt-4 pt-3 border-t border-blue-100/80 text-center">
            <div className="bg-white/80 p-1.5 rounded-xl border border-blue-100/50">
              <span className="text-[10px] text-slate-400 font-bold block">اليوم</span>
              <span className="text-xs font-black text-blue-700 block mt-0.5">{analytics.visitors.today}</span>
            </div>
            <div className="bg-white/80 p-1.5 rounded-xl border border-blue-100/50">
              <span className="text-[10px] text-slate-400 font-bold block">الأسبوع</span>
              <span className="text-xs font-black text-blue-700 block mt-0.5">{analytics.visitors.thisWeek}</span>
            </div>
            <div className="bg-white/80 p-1.5 rounded-xl border border-blue-100/50">
              <span className="text-[10px] text-slate-400 font-bold block">الشهر</span>
              <span className="text-xs font-black text-blue-700 block mt-0.5">{analytics.visitors.thisMonth}</span>
            </div>
          </div>
        </div>

        {/* Orders Card */}
        <div className="bg-gradient-to-br from-white to-amber-50/40 p-5 rounded-3xl border border-amber-100 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-amber-900">إحصائيات الطلبات</span>
            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
              <ShoppingBag className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-900">
                {analytics.orders.total.toLocaleString()}
              </span>
              <span className="text-xs font-bold text-slate-400">طلب مسجل</span>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-1.5 mt-4 pt-3 border-t border-amber-100/80 text-center">
            <div className="bg-white/80 p-1.5 rounded-xl border border-amber-100/50">
              <span className="text-[10px] text-slate-400 font-bold block">اليوم</span>
              <span className="text-xs font-black text-amber-700 block mt-0.5">{analytics.orders.today}</span>
            </div>
            <div className="bg-white/80 p-1.5 rounded-xl border border-amber-100/50">
              <span className="text-[10px] text-slate-400 font-bold block">الأسبوع</span>
              <span className="text-xs font-black text-amber-700 block mt-0.5">{analytics.orders.thisWeek}</span>
            </div>
            <div className="bg-white/80 p-1.5 rounded-xl border border-amber-100/50">
              <span className="text-[10px] text-slate-400 font-bold block">الشهر</span>
              <span className="text-xs font-black text-amber-700 block mt-0.5">{analytics.orders.thisMonth}</span>
            </div>
          </div>
        </div>

        {/* Revenue Card */}
        <div className="bg-gradient-to-br from-white to-emerald-50/40 p-5 rounded-3xl border border-emerald-100 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-emerald-900">إجمالي المبيعات</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-black text-emerald-700">
                {analytics.revenue.total.toLocaleString()}
              </span>
              <span className="text-xs font-bold text-emerald-600">ج.س</span>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-1.5 mt-4 pt-3 border-t border-emerald-100/80 text-center">
            <div className="bg-white/80 p-1.5 rounded-xl border border-emerald-100/50">
              <span className="text-[10px] text-slate-400 font-bold block">اليوم</span>
              <span className="text-xs font-black text-emerald-700 block mt-0.5">{analytics.revenue.today.toLocaleString()}</span>
            </div>
            <div className="bg-white/80 p-1.5 rounded-xl border border-emerald-100/50">
              <span className="text-[10px] text-slate-400 font-bold block">الأسبوع</span>
              <span className="text-xs font-black text-emerald-700 block mt-0.5">{analytics.revenue.thisWeek.toLocaleString()}</span>
            </div>
            <div className="bg-white/80 p-1.5 rounded-xl border border-emerald-100/50">
              <span className="text-[10px] text-slate-400 font-bold block">الشهر</span>
              <span className="text-xs font-black text-emerald-700 block mt-0.5">{analytics.revenue.thisMonth.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Conversion & Value Card */}
        <div className="bg-gradient-to-br from-white to-purple-50/40 p-5 rounded-3xl border border-purple-100 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-purple-900">معدل التحويل والقيمة</span>
            <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-purple-800">
                {analytics.conversionRate}%
              </span>
              <span className="text-xs font-bold text-slate-400">نسبة الشراء</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-purple-100/80 text-center">
            <div className="bg-white/80 p-1.5 rounded-xl border border-purple-100/50">
              <span className="text-[10px] text-slate-400 font-bold block">متوسط الطلب</span>
              <span className="text-xs font-black text-purple-700 block mt-0.5">{analytics.revenue.avgOrderValue.toLocaleString()} ج.س</span>
            </div>
            <div className="bg-white/80 p-1.5 rounded-xl border border-purple-100/50">
              <span className="text-[10px] text-slate-400 font-bold block">الجهاز الأغلب</span>
              <span className="text-xs font-black text-purple-700 block mt-0.5">
                {analytics.devices.mobile >= analytics.devices.desktop ? '📱 موبايل' : '💻 كمبيوتر'}
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* SECTION: UNIVERSITIES MATRIX ("من أي جامعة؟") */}
      {(activeTabSection === 'overview' || activeTabSection === 'universities') && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 mb-5 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-black text-slate-900">
                  تحليل الطلبات والإقبال حسب الجامعة والكليات
                </h3>
                <p className="text-xs text-slate-500">
                  ترتيب الجامعات من الأكثر طلباً وتفاعلاً مع تفاصيل كليات وتخصصات كل جامعة
                </p>
              </div>
            </div>
            <span className="text-xs font-bold text-slate-400 bg-slate-100 px-3 py-1 rounded-full self-start sm:self-auto">
              إجمالي {analytics.universities.length} جامعة مُمثلة
            </span>
          </div>

          {analytics.universities.length === 0 ? (
            <div className="p-8 text-center text-slate-400 font-bold text-sm">
              لا توجد طلبات مسجلة بعد في هذه الفترة لعرض تحليل الجامعات.
            </div>
          ) : (
            <div className="space-y-3">
              {analytics.universities.map((uni, idx) => {
                const isExpanded = expandedUni === uni.name;
                return (
                  <div 
                    key={uni.name}
                    className="border border-slate-200/90 rounded-2xl overflow-hidden transition-all hover:border-slate-300"
                  >
                    {/* Uni Row Header */}
                    <div 
                      onClick={() => setExpandedUni(isExpanded ? null : uni.name)}
                      className="p-4 bg-slate-50/70 hover:bg-slate-100/70 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3">
                        <span className={`w-7 h-7 rounded-xl flex items-center justify-center font-black text-xs ${
                          idx === 0 ? 'bg-amber-400 text-amber-950 shadow-sm' :
                          idx === 1 ? 'bg-slate-300 text-slate-800' :
                          idx === 2 ? 'bg-amber-700/30 text-amber-900' :
                          'bg-slate-200 text-slate-600'
                        }`}>
                          {idx + 1}
                        </span>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-black text-sm sm:text-base text-slate-900">{uni.name}</span>
                            {idx === 0 && (
                              <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-black border border-amber-200 flex items-center gap-1">
                                <Award className="w-3 h-3 text-amber-600" />
                                الأكثر طلباً 👑
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                            <span>{uni.colleges.length} كليات مسجلة</span>
                            <span>•</span>
                            <span>{uni.visitorsCount} زيارة</span>
                          </div>
                        </div>
                      </div>

                      {/* Stats & Progress */}
                      <div className="flex items-center gap-4 justify-between sm:justify-end">
                        <div className="text-right sm:text-left">
                          <div className="flex items-center gap-1.5">
                            <strong className="text-base font-black text-emerald-700">{uni.ordersCount} طلب</strong>
                            <span className="text-xs bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
                              {uni.percentage}%
                            </span>
                          </div>
                          <span className="text-xs font-bold text-slate-400 block mt-0.5">
                            {uni.revenue.toLocaleString()} ج.س
                          </span>
                        </div>
                        <div className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-500">
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </div>
                      </div>
                    </div>

                    {/* Visual Progress Bar */}
                    <div className="w-full bg-slate-100 h-1.5">
                      <div 
                        className={`h-full ${
                          idx === 0 ? 'bg-amber-500' :
                          idx === 1 ? 'bg-emerald-600' :
                          'bg-blue-500'
                        }`}
                        style={{ width: `${Math.max(4, uni.percentage)}%` }}
                      />
                    </div>

                    {/* Expanded Colleges Breakdown */}
                    {isExpanded && (
                      <div className="p-4 bg-white border-t border-slate-200 animate-in fade-in duration-150">
                        <div className="text-xs font-black text-slate-700 mb-2.5 flex items-center gap-1.5">
                          <Layers className="w-3.5 h-3.5 text-amber-600" />
                          <span>تفصيل الكليات والتخصصات في [{uni.name}]:</span>
                        </div>
                        {uni.colleges.length === 0 ? (
                          <p className="text-xs text-slate-400">لا توجد طلبات مفصلة حسب الكلية لهذه الجامعة.</p>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                            {uni.colleges.map((col) => (
                              <div 
                                key={col.name}
                                className="bg-slate-50 p-3 rounded-xl border border-slate-200/70 flex items-center justify-between"
                              >
                                <div className="pr-1">
                                  <span className="font-bold text-xs text-slate-800 block">{col.name}</span>
                                  <span className="text-[11px] text-emerald-600 font-bold mt-0.5 block">{col.revenue.toLocaleString()} ج.س</span>
                                </div>
                                <span className="text-xs font-black bg-white px-2.5 py-1 rounded-lg border border-slate-200 text-slate-800 font-mono">
                                  {col.ordersCount} طلب
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* SECTION: DAILY TIMELINE & PEAK HOURS */}
      {(activeTabSection === 'overview' || activeTabSection === 'timeline') && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Daily Trend Chart (2 Cols) */}
          <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center">
                    <Calendar className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-black text-slate-900">
                      نشاط الزيارات والطلبات اليومي (آخر 14 يوماً)
                    </h3>
                    <span className="text-xs text-slate-400">تتبع الزوار والطلبات والإيراد اليومي</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-xs font-bold">
                  <span className="flex items-center gap-1 text-blue-600">
                    <span className="w-2.5 h-2.5 rounded-sm bg-blue-500" />
                    الزوار
                  </span>
                  <span className="flex items-center gap-1 text-emerald-600">
                    <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />
                    الطلبات
                  </span>
                </div>
              </div>

              {/* Bar Chart Visuals */}
              <div className="grid grid-cols-7 sm:grid-cols-14 gap-2 items-end pt-8 pb-3 min-h-[220px]">
                {analytics.dailyTrend.map((d) => {
                  const visitorHeight = Math.max(8, Math.round((d.visitors / maxDailyVisitors) * 100));
                  const orderHeight = Math.max(4, Math.round((d.orders / Math.max(1, maxDailyVisitors / 2)) * 100));
                  const dateShort = d.date.split('-').slice(1).join('/');

                  return (
                    <div key={d.date} className="flex flex-col items-center gap-1.5 group relative">
                      
                      {/* Hover Tooltip */}
                      <div className="absolute bottom-full mb-2 hidden group-hover:flex flex-col items-center z-30 pointer-events-none">
                        <div className="bg-slate-900 text-white text-[11px] font-bold py-1.5 px-2.5 rounded-xl shadow-xl whitespace-nowrap border border-slate-700 text-center">
                          <div className="text-amber-300 font-extrabold">{d.dayName} ({d.date})</div>
                          <div className="text-blue-300 mt-0.5">{d.visitors} زائر</div>
                          <div className="text-emerald-300">{d.orders} طلب • {d.revenue.toLocaleString()} ج.س</div>
                        </div>
                        <div className="w-2 h-2 bg-slate-900 rotate-45 -mt-1" />
                      </div>

                      {/* Dual Bars */}
                      <div className="flex items-end gap-1 h-36 w-full justify-center">
                        <div 
                          className="w-2.5 sm:w-3.5 bg-blue-500/80 group-hover:bg-blue-600 rounded-t-md transition-all duration-300 shadow-sm"
                          style={{ height: `${visitorHeight}%` }}
                        />
                        <div 
                          className="w-2.5 sm:w-3.5 bg-emerald-500 group-hover:bg-emerald-600 rounded-t-md transition-all duration-300 shadow-sm"
                          style={{ height: `${orderHeight}%` }}
                        />
                      </div>

                      {/* Day Label */}
                      <span className="text-[10px] font-bold text-slate-500 rotate-0 truncate max-w-[38px] text-center">
                        {dateShort}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>متوسط الزوار اليومي: <strong>{Math.round(analytics.visitors.total / 30)} زائر/يوم</strong></span>
              <span>متوسط الطلبات: <strong>{Math.round((analytics.orders.total / 30) * 10) / 10} طلب/يوم</strong></span>
            </div>
          </div>

          {/* Peak Hours Heatmap (1 Col) */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 pb-3 mb-4 border-b border-slate-100">
                <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
                  <Clock className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black text-slate-900">
                    أوقات الذروة على مدار اليوم
                  </h3>
                  <span className="text-xs text-slate-400">توزيع النشاط حسب ساعات اليوم (24 ساعة)</span>
                </div>
              </div>

              {/* 24-Hour Grid */}
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-1.5 py-2">
                {analytics.hourlyDistribution.map((count, hr) => {
                  const intensity = Math.min(100, Math.round((count / maxHourlyCount) * 100));
                  const isPeak = intensity >= 70;
                  const formatHour = hr === 0 ? '12 ص' : hr < 12 ? `${hr} ص` : hr === 12 ? '12 م' : `${hr - 12} م`;

                  return (
                    <div 
                      key={hr}
                      className={`p-2 rounded-xl border text-center transition-all ${
                        isPeak 
                          ? 'bg-amber-400 text-amber-950 border-amber-500 font-black shadow-sm ring-1 ring-amber-300' 
                          : intensity >= 40
                          ? 'bg-emerald-100 text-emerald-900 border-emerald-200 font-bold'
                          : intensity > 0
                          ? 'bg-slate-100 text-slate-700 border-slate-200'
                          : 'bg-slate-50 text-slate-300 border-slate-100'
                      }`}
                      title={`${formatHour}: ${count} نشاط`}
                    >
                      <span className="text-[10px] block opacity-80">{formatHour}</span>
                      <strong className="text-xs block mt-0.5">{count}</strong>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span className="flex items-center gap-1 text-amber-800 font-bold">
                <Flame className="w-3.5 h-3.5 text-amber-600" />
                أوقات الذروة: 10 صباحاً - 4 عصراً
              </span>
            </div>
          </div>

        </div>
      )}

      {/* SECTION: PRINTING PREFERENCES & CUSTOMER BEHAVIOR */}
      {(activeTabSection === 'overview' || activeTabSection === 'printing') && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Print Colors & Sides */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2 pb-3 mb-4 border-b border-slate-100">
              <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center">
                <Printer className="w-4.5 h-4.5" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-black text-slate-900">
                  خيارات الطباعة (ألوان vs أسود)
                </h3>
                <span className="text-xs text-slate-400">تفضيلات الطلاب في نوع الطباعة</span>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                  <span>أبيض وأسود (B&W)</span>
                  <span className="font-mono">{analytics.printColors.bw} ملف</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div 
                    className="bg-slate-800 h-2 rounded-full"
                    style={{ width: `${Math.round((analytics.printColors.bw / Math.max(1, analytics.printColors.bw + analytics.printColors.color + analytics.printColors.mixed)) * 100)}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                  <span>طباعة ألوان كاملة</span>
                  <span className="font-mono text-emerald-600">{analytics.printColors.color} ملف</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div 
                    className="bg-emerald-500 h-2 rounded-full"
                    style={{ width: `${Math.round((analytics.printColors.color / Math.max(1, analytics.printColors.bw + analytics.printColors.color + analytics.printColors.mixed)) * 100)}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                  <span>غلاف ملون والداخل أسود</span>
                  <span className="font-mono text-blue-600">{analytics.printColors.mixed} ملف</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full"
                    style={{ width: `${Math.round((analytics.printColors.mixed / Math.max(1, analytics.printColors.bw + analytics.printColors.color + analytics.printColors.mixed)) * 100)}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-500">طباعة وجهين (Double): <strong>{analytics.sidesTypes.double}</strong></span>
              <span className="text-slate-500">وجه واحد (Single): <strong>{analytics.sidesTypes.single}</strong></span>
            </div>
          </div>

          {/* Binding Types */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2 pb-3 mb-4 border-b border-slate-100">
              <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
                <BookOpen className="w-4.5 h-4.5" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-black text-slate-900">
                  نوع التجليد الأكثر طلباً
                </h3>
                <span className="text-xs text-slate-400">توزيع خيارات التشطيب والتغليف</span>
              </div>
            </div>

            <div className="space-y-2.5">
              {[
                { label: 'سلك بلاستيكي حلزوني', count: analytics.bindingTypes.spiral_plastic, color: 'bg-amber-500' },
                { label: 'بدون تجليد (ورق مفرد)', count: analytics.bindingTypes.none, color: 'bg-slate-400' },
                { label: 'تدبيس زاوية / وسط', count: analytics.bindingTypes.stapled, color: 'bg-blue-500' },
                { label: 'تجليد فاخر كوشيه', count: analytics.bindingTypes.softcover, color: 'bg-emerald-500' },
                { label: 'تجليد صلب فاخر (جلد/كرتون)', count: analytics.bindingTypes.hardcover_leather, color: 'bg-purple-500' },
              ].map(b => (
                <div key={b.label} className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-xs font-bold text-slate-700">{b.label}</span>
                  <span className="text-xs font-black bg-white px-2 py-0.5 rounded-lg border border-slate-200 text-slate-800">
                    {b.count} طلب
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Payment & Delivery Split */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2 pb-3 mb-4 border-b border-slate-100">
              <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                <CreditCard className="w-4.5 h-4.5" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-black text-slate-900">
                  طرق الدفع والتسليم
                </h3>
                <span className="text-xs text-slate-400">قنوات السداد والتوصيل المستخدمة</span>
              </div>
            </div>

            <div className="space-y-3">
              <div className="p-3 bg-emerald-50/60 rounded-2xl border border-emerald-100">
                <span className="text-[11px] font-bold text-emerald-900 block mb-1">طرق الدفع الإلكتروني:</span>
                <div className="grid grid-cols-3 gap-1.5 text-center">
                  <div className="bg-white p-1.5 rounded-xl border border-emerald-200">
                    <span className="text-[10px] text-slate-400 block font-bold">بنكك</span>
                    <strong className="text-xs text-emerald-700 block mt-0.5">{analytics.paymentMethods.bankak}</strong>
                  </div>
                  <div className="bg-white p-1.5 rounded-xl border border-emerald-200">
                    <span className="text-[10px] text-slate-400 block font-bold">أوكاش</span>
                    <strong className="text-xs text-amber-700 block mt-0.5">{analytics.paymentMethods.okash}</strong>
                  </div>
                  <div className="bg-white p-1.5 rounded-xl border border-emerald-200">
                    <span className="text-[10px] text-slate-400 block font-bold">فوري/كاش</span>
                    <strong className="text-xs text-blue-700 block mt-0.5">{analytics.paymentMethods.fawry + analytics.paymentMethods.cash}</strong>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-blue-50/60 rounded-2xl border border-blue-100">
                <span className="text-[11px] font-bold text-blue-900 block mb-1">طرق الاستلام والتسليم:</span>
                <div className="grid grid-cols-2 gap-2 text-center">
                  <div className="bg-white p-2 rounded-xl border border-blue-200">
                    <span className="text-[10px] text-slate-400 block font-bold">🛵 دليفري وتوصيل</span>
                    <strong className="text-sm text-blue-700 block mt-0.5">{analytics.deliveryMethods.delivery} طلب</strong>
                  </div>
                  <div className="bg-white p-2 rounded-xl border border-blue-200">
                    <span className="text-[10px] text-slate-400 block font-bold">🏢 استلام من المكتبة</span>
                    <strong className="text-sm text-slate-800 block mt-0.5">{analytics.deliveryMethods.pickup} طلب</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* SECTION: TOP REQUESTED STUDY SHEETS */}
      {analytics.topSheets.length > 0 && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 pb-3 mb-4 border-b border-slate-100">
            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
              <FileText className="w-4.5 h-4.5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black text-slate-900">
                أكثر المذكرات والشيتات طلباً من الطلاب
              </h3>
              <span className="text-xs text-slate-400">ترتيب المواد الدراسية الأكثر طباعة ومبيعاً</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {analytics.topSheets.map((sheet, i) => (
              <div 
                key={sheet.id}
                className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between hover:bg-slate-100/70 transition-all"
              >
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-lg bg-amber-200 text-amber-900 flex items-center justify-center font-black text-xs">
                    {i + 1}
                  </span>
                  <div>
                    <h4 className="font-bold text-xs sm:text-sm text-slate-900 line-clamp-1">{sheet.title}</h4>
                    <span className="text-[11px] text-slate-500 block mt-0.5">{sheet.institution} • {sheet.facultyOrYear}</span>
                  </div>
                </div>
                <span className="text-xs font-black bg-white px-2.5 py-1 rounded-xl border border-slate-200 text-emerald-700 shrink-0 font-mono">
                  {sheet.ordersCount} طلب
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL: RESET ANALYTICS CONFIRMATION */}
      {showResetConfirmModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full border border-slate-200 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150 text-right">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            
            <div className="text-center">
              <h3 className="text-lg font-black text-slate-900">تصفير وإعادة ضبط الإحصائيات بالكامل؟</h3>
              <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
                سيتم مسح كافة سجلات الزيارات السابقة والبيانات القديمة وتصفيرها بالكامل إلى <strong className="text-rose-600">صفر (0)</strong>، لتبدأ الإحصائيات من هذه اللحظة بشكل حقيقي وفوري 100% مع كل زيارة وطلب جديد بالموقع.
              </p>
            </div>

            <div className="bg-amber-50 border border-amber-200 p-3 rounded-2xl text-xs text-amber-900 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>
                لن يتم حذف أي طلبات شراء حقيقية، وإنما يتم فقط تصفير عدادات وسجلات الزيارات والبدء الفوري بالإحصائيات الحقيقية.
              </span>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowResetConfirmModal(false)}
                disabled={isResetting}
                className="flex-1 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs sm:text-sm transition-all cursor-pointer"
              >
                إلغاء
              </button>

              <button
                type="button"
                onClick={handleConfirmReset}
                disabled={isResetting}
                className="flex-1 py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs sm:text-sm shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                {isResetting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>جاري التصفير...</span>
                  </>
                ) : (
                  <>
                    <RotateCcw className="w-4 h-4" />
                    <span>تأكيد التصفير 0</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
