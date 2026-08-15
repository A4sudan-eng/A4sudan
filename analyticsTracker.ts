import { PrintOrder, StudySheet, VisitorRecord, AnalyticsSummary, DayStatItem, UniversityStatItem, OrderStatus, BindingType } from '../types';

const STORAGE_KEY_VISITORS = 'a4_visitors_history';
const STORAGE_KEY_SESSION = 'a4_session_id';

// Helper to detect device type
export function detectDevice(): 'mobile' | 'desktop' | 'tablet' {
  if (typeof window === 'undefined') return 'desktop';
  const width = window.innerWidth;
  const ua = navigator.userAgent.toLowerCase();
  const isTablet = /(ipad|tablet|(android(?!.*mobile))|(windows(?!.*phone)(.*touch))|kindle|playbook|silk|(puffin(?!.*(IP|AP|WP))))/.test(ua);
  if (isTablet || (width >= 640 && width <= 1024)) return 'tablet';
  if (width < 640 || /mobile|iphone|ipod|android.*mobile|blackberry|phone/.test(ua)) return 'mobile';
  return 'desktop';
}

// Generate unique session ID
export function getOrCreateSessionId(): string {
  if (typeof window === 'undefined') return 'sess-default';
  try {
    let sess = sessionStorage.getItem(STORAGE_KEY_SESSION);
    if (!sess) {
      sess = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      sessionStorage.setItem(STORAGE_KEY_SESSION, sess);
    }
    return sess;
  } catch (e) {
    return `sess_${Date.now()}`;
  }
}

// Retrieve visitors strictly from local storage or empty array (100% real, no fake seed)
export function getStoredVisitors(): VisitorRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_VISITORS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (e) {}
  return [];
}

// Reset all analytics & visitor history to zero
export async function resetAllAnalyticsAndVisitors(): Promise<void> {
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem(STORAGE_KEY_VISITORS);
      sessionStorage.removeItem(STORAGE_KEY_SESSION);
      window.dispatchEvent(new CustomEvent('a4_analytics_updated', { detail: { reset: true } }));
    } catch (e) {}
  }
  try {
    await fetch('/api/analytics/reset', { method: 'POST' });
  } catch (e) {}
}

