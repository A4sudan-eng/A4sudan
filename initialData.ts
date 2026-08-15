import { PricingRates, StudySheet, PrintOrder, DeliveryZone, Coupon, Expense } from '../types';

export const DELIVERY_ZONES: DeliveryZone[] = [
  // --- أمدرمان ---
  {
    id: 'omd-5k',
    regionKey: 'omdurman',
    regionName: 'أمدرمان 👑',
    zoneName: 'كرري، أمدرمان شمالاً، أبو سعد، أمبدة',
    fee: 5000,
    details: 'كل محلية كرري وأمدرمان شمالاً حتى موقف مواصلات الجرافة (تستثنى الحارات: 26، 27، 28) | أبو سعد جنوباً حتى الشقلة | أمبدة غرباً حتى مدخل سوق ليبيا',
  },
  {
    id: 'omd-7k',
    regionKey: 'omdurman',
    regionName: 'أمدرمان 👑',
    zoneName: 'حارات الإسكان (70-103)، أمبدة (تقاطع قندهار)، البنك العقاري',
    fee: 7000,
    details: 'كل حارات الإسكان (من 70 حتى 103) | أمبدة (من بداية سوق ليبيا شرقاً حتى تقاطع قندهار) | البنك العقاري (على الزلط)',
  },
  {
    id: 'omd-8k',
    regionKey: 'omdurman',
    regionName: 'أمدرمان 👑',
    zoneName: 'حي الجامعة وصالحة (على الزلط)',
    fee: 8000,
    details: 'حي الجامعة وصالحة (على الزلط الرئيسي)',
  },
  {
    id: 'omd-10k',
    regionKey: 'omdurman',
    regionName: 'أمدرمان 👑',
    zoneName: 'الريف الشمالي أمدرمان، دار السلام',
    fee: 10000,
    details: 'الريف الشمالي أمدرمان بداية من الجرافة | أمبدة دار السلام (على الزلط أو المحطات الرئيسية فقط)',
  },

  // --- بحري وشرق النيل ---
  {
    id: 'bhr-7k',
    regionKey: 'bahri_eastnile',
    regionName: 'بحري وشرق النيل 💧',
    zoneName: 'محلية بحري (القديمة، الحلفايا، الدروشاب)',
    fee: 7000,
    details: 'محلية بحري (بحري القديمة - الحلفايا - الدروشاب)',
  },
  {
    id: 'bhr-8k-1',
    regionKey: 'bahri_eastnile',
    regionName: 'بحري وشرق النيل 💧',
    zoneName: 'بحري (الكدرو، السامراب، نبتة، كوبر، كافوري)',
    fee: 8000,
    details: 'الكدرو - السامراب - نبتة - كوبر - كافوري',
  },
  {
    id: 'bhr-8k-2',
    regionKey: 'bahri_eastnile',
    regionName: 'بحري وشرق النيل 💧',
    zoneName: 'شرق النيل (الحاج يوسف)',
    fee: 8000,
    details: 'الحاج يوسف (كافة الأحياء والمحطات)',
  },
  {
    id: 'bhr-10k',
    regionKey: 'bahri_eastnile',
    regionName: 'بحري وشرق النيل 💧',
    zoneName: 'شرق النيل (دردوق، حلة كوكو، القادسية، الهدى، النصر، الجريف شرق، الفيحاء)',
    fee: 10000,
    details: 'دردوق / حلة كوكو / القادسية / الهدى / النصر / الجريف شرق / دار السلام المغاربة / الفيحاء',
  },
  {
    id: 'bhr-12k',
    regionKey: 'bahri_eastnile',
    regionName: 'بحري وشرق النيل 💧',
    zoneName: 'شرق النيل (أم دوم، حلة المصطفى، مرابيع الشريف، سوبا شرق)',
    fee: 12000,
    details: 'أم دوم - حلة المصطفى - حلة الفكي أبو القاسم - الكرياب - مرابيع الشريف - سوبا شرق (على الزلط)',
  },

  // --- الخرطوم ---
  {
    id: 'ktm-8k',
    regionKey: 'khartoum',
    regionName: 'الخرطوم 🏙️',
    zoneName: 'محلية الخرطوم والكلاكلة حتى الاحتياطي المركزي',
    fee: 8000,
    details: 'محلية الخرطوم والكلاكلة حتى معسكر الاحتياطي المركزي',
  },
  {
    id: 'ktm-10k',
    regionKey: 'khartoum',
    regionName: 'الخرطوم 🏙️',
    zoneName: 'جنوب الحزام (السلمة، الأزهري، عد حسين)',
    fee: 10000,
    details: 'جنوب الحزام (السلمة - الأزهري - عد حسين)',
  },
  {
    id: 'ktm-12k-1',
    regionKey: 'khartoum',
    regionName: 'الخرطوم 🏙️',
    zoneName: 'الشقيلاب وطيبة الحسناب',
    fee: 12000,
    details: 'الشقيلاب وطيبة الحسناب',
  },
  {
    id: 'ktm-12k-2',
    regionKey: 'khartoum',
    regionName: 'الخرطوم 🏙️',
    zoneName: 'منطقة سوبا',
    fee: 12000,
    details: 'منطقة سوبا وتفرعاتها',
  },
  {
    id: 'ktm-18k',
    regionKey: 'khartoum',
    regionName: 'الخرطوم 🏙️',
    zoneName: 'جنوب طيبة الحسناب وحتى جبل أولياء',
    fee: 18000,
    details: 'أي منطقة جنوب طيبة الحسناب وحتى جبل أولياء',
  },

  // --- باقي الولايات (إرساليات طرود) ---
  {
    id: 'state-10k',
    regionKey: 'states',
    regionName: 'إرساليات باقي الولايات 📦',
    zoneName: 'شحن وإرسالية لولايات السودان (بورتسودان، مدني، عطبرة، القضارف، إلخ)',
    fee: 10000,
    details: 'التوصيل خارج العاصمة الخرطوم يكون عبر إرساليات طرود وحافلات السفر السريع لمكاتب النقل بالولايات',
  },

  // --- استلام مباشر ---
  {
    id: 'pickup-free',
    regionKey: 'pickup',
    regionName: 'استلام مباشر 🏪',
    zoneName: 'استلام مباشر من مقر المكتبة (مجاناً)',
    fee: 0,
    details: 'استلام مباشر من فرع المكتبة (أم درمان - الثورة / الجامعة)',
  },
];

