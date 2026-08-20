import { DeliveryZone } from '../types';
import { DELIVERY_ZONES } from '../data/initialData';

const STORAGE_KEY_DELIVERY_ZONES = 'a4_custom_delivery_zones';

export const SUDANESE_STATES = [
  'ولاية الخرطوم',
  'ولاية الجزيرة',
  'ولاية نهر النيل',
  'ولاية البحر الأحمر',
  'ولاية كسلا',
  'ولاية القضارف',
  'ولاية سنار',
  'ولاية النيل الأبيض',
  'ولاية النيل الأزرق',
  'الولاية الشمالية',
  'ولاية شمال كردفان',
  'ولاية غرب كردفان',
  'ولاية جنوب كردفان',
  'ولاية شمال دارفور',
  'ولاية غرب دارفور',
  'ولاية جنوب دارفور',
  'ولاية وسط دارفور',
  'ولاية شرق دارفور',
];

export const KHARTOUM_LOCALITIES = [
  'محلية كرري',
  'محلية أمدرمان',
  'محلية أمبدة',
  'محلية بحري',
  'محلية شرق النيل',
  'محلية الخرطوم',
  'محلية جبل أولياء',
];

export const OTHER_COMMON_LOCALITIES: Record<string, string[]> = {
  'ولاية الجزيرة': ['محلية مدني الكبرى', 'محلية المناقل', 'محلية الحصاحيصا', 'محلية الكاملين', 'محلية شرق الجزيرة'],
  'ولاية نهر النيل': ['محلية عطبرة', 'محلية شندي', 'محلية الدامر', 'محلية بربر', 'محلية المتمة'],
  'ولاية البحر الأحمر': ['محلية بورتسودان', 'محلية سواكن', 'محلية جبيت'],
  'ولاية القضارف': ['محلية القضارف', 'محلية الفشقة', 'محلية القلابات'],
  'ولاية كسلا': ['محلية كسلا', 'محلية حلفا الجديدة', 'محلية القاش'],
  'ولاية سنار': ['محلية سنار', 'محلية سنجة', 'محلية الدندر'],
  'ولاية النيل الأبيض': ['محلية كوستي', 'محلية ربك', 'محلية الدويم'],
  'الولاية الشمالية': ['محلية دنقلا', 'محلية مروي', 'محلية الدبة', 'محلية حلفا'],
};

