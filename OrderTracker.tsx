import React, { useState } from 'react';
import { 
  Search, 
  Package, 
  Clock, 
  CheckCircle2, 
  Truck, 
  Phone, 
  AlertCircle, 
  FileText, 
  Download, 
  ExternalLink, 
  Image as ImageIcon, 
  X, 
  Cloud, 
  LogIn, 
  User as UserIcon, 
  Copy, 
  Check, 
  Printer,
  Building2,
  XCircle,
  ShieldCheck,
  MapPin,
  CreditCard,
  Calendar,
  Sparkles,
  FileCheck2,
  Receipt,
  Layers,
  Info,
  ChevronRight,
  Share2
} from 'lucide-react';
import { User } from 'firebase/auth';
import { PrintOrder } from '../types';
import { getStatusBadgeInfo, formatSDG, getEstimatedDeliveryText } from '../utils/pricing';
import logoImg from '../assets/images/a4_sudan_green_logo_1785943554845.jpg';
import { OrderSlipModal } from './OrderSlipModal';

interface OrderTrackerProps {
  orders: PrintOrder[];
  onRefreshOrders?: () => void;
  currentUser?: User | null;
  onOpenAuthModal?: () => void;
}

// Helper to get comprehensive status styling, colorful icons, and descriptions
export function getStatusConfig(status: string) {
  switch (status) {
    case 'pending':
      return {
        label: 'جديد (في الانتظار)',
        description: 'تم استلام طلبك بنجاح، وهو الآن بانتظار الاعتماد والتحقق المالي من فريق إدارة المكتبة.',
        Icon: Clock,
        stepIndex: 1,
        statusColor: 'amber',
        bgPill: 'bg-amber-100 text-amber-900 border-amber-300',
        iconBg: 'bg-amber-500 text-white shadow-amber-200',
        calloutBg: 'bg-amber-50 border-amber-200 text-amber-900',
        headerGradient: 'from-slate-900 via-amber-950/80 to-slate-900',
        accentBorder: 'border-amber-400',
      };
    case 'reviewing':
      return {
        label: 'جاري المراجعة والمعاينة',
        description: 'يقوم فني الطباعة بمراجعة ملفاتك وتجهيز خيارات الورق والقص والألوان.',
        Icon: FileCheck2,
        stepIndex: 1,
        statusColor: 'sky',
        bgPill: 'bg-sky-100 text-sky-900 border-sky-300',
        iconBg: 'bg-sky-500 text-white shadow-sky-200',
        calloutBg: 'bg-sky-50 border-sky-200 text-sky-900',
        headerGradient: 'from-slate-900 via-sky-950/80 to-slate-900',
        accentBorder: 'border-sky-400',
      };
    case 'printing':
      return {
        label: 'جاري الطباعة الآن 🖨️',
        description: 'جاري طباعة صفحاتك حالياً على ماكينات المكتبة الرقمية عالية الدقة.',
        Icon: Printer,
        stepIndex: 2,
        statusColor: 'indigo',
        bgPill: 'bg-indigo-100 text-indigo-900 border-indigo-300',
        iconBg: 'bg-indigo-600 text-white shadow-indigo-200 animate-pulse',
        calloutBg: 'bg-indigo-50 border-indigo-200 text-indigo-900',
        headerGradient: 'from-slate-900 via-indigo-950/80 to-slate-900',
        accentBorder: 'border-indigo-400',
      };
    case 'packaging':
      return {
        label: 'جاري التغليف والقص 📦',
        description: 'تمت الطباعة، وجاري الآن التخريم، التغليف الحراري، والتجميع للطلب.',
        Icon: Package,
        stepIndex: 3,
        statusColor: 'purple',
        bgPill: 'bg-purple-100 text-purple-900 border-purple-300',
        iconBg: 'bg-purple-600 text-white shadow-purple-200',
        calloutBg: 'bg-purple-50 border-purple-200 text-purple-900',
        headerGradient: 'from-slate-900 via-purple-950/80 to-slate-900',
        accentBorder: 'border-purple-400',
      };
    case 'out_for_delivery':
      return {
        label: 'مع المندوب للتوصيل 🛵',
        description: 'طلبك مغلف وجاهز وخارج حالياً مع مندوب التوصيل إلى عنوانك المحدد.',
        Icon: Truck,
        stepIndex: 4,
        statusColor: 'teal',
        bgPill: 'bg-teal-100 text-teal-900 border-teal-300',
        iconBg: 'bg-teal-600 text-white shadow-teal-200',
        calloutBg: 'bg-teal-50 border-teal-200 text-teal-900',
        headerGradient: 'from-slate-900 via-teal-950/80 to-slate-900',
        accentBorder: 'border-teal-400',
      };
    case 'ready_for_pickup':
      return {
        label: 'جاهز للاستلام بالمكتبة 🏪',
        description: 'طلبك مغلف ومحفوظ بالأمانات، يمكنك الحضور لمقر المكتبة واستلامه مباشرة.',
        Icon: Building2,
        stepIndex: 4,
        statusColor: 'emerald',
        bgPill: 'bg-emerald-100 text-emerald-900 border-emerald-300',
        iconBg: 'bg-emerald-600 text-white shadow-emerald-200',
        calloutBg: 'bg-emerald-50 border-emerald-200 text-emerald-900',
        headerGradient: 'from-slate-900 via-emerald-950/80 to-slate-900',
        accentBorder: 'border-emerald-400',
      };
    case 'completed':
      return {
        label: 'تم التسليم بنجاح ✅',
        description: 'تم تسليم الطلب لك بالكامل. شكراً جزيلاً لتعاملك مع مكتبة A4 Sudan!',
        Icon: ShieldCheck,
        stepIndex: 5,
        statusColor: 'emerald',
        bgPill: 'bg-emerald-100 text-emerald-900 border-emerald-300',
        iconBg: 'bg-emerald-600 text-white shadow-emerald-200',
        calloutBg: 'bg-emerald-50 border-emerald-200 text-emerald-900',
        headerGradient: 'from-emerald-950 via-slate-900 to-emerald-950',
        accentBorder: 'border-emerald-400',
      };
    case 'cancelled':
      return {
        label: 'ملغي ❌',
        description: 'تم إلغاء هذا الطلب. يسعدنا تواصلك مع خدمة العملاء في حال وجود أي استفسار.',
        Icon: XCircle,
        stepIndex: 0,
        statusColor: 'rose',
        bgPill: 'bg-rose-100 text-rose-900 border-rose-300',
        iconBg: 'bg-rose-600 text-white shadow-rose-200',
        calloutBg: 'bg-rose-50 border-rose-200 text-rose-900',
        headerGradient: 'from-slate-900 via-rose-950/80 to-slate-900',
        accentBorder: 'border-rose-400',
      };
    default:
      return {
        label: status,
        description: 'متابعة حالة الطلب لدى المكتبة',
        Icon: Clock,
        stepIndex: 1,
        statusColor: 'slate',
        bgPill: 'bg-slate-100 text-slate-800 border-slate-300',
        iconBg: 'bg-slate-600 text-white',
        calloutBg: 'bg-slate-50 border-slate-200 text-slate-800',
        headerGradient: 'from-slate-900 to-slate-800',
        accentBorder: 'border-slate-400',
      };
  }
}