export const DEFAULT_PRICING_RATES: PricingRates = {
  bwPerPage: 200, // 200 SDG per Physical Paper Sheet (سعر الورقة المطبوعة أبيض وأسود)
  colorPerPage: 500, // 500 SDG per Physical Paper Sheet (سعر الورقة المطبوعة ألوان)
  paperSizeMultiplier: {
    a4: 1.0,
    a3: 2.2,
    a5: 0.8,
  },
  sidesDiscountRatio: 0.85, // 15% discount on double-sided print
  paperWeightPrice: {
    '70g': 0,
    '80g': 15,
    '150g_glossy': 60,
    '250g_card': 120,
  },
  bindingPrice: {
    none: 0,
    stapled: 150,
    spiral_plastic: 1200,
    softcover: 2500,
    hardcover_leather: 6000,
  },
  deliveryFees: {
    'أمدرمان - كرري وأمدرمان شمالاً، أبو سعد، أمبدة (5,000 ج.س)': 5000,
    'أمدرمان - حارات الإسكان، أمبدة قندهار، البنك العقاري (7,000 ج.س)': 7000,
    'أمدرمان - حي الجامعة وصالحة (8,000 ج.س)': 8000,
    'أمدرمان - الريف الشمالي، دار السلام (10,000 ج.س)': 10000,
    'بحري - محلية بحري (القديمة، الحلفايا، الدروشاب) (7,000 ج.س)': 7000,
    'بحري - (الكدرو، السامراب، نبتة، كوبر، كافوري) (8,000 ج.س)': 8000,
    'شرق النيل - (الحاج يوسف) (8,000 ج.س)': 8000,
    'شرق النيل - (دردوق، حلة كوكو، القادسية، الفيحاء) (10,000 ج.س)': 10000,
    'شرق النيل - (أم دوم، حلة المصطفى، مرابيع الشريف، سوبا شرق) (12,000 ج.س)': 12000,
    'الخرطوم - محلية الخرطوم والكلاكلة (8,000 ج.س)': 8000,
    'الخرطوم - جنوب الحزام (السلمة، الأزهري، عد حسين) (10,000 ج.س)': 10000,
    'الخرطوم - الشقيلاب وطيبة الحسناب (12,000 ج.س)': 12000,
    'الخرطوم - سوبا (12,000 ج.س)': 12000,
    'الخرطوم - جنوب طيبة الحسناب وحتى جبل أولياء (18,000 ج.س)': 18000,
    'إرسالية لولايات السودان (شحن طرود 10,000 ج.س)': 10000,
    'استلام مباشر من مقر المكتبة (0 ج.س)': 0,
  },
};

