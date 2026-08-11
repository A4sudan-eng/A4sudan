import React, { useState } from 'react';
import { Search, Package, Clock, CheckCircle2, Truck, Phone, AlertCircle, FileText, Download, ExternalLink, Image as ImageIcon, X, Cloud, LogIn, User as UserIcon, Copy, Check, Printer } from 'lucide-react';
import { User } from 'firebase/auth';
import { PrintOrder } from '../types';
import { getStatusBadgeInfo, formatSDG } from '../utils/pricing';
import logoImg from '../assets/images/a4_sudan_green_logo_1785943554845.jpg';
import { OrderSlipModal } from './OrderSlipModal';

interface OrderTrackerProps {
  orders: PrintOrder[];
  onRefreshOrders?: () => void;
  currentUser?: User | null;
  onOpenAuthModal?: () => void;
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
📞 *رقم الهاتف:* ${order.customerPhone}
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
      (Boolean(myPhone) && o.customerPhone && o.customerPhone.trim() === myPhone);

    // 2. If NO search query is typed: show ONLY orders created on this browser/account
    if (!query) {
      return isOwnBrowserOrder;
    }

    // 3. If a search query IS typed:
    const cleanPhone = (o.customerPhone || '').replace(/\D/g, '');
    
    // Check match by Order Code (e.g., A4-SD-9102 or 9102)
    const isMatchId = o.id.toLowerCase() === query || 
                       o.id.toLowerCase().includes(query) || 
                       (cleanQuery.length >= 3 && o.id.toLowerCase().includes(cleanQuery));
    