export const OrderTracker: React.FC<OrderTrackerProps> = ({ orders, onRefreshOrders, currentUser, onOpenAuthModal }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProofImage, setSelectedProofImage] = useState<string | null>(null);
  const [copiedOrderId, setCopiedOrderId] = useState<string | null>(null);
  const [printOrderSlip, setPrintOrderSlip] = useState<PrintOrder | null>(null);

  const handleCopyOrderDetails = (order: PrintOrder) => {
    const badge = getStatusBadgeInfo(order.status);
    const payMethodLabel = order.paymentMethod === 'bankak' 
      ? 'تحويل بنكك (Bankak)' 
      : order.paymentMethod === 'okash' 
      ? 'تحويل أوكاش (O-CASH)' 
      : order.paymentMethod === 'fawry' 
      ? 'تحويل فوري (Fawry)' 
      : 'دفع نقدي';

    const filesList = order.files.map((f, idx) => {
      const sheets = Math.ceil(f.pageCount / (f.pagesPerSheet || 1));
      return `   ${idx + 1}. ${f.fileName} (${f.pageCount} صفحة - ${f.copies} نسخة - ${sheets} ورقة)`;
    }).join('\n');

    const text = `📄 *تفاصيل طلب الطباعة - مكتبة A4 Sudan*
---------------------------------------
🔖 *رقم الطلب:* #${order.id}
👤 *اسم العميل:* ${order.customerName}
📞 *رقم الهاتف:* ${order.customerPhone}${order.customerPhone2 ? ` / ${order.customerPhone2}` : ''}
📍 *العنوان/الجامعة:* ${order.addressOrCampus || ''} (${order.city || ''})
📌 *حالة الطلب:* ${badge.label}
💳 *طريقة الدفع:* ${payMethodLabel}
${order.bankakTransactionId ? `🔢 *رقم الإشعار:* ${order.bankakTransactionId}\n` : ''}💰 *المبلغ الإجمالي:* ${formatSDG(order.totalAmount)}
📅 *تاريخ الطلب:* ${new Date(order.createdAt).toLocaleString('ar-SD')}

📚 *الملفات المرفقة (${order.files.length}):*
${filesList}

---------------------------------------
🌐 لمتابعة حالة الطباعة: https://a4sudan.app`;

    try {
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        textArea.remove();
      }
      setCopiedOrderId(order.id);
      setTimeout(() => setCopiedOrderId(null), 2500);
    } catch (e) {
      console.error('Copy failed:', e);
    }
  };

  // Dynamically read client's own saved order IDs and phone number from localStorage for personal privacy
  const getMyOrderIds = (): string[] => {
    try {
      const parsed = JSON.parse(localStorage.getItem('a4_my_order_ids') || '[]');
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  const myOrderIds = getMyOrderIds();
  const myPhone = (localStorage.getItem('a4_my_phone') || '').trim();

  const rawQuery = searchQuery.trim();
  const query = rawQuery.toLowerCase();
  const cleanQuery = query.replace(/\D/g, '');

  const filteredOrders = orders.filter(o => {
    if (!o || !o.id) return false;

    // Check if order belongs to authenticated user
    const isAccountOrder = Boolean(currentUser) && (
      (Boolean(o.userId) && o.userId === currentUser?.uid) ||
      (Boolean(o.customerEmail) && Boolean(currentUser?.email) && o.customerEmail?.toLowerCase() === currentUser?.email?.toLowerCase())
    );

    // 1. Is this order created on the current browser/device or account?
    const isOwnBrowserOrder =
      isAccountOrder ||
      (myOrderIds.length > 0 && myOrderIds.includes(o.id)) ||
      (Boolean(myPhone) && ((o.customerPhone && o.customerPhone.trim() === myPhone) || (o.customerPhone2 && o.customerPhone2.trim() === myPhone)));

    // 2. If NO search query is typed: show ONLY orders created on this browser/account
    if (!query) {
      return isOwnBrowserOrder;
    }

    // 3. If a search query IS typed:
    const cleanPhone = (o.customerPhone || '').replace(/\D/g, '');
    const cleanPhone2 = (o.customerPhone2 || '').replace(/\D/g, '');
    
    // Check match by Order Code (e.g., A4-SD-9102 or 9102)
    const isMatchId = o.id.toLowerCase() === query || 
                       o.id.toLowerCase().includes(query) || 
                       (cleanQuery.length >= 3 && o.id.toLowerCase().includes(cleanQuery));
    
    // Check match by Phone Number (full or substantial phone number)
    const isMatchPhone = (cleanQuery.length >= 6 && (cleanPhone.includes(cleanQuery) || cleanPhone2.includes(cleanQuery))) || 
                         (o.customerPhone && o.customerPhone.trim() === rawQuery) ||
                         (o.customerPhone2 && o.customerPhone2.trim() === rawQuery);

    if (isOwnBrowserOrder) {
      // For orders created on this browser/account, allow flexible matching by code, phone, or name
      const isMatchName = o.customerName ? o.customerName.toLowerCase().includes(query) : false;
      return isMatchId || isMatchPhone || isMatchName;
    }

    // For orders from OTHER browsers, require exact Order Code or Full Phone Number match
    return isMatchId || isMatchPhone;
  });

  const getStepProgress = (status: string) => {
    switch (status) {
      case 'pending':
      case 'reviewing':
        return 1;
      case 'printing':
        return 2;
      case 'packaging':
        return 3;
      case 'out_for_delivery':
      case 'ready_for_pickup':
        return 4;
      case 'completed':
        return 5;
      default:
        return 1;
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6">
      
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          متابعة حالة طلبات الطباعة
        </h1>
        <p className="text-slate-600 text-sm mt-2">
          ادخل كود الطلب (مثل A4-SD-9102) أو رقم هاتفك لمشاهدة مراحل الطباعة والتسليم مباشرة
        </p>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-slate-200 mb-8 max-w-2xl mx-auto">
        <div className="relative">
          <Search className="w-5 h-5 text-slate-400 absolute right-3.5 top-3.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="ادخل كود الطلب (مثال: A4-SD-9102) أو رقم هاتف الواتساب..."
            className="w-full pr-11 pl-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none text-slate-900 font-medium text-sm"
          />
        </div>
      </div>

      {/* Orders List */}
      <div className="space-y-6">
        {filteredOrders.length > 0 && (
          <div className="flex items-center justify-between px-2 pb-2 border-b border-slate-200">
            <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
              <Package className="w-4 h-4 text-emerald-600" />
              <span>{query ? `نتائج البحث عن طلباتك (${filteredOrders.length})` : `سجل طلباتك الخاصة`}</span>
              <span className="bg-red-600 text-white font-black text-xs px-2.5 py-0.5 rounded-full shadow-xs">
                {filteredOrders.length} {filteredOrders.length === 1 ? 'طلب' : 'طلبات'}
              </span>
            </h3>
            <span className="bg-emerald-100 text-emerald-950 text-xs font-bold px-2.5 py-0.5 rounded-full border border-emerald-300">
              خاصة بمتصفحك وحسابك 🔒
            </span>
          </div>
        )}

        {filteredOrders.map(order => {
          const statusCfg = getStatusConfig(order.status);
          const currentStep = getStepProgress(order.status);
          const StatusIcon = statusCfg.Icon;

          const locationText = [order.city, order.addressOrCampus, order.institution].filter(Boolean).join(' - ');
          const payMethodLabel = order.paymentMethod === 'bankak' 
            ? 'تحويل بنكك (Bankak)' 
            : order.paymentMethod === 'okash' 
            ? 'تحويل أوكاش (O-CASH)' 
            : order.paymentMethod === 'fawry' 
            ? 'تحويل فوري (Fawry)' 
            : 'دفع نقدي (Cash)';

          return (
            <div 
              key={order.id}
              className={`bg-white rounded-3xl border-2 ${statusCfg.accentBorder} shadow-sm hover:shadow-xl transition-all overflow-hidden mb-8`}
            >
              {/* Order Header Banner */}
              <div className={`bg-gradient-to-r ${statusCfg.headerGradient} text-white p-5 sm:p-6 flex flex-wrap items-center justify-between gap-4 border-b border-slate-700/50`}>
                <div className="flex items-center gap-3.5">
                  <img
                    src={logoImg}
                    alt="A4 SUDAN Logo"
                    referrerPolicy="no-referrer"
                    className="h-12 w-auto rounded-xl shadow-md border-2 border-emerald-400 bg-white"
                  />
                  <div>
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="font-mono text-xl sm:text-2xl font-black text-amber-300 tracking-wider">
                        #{order.id}
                      </span>
                      
                      {/* Colorful Status Badge */}
                      <div className={`flex items-center gap-1.5 text-xs font-black px-3 py-1 rounded-full border shadow-sm ${statusCfg.bgPill}`}>
                        <StatusIcon className="w-4 h-4 shrink-0" />
                        <span>{statusCfg.label}</span>
                      </div>
                    </div>
                    <p className="text-xs text-slate-300 mt-1 font-medium flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-amber-400" />
                      <span>مكتبة A4 Sudan • تاريخ الطلب: {new Date(order.createdAt).toLocaleString('ar-SD')}</span>
                    </p>
                  </div>
                </div>

                <div className="text-right bg-slate-900/60 backdrop-blur-xs px-4 py-2 rounded-2xl border border-slate-700/60 shadow-inner">
                  <span className="text-[11px] font-bold text-slate-400 block">إجمالي القيمة الحسابية:</span>
                  <strong className="text-xl sm:text-2xl font-black text-amber-400 font-mono">
                    {formatSDG(order.totalAmount)}
                  </strong>
                </div>
              </div>

              {/* Progress Bar Timeline */}
              <div className="p-5 sm:p-6 border-b border-slate-100 bg-slate-50/70">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-emerald-600" />
                    <span>خطوات وتتبع تجهيز الطباعة:</span>
                  </h4>
                  <span className="text-xs font-bold text-slate-500">
                    المرحلة ({currentStep > 5 ? 5 : currentStep} من 5)
                  </span>
                </div>

                {/* Step Indicators with Colorful Icons */}
                <div className="grid grid-cols-5 text-center text-[10px] sm:text-xs font-bold relative gap-1">
                  
                  {/* Step 1 */}
                  <div className="flex flex-col items-center gap-1.5 z-10">
                    <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-2xl flex items-center justify-center font-black transition-all shadow-sm ${
                      currentStep >= 1 ? 'bg-amber-500 text-white shadow-amber-200' : 'bg-slate-200 text-slate-400'
                    }`}>
                      <FileCheck2 className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                    <span className={currentStep >= 1 ? 'text-slate-900 font-black' : 'text-slate-400'}>استلام الطلب</span>
                  </div>

                  {/* Step 2 */}
                  <div className="flex flex-col items-center gap-1.5 z-10">
                    <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-2xl flex items-center justify-center font-black transition-all shadow-sm ${
                      currentStep >= 2 ? 'bg-indigo-600 text-white shadow-indigo-200' : 'bg-slate-200 text-slate-400'
                    }`}>
                      <Printer className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                    <span className={currentStep >= 2 ? 'text-slate-900 font-black' : 'text-slate-400'}>الطباعة الرقمية</span>
                  </div>

                  {/* Step 3 */}
                  <div className="flex flex-col items-center gap-1.5 z-10">
                    <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-2xl flex items-center justify-center font-black transition-all shadow-sm ${
                      currentStep >= 3 ? 'bg-purple-600 text-white shadow-purple-200' : 'bg-slate-200 text-slate-400'
                    }`}>
                      <Package className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                    <span className={currentStep >= 3 ? 'text-slate-900 font-black' : 'text-slate-400'}>التغليف والقص</span>
                  </div>

                  {/* Step 4 */}
                  <div className="flex flex-col items-center gap-1.5 z-10">
                    <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-2xl flex items-center justify-center font-black transition-all shadow-sm ${
                      currentStep >= 4 ? 'bg-teal-600 text-white shadow-teal-200' : 'bg-slate-200 text-slate-400'
                    }`}>
                      {order.deliveryMethod === 'pickup' ? (
                        <Building2 className="w-4 h-4 sm:w-5 sm:h-5" />
                      ) : (
                        <Truck className="w-4 h-4 sm:w-5 sm:h-5" />
                      )}
                    </div>
                    <span className={currentStep >= 4 ? 'text-slate-900 font-black' : 'text-slate-400'}>
                      {order.deliveryMethod === 'pickup' ? 'جاهز بالفرع' : 'مع المندوب'}
                    </span>
                  </div>

                  {/* Step 5 */}
                  <div className="flex flex-col items-center gap-1.5 z-10">
                    <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-2xl flex items-center justify-center font-black transition-all shadow-sm ${
                      currentStep >= 5 ? 'bg-emerald-600 text-white shadow-emerald-200' : 'bg-slate-200 text-slate-400'
                    }`}>
                      <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                    <span className={currentStep >= 5 ? 'text-slate-900 font-black' : 'text-slate-400'}>تم التسليم</span>
                  </div>

                </div>

                {/* Status Explanation Callout Banner */}
                <div className={`mt-5 p-4 rounded-2xl border flex items-start gap-3.5 shadow-xs ${statusCfg.calloutBg}`}>
                  <div className={`p-2.5 rounded-xl ${statusCfg.iconBg} shrink-0`}>
                    <StatusIcon className="w-5 h-5" />
                  </div>
                  <div className="text-xs leading-relaxed space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <strong className="text-sm font-black">{statusCfg.label}</strong>
                      <span className="text-[11px] font-bold opacity-80">({statusCfg.description})</span>
                    </div>
                    <div className="flex items-center gap-1.5 font-bold text-amber-900 mt-1.5 bg-amber-100/90 px-3 py-1 rounded-lg border border-amber-300 w-fit shadow-2xs">
                      <Clock className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                      <span>موعد التسليم المتوقع: <strong>{getEstimatedDeliveryText(order)}</strong></span>
                    </div>
                  </div>
                </div>

              </div>

              {/* Order Details Grid */}
              <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6 text-xs text-slate-800">
                
                {/* Box 1: Customer & Address */}
                <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200/80 space-y-3">
                  <h5 className="font-black text-slate-900 text-xs border-b border-slate-200 pb-2 flex items-center gap-1.5">
                    <UserIcon className="w-4 h-4 text-emerald-600" />
                    <span>بيانات الطالب / العميل:</span>
                  </h5>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500 font-bold shrink-0">اسم العميل:</span>
                      <strong className="text-slate-900 font-bold text-sm">{order.customerName}</strong>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                      <span className="text-slate-500 font-bold shrink-0">أرقام التواصل:</span>
                      <strong className="text-slate-900 font-mono font-bold">
                        {order.customerPhone} {order.customerPhone2 ? ` / ${order.customerPhone2}` : ''}
                      </strong>
                    </div>
                    <div className="flex items-start gap-2">
                      <MapPin className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="text-slate-500 font-bold block">العنوان والتوصيل:</span>
                        <strong className="text-slate-900 font-bold leading-relaxed">{locationText || 'تسليم بالفرع'}</strong>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Box 2: Payment & Financial Reference */}
                <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200/80 space-y-3">
                  <h5 className="font-black text-slate-900 text-xs border-b border-slate-200 pb-2 flex items-center gap-1.5">
                    <CreditCard className="w-4 h-4 text-emerald-600" />
                    <span>تفاصيل الدفع المالي:</span>
                  </h5>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-bold">طريقة الدفع:</span>
                      <strong className="text-slate-900 font-bold bg-white px-2.5 py-0.5 rounded-lg border border-slate-200">
                        {payMethodLabel}
                      </strong>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-bold">حالة الاعتماد:</span>
                      <span className={`font-bold px-2.5 py-0.5 rounded-lg border ${
                        order.paymentStatus === 'verified' 
                          ? 'bg-emerald-100 text-emerald-900 border-emerald-300' 
                          : 'bg-amber-100 text-amber-900 border-amber-300'
                      }`}>
                        {order.paymentStatus === 'verified' ? 'مؤكد ومعتمد ✓' : 'قيد التأكيد والمراجعة ⏳'}
                      </span>
                    </div>

                    {order.bankakTransactionId && (
                      <div className="pt-1">
                        <span className="text-slate-500 font-bold block mb-1">رقم الإشعار المرجعي:</span>
                        <div className="flex items-center justify-between bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 font-mono text-emerald-950 font-black">
                          <span>{order.bankakTransactionId}</span>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(order.bankakTransactionId || '');
                              alert('تم نسخ رقم الإشعار!');
                            }}
                            className="text-emerald-700 hover:text-emerald-900 cursor-pointer"
                            title="نسخ رقم الإشعار"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    )}

                    {order.bankakProofUrl && (
                      <div className="pt-2 border-t border-slate-200">
                        <span className="text-slate-700 font-bold text-[11px] block mb-1.5 flex items-center gap-1">
                          <ImageIcon className="w-3.5 h-3.5 text-emerald-600" />
                          معاينة إشعار التحويل المرفق:
                        </span>
                        <img 
                          src={order.bankakProofUrl} 
                          alt="صورة إشعار التحويل" 
                          className="w-20 h-20 object-cover rounded-xl border-2 border-emerald-400 shadow-xs cursor-pointer hover:scale-105 transition-transform bg-white"
                          onClick={() => setSelectedProofImage(order.bankakProofUrl!)}
                          title="انقر لتكبير صورة الإشعار"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Box 3: Printed Files Details */}
                <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200/80 space-y-3">
                  <h5 className="font-black text-slate-900 text-xs border-b border-slate-200 pb-2 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-emerald-600" />
                      <span>الملفات والمستندات ({order.files ? order.files.length : 0}):</span>
                    </span>
                    {order.totalPages && (
                      <span className="bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full font-bold text-[10px] border border-amber-300">
                        إجمالي {order.totalPages} صفحة
                      </span>
                    )}
                  </h5>

                  <ul className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {order.files && order.files.map((file, idx) => (
                      <li key={idx} className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-black text-slate-900 truncate" title={file.fileName}>
                            {idx + 1}. {file.fileName}
                          </span>
                          {file.calculatedPrice && (
                            <span className="bg-emerald-50 text-emerald-950 font-black font-mono text-[11px] px-2 py-0.5 rounded-lg border border-emerald-200 shrink-0">
                              {formatSDG(file.calculatedPrice)}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-slate-600 flex-wrap">
                          <span className="bg-slate-100 px-1.5 py-0.5 rounded font-bold text-slate-800">
                            {file.pageCount} صفحة
                          </span>
                          <span className="bg-slate-100 px-1.5 py-0.5 rounded font-bold text-slate-800">
                            {file.copies} {file.copies === 1 ? 'نسخة' : 'نسخ'}
                          </span>
                          <span className="bg-slate-100 px-1.5 py-0.5 rounded font-bold text-slate-800">
                            {file.color === 'color' ? 'ملون 🎨' : file.color === 'mixed' ? 'غلاف ألوان / محتوى أسود' : 'أسود/أبيض 📑'}
                          </span>
                          {file.binding !== 'none' && (
                            <span className="bg-amber-50 text-amber-900 px-1.5 py-0.5 rounded font-bold border border-amber-200">
                              تغليف سلك/تجليد
                            </span>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>

              </div>

              {/* Footer Actions */}
              <div className="p-4 bg-slate-100/80 border-t border-slate-200 flex flex-wrap justify-between items-center gap-3 text-xs">
                <span className="text-slate-600 font-bold flex items-center gap-1.5">
                  <Info className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>لأي استفسار أو تعديل في الطلب، فريق خدمة العملاء متواجد على مدار الساعة.</span>
                </span>

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => setPrintOrderSlip(order)}
                    className="bg-slate-900 hover:bg-slate-950 text-white font-bold px-4 py-2.5 rounded-xl flex items-center gap-1.5 transition-all shadow-sm cursor-pointer border border-slate-800 hover:scale-[1.02] active:scale-[0.98]"
                    title="طباعة إيصال أو بوليصة الطلب كملف PDF"
                  >
                    <Printer className="w-4 h-4 text-amber-300" />
                    <span>إيصال PDF / طباعة 🖨️</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleCopyOrderDetails(order)}
                    className="bg-amber-400 hover:bg-amber-500 text-amber-950 font-black px-4 py-2.5 rounded-xl flex items-center gap-1.5 transition-all shadow-sm cursor-pointer border border-amber-300 hover:scale-[1.02] active:scale-[0.98]"
                    title="نسخ ملخص تفاصيل الطلب لمشاركتها"
                  >
                    {copiedOrderId === order.id ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-950" />
                        <span>تم النسخ! ✅</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        <span>نسخ التفاصيل 📋</span>
                      </>
                    )}
                  </button>

                  <a
                    href={`https://wa.me/249119636365?text=${encodeURIComponent(`مرحباً مكتبة A4 Sudan، أستفسر عن طلب الطباعة رقم: ${order.id}`)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2.5 rounded-xl flex items-center gap-1.5 transition-colors shadow-sm hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <Phone className="w-4 h-4" />
                    <span>مراسلة بالواتساب</span>
                  </a>
                </div>
              </div>

            </div>
          );
        })}

        {filteredOrders.length === 0 && (
          <div className="text-center py-12 px-6 bg-white rounded-3xl border border-slate-200 shadow-sm max-w-xl mx-auto space-y-4">
            <div className="bg-emerald-50 text-emerald-800 p-4 rounded-2xl w-16 h-16 mx-auto flex items-center justify-center font-bold shadow-inner">
              <Package className="w-8 h-8 text-emerald-700" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900">
                {query ? 'لم نجد أي طلب يطابق هذا الكود أو الرقم' : 'تتبع طلبك الخاص بحماية وخصوصية عالية 🔒'}
              </h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed font-medium">
                {query
                  ? 'يرجى التأكد من كتابة كود الطلب الصحيح (مثال: A4-SD-9102) أو رقم الهاتف المستخدم عند إرسال الطلب.'
                  : 'لحماية خصوصية بيانات جميع العملاء، يرجى كتابة كود الطلب الخاص بك أو رقم هاتفك في مربع البحث أعلاه لمتابعة حالة طباعة وتوصيل شيتاتك.'
                }
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Proof Image Viewer Modal */}
      {selectedProofImage && (
        <div 
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={() => setSelectedProofImage(null)}
        >
          <div className="relative max-w-2xl w-full bg-white rounded-2xl overflow-hidden p-3 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center pb-2 border-b border-slate-200 mb-2">
              <h4 className="font-bold text-slate-900 text-sm">صورة إشعار التحويل المرفقة</h4>
              <button 
                onClick={() => setSelectedProofImage(null)}
                className="p-1 rounded-full hover:bg-slate-100 text-slate-500 hover:text-slate-900"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <img 
              src={selectedProofImage} 
              alt="معاينة إشعار التحويل" 
              className="w-full h-auto max-h-[80vh] object-contain rounded-xl bg-slate-50"
            />
          </div>
        </div>
      )}

      {/* Order Slip / Invoice Modal */}
      <OrderSlipModal
        order={printOrderSlip}
        onClose={() => setPrintOrderSlip(null)}
      />

    </div>
  );
};
