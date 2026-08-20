import { PrintFileOptions, PricingRates, PaperSize, PrintColor, PrintSides, PaperWeight, BindingType } from '../types';

export function calculateFilePrice(
  pages: number,
  color: PrintColor,
  paperSize: PaperSize,
  sides: PrintSides,
  paperWeight: PaperWeight,
  binding: BindingType,
  copies: number,
  rates: PricingRates,
  pagesPerSheet: number = 2
): number {
  if (pages <= 0 || copies <= 0) return 0;

  // pps: pages printed per physical sheet layout (2:1 العادي = 2, 4:1 الشائع = 4, 8:1 الاسلايت = 8)
  const pps = pagesPerSheet && pagesPerSheet > 0 ? pagesPerSheet : 2;
  // Effective physical paper sheets count
  const effectiveSheets = Math.ceil(pages / pps);

  // Price per physical sheet (سعر الورقة المطبوعة)
  const bwRate = rates.bwPerPage || 200;
  const colorRate = rates.colorPerPage || 500;

  let baseSheetRate = bwRate;
  if (color === 'color') {
    baseSheetRate = colorRate;
  } else if (color === 'mixed') {
    // Mixed: 1 cover sheet in color + rest body sheets B&W
    const coverSheets = Math.min(1, effectiveSheets);
    const bodySheets = Math.max(0, effectiveSheets - coverSheets);
    const mixedSheetCost = (coverSheets * colorRate) + (bodySheets * bwRate);
    baseSheetRate = mixedSheetCost / effectiveSheets;
  }

  // Size multiplier
  const sizeMult = rates.paperSizeMultiplier[paperSize] || 1.0;

  // Double sides multiplier
  const sidesMult = sides === 'double' ? (rates.sidesDiscountRatio || 1.0) : 1.0;

  // Paper weight extra per sheet
  const weightExtra = rates.paperWeightPrice[paperWeight] || 0;

  // Cost per physical paper sheet
  const singleSheetCost = (baseSheetRate * sizeMult * sidesMult) + weightExtra;

  // Total paper sheets cost for 1 copy
  const pagesCostOneCopy = Math.round(singleSheetCost * effectiveSheets);

  // Binding cost
  const bindingCostOneCopy = rates.bindingPrice[binding] || 0;

  // Total per copy
  const totalPerCopy = pagesCostOneCopy + bindingCostOneCopy;

  // Grand total for all copies
  const grandTotal = totalPerCopy * copies;

  return Math.round(grandTotal);
}

export function formatSDG(amount: number): string {
  return `${amount.toLocaleString('ar-SD')} ج.س`;
}

export function getStatusBadgeInfo(status: string): { label: string; bgClass: string; textClass: string } {
  switch (status) {
    case 'pending':
      return { label: 'جديد (في الانتظار)', bgClass: 'bg-amber-100', textClass: 'text-amber-800 border-amber-300' };
    case 'reviewing':
      return { label: 'جاري المراجعة', bgClass: 'bg-blue-100', textClass: 'text-blue-800 border-blue-300' };
    case 'printing':
      return { label: 'جاري الطباعة 🖨️', bgClass: 'bg-indigo-100', textClass: 'text-indigo-800 border-indigo-300' };
    case 'packaging':
      return { label: 'جاري التغليف 📦', bgClass: 'bg-purple-100', textClass: 'text-purple-800 border-purple-300' };
    case 'out_for_delivery':
      return { label: 'مع المندوب للتوصيل 🛵', bgClass: 'bg-teal-100', textClass: 'text-teal-800 border-teal-300' };
    case 'ready_for_pickup':
      return { label: 'جاهز للاستلام بالمكتبة 🏪', bgClass: 'bg-emerald-100', textClass: 'text-emerald-800 border-emerald-300' };
    case 'completed':
      return { label: 'تم التسليم بنجاح ✅', bgClass: 'bg-emerald-100', textClass: 'text-emerald-800 border-emerald-300' };
    case 'cancelled':
      return { label: 'ملغي ❌', bgClass: 'bg-rose-100', textClass: 'text-rose-800 border-rose-300' };
    default:
      return { label: status, bgClass: 'bg-gray-100', textClass: 'text-gray-800 border-gray-300' };
  }
}

export function getEstimatedDeliveryText(order: { 
  createdAt?: string; 
  totalPages?: number; 
  files?: any[]; 
  deliveryMethod?: string; 
  status?: string; 
  estimatedCompletionTime?: string 
}): string {
  if (order.estimatedCompletionTime && order.estimatedCompletionTime.trim() !== '') {
    return order.estimatedCompletionTime;
  }
  
  if (order.status === 'completed') {
    return 'تم التسليم بنجاح ✅';
  }
  if (order.status === 'cancelled') {
    return 'طلب ملغي ❌';
  }
  if (order.status === 'ready_for_pickup') {
    return 'جاهز للاستلام الآن بالمكتبة 🏪';
  }

  return 'جاري تحديد موعد الاستلام بعد الطلب';
}

