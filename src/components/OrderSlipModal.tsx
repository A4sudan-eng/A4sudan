import React from 'react';
import { X, Printer, FileText, UserCheck, MapPin, Phone, Building2, Truck, CheckCircle2, Clock, Scissors } from 'lucide-react';
import { PrintOrder } from '../types';

interface OrderSlipModalProps {
  order: PrintOrder | null;
  onClose: () => void;
}

export const OrderSlipModal: React.FC<OrderSlipModalProps> = ({ order, onClose }) => {
  if (!order) return null;

  const formatSDG = (amount: number) => {
    return new Intl.NumberFormat('ar-SD', { style: 'currency', currency: 'SDG', maximumFractionDigits: 0 }).format(amount);
  };

  const handlePrint = () => {
    window.print();
  };

  const uniqueNotes = Array.from(new Set(order.files.map(f => f.notes).filter(Boolean)));

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-3 sm:p-6 backdrop-blur-sm overflow-y-auto no-print-backdrop"
      onClick={onClose}
    >
      {/* Print Stylesheet injection */}
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #printable-order-slip, #printable-order-slip * {
            visibility: visible !important;
          }
          #printable-order-slip {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 24px !important;
            box-shadow: none !important;
            border: 2px solid #000 !important;
            border-radius: 8px !important;
            background: white !important;
            color: black !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div 
        className="relative max-w-2xl w-full bg-white rounded-2xl overflow-hidden shadow-2xl flex flex-col my-auto border border-slate-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Top Modal Controls bar (Hidden on Print) */}
        <div className="no-print bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Printer className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-sm sm:text-base">بوليصة شحن وتمرير كيس الطلب (# {order.id})</h3>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="bg-amber-400 hover:bg-amber-500 text-slate-950 font-black px-4 py-1.5 rounded-lg text-xs flex items-center gap-1.5 shadow transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>طباعة / حفظ كـ PDF 🖨️</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* PRINTABLE SLIP CONTENT */}
        <div id="printable-order-slip" className="p-6 bg-white text-slate-900 dir-rtl space-y-5">
          {/* Slip Header */}
          <div className="border-b-2 border-slate-900 pb-4 flex justify-between items-start gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-xl text-emerald-800">A4 Sudan</span>
                <span className="bg-emerald-900 text-white font-black text-[10px] px-2 py-0.5 rounded">خدمات الطباعة الجامعة</span>
              </div>
              <h2 className="text-lg font-black text-slate-900 mt-1">بوليصة تسليم الشيتات / ملصق كيس الطلب</h2>
              <p className="text-xs text-slate-600 font-medium mt-0.5">
                تاريخ الطلب: {new Date(order.createdAt).toLocaleDateString('ar-SD')} | {new Date(order.createdAt).toLocaleTimeString('ar-SD', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>

            <div className="text-left dir-ltr">
              <div className="border-2 border-slate-900 px-3.5 py-1.5 rounded-xl text-center bg-slate-50">
                <span className="block text-[10px] text-slate-600 font-bold uppercase">كود الطلب ORDER ID</span>
                <strong className="text-xl font-black text-slate-950 font-mono">#{order.id}</strong>
              </div>
              <div className="mt-1 text-[10px] text-slate-500 text-center font-bold">
                {order.status === 'completed' ? '✅ مكتمل ومسدد' : '⏳ قيد التجهيز والطباعة'}
              </div>
            </div>
          </div>

          {/* Customer & Shipping Information Grid */}
          <div className="bg-slate-50 border-2 border-slate-300 rounded-xl p-4 space-y-3">
            <h3 className="font-black text-sm text-slate-900 border-b border-slate-300 pb-2 flex items-center gap-1.5">
              <UserCheck className="w-4 h-4 text-emerald-800" />
              <span>بيانات العميل والتسليم:</span>
            </h3>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="space-y-1">
                <span className="text-slate-500 font-bold block">👤 اسم الطالب / العميل:</span>
                <strong className="text-slate-950 font-black text-sm block">{order.customerName}</strong>
              </div>

              <div className="space-y-1">
                <span className="text-slate-500 font-bold block">📞 رقم الواتساب / الهاتف:</span>
                <strong className="text-slate-950 font-black text-sm font-mono block dir-ltr text-right">{order.customerPhone}</strong>
              </div>

              <div className="space-y-1">
                <span className="text-slate-500 font-bold block">🏛️ الجامعة والكلية:</span>
                <span className="text-slate-900 font-bold block">
                  {order.institution || 'جامعة النيلين'} {order.specialization ? `- ${order.specialization}` : ''}
                </span>
              </div>

              <div className="space-y-1">
                <span className="text-slate-500 font-bold block">🚚 طريقة التسليم:</span>
                <strong className="text-emerald-900 font-black block">
                  {order.deliveryMethod === 'pickup' ? 'استلام شخصي من المكتبة' : `توصيل إلى ${order.city}`}
                </strong>
              </div>

              <div className="col-span-2 space-y-1 bg-white p-2.5 rounded-lg border border-slate-200">
                <span className="text-slate-500 font-bold block">📍 العنوان التفصيلي / المجمع:</span>
                <strong className="text-slate-900 font-bold block text-xs sm:text-sm">{order.addressOrCampus}</strong>
              </div>
            </div>
          </div>

          {/* Printed Files Table */}
          <div className="space-y-2">
            <h3 className="font-black text-sm text-slate-900 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-emerald-800" />
              <span>محتويات كيس الطلب ({order.files.length} مادة / شيت):</span>
            </h3>

            <table className="w-full text-right border-collapse text-xs">
              <thead>
                <tr className="bg-slate-900 text-white font-bold border border-slate-900">
                  <th className="p-2 w-8 text-center border-l border-slate-700">#</th>
                  <th className="p-2 border-l border-slate-700">اسم الشيت / المادة</th>
                  <th className="p-2 w-20 text-center border-l border-slate-700">العدد</th>
                  <th className="p-2 w-32 border-l border-slate-700">خيارات الطباعة</th>
                  <th className="p-2 w-24 text-left">السعر</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-300 border border-slate-300">
                {order.files.map((file, idx) => (
                  <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                    <td className="p-2 text-center font-bold border-l border-slate-300">{idx + 1}</td>
                    <td className="p-2 font-black text-slate-900 border-l border-slate-300">{file.fileName}</td>
                    <td className="p-2 text-center font-black text-emerald-950 bg-emerald-50 border-l border-slate-300">
                      {file.copies} عدد
                    </td>
                    <td className="p-2 text-slate-700 font-medium text-[11px] border-l border-slate-300">
                      {file.color === 'color' ? 'ملون' : 'أسود'} | {file.sides === 'double' ? 'وجهين' : 'وجه'} | {file.binding === 'stapled' ? 'دبوس' : file.binding === 'spiral_plastic' ? 'سلك حلزوني' : file.binding === 'softcover' ? 'تغليف عادي' : file.binding === 'hardcover_leather' ? 'تغليف جلد' : 'بدون'}
                    </td>
                    <td className="p-2 font-mono font-black text-left text-slate-900">
                      {formatSDG(file.calculatedPrice)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Unified Order Notes if present */}
          {uniqueNotes.length > 0 && (
            <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-3 text-xs text-amber-950 space-y-1">
              <span className="font-extrabold text-amber-900 block">📌 ملاحظات إضافية وتوصيات الطباعة:</span>
              <p className="font-medium text-slate-900">{uniqueNotes.join(' || ')}</p>
            </div>
          )}

          {/* Payment & Financial Summary Footer */}
          <div className="border-t-2 border-slate-900 pt-3 flex flex-wrap justify-between items-center gap-3">
            <div>
              <span className="text-xs text-slate-600 font-bold block">طريقة وموقف الدفع:</span>
              <span className="font-black text-sm text-slate-900">
                {order.paymentMethod === 'bankak' ? 'تحويل بنكك (Bankak)' : order.paymentMethod === 'okash' ? 'أوكاش (O-CASH)' : 'فوري (Fawry)'}
                {order.bankakTransactionId ? ` - مرجع: ${order.bankakTransactionId}` : ''}
              </span>
            </div>

            <div className="bg-slate-900 text-white px-4 py-2 rounded-xl text-left">
              <span className="text-[11px] text-slate-300 block font-bold">إجمالي المبلغ الحسابي:</span>
              <strong className="text-lg font-black text-amber-300">{formatSDG(order.totalAmount)}</strong>
            </div>
          </div>

          {/* Bottom Cut Line */}
          <div className="pt-2 border-t border-dashed border-slate-400 flex items-center justify-between text-[11px] text-slate-500 font-medium">
            <span className="flex items-center gap-1">
              <Scissors className="w-3.5 h-3.5" />
              <span>ضع هذه البوليصة داخل أو على كيس الشيتات الخاص بالعميل</span>
            </span>
            <span>A4 Sudan - 0119636365</span>
          </div>
        </div>

        {/* Modal Bottom Print Button (Hidden on Print) */}
        <div className="no-print bg-slate-100 px-5 py-3 border-t border-slate-200 flex justify-between items-center text-xs">
          <span className="text-slate-600 font-medium">
            يمكنك طباعة هذه البوليصة أو حفظها كملف PDF بواسطة متصفحك.
          </span>

          <button
            type="button"
            onClick={handlePrint}
            className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-4 py-2 rounded-xl flex items-center gap-2 shadow-sm transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4 text-amber-300" />
            <span>طباعة البوليصة الآن 🖨️</span>
          </button>
        </div>
      </div>
    </div>
  );
};
