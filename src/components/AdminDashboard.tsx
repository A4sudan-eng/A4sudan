import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, Package, DollarSign, Printer, CheckCircle2, 
  Clock, Edit3, Save, RefreshCw, Eye, FileText, Phone, MapPin, CreditCard, Filter,
  Lock, KeyRound, Search, Trash2, LogOut, AlertCircle, FileCheck, Camera, Image as ImageIcon, X, Download, FileSpreadsheet, ExternalLink,
  BookOpen, Plus, Layers, GraduationCap, Building2, Tag, TrendingUp, BarChart3, UserCheck, History, User
} from 'lucide-react';
import bankakLogo from '../assets/images/bankak_logo_1786006078601.jpg';
import okashLogo from '../assets/images/okash_logo_1786006090002.jpg';
import fawryLogo from '../assets/images/fawry_logo_1786006099638.jpg';
import { PrintOrder, PricingRates, OrderStatus, PrintColor, PrintSides, BindingType, StudySheet, Coupon, ActivityLog } from '../types';
import { getStatusBadgeInfo, formatSDG, calculateFilePrice } from '../utils/pricing';
import { DEFAULT_PRICING_RATES } from '../data/initialData';

interface AdminDashboardProps {
  orders: PrintOrder[];
  rates: PricingRates;
  sheets: StudySheet[];
  coupons?: Coupon[];
  onUpdateOrderStatus: (orderId: string, status: OrderStatus, paymentStatus?: 'verified' | 'failed') => void;
  onDeleteOrder?: (orderId: string) => void;
  onUpdateRates: (newRates: PricingRates) => void;
  onAddSheet: (sheet: StudySheet) => void;
  onUpdateSheet: (sheet: StudySheet) => void;
  onDeleteSheet: (id: string) => void;
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
            <div><strong>عدد الصفحات:</strong> ${f.pageCount} صفحة</div>
            <div><strong>عدد النسخ:</strong> ${f.copies} نسخة</div>
            <div><strong>نوع الطباعة:</strong> ${f.color === 'color' ? 'ألوان 🎨' : 'أبيض وأسود 🖤'} (${f.sides === 'double' ? 'وجهين' : 'وجه واحد'})</div>
            <div><strong>نوع التغليف:</strong> ${f.binding}</div>
            ${f.pagesPerSheet ? `<div><strong>تقسيم الصفحات:</strong> ${f.pagesPerSheet} صفحة في الورقة</div>` : ''}
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
  const [activeTab, setActiveTab] = useState<'orders' | 'pricing' | 'sheets_manage' | 'sheets' | 'coupons' | 'activity_logs'>('orders');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingRates, setEditingRates] = useState<PricingRates>({ ...rates });
  const [isSaved, setIsSaved] = useState(false);
  const [simSheetPrice, setSimSheetPrice] = useState<number>(rates.bwPerPage || 200);

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
    if (window.confirm('هل أنت متاكد من مسح كافة سجلات النشاط الإداري؟ لا يمكن التراجع عن هذا الإجراء.')) {
      setActivityLogs([]);
      try {
        localStorage.removeItem('a4_activity_logs');
      } catch (e) {}
    }
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
  const [sheetFaculty, setSheetFaculty] = useState('كلية التجارة');
  const [sheetDept, setSheetDept] = useState<'محاسبة' | 'تأمين' | 'إدارة أعمال'>('محاسبة');
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

  // Sheets Table Search & Filter
  const [sheetSearch, setSheetSearch] = useState('');
  const [sheetDeptFilter, setSheetDeptFilter] = useState('all');
  const [sheetSemesterFilter, setSheetSemesterFilter] = useState('all');

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
      pageCount: sheetPages,
      authorOrLecturer: sheetAuthor.trim() || 'دكتور المادة',
      fileUrl: '#',
      downloadCount: 1,
      recommendedColor: sheetColor,
      recommendedBinding: sheetBinding,
      priceEstimate: sheetPrice || (sheetPages * 60 + 1200),
      isAvailable: sheetAvailable,
    };

    onAddSheet(created);
    addLogEntry(
      'sheet_added',
      `تمت إضافة شيت جديد لمكتبة الكلية: "${created.title}" - المادة: ${created.subject} (${created.facultyOrYear})`
    );
    setSheetSuccessMsg('تمت إضافة الشيت وتحديث مكتبة الكلية ودليل الليدر بنجاح! 🎉');
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

  // Stats calculation
  const totalOrdersCount = orders.length;
  const pendingOrdersCount = orders.filter(o => o.status === 'pending' || o.status === 'reviewing').length;
  const completedOrdersCount = orders.filter(o => o.status === 'completed').length;
  const totalRevenue = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  const totalPagesPrinted = orders.reduce((sum, o) => sum + (o.totalPages || 0), 0);

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

  const summaryOrders = orders.filter(o => {
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
  const filteredOrders = orders.filter(o => {
    // Status Filter
    if (statusFilter !== 'all' && o.status !== statusFilter) {
      return false;
    }
    // Search Query Filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchName = (o.customerName || '').toLowerCase().includes(q);
      const matchPhone = (o.customerPhone || '').toLowerCase().includes(q);
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

  const handleAdminVerifyPayment = (order: PrintOrder) => {
    onUpdateOrderStatus(order.id, order.status, 'verified');
    addLogEntry(
      'payment_verified',
      `تم تأكيد ودفع رسوم الطلب (${order.id}) للعميل/الطالب "${order.customerName}" بمبلغ (${formatSDG(order.totalAmount)}) عبر ${order.paymentMethod === 'bankak' ? 'تطبيق بنكك' : order.paymentMethod === 'okash' ? 'تطبيق أوكاش' : order.paymentMethod === 'fawry' ? 'تطبيق فوري' : 'دفع نقدي'}${order.bankakTransactionId ? ` [إشعار: ${order.bankakTransactionId}]` : ''}`,
      order.id,
      order.customerName
    );
  };

  const handleDelete = (orderId: string, customerName: string) => {
    if (window.confirm(`هل أنت تأكد من حذف طلب العميل "${customerName}" (رقم الطلب: ${orderId}) من قاعدة البيانات نهائياً؟`)) {
      if (onDeleteOrder) {
        onDeleteOrder(orderId);
        addLogEntry(
          'order_deleted',
          `تم حذف الطلب (${orderId}) التابع للعميل/الطالب "${customerName}" نهائياً من النظام`,
          orderId,
          customerName
        );
      }
    }
  };

  const handleSaveRates = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/pricing', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingRates),
      });
      if (res.ok) {
        onUpdateRates(editingRates);
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 3000);
        addLogEntry(
          'pricing_updated',
          `تم تحديث تعريفات أسعار الطباعة والتجليد (أبيض/أسود: ${editingRates.bwPerPage} ج.س، ألوان: ${editingRates.colorPerPage} ج.س)`
        );
      }
    } catch (err) {
      onUpdateRates(editingRates);
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
          <button
            onClick={() => setActiveTab('orders')}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all ${
              activeTab === 'orders' ? 'bg-emerald-400 text-emerald-950 shadow-md' : 'bg-emerald-900/80 text-emerald-100 hover:bg-emerald-800'
            }`}
          >
            الطلبات الواردة ({orders.length})
          </button>
          <button
            onClick={() => setActiveTab('pricing')}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'pricing' ? 'bg-amber-400 text-amber-950 shadow-md ring-2 ring-amber-300 font-extrabold' : 'bg-emerald-900/80 text-emerald-100 hover:bg-emerald-800'
            }`}
          >
            <DollarSign className="w-4 h-4" />
            <span>تعريف أسعار الورق والتسعير</span>
          </button>
          <button
            onClick={() => setActiveTab('sheets_manage')}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'sheets_manage' ? 'bg-amber-400 text-amber-950 shadow-md ring-2 ring-amber-300 font-extrabold' : 'bg-emerald-900/80 text-emerald-100 hover:bg-emerald-800'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>إضافة وشيتات الكلية ({sheets.length})</span>
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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        
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

      {/* ORDERS TAB */}
      {activeTab === 'orders' && (
        <div className="space-y-6">
          
          {/* DAILY SALES & BANKAK SUMMARY SECTION */}
          <div className="bg-gradient-to-br from-emerald-900 via-emerald-800 to-emerald-950 text-white rounded-3xl border-2 border-emerald-700 p-5 sm:p-6 shadow-xl space-y-5">
            
            {/* Summary Header & Period Filter Controls */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-emerald-800/80 pb-4">
              <div>
                <div className="flex items-center gap-2 text-emerald-300 font-bold text-xs mb-1">
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                  <span>تقرير الحسابات والتحصيل المالي البنكي اليومي</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2 flex-wrap">
                  <span>📊 ملخص المبيعات اليومي والتحصيل</span>
                  <span className="text-xs font-bold bg-amber-400 text-amber-950 px-3 py-1 rounded-full border border-amber-300 font-mono">
                    {summaryFilter === 'today' ? `اليوم (${todayLocalDate})` : summaryFilter === 'yesterday' ? `الأمس (${yesterdayLocalDate})` : summaryFilter === 'custom' ? `تاريخ: ${customDate}` : 'الفترة المحددة'}
                  </span>
                </h3>
              </div>

              {/* Date Filter Pills */}
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

                {/* Custom Date Input */}
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

                {/* Export CSV */}
                <button
                  type="button"
                  onClick={handleExportCSV}
                  className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-amber-950 rounded-lg font-black transition-all flex items-center gap-1.5 border border-amber-300 shadow-sm cursor-pointer"
                  title="تصدير تقرير المبيعات كملف اكسل CSV"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>تصدير CSV 📊</span>
                </button>

                {/* Print Report */}
                <button
                  type="button"
                  onClick={handlePrintDailyReport}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold transition-all flex items-center gap-1.5 border border-emerald-400/40 shadow-sm cursor-pointer"
                  title="طباعة تقرير التحصيل والورديات"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>طباعة التقرير 🖨️</span>
                </button>
              </div>
            </div>

            {/* Key Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              
              {/* 1. Completed Orders Count */}
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

              {/* 2. Bankak Total Revenue Collected */}
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

              {/* 3. Total Collected Revenue Across All Methods */}
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

              {/* 4. Total Printed Sheets/Pages */}
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

            {/* Banking Apps & Payment Method Breakdown */}
            <div className="bg-emerald-950/80 p-4 rounded-2xl border border-emerald-800/80 space-y-3">
              <div className="flex items-center justify-between text-xs text-emerald-200 font-bold border-b border-emerald-800/60 pb-2">
                <span className="flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4 text-emerald-400" />
                  <span>تفاصيل التحصيل المالي المباشر حسب التطبيقات المصرفية والدفع النقدي:</span>
                </span>
                <span className="text-[11px] text-emerald-300">
                  (للطلبات المكتملة والمؤكدة)
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                
                {/* Bankak App */}
                <div className="bg-emerald-950/80 p-3 rounded-xl border border-emerald-800 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <img src={bankakLogo} alt="بنكك" className="w-7 h-7 rounded-lg object-contain bg-white p-0.5 border border-emerald-700 shrink-0" />
                    <div>
                      <span className="font-bold text-white block text-[11px]">تحويل بنكك (الخرطوم)</span>
                      <span className="text-amber-300 font-bold text-xs">{bankakSummaryOrders.length} طلب مؤكد</span>
                    </div>
                  </div>
                  <strong className="text-amber-300 text-sm font-black font-mono">{formatSDG(bankakTotalAmount)}</strong>
                </div>

                {/* Okash App */}
                <div className="bg-emerald-950/80 p-3 rounded-xl border border-emerald-800 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <img src={okashLogo} alt="أوكاش" className="w-7 h-7 rounded-lg object-contain bg-white p-0.5 border border-emerald-700 shrink-0" />
                    <div>
                      <span className="font-bold text-white block text-[11px]">أوكاش (أم درمان)</span>
                      <span className="text-emerald-300 font-bold text-xs">{okashSummaryOrders.length} طلب مؤكد</span>
                    </div>
                  </div>
                  <strong className="text-emerald-200 text-sm font-black font-mono">{formatSDG(okashTotalAmount)}</strong>
                </div>

                {/* Fawry App */}
                <div className="bg-emerald-950/80 p-3 rounded-xl border border-emerald-800 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <img src={fawryLogo} alt="فوري" className="w-7 h-7 rounded-lg object-contain bg-white p-0.5 border border-emerald-700 shrink-0" />
                    <div>
                      <span className="font-bold text-white block text-[11px]">فوري (فيصل)</span>
                      <span className="text-emerald-300 font-bold text-xs">{fawrySummaryOrders.length} طلب مؤكد</span>
                    </div>
                  </div>
                  <strong className="text-emerald-200 text-sm font-black font-mono">{formatSDG(fawryTotalAmount)}</strong>
                </div>

                {/* Cash / Other */}
                <div className="bg-emerald-950/80 p-3 rounded-xl border border-emerald-800 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-400/40 text-amber-300 flex items-center justify-center font-bold text-sm shrink-0">
                      💵
                    </div>
                    <div>
                      <span className="font-bold text-white block text-[11px]">نقداً (استلام بالمكتبة)</span>
                      <span className="text-emerald-300 font-bold text-xs">{cashSummaryOrders.length} طلب مؤكد</span>
                    </div>
                  </div>
                  <strong className="text-emerald-200 text-sm font-black font-mono">{formatSDG(cashTotalAmount)}</strong>
                </div>

              </div>
            </div>

          </div>
          
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
                  className="bg-white rounded-2xl border-2 border-slate-200 shadow-sm p-5 sm:p-6 space-y-5 hover:border-emerald-300 transition-all"
                >
                  {/* Top Order Header */}
                  <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200">
                    <div>
                      <div className="flex items-center gap-3">
                        <strong className="font-mono text-xl font-black text-slate-900 bg-slate-100 px-3 py-1 rounded-xl border border-slate-300">
                          كود الطلب: {order.id}
                        </strong>
                        <span className={`text-xs font-bold px-3.5 py-1.5 rounded-full border ${badge.bgClass} ${badge.textClass}`}>
                          {badge.label}
                        </span>
                        <span className="text-xs text-slate-500 font-medium dir-ltr">
                          {new Date(order.createdAt).toLocaleDateString('ar-SD')} {new Date(order.createdAt).toLocaleTimeString('ar-SD', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>

                    <div className="text-right bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-200">
                      <span className="text-[11px] text-emerald-800 font-bold block">المبلغ النهائي المستحق:</span>
                      <strong className="text-xl font-black text-emerald-950">{formatSDG(order.totalAmount)}</strong>
                    </div>
                  </div>

                  {/* 1. UNIFIED CLIENT & ACADEMIC DATA */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs space-y-3">
                    <h4 className="font-black text-slate-900 text-sm flex items-center gap-2 border-b border-slate-200 pb-2">
                      <UserCheck className="w-4 h-4 text-emerald-600" />
                      <span>بيانات مقدم الطلب والمسار الأكاديمي الموحد:</span>
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 bg-white p-3.5 rounded-lg border border-slate-200">
                      <div>
                        <span className="text-slate-500 block font-bold mb-0.5">👤 اسم الطالب / العميل:</span>
                        <strong className="text-slate-900 text-sm font-bold">{order.customerName}</strong>
                      </div>

                      <div>
                        <span className="text-slate-500 block font-bold mb-0.5">📞 رقم التواصل (واتساب):</span>
                        <strong className="text-slate-900 text-sm font-mono dir-ltr">{order.customerPhone}</strong>
                      </div>

                      <div>
                        <span className="text-slate-500 block font-bold mb-0.5">🏛️ الجامعة / المؤسسة:</span>
                        <strong className="text-slate-900 text-sm font-bold">{order.institution || 'جامعة النيلين'}</strong>
                      </div>

                      <div>
                        <span className="text-slate-500 block font-bold mb-0.5">🎓 الكلية / التخصص / الدفعة:</span>
                        <strong className="text-slate-900 text-sm font-bold">{order.specialization || 'كلية التجارة (الدفعة 29)'}</strong>
                      </div>

                      <div>
                        <span className="text-slate-500 block font-bold mb-0.5">🚚 طريقة التسليم والمدينة:</span>
                        <strong className="text-slate-900 font-bold">
                          {order.deliveryMethod === 'pickup' ? 'استلام شخصي من المكتبة' : `توصيل إلى ${order.city}`}
                        </strong>
                      </div>

                      <div>
                        <span className="text-slate-500 block font-bold mb-0.5">📍 العنوان التفصيلي / المجمع:</span>
                        <strong className="text-slate-900 font-bold">{order.addressOrCampus}</strong>
                      </div>
                    </div>
                  </div>

                  {/* 2. UNIFIED DOCUMENTS & SHEETS BLOCK (تفاصيل المستندات والشيتات في حتة واحدة) */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2">
                      <h4 className="font-black text-slate-900 text-sm flex items-center gap-2">
                        <FileText className="w-4 h-4 text-emerald-600" />
                        <span>تفاصيل المستندات والشيتات المطلوبة للطباعة ({order.files.length} ملف/شيت):</span>
                      </h4>
                      <span className="text-amber-900 bg-amber-100 px-3 py-1 rounded-full font-bold border border-amber-300">
                        إجمالي الورق المطبوع: {order.files.reduce((acc, f) => acc + (Math.ceil(f.pageCount / (f.pagesPerSheet || 1)) * f.copies), 0)} ورقة
                      </span>
                    </div>

                    <div className="space-y-3">
                      {order.files.map((f, idx) => {
                        const fileUrl = getDownloadableDocumentUrl(f, order.id);

                        return (
                          <div key={idx} className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm space-y-2">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                                  {idx + 1}
                                </span>
                                <strong className="text-slate-900 font-black text-sm">{f.fileName}</strong>
                              </div>

                              <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                                {/* Open / Preview Button */}
                                <button
                                  type="button"
                                  onClick={() => setSelectedDocumentFile({
                                    fileName: f.fileName,
                                    previewUrl: fileUrl,
                                    fileType: f.fileType,
                                    pageCount: f.pageCount,
                                    notes: f.notes
                                  })}
                                  className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-1 cursor-pointer"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                  <span>معاينة</span>
                                </button>

                                {/* Direct Download Button */}
                                <a
                                  href={fileUrl}
                                  download={f.fileName}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="px-3 py-1 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-1"
                                >
                                  <Download className="w-3.5 h-3.5" />
                                  <span>تحميل</span>
                                </a>
                              </div>
                            </div>

                            {/* Specifications Row */}
                            <div className="flex flex-wrap items-center gap-2 text-slate-700 font-medium text-[11px] bg-slate-50 p-2 rounded-lg border border-slate-100">
                              <span className="bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-900 font-bold">
                                {f.pageCount} صفحة
                              </span>
                              <span className="text-emerald-950 font-extrabold bg-emerald-100 px-2.5 py-0.5 rounded border border-emerald-300 flex items-center gap-1">
                                <span>{f.pagesPerSheet === 8 ? 'الاسلايت (8:1)' : f.pagesPerSheet === 4 ? 'الشائع ⭐ (4:1)' : 'العادي (2:1)'}</span>
                                <span>•</span>
                                <span>{Math.ceil(f.pageCount / (f.pagesPerSheet || 2))} ورقة مطبوعة</span>
                                <span className="text-[10px] text-emerald-800 font-bold">({rates.bwPerPage || 200}ج/ورقة)</span>
                              </span>
                              <span>• النوع: {f.color === 'color' ? 'ألوان 🎨' : f.color === 'mixed' ? 'غلاف ألوان والداخل أسود' : 'أسود 🖤'}</span>
                              <span>• الوجهين: {f.sides === 'double' ? 'طباعة وجهين 📄' : 'وجه واحد'}</span>
                              <span>• التغليف: {f.binding === 'spiral_plastic' ? 'سلك حلزوني' : f.binding === 'stapled' ? 'كبس وتدبيس' : f.binding === 'softcover' ? 'غلاف مجلد' : f.binding === 'hardcover_leather' ? 'تجليد فاخر' : 'بدون تغليف'}</span>
                              <span>• عدد النسخ: <strong className="text-slate-900 font-bold">{f.copies} عدد</strong></span>
                              <span className="mr-auto font-mono text-emerald-900 font-bold text-xs bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                {formatSDG(f.calculatedPrice)}
                              </span>
                            </div>

                            {/* Sequence / Notes */}
                            {f.notes && (
                              <p className="text-[11px] text-emerald-950 bg-emerald-50/90 px-3 py-1.5 rounded-lg border border-emerald-200 font-medium">
                                📌 <strong>المسار الأكاديمي والملاحظات:</strong> {f.notes}
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* 3. FINANCIAL BREAKDOWN & COUPON INFO */}
                  <div className="bg-emerald-950/80 text-white p-4 rounded-xl text-xs space-y-2.5">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-emerald-800/80 pb-2 text-emerald-100">
                      <span>إجمالي الطباعة الفرعي: <strong className="text-white font-mono">{formatSDG(order.subtotal)}</strong></span>
                      <span>رسوم التوصيل: <strong className="text-white font-mono">{formatSDG(order.deliveryFee)}</strong></span>
                      
                      {/* Coupon Discount Info */}
                      {order.discount > 0 ? (
                        <span className="text-amber-300 font-black bg-amber-950/80 px-2.5 py-1 rounded border border-amber-500/50">
                          🎟️ تم استخدام كود تخفيض ({order.couponCode || 'كوبون خاص'}): خصم -{formatSDG(order.discount)}
                        </span>
                      ) : (
                        <span className="text-emerald-300/70 text-[11px]">لم يتم استخدام كود تخفيض</span>
                      )}

                      <span className="text-sm font-black text-amber-300">الصافي النهائي: {formatSDG(order.totalAmount)}</span>
                    </div>

                    {/* Payment details inside financial box */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
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

                  {/* Actions Row: Status Change & Delete Button */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                    <div className="flex items-center gap-2 text-xs flex-wrap">
                      <span className="font-bold text-slate-700">تغيير حالة الطلب:</span>
                      <select
                        value={order.status}
                        onChange={e => handleAdminStatusChange(order, e.target.value as OrderStatus)}
                        className="bg-white border border-slate-300 rounded-lg p-2 text-xs text-slate-900 font-bold focus:ring-2 focus:ring-emerald-500"
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
                  أي شيت يتم إضافته أو تعديله أو تغيير سعره وحالته هنا ينعكس فوراً في واجهة مكتبة الطلاب ودليل الليدر.
                </p>
              </div>

              <div className="bg-emerald-900/80 backdrop-blur-xs p-4 rounded-2xl border border-emerald-700/60 text-center shrink-0">
                <span className="text-xs text-emerald-300 font-bold block">إجمالي الشيتات بالمكتبة</span>
                <span className="text-3xl font-black text-amber-400">{sheets.length}</span>
                <span className="text-[10px] text-emerald-200 block">شيت ومذكرة متاحة</span>
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
                <p className="text-xs text-slate-500">قم بتعبئة تفاصيل المادة، القسم، الدفعة، وعدد الصفحات لإدراج الشيت بالمكتبة وتحديد سعره للطلاب</p>
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
                  <input
                    type="text"
                    required
                    value={sheetInstitution}
                    onChange={e => setSheetInstitution(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-800 font-bold mb-1">الكلية *</label>
                  <input
                    type="text"
                    required
                    value={sheetFaculty}
                    onChange={e => setSheetFaculty(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-800 font-bold mb-1">قسم الكلية *</label>
                  <select
                    value={sheetDept}
                    onChange={e => setSheetDept(e.target.value as 'محاسبة' | 'تأمين' | 'إدارة أعمال')}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none"
                  >
                    <option value="محاسبة">قسم المحاسبة</option>
                    <option value="تأمين">قسم التأمين</option>
                    <option value="إدارة أعمال">قسم إدارة الأعمال</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                  <label className="block text-slate-800 font-bold mb-1">الدفعة الدراسية *</label>
                  <select
                    value={sheetBatch}
                    onChange={e => setSheetBatch(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none"
                  >
                    <option value="batch_28">الدفعة 28 (دفعة 2018)</option>
                    <option value="batch_29">الدفعة 29 (دفعة 2019)</option>
                    <option value="batch_30">الدفعة 30 (دفعة 2020)</option>
                    <option value="batch_31">الدفعة 31 (دفعة 2021)</option>
                    <option value="batch_32">الدفعة 32 (دفعة 2022)</option>
                    <option value="batch_33_34">الدفعة 33 و 34 (دفعة 2023 - 2024)</option>
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
                  <label className="block text-slate-800 font-bold mb-1">عدد الصفحات *</label>
                  <input
                    type="number"
                    min="1"
                    max="1000"
                    required
                    value={sheetPages}
                    onChange={e => setSheetPages(parseInt(e.target.value) || 1)}
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
                  <span className="text-[11px] text-emerald-700 block mt-1">محسوب تلقائياً حسب عدد الصفحات والتغليف</span>
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

              {/* Filters */}
              <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
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
                  {filteredSheets.map((st) => (
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
                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                        <div>
                          <span className="text-[10px] text-slate-400 block font-semibold">سعر الشيت:</span>
                          <strong className="text-emerald-700 font-black text-sm">
                            {formatSDG(st.priceEstimate || (st.pageCount * 60 + 1200))}
                          </strong>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => onUpdateSheet({ ...st, isAvailable: !(st.isAvailable !== false) })}
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
                              if (window.confirm(`هل أنت تأكد من حذف الشيت "${st.title}" من المكتبة؟`)) {
                                onDeleteSheet(st.id);
                              }
                            }}
                            className="p-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="حذف الشيت"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
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
                setEditingSheet(null);
                alert('تم حفظ التعديلات وتحديث الشيت بالمكتبة بنجاح!');
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

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-800 font-bold mb-1">القسم *</label>
                  <select
                    value={editingSheet.department}
                    onChange={e => setEditingSheet({ ...editingSheet, department: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-bold text-slate-900 text-xs"
                  >
                    <option value="محاسبة">محاسبة</option>
                    <option value="تأمين">تأمين</option>
                    <option value="إدارة أعمال">إدارة أعمال</option>
                  </select>
                </div>

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
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-800 font-bold mb-1">عدد الصفحات *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={editingSheet.pageCount}
                    onChange={e => {
                      const pages = parseInt(e.target.value) || 1;
                      const printedSheets = Math.ceil(pages / 2);
                      setEditingSheet({ 
                        ...editingSheet, 
                        pageCount: pages,
                        priceEstimate: printedSheets * (rates.bwPerPage || 200) + (rates.bindingPrice?.spiral_plastic || 1200)
                      });
                    }}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-black text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-slate-800 font-bold mb-1">سعر الشيت الأصلي (SDG) *</label>
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
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-black py-3 rounded-xl transition-colors shadow cursor-pointer"
                >
                  حفظ التعديلات
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

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">اسم/رمز الكوبون (الرمز) *</label>
                  <input
                    type="text"
                    required
                    value={newCouponCode}
                    onChange={e => setNewCouponCode(e.target.value.toUpperCase())}
                    placeholder="مثال: BATCH29"
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
                  <label className="block text-xs font-bold text-slate-800 mb-1">الدفعة الدراسية المستهدفة *</label>
                  <select
                    value={newCouponBatch}
                    onChange={e => setNewCouponBatch(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl p-2.5 font-bold text-slate-900 text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                  >
                    <option value="all">جميع الدفعات (كوبون عام)</option>
                    <option value="batch_28">الدفعة 28 (دفعة 2018)</option>
                    <option value="batch_29">الدفعة 29 (دفعة 2019)</option>
                    <option value="batch_30">الدفعة 30 (دفعة 2020)</option>
                    <option value="batch_31">الدفعة 31 (دفعة 2021)</option>
                    <option value="batch_32">الدفعة 32 (دفعة 2022)</option>
                    <option value="batch_33_34">الدفعة 33 و 34 (دفعة 2023 - 2024)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">وصف أو ملاحظة الكوبون</label>
                  <input
                    type="text"
                    value={newCouponNotes}
                    onChange={e => setNewCouponNotes(e.target.value)}
                    placeholder="مثال: خصم خاص لطلاب دفعة 29"
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
                              if (confirm(`هل أنت تأكد من حذف الكوبون "${c.code}"؟`)) {
                                onDeleteCoupon?.(c.id);
                                addLogEntry(
                                  'coupon_deleted',
                                  `تم حذف كوبون التخفيض [${c.code}] (خصم ${c.discountPercentage}%) من النظام`
                                );
                              }
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

      {/* Document Viewer Modal */}
      {selectedDocumentFile && (
        <div 
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-3 sm:p-6 backdrop-blur-sm"
          onClick={() => setSelectedDocumentFile(null)}
        >
          <div 
            className="relative max-w-4xl w-full h-[90vh] bg-white rounded-2xl overflow-hidden shadow-2xl flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex justify-between items-center px-4 py-3 bg-emerald-900 text-white border-b border-emerald-800">
              <div className="flex items-center gap-2.5 truncate">
                <FileText className="w-5 h-5 text-emerald-300 shrink-0" />
                <div className="truncate">
                  <h4 className="font-bold text-sm truncate">{selectedDocumentFile.fileName}</h4>
                  <span className="text-[11px] text-emerald-200 block">
                    {selectedDocumentFile.pageCount ? `${selectedDocumentFile.pageCount} صفحة` : 'مستند الطباعة المرفق'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <a
                  href={selectedDocumentFile.previewUrl}
                  download={selectedDocumentFile.fileName}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg text-xs flex items-center gap-1.5 shadow transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span>تحميل الملف للجهاز</span>
                </a>

                <button 
                  type="button"
                  onClick={() => setSelectedDocumentFile(null)}
                  className="p-1.5 rounded-full hover:bg-emerald-800 text-emerald-200 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body / Viewer */}
            <div className="flex-1 bg-slate-100 p-2 sm:p-4 overflow-auto flex items-center justify-center">
              {selectedDocumentFile.previewUrl?.startsWith('data:image/') || selectedDocumentFile.fileType?.startsWith('image/') ? (
                <img 
                  src={selectedDocumentFile.previewUrl} 
                  alt={selectedDocumentFile.fileName} 
                  className="max-w-full max-h-full object-contain rounded-lg shadow border border-slate-300"
                />
              ) : (
                <iframe 
                  src={selectedDocumentFile.previewUrl} 
                  title={selectedDocumentFile.fileName} 
                  className="w-full h-full rounded-xl border border-slate-300 bg-white shadow"
                />
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="text-slate-600 font-medium">
                {selectedDocumentFile.notes ? `ملاحظات: ${selectedDocumentFile.notes}` : 'معاينة المستند جاهزة للطباعة'}
              </div>
              <button
                type="button"
                onClick={() => {
                  if (selectedDocumentFile.previewUrl) {
                    const win = window.open(selectedDocumentFile.previewUrl, '_blank');
                    win?.focus();
                  }
                }}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition-colors flex items-center gap-1.5"
              >
                <Printer className="w-4 h-4" />
                <span>فتح في نافذة مستقلة للطباعة 🖨️</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
