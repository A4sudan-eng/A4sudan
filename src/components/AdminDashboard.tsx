import React, { useState, useEffect, useMemo } from 'react';
import { 
  ShieldCheck, Package, DollarSign, Printer, CheckCircle2, 
  Clock, Edit3, Save, RefreshCw, Eye, FileText, Phone, MapPin, CreditCard, Filter,
  Lock, KeyRound, Search, Trash2, LogOut, AlertCircle, FileCheck, Camera, Image as ImageIcon, X, Download, FileSpreadsheet, ExternalLink,
  BookOpen, Plus, Layers, GraduationCap, Building2, Tag, TrendingUp, BarChart3, UserCheck, History, User, MessageCircle, FolderTree,
  ChevronDown, Library, Wallet, PieChart, Receipt, Coins, ArrowDownRight, ArrowUpRight, MinusCircle, Calculator, PlusCircle, RotateCcw,
  Truck, Sparkles, Power
} from 'lucide-react';
import bankakLogo from '../assets/images/bankak_logo_1786006078601.jpg';
import okashLogo from '../assets/images/okash_logo_1786006090002.jpg';
import fawryLogo from '../assets/images/fawry_logo_1786006099638.jpg';
import { PrintOrder, PricingRates, OrderStatus, PrintColor, PrintSides, BindingType, StudySheet, Coupon, ActivityLog, Expense, DeliveryZone } from '../types';
import { getStatusBadgeInfo, formatSDG, calculateFilePrice, getEstimatedDeliveryText } from '../utils/pricing';
import { DEFAULT_PRICING_RATES, getStoredExpenses, saveStoredExpenses, getStoredDeletedOrders, saveStoredDeletedOrders, getStoredOrders, saveStoredOrders, saveStoredDeletedId, removeStoredDeletedId, getStoredDeletedIds } from '../data/initialData';
import { 
  saveDeletedOrderToCloud, 
  deleteDeletedOrderFromCloud, 
  emptyDeletedOrdersInCloud, 
  restoreOrderInCloud, 
  subscribeToCloudDeletedOrders, 
  getDeletedOrdersFromCloud,
  saveUniversitiesToCloud,
  getUniversitiesFromCloud,
  subscribeToCloudUniversities,
  saveAcademicLevelsToCloud,
  getAcademicLevelsFromCloud,
  subscribeToCloudAcademicLevels,
  saveDegreeTracksToCloud,
  getDegreeTracksFromCloud,
  subscribeToCloudDegreeTracks,
  savePricingRatesToCloud
} from '../lib/firebase';
import { 
  NEELAIN_COLLEGES, 
  SUDAN_UNIVERSITIES, 
  UniversityInfo, 
  UniversityCollege, 
  CollegeDepartment, 
  getStoredUniversities, 
  saveStoredUniversities,
  ACADEMIC_LEVELS,
  AcademicLevel,
  AcademicSemester,
  getStoredAcademicLevels,
  saveStoredAcademicLevels,
  DegreeTrackInfo,
  DEFAULT_DEGREE_TRACKS,
  getStoredDegreeTracks,
  saveStoredDegreeTracks
} from '../data/neelainData';
import { 
  getStoredDeliveryZones, 
  saveStoredDeliveryZones, 
  fetchServerDeliveryZones, 
  DEFAULT_ENRICHED_DELIVERY_ZONES 
} from '../utils/deliveryManager';
import { OrderSlipModal } from './OrderSlipModal';
import { AnalyticsDashboardView } from './AnalyticsDashboardView';
import { DeliveryManagementView } from './DeliveryManagementView';