// Standard rich default delivery zones with state, locality, neighborhood & price
export const DEFAULT_ENRICHED_DELIVERY_ZONES: DeliveryZone[] = [
  // --- ولاية الخرطوم: محلية كرري ---
  {
    id: 'kh-karari-1',
    state: 'ولاية الخرطوم',
    locality: 'محلية كرري',
    neighborhood: 'كرري، أمدرمان شمالاً، الثورة الحارات (1-60)، الجرافة، الروضة، الشنقيطي، الوادي',
    zoneName: 'كرري، أمدرمان شمالاً، أبو سعد، أمبدة',
    fee: 5000,
    details: 'كل محلية كرري وأمدرمان شمالاً حتى موقف مواصلات الجرافة (تستثنى الحارات: 26، 27، 28) | أبو سعد جنوباً حتى الشقلة | أمبدة غرباً حتى مدخل سوق ليبيا',
    regionKey: 'omdurman',
    regionName: 'أمدرمان وكرري 👑',
    isActive: true,
  },
  {
    id: 'kh-karari-iskan',
    state: 'ولاية الخرطوم',
    locality: 'محلية كرري',
    neighborhood: 'حارات الإسكان (70-103)، أمبدة (تقاطع قندهار)، البنك العقاري',
    zoneName: 'حارات الإسكان (70-103)، أمبدة (تقاطع قندهار)، البنك العقاري',
    fee: 7000,
    details: 'كل حارات الإسكان (من 70 حتى 103) | أمبدة (من بداية سوق ليبيا شرقاً حتى تقاطع قندهار) | البنك العقاري (على الزلط)',
    regionKey: 'omdurman',
    regionName: 'أمدرمان وكرري 👑',
    isActive: true,
  },
  {
    id: 'kh-karari-rural',
    state: 'ولاية الخرطوم',
    locality: 'محلية كرري',
    neighborhood: 'الريف الشمالي أمدرمان، دار السلام',
    zoneName: 'الريف الشمالي أمدرمان، دار السلام',
    fee: 10000,
    details: 'الريف الشمالي أمدرمان بداية من الجرافة شمالاً | أمبدة دار السلام (على الزلط أو المحطات الرئيسية فقط)',
    regionKey: 'omdurman',
    regionName: 'أمدرمان وكرري 👑',
    isActive: true,
  },

  // --- ولاية الخرطوم: محلية أمدرمان ---
  {
    id: 'kh-omd-center',
    state: 'ولاية الخرطوم',
    locality: 'محلية أمدرمان',
    neighborhood: 'أمدرمان القديمة، العباسية، الموردة، بيت المال، بانت، المهندسين، أبو سعد',
    zoneName: 'أمدرمان القديمة، الموردة، المهندسين، أبو سعد',
    fee: 5000,
    details: 'كل مناطق وسط أمدرمان القديمة والموردة وأبو سعد جنوباً حتى محطة الشقلة والمهندسين',
    regionKey: 'omdurman',
    regionName: 'أمدرمان وكرري 👑',
    isActive: true,
  },
  {
    id: 'kh-omd-gamia',
    state: 'ولاية الخرطوم',
    locality: 'محلية أمدرمان',
    neighborhood: 'حي الجامعة وصالحة (على الزلط)',
    zoneName: 'حي الجامعة وصالحة (على الزلط)',
    fee: 8000,
    details: 'حي الجامعة وصالحة (على الزلط الرئيسي والمحطات المعتمدة)',
    regionKey: 'omdurman',
    regionName: 'أمدرمان وكرري 👑',
    isActive: true,
  },

  // --- ولاية الخرطوم: محلية أمبدة ---
  {
    id: 'kh-ombada-main',
    state: 'ولاية الخرطوم',
    locality: 'محلية أمبدة',
    neighborhood: 'أمبدة السبيل، حمد النيل، الحارات (1-25) حتى مدخل سوق ليبيا',
    zoneName: 'أمبدة السبيل، الحارات (1-25)، سوق ليبيا',
    fee: 5000,
    details: 'أمبدة شرق وغرب حتى مدخل سوق ليبيا ومحطات السبيل وحمد النيل',
    regionKey: 'omdurman',
    regionName: 'أمدرمان وكرري 👑',
    isActive: true,
  },

  // --- ولاية الخرطوم: محلية بحري ---
  {
    id: 'kh-bahri-old',
    state: 'ولاية الخرطوم',
    locality: 'محلية بحري',
    neighborhood: 'محلية بحري (القديمة، الحلفايا، الدروشاب، المزاد، الشعبية، الصافية)',
    zoneName: 'محلية بحري (القديمة، الحلفايا، الدروشاب)',
    fee: 7000,
    details: 'محلية بحري (بحري القديمة - الحلفايا - الدروشاب - الشعبية - الصافية)',
    regionKey: 'bahri_eastnile',
    regionName: 'بحري وشرق النيل 💧',
    isActive: true,
  },
  {
    id: 'kh-bahri-kadro',
    state: 'ولاية الخرطوم',
    locality: 'محلية بحري',
    neighborhood: 'الكدرو، السامراب، نبتة، كوبر، كافوري، الواحة',
    zoneName: 'بحري (الكدرو، السامراب، نبتة، كوبر، كافوري)',
    fee: 8000,
    details: 'الكدرو - السامراب - نبتة - كوبر - كافوري - حي الواحة',
    regionKey: 'bahri_eastnile',
    regionName: 'بحري وشرق النيل 💧',
    isActive: true,
  },

  // --- ولاية الخرطوم: محلية شرق النيل ---
  {
    id: 'kh-eastnile-hajyousif',
    state: 'ولاية الخرطوم',
    locality: 'محلية شرق النيل',
    neighborhood: 'الحاج يوسف (كافة الأحياء والمايقوما والمحطات)',
    zoneName: 'شرق النيل (الحاج يوسف)',
    fee: 8000,
    details: 'الحاج يوسف (كافة الأحياء والمحطات والمايقوما وشارع واحد)',
    regionKey: 'bahri_eastnile',
    regionName: 'بحري وشرق النيل 💧',
    isActive: true,
  },
  {
    id: 'kh-eastnile-dardoug',
    state: 'ولاية الخرطوم',
    locality: 'محلية شرق النيل',
    neighborhood: 'دردوق، حلة كوكو، القادسية، الهدى، النصر، الجريف شرق، الفيحاء',
    zoneName: 'شرق النيل (دردوق، حلة كوكو، القادسية، الهدى، النصر، الجريف شرق، الفيحاء)',
    fee: 10000,
    details: 'دردوق / حلة كوكو / القادسية / الهدى / النصر / الجريف شرق / دار السلام المغاربة / الفيحاء',
    regionKey: 'bahri_eastnile',
    regionName: 'بحري وشرق النيل 💧',
    isActive: true,
  },
  {
    id: 'kh-eastnile-omdoom',
    state: 'ولاية الخرطوم',
    locality: 'محلية شرق النيل',
    neighborhood: 'أم دوم، حلة المصطفى، مرابيع الشريف، سوبا شرق',
    zoneName: 'شرق النيل (أم دوم، حلة المصطفى، مرابيع الشريف، سوبا شرق)',
    fee: 12000,
    details: 'أم دوم - حلة المصطفى - حلة الفكي أبو القاسم - الكرياب - مرابيع الشريف - سوبا شرق (على الزلط)',
    regionKey: 'bahri_eastnile',
    regionName: 'بحري وشرق النيل 💧',
    isActive: true,
  },

  // --- ولاية الخرطوم: محلية الخرطوم ---
  {
    id: 'kh-ktm-center',
    state: 'ولاية الخرطوم',
    locality: 'محلية الخرطوم',
    neighborhood: 'الخرطوم وسط، الرياض، العمارات، المعمورة، الطائف، المجاهدين، الكلاكلة',
    zoneName: 'محلية الخرطوم والكلاكلة حتى الاحتياطي المركزي',
    fee: 8000,
    details: 'محلية الخرطوم والكلاكلة حتى معسكر الاحتياطي المركزي والأحياء الرئيسية',
    regionKey: 'khartoum',
    regionName: 'الخرطوم 🏙️',
    isActive: true,
  },
  {
    id: 'kh-ktm-south',
    state: 'ولاية الخرطوم',
    locality: 'محلية الخرطوم',
    neighborhood: 'جنوب الحزام (السلمة، الأزهري، عد حسين، مايو)',
    zoneName: 'جنوب الحزام (السلمة، الأزهري، عد حسين)',
    fee: 10000,
    details: 'جنوب الحزام (السلمة - الأزهري - عد حسين - مايو المحطة)',
    regionKey: 'khartoum',
    regionName: 'الخرطوم 🏙️',
    isActive: true,
  },
  {
    id: 'kh-ktm-soba',
    state: 'ولاية الخرطوم',
    locality: 'محلية الخرطوم',
    neighborhood: 'منطقة سوبا غرب والأراضي وتفرعاتها',
    zoneName: 'منطقة سوبا',
    fee: 12000,
    details: 'منطقة سوبا غرب وتفرعاتها والمحطة',
    regionKey: 'khartoum',
    regionName: 'الخرطوم 🏙️',
    isActive: true,
  },

  // --- ولاية الخرطوم: محلية جبل أولياء ---
  {
    id: 'kh-jebel-shugailab',
    state: 'ولاية الخرطوم',
    locality: 'محلية جبل أولياء',
    neighborhood: 'الشقيلاب وطيبة الحسناب',
    zoneName: 'الشقيلاب وطيبة الحسناب',
    fee: 12000,
    details: 'الشقيلاب وطيبة الحسناب على الزلط الرئيسي',
    regionKey: 'khartoum',
    regionName: 'الخرطوم 🏙️',
    isActive: true,
  },
  {
    id: 'kh-jebel-city',
    state: 'ولاية الخرطوم',
    locality: 'محلية جبل أولياء',
    neighborhood: 'جنوب طيبة الحسناب وحتى مدينة جبل أولياء',
    zoneName: 'جنوب طيبة الحسناب وحتى جبل أولياء',
    fee: 18000,
    details: 'أي منطقة جنوب طيبة الحسناب وحتى مدينة جبل أولياء وسوق الجبل',
    regionKey: 'khartoum',
    regionName: 'الخرطوم 🏙️',
    isActive: true,
  },

  // --- ولايات السودان: إرساليات طرود وشحن سريع ---
  {
    id: 'state-gezeera',
    state: 'ولاية الجزيرة',
    locality: 'محلية مدني الكبرى / المناقل',
    neighborhood: 'مدني، المناقل، المسلمية، الحصاحيصا (مكاتب السفريات)',
    zoneName: 'إرسالية ولاية الجزيرة (مدني، المناقل، الحصاحيصا)',
    fee: 10000,
    details: 'شحن طرد واستلام من مكتب ترحيلات السفريات السريعة بموقف الباصات',
    regionKey: 'states',
    regionName: 'إرساليات باقي الولايات 📦',
    isActive: true,
  },
  {
    id: 'state-rivernile',
    state: 'ولاية نهر النيل',
    locality: 'محلية عطبرة / شندي / الدامر',
    neighborhood: 'مكاتب ترحيلات عطبرة، شندي، الدامر',
    zoneName: 'إرسالية ولاية نهر النيل (عطبرة، شندي، الدامر)',
    fee: 10000,
    details: 'شحن طرد واستلام من مكتب الترحيلات بمواقف السفر السريع',
    regionKey: 'states',
    regionName: 'إرساليات باقي الولايات 📦',
    isActive: true,
  },
  {
    id: 'state-redsea',
    state: 'ولاية البحر الأحمر',
    locality: 'محلية بورتسودان',
    neighborhood: 'وسط المدينة ومكاتب النقل السريع بورتسودان',
    zoneName: 'إرسالية بورتسودان (ولاية البحر الأحمر)',
    fee: 10000,
    details: 'إرسالية طرود سريعة واستلام من مكتب الترحيلات ببورتسودان',
    regionKey: 'states',
    regionName: 'إرساليات باقي الولايات 📦',
    isActive: true,
  },
  {
    id: 'state-other-all',
    state: 'باقي ولايات السودان',
    locality: 'إرساليات الولايات (القضارف، كسلا، سنار، كوستي، دنقلا)',
    neighborhood: 'مكاتب الترحيلات والنقل البري السريع بالولايات',
    zoneName: 'شحن وإرسالية لولايات السودان (بورتسودان، مدني، عطبرة، القضارف، إلخ)',
    fee: 10000,
    details: 'التوصيل خارج العاصمة الخرطوم يكون عبر إرساليات طرود وحافلات السفر السريع لمكاتب النقل بالولايات',
    regionKey: 'states',
    regionName: 'إرساليات باقي الولايات 📦',
    isActive: true,
  },
];

