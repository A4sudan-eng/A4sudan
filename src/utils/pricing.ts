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
  pagesPerSheet: number = 1
): number {
  if (pages <= 0 || copies <= 0) return 0;

  const pps = pagesPerSheet && pagesPerSheet > 0 ? pagesPerSheet : 1;
  const effectiveSheets = Math.ceil(pages / pps);

  // Base page rate
  let basePageRate = rates.bwPerPage;
  if (color === 'color') {
    basePageRate = rates.colorPerPage;
  } else if (color === 'mixed') {
    // Mixed: 2 pages color cover + rest B&W
    const coverPages = Math.min(2, pages);
    const bodyPages = Math.max(0, pages - coverPages);
    const mixedPageCost = (coverPages * rates.colorPerPage) + (bodyPages * rates.bwPerPage);
    basePageRate = mixedPageCost / pages;
  }

  // Size multiplier
  const sizeMult = rates.paperSizeMultiplier[paperSize] || 1.0;

  // Double sides discount
  const sidesMult = sides === 'double' ? rates.sidesDiscountRatio : 1.0;

  // Paper weight extra per page
  const weightExtra = rates.paperWeightPrice[paperWeight] || 0;

  // Cost per physical sheet/side
  const singlePageCost = (basePageRate * sizeMult * sidesMult) + weightExtra;

  // Total pages cost for 1 copy based on effective physical sheets
  const pagesCostOneCopy = Math.round(singlePageCost * effectiveSheets);

  // Binding cost
  const bindingCostOneCopy = rates.bindingPrice[binding] || 0;

  // Total per copy
  const totalPerCopy = pagesCostOneCopy + bindingCostOneCopy;

  // Total for all copies
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