    // Check match by Phone Number (full or substantial phone number)
    const isMatchPhone = (cleanQuery.length >= 6 && cleanPhone.includes(cleanQuery)) || 
                         (o.customerPhone && o.customerPhone.trim() === rawQuery);

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
        {filteredOrders.map(order => {
          const badge = getStatusBadgeInfo(order.status);
          const currentStep = getStepProgress(order.status);

          return (
            <div 
              key={order.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all overflow-hidden"
            >
              {/* Order Header */}
              <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-emerald-900 text-white p-4 sm:p-6 flex flex-wrap items-center justify-between gap-4 border-b border-emerald-500/40">
                <div className="flex items-center gap-3">
                  <img
                    src={logoImg}
                    alt="A4 SUDAN Logo"
                    referrerPolicy="no-referrer"
                    className="h-12 w-auto rounded-xl shadow-md border border-emerald-400"
                  />
                  <div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xl sm:text-2xl font-black text-emerald-300 tracking-wider">
                        #{order.id}
                      </span>
                      <span className={`text-xs font-bold px-3 py-1 rounded-full border ${badge.bgClass} ${badge.textClass}`}>
                        {badge.label}
                      </span>
                    </div>
                    <p className="text-xs text-emerald-200/80 mt-1 font-sans">
                      مكتبة A4 Sudan • تاريخ الطلب: {new Date(order.createdAt).toLocaleString('ar-SD')}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs text-slate-400 block">المبلغ الإجمالي:</span>
                  <strong className="text-lg sm:text-xl font-bold text-amber-400">
                    {formatSDG(order.totalAmount)}
                  </strong>
                </div>
              </div>

              {/* Progress Bar Timeline */}
              <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                <h4 className="text-xs font-bold text-slate-600 uppercase mb-4">
                  مراحل تجهيز الطباعة:
                </h4>

                <div className="grid grid-cols-5 text-center text-[10px] sm:text-xs font-bold relative">
                  
                  {/* Step 1 */}
                  <div className="flex flex-col items-center gap-1.5 z-10">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                      currentStep >= 1 ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-500'
                    }`}>
                      1
                    </div>
                    <span className={currentStep >= 1 ? 'text-slate-900' : 'text-slate-400'}>استلام الطلب</span>
                  </div>

                  {/* Step 2 */}
                  <div className="flex flex-col items-center gap-1.5 z-10">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                      currentStep >= 2 ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-500'
                    }`}>
                      2
                    </div>
                    <span className={currentStep >= 2 ? 'text-slate-900' : 'text-slate-400'}>جاري الطباعة</span>
                  </div>

                  {/* Step 3 */}
                  <div className="flex flex-col items-center gap-1.5 z-10">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                      currentStep >= 3 ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-500'
                    }`}>
                      3
                    </div>
                    <span className={currentStep >= 3 ? 'text-slate-900' : 'text-slate-400'}>التغليف والقص</span>
                  </div>

                  {/* Step 4 */}
                  <div className="flex flex-col items-center gap-1.5 z-10">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                      currentStep >= 4 ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-500'
                    }`}>
                      4
                    </div>
                    <span className={currentStep >= 4 ? 'text-slate-900' : 'text-slate-400'}>جاري التوصيل</span>
                  </div>

                  {/* Step 5 */}
                  <div className="flex flex-col items-center gap-1.5 z-10">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                      currentStep >= 5 ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-500'
                    }`}>
                      5
                    </div>
                    <span className={currentStep >= 5 ? 'text-slate-900' : 'text-slate-400'}>تم التسليم</span>
                  </div>

                </div>
              </div>

              {/* Details Content */}
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                
                {/* Customer & Delivery */}
                <div className="space-y-2 text-slate-700">
                  <p>العميل: <strong className="text-slate-900">{order.customerName}</strong></p>
                  <p>الهاتف: <strong className="text-slate-900 font-mono">{order.customerPhone}</strong></p>
                  <p>العنوان/الجامعة: <strong className="text-slate-900">{order.addressOrCampus} ({order.city})</strong></p>
                  {order.estimatedCompletionTime && (
                    <p className="text-amber-800 font-semibold bg-amber-50 p-2 rounded-lg border border-amber-200 text-xs">
                      🕒 موعد التسليم المتوقع: {order.estimatedCompletionTime}
                    </p>
                  )}
                </div>

                {/* Payment & Files */}
                <div className="space-y-2 text-slate-700">
                  <p>طريقة الدفع: <strong className="text-slate-900">
                    {order.paymentMethod === 'bankak' 
                      ? 'تحويل بنكك (Bankak)' 
                      : order.paymentMethod === 'okash' 
                      ? 'تحويل أوكاش (O-CASH)' 
                      : 'تحويل فوري (Fawry)'}
                  </strong></p>
                  {order.bankakTransactionId && (
                    <p>رقم الإشعار / العملية المرجعي: <strong className="text-emerald-800 font-mono bg-emerald-50 px-2 py-0.5 rounded">{order.bankakTransactionId}</strong></p>
                  )}
                  {order.bankakProofUrl && (
                    <div className="mt-2 pt-2 border-t border-slate-200">
                      <span className="block text-xs font-bold text-slate-800 mb-1 flex items-center gap-1">
                        <ImageIcon className="w-3.5 h-3.5 text-emerald-600" />
                        صورة إشعار التحويل:
                      </span>
                      <img 
                        src={order.bankakProofUrl} 
                        alt="إشعار التحويل" 
                        className="w-24 h-24 object-cover rounded-xl border border-emerald-300 shadow-sm cursor-pointer hover:opacity-90 transition-opacity bg-white"
                        onClick={() => setSelectedProofImage(order.bankakProofUrl!)}
                        title="اضغط لتكبير صورة الإشعار"
                      />
                    </div>
                  )}
                  <div>
                    <span className="block font-semibold mb-1">الملفات المرفقة ({order.files.length}):</span>
                    <ul className="space-y-1.5 text-xs text-slate-600">
                      {order.files.map((f, i) => (
                        <li key={i} className="flex flex-wrap items-center justify-between gap-2 bg-slate-50 p-2 rounded-lg border border-slate-200">
                          <div className="flex items-center gap-2 truncate">
                            <FileText className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                            <span className="truncate font-medium text-slate-900">{f.fileName}</span>
                          </div>
                          <div className="flex items-center gap-2 text-[11px] text-slate-700 shrink-0 font-bold">
                            <span className="bg-slate-100 px-2 py-0.5 rounded border border-slate-300 text-slate-900">
                              عدد النسخ: <strong className="text-slate-950 font-black">{f.copies} عدد</strong>
                            </span>
                            {f.calculatedPrice && (
                              <span className="bg-emerald-100 text-emerald-950 font-mono font-black px-2 py-0.5 rounded border border-emerald-300">
                                {formatSDG(f.calculatedPrice)}
                              </span>
                            )}
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

              </div>

              {/* Footer Buttons */}
              <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap justify-between items-center gap-3 text-xs">
                <span className="text-slate-500">
                  لأي استفسار بخصوص هذا الطلب تواصل مباشرة مع فريق المكتبة
                </span>

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => setPrintOrderSlip(order)}
                    className="bg-slate-900 hover:bg-slate-950 text-white font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-all shadow-xs cursor-pointer border border-slate-800"
                    title="طباعة بوليصة وإيصال الطلب كـ PDF أو ورقة الملصق"
                  >
                    <Printer className="w-4 h-4 text-amber-300" />
                    <span>طباعة / تنزيل PDF 🖨️</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleCopyOrderDetails(order)}
                    className="bg-amber-400 hover:bg-amber-500 text-amber-950 font-black px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-all shadow-xs cursor-pointer border border-amber-300"
                    title="نسخ ملخص تفاصيل الطلب لمشاركتها عبر الواتساب أو التطبيقات"
                  >
                    {copiedOrderId === order.id ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-950" />
                        <span>تم نسخ البيانات! ✅</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        <span>نسخ تفاصيل الطلب 📋</span>
                      </>
                    )}
                  </button>

                  <a
                    href={`https://wa.me/249119636365?text=${encodeURIComponent(`مرحباً مكتبة A4 Sudan، أستفسر عن طلب الطباعة رقم: ${order.id}`)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl flex items-center gap-1.5 transition-colors shadow-xs"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>تواصل عبر الواتساب</span>
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