// Helper to normalize and ensure full fields for legacy zones
export function normalizeDeliveryZone(z: Partial<DeliveryZone> & { id: string; zoneName: string; fee: number }): DeliveryZone {
  let state = z.state || 'ولاية الخرطوم';
  let locality = z.locality || '';
  let neighborhood = z.neighborhood || z.zoneName;

  if (!z.state || !z.locality) {
    const text = `${z.zoneName} ${z.details || ''} ${z.regionName || ''}`;
    if (text.includes('كرري')) {
      state = 'ولاية الخرطوم';
      locality = 'محلية كرري';
    } else if (text.includes('أمبدة') || text.includes('قندهار') || text.includes('سوق ليبيا')) {
      state = 'ولاية الخرطوم';
      locality = 'محلية أمبدة';
    } else if (text.includes('صالحة') || text.includes('أبو سعد') || text.includes('حي الجامعة') || text.includes('أمدرمان')) {
      state = 'ولاية الخرطوم';
      locality = 'محلية أمدرمان';
    } else if (text.includes('الحلفايا') || text.includes('الدروشاب') || text.includes('الكدرو') || text.includes('السامراب') || text.includes('كافوري') || text.includes('بحري')) {
      state = 'ولاية الخرطوم';
      locality = 'محلية بحري';
    } else if (text.includes('الحاج يوسف') || text.includes('دردوق') || text.includes('كوكو') || text.includes('أم دوم') || text.includes('شرق النيل')) {
      state = 'ولاية الخرطوم';
      locality = 'محلية شرق النيل';
    } else if (text.includes('جبل أولياء') || text.includes('طيبة الحسناب') || text.includes('الشقيلاب')) {
      state = 'ولاية الخرطوم';
      locality = 'محلية جبل أولياء';
    } else if (text.includes('الكلاكلة') || text.includes('السلمة') || text.includes('الأزهري') || text.includes('سوبا') || text.includes('الخرطوم')) {
      state = 'ولاية الخرطوم';
      locality = 'محلية الخرطوم';
    } else if (text.includes('ولايات') || text.includes('بورتسودان') || text.includes('مدني') || text.includes('عطبرة')) {
      state = 'باقي ولايات السودان';
      locality = 'إرساليات الولايات';
    }
  }

  return {
    id: z.id,
    state: state || 'ولاية الخرطوم',
    locality: locality || 'محلية عامة',
    neighborhood: neighborhood || z.zoneName,
    zoneName: z.zoneName,
    fee: Number(z.fee) || 0,
    details: z.details || '',
    regionKey: z.regionKey || 'omdurman',
    regionName: z.regionName || 'منطقة التوصيل',
    isActive: z.isActive !== false,
  };
}