export const SAMPLE_STUDY_SHEETS: StudySheet[] = [
  // =========================================================================
  // كلية التجارة - قسم المحاسبة (جميع الفصول من 1 إلى 8)
  // =========================================================================
  
  // --- الفصل الدراسي الأول (1) ---
  {
    id: 'sheet-acc-sem1-1',
    title: 'شيت مبادئ المحاسبة المالية (1)',
    institution: 'جامعة النيلين',
    facultyOrYear: 'كلية التجارة',
    department: 'محاسبة',
    semester: 1,
    degreeType: 'bachelor',
    batchNumber: 'batch_33_34',
    subject: 'مبادئ محاسبة 1',
    pageCount: 45,
    authorOrLecturer: 'قسم المحاسبة - جامعة النيلين',
    fileUrl: '#',
    downloadCount: 650,
    recommendedColor: 'bw',
    recommendedBinding: 'spiral_plastic',
    priceEstimate: 6900,
    isAvailable: true,
  },
  {
    id: 'sheet-acc-sem1-2',
    title: 'شيت الإحصاء للعمال والتجارة',
    institution: 'جامعة النيلين',
    facultyOrYear: 'كلية التجارة',
    department: 'محاسبة',
    semester: 1,
    degreeType: 'bachelor',
    batchNumber: 'batch_33_34',
    subject: 'إحصاء تجاري',
    pageCount: 38,
    authorOrLecturer: 'قسم الإحصاء - كلية التجارة',
    fileUrl: '#',
    downloadCount: 520,
    recommendedColor: 'bw',
    recommendedBinding: 'spiral_plastic',
    priceEstimate: 5800,
    isAvailable: true,
  },
  {
    id: 'sheet-acc-sem1-3',
    title: 'شيت مبادئ الاقتصاد الجزئي',
    institution: 'جامعة النيلين',
    facultyOrYear: 'كلية التجارة',
    department: 'محاسبة',
    semester: 1,
    degreeType: 'bachelor',
    batchNumber: 'batch_33_34',
    subject: 'اقتصاد جزئي',
    pageCount: 40,
    authorOrLecturer: 'قسم الاقتصاد - كلية التجارة',
    fileUrl: '#',
    downloadCount: 490,
    recommendedColor: 'bw',
    recommendedBinding: 'spiral_plastic',
    priceEstimate: 6000,
    isAvailable: true,
  },

  // --- الفصل الدراسي الثاني (2) ---
  {
    id: 'sheet-acc-sem2-1',
    title: 'شيت مبادئ المحاسبة المالية (2)',
    institution: 'جامعة النيلين',
    facultyOrYear: 'كلية التجارة',
    department: 'محاسبة',
    semester: 2,
    degreeType: 'bachelor',
    batchNumber: 'batch_33_34',
    subject: 'مبادئ محاسبة 2',
    pageCount: 48,
    authorOrLecturer: 'قسم المحاسبة - جامعة النيلين',
    fileUrl: '#',
    downloadCount: 580,
    recommendedColor: 'bw',
    recommendedBinding: 'spiral_plastic',
    priceEstimate: 7200,
    isAvailable: true,
  },
  {
    id: 'sheet-acc-sem2-2',
    title: 'شيت الرياضيات التجارية والاستثمار',
    institution: 'جامعة النيلين',
    facultyOrYear: 'كلية التجارة',
    department: 'محاسبة',
    semester: 2,
    degreeType: 'bachelor',
    batchNumber: 'batch_33_34',
    subject: 'رياضيات تجارية',
    pageCount: 42,
    authorOrLecturer: 'قسم الرياضيات والتجارة',
    fileUrl: '#',
    downloadCount: 450,
    recommendedColor: 'bw',
    recommendedBinding: 'spiral_plastic',
    priceEstimate: 6400,
    isAvailable: true,
  },

  // --- الفصل الدراسي الثالث (3) ---
  {
    id: 'sheet-acc-sem3-1',
    title: 'شيت المحاسبة المتوسطة (1) - الشركات والشركاء',
    institution: 'جامعة النيلين',
    facultyOrYear: 'كلية التجارة',
    department: 'محاسبة',
    semester: 3,
    degreeType: 'bachelor',
    batchNumber: 'batch_32',
    subject: 'محاسبة متوسطة 1',
    pageCount: 55,
    authorOrLecturer: 'قسم المحاسبة - جامعة النيلين',
    fileUrl: '#',
    downloadCount: 480,
    recommendedColor: 'bw',
    recommendedBinding: 'spiral_plastic',
    priceEstimate: 8100,
    isAvailable: true,
  },
  {
    id: 'sheet-acc-sem3-2',
    title: 'شيت شركات الأموال والمساهمة العامة',
    institution: 'جامعة النيلين',
    facultyOrYear: 'كلية التجارة',
    department: 'محاسبة',
    semester: 3,
    degreeType: 'bachelor',
    batchNumber: 'batch_32',
    subject: 'شركات أموال',
    pageCount: 50,
    authorOrLecturer: 'قسم المحاسبة - كلية التجارة',
    fileUrl: '#',
    downloadCount: 430,
    recommendedColor: 'bw',
    recommendedBinding: 'spiral_plastic',
    priceEstimate: 7500,
    isAvailable: true,
  },

  // --- الفصل الدراسي الرابع (4) ---
  {
    id: 'sheet-acc-sem4-1',
    title: 'شيت المحاسبة المتوسطة (2) - الأصول والالتزامات',
    institution: 'جامعة النيلين',
    facultyOrYear: 'كلية التجارة',
    department: 'محاسبة',
    semester: 4,
    degreeType: 'bachelor',
    batchNumber: 'batch_31',
    subject: 'محاسبة متوسطة 2',
    pageCount: 52,
    authorOrLecturer: 'قسم المحاسبة - جامعة النيلين',
    fileUrl: '#',
    downloadCount: 460,
    recommendedColor: 'bw',
    recommendedBinding: 'spiral_plastic',
    priceEstimate: 7800,
    isAvailable: true,
  },
  {
    id: 'sheet-acc-sem4-2',
    title: 'شيت المحاسبة الحكومية والقومية',
    institution: 'جامعة النيلين',
    facultyOrYear: 'كلية التجارة',
    department: 'محاسبة',
    semester: 4,
    degreeType: 'bachelor',
    batchNumber: 'batch_31',
    subject: 'محاسبة حكومية',
    pageCount: 40,
    authorOrLecturer: 'قسم المحاسبة - جامعة النيلين',
    fileUrl: '#',
    downloadCount: 390,
    recommendedColor: 'bw',
    recommendedBinding: 'spiral_plastic',
    priceEstimate: 6000,
    isAvailable: true,
  },

  // --- الفصل الدراسي الخامس (5) ---
  {
    id: 'sheet-acc-sem5-1',
    title: 'شيت محاسبة التكاليف (1) - المبادئ والعناصر',
    institution: 'جامعة النيلين',
    facultyOrYear: 'كلية التجارة',
    department: 'محاسبة',
    semester: 5,
    degreeType: 'bachelor',
    batchNumber: 'batch_30',
    subject: 'محاسبة تكاليف 1',
    pageCount: 50,
    authorOrLecturer: 'قسم المحاسبة - جامعة النيلين',
    fileUrl: '#',
    downloadCount: 510,
    recommendedColor: 'bw',
    recommendedBinding: 'spiral_plastic',
    priceEstimate: 7500,
    isAvailable: true,
  },
  {
    id: 'sheet-acc-sem5-2',
    title: 'شيت محاسبة المنشآت المالية والبنوك',
    institution: 'جامعة النيلين',
    facultyOrYear: 'كلية التجارة',
    department: 'محاسبة',
    semester: 5,
    degreeType: 'bachelor',
    batchNumber: 'batch_30',
    subject: 'منشآت مالية',
    pageCount: 46,
    authorOrLecturer: 'قسم المحاسبة - جامعة النيلين',
    fileUrl: '#',
    downloadCount: 420,
    recommendedColor: 'bw',
    recommendedBinding: 'spiral_plastic',
    priceEstimate: 6900,
    isAvailable: true,
  },

  // --- الفصل الدراسي السادس (6) ---
  {
    id: 'sheet-acc-sem6-1',
    title: 'شيت محاسبة التكاليف المتقدمة والأوامر',
    institution: 'جامعة النيلين',
    facultyOrYear: 'كلية التجارة',
    department: 'محاسبة',
    semester: 6,
    degreeType: 'bachelor',
    batchNumber: 'batch_29',
    subject: 'محاسبة تكاليف 2',
    pageCount: 48,
    authorOrLecturer: 'قسم المحاسبة - جامعة النيلين',
    fileUrl: '#',
    downloadCount: 430,
    recommendedColor: 'bw',
    recommendedBinding: 'spiral_plastic',
    priceEstimate: 7200,
    isAvailable: true,
  },
  {
    id: 'sheet-acc-sem6-2',
    title: 'شيت المحاسبة الضريبية والزكاة',
    institution: 'جامعة النيلين',
    facultyOrYear: 'كلية التجارة',
    department: 'محاسبة',
    semester: 6,
    degreeType: 'bachelor',
    batchNumber: 'batch_29',
    subject: 'محاسبة ضريبية',
    pageCount: 44,
    authorOrLecturer: 'قسم المحاسبة - جامعة النيلين',
    fileUrl: '#',
    downloadCount: 400,
    recommendedColor: 'bw',
    recommendedBinding: 'spiral_plastic',
    priceEstimate: 6600,
    isAvailable: true,
  },

  // --- الفصل الدراسي السابع (7) ---
  {
    id: 'sheet-acc-sem7-1',
    title: 'شيت المحاسبة المتقدمة والاندماج',
    institution: 'جامعة النيلين',
    facultyOrYear: 'كلية التجارة',
    department: 'محاسبة',
    semester: 7,
    degreeType: 'bachelor',
    batchNumber: 'batch_28',
    subject: 'محاسبة متقدمة',
    pageCount: 52,
    authorOrLecturer: 'قسم المحاسبة - جامعة النيلين',
    fileUrl: '#',
    downloadCount: 470,
    recommendedColor: 'bw',
    recommendedBinding: 'spiral_plastic',
    priceEstimate: 7800,
    isAvailable: true,
  },
  {
    id: 'sheet-acc-sem7-2',
    title: 'شيت نظم المعلومات المحاسبية (AIS)',
    institution: 'جامعة النيلين',
    facultyOrYear: 'كلية التجارة',
    department: 'محاسبة',
    semester: 7,
    degreeType: 'bachelor',
    batchNumber: 'batch_28',
    subject: 'نظم معلومات محاسبية',
    pageCount: 45,
    authorOrLecturer: 'قسم المحاسبة - جامعة النيلين',
    fileUrl: '#',
    downloadCount: 410,
    recommendedColor: 'bw',
    recommendedBinding: 'spiral_plastic',
    priceEstimate: 6800,
    isAvailable: true,
  },

  // --- الفصل الدراسي الثامن (8) - كافة مواد المحاسبة كاملة 👑 ---
  {
    id: 'sheet-acc-sem8-1',
    title: 'شيت نظم محاسبة التكاليف',
    institution: 'جامعة النيلين',
    facultyOrYear: 'كلية التجارة',
    department: 'محاسبة',
    semester: 8,
    degreeType: 'bachelor',
    batchNumber: 'batch_28',
    subject: 'نظم محاسبة التكاليف',
    pageCount: 50,
    authorOrLecturer: 'قسم المحاسبة - جامعة النيلين',
    fileUrl: '#',
    downloadCount: 520,
    recommendedColor: 'bw',
    recommendedBinding: 'spiral_plastic',
    priceEstimate: 7500,
    isAvailable: true,
  },
  {
    id: 'sheet-acc-sem8-2',
    title: 'شيت المراجعة والتدقيق والرقابة المالية',
    institution: 'جامعة النيلين',
    facultyOrYear: 'كلية التجارة',
    department: 'محاسبة',
    semester: 8,
    degreeType: 'bachelor',
    batchNumber: 'batch_28',
    subject: 'المراجعة',
    pageCount: 40,
    authorOrLecturer: 'قسم المحاسبة - جامعة النيلين',
    fileUrl: '#',
    downloadCount: 480,
    recommendedColor: 'bw',
    recommendedBinding: 'spiral_plastic',
    priceEstimate: 6000,
    isAvailable: true,
  },
  {
    id: 'sheet-acc-sem8-3',
    title: 'شيت محاسبة النفط والغاز والموارد الطبيعية',
    institution: 'جامعة النيلين',
    facultyOrYear: 'كلية التجارة',
    department: 'محاسبة',
    semester: 8,
    degreeType: 'bachelor',
    batchNumber: 'batch_28',
    subject: 'نفط وغاز',
    pageCount: 45,
    authorOrLecturer: 'قسم المحاسبة - جامعة النيلين',
    fileUrl: '#',
    downloadCount: 410,
    recommendedColor: 'bw',
    recommendedBinding: 'spiral_plastic',
    priceEstimate: 6800,
    isAvailable: true,
  },
  {
    id: 'sheet-acc-sem8-4',
    title: 'شيت المحاسبة الإدارية واتخاذ القرارات',
    institution: 'جامعة النيلين',
    facultyOrYear: 'كلية التجارة',
    department: 'محاسبة',
    semester: 8,
    degreeType: 'bachelor',
    batchNumber: 'batch_28',
    subject: 'إدارية',
    pageCount: 65,
    authorOrLecturer: 'قسم المحاسبة - جامعة النيلين',
    fileUrl: '#',
    downloadCount: 590,
    recommendedColor: 'bw',
    recommendedBinding: 'spiral_plastic',
    priceEstimate: 9500,
    isAvailable: true,
  },
  {
    id: 'sheet-acc-sem8-5',
    title: 'شيت دراسة الجدوى وتقييم المشروعات',
    institution: 'جامعة النيلين',
    facultyOrYear: 'كلية التجارة',
    department: 'محاسبة',
    semester: 8,
    degreeType: 'bachelor',
    batchNumber: 'batch_28',
    subject: 'دراسة جدوى',
    pageCount: 42,
    authorOrLecturer: 'قسم المحاسبة - جامعة النيلين',
    fileUrl: '#',
    downloadCount: 390,
    recommendedColor: 'bw',
    recommendedBinding: 'spiral_plastic',
    priceEstimate: 6300,
    isAvailable: true,
  },
  {
    id: 'sheet-acc-sem8-6',
    title: 'شيت بحوث العمليات في المحاسبة والإدارة',
    institution: 'جامعة النيلين',
    facultyOrYear: 'كلية التجارة',
    department: 'محاسبة',
    semester: 8,
    degreeType: 'bachelor',
    batchNumber: 'batch_28',
    subject: 'بحوث عمليات',
    pageCount: 48,
    authorOrLecturer: 'قسم المحاسبة والإحصاء - جامعة النيلين',
    fileUrl: '#',
    downloadCount: 360,
    recommendedColor: 'bw',
    recommendedBinding: 'spiral_plastic',
    priceEstimate: 7200,
    isAvailable: true,
  },

  // =========================================================================
  // كلية التجارة - قسم إدارة الأعمال
  // =========================================================================
  {
    id: 'sheet-mgmt-sem1-1',
    title: 'شيت مبادئ إدارة الأعمال والتنظيم',
    institution: 'جامعة النيلين',
    facultyOrYear: 'كلية التجارة',
    department: 'إدارة الأعمال',
    semester: 1,
    degreeType: 'bachelor',
    batchNumber: 'batch_33_34',
    subject: 'مبادئ إدارة',
    pageCount: 42,
    authorOrLecturer: 'قسم إدارة الأعمال - كلية التجارة',
    fileUrl: '#',
    downloadCount: 410,
    recommendedColor: 'bw',
    recommendedBinding: 'spiral_plastic',
    priceEstimate: 6400,
    isAvailable: true,
  },
  {
    id: 'sheet-mgmt-sem8-1',
    title: 'شيت الإدارة الاستراتيجية والتخطيط',
    institution: 'جامعة النيلين',
    facultyOrYear: 'كلية التجارة',
    department: 'إدارة الأعمال',
    semester: 8,
    degreeType: 'bachelor',
    batchNumber: 'batch_28',
    subject: 'إدارة استراتيجية',
    pageCount: 50,
    authorOrLecturer: 'قسم إدارة الأعمال - جامعة النيلين',
    fileUrl: '#',
    downloadCount: 430,
    recommendedColor: 'bw',
    recommendedBinding: 'spiral_plastic',
    priceEstimate: 7500,
    isAvailable: true,
  },

  // =========================================================================
  // كلية التجارة - قسم التأمين
  // =========================================================================
  {
    id: 'sheet-ins-sem1-1',
    title: 'شيت مبادئ وخطر التأمين العام',
    institution: 'جامعة النيلين',
    facultyOrYear: 'كلية التجارة',
    department: 'التأمين',
    semester: 1,
    degreeType: 'bachelor',
    batchNumber: 'batch_33_34',
    subject: 'تأمين عام',
    pageCount: 40,
    authorOrLecturer: 'قسم التأمين - جامعة النيلين',
    fileUrl: '#',
    downloadCount: 390,
    recommendedColor: 'bw',
    recommendedBinding: 'spiral_plastic',
    priceEstimate: 6000,
    isAvailable: true,
  },
  {
    id: 'sheet-ins-sem8-1',
    title: 'شيت إدارة المخاطر والتأمين التجاري المتقدم',
    institution: 'جامعة النيلين',
    facultyOrYear: 'كلية التجارة',
    department: 'التأمين',
    semester: 8,
    degreeType: 'bachelor',
    batchNumber: 'batch_28',
    subject: 'إدارة مخاطر',
    pageCount: 48,
    authorOrLecturer: 'قسم التأمين - جامعة النيلين',
    fileUrl: '#',
    downloadCount: 350,
    recommendedColor: 'bw',
    recommendedBinding: 'spiral_plastic',
    priceEstimate: 7200,
    isAvailable: true,
  },

  // =========================================================================
  // كلية علوم الحاسوب وتقانة المعلومات (5 مستويات)
  // =========================================================================
  {
    id: 'sheet-cs-sem1-1',
    title: 'شيت أساسيات البرمجة بلغة C++',
    institution: 'جامعة النيلين',
    facultyOrYear: 'كلية علوم الحاسوب وتقانة المعلومات',
    department: 'علوم الحاسوب',
    semester: 1,
    degreeType: 'bachelor',
    batchNumber: 'batch_33_34',
    subject: 'برمجة 1',
    pageCount: 50,
    authorOrLecturer: 'كلية علوم الحاسوب - جامعة النيلين',
    fileUrl: '#',
    downloadCount: 620,
    recommendedColor: 'bw',
    recommendedBinding: 'spiral_plastic',
    priceEstimate: 7500,
    isAvailable: true,
  },
  {
    id: 'sheet-cs-sem10-1',
    title: 'شيت مشروعات الذكاء الاصطناعي وتنقيب البيانات',
    institution: 'جامعة النيلين',
    facultyOrYear: 'كلية علوم الحاسوب وتقانة المعلومات',
    department: 'علوم الحاسوب',
    semester: 10,
    degreeType: 'bachelor',
    batchNumber: 'batch_26',
    subject: 'ذكاء اصطناعي',
    pageCount: 60,
    authorOrLecturer: 'قسم علوم الحاسوب - جامعة النيلين',
    fileUrl: '#',
    downloadCount: 480,
    recommendedColor: 'bw',
    recommendedBinding: 'spiral_plastic',
    priceEstimate: 9000,
    isAvailable: true,
  },

  // --- الدبلوم التقني ---
  {
    id: 'sheet-dip-acc-1',
    title: 'شيت التطبيقات المحاسبية الإلكترونية (دبلوم تقني)',
    institution: 'جامعة النيلين',
    facultyOrYear: 'كلية التجارة',
    department: 'محاسبة',
    semester: 2,
    degreeType: 'diploma',
    batchNumber: 'batch_32',
    subject: 'محاسبة إلكترونية',
    pageCount: 35,
    authorOrLecturer: 'قسم المحاسبة والتقنية - كلية التجارة',
    fileUrl: '#',
    downloadCount: 210,
    recommendedColor: 'bw',
    recommendedBinding: 'spiral_plastic',
    priceEstimate: 5300,
    isAvailable: true,
  },
];