// Record a new visit (100% real)
export function recordVisit(
  param?: string | { path?: string; universityInterest?: string; collegeInterest?: string },
  universityInterestParam?: string,
  collegeInterestParam?: string
): void {
  if (typeof window === 'undefined') return;
  try {
    let path = '/';
    let universityInterest = universityInterestParam;
    let collegeInterest = collegeInterestParam;

    if (typeof param === 'string') {
      path = param;
    } else if (param && typeof param === 'object') {
      path = param.path || '/';
      universityInterest = param.universityInterest || universityInterestParam;
      collegeInterest = param.collegeInterest || collegeInterestParam;
    }

    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const hour = now.getHours();
    const dayOfWeek = now.getDay();
    const device = detectDevice();
    const sessionId = getOrCreateSessionId();

    const record: VisitorRecord = {
      id: `vis_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: now.toISOString(),
      date: dateStr,
      hour,
      dayOfWeek,
      path,
      universityInterest,
      collegeInterest,
      device,
      sessionId,
    };

    const current = getStoredVisitors();
    // Keep max 5000 recent real records
    const updated = [record, ...current].slice(0, 5000);
    localStorage.setItem(STORAGE_KEY_VISITORS, JSON.stringify(updated));

    window.dispatchEvent(new CustomEvent('a4_analytics_updated', { detail: { newVisit: record } }));

    // Send to backend API
    fetch('/api/analytics/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(record),
    }).catch(() => {});
  } catch (e) {
    console.warn('Analytics record visit error:', e);
  }
}

const ARABIC_DAYS = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

// Main calculation engine
export function calculateAnalytics(
  orders: PrintOrder[] = [],
  visitors: VisitorRecord[] = [],
  timeFilter: 'all' | 'today' | 'week' | 'month' | 'last30' = 'all'
): AnalyticsSummary {
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  // Week start (last 7 days)
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  // Month start (last 30 days)
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);
  thirtyDaysAgo.setHours(0, 0, 0, 0);

  // Current month (from day 1)
  const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  // Filter visitors by periods for top-level counters
  let visitorsTodayCount = 0;
  let visitorsThisWeekCount = 0;
  let visitorsThisMonthCount = 0;
  const visitorsTotalCount = visitors.length;

  visitors.forEach(v => {
    const vDate = new Date(v.timestamp || v.date);
    if (v.date === todayStr) {
      visitorsTodayCount++;
    }
    if (vDate >= sevenDaysAgo) {
      visitorsThisWeekCount++;
    }
    if (vDate >= startOfCurrentMonth || vDate >= thirtyDaysAgo) {
      visitorsThisMonthCount++;
    }
  });

  // Filter orders by periods for top-level counters
  let ordersTodayCount = 0;
  let ordersThisWeekCount = 0;
  let ordersThisMonthCount = 0;
  let revenueToday = 0;
  let revenueThisWeek = 0;
  let revenueThisMonth = 0;
  let revenueTotal = 0;

  orders.forEach(o => {
    const oDate = new Date(o.createdAt);
    const oDateStr = !isNaN(oDate.getTime()) ? oDate.toISOString().split('T')[0] : '';
    const amount = Number(o.totalAmount) || 0;

    revenueTotal += amount;

    if (oDateStr === todayStr) {
      ordersTodayCount++;
      revenueToday += amount;
    }
    if (oDate >= sevenDaysAgo) {
      ordersThisWeekCount++;
      revenueThisWeek += amount;
    }
    if (oDate >= startOfCurrentMonth || oDate >= thirtyDaysAgo) {
      ordersThisMonthCount++;
      revenueThisMonth += amount;
    }
  });

  // Active subset based on chosen timeFilter
  let filteredVisitors = visitors;
  let filteredOrders = orders;

  if (timeFilter === 'today') {
    filteredVisitors = visitors.filter(v => v.date === todayStr);
    filteredOrders = orders.filter(o => {
      const d = new Date(o.createdAt);
      return !isNaN(d.getTime()) && d.toISOString().split('T')[0] === todayStr;
    });
  } else if (timeFilter === 'week') {
    filteredVisitors = visitors.filter(v => new Date(v.timestamp || v.date) >= sevenDaysAgo);
    filteredOrders = orders.filter(o => new Date(o.createdAt) >= sevenDaysAgo);
  } else if (timeFilter === 'month' || timeFilter === 'last30') {
    filteredVisitors = visitors.filter(v => new Date(v.timestamp || v.date) >= thirtyDaysAgo);
    filteredOrders = orders.filter(o => new Date(o.createdAt) >= thirtyDaysAgo);
  }

  // Daily Trend (Last 14 days)
  const dailyMap = new Map<string, DayStatItem>();
  for (let i = 13; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dateKey = d.toISOString().split('T')[0];
    const dayName = ARABIC_DAYS[d.getDay()];
    dailyMap.set(dateKey, {
      date: dateKey,
      dayName,
      visitors: 0,
      orders: 0,
      revenue: 0,
    });
  }

  visitors.forEach(v => {
    if (v.date && dailyMap.has(v.date)) {
      const item = dailyMap.get(v.date)!;
      item.visitors += 1;
    }
  });

  orders.forEach(o => {
    const oDate = new Date(o.createdAt);
    if (!isNaN(oDate.getTime())) {
      const dateKey = oDate.toISOString().split('T')[0];
      if (dailyMap.has(dateKey)) {
        const item = dailyMap.get(dateKey)!;
        item.orders += 1;
        item.revenue += Number(o.totalAmount) || 0;
      }
    }
  });

  const dailyTrend = Array.from(dailyMap.values());

  // Universities & Colleges breakdown
  const uniMap = new Map<string, {
    ordersCount: number;
    visitorsCount: number;
    revenue: number;
    collegesMap: Map<string, { ordersCount: number; revenue: number }>;
  }>();

  // Aggregate from orders
  filteredOrders.forEach(o => {
    const uniName = o.institution ? o.institution.trim() : 'طلبات عامة / غير محدد';
    const spec = o.specialization ? o.specialization.trim() : 'كلية عامة';
    const amount = Number(o.totalAmount) || 0;

    if (!uniMap.has(uniName)) {
      uniMap.set(uniName, {
        ordersCount: 0,
        visitorsCount: 0,
        revenue: 0,
        collegesMap: new Map(),
      });
    }
    const uniObj = uniMap.get(uniName)!;
    uniObj.ordersCount += 1;
    uniObj.revenue += amount;

    if (!uniObj.collegesMap.has(spec)) {
      uniObj.collegesMap.set(spec, { ordersCount: 0, revenue: 0 });
    }
    const colObj = uniObj.collegesMap.get(spec)!;
    colObj.ordersCount += 1;
    colObj.revenue += amount;
  });

  // Aggregate from visitors
  filteredVisitors.forEach(v => {
    if (v.universityInterest) {
      const uniName = v.universityInterest.trim();
      if (!uniMap.has(uniName)) {
        uniMap.set(uniName, {
          ordersCount: 0,
          visitorsCount: 0,
          revenue: 0,
          collegesMap: new Map(),
        });
      }
      uniMap.get(uniName)!.visitorsCount += 1;
    }
  });

  const totalFilteredOrdersCount = Math.max(1, filteredOrders.length);
  const universities: UniversityStatItem[] = Array.from(uniMap.entries()).map(([name, data]) => {
    const collegesList = Array.from(data.collegesMap.entries()).map(([cName, cData]) => ({
      name: cName,
      ordersCount: cData.ordersCount,
      revenue: cData.revenue,
    })).sort((a, b) => b.ordersCount - a.ordersCount);

    return {
      name,
      ordersCount: data.ordersCount,
      visitorsCount: data.visitorsCount,
      revenue: data.revenue,
      percentage: Math.round((data.ordersCount / totalFilteredOrdersCount) * 100) || 0,
      colleges: collegesList,
    };
  }).sort((a, b) => b.ordersCount - a.ordersCount || b.visitorsCount - a.visitorsCount);

  // Device breakdown
  const devices = { mobile: 0, desktop: 0, tablet: 0 };
  filteredVisitors.forEach(v => {
    const d = v.device || 'mobile';
    if (devices[d] !== undefined) {
      devices[d] += 1;
    } else {
      devices.mobile += 1;
    }
  });

  // Payment methods
  const paymentMethods = { bankak: 0, okash: 0, fawry: 0, cash: 0 };
  filteredOrders.forEach(o => {
    const m = o.paymentMethod || 'bankak';
    if (m === 'bankak') paymentMethods.bankak += 1;
    else if (m === 'okash') paymentMethods.okash += 1;
    else if (m === 'fawry') paymentMethods.fawry += 1;
    else paymentMethods.cash += 1;
  });

  // Delivery methods
  const deliveryMethods = { pickup: 0, delivery: 0 };
  filteredOrders.forEach(o => {
    if (o.deliveryMethod === 'delivery') deliveryMethods.delivery += 1;
    else deliveryMethods.pickup += 1;
  });

  // Print Colors & Options
  const printColors = { bw: 0, color: 0, mixed: 0 };
  const bindingTypes: Record<BindingType, number> = {
    none: 0,
    stapled: 0,
    spiral_plastic: 0,
    softcover: 0,
    hardcover_leather: 0,
  };
  const sidesTypes = { single: 0, double: 0 };

  filteredOrders.forEach(o => {
    if (Array.isArray(o.files)) {
      o.files.forEach(f => {
        if (f.color === 'color') printColors.color += f.copies || 1;
        else if (f.color === 'mixed') printColors.mixed += f.copies || 1;
        else printColors.bw += f.copies || 1;

        if (f.binding && bindingTypes[f.binding] !== undefined) {
          bindingTypes[f.binding] += f.copies || 1;
        } else {
          bindingTypes.none += f.copies || 1;
        }

        if (f.sides === 'single') sidesTypes.single += f.copies || 1;
        else sidesTypes.double += f.copies || 1;
      });
    }
  });

  // Order statuses
  const orderStatuses: Record<OrderStatus, number> = {
    pending: 0,
    reviewing: 0,
    printing: 0,
    packaging: 0,
    out_for_delivery: 0,
    ready_for_pickup: 0,
    completed: 0,
    cancelled: 0,
  };
  filteredOrders.forEach(o => {
    if (o.status && orderStatuses[o.status] !== undefined) {
      orderStatuses[o.status] += 1;
    }
  });

  // Hourly distribution (24 hrs)
  const hourlyDistribution = new Array(24).fill(0);
  filteredVisitors.forEach(v => {
    const h = v.hour >= 0 && v.hour < 24 ? v.hour : 12;
    hourlyDistribution[h] += 1;
  });
  filteredOrders.forEach(o => {
    const d = new Date(o.createdAt);
    if (!isNaN(d.getTime())) {
      const h = d.getHours();
      if (h >= 0 && h < 24) hourlyDistribution[h] += 1;
    }
  });

  // Days of week distribution
  const daysOfWeek = ARABIC_DAYS.map((dayName, idx) => ({
    dayName,
    orders: 0,
    visitors: 0,
  }));
  filteredVisitors.forEach(v => {
    const d = v.dayOfWeek >= 0 && v.dayOfWeek < 7 ? v.dayOfWeek : 0;
    daysOfWeek[d].visitors += 1;
  });
  filteredOrders.forEach(o => {
    const d = new Date(o.createdAt);
    if (!isNaN(d.getTime())) {
      const dayIdx = d.getDay();
      daysOfWeek[dayIdx].orders += 1;
    }
  });

  // Top sheets
  const topSheetsMap = new Map<string, { id: string; title: string; institution: string; facultyOrYear: string; ordersCount: number }>();
  filteredOrders.forEach(o => {
    if (Array.isArray(o.files)) {
      o.files.forEach(f => {
        const title = f.fileName || 'مذكرة دراسية';
        if (!topSheetsMap.has(title)) {
          topSheetsMap.set(title, {
            id: f.id || title,
            title,
            institution: o.institution || 'جامعة النيلين',
            facultyOrYear: o.specialization || 'كلية عامة',
            ordersCount: 0,
          });
        }
        topSheetsMap.get(title)!.ordersCount += f.copies || 1;
      });
    }
  });
  const topSheets = Array.from(topSheetsMap.values()).sort((a, b) => b.ordersCount - a.ordersCount).slice(0, 10);

  // Conversion rate (orders / visitors)
  const baseVisitors = Math.max(1, filteredVisitors.length);
  const conversionRate = Math.min(100, Math.round((filteredOrders.length / baseVisitors) * 100 * 10) / 10);

  const avgOrderValue = filteredOrders.length > 0
    ? Math.round((filteredOrders.reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0)) / filteredOrders.length)
    : 0;

  return {
    visitors: {
      today: visitorsTodayCount,
      thisWeek: visitorsThisWeekCount,
      thisMonth: visitorsThisMonthCount,
      total: visitorsTotalCount,
    },
    orders: {
      today: ordersTodayCount,
      thisWeek: ordersThisWeekCount,
      thisMonth: ordersThisMonthCount,
      total: orders.length,
    },
    revenue: {
      today: revenueToday,
      thisWeek: revenueThisWeek,
      thisMonth: revenueThisMonth,
      total: revenueTotal,
      avgOrderValue,
    },
    conversionRate,
    dailyTrend,
    universities,
    devices,
    paymentMethods,
    deliveryMethods,
    printColors,
    bindingTypes,
    sidesTypes,
    orderStatuses,
    hourlyDistribution,
    daysOfWeekDistribution: daysOfWeek,
    topSheets,
  };
}