// Get stored delivery zones (combining defaults with local storage & API)
export function getStoredDeliveryZones(): DeliveryZone[] {
  if (typeof window === 'undefined') return DEFAULT_ENRICHED_DELIVERY_ZONES;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_DELIVERY_ZONES);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map(normalizeDeliveryZone);
      }
    }
  } catch (e) {
    console.error('Error reading delivery zones from localStorage:', e);
  }

  // Fallback to initial enriched zones
  try {
    localStorage.setItem(STORAGE_KEY_DELIVERY_ZONES, JSON.stringify(DEFAULT_ENRICHED_DELIVERY_ZONES));
  } catch (e) {}
  return DEFAULT_ENRICHED_DELIVERY_ZONES;
}

// Save delivery zones to storage, Cloud Firestore, BroadcastChannel, and server
export async function saveStoredDeliveryZones(zones: DeliveryZone[]): Promise<void> {
  const normalized = zones.map(normalizeDeliveryZone);
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY_DELIVERY_ZONES, JSON.stringify(normalized));
      window.dispatchEvent(new CustomEvent('a4_delivery_zones_updated', { detail: { zones: normalized } }));
      if (typeof BroadcastChannel !== 'undefined') {
        const bc = new BroadcastChannel('a4_delivery_zones_channel');
        bc.postMessage({ type: 'DELIVERY_ZONES_UPDATED', zones: normalized });
        bc.close();
      }
    } catch (e) {
      console.error('Error saving delivery zones to localStorage:', e);
    }
  }

  // Sync to Cloud Firestore
  try {
    const { saveDeliveryZonesToCloud } = await import('../lib/firebase');
    await saveDeliveryZonesToCloud(normalized);
  } catch (e) {
    console.warn('Could not sync delivery zones to Cloud Firestore:', e);
  }

  // Sync to server API
  try {
    await fetch('/api/delivery-zones', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ zones: normalized }),
    });
  } catch (e) {
    console.warn('Could not sync delivery zones to server:', e);
  }
}

