export type PrintColor = 'bw' | 'color' | 'mixed'; // 'bw' = أبيض وأسود, 'color' = ألوان, 'mixed' = غلاف ألوان والداخل أبيض وأسود
export type PaperSize = 'a4' | 'a3' | 'a5';
export type PrintSides = 'single' | 'double';
export type PaperWeight = '70g' | '80g' | '150g_glossy' | '250g_card';
export type BindingType = 'none' | 'stapled' | 'spiral_plastic' | 'softcover' | 'hardcover_leather';

export type DeliveryMethod = 'pickup' | 'delivery';
export type PaymentMethod = 'bankak' | 'okash' | 'fawry';

export type OrderStatus = 'pending' | 'reviewing' | 'printing' | 'packaging' | 'out_for_delivery' | 'ready_for_pickup' | 'completed' | 'cancelled';

export interface PrintFileOptions {
  id: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  pageCount: number;
  color: PrintColor;
  paperSize: PaperSize;
  sides: PrintSides;
  paperWeight: PaperWeight;
  binding: BindingType;
  copies: number;
  pagesPerSheet?: number; // 1, 2, 4, 8 (عدد الصفحات في الورقة الواحدة)
  notes?: string;
  calculatedPrice: number;
  previewUrl?: string;
}

export interface PrintOrder {
  id: string; // e.g., A4-2026-8941
  userId?: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  institution?: string; // e.g., جامعة النيلين, جامعة الخرطوم
  specialization?: string; // e.g., كلية الطب - الدفعة 29
  deliveryMethod: DeliveryMethod;
  city: string; // e.g., الخرطوم, أم درمان, بحري, بورتسودان, ود مدني
  addressOrCampus: string; // e.g., مجمع الكليات الطبية - جامعة الخرطوم
  files: PrintFileOptions[];
  totalPages: number;
  subtotal: number;
  deliveryFee: number;
  discount: number;
  couponCode?: string;
  totalAmount: number; // in SDG
  paymentMethod: PaymentMethod;
  bankakTransactionId?: string;
  bankakProofUrl?: string;
  paymentStatus: 'pending' | 'verified' | 'cash_pending' | 'failed';
  status: OrderStatus;
  createdAt: string;
  estimatedCompletionTime?: string;
  notes?: string;
}

export interface Coupon {
  id: string;
  code: string; // e.g. BATCH29, WELCOME10
  discountPercentage: number; // e.g. 15 for 15%
  targetBatch?: string; // 'all' or 'batch_28', 'batch_29', etc.
  isActive: boolean;
  notes?: string;
  createdAt?: string;
}

export interface StudySheet {
  id: string;
  title: string;
  institution: string; // e.g., جامعة النيلين
  facultyOrYear: string; // e.g., كلية التجارة
  department?: string; // e.g., محاسبة, تأمين, إدارة أعمال
  semester?: number; // 1 to 8 (الفصل الدراسي 1 إلى 8)
  subject: string;
  pageCount: number;
  authorOrLecturer?: string;
  fileUrl: string;
  previewImage?: string;
  downloadCount: number;
  recommendedColor: PrintColor;
  recommendedBinding: BindingType;
  priceEstimate: number; // SDG
  isAvailable?: boolean;
  degreeType?: 'bachelor' | 'diploma';
  batchNumber?: string; // e.g. 'batch_28', 'batch_29', 'batch_30', 'batch_31', 'batch_32', 'batch_33_34'
}

export interface DeliveryZone {
  id: string;
  regionKey: 'omdurman' | 'bahri_eastnile' | 'khartoum' | 'states' | 'pickup';
  regionName: string;
  zoneName: string;
  fee: number;
  details: string;
}

export interface PricingRates {
  bwPerPage: number; // e.g., 200 SDG per printed paper sheet
  colorPerPage: number; // e.g., 500 SDG per printed paper sheet
  paperSizeMultiplier: Record<PaperSize, number>; // a4: 1, a3: 2.2, a5: 0.8
  sidesDiscountRatio: number; // e.g., 0.85 for double sided
  paperWeightPrice: Record<PaperWeight, number>; // 70g: 0, 80g: 20, etc.
  bindingPrice: Record<BindingType, number>; // none: 0, spiral: 800 SDG, etc.
  deliveryFees: Record<string, number>; // city -> delivery price in SDG
}

export interface AIAnalysisRequest {
  documentText?: string;
  documentTitle?: string;
  documentType?: string;
  pageCount?: number;
  userPrompt?: string;
}

export interface AIAnalysisResponse {
  summary: string;
  suggestedPrintConfig: {
    color: PrintColor;
    paperSize: PaperSize;
    sides: PrintSides;
    binding: BindingType;
    reasoning: string;
  };
  keyTopics: string[];
  estimatedStudyTimeMinutes?: number;
  printQualityAdvice: string;
}

export interface Expense {
  id: string;
  title: string; // البيان/الوصف
  category: 'raw_materials' | 'maintenance' | 'operations' | 'salaries' | 'delivery_costs' | 'other';
  amount: number; // المبلغ بالجنيه
  date: string; // YYYY-MM-DD
  paymentMethod: 'cash' | 'bankak' | 'okash' | 'other';
  paidTo?: string; // المستلم / الجهة
  notes?: string;
  createdAt: string;
}

export interface ActivityLog {
  id: string;
  adminName: string;
  actionType: 'status_change' | 'payment_verified' | 'order_edit' | 'order_deleted' | 'coupon_added' | 'coupon_deleted' | 'pricing_updated' | 'sheet_added' | 'expense_added' | 'expense_deleted';
  orderId?: string;
  customerName?: string;
  details: string;
  timestamp: string;
}