export const INITIAL_ORDERS: PrintOrder[] = [
  {
    id: 'A4-SD-9102',
    customerName: 'محمد أحمد هارون',
    customerPhone: '0912345678',
    customerPhone2: '0112345679',
    customerEmail: 'm.ahmed@gmail.com',
    deliveryMethod: 'delivery',
    city: 'الخرطوم',
    addressOrCampus: 'مجمع الكليات الطبية - شارع القصر - الخرطوم',
    files: [
      {
        id: 'file-1',
        fileName: 'مشروع_التخرج_النهائي_الهندسة.pdf',
        fileSize: 1024 * 1024 * 4.2,
        fileType: 'application/pdf',
        pageCount: 85,
        color: 'mixed',
        paperSize: 'a4',
        sides: 'single',
        paperWeight: '80g',
        binding: 'hardcover_leather',
        copies: 2,
        notes: 'الرجاء الطباعة بغلاف تجليد فاخر مع الكتابة بالذهبي على الغلاف',
        calculatedPrice: 24500,
      },
    ],
    totalPages: 170,
    subtotal: 24500,
    deliveryFee: 2500,
    discount: 1000,
    totalAmount: 26000,
    paymentMethod: 'bankak',
    bankakTransactionId: 'BNK-7849120',
    paymentStatus: 'verified',
    status: 'printing',
    createdAt: '2026-08-05T06:15:00Z',
    estimatedCompletionTime: 'اليوم الساعة 3:00 مساءً',
    notes: 'طلب مستعجل للجامعة',
  },
  {
    id: 'A4-SD-8821',
    customerName: 'فاطمة الزهراء علي',
    customerPhone: '0123987654',
    customerPhone2: '0987654321',
    deliveryMethod: 'pickup',
    city: 'أم درمان',
    addressOrCampus: 'فرع المكتبة - أم درمان الثورة',
    files: [
      {
        id: 'file-2',
        fileName: 'شيت_الميكرو_بيولوجي_المحاضرة_1_إلى_5.pdf',
        fileSize: 1024 * 1024 * 2.1,
        fileType: 'application/pdf',
        pageCount: 40,
        color: 'bw',
        paperSize: 'a4',
        sides: 'double',
        paperWeight: '70g',
        binding: 'spiral_plastic',
        copies: 1,
        notes: 'تغليف سلك شفاف أسود',
        calculatedPrice: 3240,
      },
    ],
    totalPages: 40,
    subtotal: 3240,
    deliveryFee: 0,
    discount: 0,
    totalAmount: 3240,
    paymentMethod: 'bankak',
    bankakTransactionId: 'BNK-5521901',
    paymentStatus: 'verified',
    status: 'ready_for_pickup',
    createdAt: '2026-08-04T18:40:00Z',
    estimatedCompletionTime: 'جاهز للاستلام الآن',
  },
  {
    id: 'A4-SD-7710',
    customerName: 'عثمان عبد الله',
    customerPhone: '0901122334',
    customerPhone2: '0101122335',
    deliveryMethod: 'delivery',
    city: 'بورتسودان',
    addressOrCampus: 'حي السكة حديد - بالقرب من المستشفى',
    files: [
      {
        id: 'file-3',
        fileName: 'سجلات_المبيعات_والنماذج.pdf',
        fileSize: 1024 * 1024 * 1.5,
        fileType: 'application/pdf',
        pageCount: 30,
        color: 'color',
        paperSize: 'a4',
        sides: 'single',
        paperWeight: '70g',
        binding: 'stapled',
        copies: 3,
        calculatedPrice: 18450,
      },
    ],
    totalPages: 90,
    subtotal: 18450,
    deliveryFee: 3000,
    discount: 0,
    totalAmount: 21450,
    paymentMethod: 'bankak',
    bankakTransactionId: 'BNK-7849120',
    paymentStatus: 'pending',
    status: 'pending',
    createdAt: '2026-08-05T07:10:00Z',
    estimatedCompletionTime: 'غداً صباحاً',
  },
];