// Fetch from Cloud Firestore & server if available, and update local cache
export async function fetchServerDeliveryZones(): Promise<DeliveryZone[]> {
  try {
    // 1. Try Cloud Firestore first for real-time consistency across all devices & browsers
    const { getDeliveryZonesFromCloud } = await import('../lib/firebase');
    const cloudZones = await getDeliveryZonesFromCloud();
    if (cloudZones && Array.isArray(cloudZones) && cloudZones.length > 0) {
      const normalized = cloudZones.map(normalizeDeliveryZone);
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY_DELIVERY_ZONES, JSON.stringify(normalized));
        window.dispatchEvent(new CustomEvent('a4_delivery_zones_updated', { detail: { zones: normalized } }));
      }
      return normalized;
    }
  } catch (e) {
    console.warn('Failed to fetch delivery zones from Cloud Firestore:', e);
  }

  try {
    // 2. Fallback to Server API
    const res = await fetch('/api/delivery-zones');
    if (res.ok) {
      const data = await res.json();
      const list = Array.isArray(data) ? data : (data && Array.isArray(data.zones) ? data.zones : []);
      if (list.length > 0) {
        const normalized = list.map(normalizeDeliveryZone);
        if (typeof window !== 'undefined') {
          localStorage.setItem(STORAGE_KEY_DELIVERY_ZONES, JSON.stringify(normalized));
          window.dispatchEvent(new CustomEvent('a4_delivery_zones_updated', { detail: { zones: normalized } }));
        }
        return normalized;
      }
    }
  } catch (e) {
    console.warn('Failed to fetch delivery zones from server, using local:', e);
  }
  return getStoredDeliveryZones();
}