interface AdminDashboardProps {
  orders: PrintOrder[];
  rates: PricingRates;
  sheets: StudySheet[];
  coupons?: Coupon[];
  onUpdateOrderStatus: (orderId: string, status: OrderStatus, paymentStatus?: 'verified' | 'failed', estimatedCompletionTime?: string) => void;
  onDeleteOrder?: (orderId: string) => void;
  onUpdateRates: (newRates: PricingRates) => void;
  onAddSheet: (sheet: StudySheet) => void;
  onUpdateSheet: (sheet: StudySheet) => void;
  onDeleteSheet: (id: string) => void;
  onBatchSaveSheets?: (sheets: StudySheet[]) => void;
  onAddCoupon?: (coupon: Coupon) => void;
  onDeleteCoupon?: (id: string) => void;
  onToggleCouponStatus?: (id: string) => void;
  onRefreshOrders?: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  orders,
  rates,
  sheets,
  coupons = [],
  onUpdateOrderStatus,
  onDeleteOrder,
  onUpdateRates,
  onAddSheet,
  onUpdateSheet,
  onDeleteSheet,
  onBatchSaveSheets,
  onAddCoupon,
  onDeleteCoupon,
  onToggleCouponStatus,
  onRefreshOrders,
}) => {
  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem('a4_admin_auth') === 'true' || localStorage.getItem('a4_admin_auth') === 'true';
  });

  const [selectedProofImage, setSelectedProofImage] = useState<string | null>(null);
  const [printOrderSlip, setPrintOrderSlip] = useState<PrintOrder | null>(null);
  const [selectedDocumentFile, setSelectedDocumentFile] = useState<{
    fileName: string;
    previewUrl: string;
    fileType?: string;
    pageCount?: number;
    notes?: string;
  } | null>(null);
  const [activeOrderPreview, setActiveOrderPreview] = useState<{
    orderId: string;
    customerName: string;
    files: Array<{
      fileName: string;
      previewUrl: string;
      fileType?: string;
      pageCount?: number;
      notes?: string;
      color?: string;
      sides?: string;
      binding?: string;
      copies?: number;
      pagesPerSheet?: number;
      calculatedPrice?: number;
    }>;
    selectedIndex: number;
  } | null>(null);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [editingDeliveryTimes, setEditingDeliveryTimes] = useState<Record<string, string>>({});
  const [savedTimeFeedback, setSavedTimeFeedback] = useState<Record<string, boolean>>({});

  const getDownloadableDocumentUrl = (f: { fileName: string; previewUrl?: string; pageCount: number; color: string; sides: string; binding: string; copies: number; notes?: string; pagesPerSheet?: number }, orderId?: string) => {
    if (f.previewUrl && f.previewUrl.trim().length > 0) {
      return f.previewUrl;
    }
    const docHtml = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="utf-8">
        <title>${f.fileName}</title>
        <style>
          body { font-family: system-ui, -apple-system, sans-serif; padding: 40px; background: #f8fafc; color: #0f172a; line-height: 1.6; }
          .card { max-width: 800px; margin: 0 auto; background: white; padding: 30px; border-radius: 16px; border: 1px solid #cbd5e1; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
          .header { border-bottom: 2px solid #059669; padding-bottom: 15px; margin-bottom: 20px; text-align: center; }
          .title { font-size: 22px; color: #065f46; font-weight: bold; }
          .meta { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; background: #ecfdf5; padding: 15px; border-radius: 12px; margin-bottom: 20px; font-size: 14px; border: 1px solid #a7f3d0; }
          .content { font-size: 15px; padding: 20px; border: 1px dashed #94a3b8; border-radius: 12px; background: #fafafa; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="header">
            <div class="title">📄 مستند الطباعة: ${f.fileName}</div>
            <p style="color: #64748b; font-size: 13px; margin-top: 5px;">مكتبة A4 Sudan لطباعة الشيتات والخدمات الجامعية</p>
          </div>
          <div class="meta">
            <div><strong>اسم الملف:</strong> ${f.fileName}</div>
            <div><strong>عدد النسخ:</strong> ${f.copies} نسخة</div>
            ${orderId ? `<div><strong>رقم الطلب المرجعي:</strong> ${orderId}</div>` : ''}
          </div>
          <div class="content">
            <p><strong>ملاحظات وطباعة المستند:</strong> ${f.notes || 'لا توجد ملاحظات إضافية من العميل'}</p>
            <hr style="margin: 20px 0; border: none; border-top: 1px solid #e2e8f0;" />
            <p style="color: #475569; font-size: 13px;">هذا المستند متوفر للطباعة الفورية والمراجعة عبر إدارة المكتبة.</p>
          </div>
        </div>
      </body>
      </html>
    `;
    return `data:text/html;charset=utf-8,${encodeURIComponent(docHtml)}`;
  };

  // Dashboard Tab & Filter States
  const [activeTab, setActiveTab] = useState<'orders' | 'financials' | 'pricing' | 'sheets_manage' | 'sheets' | 'coupons' | 'activity_logs' | 'universities' | 'trash' | 'analytics' | 'delivery'>('orders');
  const [financialSubTab, setFinancialSubTab] = useState<'sales' | 'expenses' | 'profit_loss'>('sales');
  const [showOrdersMenu, setShowOrdersMenu] = useState(false);
  const [showFinancialsMenu, setShowFinancialsMenu] = useState(false);
  const [showSheetsUniMenu, setShowSheetsUniMenu] = useState(false);
  const [showQuickOrdersModal, setShowQuickOrdersModal] = useState(false);
  const [quickSearchTerm, setQuickSearchTerm] = useState('');

  // Delivery Zones state & realtime sync
  const [deliveryZones, setDeliveryZones] = useState<DeliveryZone[]>(() => getStoredDeliveryZones());

  useEffect(() => {
    fetchServerDeliveryZones().then(zones => {
      if (zones && zones.length > 0) {
        setDeliveryZones(zones);
      }
    });

    const handleDeliveryZonesUpdated = (e: any) => {
      if (e.detail && Array.isArray(e.detail.zones)) {
        setDeliveryZones(e.detail.zones);
      } else {
        setDeliveryZones(getStoredDeliveryZones());
      }
    };

    window.addEventListener('a4_delivery_zones_updated', handleDeliveryZonesUpdated);
    return () => window.removeEventListener('a4_delivery_zones_updated', handleDeliveryZonesUpdated);
  }, []);

  // Trash PIN protection state (PIN: 1212)
  const [isTrashUnlocked, setIsTrashUnlocked] = useState(false);
  const [showTrashPinModal, setShowTrashPinModal] = useState(false);
  const [trashPinInput, setTrashPinInput] = useState('');
  const [trashPinError, setTrashPinError] = useState('');

  // Reusable custom confirmation modal & toast state
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText: string;
    cancelText: string;
    type: 'danger' | 'warning' | 'info';
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'تأكيد',
    cancelText: 'إلغاء',
    type: 'danger',
    onConfirm: () => {},
  });

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const handleOpenTrash = () => {
    setShowOrdersMenu(false);
    if (isTrashUnlocked) {
      setActiveTab('trash');
    } else {
      setTrashPinInput('');
      setTrashPinError('');
      setShowTrashPinModal(true);
    }
  };

  const handleUnlockTrash = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (trashPinInput.trim() === '1212') {
      setIsTrashUnlocked(true);
      setShowTrashPinModal(false);
      setTrashPinError('');
      setActiveTab('trash');
    } else {
      setTrashPinError('رمز الدخول السري غير صحيح! يرجى إدخال الرمز الصحيح.');
    }
  };

  const handlePrintQuickOrders = () => {
    const filtered = orders.filter(ord => {
      if (!quickSearchTerm.trim()) return true;
      const q = quickSearchTerm.toLowerCase();
      return (
        ord.id.toLowerCase().includes(q) ||
        ord.customerName.toLowerCase().includes(q)
      );
    });

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('يرجى السماح بالنوافذ المنبثقة لطباعة الكشف');
      return;
    }

    const rowsHtml = filtered.map((ord, idx) => `
      <tr>
        <td style="padding: 10px; border: 1px solid #cbd5e1; text-align: center; font-weight: bold;">${idx + 1}</td>
        <td style="padding: 10px; border: 1px solid #cbd5e1; text-align: center; font-weight: bold; font-family: monospace;">#${ord.id}</td>
        <td style="padding: 10px; border: 1px solid #cbd5e1; font-weight: bold; font-size: 14px;">${ord.customerName}</td>
        <td style="padding: 10px; border: 1px solid #cbd5e1; text-align: center; font-weight: bold; color: #065f46;">${ord.totalAmount.toLocaleString()} ج.س (${ord.files ? ord.files.length : 0} ملف)</td>
        <td style="padding: 10px; border: 1px solid #cbd5e1; text-align: center;">${ord.paymentMethod === 'bankak' ? 'بنكك' : ord.paymentMethod === 'okash' ? 'أوكاش' : 'نقداً'} (${ord.paymentStatus === 'verified' ? 'مؤكد ✓' : 'قيد التأكيد'})</td>
        <td style="padding: 10px; border: 1px solid #cbd5e1; text-align: center; font-weight: bold;">${getStatusBadgeInfo(ord.status).label}</td>
        <td style="padding: 10px; border: 1px solid #cbd5e1; text-align: center; font-size: 12px;">${new Date(ord.createdAt).toLocaleDateString('ar-SD')}</td>
      </tr>
    `).join('');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <title>كشف إدارة الطلبيات والعملاء - مكتبة A4</title>
        <style>
          body { font-family: system-ui, -apple-system, sans-serif; direction: rtl; padding: 25px; color: #0f172a; }
          h1 { text-align: center; margin-bottom: 5px; font-size: 22px; color: #0f172a; }
          .sub { text-align: center; font-size: 13px; color: #475569; margin-top: 0; margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 13px; }
          th { background-color: #0f172a; color: white; padding: 12px; border: 1px solid #0f172a; text-align: center; }
          tr:nth-child(even) { background-color: #f8fafc; }
          .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 10px; }
        </style>
      </head>
      <body>
        <h1>📋 كشف إدارة الطلبيات والعملاء المختصر</h1>
        <div class="sub">تاريخ الطباعة: ${new Date().toLocaleString('ar-SD')} | إجمالي الطلبات: ${filtered.length} طلب</div>
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>رقم الطلب</th>
              <th>اسم العميل</th>
              <th>المبلغ والملفات</th>
              <th>الدفع والحالة</th>
              <th>حالة الطلب الحالية</th>
              <th>التاريخ</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>
        <div class="footer">مكتبة A4 للطباعة الجامعية والخدمات الطلابية</div>
        <script>
          window.onload = function() {
            window.print();
          };
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleExportQuickOrdersExcel = () => {
    const filtered = orders.filter(ord => {
      if (!quickSearchTerm.trim()) return true;
      const q = quickSearchTerm.toLowerCase();
      return (
        ord.id.toLowerCase().includes(q) ||
        ord.customerName.toLowerCase().includes(q)
      );
    });

    const sumTotalAmount = filtered.reduce((s, o) => s + (o.totalAmount || 0), 0);
    const sumDiscount = filtered.reduce((s, o) => s + (o.discount || 0), 0);
    const sumDelivery = filtered.reduce((s, o) => s + (o.deliveryFee || 0), 0);

    const rowsHtml = filtered.map((ord, idx) => {
      const statusLabel = getStatusBadgeInfo(ord.status).label;
      const payMethodLabel = ord.paymentMethod === 'bankak' ? 'بنكك' : ord.paymentMethod === 'okash' ? 'أوكاش' : 'نقداً';
      const payStatusLabel = ord.paymentStatus === 'verified' ? 'مؤكد ✓' : 'قيد التأكيد ⏳';
      const fileCount = ord.files ? ord.files.length : 0;
      const pageCount = ord.totalPages || 0;
      const location = [ord.city, ord.addressOrCampus, ord.institution].filter(Boolean).join(' - ');
      const dateFormatted = new Date(ord.createdAt).toLocaleString('ar-SD');

      return `
        <tr style="height: 28px; background-color: ${idx % 2 === 0 ? '#ffffff' : '#f8fafc'};">
          <td style="border: 1px solid #cbd5e1; text-align: center; font-weight: bold; mso-number-format:'0';">${idx + 1}</td>
          <td style="border: 1px solid #cbd5e1; text-align: center; font-weight: bold; color: #0f172a; font-family: monospace;">#${ord.id}</td>
          <td style="border: 1px solid #cbd5e1; text-align: right; font-weight: bold; color: #0f172a; padding: 0 8px;">${ord.customerName}</td>
          <td style="border: 1px solid #cbd5e1; text-align: center; font-weight: bold; color: #065f46; background-color: #ecfdf5; mso-number-format:'\\#\\,\\#\\#0';">${ord.totalAmount.toLocaleString()} ج.س</td>
          <td style="border: 1px solid #cbd5e1; text-align: center; color: ${ord.discount ? '#b91c1c' : '#64748b'}; mso-number-format:'\\#\\,\\#\\#0';">${ord.discount ? ord.discount.toLocaleString() + ' ج.س' : '0'}</td>
          <td style="border: 1px solid #cbd5e1; text-align: center; color: #334155; mso-number-format:'\\#\\,\\#\\#0';">${(ord.deliveryFee || 0).toLocaleString()} ج.س</td>
          <td style="border: 1px solid #cbd5e1; text-align: center; font-weight: bold;">${payMethodLabel}</td>
          <td style="border: 1px solid #cbd5e1; text-align: center; color: ${ord.paymentStatus === 'verified' ? '#047857' : '#b45309'}; font-weight: bold;">${payStatusLabel}</td>
          <td style="border: 1px solid #cbd5e1; text-align: center; font-weight: bold; color: #1e293b;">${statusLabel}</td>
          <td style="border: 1px solid #cbd5e1; text-align: center; color: #334155;">${fileCount} ملف (${pageCount} ص)</td>
          <td style="border: 1px solid #cbd5e1; text-align: right; color: #475569; padding: 0 8px;">${location || 'المكتبة'}</td>
          <td style="border: 1px solid #cbd5e1; text-align: center; color: #64748b; font-size: 11px;">${dateFormatted}</td>
        </tr>
      `;
    }).join('');

    const excelTemplate = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40" dir="rtl" lang="ar">
      <head>
        <meta http-equiv="content-type" content="text/plain; charset=UTF-8"/>
        <!--[if gte mso 9]>
        <xml>
          <x:ExcelWorkbook>
            <x:ExcelWorksheets>
              <x:ExcelWorksheet>
                <x:Name>كشف الطلبات والعملاء</x:Name>
                <x:WorksheetOptions>
                  <x:DisplayRightToLeft/>
                  <x:Print>
                    <x:ValidPrinterInfo/>
                  </x:Print>
                </x:WorksheetOptions>
              </x:ExcelWorksheet>
            </x:ExcelWorksheets>
          </x:ExcelWorkbook>
        </xml>
        <![endif]-->
        <style>
          body { font-family: 'Segoe UI', Tahoma, Arial, sans-serif; direction: rtl; }
          table { border-collapse: collapse; width: 100%; }
          th { background-color: #0f172a; color: #ffffff; font-weight: bold; text-align: center; height: 35px; border: 1px solid #334155; }
        </style>
      </head>
      <body>
        <table>
          <!-- Header Banner with Logo / Branding -->
          <tr>
            <th colspan="12" style="background-color: #0f172a; color: #fbbf24; font-size: 18pt; font-weight: bold; text-align: center; height: 50px; border: none;">
              🖨️ مكتبة A4 للطباعة والخدمات الطلابية - كشف إدارة الطلبيات والتقرير المالي
            </th>
          </tr>
          <tr>
            <th colspan="12" style="background-color: #1e293b; color: #ffffff; font-size: 11pt; text-align: center; height: 30px; border: none;">
              تاريخ التصدير: ${new Date().toLocaleString('ar-SD')} | عدد الطلبات الإجمالي: ${filtered.length} طلب | إجمالي المبيعات: ${sumTotalAmount.toLocaleString()} ج.س | الخصومات الكلية: ${sumDiscount.toLocaleString()} ج.س
            </th>
          </tr>
          <tr><td colspan="12" style="height: 15px;"></td></tr>

          <!-- Table Headers -->
          <thead>
            <tr style="height: 35px;">
              <th style="background-color: #0f172a; color: #ffffff; border: 1px solid #334155; width: 40px;">#</th>
              <th style="background-color: #0f172a; color: #ffffff; border: 1px solid #334155; width: 100px;">رقم الطلب</th>
              <th style="background-color: #0f172a; color: #ffffff; border: 1px solid #334155; width: 180px;">اسم العميل</th>
              <th style="background-color: #0f172a; color: #fbbf24; border: 1px solid #334155; width: 130px;">المبلغ الإجمالي (ج.س)</th>
              <th style="background-color: #0f172a; color: #ffffff; border: 1px solid #334155; width: 100px;">الخصم (ج.س)</th>
              <th style="background-color: #0f172a; color: #ffffff; border: 1px solid #334155; width: 110px;">رسوم التوصيل</th>
              <th style="background-color: #0f172a; color: #ffffff; border: 1px solid #334155; width: 100px;">طريقة الدفع</th>
              <th style="background-color: #0f172a; color: #ffffff; border: 1px solid #334155; width: 110px;">حالة الاعتماد</th>
              <th style="background-color: #0f172a; color: #ffffff; border: 1px solid #334155; width: 130px;">حالة الطلب الحالية</th>
              <th style="background-color: #0f172a; color: #ffffff; border: 1px solid #334155; width: 120px;">الملفات والصفحات</th>
              <th style="background-color: #0f172a; color: #ffffff; border: 1px solid #334155; width: 200px;">الموقع والمنطقة</th>
              <th style="background-color: #0f172a; color: #ffffff; border: 1px solid #334155; width: 140px;">تاريخ ووقت الطلب</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
          <tfoot>
            <tr style="height: 38px; background-color: #f1f5f9; font-weight: bold;">
              <td colspan="3" style="border: 2px solid #0f172a; text-align: center; color: #0f172a; font-size: 13px; background-color: #e2e8f0;">
                الإجمالي الكلي المالي (${filtered.length} طلب)
              </td>
              <td style="border: 2px solid #0f172a; text-align: center; color: #065f46; font-size: 14px; background-color: #d1fae5;">
                ${sumTotalAmount.toLocaleString()} ج.س
              </td>
              <td style="border: 2px solid #0f172a; text-align: center; color: #b91c1c; font-size: 13px;">
                ${sumDiscount.toLocaleString()} ج.س
              </td>
              <td style="border: 2px solid #0f172a; text-align: center; color: #334155; font-size: 13px;">
                ${sumDelivery.toLocaleString()} ج.س
              </td>
              <td colspan="6" style="border: 2px solid #0f172a; background-color: #e2e8f0; text-align: center; color: #475569; font-size: 11px;">
                تم استخراج الكشف تلقائياً من نظام مكتبة A4 للطباعة
              </td>
            </tr>
          </tfoot>
        </table>
      </body>
      </html>
    `;

    const blob = new Blob(['\uFEFF' + excelTemplate], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `كشف_الطلبيات_والعملاء_مكتبة_A4_${new Date().toISOString().split('T')[0]}.xls`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportQuickOrdersCSV = () => {
    const filtered = orders.filter(ord => {
      if (!quickSearchTerm.trim()) return true;
      const q = quickSearchTerm.toLowerCase();
      return (
        ord.id.toLowerCase().includes(q) ||
        ord.customerName.toLowerCase().includes(q)
      );
    });

    const headers = ['رقم الطلب', 'اسم العميل', 'المبلغ الإجمالي (جنيه)', 'الخصم (جنيه)', 'رسوم التوصيل (جنيه)', 'طريقة الدفع', 'حالة الدفع', 'حالة الطلب', 'عدد الملفات', 'إجمالي الصفحات', 'الموقع والجامعة', 'التاريخ'];
    const rows = filtered.map(o => [
      o.id,
      `"${o.customerName.replace(/"/g, '""')}"`,
      o.totalAmount,
      o.discount || 0,
      o.deliveryFee || 0,
      o.paymentMethod === 'bankak' ? 'بنكك' : o.paymentMethod === 'okash' ? 'أوكاش' : 'نقداً',
      o.paymentStatus === 'verified' ? 'مؤكد' : 'قيد التأكيد',
      getStatusBadgeInfo(o.status).label,
      o.files ? o.files.length : 0,
      o.totalPages || 0,
      `"${[o.city, o.addressOrCampus, o.institution].filter(Boolean).join(' - ').replace(/"/g, '""')}"`,
      new Date(o.createdAt).toLocaleString('ar-SD')
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `كشف_الطلبيات_والعملاء_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingRates, setEditingRates] = useState<PricingRates>({ ...rates });
  const [isSaved, setIsSaved] = useState(false);
  const [isPromoSaved, setIsPromoSaved] = useState(false);
  const [simSheetPrice, setSimSheetPrice] = useState<number>(rates.bwPerPage || 200);

  // Expenses Management State
  const [expenses, setExpenses] = useState<Expense[]>(() => getStoredExpenses());
  const [expTitle, setExpTitle] = useState('');
  const [expCategory, setExpCategory] = useState<Expense['category']>('raw_materials');
  const [expAmount, setExpAmount] = useState<string>('');
  const [expDate, setExpDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [expPaymentMethod, setExpPaymentMethod] = useState<Expense['paymentMethod']>('bankak');
  const [expPaidTo, setExpPaidTo] = useState('');
  const [expNotes, setExpNotes] = useState('');
  const [expFilterCategory, setExpFilterCategory] = useState<string>('all');

  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(expAmount);
    if (!expTitle.trim() || isNaN(numAmount) || numAmount <= 0) {
      alert('يرجى إدخال وصف ومبلغ صحيح للمنصرفات');
      return;
    }

    const newExpense: Expense = {
      id: `exp-${Date.now()}`,
      title: expTitle.trim(),
      category: expCategory,
      amount: numAmount,
      date: expDate || new Date().toISOString().split('T')[0],
      paymentMethod: expPaymentMethod,
      paidTo: expPaidTo.trim() || undefined,
      notes: expNotes.trim() || undefined,
      createdAt: new Date().toISOString(),
    };

    const updatedExpenses = [newExpense, ...expenses];
    setExpenses(updatedExpenses);
    saveStoredExpenses(updatedExpenses);

    addLogEntry(
      'expense_added',
      `تم تسجيل منصرف جديد بقيمة ${formatSDG(numAmount)} - (${expTitle})`
    );

    setExpTitle('');
    setExpAmount('');
    setExpPaidTo('');
    setExpNotes('');
    triggerToast('تم تسجيل المنصرف بنجاح! ✓');
  };

  const handleDeleteExpense = (id: string) => {
    const target = expenses.find(x => x.id === id);
    if (!target) return;
    setConfirmDialog({
      isOpen: true,
      title: '🗑️ حذف منصرف مالياتي',
      message: `هل أنت متأكد من رغبتك في حذف هذا المنصرف (${target.title}) بقيمة ${formatSDG(target.amount)}؟`,
      confirmText: 'نعم، حذف',
      cancelText: 'إلغاء',
      type: 'danger',
      onConfirm: () => {
        const updated = expenses.filter(x => x.id !== id);
        setExpenses(updated);
        saveStoredExpenses(updated);
        triggerToast(`تم حذف المنصرف (${target.title}) بنجاح`);
        addLogEntry(
          'expense_deleted',
          `تم حذف المنصرف بقيمة ${formatSDG(target.amount)} - (${target.title})`
        );
      },
    });
  };

  // Deleted Orders (Recycle Bin) State
  const [deletedOrdersList, setDeletedOrdersList] = useState<PrintOrder[]>(() => getStoredDeletedOrders());

  // Universities Management State
  const [universitiesList, setUniversitiesList] = useState<UniversityInfo[]>(() => getStoredUniversities());
  // Academic Levels & Semesters Management State
  const [academicLevelsList, setAcademicLevelsList] = useState<AcademicLevel[]>(() => getStoredAcademicLevels());
  // Degree Tracks Management State (Bachelor & Diploma)
  const [degreeTracksList, setDegreeTracksList] = useState<DegreeTrackInfo[]>(() => getStoredDegreeTracks());
  // Universities View Sub-Tab: 'universities' (الجامعات والكليات) or 'degree_tracks' (الدرجات العلمية) or 'levels_semesters' (المستويات والفصول)
  const [uniSubSection, setUniSubSection] = useState<'universities' | 'degree_tracks' | 'levels_semesters'>('universities');

  // Real-time synchronization of Universities, Degree Tracks, and Levels across all browsers & devices
  useEffect(() => {
    // 1. Fetch latest from Cloud Firestore and Server API on mount
    getUniversitiesFromCloud().then(cloudUnis => {
      if (cloudUnis && Array.isArray(cloudUnis) && cloudUnis.length > 0) {
        setUniversitiesList(cloudUnis);
        try {
          localStorage.setItem('a4_universities_data', JSON.stringify(cloudUnis));
        } catch (e) {}
      } else {
        // Fetch from backend API
        fetch('/api/universities')
          .then(res => res.ok ? res.json() : null)
          .then(data => {
            if (data && Array.isArray(data) && data.length > 0) {
              setUniversitiesList(data);
              try {
                localStorage.setItem('a4_universities_data', JSON.stringify(data));
              } catch (e) {}
            }
          })
          .catch(() => {});
      }
    }).catch(() => {});

    // Initial fetch for Academic Levels
    getAcademicLevelsFromCloud().then(cloudLevels => {
      if (cloudLevels && Array.isArray(cloudLevels) && cloudLevels.length > 0) {
        setAcademicLevelsList(cloudLevels);
        try {
          localStorage.setItem('a4_academic_levels_data', JSON.stringify(cloudLevels));
        } catch (e) {}
      } else {
        fetch('/api/academic-levels')
          .then(res => res.ok ? res.json() : null)
          .then(data => {
            if (data && Array.isArray(data) && data.length > 0) {
              setAcademicLevelsList(data);
              try {
                localStorage.setItem('a4_academic_levels_data', JSON.stringify(data));
              } catch (e) {}
            }
          })
          .catch(() => {});
      }
    }).catch(() => {});

    // Initial fetch for Degree Tracks
    if (typeof getDegreeTracksFromCloud === 'function') {
      getDegreeTracksFromCloud().then(cloudTracks => {
        if (cloudTracks && Array.isArray(cloudTracks) && cloudTracks.length > 0) {
          setDegreeTracksList(cloudTracks);
          try {
            localStorage.setItem('a4_degree_tracks_data', JSON.stringify(cloudTracks));
          } catch (e) {}
        } else {
          fetch('/api/degree-tracks')
            .then(res => res.ok ? res.json() : null)
            .then(data => {
              if (data && Array.isArray(data) && data.length > 0) {
                setDegreeTracksList(data);
                try {
                  localStorage.setItem('a4_degree_tracks_data', JSON.stringify(data));
                } catch (e) {}
              }
            })
            .catch(() => {});
        }
      }).catch(() => {});
    }

    // 2. Subscribe to real-time Firestore changes (Global cross-device sync)
    const unsubscribeCloudUnis = subscribeToCloudUniversities((cloudUnis) => {
      if (cloudUnis && Array.isArray(cloudUnis) && cloudUnis.length > 0) {
        setUniversitiesList(cloudUnis);
        try {
          localStorage.setItem('a4_universities_data', JSON.stringify(cloudUnis));
        } catch (e) {}
      }
    });

    const unsubscribeCloudLevels = subscribeToCloudAcademicLevels((cloudLevels) => {
      if (cloudLevels && Array.isArray(cloudLevels) && cloudLevels.length > 0) {
        setAcademicLevelsList(cloudLevels);
        try {
          localStorage.setItem('a4_academic_levels_data', JSON.stringify(cloudLevels));
        } catch (e) {}
      }
    });

    const unsubscribeCloudTracks = (typeof subscribeToCloudDegreeTracks === 'function')
      ? subscribeToCloudDegreeTracks((cloudTracks) => {
          if (cloudTracks && Array.isArray(cloudTracks) && cloudTracks.length > 0) {
            setDegreeTracksList(cloudTracks);
            try {
              localStorage.setItem('a4_degree_tracks_data', JSON.stringify(cloudTracks));
            } catch (e) {}
          }
        })
      : null;

    // 3. Local custom event & storage event listener
    const handleLocalUpdate = (e: any) => {
      if (e?.detail && Array.isArray(e.detail)) {
        setUniversitiesList(e.detail);
      } else {
        setUniversitiesList(getStoredUniversities());
      }
    };
    window.addEventListener('a4_universities_updated', handleLocalUpdate);

    const handleLevelsLocalUpdate = (e: any) => {
      if (e?.detail && Array.isArray(e.detail)) {
        setAcademicLevelsList(e.detail);
      } else {
        setAcademicLevelsList(getStoredAcademicLevels());
      }
    };
    window.addEventListener('a4_academic_levels_updated', handleLevelsLocalUpdate);

    const handleTracksLocalUpdate = (e: any) => {
      if (e?.detail && Array.isArray(e.detail)) {
        setDegreeTracksList(e.detail);
      } else {
        setDegreeTracksList(getStoredDegreeTracks());
      }
    };
    window.addEventListener('a4_degree_tracks_updated', handleTracksLocalUpdate);

    window.addEventListener('storage', handleLocalUpdate);
    window.addEventListener('storage', handleLevelsLocalUpdate);
    window.addEventListener('storage', handleTracksLocalUpdate);

    // 4. Cross-tab BroadcastChannel listener
    let bc: BroadcastChannel | null = null;
    let levelsBc: BroadcastChannel | null = null;
    let tracksBc: BroadcastChannel | null = null;
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        bc = new BroadcastChannel('a4_universities_channel');
        bc.onmessage = (ev) => {
          if (ev?.data?.type === 'UNIVERSITIES_UPDATED' && Array.isArray(ev?.data?.list)) {
            setUniversitiesList(ev.data.list);
          }
        };
      } catch (e) {}

      try {
        levelsBc = new BroadcastChannel('a4_academic_levels_channel');
        levelsBc.onmessage = (ev) => {
          if (ev?.data?.type === 'ACADEMIC_LEVELS_UPDATED' && Array.isArray(ev?.data?.list)) {
            setAcademicLevelsList(ev.data.list);
          }
        };
      } catch (e) {}

      try {
        tracksBc = new BroadcastChannel('a4_degree_tracks_channel');
        tracksBc.onmessage = (ev) => {
          if (ev?.data?.type === 'DEGREE_TRACKS_UPDATED' && Array.isArray(ev?.data?.list)) {
            setDegreeTracksList(ev.data.list);
          }
        };
      } catch (e) {}
    }

    return () => {
      if (unsubscribeCloudUnis) unsubscribeCloudUnis();
      if (unsubscribeCloudLevels) unsubscribeCloudLevels();
      if (unsubscribeCloudTracks) unsubscribeCloudTracks();
      window.removeEventListener('a4_universities_updated', handleLocalUpdate);
      window.removeEventListener('a4_academic_levels_updated', handleLevelsLocalUpdate);
      window.removeEventListener('a4_degree_tracks_updated', handleTracksLocalUpdate);
      window.removeEventListener('storage', handleLocalUpdate);
      window.removeEventListener('storage', handleLevelsLocalUpdate);
      window.removeEventListener('storage', handleTracksLocalUpdate);
      if (bc) {
        try { bc.close(); } catch (e) {}
      }
      if (levelsBc) {
        try { levelsBc.close(); } catch (e) {}
      }
      if (tracksBc) {
        try { tracksBc.close(); } catch (e) {}
      }
    };
  }, []);

  const [showUniModal, setShowUniModal] = useState<boolean>(false);
  const [editingUniId, setEditingUniId] = useState<string | null>(null);
  const [editingCollegeId, setEditingCollegeId] = useState<string | null>(null);

  // University Form Fields
  const [uniFormName, setUniFormName] = useState('');
  const [uniFormShortName, setUniFormShortName] = useState('');
  const [uniFormDesc, setUniFormDesc] = useState('');
  const [uniFormBadge, setUniFormBadge] = useState('متاحة الآن ✓');

  // College Form Fields
  const [collegeFormName, setCollegeFormName] = useState('');
  const [collegeFormDesc, setCollegeFormDesc] = useState('');
  const [collegeFormBadge, setCollegeFormBadge] = useState('متاحة ✓');
  const [collegeFormLevels, setCollegeFormLevels] = useState<number>(4);
  const [collegeFormDegreeType, setCollegeFormDegreeType] = useState<'bachelor' | 'diploma' | 'both'>('bachelor');

  // Department Form Fields
  const [deptFormName, setDeptFormName] = useState('');
  const [deptFormDesc, setDeptFormDesc] = useState('');

  // Admin Performer Name State
  const [adminPerformerName, setAdminPerformerName] = useState<string>(() => {
    return localStorage.getItem('a4_admin_performer') || 'المسؤول أحمد - قسم الطباعة';
  });

  const handleAdminPerformerChange = (val: string) => {
    setAdminPerformerName(val);
    try {
      localStorage.setItem('a4_admin_performer', val);
    } catch (e) {}
  };

  const handleOpenAddUniModal = (uniToEdit?: UniversityInfo, collegeToEdit?: UniversityCollege) => {
    if (uniToEdit) {
      setEditingUniId(uniToEdit.id);
      setUniFormName(uniToEdit.name);
      setUniFormShortName(uniToEdit.shortName || uniToEdit.name);
      setUniFormDesc(uniToEdit.description || '');
      setUniFormBadge(uniToEdit.badge || 'متاحة الآن ✓');
      if (collegeToEdit) {
        setEditingCollegeId(collegeToEdit.id);
        setCollegeFormName(collegeToEdit.name);
        setCollegeFormDesc(collegeToEdit.description || '');
        setCollegeFormBadge(collegeToEdit.badge || 'متاحة ✓');
        setCollegeFormLevels(collegeToEdit.levelsCount || 4);
        setCollegeFormDegreeType(collegeToEdit.degreeType || 'bachelor');
        setDeptFormName(collegeToEdit.departments[0]?.name || '');
        setDeptFormDesc(collegeToEdit.departments[0]?.description || '');
      } else {
        setEditingCollegeId(null);
        setCollegeFormName('');
        setCollegeFormDesc('');
        setCollegeFormBadge('');
        setCollegeFormLevels(4);
        setCollegeFormDegreeType('bachelor');
        setDeptFormName('');
        setDeptFormDesc('');
      }
    } else {
      setEditingUniId(null);
      setEditingCollegeId(null);
      setUniFormName('');
      setUniFormShortName('');
      setUniFormDesc('');
      setUniFormBadge('متاحة الآن ✓');
      setCollegeFormName('');
      setCollegeFormDesc('');
      setCollegeFormBadge('');
      setCollegeFormLevels(4);
      setCollegeFormDegreeType('bachelor');
      setDeptFormName('');
      setDeptFormDesc('');
    }
    setShowUniModal(true);
  };

  const handleSaveUniversitySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!uniFormName.trim()) {
      alert('الرجاء كتابة اسم الجامعة');
      return;
    }

    let updated = [...universitiesList];

    // Build department object if filled
    const deptObj: CollegeDepartment[] = deptFormName.trim() ? [{
      id: deptFormName.trim(),
      name: deptFormName.trim().startsWith('قسم') ? deptFormName.trim() : `قسم ${deptFormName.trim()}`,
      description: deptFormDesc.trim() || 'المقررات والشيتات المعتمدة للقسم',
    }] : [];

    // Build college object
    const collegeObj: UniversityCollege = {
      id: editingCollegeId || `col_${Date.now()}`,
      name: collegeFormName.trim() || 'الكلية العامة',
      description: collegeFormDesc.trim() || 'شيتات ومذكرات التخصص الأكاديمي',
      badge: collegeFormBadge.trim() || undefined,
      levelsCount: Number(collegeFormLevels) || (collegeFormDegreeType === 'diploma' ? 3 : 4),
      degreeType: collegeFormDegreeType,
      departments: deptObj.length > 0 ? deptObj : [
        { id: 'العام', name: 'قسم العام والتخصصي', description: 'المقررات والشيتات العامة' }
      ],
    };

    if (editingUniId) {
      // Edit existing university
      updated = updated.map(u => {
        if (u.id === editingUniId) {
          let cols = [...u.colleges];
          if (editingCollegeId) {
            cols = cols.map(c => c.id === editingCollegeId ? collegeObj : c);
          } else if (collegeFormName.trim()) {
            cols.push(collegeObj);
          }
          return {
            ...u,
            name: uniFormName.trim(),
            shortName: uniFormShortName.trim() || uniFormName.trim(),
            description: uniFormDesc.trim() || `كليات ومذكرات ${uniFormName.trim()}`,
            badge: uniFormBadge.trim() || 'متاحة الآن ✓',
            collegesCount: cols.length,
            colleges: cols,
          };
        }
        return u;
      });
    } else {
      // Check if university already exists by name
      const existingUni = updated.find(u => u.name.trim() === uniFormName.trim());
      if (existingUni) {
        updated = updated.map(u => {
          if (u.name.trim() === uniFormName.trim()) {
            const cols = [...u.colleges, collegeObj];
            return {
              ...u,
              collegesCount: cols.length,
              colleges: cols,
            };
          }
          return u;
        });
      } else {
        // Create brand new university
        const newUni: UniversityInfo = {
          id: `uni_${Date.now()}`,
          name: uniFormName.trim(),
          shortName: uniFormShortName.trim() || uniFormName.trim(),
          description: uniFormDesc.trim() || `كليات ومذكرات ${uniFormName.trim()}`,
          badge: uniFormBadge.trim() || 'متاحة الآن ✓',
          collegesCount: 1,
          colleges: [collegeObj],
        };
        updated.push(newUni);
      }
    }

    setUniversitiesList(updated);
    saveStoredUniversities(updated);
    addLogEntry('sheet_added', `تمت إضافة/تحديث بيانات الجامعة [${uniFormName.trim()}] والكلية [${collegeFormName.trim() || 'العامة'}] والمستويات (${collegeFormLevels} مستويات) وتحديث المكتبة تلقائياً.`);
    setShowUniModal(false);
    triggerToast(`تم حفظ وتحديث بيانات (${uniFormName.trim()}) وربطها بالمكتبة تلقائياً بنجاح! 🎉`);
  };

  const handleDeleteUniversity = (uniId: string, uniName: string) => {
    setConfirmDialog({
      isOpen: true,
      title: '🗑️ حذف جامعة من المكتبة',
      message: `هل أنت متأكد من حذف (${uniName}) بالكامل من المكتبة والموقع؟`,
      confirmText: 'نعم، حذف الجامعة',
      cancelText: 'إلغاء',
      type: 'danger',
      onConfirm: () => {
        const updated = universitiesList.filter(u => u.id !== uniId);
        setUniversitiesList(updated);
        saveStoredUniversities(updated);
        addLogEntry('order_deleted', `تم حذف الجامعة [${uniName}] بالكامل من المكتبة.`);
        triggerToast(`تم حذف (${uniName}) بنجاح`);
      },
    });
  };

  const handleDeleteCollege = (uniId: string, collegeId: string, collegeName: string) => {
    setConfirmDialog({
      isOpen: true,
      title: '🗑️ حذف كلية',
      message: `هل أنت متأكد من حذف كلية (${collegeName})؟`,
      confirmText: 'نعم، حذف الكلية',
      cancelText: 'إلغاء',
      type: 'danger',
      onConfirm: () => {
        const updated = universitiesList.map(u => {
          if (u.id === uniId) {
            const cols = u.colleges.filter(c => c.id !== collegeId);
            return { ...u, collegesCount: cols.length, colleges: cols };
          }
          return u;
        });
        setUniversitiesList(updated);
        saveStoredUniversities(updated);
        addLogEntry('order_deleted', `تم حذف كلية [${collegeName}] من المكتبة.`);
        triggerToast(`تم حذف كلية (${collegeName}) بنجاح`);
      },
    });
  };

  const handleResetUniversitiesDefault = () => {
    setConfirmDialog({
      isOpen: true,
      title: '🔄 إعادة ضبط الجامعات',
      message: 'هل أنت متأكد من إعادة ضبط قائمة الجامعات والكليات إلى الوضع الافتراضي؟',
      confirmText: 'نعم، إعادة الضبط',
      cancelText: 'إلغاء',
      type: 'warning',
      onConfirm: () => {
        setUniversitiesList(SUDAN_UNIVERSITIES);
        saveStoredUniversities(SUDAN_UNIVERSITIES);
        addLogEntry('pricing_updated', 'تمت إعادة ضبط قائمة الجامعات والكليات إلى الوضع الافتراضي.');
        triggerToast('تمت إعادة ضبط قائمة الجامعات والكليات بنجاح!');
      },
    });
  };

  const handleToggleUniversityActive = (uniId: string) => {
    const targetUni = universitiesList.find(u => u.id === uniId);
    if (!targetUni) return;

    const isCurrentlyActive = targetUni.active !== false;
    const nextActive = !isCurrentlyActive;

    const updated = universitiesList.map(u => {
      if (u.id === uniId) {
        return {
          ...u,
          active: nextActive,
          badge: nextActive ? 'متاحة الآن ✓' : 'غير متاح الان',
        };
      }
      return u;
    });

    setUniversitiesList(updated);
    saveStoredUniversities(updated);
    addLogEntry(
      'pricing_updated',
      `تم تغيير حالة إتاحة جامعة [${targetUni.name}] إلى: (${nextActive ? 'متاحة للطلاب ON 🟢' : 'غير متاح الان OFF 🔴'}).`
    );
    triggerToast(
      nextActive
        ? `🟢 تم تفعيل جامعة (${targetUni.name}) وتعميمها على جميع الأجهزة والمتصفحات`
        : `🔴 تم إيقاف جامعة (${targetUni.name}) وتعميم الإيقاف على جميع الأجهزة والمتصفحات`
    );
  };

  const handleToggleCollegeActive = (uniId: string, collegeId: string, collegeName: string) => {
    const targetUni = universitiesList.find(u => u.id === uniId);
    if (!targetUni) return;

    let nextCollegeActive = true;
    const updated = universitiesList.map(u => {
      if (u.id === uniId) {
        return {
          ...u,
          colleges: u.colleges.map(c => {
            if (c.id === collegeId || c.name === collegeName) {
              const isCurrentlyActive = c.active !== false;
              nextCollegeActive = !isCurrentlyActive;
              return { ...c, active: nextCollegeActive };
            }
            return c;
          }),
        };
      }
      return u;
    });

    setUniversitiesList(updated);
    saveStoredUniversities(updated);
    addLogEntry(
      'pricing_updated',
      `تم تغيير حالة إتاحة كلية [${collegeName}] بـ [${targetUni.name}] إلى (${nextCollegeActive ? 'ON' : 'OFF'}).`
    );
    triggerToast(
      nextCollegeActive
        ? `🟢 تم تفعيل كلية (${collegeName}) وتعميمها على جميع الأجهزة والمتصفحات`
        : `🔴 تم إيقاف كلية (${collegeName}) وتعميم الإيقاف على جميع الأجهزة والمتصفحات`
    );
  };

  const handleToggleLevelActive = (levelNum: number) => {
    const targetLevel = academicLevelsList.find(l => l.levelNum === levelNum);
    if (!targetLevel) return;

    const isCurrentlyActive = targetLevel.active !== false;
    const nextActive = !isCurrentlyActive;

    const updated = academicLevelsList.map(l => {
      if (l.levelNum === levelNum) {
        return {
          ...l,
          active: nextActive,
        };
      }
      return l;
    });

    setAcademicLevelsList(updated);
    saveStoredAcademicLevels(updated);
    addLogEntry(
      'pricing_updated',
      `تم تغيير حالة إتاحة المستوى الأكاديمي [${targetLevel.title}] إلى (${nextActive ? 'متاح للطلاب ON 🟢' : 'غير متاح OFF 🔴'}).`
    );
    triggerToast(
      nextActive
        ? `🟢 تم تفعيل ${targetLevel.title} وإتاحته لجميع الطلاب في المكتبة`
        : `🔴 تم إيقاف ${targetLevel.title} ومنع دخول الطلاب إليه فوراً`
    );
  };

  const handleToggleSemesterActive = (levelNum: number, semesterId: number, semesterTitle: string) => {
    const targetLevel = academicLevelsList.find(l => l.levelNum === levelNum);
    if (!targetLevel) return;

    let nextSemesterActive = true;
    const updated = academicLevelsList.map(l => {
      if (l.levelNum === levelNum) {
        return {
          ...l,
          semesters: l.semesters.map(s => {
            if (s.id === semesterId) {
              const isCurrentlyActive = s.active !== false;
              nextSemesterActive = !isCurrentlyActive;
              return { ...s, active: nextSemesterActive };
            }
            return s;
          }),
        };
      }
      return l;
    });

    setAcademicLevelsList(updated);
    saveStoredAcademicLevels(updated);
    addLogEntry(
      'pricing_updated',
      `تم تغيير حالة إتاحة [${semesterTitle}] بـ [${targetLevel.title}] إلى (${nextSemesterActive ? 'ON 🟢' : 'OFF 🔴'}).`
    );
    triggerToast(
      nextSemesterActive
        ? `🟢 تم تفعيل (${semesterTitle}) وإتاحته للطلاب بالمكتبة`
        : `🔴 تم إيقاف (${semesterTitle}) ومنع دخول الطلاب إليه فوراً`
    );
  };

  const handleResetAcademicLevelsDefault = () => {
    setConfirmDialog({
      isOpen: true,
      title: '🔄 إعادة ضبط المستويات والفصول',
      message: 'هل أنت متأكد من رغبتك في إعادة ضبط إتاحة جميع المستويات والفصول الدراسية للوضع الافتراضي؟',
      confirmText: 'نعم، إعادة الضبط',
      cancelText: 'إلغاء',
      type: 'warning',
      onConfirm: () => {
        setAcademicLevelsList(ACADEMIC_LEVELS);
        saveStoredAcademicLevels(ACADEMIC_LEVELS);
        addLogEntry('pricing_updated', 'تمت إعادة ضبط إتاحة جميع المستويات والفصول الدراسية إلى الوضع الافتراضي.');
        triggerToast('تمت إعادة ضبط المستويات والفصول الدراسية بنجاح!');
      },
    });
  };

  const handleToggleDegreeTrack = (trackId: 'bachelor' | 'diploma') => {
    const targetTrack = degreeTracksList.find(t => t.id === trackId);
    if (!targetTrack) return;

    const isCurrentlyActive = targetTrack.active !== false;
    const nextActive = !isCurrentlyActive;

    const updated = degreeTracksList.map(t => {
      if (t.id === trackId) {
        return {
          ...t,
          active: nextActive,
        };
      }
      return t;
    });

    setDegreeTracksList(updated);
    saveStoredDegreeTracks(updated);
    addLogEntry(
      'pricing_updated',
      `تم تغيير حالة إتاحة مسار [${targetTrack.name}] إلى: (${nextActive ? 'متاح للطلاب ON 🟢' : 'غير متاح OFF 🔴'}).`
    );
    triggerToast(
      nextActive
        ? `🟢 تم تفعيل مسار (${targetTrack.name}) وإتاحته للطلاب بالمكتبة`
        : `🔴 تم إيقاف مسار (${targetTrack.name}) ومنع دخول الطلاب إليه فوراً`
    );
  };

  const handleResetDegreeTracksDefault = () => {
    setConfirmDialog({
      isOpen: true,
      title: '🔄 إعادة ضبط مسارات الدرجات العلمية',
      message: 'هل أنت متأكد من رغبتك في إعادة ضبط إتاحة مساري البكالوريوس والدبلوم للوضع الافتراضي (متاحين)؟',
      confirmText: 'نعم، إعادة الضبط',
      cancelText: 'إلغاء',
      type: 'warning',
      onConfirm: () => {
        setDegreeTracksList(DEFAULT_DEGREE_TRACKS);
        saveStoredDegreeTracks(DEFAULT_DEGREE_TRACKS);
        addLogEntry('pricing_updated', 'تمت إعادة ضبط إتاحة مسارات الدرجات العلمية (البكالوريوس والدبلوم) إلى الوضع الافتراضي.');
        triggerToast('تمت إعادة ضبط مسارات الدرجات العلمية بنجاح!');
      },
    });
  };

  // Activity Log State & Initial Sample Logs
  const INITIAL_ACTIVITY_LOGS: ActivityLog[] = [
    {
      id: 'log-101',
      adminName: 'المسؤول أحمد (إدارة الطباعة)',
      actionType: 'status_change',
      orderId: 'A4-SD-9102',
      customerName: 'محمد أحمد هارون',
      details: 'تم تغيير حالة الطلب A4-SD-9102 إلى (قيد الطباعة 🖨️)',
      timestamp: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
    },
    {
      id: 'log-102',
      adminName: 'الإدارة المالية (عمر)',
      actionType: 'payment_verified',
      orderId: 'A4-SD-9102',
      customerName: 'محمد أحمد هارون',
      details: 'تم مراجعة وتأكيد إشعار تحويل بنكك (رقم الإشعار: BNK-7849120) وتأكيد الدفع ✅',
      timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    },
    {
      id: 'log-103',
      adminName: 'المسؤول أحمد (إدارة الطباعة)',
      actionType: 'status_change',
      orderId: 'A4-SD-8821',
      customerName: 'فاطمة الزهراء علي',
      details: 'تم تغيير حالة الطلب A4-SD-8821 إلى (جاهز للاستلام بالمكتبة 🏪)',
      timestamp: new Date(Date.now() - 1000 * 60 * 110).toISOString(),
    },
    {
      id: 'log-104',
      adminName: 'إدارة الكوبونات (سارة)',
      actionType: 'coupon_added',
      details: 'تم إنشاء كوبون تخفيض جديد (BATCH29) بنسبة خصم 15% لطلاب دفعة 29',
      timestamp: new Date(Date.now() - 1000 * 60 * 280).toISOString(),
    },
    {
      id: 'log-105',
      adminName: 'إدارة المكتبة والأسعار',
      actionType: 'sheet_added',
      details: 'تمت إضافة شيت جديد لمكتبة الكلية: "شيت مبادئ المحاسبة المالية (1)" - دفعة 33 و 34',
      timestamp: new Date(Date.now() - 1000 * 60 * 520).toISOString(),
    }
  ];

  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>(() => {
    try {
      const raw = localStorage.getItem('a4_activity_logs');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return INITIAL_ACTIVITY_LOGS;
  });

  // Helper function to append a log entry
  const addLogEntry = (
    actionType: ActivityLog['actionType'],
    details: string,
    orderId?: string,
    customerName?: string
  ) => {
    const newLog: ActivityLog = {
      id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      adminName: adminPerformerName || 'مسؤول النظام',
      actionType,
      orderId,
      customerName,
      details,
      timestamp: new Date().toISOString(),
    };

    setActivityLogs(prev => {
      const updated = [newLog, ...prev];
      try {
        localStorage.setItem('a4_activity_logs', JSON.stringify(updated.slice(0, 200)));
      } catch (e) {}
      return updated;
    });
  };

  // Activity Log View Filters
  const [logSearchQuery, setLogSearchQuery] = useState('');
  const [logActionFilter, setLogActionFilter] = useState<string>('all');

  // Filtered activity logs
  const filteredActivityLogs = activityLogs.filter(log => {
    if (logActionFilter !== 'all' && log.actionType !== logActionFilter) {
      return false;
    }
    if (logSearchQuery.trim()) {
      const q = logSearchQuery.toLowerCase().trim();
      const matchAdmin = (log.adminName || '').toLowerCase().includes(q);
      const matchOrder = (log.orderId || '').toLowerCase().includes(q);
      const matchCustomer = (log.customerName || '').toLowerCase().includes(q);
      const matchDetails = (log.details || '').toLowerCase().includes(q);
      return matchAdmin || matchOrder || matchCustomer || matchDetails;
    }
    return true;
  });

  const handleClearActivityLogs = () => {
    setConfirmDialog({
      isOpen: true,
      title: '🧹 مسح سجل النشاط الإداري',
      message: 'هل أنت متأكد من مسح كافة سجلات النشاط الإداري؟ لا يمكن التراجع عن هذا الإجراء.',
      confirmText: 'نعم، مسح السجلات',
      cancelText: 'إلغاء',
      type: 'danger',
      onConfirm: () => {
        setActivityLogs([]);
        try {
          localStorage.removeItem('a4_activity_logs');
        } catch (e) {}
        triggerToast('تم مسح سجل النشاط الإداري بنجاح 🧹');
      },
    });
  };

  const handleExportActivityLogsCSV = () => {
    let csv = '\uFEFF';
    csv += '"التاريخ والوقت","اسم المسؤول","نوع الإجراء","رقم الطلب","اسم العميل/الطالب","تفاصيل الإجراء الإداري"\r\n';
    filteredActivityLogs.forEach(l => {
      const d = new Date(l.timestamp);
      const dateStr = !isNaN(d.getTime()) ? `${d.toLocaleDateString('ar-SD')} ${d.toLocaleTimeString('ar-SD', { hour: '2-digit', minute: '2-digit' })}` : l.timestamp;
      const typeLabel = l.actionType === 'status_change' ? 'تغيير حالة طلب'
        : l.actionType === 'payment_verified' ? 'تأكيد دفع مالي'
        : l.actionType === 'order_deleted' ? 'حذف طلب'
        : l.actionType === 'coupon_added' ? 'إضافة كوبون'
        : l.actionType === 'coupon_deleted' ? 'حذف كوبون'
        : l.actionType === 'pricing_updated' ? 'تحديث أسعار'
        : l.actionType === 'sheet_added' ? 'إضافة شيت' : 'إجراء إداري';
      
      csv += `"${dateStr}","${(l.adminName || '').replace(/"/g, '""')}","${typeLabel}","${(l.orderId || '-').replace(/"/g, '""')}","${(l.customerName || '-').replace(/"/g, '""')}","${(l.details || '').replace(/"/g, '""')}"\r\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Activity_Logs_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Coupon Form States
  const [newCouponCode, setNewCouponCode] = useState('');
  const [newCouponDiscount, setNewCouponDiscount] = useState<number>(15);
  const [newCouponBatch, setNewCouponBatch] = useState<string>('all');
  const [newCouponNotes, setNewCouponNotes] = useState('');

  const handleCreateCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCouponCode.trim()) return;
    const created: Coupon = {
      id: `coupon-${Date.now()}`,
      code: newCouponCode.trim().toUpperCase(),
      discountPercentage: Number(newCouponDiscount) || 10,
      targetBatch: newCouponBatch,
      isActive: true,
      notes: newCouponNotes.trim() || undefined,
      createdAt: new Date().toISOString(),
    };
    if (onAddCoupon) {
      onAddCoupon(created);
      addLogEntry(
        'coupon_added',
        `تم إنشاء كوبون تخفيض جديد برمز [${created.code}] وبنسبة خصم ${created.discountPercentage}% (${created.targetBatch === 'all' ? 'جميع الدفعات' : created.targetBatch})`
      );
    }
    setNewCouponCode('');
    setNewCouponDiscount(15);
    setNewCouponNotes('');
    alert(`تم إنشاء كود الخصم "${created.code}" بنسبة ${created.discountPercentage}% بنجاح! 🎉`);
  };

  // Sheet Management Form & Filter States
  const [sheetTitle, setSheetTitle] = useState('');
  const [sheetInstitution, setSheetInstitution] = useState('جامعة النيلين');
  const [sheetFaculty, setSheetFaculty] = useState('كلية علوم الحاسوب وتقانة المعلومات');
  const [sheetDept, setSheetDept] = useState<string>('قسم علوم الحاسوب');
  const [sheetDegree, setSheetDegree] = useState<'bachelor' | 'diploma'>('bachelor');
  const [sheetBatch, setSheetBatch] = useState('batch_33_34');
  const [sheetSemester, setSheetSemester] = useState<number>(1);
  const [sheetSubject, setSheetSubject] = useState('');
  const [sheetPages, setSheetPages] = useState<number>(25);
  const [sheetAuthor, setSheetAuthor] = useState('');
  const [sheetPrice, setSheetPrice] = useState<number>(2700);
  const [sheetColor, setSheetColor] = useState<'bw' | 'color'>('bw');
  const [sheetBinding, setSheetBinding] = useState<BindingType>('spiral_plastic');
  const [sheetAvailable, setSheetAvailable] = useState<boolean>(true);
  const [sheetSuccessMsg, setSheetSuccessMsg] = useState('');

  // Keep sheet form default selections synced with universitiesList
  useEffect(() => {
    if (universitiesList.length > 0) {
      const matchUni = universitiesList.find(u => u.name === sheetInstitution);
      if (!matchUni) {
        const defaultUni = universitiesList[0];
        setSheetInstitution(defaultUni.name);
        const defaultCol = defaultUni.colleges[0];
        if (defaultCol) {
          setSheetFaculty(defaultCol.name);
          setSheetDept(defaultCol.departments[0]?.name || 'قسم العام والتخصصي');
          if (defaultCol.degreeType === 'diploma') setSheetDegree('diploma');
        }
      }
    }
  }, [universitiesList]);

  // Sheets Table Search & Filter
  const [sheetSearch, setSheetSearch] = useState('');
  const [sheetDeptFilter, setSheetDeptFilter] = useState('all');
  const [sheetSemesterFilter, setSheetSemesterFilter] = useState('all');

  // Quick Inline Sheet Prices & Saving States
  const [quickPrices, setQuickPrices] = useState<Record<string, number>>({});
  const [savingAllSheets, setSavingAllSheets] = useState(false);

  const handleSaveAllSheets = async () => {
    setSavingAllSheets(true);
    try {
      if (onBatchSaveSheets) {
        onBatchSaveSheets(sheets);
      }
      triggerToast('✅ تم حفظ كافة الشيتات والأسعار وتحديث مكتبة الطلاب ودليل الليدر بنجاح! 📚✨');
    } catch (e) {
      triggerToast('تم الحفظ وتحديث مكتبة الطلاب بنجاح!');
    } finally {
      setTimeout(() => setSavingAllSheets(false), 600);
    }
  };

  // Editing Sheet State
  const [editingSheet, setEditingSheet] = useState<StudySheet | null>(null);

  // Recalculate estimated price when pages or rates change
  useEffect(() => {
    if (sheetPages > 0) {
      const printedSheets = Math.ceil(sheetPages / 2);
      const calculated = printedSheets * (rates.bwPerPage || 200) + (rates.bindingPrice?.spiral_plastic || 1200);
      setSheetPrice(calculated);
    }
  }, [sheetPages, rates]);

  const handleCreateSheetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sheetTitle.trim() || !sheetSubject.trim()) return;

    if (!sheetInstitution || !sheetFaculty) {
      alert('⚠️ تعذر الحفظ: يجب اختيار جامعة وكلية معتمدة بالموقع. إذا لم تكن الجامعة أو الكلية مضافة، يرجى الانتقال إلى (إدارة الجامعات والكليات) لإضافتها أولاً.');
      return;
    }

    const created: StudySheet = {
      id: `sheet-${Date.now()}`,
      title: sheetTitle.trim(),
      institution: sheetInstitution,
      facultyOrYear: sheetFaculty,
      department: sheetDept,
      degreeType: sheetDegree,
      batchNumber: sheetBatch,
      semester: sheetSemester,
      subject: sheetSubject.trim(),
      pageCount: sheetPages || 30,
      authorOrLecturer: sheetAuthor.trim() || 'دكتور المادة',
      fileUrl: '#',
      downloadCount: 1,
      recommendedColor: sheetColor,
      recommendedBinding: sheetBinding,
      priceEstimate: sheetPrice > 0 ? sheetPrice : 5000,
      isAvailable: sheetAvailable,
    };

    onAddSheet(created);
    addLogEntry(
      'sheet_added',
      `تمت إضافة شيت جديد لمكتبة الكلية: "${created.title}" - المادة: ${created.subject} (${created.facultyOrYear})`
    );
    setSheetSuccessMsg(`تمت إضافة الشيت "${created.title}" وحفظه بمكتبة الطلاب بنجاح! 🎉`);
    triggerToast(`✅ تمت إضافة شيت "${created.title}" وحفظه بمكتبة الطلاب بنجاح! 🎉`);
    setTimeout(() => setSheetSuccessMsg(''), 4000);

    // Reset Title and Subject
    setSheetTitle('');
    setSheetSubject('');
    setSheetAuthor('');
  };

  // Google Sheets Integration States
  const [accessToken, setAccessToken] = useState<string>(() => localStorage.getItem('a4_google_access_token') || '');
  const [spreadsheetId, setSpreadsheetId] = useState<string>(() => localStorage.getItem('a4_spreadsheet_id') || '');
  const [spreadsheetUrl, setSpreadsheetUrl] = useState<string>(() => localStorage.getItem('a4_spreadsheet_url') || '');
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatusMsg, setSyncStatusMsg] = useState('');

  const handleConnectGoogleSheets = () => {
    if (typeof window === 'undefined' || !(window as any).google?.accounts?.oauth2) {
      alert('جاري تحميل مكتبة قوقل، يرجى إعادة المحاولة بعد لحظات');
      return;
    }

    fetch('/api/auth/config')
      .then(r => r.json())
      .then(config => {
        if (!config.clientId) {
          alert('OAuth Client ID غير مهيأ بعد');
          return;
        }

        const client = (window as any).google.accounts.oauth2.initTokenClient({
          client_id: config.clientId,
          scope: 'https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive.file',
          callback: async (response: any) => {
            if (response.error) {
              console.error('Google OAuth error:', response);
              setSyncStatusMsg(`خطأ في تصريح قوقل: ${response.error_description || response.error}`);
              return;
            }
            if (response.access_token) {
              setAccessToken(response.access_token);
              localStorage.setItem('a4_google_access_token', response.access_token);
              setSyncStatusMsg('تم ربط حساب قوقل بنجاح! ✅ جاري إنشاء وتهيئة الشيت تلقائياً...');
              handleInitSheet(response.access_token);
            }
          },
          error_callback: (err: any) => {
            console.error('GIS Error:', err);
            setSyncStatusMsg(`خطأ بمكتبة قوقل: ${err?.message || 'تعذر فتح نافذة تسجيل الدخول'}`);
          }
        });
        client.requestAccessToken();
      })
      .catch(() => {
        alert('فشل الحصول على إعدادات OAuth');
      });
  };

  const handleInitSheet = async (tokenOverride?: string) => {
    const tok = tokenOverride || accessToken || localStorage.getItem('a4_google_access_token');
    if (!tok) {
      alert('يرجى ربط حساب قوقل أولاً');
      return;
    }

    setIsSyncing(true);
    try {
      const res = await fetch('/api/google-sheets/init-sheet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${tok}`
        },
        body: JSON.stringify({
          spreadsheetId: spreadsheetId || localStorage.getItem('a4_spreadsheet_id') || undefined
        })
      });
      const data = await res.json();
      if (data.success) {
        setSpreadsheetId(data.spreadsheetId);
        setSpreadsheetUrl(data.spreadsheetUrl);
        localStorage.setItem('a4_spreadsheet_id', data.spreadsheetId);
        localStorage.setItem('a4_spreadsheet_url', data.spreadsheetUrl);
        setSyncStatusMsg('تم إنشاء وتهيئة جدول قوقل شيت للطلبات بنجاح! 📊');
      } else {
        if (res.status === 401 || res.status === 403 || data.error?.includes('invalid_grant')) {
          setAccessToken('');
          localStorage.removeItem('a4_google_access_token');
          setSyncStatusMsg('انتهت صلاحية الجلسة. يرجى الضغط على "ربط حساب قوقل" مرة أخرى للتصريح.');
        } else {
          setSyncStatusMsg(`خطأ: ${data.error}`);
        }
      }
    } catch (err) {
      setSyncStatusMsg('حدث خطأ أثناء إعداد شيت قوقل');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSyncAllOrders = async () => {
    const tok = accessToken || localStorage.getItem('a4_google_access_token');
    const sheetId = spreadsheetId || localStorage.getItem('a4_spreadsheet_id');
    if (!tok || !sheetId) {
      alert('يرجى ربط حساب قوقل وتجهيز الشيت أولاً');
      return;
    }

    setIsSyncing(true);
    try {
      const res = await fetch('/api/google-sheets/sync-all', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${tok}`
        },
        body: JSON.stringify({
          spreadsheetId: sheetId,
          orders: orders
        })
      });
      const data = await res.json();
      if (data.success) {
        setSyncStatusMsg(`تمت المزامنة وتصدير ${data.count} طلب بنجاح لجدول قوقل! 🎉`);
      } else {
        if (res.status === 401 || res.status === 403 || data.error?.includes('invalid_grant')) {
          setAccessToken('');
          localStorage.removeItem('a4_google_access_token');
          setSyncStatusMsg('انتهت صلاحية الجلسة. يرجى إعادة ربط حساب قوقل.');
        } else {
          setSyncStatusMsg(`خطأ بالمزامنة: ${data.error}`);
        }
      }
    } catch (err) {
      setSyncStatusMsg('حدث خطأ أثناء المزامنة مع قوقل شيت');
    } finally {
      setIsSyncing(false);
    }
  };

  // Rate Simulator States
  const [simPages, setSimPages] = useState<number>(30);
  const [simColor, setSimColor] = useState<PrintColor>('bw');
  const [simSides, setSimSides] = useState<PrintSides>('double');
  const [simPps, setSimPps] = useState<number>(1);
  const [simBinding, setSimBinding] = useState<BindingType>('spiral_plastic');

  // Keep editingRates updated if rates prop updates from parent
  useEffect(() => {
    setEditingRates({ ...rates });
  }, [rates]);

  useEffect(() => {
    if (isAuthenticated && onRefreshOrders) {
      onRefreshOrders();
      const interval = setInterval(() => {
        onRefreshOrders();
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, onRefreshOrders]);

  // PIN Authentication Handler
  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput.trim() === 'Frog192192#') {
      setIsAuthenticated(true);
      sessionStorage.setItem('a4_admin_auth', 'true');
      localStorage.setItem('a4_admin_auth', 'true');
      setPinError('');
      setPinInput('');
    } else {
      setPinError('رمز الدخول غير صحيح! يرجى التأكد من PIN وإعادة المحاولة.');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('a4_admin_auth');
    localStorage.removeItem('a4_admin_auth');
  };

  // Active orders strictly excluding any deleted order or tombstoned ID
  const activeOrders = useMemo(() => {
    const deletedMap = new Set([
      ...deletedOrdersList.map(d => (d?.id || '').toLowerCase()),
      ...getStoredDeletedIds().map(id => id.toLowerCase())
    ]);
    return orders.filter(o => o && o.id && !o.deletedAt && !deletedMap.has(o.id.toLowerCase()));
  }, [orders, deletedOrdersList]);

  // Stats calculation
  const totalOrdersCount = activeOrders.length;
  const pendingOrdersCount = activeOrders.filter(o => o.status === 'pending' || o.status === 'reviewing').length;
  const completedOrdersCount = activeOrders.filter(o => o.status === 'completed').length;
  const totalRevenue = activeOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  const totalPagesPrinted = activeOrders.reduce((sum, o) => sum + (o.totalPages || 0), 0);

  // Daily Summary Filter State & Logic
  const [summaryFilter, setSummaryFilter] = useState<'today' | 'yesterday' | 'last_7' | 'month' | 'all' | 'custom'>('today');
  
  const getTodayLocalDateStr = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [customDate, setCustomDate] = useState<string>(getTodayLocalDateStr());

  const getLocalDateString = (dateInput: string | number) => {
    if (!dateInput) return '';
    try {
      let d: Date;
      if (typeof dateInput === 'number' || !isNaN(Number(dateInput))) {
        d = new Date(Number(dateInput));
      } else {
        d = new Date(dateInput);
      }
      if (isNaN(d.getTime())) return '';
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    } catch {
      return '';
    }
  };

  const todayLocalDate = getTodayLocalDateStr();

  const yesterdayDateObj = new Date();
  yesterdayDateObj.setDate(yesterdayDateObj.getDate() - 1);
  const yesterdayLocalDate = `${yesterdayDateObj.getFullYear()}-${String(yesterdayDateObj.getMonth() + 1).padStart(2, '0')}-${String(yesterdayDateObj.getDate()).padStart(2, '0')}`;

  const sevenDaysAgoDate = new Date();
  sevenDaysAgoDate.setDate(sevenDaysAgoDate.getDate() - 7);

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const summaryOrders = activeOrders.filter(o => {
    const oDateStr = getLocalDateString(o.createdAt);
    let oDateObj: Date;
    if (typeof o.createdAt === 'number' || !isNaN(Number(o.createdAt))) {
      oDateObj = new Date(Number(o.createdAt));
    } else {
      oDateObj = new Date(o.createdAt);
    }

    if (summaryFilter === 'today') {
      return oDateStr === todayLocalDate;
    }
    if (summaryFilter === 'yesterday') {
      return oDateStr === yesterdayLocalDate;
    }
    if (summaryFilter === 'last_7') {
      return !isNaN(oDateObj.getTime()) && oDateObj >= sevenDaysAgoDate;
    }
    if (summaryFilter === 'month') {
      return !isNaN(oDateObj.getTime()) && oDateObj.getMonth() === currentMonth && oDateObj.getFullYear() === currentYear;
    }
    if (summaryFilter === 'custom') {
      return oDateStr === customDate;
    }
    return true; // 'all'
  });

  // Completed or Verified orders in period
  const completedSummaryOrders = summaryOrders.filter(
    o => o.status === 'completed' || o.paymentStatus === 'verified'
  );
  const completedSummaryCount = completedSummaryOrders.length;
  const completedTotalAmount = completedSummaryOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);

  // Bankak Collections
  const bankakSummaryOrders = summaryOrders.filter(
    o => o.paymentMethod === 'bankak' && (o.status === 'completed' || o.paymentStatus === 'verified')
  );
  const bankakTotalAmount = bankakSummaryOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);

  // Okash Collections
  const okashSummaryOrders = summaryOrders.filter(
    o => o.paymentMethod === 'okash' && (o.status === 'completed' || o.paymentStatus === 'verified')
  );
  const okashTotalAmount = okashSummaryOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);

  // Fawry Collections
  const fawrySummaryOrders = summaryOrders.filter(
    o => o.paymentMethod === 'fawry' && (o.status === 'completed' || o.paymentStatus === 'verified')
  );
  const fawryTotalAmount = fawrySummaryOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);

  // Cash Collections
  const cashSummaryOrders = summaryOrders.filter(
    o => ((o.paymentMethod as string) === 'cash' || !o.paymentMethod) && (o.status === 'completed' || o.paymentStatus === 'verified')
  );
  const cashTotalAmount = cashSummaryOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);

  // Total Printed Pages
  const summaryTotalPages = summaryOrders.reduce((sum, o) => {
    return sum + o.files.reduce((fileSum, f) => {
      const sheetsCount = Math.ceil(f.pageCount / (f.pagesPerSheet || 1));
      return fileSum + (sheetsCount * f.copies);
    }, 0);
  }, 0);

  const handlePrintDailyReport = () => {
    const filterLabel = summaryFilter === 'today' 
      ? `تاريخ اليوم: ${todayLocalDate}` 
      : summaryFilter === 'yesterday' 
      ? `تاريخ الأمس: ${yesterdayLocalDate}` 
      : summaryFilter === 'custom' 
      ? `تاريخ مخصص: ${customDate}` 
      : 'تقرير إجمالي الفترات';

    const reportHtml = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="utf-8">
        <title>تقرير المبيعات والتحصيل اليومي - مكتبة A4 Sudan</title>
        <style>
          body { font-family: system-ui, -apple-system, sans-serif; padding: 30px; background: #fff; color: #0f172a; line-height: 1.5; }
          .header { text-align: center; border-bottom: 3px solid #047857; padding-bottom: 15px; margin-bottom: 20px; }
          .title { font-size: 22px; font-weight: bold; color: #065f46; }
          .subtitle { font-size: 14px; color: #475569; margin-top: 4px; }
          .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 25px; }
          .card { background: #f0fdf4; border: 1px solid #bbf7d0; padding: 12px; border-radius: 10px; text-align: center; }
          .card-title { font-size: 12px; color: #166534; font-weight: bold; }
          .card-val { font-size: 20px; font-weight: bold; color: #064e3b; margin-top: 4px; }
          table { width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 12px; }
          th, td { border: 1px solid #cbd5e1; padding: 8px 10px; text-align: right; }
          th { background: #f1f5f9; font-weight: bold; color: #0f172a; }
          .bankak-highlight { background: #fef3c7; border: 2px solid #f59e0b; padding: 15px; border-radius: 12px; margin-bottom: 20px; text-align: right; }
          .footer { margin-top: 30px; border-top: 1px solid #e2e8f0; padding-top: 15px; text-align: center; font-size: 11px; color: #64748b; }
          @media print {
            body { padding: 10px; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title">📄 تقرير المبيعات والتحصيل البنكي اليومي</div>
          <div class="subtitle">مكتبة A4 Sudan لطباعة الشيتات والخدمات الجامعية • ${filterLabel}</div>
          <p style="font-size: 11px; color: #64748b; margin-top: 4px;">تاريخ استخراج التقرير: ${new Date().toLocaleString('ar-SD')}</p>
        </div>

        <div class="bankak-highlight">
          <div style="font-size: 14px; font-weight: bold; color: #78350f;">🏦 إجمالي التحصيل عبر تطبيق بنكك (Bankak):</div>
          <div style="font-size: 26px; font-weight: bold; color: #92400e; margin-top: 4px;">${formatSDG(bankakTotalAmount)}</div>
          <div style="font-size: 12px; color: #b45309; margin-top: 2px;">عدد عمليات التحويل المؤكدة: ${bankakSummaryOrders.length} عملية تحويل</div>
        </div>

        <div class="grid">
          <div class="card">
            <div class="card-title">الطلبات المكتملة</div>
            <div class="card-val">${completedSummaryCount} طلب</div>
          </div>
          <div class="card">
            <div class="card-title">إجمالي التحصيل الكلي</div>
            <div class="card-val">${formatSDG(completedTotalAmount)}</div>
          </div>
          <div class="card">
            <div class="card-title">ورق الطباعة المنجز</div>
            <div class="card-val">${summaryTotalPages} ورقة</div>
          </div>
          <div class="card">
            <div class="card-title">تحصيل التطبيقات الأخرى</div>
            <div class="card-val">${formatSDG(okashTotalAmount + fawryTotalAmount + cashTotalAmount)}</div>
          </div>
        </div>

        <h3>📋 قائمة الطلبات المكتملة والمؤكدة بالفترة (${completedSummaryOrders.length}):</h3>
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>كود الطلب</th>
              <th>اسم الطالب / العميل</th>
              <th>رقم الهاتف</th>
              <th>الجامعة والتخصص</th>
              <th>طريقة الدفع</th>
              <th>رقم الإشعار المرجعي</th>
              <th>المبلغ المستلم</th>
            </tr>
          </thead>
          <tbody>
            ${completedSummaryOrders.length > 0 ? completedSummaryOrders.map((o, i) => `
              <tr>
                <td>${i + 1}</td>
                <td><strong>${o.id}</strong></td>
                <td>${o.customerName}</td>
                <td>${o.customerPhone}</td>
                <td>${o.institution || 'عام'} - ${o.specialization || ''}</td>
                <td>${o.paymentMethod === 'bankak' ? 'بنكك' : o.paymentMethod === 'okash' ? 'أوكاش' : o.paymentMethod === 'fawry' ? 'فوري' : 'نقدي'}</td>
                <td>${o.bankakTransactionId || '-'}</td>
                <td><strong>${formatSDG(o.totalAmount)}</strong></td>
              </tr>
            `).join('') : `
              <tr>
                <td colspan="8" style="text-align: center; color: #94a3b8; padding: 20px;">لا توجد طلبات مكتملة في هذه الفترة المحددة</td>
              </tr>
            `}
          </tbody>
        </table>

        <div class="footer">
          A4 SUDAN PRINTING & ACADEMIC SERVICES • DAILY SALES & BANKAK SUMMARY REPORT
        </div>

        <script>
          window.onload = function() { window.print(); }
        </script>
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(reportHtml);
      printWindow.document.close();
    }
  };

  const handleExportCSV = () => {
    // CSV UTF-8 BOM
    let csvContent = '\uFEFF';

    // Headers
    const headers = [
      'كود الطلب',
      'تاريخ الطلب',
      'الوقت',
      'اسم العميل/الطالب',
      'رقم الهاتف',
      'الجامعة',
      'التخصص/الدفعة',
      'طريقة الدفع',
      'رقم إشعار التحويل',
      'حالة الدفع',
      'حالة الطلب',
      'طريقة التسليم',
      'المدينة والعنوان',
      'إجمالي الورق المطبوع',
      'المجموع الفرعي (SDG)',
      'رسوم التوصيل (SDG)',
      'الخصم (SDG)',
      'المبلغ الصافي النهائي (SDG)'
    ];

    csvContent += headers.map(h => `"${h.replace(/"/g, '""')}"`).join(',') + '\r\n';

    // Rows from summaryOrders
    summaryOrders.forEach(o => {
      const dateObj = new Date(o.createdAt);
      const dateStr = !isNaN(dateObj.getTime()) ? dateObj.toLocaleDateString('ar-SD') : '';
      const timeStr = !isNaN(dateObj.getTime()) ? dateObj.toLocaleTimeString('ar-SD', { hour: '2-digit', minute: '2-digit' }) : '';
      
      const totalSheets = o.files.reduce((sum, f) => {
        const sheetsCount = Math.ceil(f.pageCount / (f.pagesPerSheet || 1));
        return sum + (sheetsCount * f.copies);
      }, 0);

      const payMethodLabel = o.paymentMethod === 'bankak' ? 'بنكك' 
        : o.paymentMethod === 'okash' ? 'أوكاش' 
        : o.paymentMethod === 'fawry' ? 'فوري' 
        : 'نقدي';

      const payStatusLabel = o.paymentStatus === 'verified' ? 'مؤكد الدفع ✅' : 'بانتظار التأكيد ⏳';
      
      const badge = getStatusBadgeInfo(o.status);

      const row = [
        o.id,
        dateStr,
        timeStr,
        o.customerName || '',
        o.customerPhone || '',
        o.institution || 'جامعة النيلين',
        o.specialization || '',
        payMethodLabel,
        o.bankakTransactionId || '',
        payStatusLabel,
        badge.label,
        o.deliveryMethod === 'pickup' ? 'استلام من المكتبة' : 'توصيل',
        `${o.city || ''} - ${o.addressOrCampus || ''}`,
        totalSheets,
        o.subtotal || 0,
        o.deliveryFee || 0,
        o.discount || 0,
        o.totalAmount || 0
      ];

      csvContent += row.map(val => `"${String(val).replace(/"/g, '""')}"`).join(',') + '\r\n';
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const filterSuffix = summaryFilter === 'custom' ? customDate : summaryFilter;
    link.setAttribute('download', `A4_Sudan_Sales_Report_${filterSuffix}_${getTodayLocalDateStr()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Filtering & Search
  const filteredOrders = activeOrders.filter(o => {
    // Status Filter
    if (statusFilter !== 'all' && o.status !== statusFilter) {
      return false;
    }
    // Search Query Filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchName = (o.customerName || '').toLowerCase().includes(q);
      const matchPhone = (o.customerPhone || '').toLowerCase().includes(q) || (o.customerPhone2 || '').toLowerCase().includes(q);
      const matchId = (o.id || '').toLowerCase().includes(q);
      const matchCity = (o.city || '').toLowerCase().includes(q);
      return matchName || matchPhone || matchId || matchCity;
    }
    return true;
  });

  const handleAdminStatusChange = (order: PrintOrder, newStatus: OrderStatus) => {
    const oldBadge = getStatusBadgeInfo(order.status).label;
    const newBadge = getStatusBadgeInfo(newStatus).label;
    onUpdateOrderStatus(order.id, newStatus);
    addLogEntry(
      'status_change',
      `تم تغيير حالة الطلب (${order.id}) للعميل/الطالب "${order.customerName}" من [${oldBadge}] إلى [${newBadge}]`,
      order.id,
      order.customerName
    );
  };

  const handleDeliveryTimeTextChange = (orderId: string, val: string) => {
    setEditingDeliveryTimes(prev => ({ ...prev, [orderId]: val }));
  };

  const handleSaveDeliveryTime = (order: PrintOrder, overrideTime?: string) => {
    const currentEdited = editingDeliveryTimes[order.id];
    const timeToSave = overrideTime !== undefined 
      ? overrideTime 
      : (currentEdited !== undefined ? currentEdited : (order.estimatedCompletionTime || getEstimatedDeliveryText(order)));

    setEditingDeliveryTimes(prev => ({ ...prev, [order.id]: timeToSave }));

    // Update via parent prop
    onUpdateOrderStatus(order.id, order.status, order.paymentStatus === 'verified' ? 'verified' : undefined, timeToSave);

    // Show temporary "تم الحفظ ✓" feedback
    setSavedTimeFeedback(prev => ({ ...prev, [order.id]: true }));
    setTimeout(() => {
      setSavedTimeFeedback(prev => ({ ...prev, [order.id]: false }));
    }, 2000);

    addLogEntry(
      'status_change',
      `تم تحديد الموعد المتوقع لتسليم طلب (${order.id}) للعميل/الطالب "${order.customerName}" إلى: "${timeToSave}"`,
      order.id,
      order.customerName
    );
  };

  const handleAdminVerifyPayment = (order: PrintOrder) => {
    onUpdateOrderStatus(order.id, order.status, 'verified');
    addLogEntry(
      'payment_verified',
      `تم تأكيد ودفع رسوم الطلب (${order.id}) للعميل/الطالب "${order.customerName}" بمبلغ (${formatSDG(order.totalAmount)}) عبر ${order.paymentMethod === 'bankak' ? 'تطبيق بنكك' : order.paymentMethod === 'okash' ? 'تطبيق أوكاش' : order.paymentMethod === 'fawry' ? 'تطبيق فوري' : 'دفع نقدي'}${order.bankakTransactionId ? ` [إشعار: ${order.bankakTransactionId}]` : ''}`,
      order.id,
      order.customerName
    );
  };

  // Real-time synchronization of deleted orders (Recycle Bin) across all devices and browsers
  useEffect(() => {
    const fetchDeleted = async () => {
      try {
        const [cloudDeleted, serverDeleted] = await Promise.allSettled([
          getDeletedOrdersFromCloud(),
          fetch('/api/deleted-orders').then(r => r.ok ? r.json() : [])
        ]);
        const cloudList = cloudDeleted.status === 'fulfilled' && Array.isArray(cloudDeleted.value) ? cloudDeleted.value : [];
        const serverList = serverDeleted.status === 'fulfilled' && Array.isArray(serverDeleted.value) ? serverDeleted.value : [];
        
        const map = new Map<string, PrintOrder>();
        getStoredDeletedOrders().forEach(d => { if (d && d.id) map.set(d.id.toLowerCase(), d); });
        serverList.forEach((d: PrintOrder) => { if (d && d.id) map.set(d.id.toLowerCase(), d); });
        cloudList.forEach((d: PrintOrder) => { if (d && d.id) map.set(d.id.toLowerCase(), d); });
        
        const merged = Array.from(map.values());
        merged.sort((a, b) => new Date(b.deletedAt || b.createdAt || 0).getTime() - new Date(a.deletedAt || a.createdAt || 0).getTime());
        setDeletedOrdersList(merged);
        saveStoredDeletedOrders(merged);
      } catch (e) {}
    };

    fetchDeleted();

    const unsubscribeDeleted = subscribeToCloudDeletedOrders((cloudDeleted) => {
      if (Array.isArray(cloudDeleted)) {
        setDeletedOrdersList(cloudDeleted);
        saveStoredDeletedOrders(cloudDeleted);
      }
    });

    return () => {
      if (unsubscribeDeleted) unsubscribeDeleted();
    };
  }, []);

  const handleDelete = (orderId: string, customerName: string) => {
    setConfirmDialog({
      isOpen: true,
      title: '⚠️ استئذان وتأكيد نقل الطلب للسلة',
      message: `بعد إذنك، هل أنت متأكد من حذف الطلب (#${orderId}) للعميل "${customerName}" ونقله إلى سلة المحذوفات؟ سيتم حذفه من الطلبات الواردة فوراً في كافة المتصفحات ونقله للسلة.`,
      confirmText: 'نعم، نقل إلى السلة 🗑️',
      cancelText: 'تراجع وإلغاء ❌',
      type: 'danger',
      onConfirm: () => {
        let targetOrder = orders.find(o => o.id === orderId);
        if (!targetOrder) {
          const stored = getStoredOrders();
          targetOrder = stored.find(o => o.id === orderId);
        }

        if (targetOrder) {
          const deletedOrder: PrintOrder = {
            ...targetOrder,
            deletedAt: new Date().toISOString(),
          };
          const updatedDeleted = [deletedOrder, ...deletedOrdersList.filter(o => o.id !== orderId)];
          setDeletedOrdersList(updatedDeleted);
          saveStoredDeletedOrders(updatedDeleted);
          saveStoredDeletedId(orderId);

          // Sync to Cloud Firestore & Backend API
          saveDeletedOrderToCloud(deletedOrder).catch(() => {});
          fetch('/api/deleted-orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(deletedOrder),
          }).catch(() => {});
        }

        if (onDeleteOrder) {
          onDeleteOrder(orderId);
        }

        triggerToast(`تم حذف الطلب (#${orderId}) من الطلبات الواردة ونقله للسلة بنجاح 🗑️`);

        addLogEntry(
          'order_deleted',
          `تم نقل الطلب (${orderId}) التابع للعميل/الطالب "${customerName}" إلى سلة المحذوفات وحذفه من كافة المتصفحات 🗑️`,
          orderId,
          customerName
        );
      },
    });
  };

  const handleRestoreOrderFromTrash = (deletedOrder: PrintOrder) => {
    setConfirmDialog({
      isOpen: true,
      title: '🔄 استرجاع الطلب إلى القائمة الحالية',
      message: `هل تريد استرجاع الطلب (#${deletedOrder.id}) للعميل "${deletedOrder.customerName}" إلى قائمة الطلبات الحالية؟`,
      confirmText: 'نعم، استرجاع الطلب 🔄',
      cancelText: 'إلغاء ❌',
      type: 'info',
      onConfirm: () => {
        const updatedDeleted = deletedOrdersList.filter(o => o.id !== deletedOrder.id);
        setDeletedOrdersList(updatedDeleted);
        saveStoredDeletedOrders(updatedDeleted);
        removeStoredDeletedId(deletedOrder.id);

        const restoredOrder: PrintOrder = { ...deletedOrder };
        delete restoredOrder.deletedAt;

        // Sync with Cloud Firestore and backend
        restoreOrderInCloud(restoredOrder).catch(() => {});
        fetch(`/api/deleted-orders/${deletedOrder.id}/restore`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(restoredOrder),
        }).catch(() => {});

        const currentOrders = getStoredOrders();
        const updatedOrders = [restoredOrder, ...currentOrders.filter(o => o.id !== restoredOrder.id)];
        saveStoredOrders(updatedOrders);

        window.dispatchEvent(new Event('a4_orders_updated'));
        if (onRefreshOrders) {
          onRefreshOrders();
        }

        triggerToast(`تم استرجاع الطلب (#${deletedOrder.id}) للعميل "${deletedOrder.customerName}" بنجاح 🟢`);

        addLogEntry(
          'status_change',
          `تم استرجاع الطلب (${deletedOrder.id}) التابع للعميل "${deletedOrder.customerName}" من سلة المحذوفات إلى قائمة الطلبات الحالية 🟢`,
          deletedOrder.id,
          deletedOrder.customerName
        );
      },
    });
  };

  const handlePermanentDeleteOrder = (orderId: string, customerName: string) => {
    setConfirmDialog({
      isOpen: true,
      title: '❌ حذف نهائي من كافة الإصدارات والمتصفحات',
      message: `⚠️ تحذير: هل أنت متأكد من حذف الطلب (#${orderId}) للعميل "${customerName}" نهائياً من سلة المحذوفات؟ سيتم حذفه نهائياً من كافة المتصفحات والسيرفر وقاعدة البيانات ولا يمكن استرجاعه أبداً.`,
      confirmText: 'نعم، حذف نهائي ❌',
      cancelText: 'إلغاء',
      type: 'danger',
      onConfirm: () => {
        const updatedDeleted = deletedOrdersList.filter(o => o.id !== orderId);
        setDeletedOrdersList(updatedDeleted);
        saveStoredDeletedOrders(updatedDeleted);
        saveStoredDeletedId(orderId);

        // Delete permanently from Cloud Firestore & Backend API
        deleteDeletedOrderFromCloud(orderId).catch(() => {});
        fetch(`/api/deleted-orders/${orderId}`, {
          method: 'DELETE',
        }).catch(() => {});

        triggerToast(`تم حذف الطلب (#${orderId}) نهائياً من كافة المتصفحات والإصدارات ❌`);

        addLogEntry(
          'order_deleted',
          `تم حذف الطلب (${orderId}) التابع للعميل "${customerName}" نهائياً من سلة المحذوفات وكافة المتصفحات ❌`,
          orderId,
          customerName
        );
      },
    });
  };

  const handleEmptyTrash = () => {
    setConfirmDialog({
      isOpen: true,
      title: '🧹 تفريغ سلة المحذوفات نهائياً',
      message: '⚠️ تحذير مهم: هل أنت متأكد من تفريغ سلة المحذوفات بالكامل؟ سيتم مسح وحذف جميع الطلبات المحذوفة نهائياً من كافة المتصفحات وقاعدة البيانات!',
      confirmText: 'نعم، تفريغ السلة نهائياً 🧹',
      cancelText: 'إلغاء',
      type: 'danger',
      onConfirm: () => {
        deletedOrdersList.forEach(item => {
          if (item && item.id) saveStoredDeletedId(item.id);
        });
        setDeletedOrdersList([]);
        saveStoredDeletedOrders([]);

        // Empty trash in Cloud Firestore & Backend API
        emptyDeletedOrdersInCloud().catch(() => {});
        fetch('/api/deleted-orders/empty', {
          method: 'POST',
        }).catch(() => {});

        triggerToast('تم تفريغ سلة المحذوفات وحذف جميع الطلبات نهائياً من كافة المتصفحات 🧹');
        addLogEntry(
          'order_deleted',
          `تم تفريغ سلة المحذوفات بالكامل وحذف جميع الطلبات نهائياً من كافة المتصفحات`
        );
      },
    });
  };

  const handleQuickSavePromoPrice = async (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    const valid = {
      ...DEFAULT_PRICING_RATES,
      ...editingRates,
      promoPaperPrice: editingRates.promoPaperPrice ?? 99
    };
    // 1. Update parent state & trigger local/global sync
    onUpdateRates(valid);
    // 2. Direct cloud sync to Firestore
    savePricingRatesToCloud(valid).catch(() => {});
    // 3. Sync to API backend
    try {
      await fetch('/api/pricing', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(valid),
      });
    } catch (err) {}
    
    setIsPromoSaved(true);
    setIsSaved(true);
    setTimeout(() => {
      setIsPromoSaved(false);
      setIsSaved(false);
    }, 4000);
    addLogEntry(
      'pricing_updated',
      `تم تحديث سعر الورقة الترويجي في العروض والصفحة الرئيسية إلى (${valid.promoPaperPrice} ج.س)`
    );
  };

  const handleSaveRates = async (e: React.FormEvent) => {
    e.preventDefault();
    const valid = {
      ...DEFAULT_PRICING_RATES,
      ...editingRates,
      promoPaperPrice: editingRates.promoPaperPrice ?? 99
    };
    onUpdateRates(valid);
    savePricingRatesToCloud(valid).catch(() => {});

    try {
      const res = await fetch('/api/pricing', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(valid),
      });
      if (res.ok) {
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 3000);
        addLogEntry(
          'pricing_updated',
          `تم تحديث تعريفات أسعار الطباعة والتجليد (أبيض/أسود: ${valid.bwPerPage} ج.س، ألوان: ${valid.colorPerPage} ج.س، العرض: ${valid.promoPaperPrice} ج.س)`
        );
      }
    } catch (err) {
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
      addLogEntry(
        'pricing_updated',
        `تم تحديث تعريفات أسعار الطباعة والتجليد محلياً`
      );
    }
  };

  // IF NOT AUTHENTICATED -> SHOW PIN ENTRY MODAL
  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto py-12 px-4">
        <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden text-slate-800">
          <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-emerald-900 text-white p-8 text-center border-b border-emerald-700">
            <div className="w-16 h-16 bg-emerald-500/20 text-emerald-300 rounded-2xl border border-emerald-400/30 flex items-center justify-center mx-auto mb-4 shadow-inner">
              <Lock className="w-8 h-8 text-emerald-300" />
            </div>
            <h2 className="text-2xl font-black text-white">إدارة مكتبة A4 SUDAN</h2>
            <p className="text-emerald-200/80 text-xs sm:text-sm mt-1">
              الرجاء إدخال رمز دخول الأدمن (PIN Code) للوصول للوحة التحكم
            </p>
          </div>

          <form onSubmit={handlePinSubmit} className="p-6 sm:p-8 space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-2">
                رمز دخول الأدمن (PIN Code):
              </label>
              <div className="relative">
                <KeyRound className="w-5 h-5 text-slate-400 absolute right-3.5 top-3.5" />
                <input
                  type="password"
                  required
                  autoFocus
                  value={pinInput}
                  onChange={e => setPinInput(e.target.value)}
                  placeholder="أدخل الرمز السرّي..."
                  className="w-full pr-11 pl-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono text-lg text-slate-900 tracking-widest"
                />
              </div>
              {pinError && (
                <div className="mt-2 text-xs text-rose-600 font-bold flex items-center gap-1.5 bg-rose-50 p-2.5 rounded-lg border border-rose-200">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{pinError}</span>
                </div>
              )}
            </div>

            <button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-3.5 px-4 rounded-xl shadow-md transition-all text-sm flex items-center justify-center gap-2 cursor-pointer"
            >
              <ShieldCheck className="w-5 h-5" />
              <span>دخول لوحة التحكم</span>
            </button>

            <div className="text-center pt-2">
              <span className="text-[11px] text-slate-400 block font-mono">
                A4 SUDAN ADMIN ACCESS CONTROL
              </span>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // Computed helpers for current selected university/college/departments in Add Sheet form
  const currentFormUni = universitiesList.find(u => u.name === sheetInstitution) || universitiesList[0];
  const currentFormColleges = currentFormUni ? currentFormUni.colleges : [];
  const currentFormCollege = currentFormColleges.find(c => c.name === sheetFaculty) || currentFormColleges[0];
  const currentFormDepts = currentFormCollege ? currentFormCollege.departments : [];

  // AUTHENTICATED ADMIN DASHBOARD
  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6">
      
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-emerald-900 text-white rounded-3xl p-6 sm:p-8 mb-8 border border-emerald-700 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-emerald-300 font-bold text-xs mb-1">
            <ShieldCheck className="w-4 h-4 text-emerald-300" />
            لوحة تحكم وطباعة مكتبة A4 Sudan • (a4_orders)
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">
            إدارة الطلبات والأسعار
          </h1>
          <p className="text-emerald-200/80 text-xs sm:text-sm mt-1">
            متابعة طلبات الزبائن والطلاب، تغيير حالات الطباعة والتوصيل، وحذف وتعديل البيانات
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {onRefreshOrders && (
            <button
              onClick={onRefreshOrders}
              className="px-3 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-emerald-800/90 hover:bg-emerald-700 text-emerald-100 border border-emerald-600/50 transition-all flex items-center gap-1.5 cursor-pointer"
              title="تحديث قائمة الطلبات"
            >
              <RefreshCw className="w-4 h-4 text-emerald-300" />
              <span>تحديث الطلبات</span>
            </button>
          )}
          {/* Combined Orders & Trash Management Dropdown Button */}
          <div className="relative">
            <button
              onClick={() => {
                setShowOrdersMenu(!showOrdersMenu);
                if (activeTab !== 'orders' && activeTab !== 'trash') {
                  setActiveTab('orders');
                }
              }}
              className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'orders' || activeTab === 'trash'
                  ? 'bg-amber-400 text-amber-950 shadow-md ring-2 ring-amber-300 font-extrabold'
                  : 'bg-emerald-900/80 text-emerald-100 hover:bg-emerald-800'
              }`}
            >
              <FileText className="w-4.5 h-4.5 text-amber-900 shrink-0" />
              <span>إدارة الطلبات</span>
              <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${showOrdersMenu ? 'rotate-180' : ''}`} />
            </button>

            {/* Orders Dropdown Menu */}
            {showOrdersMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowOrdersMenu(false)} />
                <div className="absolute top-full right-0 mt-2 w-72 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-2 z-50 flex flex-col gap-1.5 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-3 py-1.5 border-b border-slate-800 text-[11px] font-bold text-amber-400 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5" />
                    <span>حدد خيار إدارة الطلبات:</span>
                  </div>

                  <button
                    onClick={() => {
                      setActiveTab('orders');
                      setShowOrdersMenu(false);
                    }}
                    className={`w-full text-right px-3.5 py-3 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-between gap-2 cursor-pointer ${
                      activeTab === 'orders'
                        ? 'bg-amber-400 text-amber-950 font-black shadow-sm'
                        : 'text-slate-100 hover:bg-slate-800 hover:text-amber-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <FileCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>الطلبات الواردة</span>
                    </div>
                    <span className="text-xs bg-slate-800 text-amber-300 px-2.5 py-0.5 rounded-full border border-amber-400/30 font-mono font-bold">
                      {orders.length}
                    </span>
                  </button>

                  <button
                    onClick={handleOpenTrash}
                    className={`w-full text-right px-3.5 py-3 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-between gap-2 cursor-pointer ${
                      activeTab === 'trash'
                        ? 'bg-rose-500 text-white font-black shadow-sm'
                        : 'text-slate-100 hover:bg-slate-800 hover:text-rose-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Trash2 className="w-4 h-4 text-rose-400 shrink-0" />
                      <span>سلة المحذوفات {isTrashUnlocked ? '🔓' : '🔒'}</span>
                    </div>
                    <span className="text-xs bg-slate-800 text-rose-300 px-2.5 py-0.5 rounded-full border border-rose-400/30 font-mono font-bold">
                      {deletedOrdersList.length}
                    </span>
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Combined Financials Dropdown Button */}
          <div className="relative">
            <button
              onClick={() => {
                setShowFinancialsMenu(!showFinancialsMenu);
                if (activeTab !== 'financials') {
                  setActiveTab('financials');
                }
              }}
              className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'financials'
                  ? 'bg-amber-400 text-amber-950 shadow-md ring-2 ring-amber-300 font-extrabold'
                  : 'bg-emerald-900/80 text-emerald-100 hover:bg-emerald-800'
              }`}
            >
              <Wallet className="w-4.5 h-4.5 text-amber-900 shrink-0" />
              <span>المالية</span>
              <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${showFinancialsMenu ? 'rotate-180' : ''}`} />
            </button>

            {/* Financials Dropdown Menu */}
            {showFinancialsMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowFinancialsMenu(false)} />
                <div className="absolute top-full right-0 mt-2 w-72 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-2 z-50 flex flex-col gap-1.5 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-3 py-1.5 border-b border-slate-800 text-[11px] font-bold text-amber-400 flex items-center gap-1.5">
                    <Wallet className="w-3.5 h-3.5" />
                    <span>إدارة الحسابات والمالية:</span>
                  </div>

                  <button
                    onClick={() => {
                      setActiveTab('financials');
                      setFinancialSubTab('sales');
                      setShowFinancialsMenu(false);
                    }}
                    className={`w-full text-right px-3.5 py-3 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-between gap-2 cursor-pointer ${
                      activeTab === 'financials' && financialSubTab === 'sales'
                        ? 'bg-amber-400 text-amber-950 font-black shadow-sm'
                        : 'text-slate-100 hover:bg-slate-800 hover:text-amber-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <BarChart3 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>ملخص المبيعات والتقارير</span>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      setActiveTab('financials');
                      setFinancialSubTab('expenses');
                      setShowFinancialsMenu(false);
                    }}
                    className={`w-full text-right px-3.5 py-3 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-between gap-2 cursor-pointer ${
                      activeTab === 'financials' && financialSubTab === 'expenses'
                        ? 'bg-amber-400 text-amber-950 font-black shadow-sm'
                        : 'text-slate-100 hover:bg-slate-800 hover:text-amber-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Receipt className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>إضافة وإدارة المنصرفات</span>
                    </div>
                    <span className="text-xs bg-slate-800 text-amber-300 px-2 py-0.5 rounded-full border border-amber-400/30 font-mono font-bold">
                      {expenses.length}
                    </span>
                  </button>

                  <button
                    onClick={() => {
                      setActiveTab('financials');
                      setFinancialSubTab('profit_loss');
                      setShowFinancialsMenu(false);
                    }}
                    className={`w-full text-right px-3.5 py-3 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-between gap-2 cursor-pointer ${
                      activeTab === 'financials' && financialSubTab === 'profit_loss'
                        ? 'bg-amber-400 text-amber-950 font-black shadow-sm'
                        : 'text-slate-100 hover:bg-slate-800 hover:text-amber-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <TrendingUp className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>الربح والخسارة (P&L)</span>
                    </div>
                  </button>
                </div>
              </>
            )}
          </div>


          {/* Combined Sheets & Universities Management Dropdown Button */}
          <div className="relative">
            <button
              onClick={() => {
                setShowSheetsUniMenu(!showSheetsUniMenu);
                if (activeTab !== 'sheets_manage' && activeTab !== 'universities') {
                  setActiveTab('sheets_manage');
                }
              }}
              className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'sheets_manage' || activeTab === 'universities'
                  ? 'bg-amber-400 text-amber-950 shadow-md ring-2 ring-amber-300 font-extrabold'
                  : 'bg-emerald-900/80 text-emerald-100 hover:bg-emerald-800'
              }`}
            >
              <Library className="w-4.5 h-4.5 text-amber-900 shrink-0" />
              <span>إدارة الشيتات والجامعات</span>
              <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${showSheetsUniMenu ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            {showSheetsUniMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowSheetsUniMenu(false)} />
                <div className="absolute top-full right-0 mt-2 w-72 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-2 z-50 flex flex-col gap-1.5 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-3 py-1.5 border-b border-slate-800 text-[11px] font-bold text-amber-400 flex items-center gap-1.5">
                    <Library className="w-3.5 h-3.5" />
                    <span>حدد القسم المطلوب:</span>
                  </div>
                  
                  <button
                    onClick={() => {
                      setActiveTab('sheets_manage');
                      setShowSheetsUniMenu(false);
                    }}
                    className={`w-full text-right px-3.5 py-3 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-between gap-2 cursor-pointer ${
                      activeTab === 'sheets_manage'
                        ? 'bg-amber-400 text-amber-950 font-black shadow-sm'
                        : 'text-slate-100 hover:bg-slate-800 hover:text-amber-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <BookOpen className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>إدارة الشيتات</span>
                    </div>
                    <span className="text-xs bg-slate-800 text-amber-300 px-2.5 py-0.5 rounded-full border border-amber-400/30 font-mono font-bold">
                      {sheets.length}
                    </span>
                  </button>

                  <button
                    onClick={() => {
                      setActiveTab('universities');
                      setShowSheetsUniMenu(false);
                    }}
                    className={`w-full text-right px-3.5 py-3 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-between gap-2 cursor-pointer ${
                      activeTab === 'universities'
                        ? 'bg-amber-400 text-amber-950 font-black shadow-sm'
                        : 'text-slate-100 hover:bg-slate-800 hover:text-amber-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <GraduationCap className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>إدارة الجامعات والكليات</span>
                    </div>
                    <span className="text-xs bg-slate-800 text-amber-300 px-2.5 py-0.5 rounded-full border border-amber-400/30 font-mono font-bold">
                      {universitiesList.length}
                    </span>
                  </button>
                </div>
              </>
            )}
          </div>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'analytics' 
                ? 'bg-amber-400 text-amber-950 shadow-lg ring-2 ring-amber-300 font-extrabold' 
                : 'bg-emerald-900/90 text-amber-300 hover:bg-emerald-800 border border-amber-400/30'
            }`}
            title="إحصائيات الزوار والطلبات وتوزيع الجامعات"
          >
            <BarChart3 className="w-4 h-4 text-amber-400" />
            <span>الإحصائيات والتحليلات 📊</span>
          </button>
          <button
            onClick={() => setActiveTab('sheets')}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'sheets' ? 'bg-amber-400 text-amber-950 shadow-md' : 'bg-emerald-900/80 text-emerald-100 hover:bg-emerald-800'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-900" />
            <span>ربط قوقل شيت</span>
            {spreadsheetId && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('pricing')}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'pricing' ? 'bg-amber-400 text-amber-950 shadow-md ring-2 ring-amber-300 font-extrabold' : 'bg-emerald-900/80 text-emerald-100 hover:bg-emerald-800'
            }`}
          >
            <DollarSign className="w-4 h-4 text-amber-400" />
            <span>تعريفات الأسعار والعروض 💰</span>
          </button>
          <button
            onClick={() => setActiveTab('delivery')}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'delivery' ? 'bg-amber-400 text-amber-950 shadow-md ring-2 ring-amber-300 font-extrabold' : 'bg-emerald-900/80 text-emerald-100 hover:bg-emerald-800'
            }`}
          >
            <Truck className="w-4 h-4 text-amber-400" />
            <span>إدارة مناطق وأسعار التوصيل 🚚</span>
          </button>
          <button
            onClick={() => setActiveTab('coupons')}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'coupons' ? 'bg-amber-400 text-amber-950 shadow-md ring-2 ring-amber-300 font-extrabold' : 'bg-emerald-900/80 text-emerald-100 hover:bg-emerald-800'
            }`}
          >
            <Tag className="w-4 h-4" />
            <span>كوبونات التخفيض ({coupons.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('activity_logs')}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'activity_logs' ? 'bg-amber-400 text-amber-950 shadow-md ring-2 ring-amber-300 font-extrabold' : 'bg-emerald-900/80 text-emerald-100 hover:bg-emerald-800'
            }`}
          >
            <History className="w-4 h-4" />
            <span>سجل النشاط ({activityLogs.length})</span>
          </button>
          <button
            onClick={handleLogout}
            className="px-3 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-rose-900/80 hover:bg-rose-800 text-rose-100 border border-rose-700/50 transition-all flex items-center gap-1.5 cursor-pointer"
            title="تسجيل الخروج من لوحة التحكم"
          >
            <LogOut className="w-4 h-4" />
            <span>قفل</span>
          </button>
        </div>
      </div>

      {/* Stats Quick Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs text-slate-500 font-bold block">إجمالي عدد الطلبات</span>
          <strong className="text-2xl font-black text-slate-900 block mt-1">{totalOrdersCount} طلب</strong>
        </div>

        <div className="bg-emerald-50 p-5 rounded-2xl border border-emerald-200 shadow-sm">
          <span className="text-xs text-emerald-800 font-bold block">إجمالي المبيعات والإيرادات</span>
          <strong className="text-xl sm:text-2xl font-black text-emerald-950 block mt-1">{formatSDG(totalRevenue)}</strong>
        </div>

        <div className="bg-amber-50 p-5 rounded-2xl border border-amber-200 shadow-sm">
          <span className="text-xs text-amber-800 font-bold block">طلبات جديدة معلقة</span>
          <strong className="text-2xl font-black text-amber-950 block mt-1">{pendingOrdersCount} طلب</strong>
        </div>

        <div className="bg-blue-50 p-5 rounded-2xl border border-blue-200 shadow-sm">
          <span className="text-xs text-blue-800 font-bold block">طلبات مكتملة ومسلمة</span>
          <strong className="text-2xl font-black text-blue-950 block mt-1">{completedOrdersCount} طلب</strong>
        </div>

      </div>

      {/* Quick Access Button right under stats rectangles */}
      <div className="mb-8 bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 p-4 rounded-2xl border border-emerald-800/80 shadow-md flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-400 text-amber-950 flex items-center justify-center font-black shadow-sm text-lg shrink-0">
            📋
          </div>
          <div>
            <h4 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
              <span>كشف كافة الطلبيات وبيانات العملاء المختصر</span>
              <span className="text-[11px] bg-amber-400 text-amber-950 px-2 py-0.5 rounded-full font-bold">
                {orders.length} طلب
              </span>
            </h4>
            <p className="text-xs text-slate-300 mt-0.5">وصول سريع وفوري لجميع بيانات وأسماء العملاء وأرقام هاتفهم في جدول شافي ومختصر</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowQuickOrdersModal(true)}
          className="w-full sm:w-auto px-5 py-2.5 bg-amber-400 hover:bg-amber-300 text-amber-950 rounded-xl font-black text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer border border-amber-300 hover:scale-[1.02] active:scale-[0.98]"
        >
          <UserCheck className="w-4.5 h-4.5 text-amber-950" />
          <span>عرض كافة الطلبيات وبيانات العملاء بشكل مختصر 📋</span>
        </button>
      </div>

      {/* ORDERS TAB */}
      {activeTab === 'orders' && (
        <div className="space-y-6">
          
          {/* Search & Status Filter Row */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-4">
            
            {/* Search Input */}
            <div className="relative">
              <Search className="w-5 h-5 text-slate-400 absolute right-3.5 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="بحث باسم العميل، رقم الهاتف، أو كود الطلب..."
                className="w-full pr-11 pl-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none text-slate-900"
              />
            </div>

            {/* Status Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1 text-xs">
              <span className="font-bold text-slate-700 flex items-center gap-1.5 pl-2 shrink-0">
                <Filter className="w-4 h-4 text-slate-400" /> الحالة:
              </span>
              {[
                { id: 'all', label: `الكل (${orders.length})` },
                { id: 'pending', label: 'جديد' },
                { id: 'printing', label: 'جاري الطباعة' },
                { id: 'packaging', label: 'جاري التغليف' },
                { id: 'out_for_delivery', label: 'مع المندوب' },
                { id: 'ready_for_pickup', label: 'جاهز للاستلام' },
                { id: 'completed', label: 'مكتمل' },
                { id: 'cancelled', label: 'ملغي' },
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setStatusFilter(f.id)}
                  className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors shrink-0 ${
                    statusFilter === f.id
                      ? 'bg-emerald-600 text-white font-bold shadow-sm'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Orders Cards List */}
          <div className="space-y-4">
            {filteredOrders.map(order => {
              const badge = getStatusBadgeInfo(order.status);

              return (
                <div 
                  key={order.id}
                  className="bg-white rounded-2xl border-2 border-slate-300 shadow-md p-5 space-y-4 hover:border-emerald-500 transition-all"
                >
                  {/* Top Order Header Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b-2 border-slate-200">
                    <div className="flex flex-wrap items-center gap-3">
                      <strong className="font-mono text-lg sm:text-xl font-black text-slate-900 bg-slate-100 px-3 py-1 rounded-xl border border-slate-300">
                        كود الطلب: {order.id}
                      </strong>
                      <span className={`text-xs font-bold px-3.5 py-1.5 rounded-full border ${badge.bgClass} ${badge.textClass}`}>
                        {badge.label}
                      </span>
                      <span className="text-xs font-bold text-amber-900 bg-amber-50 px-3 py-1 rounded-full border border-amber-300 flex items-center gap-1 shadow-2xs">
                        <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span>الموعد المتوقع: {getEstimatedDeliveryText(order)}</span>
                      </span>
                      <span className="text-xs text-slate-500 font-medium dir-ltr">
                        {new Date(order.createdAt).toLocaleDateString('ar-SD')} {new Date(order.createdAt).toLocaleTimeString('ar-SD', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <div className="text-right bg-emerald-100/80 px-4 py-1.5 rounded-xl border border-emerald-300">
                      <span className="text-[11px] text-emerald-900 font-bold block">إجمالي المستحق:</span>
                      <strong className="text-xl font-black text-emerald-950">{formatSDG(order.totalAmount)}</strong>
                    </div>
                  </div>

                  {/* SINGLE UNIFIED RECTANGLE CONTAINER FOR ALL CLIENT, ACADEMIC, FILE & PAYMENT DATA */}
                  <div className="bg-slate-50 rounded-xl border-2 border-slate-300 overflow-hidden divide-y divide-slate-300 text-xs">
                    
                    {/* Part A: Client, Phone & Delivery Info */}
                    <div className="p-4 bg-white space-y-3">
                      <h4 className="font-black text-slate-900 text-sm flex items-center justify-between border-b border-slate-200 pb-2">
                        <span className="flex items-center gap-2">
                          <UserCheck className="w-4 h-4 text-emerald-700" />
                          <span>بيانات العميل ومسار التسليم والتواصل:</span>
                        </span>
                        <div className="flex items-center gap-2 flex-wrap">
                          <button
                            type="button"
                            onClick={() => setPrintOrderSlip(order)}
                            className="bg-amber-400 hover:bg-amber-500 text-slate-950 font-black px-3 py-1 rounded-lg text-xs transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer border border-amber-300"
                            title="طباعة بوليصة شحن واستلام الطلب لوضعها مع الشيتات بداخل الكيس"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            <span>طباعة بوليصة / ملصق الكيس 🏷️</span>
                          </button>

                          <a
                            href={`https://wa.me/${(order.customerPhone || '').replace(/\D/g, '')}?text=${encodeURIComponent(`السلام عليكم ${order.customerName}، بخصوص طلبية الشيتات كود (${order.id}) عبر A4 Sudan...`)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1 rounded-lg text-xs transition-colors flex items-center gap-1.5 shadow-xs"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                            <span>تواصل واتساب مباشر</span>
                          </a>
                        </div>
                      </h4>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
                        <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                          <span className="text-slate-500 block font-bold mb-0.5">👤 اسم الطالب / العميل:</span>
                          <strong className="text-slate-900 text-sm font-black">{order.customerName}</strong>
                        </div>

                        <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                          <span className="text-slate-500 block font-bold mb-0.5">📞 أرقام الهاتف (أساسي / احتياطي):</span>
                          <strong className="text-slate-900 text-sm font-mono font-black dir-ltr block">
                            {order.customerPhone} {order.customerPhone2 ? ` / ${order.customerPhone2}` : ''}
                          </strong>
                        </div>

                        <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                          <span className="text-slate-500 block font-bold mb-0.5">🏛️ الجامعة / المؤسسة:</span>
                          <strong className="text-slate-900 text-xs sm:text-sm font-bold">{order.institution || 'جامعة النيلين'}</strong>
                        </div>

                        <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                          <span className="text-slate-500 block font-bold mb-0.5">🎓 الكلية / التخصص:</span>
                          <strong className="text-slate-900 text-xs sm:text-sm font-bold">{order.specialization || 'كلية التجارة'}</strong>
                        </div>

                        <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                          <span className="text-slate-500 block font-bold mb-0.5">🚚 طريقة التسليم والمدينة:</span>
                          <strong className="text-slate-900 font-bold">
                            {order.deliveryMethod === 'pickup' ? 'استلام شخصي من المكتبة' : `توصيل إلى ${order.city}`}
                          </strong>
                        </div>

                        <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                          <span className="text-slate-500 block font-bold mb-0.5">📍 العنوان التفصيلي / المجمع:</span>
                          <strong className="text-slate-900 font-bold">{order.addressOrCampus}</strong>
                        </div>
                      </div>

                      {/* Unified Single Rectangle for Academic Path & Notes for the entire Order */}
                      {(() => {
                        const uniqueOrderNotes = Array.from(new Set(order.files.map(f => f.notes).filter(Boolean)));
                        if (uniqueOrderNotes.length === 0) return null;

                        return (
                          <div className="mt-2 bg-emerald-50 px-3.5 py-2.5 rounded-lg border border-emerald-300 text-xs text-emerald-950 space-y-1">
                            <div className="font-extrabold text-emerald-900 flex items-center gap-1.5">
                              <span>📌</span>
                              <span>المسار الأكاديمي والملاحظات الموحدة للطلب:</span>
                            </div>
                            <div className="font-medium text-[11px] sm:text-xs leading-relaxed">
                              {uniqueOrderNotes.join(' || ')}
                            </div>
                          </div>
                        );
                      })()}
                    </div>

                    {/* Part B: Files & Materials List */}
                    <div className="p-4 bg-slate-50 space-y-3">
                      <div className="border-b border-slate-200 pb-2">
                        <h4 className="font-black text-slate-900 text-sm flex items-center gap-2">
                          <FileText className="w-4.5 h-4.5 text-emerald-700" />
                          <span>قائمة المواد والشيتات المطلوب طباعتها ({order.files.length} مادة):</span>
                        </h4>
                      </div>

                      <div className="divide-y divide-slate-200 border border-slate-200 rounded-lg overflow-hidden bg-white">
                        {order.files.map((f, idx) => {
                          return (
                            <div key={idx} className="p-3 hover:bg-emerald-50/40 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                              {/* File Title */}
                              <div className="flex items-center gap-2">
                                <span className="w-5 h-5 rounded-full bg-emerald-800 text-amber-300 font-black text-[11px] flex items-center justify-center shrink-0">
                                  {idx + 1}
                                </span>
                                <strong className="text-slate-900 font-black text-sm sm:text-base">{f.fileName}</strong>
                              </div>

                              {/* Simplified Specs: Copies & Price */}
                              <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
                                <span className="text-slate-800 font-extrabold text-xs bg-slate-100 px-2.5 py-1 rounded border border-slate-300">
                                  عدد النسخ: <strong className="text-slate-950 font-black">{f.copies} عدد</strong>
                                </span>

                                <span className="font-mono font-black text-emerald-950 text-xs sm:text-sm bg-emerald-100 px-2.5 py-1 rounded border border-emerald-300">
                                  السعر: {formatSDG(f.calculatedPrice)}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Part C: Financial & Payment Info */}
                    <div className="p-4 bg-emerald-950 text-white space-y-2.5">
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-emerald-800/80 pb-2 text-emerald-100">
                        <span>إجمالي الطباعة الفرعي: <strong className="text-white font-mono">{formatSDG(order.subtotal)}</strong></span>
                        <span>رسوم التوصيل: <strong className="text-white font-mono">{formatSDG(order.deliveryFee)}</strong></span>
                        
                        {order.discount > 0 ? (
                          <span className="text-amber-300 font-black bg-amber-950/80 px-2.5 py-0.5 rounded border border-amber-500/50">
                            🎟️ تم استخدام كود تخفيض ({order.couponCode || 'كوبون خاص'}): خصم -{formatSDG(order.discount)}
                          </span>
                        ) : (
                          <span className="text-emerald-300/70 text-[11px]">لم يتم استخدام كود تخفيض</span>
                        )}

                        <span className="text-sm font-black text-amber-300">الصافي النهائي: {formatSDG(order.totalAmount)}</span>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-3 pt-0.5">
                        <div>
                          <span>وسيلة الدفع المختارة: </span>
                          <strong className="text-amber-300 font-bold">
                            {order.paymentMethod === 'bankak' ? 'تحويل بنكك (Bankak)' : order.paymentMethod === 'okash' ? 'تحويل أوكاش (O-CASH)' : order.paymentMethod === 'fawry' ? 'تحويل فوري (Fawry)' : 'دفع نقدي'}
                          </strong>
                          {order.bankakTransactionId && (
                            <span className="mr-3 text-white">
                              | رقم الإشعار المرجعي: <strong className="font-mono text-emerald-200 bg-emerald-900 px-2 py-0.5 rounded border border-emerald-700">{order.bankakTransactionId}</strong>
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <span className={`px-2.5 py-1 rounded text-[11px] font-black ${
                            order.paymentStatus === 'verified' ? 'bg-emerald-400 text-slate-950' : 'bg-amber-400 text-slate-950'
                          }`}>
                            {order.paymentStatus === 'verified' ? 'مؤكد الدفع ✅' : 'بانتظار تأكيد المالية ⏳'}
                          </span>

                          {order.bankakProofUrl && (
                            <button
                              type="button"
                              onClick={() => setSelectedProofImage(order.bankakProofUrl!)}
                              className="bg-emerald-800 hover:bg-emerald-700 text-white px-2.5 py-1 rounded border border-emerald-600 font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                            >
                              <ImageIcon className="w-3.5 h-3.5 text-amber-300" />
                              <span>معاينة صورة الإشعار 🔍</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                  </div>

                  {/* Bottom Actions Row: Status Change, Editable Time & Delete Button */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 mt-2">
                    <div className="flex items-center gap-2.5 text-xs flex-wrap">
                      
                      {/* Status Selector */}
                      <div className="flex items-center gap-1.5 bg-slate-50 px-2 py-1.5 rounded-xl border border-slate-200">
                        <span className="font-black text-slate-800 shrink-0">تغيير حالة الطلب:</span>
                        <select
                          value={order.status}
                          onChange={e => handleAdminStatusChange(order, e.target.value as OrderStatus)}
                          className="bg-white border border-slate-300 rounded-lg p-1.5 text-xs text-slate-900 font-bold focus:ring-2 focus:ring-emerald-500 shadow-2xs cursor-pointer"
                        >
                          <option value="pending">جديد / في الانتظار</option>
                          <option value="reviewing">جاري المراجعة</option>
                          <option value="printing">قيد الطباعة 🖨️</option>
                          <option value="packaging">جاري التغليف 📦</option>
                          <option value="out_for_delivery">مع المندوب للتوصيل 🛵</option>
                          <option value="ready_for_pickup">جاهز للاستلام 🏪</option>
                          <option value="completed">مكتمل ومسلم ✅</option>
                          <option value="cancelled">ملغي ❌</option>
                        </select>
                      </div>

                      {/* Manual Editable Time Input */}
                      <div className="flex items-center gap-1.5 bg-amber-50/90 border border-amber-300 p-1.5 rounded-xl text-xs font-bold shadow-2xs flex-wrap">
                        <Clock className="w-4 h-4 text-amber-700 shrink-0" />
                        <span className="text-amber-900 font-black shrink-0">الوقت المتوقع للعميل:</span>
                        <div className="flex items-center gap-1">
                          <input
                            type="text"
                            placeholder="أدخل الوقت (مثلاً: خلال 30 دقيقة)"
                            value={editingDeliveryTimes[order.id] !== undefined ? editingDeliveryTimes[order.id] : (order.estimatedCompletionTime || getEstimatedDeliveryText(order))}
                            onChange={(e) => handleDeliveryTimeTextChange(order.id, e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleSaveDeliveryTime(order);
                              }
                            }}
                            className="bg-white border border-amber-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-400 text-amber-950 font-bold text-xs px-2.5 py-1 rounded-lg w-44 sm:w-56 shadow-2xs"
                          />
                          <button
                            type="button"
                            onClick={() => handleSaveDeliveryTime(order)}
                            className="bg-amber-500 hover:bg-amber-600 active:scale-95 text-white font-bold px-2.5 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1 shadow-2xs shrink-0"
                            title="حفظ الموعد لتحديده عند العميل"
                          >
                            {savedTimeFeedback[order.id] ? (
                              <span className="text-white font-black">حفظ ✓</span>
                            ) : (
                              <span>حفظ 💾</span>
                            )}
                          </button>
                        </div>

                        {/* Quick Presets */}
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleSaveDeliveryTime(order, 'خلال 15 دقيقة')}
                            className="bg-amber-100 hover:bg-amber-200 text-amber-900 text-[10px] px-1.5 py-0.5 rounded border border-amber-300 font-bold cursor-pointer transition-colors"
                            title="تعيين: خلال 15 دقيقة"
                          >
                            15د
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSaveDeliveryTime(order, 'خلال 30 دقيقة')}
                            className="bg-amber-100 hover:bg-amber-200 text-amber-900 text-[10px] px-1.5 py-0.5 rounded border border-amber-300 font-bold cursor-pointer transition-colors"
                            title="تعيين: خلال 30 دقيقة"
                          >
                            30د
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSaveDeliveryTime(order, 'خلال ساعة')}
                            className="bg-amber-100 hover:bg-amber-200 text-amber-900 text-[10px] px-1.5 py-0.5 rounded border border-amber-300 font-bold cursor-pointer transition-colors"
                            title="تعيين: خلال ساعة"
                          >
                            ساعة
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSaveDeliveryTime(order, 'جاهز للاستلام الآن 🏪')}
                            className="bg-emerald-100 hover:bg-emerald-200 text-emerald-950 text-[10px] px-1.5 py-0.5 rounded border border-emerald-300 font-bold cursor-pointer transition-colors"
                            title="تعيين: جاهز للاستلام الآن"
                          >
                            جاهز الآن
                          </button>
                        </div>
                      </div>

                      {order.paymentStatus !== 'verified' && (
                        <button
                          onClick={() => handleAdminVerifyPayment(order)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1.5 rounded-lg text-xs transition-colors shadow-sm cursor-pointer"
                        >
                          تأكيد استلام التحويل ✅
                        </button>
                      )}
                    </div>

                    {/* Delete Order Action */}
                    <button
                      onClick={() => handleDelete(order.id, order.customerName)}
                      className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold px-3.5 py-2 rounded-lg text-xs transition-colors flex items-center gap-1.5 cursor-pointer mr-auto sm:mr-0"
                      title="حذف هذا الطلب نهائياً"
                    >
                      <Trash2 className="w-4 h-4 text-rose-600" />
                      <span>حذف الطلب</span>
                    </button>
                  </div>

                </div>
              );
            })}

            {filteredOrders.length === 0 && (
              <div className="text-center py-12 bg-white rounded-2xl border border-slate-200">
                <Package className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                <p className="text-slate-600 font-bold">لا توجد طلبات تطابق الفلتر أو البحث حالياً</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUB-NAV BAR FOR FINANCIALS */}
      {activeTab === 'financials' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-2.5 max-w-6xl mx-auto mb-6 flex items-center justify-between flex-wrap gap-3 shadow-xl">
          <div className="flex items-center gap-2 px-3 py-1 text-white">
            <Wallet className="w-5 h-5 text-amber-400 shrink-0" />
            <span className="font-black text-xs sm:text-sm">قسم الإدارة المالية والحسابات:</span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setFinancialSubTab('sales')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center gap-2 cursor-pointer ${
                financialSubTab === 'sales'
                  ? 'bg-amber-400 text-amber-950 shadow-md ring-2 ring-amber-300 font-black'
                  : 'bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white'
              }`}
            >
              <BarChart3 className="w-4 h-4 shrink-0" />
              <span>ملخص المبيعات والتقارير</span>
            </button>
            <button
              onClick={() => setFinancialSubTab('expenses')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center gap-2 cursor-pointer ${
                financialSubTab === 'expenses'
                  ? 'bg-amber-400 text-amber-950 shadow-md ring-2 ring-amber-300 font-black'
                  : 'bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white'
              }`}
            >
              <Receipt className="w-4 h-4 shrink-0" />
              <span>إضافة وإدارة المنصرفات ({expenses.length})</span>
            </button>
            <button
              onClick={() => setFinancialSubTab('profit_loss')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center gap-2 cursor-pointer ${
                financialSubTab === 'profit_loss'
                  ? 'bg-amber-400 text-amber-950 shadow-md ring-2 ring-amber-300 font-black'
                  : 'bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white'
              }`}
            >
              <TrendingUp className="w-4 h-4 shrink-0" />
              <span>تقرير الربح والخسارة (P&L)</span>
            </button>
          </div>
        </div>
      )}

      {/* FINANCIALS SECTION MAIN TAB */}
      {activeTab === 'financials' && (
        <div className="max-w-6xl mx-auto space-y-8">
          
          {/* 1. SALES SUMMARY & REPORTS SUB-TAB */}
          {financialSubTab === 'sales' && (
            <div className="space-y-6">
              {/* Daily Sales & Bankak Summary Component */}
              <div className="bg-gradient-to-br from-emerald-900 via-emerald-800 to-emerald-950 text-white rounded-3xl border-2 border-emerald-700 p-5 sm:p-6 shadow-xl space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-emerald-800/80 pb-4">
                  <div>
                    <div className="flex items-center gap-2 text-emerald-300 font-bold text-xs mb-1">
                      <TrendingUp className="w-4 h-4 text-emerald-400" />
                      <span>تقرير الحسابات والتحصيل المالي البنكي اليومي</span>
                    </div>
                    <h3 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2 flex-wrap">
                      <span>📊 ملخص المبيعات والتحصيل اليومي</span>
                      <span className="text-xs font-bold bg-amber-400 text-amber-950 px-3 py-1 rounded-full border border-amber-300 font-mono">
                        {summaryFilter === 'today' ? `اليوم (${todayLocalDate})` : summaryFilter === 'yesterday' ? `الأمس (${yesterdayLocalDate})` : summaryFilter === 'custom' ? `تاريخ: ${customDate}` : 'الفترة المحددة'}
                      </span>
                    </h3>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap text-xs">
                    {[
                      { id: 'today', label: 'اليوم ☀️' },
                      { id: 'yesterday', label: 'الأمس 🌙' },
                      { id: 'last_7', label: 'آخر 7 أيام 📅' },
                      { id: 'month', label: 'هذا الشهر 📆' },
                      { id: 'all', label: 'الكل 🌐' },
                    ].map(b => (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() => setSummaryFilter(b.id as any)}
                        className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                          summaryFilter === b.id
                            ? 'bg-amber-400 text-amber-950 shadow-md font-black ring-2 ring-amber-300'
                            : 'bg-emerald-900/80 text-emerald-100 hover:bg-emerald-800 border border-emerald-700/50'
                        }`}
                      >
                        {b.label}
                      </button>
                    ))}

                    <div className="flex items-center gap-1.5 bg-emerald-900/90 px-2.5 py-1.5 rounded-lg border border-emerald-700/60">
                      <span className="text-[11px] text-emerald-300 font-bold">اختر تاريخ:</span>
                      <input
                        type="date"
                        value={customDate}
                        onChange={(e) => {
                          setCustomDate(e.target.value);
                          setSummaryFilter('custom');
                        }}
                        className="bg-emerald-950 text-white text-xs font-mono rounded px-2 py-0.5 border border-emerald-600 focus:outline-none"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={handleExportCSV}
                      className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-amber-950 rounded-lg font-black transition-all flex items-center gap-1.5 border border-amber-300 shadow-sm cursor-pointer"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5" />
                      <span>تصدير CSV 📊</span>
                    </button>

                    <button
                      type="button"
                      onClick={handlePrintDailyReport}
                      className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold transition-all flex items-center gap-1.5 border border-emerald-400/40 shadow-sm cursor-pointer"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>طباعة التقرير 🖨️</span>
                    </button>
                  </div>
                </div>

                {/* Key Metrics Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-emerald-950/80 p-4.5 rounded-2xl border border-emerald-700/70 shadow-sm space-y-1.5">
                    <div className="flex items-center justify-between text-xs text-emerald-300 font-bold">
                      <span>الطلبات المكتملة والمؤكدة</span>
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div className="text-2xl sm:text-3xl font-black text-white font-mono">
                      {completedSummaryCount} <span className="text-xs font-bold text-emerald-200">طلب</span>
                    </div>
                    <div className="text-[11px] text-emerald-300/80 pt-1.5 border-t border-emerald-800/60 flex justify-between">
                      <span>إجمالي طلبات الفترة:</span>
                      <strong className="text-white font-bold">{summaryOrders.length} طلب</strong>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-emerald-800 to-emerald-950 p-4.5 rounded-2xl border-2 border-emerald-400/80 shadow-md space-y-1.5 relative overflow-hidden">
                    <div className="flex items-center justify-between text-xs text-amber-300 font-extrabold">
                      <span className="flex items-center gap-1.5">
                        <img src={bankakLogo} alt="بنكك" className="w-4 h-4 rounded-full object-cover bg-white p-0.5" />
                        <span>تحصيل تطبيق بنكك</span>
                      </span>
                      <span className="bg-amber-400 text-amber-950 font-mono text-[10px] px-1.5 py-0.5 rounded font-black">Bankak</span>
                    </div>
                    <div className="text-2xl sm:text-3xl font-black text-amber-300 font-mono">
                      {formatSDG(bankakTotalAmount)}
                    </div>
                    <div className="text-[11px] text-emerald-200 pt-1.5 border-t border-emerald-800/60 flex justify-between font-medium">
                      <span>عمليات بنكك المؤكدة:</span>
                      <strong className="text-amber-300 font-bold">{bankakSummaryOrders.length} عملية</strong>
                    </div>
                  </div>

                  <div className="bg-emerald-950/80 p-4.5 rounded-2xl border border-emerald-700/70 shadow-sm space-y-1.5">
                    <div className="flex items-center justify-between text-xs text-emerald-300 font-bold">
                      <span>إجمالي التحصيل الكلي</span>
                      <DollarSign className="w-4 h-4 text-amber-400" />
                    </div>
                    <div className="text-2xl sm:text-3xl font-black text-white font-mono">
                      {formatSDG(completedTotalAmount)}
                    </div>
                    <div className="text-[11px] text-emerald-300/80 pt-1.5 border-t border-emerald-800/60 flex justify-between">
                      <span>نسبة تحصيل بنكك:</span>
                      <strong className="text-amber-300 font-bold">
                        {completedTotalAmount > 0 ? `${Math.round((bankakTotalAmount / completedTotalAmount) * 100)}% عبر بنكك` : '0%'}
                      </strong>
                    </div>
                  </div>

                  <div className="bg-emerald-950/80 p-4.5 rounded-2xl border border-emerald-700/70 shadow-sm space-y-1.5">
                    <div className="flex items-center justify-between text-xs text-emerald-300 font-bold">
                      <span>ورق الطباعة المنجز</span>
                      <Printer className="w-4 h-4 text-emerald-300" />
                    </div>
                    <div className="text-2xl sm:text-3xl font-black text-white font-mono">
                      {summaryTotalPages} <span className="text-xs font-bold text-emerald-200">ورقة</span>
                    </div>
                    <div className="text-[11px] text-emerald-300/80 pt-1.5 border-t border-emerald-800/60 flex justify-between">
                      <span>معدل الورق/الطلب:</span>
                      <strong className="text-white font-bold">
                        {completedSummaryCount > 0 ? Math.round(summaryTotalPages / completedSummaryCount) : 0} ورقة
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Banking Breakdown */}
                <div className="bg-emerald-950/80 p-4 rounded-2xl border border-emerald-800/80 space-y-3">
                  <div className="flex items-center justify-between text-xs text-emerald-200 font-bold border-b border-emerald-800/60 pb-2">
                    <span>توزيع المبيعات حسب وسيلة التحصيل الإلكتروني والشفهي:</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="bg-emerald-900/60 p-3 rounded-xl border border-emerald-700/50 flex items-center gap-3">
                      <img src={bankakLogo} alt="بنكك" className="w-8 h-8 rounded-lg object-cover bg-white p-0.5" />
                      <div>
                        <div className="text-[11px] text-emerald-300 font-bold">تطبيق بنكك الخرطوم</div>
                        <div className="text-lg font-black text-amber-300 font-mono">{formatSDG(bankakTotalAmount)}</div>
                      </div>
                    </div>
                    <div className="bg-emerald-900/60 p-3 rounded-xl border border-emerald-700/50 flex items-center gap-3">
                      <img src={okashLogo} alt="أوكاش" className="w-8 h-8 rounded-lg object-cover bg-white p-0.5" />
                      <div>
                        <div className="text-[11px] text-emerald-300 font-bold">تطبيق أوكاش أمدرمان</div>
                        <div className="text-lg font-black text-amber-300 font-mono">{formatSDG(okashTotalAmount)}</div>
                      </div>
                    </div>
                    <div className="bg-emerald-900/60 p-3 rounded-xl border border-emerald-700/50 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-emerald-800 flex items-center justify-center font-black text-amber-300 text-xs">💵</div>
                      <div>
                        <div className="text-[11px] text-emerald-300 font-bold">دفع نقدي / عند الاستلام</div>
                        <div className="text-lg font-black text-emerald-100 font-mono">{formatSDG(cashTotalAmount)}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 2. EXPENSES MANAGEMENT SUB-TAB */}
          {financialSubTab === 'expenses' && (
            <div className="space-y-8">
              {/* Top Banner */}
              <div className="bg-slate-900 text-white rounded-3xl p-6 border border-slate-800 shadow-xl flex flex-wrap items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-amber-400 text-xs font-bold">
                    <Receipt className="w-4 h-4" />
                    <span>سجل ومصروفات التشغيل المباشرة</span>
                  </div>
                  <h2 className="text-2xl font-black text-white">💸 إدارة وتسجيل المنصرفات الفعلية</h2>
                  <p className="text-xs text-slate-300 max-w-xl">
                    قم بإنشاء وتوثيق كل المصروفات مثل شراء ورق A4، أحبار ماكينات الطباعة، صيانة السخانات والدرامات، رواتب العمالة، وفواتير التشغيل اليومية.
                  </p>
                </div>
                <div className="bg-amber-400 text-amber-950 p-4 rounded-2xl text-center shadow-lg border border-amber-300 font-black">
                  <span className="text-xs block text-amber-900 font-bold">إجمالي المنصرفات المسجلة</span>
                  <span className="text-2xl font-mono block mt-0.5">
                    {formatSDG(expenses.reduce((sum, e) => sum + e.amount, 0))}
                  </span>
                </div>
              </div>

              {/* Add Expense Form Card */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-md space-y-5">
                <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
                  <PlusCircle className="w-5 h-5 text-amber-600" />
                  <h3 className="text-lg font-black text-slate-900">تسجيل فاتورة منصرف جديدة ➕</h3>
                </div>

                <form onSubmit={handleAddExpense} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* 1. Title / Description */}
                    <div className="lg:col-span-2">
                      <label className="block text-xs font-bold text-slate-800 mb-1">البيان / وصف المنصرف *</label>
                      <input
                        type="text"
                        required
                        value={expTitle}
                        onChange={e => setExpTitle(e.target.value)}
                        placeholder="مثال: شراء 5 كراتين ورق A4 80 جرام"
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs sm:text-sm font-bold text-slate-900 focus:ring-2 focus:ring-amber-500 outline-none"
                      />
                    </div>

                    {/* 2. Amount in SDG */}
                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-1">المبلغ الإجمالي (بالجنيه SDG) *</label>
                      <input
                        type="number"
                        required
                        min="1"
                        step="any"
                        value={expAmount}
                        onChange={e => setExpAmount(e.target.value)}
                        placeholder="مثال: 120000"
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs sm:text-sm font-bold text-slate-900 font-mono focus:ring-2 focus:ring-amber-500 outline-none"
                      />
                    </div>

                    {/* 3. Category */}
                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-1">تصنيف المنصرف *</label>
                      <select
                        value={expCategory}
                        onChange={e => setExpCategory(e.target.value as any)}
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-amber-500 outline-none"
                      >
                        <option value="raw_materials">📦 خامات ومستلزمات (ورق، حبر، تجليد)</option>
                        <option value="maintenance">🛠️ صيانة وتجهيزات الماكينات</option>
                        <option value="operations">⚡ تشغيل (كهرباء، إنترنت، إيجار)</option>
                        <option value="salaries">👨‍🍳 رواتب وأجور العمالة</option>
                        <option value="delivery_costs">🛵 خدمات لوجستيات وتوصيل</option>
                        <option value="other">📌 منصرفات أخرى ونثريات</option>
                      </select>
                    </div>

                    {/* 4. Expense Date */}
                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-1">تاريخ الصرف *</label>
                      <input
                        type="date"
                        required
                        value={expDate}
                        onChange={e => setExpDate(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs font-bold font-mono text-slate-900 focus:ring-2 focus:ring-amber-500 outline-none"
                      />
                    </div>

                    {/* 5. Payment Method */}
                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-1">طريقة السداد / الدفع *</label>
                      <select
                        value={expPaymentMethod}
                        onChange={e => setExpPaymentMethod(e.target.value as any)}
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-amber-500 outline-none"
                      >
                        <option value="bankak">تطبيق بنكك (الخرطوم)</option>
                        <option value="okash">تطبيق أوكاش (أمدرمان)</option>
                        <option value="cash">نقداً (كاش من الدرج)</option>
                        <option value="other">طريقة أخرى</option>
                      </select>
                    </div>

                    {/* 6. Paid To / Supplier */}
                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-1">الجهة / المستلم (اختياري)</label>
                      <input
                        type="text"
                        value={expPaidTo}
                        onChange={e => setExpPaidTo(e.target.value)}
                        placeholder="مثال: شركة المطبوعات / مهندس الصيانة"
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-amber-500 outline-none"
                      />
                    </div>

                    {/* 7. Notes */}
                    <div className="lg:col-span-2">
                      <label className="block text-xs font-bold text-slate-800 mb-1">ملاحظات إضافية (اختياري)</label>
                      <input
                        type="text"
                        value={expNotes}
                        onChange={e => setExpNotes(e.target.value)}
                        placeholder="ملاحظات توضيحية للفاتورة أو سبب الصرف"
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-amber-500 outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      className="bg-amber-500 hover:bg-amber-400 text-amber-950 font-black px-6 py-3 rounded-xl text-xs sm:text-sm shadow-md transition-all flex items-center gap-2 cursor-pointer border border-amber-300"
                    >
                      <PlusCircle className="w-4 h-4" />
                      <span>حفظ وتسجيل المنصرف الآن</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* Expenses List & Filtering */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-md space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <Receipt className="w-5 h-5 text-emerald-600" />
                    <h3 className="text-lg font-black text-slate-900">جدول كشف المنصرفات الفعلية ({expenses.length})</h3>
                  </div>

                  {/* Category Filter */}
                  <div className="flex items-center gap-2 text-xs flex-wrap">
                    <span className="font-bold text-slate-600">تصفية حسب التصنيف:</span>
                    <select
                      value={expFilterCategory}
                      onChange={e => setExpFilterCategory(e.target.value)}
                      className="bg-slate-100 border border-slate-300 text-slate-900 font-bold px-3 py-1.5 rounded-xl outline-none"
                    >
                      <option value="all">كل التصنيفات ({expenses.length})</option>
                      <option value="raw_materials">📦 خامات ومستلزمات</option>
                      <option value="maintenance">🛠️ صيانة وتجهيزات</option>
                      <option value="operations">⚡ تشغيل وكهرباء</option>
                      <option value="salaries">👨‍🍳 رواتب وأجور</option>
                      <option value="delivery_costs">🛵 خدمات توصيل</option>
                      <option value="other">📌 أخرى ونثريات</option>
                    </select>
                  </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-right border-collapse">
                    <thead>
                      <tr className="bg-slate-100 text-slate-800 text-xs font-black border-b border-slate-200">
                        <th className="p-3">التاريخ</th>
                        <th className="p-3">البيان / الوصف</th>
                        <th className="p-3">التصنيف</th>
                        <th className="p-3">طريقة الدفع</th>
                        <th className="p-3">المستلم / الجهة</th>
                        <th className="p-3">المبلغ</th>
                        <th className="p-3">الملاحظات</th>
                        <th className="p-3 text-center">الإجراء</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {expenses
                        .filter(e => expFilterCategory === 'all' || e.category === expFilterCategory)
                        .map(item => {
                          let catLabel = 'أخرى';
                          let catBg = 'bg-slate-100 text-slate-800';
                          if (item.category === 'raw_materials') { catLabel = '📦 خامات ومستلزمات'; catBg = 'bg-emerald-100 text-emerald-900 border-emerald-300'; }
                          else if (item.category === 'maintenance') { catLabel = '🛠️ صيانة'; catBg = 'bg-blue-100 text-blue-900 border-blue-300'; }
                          else if (item.category === 'operations') { catLabel = '⚡ تشغيل وكهرباء'; catBg = 'bg-amber-100 text-amber-900 border-amber-300'; }
                          else if (item.category === 'salaries') { catLabel = '👨‍🍳 رواتب وأجور'; catBg = 'bg-purple-100 text-purple-900 border-purple-300'; }
                          else if (item.category === 'delivery_costs') { catLabel = '🛵 خدمات توصيل'; catBg = 'bg-rose-100 text-rose-900 border-rose-300'; }

                          return (
                            <tr key={item.id} className="hover:bg-slate-50/80 transition-colors font-semibold text-slate-800">
                              <td className="p-3 font-mono text-slate-600">{item.date}</td>
                              <td className="p-3 font-bold text-slate-900">{item.title}</td>
                              <td className="p-3">
                                <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${catBg}`}>
                                  {catLabel}
                                </span>
                              </td>
                              <td className="p-3 font-bold">
                                {item.paymentMethod === 'bankak' && <span className="bg-emerald-800 text-amber-300 px-2 py-0.5 rounded text-[11px] font-mono">بنكك</span>}
                                {item.paymentMethod === 'okash' && <span className="bg-rose-700 text-white px-2 py-0.5 rounded text-[11px] font-mono">أوكاش</span>}
                                {item.paymentMethod === 'cash' && <span className="bg-amber-100 text-amber-900 px-2 py-0.5 rounded text-[11px]">نقداً</span>}
                                {item.paymentMethod === 'other' && <span className="bg-slate-200 text-slate-700 px-2 py-0.5 rounded text-[11px]">أخرى</span>}
                              </td>
                              <td className="p-3 text-slate-700">{item.paidTo || 'غير محدد'}</td>
                              <td className="p-3 font-black text-rose-700 font-mono text-sm">
                                -{formatSDG(item.amount)}
                              </td>
                              <td className="p-3 text-slate-500 text-[11px]">{item.notes || '-'}</td>
                              <td className="p-3 text-center">
                                <button
                                  onClick={() => handleDeleteExpense(item.id)}
                                  className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition-colors cursor-pointer"
                                  title="حذف هذا المنصرف"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>

                  {expenses.length === 0 && (
                    <div className="text-center py-10 text-slate-500 font-bold">
                      لا توجد منصرفات مسجلة حالياً
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 3. PROFIT & LOSS STATEMENT SUB-TAB */}
          {financialSubTab === 'profit_loss' && (() => {
            const totalRevenue = orders
              .filter(o => o.paymentStatus === 'verified' || o.status === 'completed')
              .reduce((sum, o) => sum + o.totalAmount, 0);

            const totalExpensesAmt = expenses.reduce((sum, e) => sum + e.amount, 0);
            const netProfit = totalRevenue - totalExpensesAmt;
            const profitMargin = totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : '0.0';

            const rawCatTotal = expenses.filter(e => e.category === 'raw_materials').reduce((a, b) => a + b.amount, 0);
            const maintCatTotal = expenses.filter(e => e.category === 'maintenance').reduce((a, b) => a + b.amount, 0);
            const opsCatTotal = expenses.filter(e => e.category === 'operations').reduce((a, b) => a + b.amount, 0);
            const salCatTotal = expenses.filter(e => e.category === 'salaries').reduce((a, b) => a + b.amount, 0);
            const delCatTotal = expenses.filter(e => e.category === 'delivery_costs').reduce((a, b) => a + b.amount, 0);
            const otherCatTotal = expenses.filter(e => e.category === 'other').reduce((a, b) => a + b.amount, 0);

            return (
              <div className="space-y-8">
                {/* Header Banner */}
                <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 text-white rounded-3xl p-6 border border-slate-800 shadow-xl flex flex-wrap items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-amber-400 text-xs font-bold">
                      <TrendingUp className="w-4 h-4" />
                      <span>قائمة الدخل والنتائج المالية الرسمية</span>
                    </div>
                    <h2 className="text-2xl font-black text-white">📈 تقرير الربح والخسارة الشامل (P&L)</h2>
                    <p className="text-xs text-slate-300 max-w-xl">
                      حساب تلقائي لجميع الإيرادات والمبيعات المؤكدة مطروحاً منها كافة المنصرفات والمصروفات التشغيلية الموثقة بالمرتكزات الحسابية.
                    </p>
                  </div>

                  <button
                    onClick={() => window.print()}
                    className="bg-amber-400 hover:bg-amber-300 text-amber-950 px-5 py-3 rounded-2xl font-black text-xs sm:text-sm shadow-md transition-all flex items-center gap-2 cursor-pointer border border-amber-300"
                  >
                    <Printer className="w-4 h-4" />
                    <span>طباعة القائمة المالية 🖨️</span>
                  </button>
                </div>

                {/* 4 Core Financial Metric Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  
                  {/* 1. Total Revenue */}
                  <div className="bg-emerald-900/90 text-white p-5 rounded-3xl border border-emerald-700 shadow-md space-y-2">
                    <div className="flex items-center justify-between text-xs text-emerald-200 font-bold">
                      <span>إجمالي المبيعات والإيرادات</span>
                      <ArrowUpRight className="w-5 h-5 text-emerald-300" />
                    </div>
                    <div className="text-2xl sm:text-3xl font-black font-mono text-emerald-300">
                      {formatSDG(totalRevenue)}
                    </div>
                    <p className="text-[11px] text-emerald-200/80 pt-2 border-t border-emerald-800/80">
                      إجمالي الطلبات المسددة والمؤكدة
                    </p>
                  </div>

                  {/* 2. Total Expenses */}
                  <div className="bg-rose-950/90 text-white p-5 rounded-3xl border border-rose-800 shadow-md space-y-2">
                    <div className="flex items-center justify-between text-xs text-rose-200 font-bold">
                      <span>إجمالي المنصرفات والتكاليف</span>
                      <ArrowDownRight className="w-5 h-5 text-rose-400" />
                    </div>
                    <div className="text-2xl sm:text-3xl font-black font-mono text-rose-300">
                      {formatSDG(totalExpensesAmt)}
                    </div>
                    <p className="text-[11px] text-rose-200/80 pt-2 border-t border-rose-900/80">
                      مجموع الفواتير التشغيلية الموثقة ({expenses.length} مصروف)
                    </p>
                  </div>

                  {/* 3. Net Profit / Loss */}
                  <div className={`p-5 rounded-3xl border shadow-lg space-y-2 ${
                    netProfit >= 0 
                      ? 'bg-gradient-to-br from-amber-500 to-amber-600 text-amber-950 border-amber-400'
                      : 'bg-gradient-to-br from-rose-700 to-rose-900 text-white border-rose-600'
                  }`}>
                    <div className="flex items-center justify-between text-xs font-black">
                      <span>صافي الربح / الخسارة</span>
                      <Coins className="w-5 h-5" />
                    </div>
                    <div className="text-2xl sm:text-3xl font-black font-mono">
                      {formatSDG(netProfit)}
                    </div>
                    <div className="pt-2 border-t border-black/10 flex items-center justify-between text-[11px] font-black">
                      <span>النتيجة المالية:</span>
                      <span className="bg-white/30 px-2 py-0.5 rounded-full">
                        {netProfit >= 0 ? 'ربح صافي ممتاز 🟢' : 'عجز / خسارة 🔴'}
                      </span>
                    </div>
                  </div>

                  {/* 4. Profit Margin % */}
                  <div className="bg-slate-900 text-white p-5 rounded-3xl border border-slate-800 shadow-md space-y-2">
                    <div className="flex items-center justify-between text-xs text-slate-300 font-bold">
                      <span>هامش الربح التشغيلي</span>
                      <Calculator className="w-5 h-5 text-amber-400" />
                    </div>
                    <div className="text-2xl sm:text-3xl font-black font-mono text-amber-400">
                      {profitMargin}%
                    </div>
                    <p className="text-[11px] text-slate-400 pt-2 border-t border-slate-800">
                      نسبة صافي الربح من إجمالي المبيعات
                    </p>
                  </div>

                </div>

                {/* Expense Breakdown Visual Progress Bars */}
                <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-md space-y-5">
                  <h3 className="text-lg font-black text-slate-900 pb-3 border-b border-slate-100 flex items-center gap-2">
                    <PieChart className="w-5 h-5 text-amber-600" />
                    <span>تحليل وتوزيع المنصرفات حسب القطاعات التشغيلية</span>
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[
                      { name: '📦 خامات ومستلزمات (ورق، حبر، تجليد)', amt: rawCatTotal, color: 'bg-emerald-500' },
                      { name: '🛠️ صيانة ماكينات الطباعة والتجهيزات', amt: maintCatTotal, color: 'bg-blue-500' },
                      { name: '⚡ تشغيل وكهرباء وإنترنت بالمكتبة', amt: opsCatTotal, color: 'bg-amber-500' },
                      { name: '👨‍🍳 رواتب وأجور العمالة', amt: salCatTotal, color: 'bg-purple-500' },
                      { name: '🛵 خدمات اللوجستيات والتوصيل', amt: delCatTotal, color: 'bg-rose-500' },
                      { name: '📌 منصرفات أخرى ونثريات', amt: otherCatTotal, color: 'bg-slate-500' },
                    ].map((item, idx) => {
                      const pct = totalExpensesAmt > 0 ? Math.round((item.amt / totalExpensesAmt) * 100) : 0;
                      return (
                        <div key={idx} className="space-y-1.5 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                          <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                            <span>{item.name}</span>
                            <span className="font-mono text-slate-900 font-black">{formatSDG(item.amt)} ({pct}%)</span>
                          </div>
                          <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden">
                            <div className={`h-full ${item.color} transition-all duration-500`} style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Formal Income Statement Table */}
                <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-md space-y-4">
                  <h3 className="text-lg font-black text-slate-900 pb-2 border-b border-slate-100 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-emerald-600" />
                    <span>جدول القائمة المالية التفصيلية (قائمة الدخل)</span>
                  </h3>

                  <div className="overflow-x-auto">
                    <table className="w-full text-right border-collapse">
                      <thead>
                        <tr className="bg-slate-900 text-white text-xs font-black">
                          <th className="p-3.5 rounded-r-xl">البند / البيان المالي</th>
                          <th className="p-3.5 text-left rounded-l-xl">المبلغ بالجنيه السوداني (SDG)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 text-xs sm:text-sm font-bold">
                        {/* Section 1: Revenue */}
                        <tr className="bg-emerald-50 text-emerald-950 font-black">
                          <td className="p-3">أولاً: إجمالي الإيرادات والمبيعات التشغيلية المؤكدة</td>
                          <td className="p-3 text-left font-mono text-base text-emerald-800">{formatSDG(totalRevenue)}</td>
                        </tr>

                        {/* Section 2: Expenses */}
                        <tr className="bg-rose-50 text-rose-950 font-black">
                          <td className="p-3">ثانياً: إجمالي تكاليف التشغيل والمنصرفات المباشرة</td>
                          <td className="p-3 text-left font-mono text-base text-rose-800">-{formatSDG(totalExpensesAmt)}</td>
                        </tr>
                        <tr className="text-slate-600 font-semibold text-xs">
                          <td className="p-2.5 pr-8">• خامات ومستلزمات الطباعة والورق</td>
                          <td className="p-2.5 text-left font-mono">-{formatSDG(rawCatTotal)}</td>
                        </tr>
                        <tr className="text-slate-600 font-semibold text-xs">
                          <td className="p-2.5 pr-8">• صيانة وتأهيل الماكينات</td>
                          <td className="p-2.5 text-left font-mono">-{formatSDG(maintCatTotal)}</td>
                        </tr>
                        <tr className="text-slate-600 font-semibold text-xs">
                          <td className="p-2.5 pr-8">• مصاريف التشغيل والإنترنت والكهرباء</td>
                          <td className="p-2.5 text-left font-mono">-{formatSDG(opsCatTotal)}</td>
                        </tr>
                        <tr className="text-slate-600 font-semibold text-xs">
                          <td className="p-2.5 pr-8">• رواتب وأجور طاقم العمل</td>
                          <td className="p-2.5 text-left font-mono">-{formatSDG(salCatTotal)}</td>
                        </tr>
                        <tr className="text-slate-600 font-semibold text-xs">
                          <td className="p-2.5 pr-8">• رسوم وتكاليف الخدمات والتوصيل</td>
                          <td className="p-2.5 text-left font-mono">-{formatSDG(delCatTotal)}</td>
                        </tr>
                        <tr className="text-slate-600 font-semibold text-xs">
                          <td className="p-2.5 pr-8">• منصرفات نثريات وأخرى</td>
                          <td className="p-2.5 text-left font-mono">-{formatSDG(otherCatTotal)}</td>
                        </tr>

                        {/* Net Result */}
                        <tr className={`font-black text-base ${netProfit >= 0 ? 'bg-amber-100 text-amber-950' : 'bg-rose-100 text-rose-950'}`}>
                          <td className="p-4">ثالثاً: صافي أرباح الدورة التشغيلية (النتيجة النهائية)</td>
                          <td className="p-4 text-left font-mono text-lg">{formatSDG(netProfit)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            );
          })()}

        </div>
      )}



      {/* SUB-NAV BAR FOR SHEETS & UNIVERSITIES MANAGEMENT */}
      {(activeTab === 'sheets_manage' || activeTab === 'universities') && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-2.5 max-w-6xl mx-auto mb-6 flex items-center justify-between flex-wrap gap-3 shadow-xl">
          <div className="flex items-center gap-2 px-3 py-1 text-white">
            <Library className="w-5 h-5 text-amber-400 shrink-0" />
            <span className="font-black text-xs sm:text-sm">قسم إدارة الشيتات والجامعات:</span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setActiveTab('sheets_manage')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'sheets_manage'
                  ? 'bg-amber-400 text-amber-950 shadow-md ring-2 ring-amber-300 font-black'
                  : 'bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white'
              }`}
            >
              <BookOpen className="w-4 h-4 shrink-0" />
              <span>إدارة الشيتات ({sheets.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('universities')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'universities'
                  ? 'bg-amber-400 text-amber-950 shadow-md ring-2 ring-amber-300 font-black'
                  : 'bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white'
              }`}
            >
              <GraduationCap className="w-4 h-4 shrink-0" />
              <span>إدارة الجامعات والكليات ({universitiesList.length})</span>
            </button>
          </div>
        </div>
      )}

      {/* COLLEGE SHEETS MANAGEMENT TAB */}
      {activeTab === 'sheets_manage' && (
        <div className="space-y-8 max-w-6xl mx-auto">
          {/* Header Card */}
          <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-emerald-800">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 bg-amber-400/20 text-amber-300 border border-amber-400/40 text-xs px-3 py-1 rounded-full font-bold mb-2">
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>ربط مباشر وموحد مع قسم مكتبة الكلية ودليل الليدر</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-white">
                  إدارة وإضافة وتعديل شيتات الكلية والجامعات
                </h2>
                <p className="text-xs sm:text-sm text-emerald-200/90 mt-1 leading-relaxed">
                  أي شيت يتم إضافته أو تعديله أو تغيير سعره وحالته هنا يُحفظ تلقائياً وينعكس فوراً في واجهة مكتبة الطلاب ودليل الليدر.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="bg-emerald-900/80 backdrop-blur-xs p-4 rounded-2xl border border-emerald-700/60 text-center shrink-0">
                  <span className="text-xs text-emerald-300 font-bold block">إجمالي الشيتات بالمكتبة</span>
                  <span className="text-3xl font-black text-amber-400">{sheets.length}</span>
                  <span className="text-[10px] text-emerald-200 block">شيت ومذكرة متاحة</span>
                </div>

                <button
                  type="button"
                  onClick={handleSaveAllSheets}
                  disabled={savingAllSheets}
                  className="bg-amber-400 hover:bg-amber-500 text-slate-950 font-black px-5 py-3.5 rounded-2xl transition-all shadow-lg flex items-center gap-2 cursor-pointer active:scale-95 text-xs sm:text-sm shrink-0 border border-amber-300"
                >
                  <Save className={`w-4 h-4 text-slate-950 ${savingAllSheets ? 'animate-spin' : ''}`} />
                  <span>{savingAllSheets ? 'جاري الحفظ...' : '💾 حفظ التغييرات وتحديث المكتبة للطلاب'}</span>
                </button>
              </div>
            </div>
          </div>

          {sheetSuccessMsg && (
            <div className="p-4 bg-emerald-50 border-2 border-emerald-500 rounded-2xl text-emerald-950 font-black text-sm flex items-center gap-3 shadow-md animate-bounce">
              <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
              <span>{sheetSuccessMsg}</span>
            </div>
          )}

          {/* SECTION 1: Add New Sheet Form */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xl space-y-6">
            <div className="border-b border-slate-200 pb-4 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <Plus className="w-5 h-5 text-emerald-600" />
                  إضافة شيت / مذكرة جديدة لمكتبة الكلية
                </h3>
                <p className="text-xs text-slate-500">قم بتعبئة تفاصيل المادة، القسم، وعدد الصفحات لإدراج الشيت بالمكتبة وتحديد سعره للطلاب</p>
              </div>
            </div>

            <form onSubmit={handleCreateSheetSubmit} className="space-y-4 text-xs sm:text-sm">
              <div>
                <label className="block text-slate-800 font-bold mb-1">عنوان الشيت / المذكرة الأصلي *</label>
                <input
                  type="text"
                  required
                  value={sheetTitle}
                  onChange={e => setSheetTitle(e.target.value)}
                  placeholder="مثال: شيت المحاسبة الإدارية - المحاضرة 1 حتى 6"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-slate-800 font-bold mb-1">الجامعة *</label>
                  <select
                    required
                    value={sheetInstitution}
                    onChange={e => {
                      const newUniName = e.target.value;
                      setSheetInstitution(newUniName);
                      const uniObj = universitiesList.find(u => u.name === newUniName);
                      if (uniObj && uniObj.colleges.length > 0) {
                        const firstCol = uniObj.colleges[0];
                        setSheetFaculty(firstCol.name);
                        if (firstCol.degreeType === 'diploma') {
                          setSheetDegree('diploma');
                        } else if (firstCol.degreeType === 'bachelor') {
                          setSheetDegree('bachelor');
                        }
                        if (firstCol.departments.length > 0) {
                          setSheetDept(firstCol.departments[0].name);
                        } else {
                          setSheetDept('قسم العام والتخصصي');
                        }
                      } else {
                        setSheetFaculty('');
                        setSheetDept('');
                      }
                    }}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none"
                  >
                    {universitiesList.map(u => (
                      <option key={u.id} value={u.name}>{u.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-800 font-bold mb-1">الكلية *</label>
                  <select
                    required
                    value={sheetFaculty}
                    onChange={e => {
                      const newFac = e.target.value;
                      setSheetFaculty(newFac);
                      const colObj = currentFormColleges.find(c => c.name === newFac);
                      if (colObj) {
                        if (colObj.degreeType === 'diploma') {
                          setSheetDegree('diploma');
                        } else if (colObj.degreeType === 'bachelor') {
                          setSheetDegree('bachelor');
                        }
                        if (colObj.departments.length > 0) {
                          setSheetDept(colObj.departments[0].name);
                        } else {
                          setSheetDept('قسم العام والتخصصي');
                        }
                      }
                    }}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none"
                  >
                    {currentFormColleges.length > 0 ? (
                      currentFormColleges.map(c => (
                        <option key={c.id} value={c.name}>{c.name}</option>
                      ))
                    ) : (
                      <option value="">لا توجد كليات مضافة بهذه الجامعة</option>
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-800 font-bold mb-1">قسم الكلية *</label>
                  <select
                    required
                    value={sheetDept}
                    onChange={e => setSheetDept(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none"
                  >
                    {currentFormDepts.length > 0 ? (
                      currentFormDepts.map(d => (
                        <option key={d.id} value={d.name}>{d.name}</option>
                      ))
                    ) : (
                      <option value="قسم العام والتخصصي">قسم العام والتخصصي</option>
                    )}
                  </select>
                </div>
              </div>

              {/* HELPER BANNER TO UNIVERSITIES MANAGEMENT */}
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 text-xs">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-amber-700 shrink-0" />
                  <span className="text-amber-950 font-bold">
                    الجامعات والكليات مرتبطة حصرياً بقاعدة بيانات إدارة الجامعات. لإضافة جامعة أو كلية غير مضافة:
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('universities')}
                  className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black px-3.5 py-1.5 rounded-xl transition-all flex items-center gap-1 shrink-0 cursor-pointer shadow-xs"
                >
                  <Plus className="w-4 h-4" />
                  <span>انتقل إلى إدارة الجامعات والكليات 👈</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-800 font-bold mb-1">الدرجة العلمية *</label>
                  <select
                    value={sheetDegree}
                    onChange={e => setSheetDegree(e.target.value as 'bachelor' | 'diploma')}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none"
                  >
                    <option value="bachelor">بكالوريوس</option>
                    <option value="diploma">دبلوم تقني</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-800 font-bold mb-1">الفصل الدراسي (السمستر) *</label>
                  <select
                    value={sheetSemester}
                    onChange={e => setSheetSemester(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(n => (
                      <option key={n} value={n}>الفصل الدراسي {n}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-slate-800 font-bold mb-1">اسم المادة الدراسية *</label>
                  <input
                    type="text"
                    required
                    value={sheetSubject}
                    onChange={e => setSheetSubject(e.target.value)}
                    placeholder="مثال: محاسبة التكاليف"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-800 font-bold mb-1">عدد الصفحات (اختياري)</label>
                  <input
                    type="number"
                    min="1"
                    max="1000"
                    value={sheetPages || ''}
                    onChange={e => setSheetPages(parseInt(e.target.value) || 0)}
                    placeholder="اختياري"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 font-extrabold text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-800 font-bold mb-1">اسم المحاضر / أستاذ المادة</label>
                  <input
                    type="text"
                    value={sheetAuthor}
                    onChange={e => setSheetAuthor(e.target.value)}
                    placeholder="مثال: د. معاوية حسن"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-emerald-50/70 p-4 rounded-2xl border border-emerald-200">
                <div>
                  <label className="block text-emerald-950 font-black mb-1">سعر الشيت للطلاب (SDG) *</label>
                  <div className="relative">
                    <input
                      type="number"
                      min="100"
                      required
                      value={sheetPrice}
                      onChange={e => setSheetPrice(parseInt(e.target.value) || 0)}
                      className="w-full bg-white border border-emerald-400 rounded-xl p-3 font-black text-emerald-950 text-base focus:ring-2 focus:ring-emerald-600 outline-none"
                    />
                    <span className="absolute left-3 top-3.5 text-xs text-emerald-700 font-bold pointer-events-none">ج.س</span>
                  </div>
                  <span className="text-[11px] text-emerald-700 block mt-1">سعر بيع الشيت الثابت والمعتمد للطلاب</span>
                </div>

                <div>
                  <label className="block text-emerald-950 font-black mb-1">حالة التوفر بالمكتبة</label>
                  <select
                    value={sheetAvailable ? 'true' : 'false'}
                    onChange={e => setSheetAvailable(e.target.value === 'true')}
                    className="w-full bg-white border border-emerald-300 rounded-xl p-3 font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none"
                  >
                    <option value="true">متاح للطلب المباشر للطلاب ✅</option>
                    <option value="false">غير متاح حالياً ❌</option>
                  </select>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-4 px-6 rounded-2xl transition-all shadow-lg flex items-center justify-center gap-2 text-sm sm:text-base cursor-pointer active:scale-[0.99]"
                >
                  <Plus className="w-5 h-5 text-amber-300" />
                  <span>حفظ وإضافة الشيت لمكتبة الكلية والدليل فوراً</span>
                </button>
              </div>
            </form>
          </div>

          {/* SECTION 2: List & Manage Existing Sheets */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xl space-y-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
              <div>
                <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-emerald-600" />
                  <span>جميع شيتات المكتبة المسجلة حالياً ({sheets.length})</span>
                </h3>
                <p className="text-xs text-slate-500">إمكانية التعديل السريع لأسعار الشيتات والمسمى والتوفر أو حذفها</p>
              </div>

              {/* Filters & Batch Sync Action */}
              <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
                {onBatchSaveSheets && (
                  <button
                    type="button"
                    onClick={() => {
                      onBatchSaveSheets(sheets);
                      triggerToast(`✅ تمت مزامنة وحفظ جميع أسعار الشيتات المعتمدة (${sheets.length} شيت) بالسحابة وقاعدة البيانات بنجاح! 🚀`);
                    }}
                    className="bg-emerald-700 hover:bg-emerald-800 text-white font-black text-xs px-3 py-2 rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
                    title="مزامنة وحفظ جميع أسعار الشيتات المعتمدة في السحابة وقاعدة البيانات"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>مزامنة وحفظ أسعار كافة الشيتات ({sheets.length}) ☁️</span>
                  </button>
                )}

                <div className="relative flex-1 md:w-48">
                  <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
                  <input
                    type="text"
                    value={sheetSearch}
                    onChange={e => setSheetSearch(e.target.value)}
                    placeholder="بحث بالشيت أو المادة..."
                    className="w-full pl-3 pr-9 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>

                <select
                  value={sheetDeptFilter}
                  onChange={e => setSheetDeptFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none"
                >
                  <option value="all">كل الأقسام</option>
                  <option value="محاسبة">محاسبة</option>
                  <option value="تأمين">تأمين</option>
                  <option value="إدارة أعمال">إدارة أعمال</option>
                </select>

                <select
                  value={sheetSemesterFilter}
                  onChange={e => setSheetSemesterFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none"
                >
                  <option value="all">كل الفصول الدراسية (1-8)</option>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map(n => (
                    <option key={n} value={String(n)}>الفصل الدراسي {n}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Sheets Grid */}
            {(() => {
              const filteredSheets = sheets.filter(s => {
                const matchQuery = !sheetSearch.trim() || 
                  s.title.toLowerCase().includes(sheetSearch.toLowerCase()) || 
                  s.subject.toLowerCase().includes(sheetSearch.toLowerCase()) ||
                  s.authorOrLecturer?.toLowerCase().includes(sheetSearch.toLowerCase());
                const matchDept = sheetDeptFilter === 'all' || s.department === sheetDeptFilter;
                const matchSemester = sheetSemesterFilter === 'all' || String(s.semester || 1) === sheetSemesterFilter;
                return matchQuery && matchDept && matchSemester;
              });

              if (filteredSheets.length === 0) {
                return (
                  <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-300 text-slate-500 text-xs">
                    لا توجد شيتات مطابقة للبحث المحدد.
                  </div>
                );
              }

              return (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredSheets.map((st) => {
                    const currentCalculatedPrice = (typeof st.priceEstimate === 'number' && st.priceEstimate > 0) 
                      ? st.priceEstimate 
                      : 5000;
                    const editedPrice = quickPrices[st.id];
                    const hasPriceChanged = editedPrice !== undefined && editedPrice !== currentCalculatedPrice;

                    return (
                      <div 
                        key={st.id}
                        className={`p-4 rounded-2xl border transition-all flex flex-col justify-between gap-3 ${
                          st.isAvailable !== false ? 'bg-white border-slate-200 hover:border-emerald-300 shadow-xs' : 'bg-slate-50 border-slate-300 opacity-75'
                        }`}
                      >
                        <div className="space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="font-extrabold text-slate-900 text-sm leading-snug">
                              {st.title}
                            </h4>
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold shrink-0 ${
                              st.isAvailable !== false ? 'bg-emerald-100 text-emerald-900 border border-emerald-300' : 'bg-rose-100 text-rose-900 border border-rose-300'
                            }`}>
                              {st.isAvailable !== false ? 'متاح للطلب' : 'غير متاح'}
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-bold text-slate-600">
                            <span className="bg-emerald-50 text-emerald-900 px-2 py-0.5 rounded-md border border-emerald-200">
                              {st.department || 'عام'}
                            </span>
                            <span className="bg-amber-50 text-amber-900 px-2 py-0.5 rounded-md border border-amber-200">
                              سمستر {st.semester || 1}
                            </span>
                            <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md border border-slate-200">
                              {st.degreeType === 'diploma' ? 'دبلوم تقني' : 'بكالوريوس'}
                            </span>
                            <span className="bg-blue-50 text-blue-900 px-2 py-0.5 rounded-md border border-blue-200">
                              {st.pageCount} صفحة
                            </span>
                          </div>

                          <div className="text-xs text-slate-500 flex items-center justify-between pt-1">
                            <span>المادة: <strong className="text-slate-800">{st.subject}</strong></span>
                            <span>المحاضر: <strong className="text-slate-800">{st.authorOrLecturer}</strong></span>
                          </div>
                        </div>

                        {/* Price & Actions */}
                        <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                          {/* Quick Inline Price Editor */}
                          <div className="flex items-center gap-1.5 bg-emerald-50/90 p-1.5 rounded-xl border border-emerald-200">
                            <span className="text-[11px] text-emerald-950 font-bold">السعر:</span>
                            <input 
                              type="number"
                              value={editedPrice !== undefined ? editedPrice : currentCalculatedPrice}
                              onChange={(e) => {
                                const val = parseInt(e.target.value) || 0;
                                setQuickPrices(prev => ({ ...prev, [st.id]: val }));
                              }}
                              className="w-20 bg-white border border-emerald-300 rounded-lg px-2 py-1 text-xs font-black text-emerald-950 text-center outline-none focus:ring-2 focus:ring-emerald-500 shadow-xs"
                            />
                            <span className="text-[10px] text-emerald-800 font-bold">ج.س</span>
                            {hasPriceChanged && (
                              <button
                                onClick={() => {
                                  const newPrice = quickPrices[st.id];
                                  onUpdateSheet({ ...st, priceEstimate: newPrice });
                                  triggerToast(`✅ تم حفظ السعر الجديد (${formatSDG(newPrice)}) للشيت وتحديث مكتبة الطلاب فوراً! 💾`);
                                }}
                                className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-black cursor-pointer shadow-xs animate-pulse flex items-center gap-1"
                                title="حفظ السعر الجديد وتحديث المكتبة"
                              >
                                <span>حفظ 💾</span>
                              </button>
                            )}
                          </div>

                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => {
                                const nextState = !(st.isAvailable !== false);
                                onUpdateSheet({ ...st, isAvailable: nextState });
                                triggerToast(nextState ? `✅ تمت إتاحة الشيت "${st.title}" في مكتبة الطلاب` : `⚠️ تم إخفاء الشيت "${st.title}" من مكتبة الطلاب`);
                              }}
                              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                                st.isAvailable !== false ? 'bg-amber-100 hover:bg-amber-200 text-amber-900' : 'bg-emerald-100 hover:bg-emerald-200 text-emerald-900'
                              }`}
                              title="تبديل حالة التوفر"
                            >
                              {st.isAvailable !== false ? 'إخفاء' : 'إتاحة'}
                            </button>

                            <button
                              onClick={() => setEditingSheet(st)}
                              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                            >
                              <Edit3 className="w-3.5 h-3.5 text-amber-400" />
                              <span>تعديل</span>
                            </button>

                            <button
                              onClick={() => {
                                setConfirmDialog({
                                  isOpen: true,
                                  title: '🗑️ حذف شيت تعليمي',
                                  message: `هل أنت متأكد من حذف الشيت "${st.title}" من المكتبة نهائياً؟`,
                                  confirmText: 'نعم، حذف نهائي',
                                  cancelText: 'إلغاء',
                                  type: 'danger',
                                  onConfirm: () => {
                                    onDeleteSheet(st.id);
                                    triggerToast(`تم حذف الشيت (${st.title}) من المكتبة بنجاح`);
                                  },
                                });
                              }}
                              className="p-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="حذف الشيت"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* EDITING SHEET MODAL */}
      {editingSheet && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-xl w-full shadow-2xl text-slate-900 border border-slate-200 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-6">
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-amber-500" />
                <span>تعديل شيت: {editingSheet.title}</span>
              </h3>
              <button
                onClick={() => setEditingSheet(null)}
                className="p-1 rounded-full hover:bg-slate-100 text-slate-500 hover:text-slate-900"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form 
              onSubmit={(e) => {
                e.preventDefault();
                onUpdateSheet(editingSheet);
                const sheetTitle = editingSheet.title;
                setEditingSheet(null);
                triggerToast(`✅ تم حفظ التعديلات وتحديث شيت "${sheetTitle}" في مكتبة الطلاب فوراً! 📚✨`);
              }} 
              className="space-y-4 text-xs sm:text-sm"
            >
              <div>
                <label className="block text-slate-800 font-bold mb-1">عنوان الشيت *</label>
                <input
                  type="text"
                  required
                  value={editingSheet.title}
                  onChange={e => setEditingSheet({ ...editingSheet, title: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-bold text-slate-900"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-800 font-bold mb-1">الجامعة *</label>
                  <select
                    value={editingSheet.institution}
                    onChange={e => {
                      const uniName = e.target.value;
                      const uniObj = universitiesList.find(u => u.name === uniName);
                      const firstCol = uniObj?.colleges[0];
                      setEditingSheet({
                        ...editingSheet,
                        institution: uniName,
                        facultyOrYear: firstCol ? firstCol.name : '',
                        department: firstCol?.departments[0]?.name || 'قسم العام والتخصصي'
                      });
                    }}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-bold text-slate-900 text-xs"
                  >
                    {universitiesList.map(u => (
                      <option key={u.id} value={u.name}>{u.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-800 font-bold mb-1">الكلية *</label>
                  <select
                    value={editingSheet.facultyOrYear}
                    onChange={e => {
                      const colName = e.target.value;
                      const uniObj = universitiesList.find(u => u.name === editingSheet.institution) || universitiesList[0];
                      const colObj = uniObj?.colleges.find(c => c.name === colName);
                      setEditingSheet({
                        ...editingSheet,
                        facultyOrYear: colName,
                        department: colObj?.departments[0]?.name || 'قسم العام والتخصصي'
                      });
                    }}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-bold text-slate-900 text-xs"
                  >
                    {((universitiesList.find(u => u.name === editingSheet.institution) || universitiesList[0])?.colleges || []).map(c => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-800 font-bold mb-1">القسم / التخصص *</label>
                  <select
                    value={editingSheet.department}
                    onChange={e => setEditingSheet({ ...editingSheet, department: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-bold text-slate-900 text-xs"
                  >
                    {(((universitiesList.find(u => u.name === editingSheet.institution) || universitiesList[0])?.colleges.find(c => c.name === editingSheet.facultyOrYear) || universitiesList[0]?.colleges[0])?.departments || []).map(d => (
                      <option key={d.id} value={d.name}>{d.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-800 font-bold mb-1">الدرجة العلمية *</label>
                  <select
                    value={editingSheet.degreeType || 'bachelor'}
                    onChange={e => setEditingSheet({ ...editingSheet, degreeType: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-bold text-slate-900 text-xs"
                  >
                    <option value="bachelor">بكالوريوس</option>
                    <option value="diploma">دبلوم تقني</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-800 font-bold mb-1">عدد الصفحات (اختياري)</label>
                  <input
                    type="number"
                    min="1"
                    value={editingSheet.pageCount || ''}
                    onChange={e => {
                      const pages = parseInt(e.target.value) || 0;
                      setEditingSheet({ 
                        ...editingSheet, 
                        pageCount: pages
                      });
                    }}
                    placeholder="اختياري"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-black text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-slate-800 font-bold mb-1">سعر الشيت المباشر (SDG) *</label>
                  <input
                    type="number"
                    min="100"
                    required
                    value={editingSheet.priceEstimate || 0}
                    onChange={e => setEditingSheet({ ...editingSheet, priceEstimate: parseInt(e.target.value) || 0 })}
                    className="w-full bg-amber-50 border border-amber-300 rounded-xl p-2.5 font-black text-emerald-950 text-base"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-800 font-bold mb-1">المادة الدراسية *</label>
                  <input
                    type="text"
                    required
                    value={editingSheet.subject}
                    onChange={e => setEditingSheet({ ...editingSheet, subject: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-bold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-slate-800 font-bold mb-1">أستاذ المادة / المحاضر</label>
                  <input
                    type="text"
                    value={editingSheet.authorOrLecturer || ''}
                    onChange={e => setEditingSheet({ ...editingSheet, authorOrLecturer: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-bold text-slate-900"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setEditingSheet(null)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold py-3 rounded-xl transition-colors cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-black py-3.5 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer active:scale-95 text-sm"
                >
                  <Save className="w-4 h-4 text-amber-300" />
                  <span>حفظ التعديلات وتحديث الشيت في المكتبة فوراً 💾</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PRICING RATES & SIMULATOR TAB */}
      {activeTab === 'pricing' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xl max-w-5xl mx-auto space-y-8">
          <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-emerald-950 text-white rounded-2xl p-6 shadow-md border border-emerald-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-extrabold flex items-center gap-2 text-emerald-300">
                <DollarSign className="w-6 h-6 text-amber-400" />
                <span>إدارة تعريفات أسعار الورق والطباعة (سعر الورقة المطبوعة)</span>
              </h2>
              <p className="text-xs text-emerald-100/90 mt-1 leading-relaxed">
                التسعير بالمكتبة يعتمد على <strong>سعر الورقة المطبوعة الفعلية (Sheet Price)</strong> وليس فقط عدد صفحات الملف. حيث يتم قسمة صفحات الملف على نسبة توزيع الصفحات (2:1 العادي = صفحتين في الورقة، 4:1 الشائع = 4 صفحات في الورقة، 8:1 الاسلايت = 8 صفحات في الورقة).
              </p>
            </div>
            <span className="bg-amber-400 text-amber-950 font-black px-4 py-2 rounded-xl text-xs shrink-0 shadow">
              سعر الورقة الحالي: {editingRates.bwPerPage || 200} ج.س
            </span>
          </div>

          {isSaved && (
            <div className="p-4 bg-emerald-50 border-2 border-emerald-500 rounded-2xl text-emerald-950 font-black text-sm flex items-center gap-3 shadow-md animate-pulse">
              <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
              <span>تم حفظ وتحديث تعريفات أسعار الورق والخدمات بنجاح! 🎉</span>
            </div>
          )}

          <form onSubmit={handleSaveRates} className="space-y-6 text-xs sm:text-sm">
            {/* Promotional Campaign Price (Home Page & WhatsApp Ads) */}
            <div className="bg-gradient-to-br from-amber-500/10 via-amber-400/5 to-emerald-500/10 p-5 rounded-2xl border-2 border-amber-400 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-amber-300/60 pb-3">
                <div className="flex items-center gap-2.5">
                  <span className="w-9 h-9 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-black shadow">
                    🔥
                  </span>
                  <div>
                    <h3 className="font-extrabold text-slate-950 text-base">
                      سعر الورقة في العرض الترويجي والصفحة الرئيسية (A4 SUDAN Promo Price)
                    </h3>
                    <p className="text-xs text-slate-600 font-medium">
                      هذا السعر يظهر مباشرة في الإعلانات المتحركة والزر العائم في الصفحة الرئيسية ويتم ربطه تلقائياً برسائل الواتساب.
                    </p>
                  </div>
                </div>

                <span className="bg-slate-950 text-amber-300 font-mono font-black text-xs px-3 py-1.5 rounded-xl shrink-0 shadow-sm">
                  السعر النشط: {editingRates.promoPaperPrice ?? 99} ج.س
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                <div className="bg-white p-4 rounded-xl border border-amber-200 shadow-sm space-y-3">
                  <label className="block font-black text-slate-900 text-sm">
                    سعر الورقة الترويجي (SDG) *
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="1"
                      required
                      value={editingRates.promoPaperPrice ?? 99}
                      onChange={e => {
                        const val = Number(e.target.value) || 0;
                        setEditingRates({ ...editingRates, promoPaperPrice: val });
                      }}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleQuickSavePromoPrice();
                        }
                      }}
                      className="w-full bg-slate-50 border-2 border-amber-300 rounded-xl p-3 font-mono font-black text-slate-950 text-lg focus:ring-2 focus:ring-amber-500 outline-none"
                    />
                    <span className="absolute left-3 top-3.5 text-xs text-amber-900 font-black pointer-events-none">
                      ج.س / ورقة
                    </span>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={handleQuickSavePromoPrice}
                      className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black py-2.5 px-4 rounded-xl shadow-md flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer text-xs sm:text-sm"
                    >
                      <Save className="w-4 h-4" />
                      <span>حفظ ونشر سعر العرض ({editingRates.promoPaperPrice ?? 99} ج.س) لجميع العملاء 🚀</span>
                    </button>
                  </div>

                  {isPromoSaved && (
                    <div className="p-2.5 bg-emerald-100 border border-emerald-500 text-emerald-950 rounded-xl text-xs font-black flex items-center gap-2 animate-bounce">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>تم حفظ السعر ({editingRates.promoPaperPrice ?? 99} ج.س) ونشره لجميع العملاء فوراً! ✨</span>
                    </div>
                  )}

                  <p className="text-[11px] text-slate-500">
                    يمكنك تعديل هذا الرقم (مثلاً 99 أو 120 أو 85) والضغط على الزر وسيتم حفظه في قاعدة البيانات السحابية والتحديث المباشر فوراً على كل شاشات العملاء.
                  </p>
                </div>

                {/* Live Preview of the dynamic ad text */}
                <div className="bg-slate-900 text-white p-4 rounded-xl border border-slate-800 space-y-2 shadow-inner">
                  <div className="flex items-center justify-between text-[11px] font-bold text-amber-400">
                    <span>معاينة الإعلان في الصفحة الرئيسية:</span>
                    <span className="bg-amber-400/20 px-2 py-0.5 rounded text-amber-300">مباشر 🔴</span>
                  </div>

                  <div className="space-y-1.5">
                    <div className="bg-slate-950 p-2 rounded-lg border border-slate-800 text-xs font-black text-amber-300 flex items-center gap-2">
                      <span className="bg-amber-400 text-slate-950 text-[10px] px-1.5 py-0.5 rounded">إعلان 1</span>
                      <span>اطبع الورقة بـ {editingRates.promoPaperPrice ?? 99}ج في A4 SUDAN</span>
                    </div>

                    <div className="bg-slate-950 p-2 rounded-lg border border-slate-800 text-xs font-black text-emerald-300 flex items-center gap-2">
                      <span className="bg-emerald-400 text-slate-950 text-[10px] px-1.5 py-0.5 rounded">إعلان 2</span>
                      <span>عرض خاص: الورقة بـ {editingRates.promoPaperPrice ?? 99} ج</span>
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-400 pt-1 flex items-center justify-between">
                    <span>رقم واتساب المربوط: <strong>0119636365</strong></span>
                  </div>
                </div>
              </div>
            </div>

            {/* Sheet Rates Section */}
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
              <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2 border-b border-slate-200 pb-2">
                <Printer className="w-5 h-5 text-emerald-600" />
                <span>1. سعر الورقة المطبوعة الأساسية (Price per Paper Sheet)</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                  <label className="block font-black text-slate-900 mb-1">سعر الورقة المطبوعة (أبيض وأسود) *</label>
                  <div className="relative">
                    <input
                      type="number"
                      min="1"
                      required
                      value={editingRates.bwPerPage}
                      onChange={e => {
                        const val = Number(e.target.value) || 0;
                        setEditingRates({ ...editingRates, bwPerPage: val });
                        setSimSheetPrice(val);
                      }}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 font-mono font-black text-slate-900 text-base focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                    <span className="absolute left-3 top-3.5 text-xs text-slate-500 font-bold pointer-events-none">ج.س / ورقة</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    هذا السعر يُحسب لكل ورقة مطبوعة فعلياً (مثال: 100 صفحة في العادي 2:1 = 50 ورقة × {editingRates.bwPerPage}ج = {50 * (editingRates.bwPerPage || 200)}ج)
                  </p>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                  <label className="block font-black text-slate-900 mb-1">سعر الورقة المطبوعة (ألوان 🎨) *</label>
                  <div className="relative">
                    <input
                      type="number"
                      min="1"
                      required
                      value={editingRates.colorPerPage}
                      onChange={e => setEditingRates({ ...editingRates, colorPerPage: Number(e.target.value) || 0 })}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 font-mono font-black text-slate-900 text-base focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                    <span className="absolute left-3 top-3.5 text-xs text-slate-500 font-bold pointer-events-none">ج.س / ورقة</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">سعر الطباعة الملونة الكاملة للورقة الواحدة</p>
                </div>
              </div>
            </div>

            {/* Binding Prices */}
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
              <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2 border-b border-slate-200 pb-2">
                <Layers className="w-5 h-5 text-amber-600" />
                <span>2. أسعار التغليف والتجليد للطلب (Binding Rates)</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">بدون تغليف</label>
                  <input
                    type="number"
                    value={editingRates.bindingPrice?.none ?? 0}
                    onChange={e => setEditingRates({ ...editingRates, bindingPrice: { ...editingRates.bindingPrice, none: Number(e.target.value) || 0 } })}
                    className="w-full bg-white border border-slate-300 rounded-xl p-2.5 font-bold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">سلك حلزوني</label>
                  <input
                    type="number"
                    value={editingRates.bindingPrice?.spiral_plastic ?? 1200}
                    onChange={e => setEditingRates({ ...editingRates, bindingPrice: { ...editingRates.bindingPrice, spiral_plastic: Number(e.target.value) || 0 } })}
                    className="w-full bg-white border border-slate-300 rounded-xl p-2.5 font-bold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">كبس وتدبيس</label>
                  <input
                    type="number"
                    value={editingRates.bindingPrice?.stapled ?? 150}
                    onChange={e => setEditingRates({ ...editingRates, bindingPrice: { ...editingRates.bindingPrice, stapled: Number(e.target.value) || 0 } })}
                    className="w-full bg-white border border-slate-300 rounded-xl p-2.5 font-bold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">غلاف مجلد حراري</label>
                  <input
                    type="number"
                    value={editingRates.bindingPrice?.softcover ?? 2500}
                    onChange={e => setEditingRates({ ...editingRates, bindingPrice: { ...editingRates.bindingPrice, softcover: Number(e.target.value) || 0 } })}
                    className="w-full bg-white border border-slate-300 rounded-xl p-2.5 font-bold text-slate-900"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-4 rounded-2xl transition-colors shadow-lg flex items-center justify-center gap-2 cursor-pointer text-base"
            >
              <Save className="w-5 h-5" />
              <span>حفظ وتطبيق تعريفة الأسعار الجديدة فوراً</span>
            </button>
          </form>

          {/* Interactive Live Sheet Pricing Simulator */}
          <div className="bg-gradient-to-br from-amber-50 to-orange-50/80 p-6 rounded-3xl border-2 border-amber-300/80 space-y-5 shadow-sm">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-amber-200 pb-3">
              <div>
                <h3 className="text-base font-black text-amber-950 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-amber-600" />
                  <span>حاسبة وسيموليتر تسعير الورق المباشرة (Live Sheet Pricing Calculator)</span>
                </h3>
                <p className="text-xs text-amber-800">اختبار مباشر لكيفية حساب التكلفة بناءً على عدد الصفحات وسعر الورقة للأنواع الثلاثة</p>
              </div>
              <span className="bg-amber-200 text-amber-950 font-extrabold px-3 py-1 rounded-full text-xs border border-amber-300">
                100% مطابقة لقاعدة الحساب
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-amber-950 font-bold mb-1">عدد صفحات ملف PDF للتجربة:</label>
                <input
                  type="number"
                  min="1"
                  value={simPages}
                  onChange={e => setSimPages(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full bg-white border border-amber-400 rounded-xl p-3 font-mono font-black text-slate-900 text-base shadow-inner focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-amber-950 font-bold mb-1">سعر الورقة المطبوعة (SDG):</label>
                <input
                  type="number"
                  min="1"
                  value={simSheetPrice}
                  onChange={e => setSimSheetPrice(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full bg-white border border-amber-400 rounded-xl p-3 font-mono font-black text-slate-900 text-base shadow-inner focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>
            </div>

            {/* Output Cards Comparison */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              {/* 1. Normal (2:1) */}
              <div className="bg-white p-4 rounded-2xl border-2 border-emerald-400 shadow-sm space-y-2">
                <div className="flex items-center justify-between border-b border-emerald-100 pb-2">
                  <span className="font-black text-emerald-950 text-sm">📄 العادي (2:1)</span>
                  <span className="bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded text-[10px]">الافتراضي</span>
                </div>
                <div className="text-xs text-slate-600 space-y-1">
                  <p>• قسمة الصفحات: {simPages} ÷ 2 = <strong className="text-emerald-950 font-black">{Math.ceil(simPages / 2)} ورقة مطبوعة</strong></p>
                  <p>• سعر الورقة: {simSheetPrice} ج.س</p>
                  <p className="pt-2 text-sm font-black text-emerald-900 bg-emerald-50 p-2 rounded-xl text-center border border-emerald-200">
                    السعر الإجمالي: {formatSDG(Math.ceil(simPages / 2) * simSheetPrice)}
                  </p>
                </div>
              </div>

              {/* 2. Popular (4:1) */}
              <div className="bg-white p-4 rounded-2xl border-2 border-amber-400 shadow-sm space-y-2">
                <div className="flex items-center justify-between border-b border-amber-100 pb-2">
                  <span className="font-black text-amber-950 text-sm">⭐ الشائع (4:1)</span>
                  <span className="bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded text-[10px]">الأكثر طلباً</span>
                </div>
                <div className="text-xs text-slate-600 space-y-1">
                  <p>• قسمة الصفحات: {simPages} ÷ 4 = <strong className="text-amber-950 font-black">{Math.ceil(simPages / 4)} ورقة مطبوعة</strong></p>
                  <p>• سعر الورقة: {simSheetPrice} ج.س</p>
                  <p className="pt-2 text-sm font-black text-amber-900 bg-amber-50 p-2 rounded-xl text-center border border-amber-200">
                    السعر الإجمالي: {formatSDG(Math.ceil(simPages / 4) * simSheetPrice)}
                  </p>
                </div>
              </div>

              {/* 3. Slide (8:1) */}
              <div className="bg-white p-4 rounded-2xl border-2 border-blue-400 shadow-sm space-y-2">
                <div className="flex items-center justify-between border-b border-blue-100 pb-2">
                  <span className="font-black text-blue-950 text-sm">📊 الاسلايت (8:1)</span>
                  <span className="bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded text-[10px]">للسلايدات</span>
                </div>
                <div className="text-xs text-slate-600 space-y-1">
                  <p>• قسمة الصفحات: {simPages} ÷ 8 = <strong className="text-blue-950 font-black">{Math.ceil(simPages / 8)} ورقة مطبوعة</strong></p>
                  <p>• سعر الورقة: {simSheetPrice} ج.س</p>
                  <p className="pt-2 text-sm font-black text-blue-900 bg-blue-50 p-2 rounded-xl text-center border border-blue-200">
                    السعر الإجمالي: {formatSDG(Math.ceil(simPages / 8) * simSheetPrice)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* GOOGLE SHEETS TAB */}
      {activeTab === 'sheets' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xl max-w-4xl mx-auto space-y-6">
          <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-emerald-950 text-white rounded-2xl p-6 shadow-md border border-emerald-700/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-extrabold flex items-center gap-2 text-emerald-300">
                <FileSpreadsheet className="w-6 h-6 text-amber-400" />
                <span>ربط واستخراج طلبات الطباعة عبر جدول قوقل شيت (Google Sheets)</span>
              </h2>
              <p className="text-xs text-emerald-100/90 mt-1 leading-relaxed">
                قم بتهيئة وحفظ كافة الطلبات الواردة والملفات والتفاصيل وتلقائياً مزامنتها مع جدول بيانات قوقل الخاص بالمكتبة.
              </p>
            </div>
            {spreadsheetUrl && (
              <a
                href={spreadsheetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-amber-400 hover:bg-amber-500 text-slate-950 font-extrabold px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow shrink-0 transition-colors cursor-pointer"
              >
                <span>فتح شيت قوقل الآن</span>
                <ExternalLink className="w-4 h-4" />
              </a>
            )}
          </div>

          {syncStatusMsg && (
            <div className="p-4 bg-emerald-50 border border-emerald-300 text-emerald-950 rounded-2xl text-xs font-bold flex items-center justify-between">
              <span>{syncStatusMsg}</span>
              <button onClick={() => setSyncStatusMsg('')} className="text-emerald-800 hover:text-emerald-950">✕</button>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Step 1: OAuth Connection */}
            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 flex flex-col justify-between space-y-4">
              <div>
                <span className="bg-emerald-100 text-emerald-900 text-[10px] font-black px-2.5 py-1 rounded-full uppercase border border-emerald-300">
                  الخطوة 1
                </span>
                <h3 className="font-bold text-slate-900 text-base mt-2 mb-1">تسجيل الدخول بحساب قوقل</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  ربط حساب قوقل الذي ترغب في إنشاء جدول الطلبات بداخله.
                </p>
              </div>

              {accessToken ? (
                <div className="bg-emerald-100/80 border border-emerald-300 rounded-xl p-3 text-xs font-bold text-emerald-950 flex items-center justify-between">
                  <span>✅ الحساب متصل ومصرح بالوصول</span>
                  <button 
                    onClick={handleConnectGoogleSheets}
                    className="text-[11px] underline text-emerald-800 hover:text-emerald-950"
                  >
                    تبديل الحساب
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleConnectGoogleSheets}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-3 px-4 rounded-xl transition-all shadow flex items-center justify-center gap-2 text-xs cursor-pointer"
                >
                  <FileSpreadsheet className="w-4 h-4 text-amber-300" />
                  <span>ربط حساب قوقل واستخراج التصريح</span>
                </button>
              )}
            </div>

            {/* Step 2: Init / Create Sheet */}
            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 flex flex-col justify-between space-y-4">
              <div>
                <span className="bg-emerald-100 text-emerald-900 text-[10px] font-black px-2.5 py-1 rounded-full uppercase border border-emerald-300">
                  الخطوة 2
                </span>
                <h3 className="font-bold text-slate-900 text-base mt-2 mb-1">إنشاء أو تجهيز ملف الشيت</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  سيقوم النظام بتجميع عناوين الأعمدة (رقم الطلب، اسم العميل، الهاتف، التفاصيل، المبالغ، رقم بنكك، الحالة).
                </p>
              </div>

              <button
                type="button"
                onClick={() => handleInitSheet()}
                disabled={isSyncing || !accessToken}
                className="w-full bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-extrabold py-3 px-4 rounded-xl transition-all shadow flex items-center justify-center gap-2 text-xs cursor-pointer"
              >
                <RefreshCw className={`w-4 h-4 text-emerald-400 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{spreadsheetId ? 'تحديث وإنشاء عناوين الشيت' : 'إنشاء شيت طلبات جديد تلقائياً'}</span>
              </button>
            </div>
          </div>

          {/* Sync All Existing Orders */}
          <div className="bg-amber-50/80 rounded-2xl p-5 border border-amber-200/80 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1">
              <h4 className="font-extrabold text-amber-950 text-sm">مزامنة كافّة الطلبات المسجلة بالحاسوب مع شيت قوقل</h4>
              <p className="text-xs text-amber-900/80">
                إرسال وتحديث السجلات الحالية ({orders.length} طلب) دفعة واحدة إلى قوقل شيت.
              </p>
            </div>

            <button
              type="button"
              onClick={handleSyncAllOrders}
              disabled={isSyncing || !spreadsheetId}
              className="bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-50 text-white font-extrabold py-3 px-6 rounded-xl transition-all shadow flex items-center gap-2 text-xs shrink-0 cursor-pointer"
            >
              <Save className="w-4 h-4 text-amber-300" />
              <span>مزامنة وتصدير كافة الطلبات ({orders.length})</span>
            </button>
          </div>
        </div>
      )}

      {/* COUPONS TAB */}
      {activeTab === 'coupons' && (
        <div className="space-y-6 max-w-5xl mx-auto">
          {/* Form to create new coupon */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xl space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                <Tag className="w-6 h-6 text-emerald-600" />
                <span>إدارة وتوليد كوبونات وأكواد الخصم والتخفيض</span>
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                قم بإنشاء كود خصم مخصص بنسبة مئوية واستهداف دفعة دراسية معينة أو جميع الدفعات بالكلية
              </p>
            </div>

            <form onSubmit={handleCreateCoupon} className="bg-emerald-50/60 p-5 rounded-2xl border border-emerald-200 space-y-4">
              <h3 className="font-bold text-emerald-950 text-sm flex items-center gap-2">
                <Plus className="w-4 h-4 text-emerald-700" />
                <span>إصدار كوبون تخفيض جديد</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">اسم/رمز الكوبون (الرمز) *</label>
                  <input
                    type="text"
                    required
                    value={newCouponCode}
                    onChange={e => setNewCouponCode(e.target.value.toUpperCase())}
                    placeholder="مثال: OFF15"
                    className="w-full bg-white border border-slate-300 rounded-xl p-2.5 font-mono font-black text-slate-900 tracking-wider text-sm focus:ring-2 focus:ring-emerald-500 outline-none uppercase"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">نسبة التخفيض (%) *</label>
                  <div className="relative">
                    <input
                      type="number"
                      min="1"
                      max="90"
                      required
                      value={newCouponDiscount}
                      onChange={e => setNewCouponDiscount(Number(e.target.value))}
                      placeholder="15"
                      className="w-full bg-white border border-slate-300 rounded-xl p-2.5 font-black text-slate-900 text-sm focus:ring-2 focus:ring-emerald-500 outline-none pl-8"
                    />
                    <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-500">%</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">وصف أو ملاحظة الكوبون</label>
                  <input
                    type="text"
                    value={newCouponNotes}
                    onChange={e => setNewCouponNotes(e.target.value)}
                    placeholder="مثال: خصم خاص لجميع الطلاب"
                    className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold px-6 py-2.5 rounded-xl text-xs sm:text-sm shadow transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Tag className="w-4 h-4" />
                  <span>إنشاء وتفعيل الكوبون 🏷️</span>
                </button>
              </div>
            </form>

            {/* Coupons List */}
            <div className="space-y-4">
              <h3 className="font-black text-slate-900 text-base flex items-center gap-2 border-b border-slate-100 pb-3">
                <span>الكوبونات المتاحة حالياً بالسيستم ({coupons.length})</span>
              </h3>

              {coupons.length === 0 ? (
                <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-300 text-slate-500 text-xs">
                  لا توجد كوبونات تخفيض مضافة حالياً.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {coupons.map((c) => {
                    const batchLabel = c.targetBatch === 'batch_28' ? 'الدفعة 28'
                      : c.targetBatch === 'batch_29' ? 'الدفعة 29'
                      : c.targetBatch === 'batch_30' ? 'الدفعة 30'
                      : c.targetBatch === 'batch_31' ? 'الدفعة 31'
                      : c.targetBatch === 'batch_32' ? 'الدفعة 32'
                      : c.targetBatch === 'batch_33_34' ? 'الدفعة 33 و 34'
                      : 'عام لكل الدفعات';

                    return (
                      <div
                        key={c.id}
                        className={`p-4 rounded-2xl border transition-all flex items-center justify-between gap-4 ${
                          c.isActive ? 'bg-emerald-50/40 border-emerald-300 shadow-xs' : 'bg-slate-50 border-slate-200 opacity-70'
                        }`}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono font-black text-base text-slate-900 bg-white px-2.5 py-1 rounded-lg border border-slate-300 shadow-2xs tracking-wider">
                              {c.code}
                            </span>
                            <span className="bg-amber-100 text-amber-950 font-black text-xs px-2.5 py-1 rounded-full border border-amber-300">
                              خصم {c.discountPercentage}%
                            </span>
                            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${
                              c.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'
                            }`}>
                              {c.isActive ? 'مفعل ✅' : 'معطل ⏸️'}
                            </span>
                          </div>

                          <p className="text-xs text-slate-600 font-medium pt-1">
                            المستهدف: <strong className="text-slate-900 font-bold">{batchLabel}</strong>
                            {c.notes && <span className="text-slate-500"> • {c.notes}</span>}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => onToggleCouponStatus?.(c.id)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                              c.isActive
                                ? 'bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-300'
                                : 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600'
                            }`}
                          >
                            {c.isActive ? 'تعطيل' : 'تفعيل'}
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setConfirmDialog({
                                isOpen: true,
                                title: '🗑️ حذف كوبون تخفيض',
                                message: `هل أنت متأكد من حذف الكوبون "${c.code}"؟`,
                                confirmText: 'نعم، حذف',
                                cancelText: 'إلغاء',
                                type: 'danger',
                                onConfirm: () => {
                                  onDeleteCoupon?.(c.id);
                                  triggerToast(`تم حذف الكوبون [${c.code}] بنجاح`);
                                  addLogEntry(
                                    'coupon_deleted',
                                    `تم حذف كوبون التخفيض [${c.code}] (خصم ${c.discountPercentage}%) من النظام`
                                  );
                                },
                              });
                            }}
                            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-xl border border-rose-200 transition-colors cursor-pointer"
                            title="حذف الكوبون"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ACTIVITY LOG TAB */}
      {activeTab === 'activity_logs' && (
        <div className="space-y-6">
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
            
            {/* Header & Performer Input */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-5">
              <div>
                <div className="flex items-center gap-2 text-emerald-700 font-bold text-xs mb-1">
                  <History className="w-4 h-4 text-emerald-600" />
                  <span>نظام الشفافية والتتبع الإداري • Administrative Activity Audit</span>
                </div>
                <h3 className="text-2xl font-black text-slate-900 flex items-center gap-2">
                  <span>📋 سجل النشاط الإداري والعمليات</span>
                  <span className="text-xs font-mono bg-emerald-100 text-emerald-900 px-2.5 py-1 rounded-full border border-emerald-300 font-bold">
                    {filteredActivityLogs.length} حركة مسجلة
                  </span>
                </h3>
                <p className="text-slate-600 text-xs sm:text-sm mt-1">
                  سجل زمني حي لجميع التعديلات على الطلبات (تغيير الحالات، تأكيد الدفع، الكوبونات، وحذف الطلبات) مسبوقة باسم المسؤول المنفذ.
                </p>
              </div>

              {/* Performer Name Input Box */}
              <div className="bg-emerald-50/90 p-3.5 rounded-2xl border border-emerald-200 space-y-1.5 shrink-0 max-w-sm w-full">
                <label className="text-xs font-black text-emerald-950 flex items-center gap-1.5">
                  <User className="w-4 h-4 text-emerald-700" />
                  <span>اسم مسؤول الإجراء الحالي:</span>
                </label>
                <input
                  type="text"
                  value={adminPerformerName}
                  onChange={(e) => handleAdminPerformerChange(e.target.value)}
                  placeholder="مثال: المسؤول أحمد - قسم الطباعة"
                  className="w-full bg-white text-slate-900 text-xs font-bold px-3 py-2 rounded-xl border border-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <p className="text-[10px] text-emerald-800 font-medium">
                  💡 سيتم تسجيل كافة الإجراءات والتحديثات القادمة باسم هذا المسؤول.
                </p>
              </div>
            </div>

            {/* Quick Activity Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <span className="text-xs text-slate-500 font-bold block">إجمالي الحركة المسجلة</span>
                <strong className="text-xl font-black text-slate-900 block mt-1 font-mono">{activityLogs.length} سجل</strong>
              </div>
              <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-200">
                <span className="text-xs text-emerald-800 font-bold block">تغييرات حالات الطلبات</span>
                <strong className="text-xl font-black text-emerald-900 block mt-1 font-mono">
                  {activityLogs.filter(l => l.actionType === 'status_change').length} حركة
                </strong>
              </div>
              <div className="bg-amber-50 p-4 rounded-2xl border border-amber-200">
                <span className="text-xs text-amber-900 font-bold block">تأكيدات التحصيل المالي</span>
                <strong className="text-xl font-black text-amber-950 block mt-1 font-mono">
                  {activityLogs.filter(l => l.actionType === 'payment_verified').length} عملية
                </strong>
              </div>
              <div className="bg-rose-50 p-4 rounded-2xl border border-rose-200">
                <span className="text-xs text-rose-800 font-bold block">إلغاء وحذف وتعديلات</span>
                <strong className="text-xl font-black text-rose-900 block mt-1 font-mono">
                  {activityLogs.filter(l => l.actionType === 'order_deleted' || l.actionType === 'coupon_deleted').length} إجراء
                </strong>
              </div>
            </div>

            {/* Search & Filter Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-100 p-3.5 rounded-2xl border border-slate-200 text-xs">
              
              <div className="flex items-center gap-3 flex-wrap flex-1">
                {/* Search Input */}
                <div className="relative min-w-[220px] flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
                  <input
                    type="text"
                    value={logSearchQuery}
                    onChange={(e) => setLogSearchQuery(e.target.value)}
                    placeholder="ابحث برقم الطلب، اسم المسؤول، أو التفاصيل..."
                    className="w-full pr-9 pl-3 py-2 bg-white rounded-xl border border-slate-300 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                {/* Action Type Filter */}
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-600 font-bold">نوع الإجراء:</span>
                  <select
                    value={logActionFilter}
                    onChange={(e) => setLogActionFilter(e.target.value)}
                    className="bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none"
                  >
                    <option value="all">جميع الإجراءات (الكل)</option>
                    <option value="status_change">تغيير حالات الطلبات 🖨️</option>
                    <option value="payment_verified">تأكيد الدفع والمالية 💵</option>
                    <option value="order_deleted">حذف وإلغاء الطلبات ❌</option>
                    <option value="coupon_added">إضافة وتعديل الكوبونات 🏷️</option>
                    <option value="sheet_added">إضافة شيتات الكلية 📚</option>
                    <option value="pricing_updated">تحديث أسعار الطباعة 💲</option>
                  </select>
                </div>
              </div>

              {/* Action Buttons: Export & Clear */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleExportActivityLogsCSV}
                  className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-amber-950 font-black rounded-xl border border-amber-300 shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
                  title="تصدير سجل النشاط إلى CSV"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>تصدير CSV 📊</span>
                </button>

                {activityLogs.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearActivityLogs}
                    className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-xl border border-rose-200 transition-all flex items-center gap-1.5 cursor-pointer"
                    title="مسح كافة سجلات النشاط"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>مسح السجل</span>
                  </button>
                )}
              </div>

            </div>

            {/* Activity Log Entries Timeline */}
            <div className="space-y-3">
              {filteredActivityLogs.map(log => {
                const logDate = new Date(log.timestamp);
                const formattedDate = !isNaN(logDate.getTime())
                  ? `${logDate.toLocaleDateString('ar-SD')} - ${logDate.toLocaleTimeString('ar-SD', { hour: '2-digit', minute: '2-digit' })}`
                  : log.timestamp;

                const getCategoryBadge = (type: ActivityLog['actionType']) => {
                  switch (type) {
                    case 'status_change':
                      return { label: 'تحديث حالة', bg: 'bg-emerald-100 text-emerald-900 border-emerald-300', icon: Clock };
                    case 'payment_verified':
                      return { label: 'تأكيد مالية', bg: 'bg-amber-100 text-amber-950 border-amber-300', icon: CheckCircle2 };
                    case 'order_deleted':
                      return { label: 'حذف طلب', bg: 'bg-rose-100 text-rose-900 border-rose-300', icon: Trash2 };
                    case 'coupon_added':
                    case 'coupon_deleted':
                      return { label: 'إدارة الكوبونات', bg: 'bg-purple-100 text-purple-900 border-purple-300', icon: Tag };
                    case 'sheet_added':
                      return { label: 'مكتبة الشيتات', bg: 'bg-blue-100 text-blue-900 border-blue-300', icon: BookOpen };
                    case 'pricing_updated':
                      return { label: 'تعريفات الأسعار', bg: 'bg-teal-100 text-teal-900 border-teal-300', icon: DollarSign };
                    default:
                      return { label: 'إجراء إداري', bg: 'bg-slate-100 text-slate-800 border-slate-300', icon: ShieldCheck };
                  }
                };

                const category = getCategoryBadge(log.actionType);
                const IconComp = category.icon;

                return (
                  <div
                    key={log.id}
                    className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs hover:border-emerald-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-2.5 rounded-xl border shrink-0 mt-0.5 ${category.bg}`}>
                        <IconComp className="w-4 h-4" />
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`px-2.5 py-0.5 rounded-full font-bold border text-[11px] ${category.bg}`}>
                            {category.label}
                          </span>
                          
                          <span className="bg-slate-100 text-slate-800 font-bold px-2.5 py-0.5 rounded-lg border border-slate-300 flex items-center gap-1">
                            <User className="w-3 h-3 text-emerald-600" />
                            <span>{log.adminName}</span>
                          </span>

                          {log.orderId && (
                            <span className="font-mono font-black bg-emerald-950 text-amber-300 px-2 py-0.5 rounded border border-emerald-800 text-[11px]">
                              {log.orderId}
                            </span>
                          )}
                        </div>

                        <p className="text-slate-900 font-bold text-sm leading-relaxed pt-0.5">
                          {log.details}
                        </p>
                      </div>
                    </div>

                    <div className="sm:text-left shrink-0 border-t sm:border-t-0 border-slate-100 pt-2 sm:pt-0">
                      <span className="text-slate-500 font-mono text-[11px] bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200 block sm:inline-block">
                        📅 {formattedDate}
                      </span>
                    </div>
                  </div>
                );
              })}

              {filteredActivityLogs.length === 0 && (
                <div className="text-center py-12 bg-slate-50 rounded-2xl border border-slate-200">
                  <History className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-slate-600 font-bold text-sm">لا توجد سجلات نشاط مطابقة للبحث أو الفلتر حالياً</p>
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* RECYCLE BIN / TRASH TAB (سلة المحذوفات للطلبات) */}
      {activeTab === 'trash' && (
        <div className="space-y-6">
          {!isTrashUnlocked ? (
            /* LOCKED TRASH VIEW */
            <div className="bg-white p-8 sm:p-12 rounded-3xl border border-slate-200 shadow-sm text-center max-w-md mx-auto space-y-6 my-8">
              <div className="w-20 h-20 bg-rose-100 text-rose-600 rounded-3xl flex items-center justify-center mx-auto shadow-sm ring-8 ring-rose-50">
                <Lock className="w-10 h-10" />
              </div>
              <div>
                <h3 className="text-2xl font-black text-slate-900">سلة المحذوفات مقفلة 🔒</h3>
                <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                  هذا القسم محمي، يرجى إدخال رمز الأمان للوصول إلى الطلبات المحذوفة واسترجاعها
                </p>
              </div>

              <form onSubmit={handleUnlockTrash} className="space-y-4 text-right">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2">
                    رمز الدخول السري (PIN Code):
                  </label>
                  <div className="relative">
                    <KeyRound className="w-5 h-5 text-slate-400 absolute right-3.5 top-3.5" />
                    <input
                      type="password"
                      required
                      autoFocus
                      value={trashPinInput}
                      onChange={e => {
                        setTrashPinInput(e.target.value);
                        setTrashPinError('');
                      }}
                      placeholder="أدخل رمز الأمان..."
                      className="w-full pr-11 pl-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none font-mono text-center text-xl text-slate-900 tracking-widest"
                    />
                  </div>
                  {trashPinError && (
                    <p className="mt-2 text-xs font-bold text-rose-600 bg-rose-50 p-2.5 rounded-xl border border-rose-200 flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{trashPinError}</span>
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  className="w-full bg-rose-600 hover:bg-rose-700 text-white font-black py-3.5 rounded-xl shadow-md transition-all text-sm cursor-pointer flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99]"
                >
                  <ShieldCheck className="w-5 h-5" />
                  <span>فتح سلة المحذوفات</span>
                </button>
              </form>
            </div>
          ) : (
            /* UNLOCKED TRASH CONTENT */
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
              {/* Trash Header */}
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-5">
                <div>
                  <div className="flex items-center gap-2 text-rose-700 font-bold text-xs mb-1">
                    <Trash2 className="w-4 h-4 text-rose-600" />
                    <span>سلة المحذوفات للطلبات • 30 Days Retention Policy</span>
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 flex items-center gap-2">
                    <span>🗑️ الطلبات المحذوفة</span>
                    <span className="text-xs font-mono bg-rose-100 text-rose-950 px-3 py-1 rounded-full border border-rose-300 font-bold">
                      {deletedOrdersList.length} طلب
                    </span>
                  </h3>
                  <p className="text-slate-600 text-xs sm:text-sm mt-1">
                    الطلبات المنقولة إلى سلة المحذوفات محفوظة بأمان. يمكنك استرجاع أي طلب إلى لوحة التحكم أو حذفه نهائياً.
                  </p>
                </div>

                <div className="flex items-center gap-2.5 flex-wrap">
                  <button
                    type="button"
                    onClick={() => setIsTrashUnlocked(false)}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-4 py-2.5 rounded-2xl text-xs sm:text-sm inline-flex items-center gap-2 transition-all border border-slate-300 cursor-pointer"
                  >
                    <Lock className="w-4 h-4 text-slate-500" />
                    <span>قفل السلة 🔒</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleEmptyTrash}
                    disabled={deletedOrdersList.length === 0}
                    className={`px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-black inline-flex items-center gap-2 transition-all shadow-md cursor-pointer ${
                      deletedOrdersList.length > 0
                        ? 'bg-rose-600 hover:bg-rose-700 text-white'
                        : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                    }`}
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>تفريغ السلة نهائياً 🧹</span>
                  </button>
                </div>
              </div>

              {/* Deleted Orders List */}
              {deletedOrdersList.length === 0 ? (
                <div className="text-center py-16 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
                    <Trash2 className="w-8 h-8" />
                  </div>
                  <h4 className="text-base font-bold text-slate-700">سلة المحذوفات فارغة حالياً</h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    لا توجد أي طلبات محذوفة في الوقت الحالي. عند حذف أي طلب سيظهر هنا مع إمكانية استرجاعه في أي وقت.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {deletedOrdersList.map(deletedOrder => {
                    const formattedDelDate = deletedOrder.deletedAt
                      ? new Date(deletedOrder.deletedAt).toLocaleString('ar-SD', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : 'تاريخ غير محدد';

                    return (
                      <div
                        key={deletedOrder.id}
                        className="bg-slate-50 hover:bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 hover:border-slate-300 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                      >
                        <div className="space-y-1 min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono font-black text-rose-700 text-sm">
                              #{deletedOrder.id}
                            </span>
                            <span className="font-bold text-slate-900 text-sm">
                              {deletedOrder.customerName}
                            </span>
                            <span className="text-xs text-slate-500 font-mono">
                              ({deletedOrder.customerPhone})
                            </span>
                          </div>

                          <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
                            <span>
                              📄 {deletedOrder.files?.length || 0} ملفات ({deletedOrder.totalPages || 0} ص)
                            </span>
                            <span>•</span>
                            <span className="font-bold text-slate-700">
                              💰 {formatSDG(deletedOrder.totalAmount)}
                            </span>
                            <span>•</span>
                            <span className="text-rose-600 font-mono text-[11px]">
                              🗑️ حُذف في: {formattedDelDate}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                          <button
                            type="button"
                            onClick={() => handleRestoreOrderFromTrash(deletedOrder)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                            <span>استرجاع الطلب 🔄</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handlePermanentDeleteOrder(deletedOrder.id, deletedOrder.customerName)}
                            className="bg-rose-100 hover:bg-rose-200 text-rose-700 text-xs font-bold px-3 py-2 rounded-xl transition-all flex items-center gap-1 cursor-pointer"
                            title="حذف نهائي لا يمكن التراجع عنه"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>حذف نهائي ❌</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* UNIVERSITIES & ACADEMIC LEVELS MANAGEMENT TAB (إدارة الجامعات والكليات والمستويات والفصول الدراسية) */}
      {activeTab === 'universities' && (
        <div className="space-y-6">
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
            
            {/* Top Sub-Tabs Selector */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
              <div className="flex items-center gap-2 p-1 bg-slate-100/80 rounded-2xl border border-slate-200 flex-wrap">
                <button
                  type="button"
                  onClick={() => setUniSubSection('universities')}
                  className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center gap-2 cursor-pointer ${
                    uniSubSection === 'universities'
                      ? 'bg-emerald-900 text-amber-300 shadow-md ring-2 ring-emerald-700'
                      : 'text-slate-700 hover:bg-slate-200 hover:text-slate-900'
                  }`}
                >
                  <Building2 className="w-4 h-4" />
                  <span>🏛️ إدارة الجامعات والكليات ({universitiesList.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setUniSubSection('degree_tracks')}
                  className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center gap-2 cursor-pointer ${
                    uniSubSection === 'degree_tracks'
                      ? 'bg-emerald-900 text-amber-300 shadow-md ring-2 ring-emerald-700'
                      : 'text-slate-700 hover:bg-slate-200 hover:text-slate-900'
                  }`}
                >
                  <GraduationCap className="w-4 h-4" />
                  <span>🎓 إدارة الدرجات العلمية (بكالوريوس ودبلوم)</span>
                  <span className={`font-black text-[10px] px-2 py-0.5 rounded-full shadow-2xs ${
                    degreeTracksList.filter(t => t.active !== false).length === degreeTracksList.length
                      ? 'bg-emerald-400 text-slate-950'
                      : 'bg-amber-400 text-slate-950'
                  }`}>
                    {degreeTracksList.filter(t => t.active !== false).length} / {degreeTracksList.length} متاح
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setUniSubSection('levels_semesters')}
                  className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center gap-2 cursor-pointer ${
                    uniSubSection === 'levels_semesters'
                      ? 'bg-emerald-900 text-amber-300 shadow-md ring-2 ring-emerald-700'
                      : 'text-slate-700 hover:bg-slate-200 hover:text-slate-900'
                  }`}
                >
                  <Layers className="w-4 h-4" />
                  <span>📚 إدارة المستويات والفصول الدراسية (ON / OFF)</span>
                  <span className="bg-amber-400 text-slate-950 font-black text-[10px] px-2 py-0.5 rounded-full shadow-2xs">
                    {academicLevelsList.length} مستويات
                  </span>
                </button>
              </div>

              {uniSubSection === 'degree_tracks' && (
                <button
                  type="button"
                  onClick={handleResetDegreeTracksDefault}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-4 py-2.5 rounded-2xl text-xs inline-flex items-center gap-1.5 border border-slate-300 transition-all cursor-pointer"
                  title="استعادة الحالة الافتراضية للدرجات العلمية (بكالوريوس ودبلوم)"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>إعادة ضبط افتراضي للدرجات العلمية</span>
                </button>
              )}

              {uniSubSection === 'levels_semesters' && (
                <button
                  type="button"
                  onClick={handleResetAcademicLevelsDefault}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-4 py-2.5 rounded-2xl text-xs inline-flex items-center gap-1.5 border border-slate-300 transition-all cursor-pointer"
                  title="استعادة الحالة الافتراضية للمستويات والفصول الدراسية"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>إعادة ضبط افتراضي للمستويات والفصول</span>
                </button>
              )}
            </div>

            {/* SECTION 1: UNIVERSITIES & COLLEGES VIEW */}
            {uniSubSection === 'universities' && (
              <div className="space-y-6">
                {/* Header & Main Controls */}
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
                  <div>
                    <div className="flex items-center gap-2 text-emerald-700 font-bold text-xs mb-1">
                      <GraduationCap className="w-4 h-4 text-emerald-600" />
                      <span>إدارة هيكل الجامعات السودانية • Direct Library Synchronization</span>
                    </div>
                    <h3 className="text-2xl font-black text-slate-900 flex items-center gap-2">
                      <span>🏛️ إدارة الجامعات والكليات الأكاديمية</span>
                      <span className="text-xs font-mono bg-emerald-100 text-emerald-950 px-3 py-1 rounded-full border border-emerald-300 font-bold">
                        مربوطة تلقائياً مع المكتبة ⚡
                      </span>
                    </h3>
                    <p className="text-slate-600 text-xs sm:text-sm mt-1">
                      إضافة، تعديل، أو حذف الجامعات والكليات والأقسام وتحديد المستويات الدراسية والتحكم في إتاحتها للطلاب (ON / OFF).
                    </p>
                  </div>

                  <div className="flex items-center gap-2.5 flex-wrap">
                    <button
                      type="button"
                      onClick={() => handleOpenAddUniModal()}
                      className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-black px-5 py-2.5 rounded-2xl text-xs sm:text-sm inline-flex items-center gap-2 transition-all shadow-md cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
                    >
                      <Plus className="w-4 h-4" />
                      <span>إضافة جامعة / كلية جديدة</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleResetUniversitiesDefault}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-4 py-2.5 rounded-2xl text-xs inline-flex items-center gap-1.5 border border-slate-300 transition-all cursor-pointer"
                      title="استعادة القائمة الافتراضية للجامعات"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>إعادة ضبط افتراضي</span>
                    </button>
                  </div>
                </div>

                {/* Quick Summary Stats Bar */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 bg-emerald-50/60 p-4 rounded-2xl border border-emerald-200/80">
                  <div className="bg-white p-3.5 rounded-xl border border-emerald-200 flex items-center gap-3">
                    <div className="p-2.5 bg-emerald-100 text-emerald-900 rounded-xl">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-500 block">عدد الجامعات المسجلة</span>
                      <span className="text-xl font-black text-slate-900">{universitiesList.length} جامعة</span>
                    </div>
                  </div>

                  <div className="bg-white p-3.5 rounded-xl border border-emerald-200 flex items-center gap-3">
                    <div className="p-2.5 bg-amber-100 text-amber-900 rounded-xl">
                      <GraduationCap className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-500 block">إجمالي الكليات المعتمدة</span>
                      <span className="text-xl font-black text-slate-900">
                        {universitiesList.reduce((acc, u) => acc + (u.colleges?.length || 0), 0)} كلية
                      </span>
                    </div>
                  </div>

                  <div className="bg-white p-3.5 rounded-xl border border-emerald-200 flex items-center gap-3">
                    <div className="p-2.5 bg-blue-100 text-blue-900 rounded-xl">
                      <FolderTree className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-500 block">إجمالي الأقسام والتخصصات</span>
                      <span className="text-xl font-black text-slate-900">
                        {universitiesList.reduce((acc, u) => acc + u.colleges.reduce((cAcc, c) => cAcc + (c.departments?.length || 0), 0), 0)} قسم
                      </span>
                    </div>
                  </div>
                </div>

                {/* Universities Cards Grid */}
                <div className="space-y-6">
                  {universitiesList.map((uni) => {
                    const isUniActive = uni.active !== false;
                    return (
                      <div 
                        key={uni.id}
                        className={`border-2 rounded-2xl p-5 transition-all space-y-4 ${
                          isUniActive
                            ? 'bg-white border-slate-200 shadow-2xs hover:border-emerald-300'
                            : 'bg-slate-50/90 border-slate-300 opacity-60 shadow-none'
                        }`}
                      >
                        {/* University Header Row */}
                        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm shrink-0 border shadow-xs ${
                              isUniActive ? 'bg-emerald-900 text-amber-300 border-emerald-700' : 'bg-slate-700 text-slate-300 border-slate-600'
                            }`}>
                              <Building2 className="w-5 h-5" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="text-lg font-black text-slate-900">{uni.name}</h4>
                                <span className={`font-black text-[11px] px-2.5 py-0.5 rounded-full border ${
                                  isUniActive 
                                    ? 'bg-amber-100 text-amber-950 border-amber-300' 
                                    : 'bg-rose-100 text-rose-900 border-rose-300'
                                }`}>
                                  {isUniActive ? (uni.badge || 'متاحة الآن ✓') : 'غير متاح الان'}
                                </span>
                              </div>
                              <p className="text-xs text-slate-500 mt-0.5">{uni.description}</p>
                            </div>
                          </div>

                          {/* Uni Action Buttons & ON/OFF Slider Switch */}
                          <div className="flex items-center gap-3 flex-wrap">
                            
                            {/* ON / OFF Toggle Slider Button (زر سحاب اون/اوف) */}
                            <div className={`flex items-center gap-2.5 p-1.5 px-3 rounded-2xl border transition-colors ${
                              isUniActive 
                                ? 'bg-emerald-50 border-emerald-300 text-emerald-950' 
                                : 'bg-rose-50 border-rose-300 text-rose-950'
                            }`}>
                              <span className="text-xs font-black">
                                {isUniActive ? 'متاحة (ON)' : 'غير متاح الان (OFF)'}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleToggleUniversityActive(uni.id)}
                                className={`relative inline-flex h-6 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                                  isUniActive ? 'bg-emerald-600' : 'bg-slate-400'
                                }`}
                                title={isUniActive ? 'تعطيل الجامعة (جعله غير متاح)' : 'تفعيل الجامعة (جعله متاح للطلاب)'}
                              >
                                <span
                                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                                    isUniActive ? 'translate-x-0' : '-translate-x-6'
                                  }`}
                                />
                              </button>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleOpenAddUniModal(uni)}
                              className="bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 font-bold px-3 py-1.5 rounded-xl text-xs inline-flex items-center gap-1 transition-all cursor-pointer"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>إضافة كلية</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleOpenAddUniModal(uni, uni.colleges[0])}
                              className="bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 font-bold px-3 py-1.5 rounded-xl text-xs inline-flex items-center gap-1 transition-all cursor-pointer"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              <span>تعديل</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDeleteUniversity(uni.id, uni.name)}
                              className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold px-3 py-1.5 rounded-xl text-xs inline-flex items-center gap-1 transition-all cursor-pointer"
                              title="حذف الجامعة"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>حذف</span>
                            </button>
                          </div>
                        </div>

                      {/* Colleges inside this university */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1">
                        {uni.colleges.map((col) => {
                          const isColActive = col.active !== false && isUniActive;
                          return (
                            <div 
                              key={col.id} 
                              className={`border rounded-xl p-3.5 flex flex-col justify-between space-y-3 transition-all ${
                                isColActive
                                  ? 'bg-slate-50/80 border-slate-200'
                                  : 'bg-slate-100/90 border-slate-300 opacity-65'
                              }`}
                            >
                              <div>
                                <div className="flex items-start justify-between gap-2 mb-1.5">
                                  <h5 className="text-sm font-black text-slate-900 flex items-center gap-1.5">
                                    <GraduationCap className="w-4 h-4 text-emerald-600 shrink-0" />
                                    <span>{col.name}</span>
                                  </h5>
                                  <div className="flex items-center gap-1 shrink-0 flex-wrap">
                                    {col.degreeType === 'diploma' && (
                                      <span className="bg-purple-100 text-purple-900 border border-purple-300 font-black text-[10px] px-2 py-0.5 rounded-full">
                                        📜 دبلوم
                                      </span>
                                    )}
                                    {col.degreeType === 'both' && (
                                      <span className="bg-amber-100 text-amber-900 border border-amber-300 font-black text-[10px] px-2 py-0.5 rounded-full">
                                        🎓📜 بكالوريوس + دبلوم
                                      </span>
                                    )}
                                    {(col.degreeType === 'bachelor' || !col.degreeType) && (
                                      <span className="bg-blue-100 text-blue-900 border border-blue-300 font-black text-[10px] px-2 py-0.5 rounded-full">
                                        🎓 بكالوريوس
                                      </span>
                                    )}
                                    <span className="bg-emerald-100 text-emerald-950 font-bold text-[10px] px-2 py-0.5 rounded-full">
                                      {col.levelsCount || 4} مستويات
                                    </span>
                                    <span className={`font-black text-[10px] px-2 py-0.5 rounded-full border ${
                                      isColActive
                                        ? 'bg-emerald-100 text-emerald-950 border-emerald-300'
                                        : 'bg-rose-100 text-rose-900 border-rose-300'
                                    }`}>
                                      {isColActive ? 'متاحة ✓' : 'غير متاح الان'}
                                    </span>
                                  </div>
                                </div>
                                {col.description && (
                                  <p className="text-xs text-slate-600 line-clamp-2 mb-2">{col.description}</p>
                                )}

                                {/* Departments Tags */}
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {col.departments.map((dept, dIdx) => (
                                    <span 
                                      key={dIdx} 
                                      className="bg-white text-slate-800 text-[11px] font-bold px-2 py-0.5 rounded-lg border border-slate-200"
                                    >
                                      {dept.name}
                                    </span>
                                  ))}
                                </div>
                              </div>

                              {/* College Action Bar with ON/OFF Toggle Slider */}
                              <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 text-xs">
                                <span className="text-slate-500 font-bold text-[11px]">
                                  {col.departments.length} أقسام تخصصية
                                </span>

                                <div className="flex items-center gap-2">
                                  {/* ON / OFF Toggle Slider Button */}
                                  <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl border transition-colors ${
                                    isColActive
                                      ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                                      : 'bg-rose-50 border-rose-300 text-rose-950'
                                  }`}>
                                    <span className="text-[10px] font-black">
                                      {isColActive ? 'متاحة (ON)' : 'غير متاح (OFF)'}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => handleToggleCollegeActive(uni.id, col.id, col.name)}
                                      className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                        isColActive ? 'bg-emerald-600' : 'bg-slate-400'
                                      }`}
                                      title={isColActive ? 'تعطيل الكلية (إيقاف)' : 'تفعيل الكلية (تشغيل)'}
                                    >
                                      <span
                                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs transition duration-200 ease-in-out ${
                                          isColActive ? 'translate-x-0' : '-translate-x-5'
                                        }`}
                                      />
                                    </button>
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() => handleOpenAddUniModal(uni, col)}
                                    className="text-amber-800 hover:text-amber-950 hover:bg-amber-100/70 p-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1 text-[11px]"
                                  >
                                    <Edit3 className="w-3.5 h-3.5 text-amber-700" />
                                    <span>تعديل</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => handleDeleteCollege(uni.id, col.id, col.name)}
                                    className="text-rose-600 hover:text-rose-800 hover:bg-rose-100/70 p-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1 text-[11px]"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    <span>حذف</span>
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* SECTION 2: ACADEMIC LEVELS & SEMESTERS ON/OFF MANAGEMENT VIEW */}
          {uniSubSection === 'levels_semesters' && (
            <div className="space-y-6">
              {/* Header & Explanations */}
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                  <div className="flex items-center gap-2 text-emerald-700 font-bold text-xs mb-1">
                    <Layers className="w-4 h-4 text-emerald-600" />
                    <span>التحكم المركزي في الفصول والمستويات الدراسية • Academic Levels & Semesters Control</span>
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 flex items-center gap-2">
                    <span>📚 إدارة المستويات والفصول الدراسية (ON / OFF)</span>
                    <span className="text-xs font-mono bg-emerald-100 text-emerald-950 px-3 py-1 rounded-full border border-emerald-300 font-bold">
                      مربوطة مباشرة بالمكتبة ⚡
                    </span>
                  </h3>
                  <p className="text-slate-600 text-xs sm:text-sm mt-1">
                    يمكنك تشغيل (ON) أو إيقاف (OFF) المستويات الدراسية بالكامل أو الفصول الدراسية الفرعية. عند إيقاف أي مستوى أو فصل لن يتمكن الطلاب من الدخول إليه في المكتبة وتظهر لهم رسالة إشعار إداري.
                  </p>
                </div>
              </div>

              {/* Quick Summary Stats Bar */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 bg-emerald-50/60 p-4 rounded-2xl border border-emerald-200/80">
                <div className="bg-white p-3.5 rounded-xl border border-emerald-200 flex items-center gap-3">
                  <div className="p-2.5 bg-emerald-100 text-emerald-900 rounded-xl">
                    <Layers className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-500 block">إجمالي المستويات الأكاديمية</span>
                    <span className="text-xl font-black text-slate-900">
                      {academicLevelsList.length} مستويات (المتاح: {academicLevelsList.filter(l => l.active !== false).length})
                    </span>
                  </div>
                </div>

                <div className="bg-white p-3.5 rounded-xl border border-emerald-200 flex items-center gap-3">
                  <div className="p-2.5 bg-amber-100 text-amber-900 rounded-xl">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-500 block">إجمالي الفصول الدراسية</span>
                    <span className="text-xl font-black text-slate-900">
                      {academicLevelsList.reduce((acc, l) => acc + l.semesters.length, 0)} فصول (المتاح: {academicLevelsList.reduce((acc, l) => acc + l.semesters.filter(s => s.active !== false && l.active !== false).length, 0)})
                    </span>
                  </div>
                </div>

                <div className="bg-white p-3.5 rounded-xl border border-emerald-200 flex items-center gap-3">
                  <div className="p-2.5 bg-blue-100 text-blue-900 rounded-xl">
                    <RefreshCw className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-500 block">سرعة التحديث والمزامنة</span>
                    <span className="text-sm font-black text-emerald-700">تطبيق فوري لجميع الطلاب ⚡</span>
                  </div>
                </div>
              </div>

              {/* Levels & Semesters List */}
              <div className="space-y-6">
                {academicLevelsList.map((lvl) => {
                  const isLvlActive = lvl.active !== false;
                  return (
                    <div 
                      key={lvl.levelNum}
                      className={`border-2 rounded-2xl p-5 sm:p-6 transition-all space-y-4 ${
                        isLvlActive
                          ? 'bg-white border-slate-200 shadow-2xs hover:border-emerald-300'
                          : 'bg-slate-50/90 border-rose-200 opacity-80 shadow-none'
                      }`}
                    >
                      {/* Level Master Header Row */}
                      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-200">
                        <div className="flex items-center gap-3">
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-base shrink-0 border shadow-xs ${
                            isLvlActive ? 'bg-emerald-900 text-amber-300 border-emerald-700' : 'bg-slate-700 text-slate-300 border-slate-600'
                          }`}>
                            <BookOpen className="w-6 h-6" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="text-lg sm:text-xl font-black text-slate-900">{lvl.title}</h4>
                              <span className="bg-slate-100 text-slate-700 font-bold text-xs px-2.5 py-0.5 rounded-full border border-slate-300">
                                {lvl.yearLabel}
                              </span>
                              <span className={`font-black text-xs px-3 py-0.5 rounded-full border ${
                                isLvlActive 
                                  ? 'bg-emerald-100 text-emerald-950 border-emerald-300' 
                                  : 'bg-rose-100 text-rose-900 border-rose-300'
                              }`}>
                                {isLvlActive ? 'المستوى متاح للطلاب ✓' : 'المستوى موقوف بالكامل 🚫'}
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 mt-1">{lvl.description}</p>
                          </div>
                        </div>

                        {/* Master Level ON/OFF Slider Button */}
                        <div className={`flex items-center gap-3 p-2 px-4 rounded-2xl border transition-colors shadow-2xs ${
                          isLvlActive 
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-950' 
                            : 'bg-rose-50 border-rose-300 text-rose-950'
                        }`}>
                          <div className="text-right">
                            <span className="text-xs font-black block">
                              {isLvlActive ? 'المستوى متاح للطلاب (ON 🟢)' : 'المستوى موقوف للطلاب (OFF 🔴)'}
                            </span>
                            <span className="text-[10px] text-slate-500">
                              {isLvlActive ? 'الطلاب يمكنهم الدخول' : 'يتم حجب المستوى بالكامل'}
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleToggleLevelActive(lvl.levelNum)}
                            className={`relative inline-flex h-7 w-14 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                              isLvlActive ? 'bg-emerald-600' : 'bg-slate-400'
                            }`}
                            title={isLvlActive ? 'تعطيل المستوى بالكامل' : 'تفعيل المستوى بالكامل'}
                          >
                            <span
                              className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                                isLvlActive ? 'translate-x-0' : '-translate-x-7'
                              }`}
                            />
                          </button>
                        </div>
                      </div>

                      {/* Inactive Level Notice Warning */}
                      {!isLvlActive && (
                        <div className="bg-rose-50 border border-rose-200 p-3 rounded-xl flex items-center gap-2 text-rose-900 text-xs font-bold">
                          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                          <span>تنبيه: المستوى مغلق بالكامل حالياً. يتم حجب جميع الفصول الدراسية التابعة له ومنع الطلاب من فتحها تلقائياً.</span>
                        </div>
                      )}

                      {/* Semesters inside this Level */}
                      <div className="space-y-2 pt-1">
                        <div className="flex items-center justify-between text-xs text-slate-500 font-bold px-1">
                          <span>الفصول الدراسية التابعة للمستوى ({lvl.semesters.length} فصول):</span>
                          <span>التحكم المنفصل لكل فصل دراسي ON / OFF</span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                          {lvl.semesters.map((sem) => {
                            const isSemActive = sem.active !== false && isLvlActive;
                            const isSemSelfActive = sem.active !== false;
                            return (
                              <div
                                key={sem.id}
                                className={`border rounded-xl p-4 flex flex-col justify-between space-y-3 transition-all ${
                                  isSemActive
                                    ? 'bg-slate-50/90 border-slate-200 shadow-2xs hover:border-emerald-300'
                                    : 'bg-slate-100/90 border-slate-300 opacity-75'
                                }`}
                              >
                                <div className="space-y-1.5">
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="flex items-center gap-2">
                                      <span className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-900 font-black text-xs flex items-center justify-center shrink-0">
                                        {sem.id}
                                      </span>
                                      <h5 className="text-sm font-black text-slate-900">{sem.title}</h5>
                                    </div>

                                    <span className={`font-black text-[10px] px-2.5 py-0.5 rounded-full border ${
                                      isSemActive
                                        ? 'bg-emerald-100 text-emerald-950 border-emerald-300'
                                        : 'bg-rose-100 text-rose-900 border-rose-300'
                                    }`}>
                                      {isSemActive ? 'الفصل متاح ✓' : !isLvlActive ? 'مغلق (المستوى معطل)' : 'الفصل مغلق 🚫'}
                                    </span>
                                  </div>

                                  <p className="text-xs text-slate-600 line-clamp-2 pr-8">{sem.desc || sem.title}</p>
                                </div>

                                {/* Semester Action Bar & ON/OFF Slider Switch */}
                                <div className="flex items-center justify-between pt-2.5 border-t border-slate-200/70 text-xs">
                                  <span className="text-[11px] font-bold text-slate-500">
                                    {sem.label || sem.title}
                                  </span>

                                  {/* ON / OFF Toggle Slider Button */}
                                  <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-colors ${
                                    isSemSelfActive && isLvlActive
                                      ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                                      : 'bg-rose-50 border-rose-300 text-rose-950'
                                  }`}>
                                    <span className="text-[11px] font-black">
                                      {isSemSelfActive ? 'متاح (ON)' : 'مغلق (OFF)'}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => handleToggleSemesterActive(lvl.levelNum, sem.id, sem.title)}
                                      className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                        isSemSelfActive ? 'bg-emerald-600' : 'bg-slate-400'
                                      }`}
                                      title={isSemSelfActive ? `تعطيل (${sem.title})` : `تفعيل (${sem.title})`}
                                    >
                                      <span
                                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs transition duration-200 ease-in-out ${
                                          isSemSelfActive ? 'translate-x-0' : '-translate-x-5'
                                        }`}
                                      />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* SECTION 2: DEGREE TRACKS MANAGEMENT VIEW (إدارة الدرجات العلمية: بكالوريوس ودبلوم) */}
          {uniSubSection === 'degree_tracks' && (
            <div className="space-y-6">
              {/* Header */}
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                  <div className="flex items-center gap-2 text-emerald-700 font-bold text-xs mb-1">
                    <GraduationCap className="w-4 h-4 text-emerald-600" />
                    <span>التحكم في الدرجات العلمية • Direct Student Library Gatekeeper</span>
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 flex items-center gap-2">
                    <span>🎓 إدارة مسارات الدرجات العلمية (بكالوريوس ودبلوم)</span>
                    <span className="text-xs font-mono bg-emerald-100 text-emerald-950 px-3 py-1 rounded-full border border-emerald-300 font-bold">
                      أون / أوف فوري للطلاب ⚡
                    </span>
                  </h3>
                  <p className="text-slate-600 text-xs sm:text-sm mt-1">
                    تحكم فوري في إتاحة أو إيقاف مساري <strong>البكالوريوس</strong> و<strong>الدبلوم</strong> لجميع الطلاب (ON / OFF). عند إيقاف أي مسار لن يتمكن الطالب من الدخول إليه من الواجهة والمكتبة.
                  </p>
                </div>

                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={handleResetDegreeTracksDefault}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-4 py-2.5 rounded-2xl text-xs inline-flex items-center gap-1.5 border border-slate-300 transition-all cursor-pointer shadow-xs"
                    title="استعادة الحالة الافتراضية للدرجات العلمية"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>إعادة ضبط افتراضي</span>
                  </button>
                </div>
              </div>

              {/* Quick Info & Notice Banner */}
              <div className="bg-amber-50/80 border border-amber-200 p-4 rounded-2xl flex items-start gap-3">
                <div className="p-2 bg-amber-200/80 text-amber-900 rounded-xl shrink-0 mt-0.5">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div className="space-y-1 text-xs text-amber-900">
                  <span className="font-black text-sm block">💡 آلية عمل أزرار (ON / OFF) للدرجات العلمية:</span>
                  <p className="leading-relaxed">
                    • <strong>مسار البكالوريوس (Bachelor)</strong>: يشمل المستويات من 1 إلى 5 والفصول من 1 إلى 10. عند تشغيله (ON) يدخل الطالب للمستويات بكامل فصولها، وعند إيقافه (OFF) يُقفل المسار تماماً في وجه الطلاب.
                  </p>
                  <p className="leading-relaxed">
                    • <strong>مسار الدبلوم (Diploma)</strong>: يشمل المستويين 1 و 2 والفصول من 1 إلى 4 للكليات التي تدعم الدبلوم التقني والوسيط. عند تشغيله (ON) يدخل الطالب، وعند إيقافه (OFF) يُقفل فوراً.
                  </p>
                </div>
              </div>

              {/* Degree Tracks Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {degreeTracksList.map(track => {
                  const isBachelor = track.id === 'bachelor';
                  const isTrackActive = track.active !== false;

                  // Find colleges offering this track
                  const offeringColleges = universitiesList.flatMap(u => 
                    u.colleges.filter(c => {
                      if (isBachelor) return !c.degreeType || c.degreeType === 'bachelor' || c.degreeType === 'both';
                      return c.degreeType === 'diploma' || c.degreeType === 'both';
                    }).map(c => ({ uniName: u.shortName || u.name, collegeName: c.name }))
                  );

                  return (
                    <div
                      key={track.id}
                      className={`rounded-3xl border transition-all shadow-md overflow-hidden flex flex-col justify-between ${
                        isTrackActive
                          ? 'bg-white border-emerald-300 shadow-emerald-900/5 ring-1 ring-emerald-500/20'
                          : 'bg-slate-50 border-rose-300 shadow-rose-900/5 ring-1 ring-rose-500/20 opacity-95'
                      }`}
                    >
                      {/* Top Header & Toggle */}
                      <div className={`p-6 border-b transition-colors ${
                        isTrackActive ? 'bg-emerald-950 text-white' : 'bg-slate-900 text-slate-200'
                      }`}>
                        <div className="flex items-start justify-between gap-4">
                          <div className="space-y-1.5 flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-2xl">{isBachelor ? '🎓' : '📜'}</span>
                              <h4 className="text-xl font-black text-amber-300">{track.name}</h4>
                              <span className="text-xs font-mono text-slate-300">({track.id === 'bachelor' ? 'Bachelor' : 'Diploma'})</span>
                            </div>
                            <p className="text-xs text-slate-300 leading-relaxed line-clamp-2">
                              {track.description}
                            </p>
                          </div>

                          {/* Big Master ON / OFF Toggle Switch */}
                          <div className="flex flex-col items-center gap-1.5 shrink-0">
                            <span className={`text-xs font-black px-2.5 py-0.5 rounded-full ${
                              isTrackActive
                                ? 'bg-emerald-400 text-slate-950 shadow-xs animate-pulse'
                                : 'bg-rose-500 text-white'
                            }`}>
                              {isTrackActive ? 'متاح للطلاب ON 🟢' : 'مغلق OFF 🔴'}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleToggleDegreeTrack(track.id)}
                              className={`relative inline-flex h-8 w-16 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none shadow-inner ${
                                isTrackActive ? 'bg-emerald-500 hover:bg-emerald-400' : 'bg-rose-600 hover:bg-rose-500'
                              }`}
                              title={isTrackActive ? `إيقاف مسار (${track.name}) ومنع الطلاب` : `تفعيل مسار (${track.name}) وإتاحته للطلاب`}
                            >
                              <span
                                className={`pointer-events-none inline-block h-7 w-7 transform rounded-full bg-white shadow-md transition duration-200 ease-in-out mt-0.5 ${
                                  isTrackActive ? 'translate-x-1' : '-translate-x-8'
                                }`}
                              />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Card Body Details */}
                      <div className="p-6 space-y-5 flex-1 flex flex-col justify-between">
                        <div className="space-y-4">
                          {/* Scope & Levels Badges */}
                          <div className="grid grid-cols-2 gap-3">
                            <div className="bg-slate-100 p-3 rounded-2xl border border-slate-200 text-center">
                              <span className="text-[11px] font-bold text-slate-500 block">نطاق المستويات</span>
                              <span className="text-sm font-black text-slate-900">
                                {isBachelor ? '5 مستويات (المستوى 1 إلى 5)' : 'مستويان (المستوى 1 و 2)'}
                              </span>
                            </div>

                            <div className="bg-slate-100 p-3 rounded-2xl border border-slate-200 text-center">
                              <span className="text-[11px] font-bold text-slate-500 block">إجمالي الفصول</span>
                              <span className="text-sm font-black text-slate-900">
                                {isBachelor ? '10 فصول دراسية' : '4 فصول دراسية'}
                              </span>
                            </div>
                          </div>

                          {/* Live Student Status Indicator Box */}
                          <div className={`p-3.5 rounded-2xl border flex items-center gap-3 ${
                            isTrackActive
                              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                              : 'bg-rose-50 border-rose-200 text-rose-900'
                          }`}>
                            <div className={`w-3 h-3 rounded-full shrink-0 ${
                              isTrackActive ? 'bg-emerald-500 shadow-xs' : 'bg-rose-500'
                            }`} />
                            <div className="text-xs leading-relaxed">
                              <span className="font-black block">
                                {isTrackActive ? '✓ حالة الطالب الحالية: مفتوح ومتاح' : '✕ حالة الطالب الحالية: محظور ومغلق'}
                              </span>
                              <span className="text-[11px] opacity-80">
                                {isTrackActive
                                  ? 'يمكن للطالب اختيار هذا المسار والتنقل بين المستويات والفصول وطباعة الشيتات.'
                                  : 'تم إيقاف الدخول للمسار. عند محاولة الطالب النقر عليه تظهر رسالة تفيد بأنه غير متاح من الإدارة.'}
                              </span>
                            </div>
                          </div>

                          {/* Connected Colleges Preview */}
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-xs text-slate-600">
                              <span className="font-bold flex items-center gap-1">
                                <Building2 className="w-3.5 h-3.5 text-emerald-600" />
                                <span>الكليات التي تقدم هذا المسار:</span>
                              </span>
                              <span className="font-bold font-mono bg-slate-200 px-2 py-0.5 rounded-full text-[11px]">
                                {offeringColleges.length} كلية
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-2 bg-slate-50 rounded-xl border border-slate-200 text-[11px]">
                              {offeringColleges.slice(0, 8).map((c, idx) => (
                                <span key={idx} className="bg-white px-2 py-1 rounded-lg border border-slate-200 text-slate-700 font-medium">
                                  {c.collegeName}
                                </span>
                              ))}
                              {offeringColleges.length > 8 && (
                                <span className="bg-amber-100 text-amber-900 font-bold px-2 py-1 rounded-lg">
                                  +{offeringColleges.length - 8} كليات أخرى
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Bottom Action Bar */}
                        <div className="pt-4 border-t border-slate-200 flex items-center justify-between gap-3">
                          <span className="text-xs text-slate-500 font-mono">ID: {track.id}</span>
                          <button
                            type="button"
                            onClick={() => handleToggleDegreeTrack(track.id)}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                              isTrackActive
                                ? 'bg-rose-100 hover:bg-rose-200 text-rose-700 border border-rose-300'
                                : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm'
                            }`}
                          >
                            <Power className="w-3.5 h-3.5" />
                            <span>{isTrackActive ? 'إيقاف هذا المسار (OFF)' : 'تفعيل هذا المسار (ON)'}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          </div>
        </div>
      )}

      {/* ANALYTICS & VISITORS DASHBOARD TAB */}
      {activeTab === 'analytics' && (
        <AnalyticsDashboardView
          orders={orders}
          sheets={sheets}
          onRefresh={onRefreshOrders}
        />
      )}

      {/* DELIVERY MANAGEMENT TAB */}
      {activeTab === 'delivery' && (
        <DeliveryManagementView
          deliveryZones={deliveryZones}
          onUpdateZones={(newZones) => {
            setDeliveryZones(newZones);
            saveStoredDeliveryZones(newZones);
            triggerToast('تم تحديث وحفظ بيانات وأسعار مناطق التوصيل بنجاح 🚚');
          }}
          onResetZones={() => {
            const defaults = DEFAULT_ENRICHED_DELIVERY_ZONES;
            setDeliveryZones(defaults);
            saveStoredDeliveryZones(defaults);
            triggerToast('تمت استعادة القائمة الافتراضية الشاملة لمناطق التوصيل');
          }}
        />
      )}

      {/* MODAL DIALOG: ADD/EDIT UNIVERSITY & COLLEGE */}
      {showUniModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 flex items-center justify-center p-4 backdrop-blur-sm overflow-y-auto dir-rtl text-right">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-5 my-8" onClick={e => e.stopPropagation()}>
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 bg-amber-400 text-slate-950 rounded-2xl flex items-center justify-center font-black">
                  <GraduationCap className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">
                    {editingUniId ? 'تعديل بيانات الجامعة والكلية' : 'إضافة جامعة جديدة / كلية جديدة'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    سيتم ربط المخرجات تلقائياً بمكتبة الشيتات في أرجاء الموقع
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowUniModal(false)}
                className="p-2 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveUniversitySubmit} className="space-y-4 text-xs sm:text-sm">
              
              {/* SECTION 1: UNIVERSITY DETAILS */}
              <div className="bg-emerald-50/60 p-4 rounded-2xl border border-emerald-200 space-y-3">
                <h4 className="font-black text-emerald-900 flex items-center gap-1.5 text-xs">
                  <Building2 className="w-4 h-4 text-emerald-600" />
                  <span>1. بيانات الجامعة الأساسية (University)</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">اسم الجامعة *</label>
                    <input
                      type="text"
                      required
                      value={uniFormName}
                      onChange={e => setUniFormName(e.target.value)}
                      placeholder="مثال: جامعة الخرطوم، جامعة الجزيرة..."
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-amber-400 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">الاسم المختصر</label>
                    <input
                      type="text"
                      value={uniFormShortName}
                      onChange={e => setUniFormShortName(e.target.value)}
                      placeholder="مثال: الخرطوم، الجزيرة..."
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-amber-400 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">الوصف المختصر للجامعة</label>
                    <input
                      type="text"
                      value={uniFormDesc}
                      onChange={e => setUniFormDesc(e.target.value)}
                      placeholder="كليات: الهندسة، الحاسوب، العلوم..."
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 focus:ring-2 focus:ring-amber-400 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">شارة الجامعة (Badge)</label>
                    <input
                      type="text"
                      value={uniFormBadge}
                      onChange={e => setUniFormBadge(e.target.value)}
                      placeholder="مثال: متاحة الآن ✓"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 focus:ring-2 focus:ring-amber-400 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 2: COLLEGE DETAILS */}
              <div className="bg-amber-50/50 p-4 rounded-2xl border border-amber-200 space-y-3">
                <h4 className="font-black text-amber-950 flex items-center gap-1.5 text-xs">
                  <GraduationCap className="w-4 h-4 text-amber-600" />
                  <span>2. بيانات الكلية والدرجة الأكاديمية (College)</span>
                </h4>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">اسم الكلية</label>
                  <input
                    type="text"
                    value={collegeFormName}
                    onChange={e => setCollegeFormName(e.target.value)}
                    placeholder="مثال: كلية علوم الحاسوب وتقانة المعلومات، كلية الهندسة..."
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-amber-400 focus:outline-none"
                  />
                </div>

                {/* DEGREE TYPE PICKER (تحديد دبلوم أو بكالوريوس) */}
                <div>
                  <label className="block text-slate-700 font-bold mb-1.5">الدرجة العلمية / نوع التخصص *</label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setCollegeFormDegreeType('bachelor');
                        if (collegeFormLevels === 3) setCollegeFormLevels(4);
                      }}
                      className={`py-2 px-2.5 rounded-xl border text-xs font-black transition-all flex flex-col items-center justify-center gap-1 cursor-pointer ${
                        collegeFormDegreeType === 'bachelor'
                          ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm ring-2 ring-emerald-300'
                          : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <span className="text-sm">🎓</span>
                      <span>بكالوريوس</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setCollegeFormDegreeType('diploma');
                        setCollegeFormLevels(3);
                      }}
                      className={`py-2 px-2.5 rounded-xl border text-xs font-black transition-all flex flex-col items-center justify-center gap-1 cursor-pointer ${
                        collegeFormDegreeType === 'diploma'
                          ? 'bg-purple-600 text-white border-purple-700 shadow-sm ring-2 ring-purple-300'
                          : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <span className="text-sm">📜</span>
                      <span>دبلوم تقني</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setCollegeFormDegreeType('both');
                      }}
                      className={`py-2 px-2.5 rounded-xl border text-xs font-black transition-all flex flex-col items-center justify-center gap-1 cursor-pointer ${
                        collegeFormDegreeType === 'both'
                          ? 'bg-amber-500 text-slate-950 border-amber-600 shadow-sm ring-2 ring-amber-300'
                          : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <span className="text-sm">🎓📜</span>
                      <span>بكالوريوس + دبلوم</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">عدد المستويات الدراسية (Levels)</label>
                    <select
                      value={collegeFormLevels}
                      onChange={e => setCollegeFormLevels(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-black text-slate-900 focus:ring-2 focus:ring-amber-400 focus:outline-none"
                    >
                      <option value={3}>3 مستويات (دبلوم - 6 سمسترات)</option>
                      <option value={4}>4 مستويات (بكالوريوس - 8 سمسترات)</option>
                      <option value={5}>5 مستويات (بكالوريوس شرف / هندسة - 10 سمسترات)</option>
                      <option value={6}>6 مستويات (طب وبشري - 12 سمستر)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">عدد الفصول (السمسترات)</label>
                    <div className="px-3 py-2 bg-slate-100 rounded-xl font-black text-emerald-800 border border-slate-300 text-center">
                      {collegeFormLevels * 2} فصول دراسية (سمستر)
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION 3: DEPARTMENT DETAILS */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                <h4 className="font-black text-slate-900 flex items-center gap-1.5 text-xs">
                  <FolderTree className="w-4 h-4 text-emerald-600" />
                  <span>3. القسم الأكاديمي أو التخصص (Department)</span>
                </h4>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">اسم القسم / التخصص</label>
                  <input
                    type="text"
                    value={deptFormName}
                    onChange={e => setDeptFormName(e.target.value)}
                    placeholder="مثال: قسم علوم الحاسوب، قسم هندسة البرمجيات، قسم المحاسبة..."
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-amber-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">وصف القسم أو التخصص</label>
                  <input
                    type="text"
                    value={deptFormDesc}
                    onChange={e => setDeptFormDesc(e.target.value)}
                    placeholder="وصف المقررات والتشعيب..."
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 focus:ring-2 focus:ring-amber-400 focus:outline-none"
                  />
                </div>
              </div>

              {/* SUBMIT BUTTONS */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowUniModal(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  إلغاء
                </button>

                <button
                  type="submit"
                  className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-black px-7 py-2.5 rounded-xl transition-all shadow-md cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
                >
                  حفظ الجامعة وربطها بالمكتبة 💾
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* Proof Image Viewer Modal */}
      {selectedProofImage && (
        <div 
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={() => setSelectedProofImage(null)}
        >
          <div className="relative max-w-2xl w-full bg-white rounded-2xl overflow-hidden p-3 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center pb-2 border-b border-slate-200 mb-2">
              <h4 className="font-bold text-slate-900 text-sm">صورة إشعار التحويل المرفقة من العميل</h4>
              <button 
                onClick={() => setSelectedProofImage(null)}
                className="p-1 rounded-full hover:bg-slate-100 text-slate-500 hover:text-slate-900"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <img 
              src={selectedProofImage} 
              alt="إشعار التحويل الكامل" 
              className="w-full h-auto max-h-[80vh] object-contain rounded-xl bg-slate-50"
            />
          </div>
        </div>
      )}

      {/* Quick Concise Orders & Customers Modal */}
      {showQuickOrdersModal && (
        <div 
          className="fixed inset-0 z-50 bg-slate-950/80 flex items-center justify-center p-3 sm:p-6 backdrop-blur-md overflow-y-auto"
          onClick={() => setShowQuickOrdersModal(false)}
        >
          <div 
            className="relative w-full max-w-5xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95 duration-150"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="bg-slate-900 text-white p-5 sm:p-6 flex items-center justify-between gap-4 border-b border-slate-800 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-400 text-amber-950 flex items-center justify-center font-black text-xl shadow-md shrink-0">
                  📋
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-lg sm:text-xl font-black text-white">كشف كافة الطلبيات وإدارة العملاء</h3>
                    <span className="text-xs font-mono font-bold bg-amber-400 text-amber-950 px-2.5 py-0.5 rounded-full">
                      {orders.length} طلب
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-0.5">
                    إدارة فورية لحالة الطلبات والتحصيل مع إمكانية طباعة الكشف أو تنزيله كملف Excel CSV.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowQuickOrdersModal(false)}
                className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl transition-colors cursor-pointer shrink-0"
                title="إغلاق النافذة"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Search & Filter Toolbar */}
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
              <div className="relative flex-1 min-w-[220px]">
                <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={quickSearchTerm}
                  onChange={e => setQuickSearchTerm(e.target.value)}
                  placeholder="بحث سريع باسم العميل أو رقم الطلب..."
                  className="w-full pl-3 pr-10 py-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                {quickSearchTerm && (
                  <button
                    type="button"
                    onClick={() => setQuickSearchTerm('')}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={handleExportQuickOrdersExcel}
                  className="px-3.5 py-2.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-sm border border-emerald-500 hover:scale-[1.02] active:scale-[0.98]"
                  title="تنزيل الكشف منسق بجدول ملون وعنوان وهيدر جاهز لإكسل"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-200" />
                  <span>تنزيل Excel منسق (.xls) 📊</span>
                </button>

                <button
                  type="button"
                  onClick={handleExportQuickOrdersCSV}
                  className="px-3 py-2.5 bg-white hover:bg-slate-100 text-slate-800 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-sm border border-slate-300"
                  title="تنزيل الكشف كملف CSV"
                >
                  <FileText className="w-3.5 h-3.5 text-slate-600" />
                  <span>ملف CSV 📄</span>
                </button>

                <button
                  type="button"
                  onClick={handlePrintQuickOrders}
                  className="px-3.5 py-2.5 bg-slate-900 hover:bg-slate-800 text-amber-300 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-sm border border-slate-700 hover:scale-[1.02] active:scale-[0.98]"
                  title="طباعة كشف الطلبيات والعملاء"
                >
                  <Printer className="w-4 h-4 text-amber-400" />
                  <span>طباعة الكشف 🖨️</span>
                </button>
              </div>
            </div>

            {/* Modal Content - Simplified Table */}
            <div className="p-4 overflow-y-auto flex-1">
              {(() => {
                const filtered = orders.filter(ord => {
                  if (!quickSearchTerm.trim()) return true;
                  const q = quickSearchTerm.toLowerCase();
                  return (
                    ord.id.toLowerCase().includes(q) ||
                    ord.customerName.toLowerCase().includes(q)
                  );
                });

                if (filtered.length === 0) {
                  return (
                    <div className="text-center py-12 text-slate-500 space-y-2">
                      <AlertCircle className="w-8 h-8 text-slate-400 mx-auto" />
                      <p className="font-bold text-sm">لم يتم العثور على أية طلبات تطابق البحث!</p>
                      <button
                        type="button"
                        onClick={() => setQuickSearchTerm('')}
                        className="text-xs text-amber-600 underline font-bold"
                      >
                        إعادة ضبط البحث
                      </button>
                    </div>
                  );
                }

                return (
                  <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-sm">
                    <table className="w-full text-right border-collapse">
                      <thead>
                        <tr className="bg-slate-100 text-slate-800 text-xs font-black border-b border-slate-200">
                          <th className="p-3">رقم الطلب</th>
                          <th className="p-3">اسم العميل</th>
                          <th className="p-3">المبلغ والملفات</th>
                          <th className="p-3">الدفع والاعتماد</th>
                          <th className="p-3">إدارة حالة الطلب</th>
                          <th className="p-3 text-center">إجراءات</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-800">
                        {filtered.map(ord => {
                          const statusInfo = getStatusBadgeInfo(ord.status);

                          return (
                            <tr key={ord.id} className="hover:bg-slate-50/80 transition-colors">
                              {/* Order ID */}
                              <td className="p-3 font-mono font-black text-amber-950 text-xs whitespace-nowrap">
                                <span className="bg-amber-100 px-2 py-0.5 rounded border border-amber-300">
                                  #{ord.id}
                                </span>
                              </td>

                              {/* Customer Name */}
                              <td className="p-3 font-black text-slate-900 text-xs sm:text-sm">
                                {ord.customerName}
                              </td>

                              {/* Amount & Files */}
                              <td className="p-3 whitespace-nowrap">
                                <div className="font-black text-emerald-800 font-mono text-xs sm:text-sm">
                                  {formatSDG(ord.totalAmount)}
                                </div>
                                <div className="text-[11px] text-slate-500 font-mono">
                                  ({ord.files ? ord.files.length : 0} ملف - {ord.totalPages || 0} ص)
                                </div>
                              </td>

                              {/* Payment Method & Payment Status Toggle */}
                              <td className="p-3 whitespace-nowrap">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-[11px] text-slate-700">
                                    {ord.paymentMethod === 'bankak' ? '💳 بنكك' : ord.paymentMethod === 'okash' ? '🔴 أوكاش' : '💵 نقداً'}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => onUpdateOrderStatus(ord.id, ord.status, ord.paymentStatus === 'verified' ? 'failed' : 'verified')}
                                    className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-colors border ${
                                      ord.paymentStatus === 'verified' 
                                        ? 'bg-emerald-100 text-emerald-800 border-emerald-300 hover:bg-emerald-200' 
                                        : 'bg-amber-100 text-amber-800 border-amber-300 hover:bg-amber-200'
                                    }`}
                                    title="انقر لتغيير حالة اعتماد الدفع"
                                  >
                                    {ord.paymentStatus === 'verified' ? 'مؤكد ✓' : 'قيد التأكيد ⏳'}
                                  </button>
                                </div>
                              </td>

                              {/* Direct Order Status & Editable Delivery Time Management Selector */}
                              <td className="p-3 whitespace-nowrap">
                                <div className="flex items-center gap-2">
                                  <select
                                    value={ord.status}
                                    onChange={(e) => onUpdateOrderStatus(ord.id, e.target.value as OrderStatus, ord.paymentStatus === 'verified' ? 'verified' : 'failed')}
                                    className="bg-white border border-slate-300 rounded-xl text-xs font-bold px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-800 cursor-pointer shadow-sm"
                                  >
                                    <option value="pending">جديد (في الانتظار)</option>
                                    <option value="reviewing">جاري المراجعة</option>
                                    <option value="printing">جاري الطباعة 🖨️</option>
                                    <option value="packaging">جاري التغليف 📦</option>
                                    <option value="out_for_delivery">مع المندوب للتوصيل 🛵</option>
                                    <option value="ready_for_pickup">جاهز للاستلام 🏪</option>
                                    <option value="completed">تم التسليم بنجاح ✅</option>
                                    <option value="cancelled">ملغي ❌</option>
                                  </select>

                                  <div className="flex items-center gap-1 bg-amber-50 border border-amber-300 p-1 rounded-xl text-xs font-bold shadow-2xs">
                                    <Clock className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                                    <input
                                      type="text"
                                      placeholder="الموعد المتوقع..."
                                      value={editingDeliveryTimes[ord.id] !== undefined ? editingDeliveryTimes[ord.id] : (ord.estimatedCompletionTime || getEstimatedDeliveryText(ord))}
                                      onChange={(e) => handleDeliveryTimeTextChange(ord.id, e.target.value)}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                          handleSaveDeliveryTime(ord);
                                        }
                                      }}
                                      className="bg-white border border-amber-300 text-amber-950 text-xs px-2 py-0.5 rounded w-32 font-bold"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => handleSaveDeliveryTime(ord)}
                                      className="bg-amber-500 hover:bg-amber-600 text-white font-bold px-2 py-0.5 rounded text-[11px] cursor-pointer"
                                      title="حفظ موعد التسليم"
                                    >
                                      {savedTimeFeedback[ord.id] ? '✓' : 'حفظ'}
                                    </button>
                                  </div>
                                </div>
                              </td>

                              {/* Actions */}
                              <td className="p-3 whitespace-nowrap text-center">
                                <div className="flex items-center justify-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => setPrintOrderSlip(ord)}
                                    className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg transition-colors border border-slate-300 flex items-center gap-1 font-bold text-[11px] cursor-pointer"
                                    title="عرض وطباعة إيصال الطلب"
                                  >
                                    <FileText className="w-3.5 h-3.5 text-amber-600" />
                                    <span>الإيصال</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => handleDelete(ord.id, ord.customerName)}
                                    className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition-colors border border-rose-200 cursor-pointer"
                                    title="حذف هذا الطلب ونقله إلى سلة المحذوفات"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                );
              })()}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-100 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs font-bold text-slate-700 shrink-0">
              <div className="flex items-center gap-4 flex-wrap">
                <span>إجمالي الطلبات: <strong className="text-slate-900 font-mono text-sm">{orders.length} طلب</strong></span>
                <span>إجمالي المبالغ: <strong className="text-emerald-800 font-mono text-sm">{formatSDG(orders.reduce((sum, o) => sum + o.totalAmount, 0))}</strong></span>
              </div>

              <button
                type="button"
                onClick={() => setShowQuickOrdersModal(false)}
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition-colors cursor-pointer"
              >
                إغلاق النافذة
              </button>
            </div>

          </div>
        </div>
      )}

      {/* PIN CODE MODAL FOR TRASH RECYCLE BIN */}
      {showTrashPinModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-200 text-right space-y-5 relative">
            <button
              onClick={() => setShowTrashPinModal(false)}
              className="absolute left-4 top-4 text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="p-3 bg-rose-100 text-rose-600 rounded-2xl">
                <Lock className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900">سلة المحذوفات محمية 🔒</h3>
                <p className="text-xs text-slate-500 mt-0.5">يرجى إدخال رمز الأمان لعرض المحذوفات واسترجاعها</p>
              </div>
            </div>

            <form onSubmit={handleUnlockTrash} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  رمز الأمان (PIN Code):
                </label>
                <div className="relative">
                  <KeyRound className="w-5 h-5 text-slate-400 absolute right-3.5 top-3.5" />
                  <input
                    type="password"
                    required
                    autoFocus
                    value={trashPinInput}
                    onChange={e => {
                      setTrashPinInput(e.target.value);
                      setTrashPinError('');
                    }}
                    placeholder="أدخل رمز الأمان..."
                    className="w-full pr-11 pl-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none font-mono text-center text-xl text-slate-900 tracking-widest"
                  />
                </div>
                {trashPinError && (
                  <p className="mt-2 text-xs font-bold text-rose-600 bg-rose-50 p-2.5 rounded-xl border border-rose-200 flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{trashPinError}</span>
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="submit"
                  className="w-full bg-rose-600 hover:bg-rose-700 text-white font-black py-3 rounded-xl shadow-md transition-all text-sm cursor-pointer flex items-center justify-center gap-2"
                >
                  <Lock className="w-4 h-4" />
                  <span>فتح سلة المحذوفات</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowTrashPinModal(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 px-4 rounded-xl text-sm transition-colors cursor-pointer"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Order Slip Printable Modal */}
      <OrderSlipModal 
        order={printOrderSlip} 
        onClose={() => setPrintOrderSlip(null)} 
      />

      {/* CUSTOM REUSABLE CONFIRMATION MODAL */}
      {confirmDialog.isOpen && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xs z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-200 text-right space-y-5 relative">
            <button
              onClick={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
              className="absolute left-4 top-4 text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className={`p-3 rounded-2xl ${
                confirmDialog.type === 'danger' ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'
              }`}>
                <AlertCircle className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-black text-slate-900">{confirmDialog.title}</h3>
            </div>

            <p className="text-sm font-bold text-slate-700 leading-relaxed">
              {confirmDialog.message}
            </p>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  confirmDialog.onConfirm();
                  setConfirmDialog(prev => ({ ...prev, isOpen: false }));
                }}
                className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all shadow-md cursor-pointer ${
                  confirmDialog.type === 'danger'
                    ? 'bg-rose-600 hover:bg-rose-700 text-white'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                }`}
              >
                {confirmDialog.confirmText}
              </button>
              <button
                type="button"
                onClick={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-4 py-2.5 rounded-xl text-xs sm:text-sm transition-colors cursor-pointer border border-slate-200"
              >
                {confirmDialog.cancelText}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TOAST NOTIFICATION */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-[100] bg-slate-900 text-white px-5 py-3.5 rounded-2xl shadow-2xl border border-slate-700 text-xs sm:text-sm font-bold flex items-center gap-2.5 animate-in slide-in-from-bottom-5 duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

    </div>
  );
};