export const INITIAL_COUPONS: Coupon[] = [
  {
    id: 'c-1',
    code: 'BATCH29',
    discountPercentage: 15,
    targetBatch: 'batch_29',
    isActive: true,
    notes: 'خصم 15% لطلاب الدفعة 29 كلية التجارة',
    createdAt: '2026-08-01T00:00:00Z',
  },
  {
    id: 'c-2',
    code: 'WELCOME10',
    discountPercentage: 10,
    targetBatch: 'all',
    isActive: true,
    notes: 'خصم 10% ترحيبي عام لجميع الطلاب',
    createdAt: '2026-08-01T00:00:00Z',
  },
  {
    id: 'c-3',
    code: 'BATCH33',
    discountPercentage: 20,
    targetBatch: 'batch_33_34',
    isActive: true,
    notes: 'خصم 20% لطلاب دفعة 33 و 34 الجدد',
    createdAt: '2026-08-01T00:00:00Z',
  },
];

export const INITIAL_EXPENSES: Expense[] = [
  {
    id: 'exp-1',
    title: 'شراء 5 كراتين ورق A4 (80 جرام)',
    category: 'raw_materials',
    amount: 115000,
    date: '2026-08-01',
    paymentMethod: 'bankak',
    paidTo: 'شركة المطبوعات للورق والكرتون',
    notes: 'توريد ورق طباعة ممتاز للمكتبة',
    createdAt: '2026-08-01T09:00:00Z',
  },
  {
    id: 'exp-2',
    title: 'عبوات حبر ماكينات الطباعة كيونيكسيون',
    category: 'raw_materials',
    amount: 85000,
    date: '2026-08-02',
    paymentMethod: 'bankak',
    paidTo: 'المركز الهندي لقطع الغيار والأحبار',
    notes: 'حبر أسود + ألوان للطباعة العالية الدقة',
    createdAt: '2026-08-02T11:30:00Z',
  },
  {
    id: 'exp-3',
    title: 'صيانة وتغيير درام الطباعة الدورية',
    category: 'maintenance',
    amount: 35000,
    date: '2026-08-04',
    paymentMethod: 'cash',
    paidTo: 'مهندس الصيانة أحمد',
    notes: 'تنظيف السخانات وضبط التروس',
    createdAt: '2026-08-04T14:00:00Z',
  },
  {
    id: 'exp-4',
    title: 'سلك تجليد حلزوني وأغلفة بلاستيكية مقواة',
    category: 'raw_materials',
    amount: 28000,
    date: '2026-08-05',
    paymentMethod: 'okash',
    paidTo: 'مكتبة الخرطوم للتجهيزات',
    notes: 'تجهيز طلبات تجليد الشيتات والمذكرات',
    createdAt: '2026-08-05T16:20:00Z',
  },
  {
    id: 'exp-5',
    title: 'فاتورة الكهرباء وشحن باقة الإنترنت الفضائي للمكتبة',
    category: 'operations',
    amount: 42000,
    date: '2026-08-06',
    paymentMethod: 'bankak',
    paidTo: 'شركة الهيدرو إلكتريك / سوداني',
    notes: 'سداد تشغيل الفرع الرئيسي والإنترنت',
    createdAt: '2026-08-06T10:00:00Z',
  },
];

export function getStoredExpenses(): Expense[] {
  try {
    const saved = localStorage.getItem('a4_sudan_expenses');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error loading expenses from localStorage', e);
  }
  return INITIAL_EXPENSES;
}

export function saveStoredExpenses(expenses: Expense[]): void {
  try {
    localStorage.setItem('a4_sudan_expenses', JSON.stringify(expenses));
  } catch (e) {
    console.error('Error saving expenses to localStorage', e);
  }
}

export function getStoredOrders(): PrintOrder[] {
  try {
    const saved = localStorage.getItem('a4_orders');
    if (saved !== null) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error loading orders from localStorage', e);
  }
  return INITIAL_ORDERS;
}

export function saveStoredOrders(orders: PrintOrder[]): void {
  try {
    localStorage.setItem('a4_orders', JSON.stringify(orders));
  } catch (e) {
    console.error('Error saving orders to localStorage', e);
  }
}

export function getStoredDeletedIds(): string[] {
  try {
    const saved = localStorage.getItem('a4_sudan_deleted_ids');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {}
  return [];
}

export function saveStoredDeletedId(id: string): void {
  try {
    const current = getStoredDeletedIds();
    const lower = id.toLowerCase();
    if (!current.includes(lower)) {
      const updated = [...current, lower];
      localStorage.setItem('a4_sudan_deleted_ids', JSON.stringify(updated));
    }
  } catch (e) {}
}

export function removeStoredDeletedId(id: string): void {
  try {
    const current = getStoredDeletedIds();
    const lower = id.toLowerCase();
    const updated = current.filter(i => i.toLowerCase() !== lower);
    localStorage.setItem('a4_sudan_deleted_ids', JSON.stringify(updated));
  } catch (e) {}
}

export function clearStoredDeletedIds(): void {
  try {
    localStorage.removeItem('a4_sudan_deleted_ids');
  } catch (e) {}
}

export function getStoredDeletedOrders(): PrintOrder[] {
  try {
    const saved = localStorage.getItem('a4_sudan_deleted_orders');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
        const now = Date.now();
        // Keep only items deleted within the last 30 days
        const validDeleted = parsed.filter((item: PrintOrder) => {
          if (!item.deletedAt) return false;
          const deletedTime = new Date(item.deletedAt).getTime();
          return !isNaN(deletedTime) && (now - deletedTime) <= thirtyDaysMs;
        });

        if (validDeleted.length !== parsed.length) {
          saveStoredDeletedOrders(validDeleted);
        }
        return validDeleted;
      }
    }
  } catch (e) {
    console.error('Error loading deleted orders from localStorage', e);
  }
  return [];
}

export function saveStoredDeletedOrders(orders: PrintOrder[]): void {
  try {
    localStorage.setItem('a4_sudan_deleted_orders', JSON.stringify(orders));
  } catch (e) {
    console.error('Error saving deleted orders to localStorage', e);
  }
}

export function getStoredDeletedSheetIds(): string[] {
  try {
    const saved = localStorage.getItem('a4_sudan_deleted_sheet_ids');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {}
  return [];
}

export function saveStoredDeletedSheetId(id: string): void {
  try {
    const current = getStoredDeletedSheetIds();
    const lower = id.toLowerCase();
    if (!current.includes(lower)) {
      const updated = [...current, lower];
      localStorage.setItem('a4_sudan_deleted_sheet_ids', JSON.stringify(updated));
    }
  } catch (e) {}
}

export function removeStoredDeletedSheetId(id: string): void {
  try {
    const current = getStoredDeletedSheetIds();
    const lower = id.toLowerCase();
    const updated = current.filter(i => i.toLowerCase() !== lower);
    localStorage.setItem('a4_sudan_deleted_sheet_ids', JSON.stringify(updated));
  } catch (e) {}
}

export function getStoredSheets(): StudySheet[] {
  try {
    const saved = localStorage.getItem('a4_sheets');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {}
  return SAMPLE_STUDY_SHEETS;
}

export function saveStoredSheets(sheets: StudySheet[]): void {
  try {
    localStorage.setItem('a4_sheets', JSON.stringify(sheets));
  } catch (e) {
    console.error('Error saving sheets to localStorage', e);
  }
}

