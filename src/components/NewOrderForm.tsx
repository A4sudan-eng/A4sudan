import React, { useState, useRef } from 'react';
import { 
  Upload, FileText, Trash2, Plus, Check, MapPin, Phone, User, 
  CreditCard, Truck, Store, Info, Sparkles, Download, Copy, AlertCircle, FileCheck,
  Camera, Image as ImageIcon, X, Tag, BookOpen, GraduationCap
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { PrintFileOptions, PrintOrder, PricingRates, PaperSize, PrintColor, PrintSides, PaperWeight, BindingType, DeliveryMethod, PaymentMethod, DeliveryZone, Coupon } from '../types';
import { calculateFilePrice, formatSDG } from '../utils/pricing';
import { countPdfPages } from '../utils/pdfCounter';
import { DELIVERY_ZONES } from '../data/initialData';
import { saveOrderToCloud, auth } from '../lib/firebase';
import { DeliveryRatesGuide } from './DeliveryRatesGuide';
import { SheetLayoutPreview } from './SheetLayoutPreview';
import { AllMaterialsPrintPreview } from './AllMaterialsPrintPreview';
import logoImg from '../assets/images/a4_sudan_green_logo_1785943554845.jpg';
import bankakLogo from '../assets/images/bankak_logo_1786006078601.jpg';
import okashLogo from '../assets/images/okash_logo_1786006090002.jpg';
import fawryLogo from '../assets/images/fawry_logo_1786006099638.jpg';

interface NewOrderFormProps {
  rates: PricingRates;
  coupons?: Coupon[];
  onOrderCreated: (order: PrintOrder) => void;
  preloadedFiles?: Partial<PrintFileOptions>[];
}

export const NewOrderForm: React.FC<NewOrderFormProps> = ({ rates, coupons = [], onOrderCreated, preloadedFiles }) => {
  const [files, setFiles] = useState<PrintFileOptions[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [institution, setInstitution] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>('delivery');
  const [city, setCity] = useState(DELIVERY_ZONES[0].zoneName);
  const [addressOrCampus, setAddressOrCampus] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('bankak');
  const [bankakTransactionId, setBankakTransactionId] = useState('');
  const [bankakProofUrl, setBankakProofUrl] = useState('');
  const [orderNotes, setOrderNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdOrder, setCreatedOrder] = useState<PrintOrder | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedAccNum, setCopiedAccNum] = useState<string | null>(null);
  const [showDeliveryGuideModal, setShowDeliveryGuideModal] = useState(false);
  const [previewMode, setPreviewMode] = useState<'compact' | 'detailed'>('compact');

  // Coupon state & handlers
  const [couponCodeInput, setCouponCodeInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [couponError, setCouponError] = useState('');
  const [couponSuccess, setCouponSuccess] = useState('');

  const handleCopyAccount = (accNum: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      navigator.clipboard.writeText(accNum);
    } catch (err) {
      const el = document.createElement('textarea');
      el.value = accNum;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
    }
    setCopiedAccNum(accNum);
    setTimeout(() => setCopiedAccNum(null), 2500);
  };

  // Auto-prefill customer details if logged in
  React.useEffect(() => {
    if (auth.currentUser) {
      if (auth.currentUser.displayName && !customerName) {
        setCustomerName(auth.currentUser.displayName);
      }
      if (auth.currentUser.email && !customerEmail) {
        setCustomerEmail(auth.currentUser.email);
      }
    }
  }, [auth.currentUser]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const receiptInputRef = useRef<HTMLInputElement>(null);

  const handleReceiptImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 15 * 1024 * 1024) {
        alert('حجم صورة الإشعار كبير جداً، يرجى اختيار صورة أقل من 15 ميجابايت');
        return;
      }
      const reader = new FileReader();
      reader.onload = (evt) => {
        const dataUrl = evt.target?.result as string;
        if (!dataUrl) return;

        // Compress image using Canvas
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const maxDim = 900;
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const compressed = canvas.toDataURL('image/jpeg', 0.72);
            setBankakProofUrl(compressed);
          } else {
            setBankakProofUrl(dataUrl);
          }
        };
        img.onerror = () => setBankakProofUrl(dataUrl);
        img.src = dataUrl;
      };
      reader.readAsDataURL(file);
    }
  };

  // Initialize preloaded files if passed (e.g. from SheetsHub)
  React.useEffect(() => {
    if (preloadedFiles && preloadedFiles.length > 0 && files.length === 0) {
      // Auto extract shared academic pathway for the order
      const firstNotes = preloadedFiles[0]?.notes || '';
      const pathMatch = firstNotes.match(/المسار(?: الأكاديمي)?:?\s*\(([^)]+)\)/);
      if (pathMatch && pathMatch[1]) {
        const fullPath = pathMatch[1];
        const parts = fullPath.split('⬅️').map(s => s.trim());
        if (parts.length >= 2) {
          setInstitution(parts[0]);
          setSpecialization(parts.slice(1).join(' ⬅️ '));
        } else {
          setSpecialization(fullPath);
        }
      }

      const formatted: PrintFileOptions[] = preloadedFiles.map((p, idx) => {
        const pages = p.pageCount || 10;
        const color = p.color || 'bw';
        const paperSize = p.paperSize || 'a4';
        const sides = p.sides || 'double';
        const paperWeight = p.paperWeight || '70g';
        const binding = p.binding || 'spiral_plastic';
        const copies = p.copies || 1;
        const pagesPerSheet = p.pagesPerSheet || 2;
        const price = calculateFilePrice(pages, color, paperSize, sides, paperWeight, binding, copies, rates, pagesPerSheet);

        return {
          id: `file-preload-${idx}-${Date.now()}`,
          fileName: p.fileName || 'شيت دراسي.pdf',
          fileSize: p.fileSize || 1024 * 500,
          fileType: p.fileType || 'application/pdf',
          pageCount: pages,
          color,
          paperSize,
          sides,
          paperWeight,
          binding,
          copies,
          pagesPerSheet,
          notes: p.notes || '',
          calculatedPrice: price,
          previewUrl: p.previewUrl,
        };
      });
      setFiles(formatted);
    }
  }, [preloadedFiles]);

  // Live recalculate file prices when rates change dynamically from Admin Dashboard
  React.useEffect(() => {
    setFiles(prev => {
      if (!prev || prev.length === 0) return prev;
      return prev.map(f => ({
        ...f,
        calculatedPrice: calculateFilePrice(
          f.pageCount,
          f.color,
          f.paperSize,
          f.sides,
          f.paperWeight,
          f.binding,
          f.copies,
          rates,
          f.pagesPerSheet || 1
        )
      }));
    });
  }, [rates]);

  const processFiles = (uploadedFiles: File[]) => {
    uploadedFiles.forEach(async (f: File, i: number) => {
      // Initial fallback page count while exact parsing takes place
      let estPages = 1;
      if (f.type.startsWith('image/')) {
        estPages = 1;
      } else if (f.name.toLowerCase().endsWith('.pdf')) {
        estPages = Math.max(1, Math.round(f.size / (1024 * 80)));
      }

      const defaultColor: PrintColor = 'bw';
      const defaultSize: PaperSize = 'a4';
      const defaultSides: PrintSides = 'double';
      const defaultWeight: PaperWeight = '70g';
      const defaultBinding: BindingType = 'spiral_plastic';
      const defaultCopies = 1;
      const defaultPagesPerSheet = 2;

      const price = calculateFilePrice(estPages, defaultColor, defaultSize, defaultSides, defaultWeight, defaultBinding, defaultCopies, rates, defaultPagesPerSheet);
      const fileId = `file-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 7)}`;
      const initialObjectUrl = URL.createObjectURL(f);

      const newFileOpt: PrintFileOptions = {
        id: fileId,
        fileName: f.name,
        fileSize: f.size,
        fileType: f.type || (f.name.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'application/octet-stream'),
        pageCount: estPages,
        color: defaultColor,
        paperSize: defaultSize,
        sides: defaultSides,
        paperWeight: defaultWeight,
        binding: defaultBinding,
        copies: defaultCopies,
        pagesPerSheet: defaultPagesPerSheet,
        notes: '',
        calculatedPrice: price,
        previewUrl: initialObjectUrl,
      };

      setFiles(prev => [...prev, newFileOpt]);

      // Calculate EXACT PDF Page Count asynchronously
      try {
        const exactPages = await countPdfPages(f);
        if (exactPages && exactPages > 0) {
          setFiles(prev => prev.map(item => {
            if (item.id !== fileId) return item;
            const updatedPrice = calculateFilePrice(
              exactPages,
              item.color,
              item.paperSize,
              item.sides,
              item.paperWeight,
              item.binding,
              item.copies,
              rates,
              item.pagesPerSheet || 1
            );
            return {
              ...item,
              pageCount: exactPages,
              calculatedPrice: updatedPrice,
            };
          }));
        }
      } catch (err) {
        console.error('Error calculating exact PDF page count:', err);
      }

      // For small images, read as Data URL for persistent thumbnail preview; otherwise initialObjectUrl (blob URL) is used
      if (f.type.startsWith('image/') && f.size < 500 * 1024) {
        const reader = new FileReader();
        reader.onload = (evt) => {
          if (evt.target?.result) {
            const dataUrl = evt.target.result as string;
            setFiles(prev => prev.map(item => item.id === fileId ? { ...item, previewUrl: dataUrl } : item));
          }
        };
        reader.readAsDataURL(f);
      }
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const uploadedFiles: File[] = Array.from(e.target.files);
    processFiles(uploadedFiles);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFiles = Array.from(e.dataTransfer.files) as File[];
      processFiles(droppedFiles);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const updateFileOption = (fileId: string, updates: Partial<PrintFileOptions>) => {
    setFiles(prev => prev.map(f => {
      if (f.id !== fileId) return f;
      const updated = { ...f, ...updates };
      // Recalculate price
      updated.calculatedPrice = calculateFilePrice(
        updated.pageCount,
        updated.color,
        updated.paperSize,
        updated.sides,
        updated.paperWeight,
        updated.binding,
        updated.copies,
        rates,
        updated.pagesPerSheet || 1
      );
      return updated;
    }));
  };

  const removeFile = (fileId: string) => {
    setFiles(prev => prev.filter(f => f.id !== fileId));
  };

  // Coupon handlers
  const handleApplyCoupon = () => {
    setCouponError('');
    setCouponSuccess('');
    if (!couponCodeInput.trim()) {
      setCouponError('الرجاء كتابة رمز الكوبون أولاً');
      return;
    }

    const codeUpper = couponCodeInput.trim().toUpperCase();
    const matched = (coupons || []).find(c => c.code.toUpperCase() === codeUpper);

    if (!matched) {
      setCouponError('كوبون التخفيض غير صحيح أو غير موجود');
      setAppliedCoupon(null);
      return;
    }

    if (!matched.isActive) {
      setCouponError('هذا الكوبون غير متاح أو منتهي الصلاحية حالياً');
      setAppliedCoupon(null);
      return;
    }

    setAppliedCoupon(matched);
    const discountAmt = Math.round((subtotalSum * matched.discountPercentage) / 100);
    setCouponSuccess(`تم تطبيق الخصم بنجاح! وخصم ${matched.discountPercentage}% (${formatSDG(discountAmt)}) 🎉`);
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCodeInput('');
    setCouponError('');
    setCouponSuccess('');
  };

  // Pricing Totals
  const isLibraryOrder = Boolean(
    (preloadedFiles && preloadedFiles.length > 0) ||
    files.some(f => f.notes?.includes('شيت من') || f.id.startsWith('file-preload'))
  );

  // Single Unified Academic Pathway calculation across all materials in the order
  const extractedAcademicPath = React.useMemo(() => {
    for (const f of files) {
      if (f.notes) {
        const match = f.notes.match(/المسار(?: الأكاديمي)?:?\s*\(([^)]+)\)/);
        if (match && match[1]) {
          return match[1];
        }
      }
    }
    if (institution || specialization) {
      return `${institution} ${specialization ? `• ${specialization}` : ''}`.trim();
    }
    return 'جامعة النيلين • كلية التجارة • المستوى الأول';
  }, [files, institution, specialization]);
  const totalPagesSum = files.reduce((acc, f) => acc + (f.pageCount * f.copies), 0);
  const totalPrintedSheetsSum = files.reduce((acc, f) => acc + (Math.ceil(f.pageCount / (f.pagesPerSheet || 1)) * f.copies), 0);
  const subtotalSum = files.reduce((acc, f) => acc + f.calculatedPrice, 0);
  const selectedZone = DELIVERY_ZONES.find(z => z.zoneName === city || city.includes(z.zoneName));
  const deliveryFee = deliveryMethod === 'pickup' ? 0 : (selectedZone?.fee ?? rates.deliveryFees[city] ?? 5000);
  const discountAmount = appliedCoupon ? Math.round((subtotalSum * appliedCoupon.discountPercentage) / 100) : 0;
  const totalAmount = Math.max(0, subtotalSum - discountAmount + deliveryFee);

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (files.length === 0) {
      alert('الرجاء رفع ملف واحد على الأقل للطباعة');
      return;
    }
    if (!customerName.trim() || !customerPhone.trim()) {
      alert('الرجاء كتابة الاسم الكامل ورقم الهاتف لتواصل مندوب الطباعة');
      return;
    }
    if (deliveryMethod === 'delivery' && !addressOrCampus.trim()) {
      alert('الرجاء توضيح عنوان التوصيل أو اسم المجمع الجامعي');
      return;
    }
    if (!bankakTransactionId.trim() && !bankakProofUrl) {
      alert('الرجاء إدخال رقم العملية المرجعي أو إرسال صورة إشعار التحويل لتأكيد الدفع (أي منهما يكفي لبدء الطلب)');
      return;
    }

    setIsSubmitting(true);

    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const trackingId = `A4-SD-${randomNum}`;

    // Sanitize files array to keep payload ultra-lightweight and prevent LocalStorage/Network bottlenecks
    const sanitizedFiles = files.map(f => {
      const copy = { ...f };
      delete (copy as any).file;
      if (copy.previewUrl && (typeof copy.previewUrl !== 'string' || copy.previewUrl.startsWith('blob:') || copy.previewUrl.length > 25000)) {
        delete copy.previewUrl;
      }
      return copy;
    });

    const newOrder: PrintOrder = {
      id: trackingId,
      userId: auth.currentUser?.uid,
      customerName,
      customerPhone,
      customerEmail: customerEmail || auth.currentUser?.email,
      institution: institution.trim() || undefined,
      specialization: specialization.trim() || undefined,
      deliveryMethod,
      city,
      addressOrCampus: deliveryMethod === 'pickup' ? `استلام من فرع ${city}` : addressOrCampus,
      files: sanitizedFiles,
      totalPages: totalPagesSum,
      subtotal: subtotalSum,
      deliveryFee,
      discount: discountAmount,
      couponCode: appliedCoupon?.code,
      totalAmount,
      paymentMethod,
      bankakTransactionId: bankakTransactionId.trim() || undefined,
      bankakProofUrl: bankakProofUrl || undefined,
      paymentStatus: 'pending',
      status: 'pending',
      createdAt: new Date().toISOString(),
      estimatedCompletionTime: 'خلال 2 - 4 ساعات اليوم',
      notes: orderNotes,
    };

    try {
      // Save directly to LocalStorage
      try {
        const existingOrders = JSON.parse(localStorage.getItem('a4_orders') || '[]');
        localStorage.setItem('a4_orders', JSON.stringify([newOrder, ...existingOrders]));

        const myOrderIds: string[] = JSON.parse(localStorage.getItem('a4_my_order_ids') || '[]');
        if (!myOrderIds.includes(newOrder.id)) {
          myOrderIds.unshift(newOrder.id);
          localStorage.setItem('a4_my_order_ids', JSON.stringify(myOrderIds));
        }
        if (newOrder.customerPhone) {
          localStorage.setItem('a4_my_phone', newOrder.customerPhone);
        }
      } catch (e) {
        console.error('LocalStorage write error', e);
      }

      // 1. Instantly transition UI and show success screen
      setCreatedOrder(newOrder);
      if (onOrderCreated) {
        onOrderCreated(newOrder);
      }

      // 2. Save directly to Firebase Cloud Firestore for instant cross-device cross-platform admin sync
      await saveOrderToCloud(newOrder);

      fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newOrder),
      }).catch(() => {});

      // Auto-append to Google Sheets if connected
      try {
        const tok = localStorage.getItem('a4_google_access_token');
        const sheetId = localStorage.getItem('a4_spreadsheet_id');
        if (tok && sheetId) {
          fetch('/api/google-sheets/append-order', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${tok}`
            },
            body: JSON.stringify({ spreadsheetId: sheetId, order: newOrder })
          }).catch(() => {});
        }
      } catch (e) {}

      // Trigger confetti
      try {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch (e) {
        // ignore confetti if blocked
      }
    } catch (err) {
      // Fallback local save
      setCreatedOrder(newOrder);
      onOrderCreated(newOrder);
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyTrackingCode = () => {
    if (createdOrder) {
      navigator.clipboard.writeText(createdOrder.id);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  if (createdOrder) {
    return (
      <div className="max-w-3xl mx-auto py-8 px-4">
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden text-slate-800">
          <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-emerald-900 text-white p-6 sm:p-8 border-b border-emerald-500/40">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-right border-b border-emerald-800/80 pb-6 mb-6">
              <div className="flex items-center gap-3">
                <img
                  src={logoImg}
                  alt="A4 SUDAN Logo"
                  referrerPolicy="no-referrer"
                  className="h-16 w-auto rounded-2xl shadow-lg border-2 border-emerald-400"
                />
                <div>
                  <h1 className="text-2xl font-black text-white tracking-tight">A4 SUDAN</h1>
                  <span className="text-xs text-emerald-300 font-bold tracking-widest block font-mono">
                    STUDENT SERVICES CENTER • فاتورة طباعة رسمية
                  </span>
                </div>
              </div>
              <div className="text-center sm:text-left text-xs text-emerald-200 space-y-1">
                <div className="bg-emerald-950/80 border border-emerald-500/50 px-3 py-1.5 rounded-xl text-emerald-300 font-mono font-bold text-sm">
                  رقم الفاتورة: #{createdOrder.id}
                </div>
                <div>تاريخ الفاتورة: {new Date(createdOrder.createdAt).toLocaleDateString('ar-SD')}</div>
              </div>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-2 border border-emerald-500/30">
                <Check className="w-6 h-6" />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-white">تم استلام وتسجيل طلبك بنجاح!</h2>
              <p className="text-slate-300 mt-1 text-xs sm:text-sm">
                شكراً لثقتك بـ مكتبة A4 Sudan. نحن نعمل الآن على تجهيز طباعة مستنداتك وإعداد التوصيل.
              </p>
            </div>
          </div>

          <div className="p-6 sm:p-8 space-y-6">
            {/* Tracking ID Badge */}
            <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-4 text-center">
              <span className="text-xs font-bold text-amber-800 uppercase tracking-wider block mb-1">
                كود متابعة الطلب الخاص بك
              </span>
              <div className="flex items-center justify-center gap-3">
                <span className="font-mono text-3xl font-black text-amber-950 tracking-wider">
                  {createdOrder.id}
                </span>
                <button
                  onClick={copyTrackingCode}
                  className="bg-amber-200 hover:bg-amber-300 text-amber-900 p-2 rounded-lg transition-colors"
                  title="نسخ كود المتابعة"
                >
                  {copiedCode ? <FileCheck className="w-5 h-5 text-emerald-700" /> : <Copy className="w-5 h-5" />}
                </button>
              </div>
              <p className="text-xs text-amber-700 mt-2">
                احتفظ بهذا الكود لمتابعة حالة الطباعة والتوصيل عبر زر "متابعة الطلبات"
              </p>
            </div>

            {/* UNIFIED ALL-IN-ONE ORDER & CUSTOMER DATA CARD */}
            <div className="bg-slate-50 border-2 border-slate-200 rounded-2xl p-5 sm:p-6 space-y-5 text-slate-900 shadow-sm">
              
              {/* Header inside card */}
              <div className="flex flex-wrap items-center justify-between border-b border-slate-200 pb-3 gap-2">
                <div>
                  <h3 className="font-black text-base sm:text-lg text-emerald-950 flex items-center gap-2">
                    <FileCheck className="w-5 h-5 text-emerald-600" />
                    <span>بيانات الطالب والطلب الشاملة الموحدة</span>
                  </h3>
                  <p className="text-xs text-slate-500">كافة بيانات العميل والمواد والملفات وطريقة الدفع في مكان واحد</p>
                </div>
                <span className="font-mono text-xs bg-amber-100 text-amber-900 px-3 py-1 rounded-full font-black border border-amber-300">
                  كود الطلب: {createdOrder.id}
                </span>
              </div>

              {/* Client Info Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 bg-white p-4 rounded-xl border border-slate-200 text-xs">
                <div>
                  <span className="text-slate-500 block font-bold mb-0.5">👤 اسم الطالب / العميل:</span>
                  <strong className="text-slate-900 text-sm font-bold">{createdOrder.customerName}</strong>
                </div>

                <div>
                  <span className="text-slate-500 block font-bold mb-0.5">📞 رقم التواصل (واتساب):</span>
                  <strong className="text-slate-900 text-sm font-mono dir-ltr">{createdOrder.customerPhone}</strong>
                </div>

                <div className="sm:col-span-2 md:col-span-3 bg-emerald-50 border border-emerald-200 p-2.5 rounded-lg flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2 min-w-0">
                    <GraduationCap className="w-4 h-4 text-emerald-700 shrink-0" />
                    <span className="text-slate-600 font-bold text-xs shrink-0">المسار الأكاديمي الموحد للطلب:</span>
                    <strong className="text-emerald-950 font-black text-xs sm:text-sm truncate">
                      {createdOrder.institution || 'جامعة النيلين'} {createdOrder.specialization ? `• ${createdOrder.specialization}` : ''}
                    </strong>
                  </div>
                  <span className="text-[10px] bg-emerald-200 text-emerald-900 border border-emerald-300 px-2 py-0.5 rounded font-black shrink-0">
                    مسار موحد لكافة المواد ✓
                  </span>
                </div>

                <div>
                  <span className="text-slate-500 block font-bold mb-0.5">🚚 طريقة التسليم والمدينة:</span>
                  <strong className="text-slate-900 font-bold">
                    {createdOrder.deliveryMethod === 'pickup' ? 'استلام شخصي من المكتبة' : `توصيل إلى ${createdOrder.city}`}
                  </strong>
                </div>

                <div>
                  <span className="text-slate-500 block font-bold mb-0.5">📍 العنوان التفصيلي / المجمع:</span>
                  <strong className="text-slate-900 font-bold">{createdOrder.addressOrCampus}</strong>
                </div>
              </div>

              {/* Printed Materials / Files Table */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 text-xs space-y-3">
                <h4 className="font-black text-slate-900 text-sm flex items-center justify-between border-b border-slate-100 pb-2">
                  <span>📚 أسماء المواد والملفات المرفقة للطباعة ({createdOrder.files.length} مادة/ملف):</span>
                  <span className="text-amber-800 font-bold bg-amber-50 px-2.5 py-0.5 rounded border border-amber-200">
                    إجمالي الورق المطبوع: {createdOrder.files.reduce((acc, f) => acc + (Math.ceil(f.pageCount / (f.pagesPerSheet || 1)) * f.copies), 0)} ورقة
                  </span>
                </h4>

                <div className="space-y-2">
                  {createdOrder.files.map((file, idx) => (
                    <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-slate-50 rounded-lg border border-slate-200">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0">
                            {idx + 1}
                          </span>
                          <strong className="text-slate-900 font-black text-sm">{file.fileName}</strong>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 text-slate-600 font-medium text-[11px] pr-7">
                          <span className="bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-800 font-bold">
                            {file.pageCount} صفحة
                          </span>
                          <span>• نوع الطباعة: {file.color === 'color' ? 'ألوان 🎨' : file.color === 'mixed' ? 'غلاف ألوان والداخل أبيض وأسود' : 'أبيض وأسود 🖤'}</span>
                          <span>• الوجهين: {file.sides === 'double' ? 'طباعة وجهين 📄' : 'وجه واحد'}</span>
                          <span>• التغليف: {file.binding === 'spiral_plastic' ? 'سلك حلزوني' : file.binding === 'stapled' ? 'كبس وتدبيس' : file.binding === 'softcover' ? 'غلاف مجلد' : file.binding === 'hardcover_leather' ? 'تجليد فاخر' : 'بدون تغليف'}</span>
                          <span>• النسخ: <strong className="text-slate-900 font-bold">{file.copies} عدد</strong></span>
                        </div>

                        {file.notes && (
                          <p className="text-[11px] text-amber-900 bg-amber-50 px-2.5 py-1 rounded border border-amber-200 mt-1 font-medium pr-7">
                            ملاحظة المادة: {file.notes}
                          </p>
                        )}
                      </div>

                      <div className="text-left shrink-0 self-end sm:self-center font-bold text-slate-900 bg-white px-3 py-1.5 rounded-lg border border-slate-200 text-xs">
                        {formatSDG(file.calculatedPrice)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Financial & Payment Summary Block */}
              <div className="bg-emerald-950/90 text-white p-4 sm:p-5 rounded-xl space-y-3">
                <div className="flex flex-wrap justify-between items-center text-xs text-emerald-200/90 border-b border-emerald-800 pb-2.5 gap-2">
                  <span>قيمة الطباعة الفرعية: <strong className="text-white font-mono">{formatSDG(createdOrder.subtotal)}</strong></span>
                  <span>رسوم التوصيل: <strong className="text-white font-mono">{formatSDG(createdOrder.deliveryFee)}</strong></span>
                  {createdOrder.discount > 0 && (
                    <span className="text-amber-300 font-bold">تخفيض الكوبون ({createdOrder.couponCode}): -{formatSDG(createdOrder.discount)}</span>
                  )}
                  <span className="text-sm font-black text-amber-300">المبلغ النهائي المستحق: {formatSDG(createdOrder.totalAmount)}</span>
                </div>

                {/* Payment Details */}
                <div className="text-xs space-y-2 pt-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <img 
                        src={
                          createdOrder.paymentMethod === 'bankak' 
                            ? bankakLogo 
                            : createdOrder.paymentMethod === 'okash' 
                            ? okashLogo 
                            : fawryLogo
                        } 
                        alt="لوقو" 
                        referrerPolicy="no-referrer"
                        className="w-5 h-5 object-contain rounded bg-white p-0.5"
                      />
                      <span>طريقة الدفع: <strong className="text-amber-300 font-bold">{createdOrder.paymentMethod === 'bankak' ? 'بنكك (Bankak)' : createdOrder.paymentMethod === 'okash' ? 'أوكاش (O-CASH)' : 'فوري (Fawry)'}</strong></span>
                    </div>
                    {createdOrder.bankakTransactionId && (
                      <span>رقم الإشعار المرجعي: <strong className="font-mono text-white bg-emerald-900 px-2 py-0.5 rounded border border-emerald-700">{createdOrder.bankakTransactionId}</strong></span>
                    )}
                  </div>

                  {createdOrder.bankakProofUrl && (
                    <div className="pt-2 border-t border-emerald-800/60 flex items-center gap-3">
                      <span className="text-emerald-200 text-[11px]">صورة إشعار التحويل المرفقة:</span>
                      <img 
                        src={createdOrder.bankakProofUrl} 
                        alt="إشعار التحويل" 
                        className="w-16 h-16 object-cover rounded-lg border-2 border-emerald-400 bg-white cursor-pointer hover:opacity-90 transition-opacity"
                        onClick={() => window.open(createdOrder.bankakProofUrl, '_blank')}
                      />
                    </div>
                  )}
                </div>
              </div>

            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={() => {
                  setCreatedOrder(null);
                  setFiles([]);
                  setBankakTransactionId('');
                  setBankakProofUrl('');
                }}
                className="flex-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold py-3 px-4 rounded-xl text-center transition-colors shadow"
              >
                إنشاء طلب طباعة جديد
              </button>
              <button
                onClick={() => window.print()}
                className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold py-3 px-4 rounded-xl text-center transition-colors flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                طباعة إيصال الطلب
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-6 px-4">
      
      {/* Title Header */}
      <div className="text-center mb-6">
        <h1 className="text-xl sm:text-3xl font-black text-slate-900 tracking-tight">
          {isLibraryOrder ? 'تفاصيل ومعاينة الشيتات المختارة للطباعة' : 'طباعة مستنداتك الخاصة'}
        </h1>
      </div>

      <form onSubmit={handleSubmitOrder} className="space-y-8">

        {/* SECTION 1: File Upload & Drag-Drop */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 font-bold flex items-center justify-center">
              1
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900">
              {isLibraryOrder ? 'المواد والشيتات الدراسية المختارة من المكتبة' : 'رفع الملفات والمستندات (PDF, Word, الصور)'}
            </h2>
          </div>

          {isLibraryOrder ? (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-emerald-950 mb-2 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-600 text-white rounded-xl shadow-sm shrink-0">
                  <BookOpen className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-black text-sm sm:text-base text-emerald-950">
                    الشيتات والمذكرات الدراسية المختارة من المكتبة
                  </h3>
                  <p className="text-xs text-emerald-800 mt-0.5">
                    تم تحميل الشيتات والمذكرات المحددة تلقائياً من المكتبة وتجهيز خيارات طباعتها.
                  </p>
                </div>
              </div>
              <span className="bg-emerald-100 text-emerald-900 border border-emerald-300 text-xs px-3 py-1.5 rounded-xl font-bold shrink-0">
                مجهزة للطباعة ✓
              </span>
            </div>
          ) : files.length === 0 && (
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              className="border-2 border-dashed border-slate-300 hover:border-amber-500 bg-slate-50 hover:bg-amber-50/50 rounded-2xl p-8 text-center cursor-pointer transition-all group"
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                multiple
                accept=".pdf,.doc,.docx,.ppt,.pptx,.jpg,.jpeg,.png"
                className="hidden"
              />
              <div className="w-16 h-16 bg-amber-100 group-hover:bg-amber-200 text-amber-800 rounded-2xl flex items-center justify-center mx-auto mb-3 transition-all group-hover:scale-110">
                <Upload className="w-8 h-8" />
              </div>
              <h3 className="font-bold text-slate-800 text-base sm:text-lg">
                اضغط هنا لاختيار الملفات أو اسحبها وأسقطها
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                يدعم ملفات PDF، مذكرات Word، الشيتات، والمستندات المصورة (حجم أقصى 50MB للملف)
              </p>
            </div>
          )}

          {/* List of uploaded files & options */}
          {files.length > 0 && (
            <div className="mt-6 space-y-6">
              
              {/* Header & View Mode Switcher */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-100 p-3 rounded-2xl border border-slate-200">
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-slate-900 text-sm sm:text-base">
                    المواد والشيتات المحددة ({files.length}):
                  </span>
                  <span className="text-xs text-amber-900 bg-amber-200 px-2.5 py-0.5 rounded-full font-bold">
                    {totalPagesSum} صفحة إجمالية
                  </span>
                </div>

                {/* Switcher Buttons */}
                <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-slate-300 w-full sm:w-auto justify-center">
                  <button
                    type="button"
                    onClick={() => setPreviewMode('compact')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      previewMode === 'compact'
                        ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>المعاينة الشاملة والمختصرة 🎨</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPreviewMode('detailed')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      previewMode === 'detailed'
                        ? 'bg-slate-800 text-white font-black shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>العرض التفصيلي لكل شيت ⚙️</span>
                  </button>
                </div>
              </div>

              {/* View Mode 1: Compact All Materials Visual Matrix */}
              {previewMode === 'compact' ? (
                <AllMaterialsPrintPreview
                  files={files}
                  onUpdateFileOption={updateFileOption}
                  onRemoveFile={removeFile}
                  isLibraryOrder={isLibraryOrder}
                  academicPath={extractedAcademicPath}
                />
              ) : (
                /* View Mode 2: Detailed Per-File Cards */
                <div className="space-y-6">
                  {files.map((file, idx) => (
                    <div 
                      key={file.id} 
                      className="bg-slate-50 rounded-xl p-4 sm:p-6 border border-slate-200 relative space-y-4"
                    >
                      <button
                        type="button"
                        onClick={() => removeFile(file.id)}
                        className="absolute top-4 left-4 text-slate-400 hover:text-rose-600 transition-colors p-1"
                        title="حذف الملف"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>

                      {/* File name & size */}
                      <div className="flex items-center gap-3 pl-8">
                        <div className="p-3 bg-amber-500 text-slate-950 rounded-lg">
                          <FileText className="w-6 h-6" />
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-900 text-sm sm:text-base line-clamp-1">
                            {file.fileName}
                          </h4>
                          <p className="text-xs text-slate-500">
                            حجم الملف: {(file.fileSize / (1024 * 1024)).toFixed(2)} MB
                          </p>
                        </div>
                      </div>

                      {/* Options Grid for this file */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs sm:text-sm pt-2">
                        
                        {/* Page Count */}
                        <div>
                          <label className="block text-slate-700 font-semibold mb-1">
                            عدد صفحات المستند الأصلي:
                          </label>
                          <input
                            type="number"
                            min="1"
                            max="2000"
                            value={file.pageCount}
                            onChange={e => updateFileOption(file.id, { pageCount: parseInt(e.target.value) || 1 })}
                            className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-bold focus:ring-2 focus:ring-amber-500 focus:outline-none"
                          />
                          <div className="mt-1.5 p-2 bg-emerald-50/90 border border-emerald-300 rounded-lg text-xs space-y-0.5">
                            <div className="flex items-center justify-between text-emerald-950 font-bold">
                              <span>الورق المطبوع (÷{file.pagesPerSheet || 1}):</span>
                              <span className="text-amber-800 text-sm font-extrabold bg-white px-2 py-0.5 rounded border border-amber-300">
                                {Math.ceil(file.pageCount / (file.pagesPerSheet || 1))} ورقة
                              </span>
                            </div>
                            {file.sides === 'double' && (
                              <p className="text-[10px] text-emerald-800 font-medium">
                                ورق وجهين: {Math.ceil(Math.ceil(file.pageCount / (file.pagesPerSheet || 1)) / 2)} ورقة مزدوجة
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Pages Per Sheet (Layout / Slides & Visual Diagram) */}
                        <div className="sm:col-span-2 md:col-span-3 lg:col-span-4 mt-2">
                          <SheetLayoutPreview
                            pagesPerSheet={file.pagesPerSheet || 1}
                            sides={file.sides}
                            color={file.color}
                            pageCount={file.pageCount}
                            onSelectPagesPerSheet={(pps) => updateFileOption(file.id, { pagesPerSheet: pps })}
                            onSelectSides={(s) => updateFileOption(file.id, { sides: s })}
                            interactive={true}
                          />
                        </div>

                        {/* Paper Size - Fixed to A4 */}
                        <div>
                          <label className="block text-slate-700 font-semibold mb-1">
                            حجم الورق:
                          </label>
                          <div className="w-full bg-slate-100 border border-slate-300 rounded-lg px-3 py-2 text-slate-800 font-bold text-sm flex items-center justify-between">
                            <span>A4 (حجم قياسي)</span>
                            <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded font-medium border border-amber-300">ثابت</span>
                          </div>
                        </div>

                        {/* Number of Copies */}
                        <div>
                          <label className="block text-slate-700 font-semibold mb-1">
                            عدد النسخ المطلوبة:
                          </label>
                          <input
                            type="number"
                            min="1"
                            max="100"
                            value={file.copies}
                            onChange={e => updateFileOption(file.id, { copies: parseInt(e.target.value) || 1 })}
                            className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-bold focus:ring-2 focus:ring-amber-500 focus:outline-none"
                          />
                        </div>

                        {/* File Subtotal */}
                        <div className="flex flex-col justify-end">
                          <div className="bg-amber-100/80 p-2.5 rounded-lg border border-amber-200 text-center">
                            <span className="text-[11px] text-amber-900 block font-medium">تكلفة هذا الملف:</span>
                            <strong className="text-amber-950 font-bold text-base">
                              {formatSDG(file.calculatedPrice)}
                            </strong>
                          </div>
                        </div>

                      </div>
                    </div>
                  ))}
                </div>
              )}

              {!isLibraryOrder && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl border border-slate-300 flex items-center justify-center gap-2 transition-colors text-sm"
                >
                  <Plus className="w-4 h-4" />
                  إضافة ملف آخر لهذا الطلب
                </button>
              )}
            </div>
          )}
        </div>

        {/* SECTION 2: Customer & Delivery Information */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-200">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 font-bold flex items-center justify-center">
              2
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900">
              بيانات التواصل وطريقة التسليم
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-semibold text-slate-800 mb-1">
                الاسم الكامل *
              </label>
              <div className="relative">
                <User className="w-5 h-5 text-slate-400 absolute right-3 top-3" />
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={e => setCustomerName(e.target.value)}
                  placeholder="مثال: أحمد عبد الله علي"
                  className="w-full pr-10 pl-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none text-slate-900 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-800 mb-1">
                رقم الهاتف (واتساب / اتصال) *
              </label>
              <div className="relative">
                <Phone className="w-5 h-5 text-slate-400 absolute right-3 top-3" />
                <input
                  type="tel"
                  required
                  value={customerPhone}
                  onChange={e => setCustomerPhone(e.target.value)}
                  placeholder="مثال: 0119636365"
                  className="w-full pr-10 pl-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none text-slate-900 text-sm dir-ltr text-right"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-semibold text-slate-800 mb-1">
                الجامعة / المؤسسة التعليمية (اختياري)
              </label>
              <input
                type="text"
                value={institution}
                onChange={e => setInstitution(e.target.value)}
                placeholder="مثال: جامعة النيلين، جامعة الخرطوم..."
                className="w-full px-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none text-slate-900 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-800 mb-1">
                التخصص / الكلية / الدفعة (اختياري)
              </label>
              <input
                type="text"
                value={specialization}
                onChange={e => setSpecialization(e.target.value)}
                placeholder="مثال: طب وجراحة - الدفعة 29، أو كلية التجارة..."
                className="w-full px-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none text-slate-900 text-sm"
              />
            </div>
          </div>

          {/* Delivery Method Picker */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-slate-800 mb-2">
              خيار الاستلام والتوصيل:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              
              <div
                onClick={() => setDeliveryMethod('delivery')}
                className={`p-4 rounded-xl border-2 cursor-pointer flex items-center gap-3 transition-all ${
                  deliveryMethod === 'delivery'
                    ? 'border-amber-500 bg-amber-50/50 text-slate-950 font-bold'
                    : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
                }`}
              >
                <div className="p-2 rounded-lg bg-amber-500 text-slate-950">
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold">توصيل للمنزل أو الكلية/الجامعة</h4>
                  <p className="text-xs text-slate-500 font-normal">مندوبنا يوصل الشيتات إلى يدك</p>
                </div>
              </div>

              <div
                onClick={() => setDeliveryMethod('pickup')}
                className={`p-4 rounded-xl border-2 cursor-pointer flex items-center gap-3 transition-all ${
                  deliveryMethod === 'pickup'
                    ? 'border-amber-500 bg-amber-50/50 text-slate-950 font-bold'
                    : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
                }`}
              >
                <div className="p-2 rounded-lg bg-slate-800 text-amber-400">
                  <Store className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold">استلام مباشر من المكتبة (مجاناً)</h4>
                  <p className="text-xs text-slate-500 font-normal">تأتي لاستلامها جاهزة ومغلفة</p>
                </div>
              </div>

            </div>
          </div>

          {/* City & Address Inputs */}
          {deliveryMethod === 'delivery' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className="block text-sm font-semibold text-slate-800">
                  حدد منطقة التوصيل بالعاصمة أو إرسالية الولايات:
                </label>
                <button
                  type="button"
                  onClick={() => setShowDeliveryGuideModal(true)}
                  className="text-xs text-amber-600 hover:text-amber-700 font-bold underline flex items-center gap-1 cursor-pointer"
                >
                  <span>عرض جدول أسعار التوصيل والإرساليات الكامل 🗺️</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <select
                    value={city}
                    onChange={e => setCity(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-slate-900 text-sm font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  >
                    <optgroup label="👑 أمدرمان">
                      {DELIVERY_ZONES.filter(z => z.regionKey === 'omdurman').map(z => (
                        <option key={z.id} value={z.zoneName}>
                          {z.zoneName} ({formatSDG(z.fee)})
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="💧 بحري وشرق النيل">
                      {DELIVERY_ZONES.filter(z => z.regionKey === 'bahri_eastnile').map(z => (
                        <option key={z.id} value={z.zoneName}>
                          {z.zoneName} ({formatSDG(z.fee)})
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="🏙️ الخرطوم">
                      {DELIVERY_ZONES.filter(z => z.regionKey === 'khartoum').map(z => (
                        <option key={z.id} value={z.zoneName}>
                          {z.zoneName} ({formatSDG(z.fee)})
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="📦 باقي الولايات (إرساليات طرود)">
                      {DELIVERY_ZONES.filter(z => z.regionKey === 'states').map(z => (
                        <option key={z.id} value={z.zoneName}>
                          {z.zoneName} ({formatSDG(z.fee)})
                        </option>
                      ))}
                    </optgroup>
                  </select>
                </div>

                <div>
                  <div className="relative">
                    <MapPin className="w-5 h-5 text-slate-400 absolute right-3 top-3" />
                    <input
                      type="text"
                      required={deliveryMethod === 'delivery'}
                      value={addressOrCampus}
                      onChange={e => setAddressOrCampus(e.target.value)}
                      placeholder="العنوان التفصيلي / المجمع الجامعي / اسم المحطة أو الشارع"
                      className="w-full pr-10 pl-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none text-slate-900 text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Selected Zone Details Banner */}
              {selectedZone && (
                <div className="bg-amber-50/80 p-3.5 rounded-xl border border-amber-200 text-xs text-amber-950 flex items-start gap-2.5">
                  <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold text-amber-900 mb-0.5">
                      نطاق تغطية هذه المنطقة ({selectedZone.regionName}):
                    </div>
                    <div className="text-amber-800 leading-relaxed font-sans">
                      {selectedZone.details}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* SECTION 3: Payment & Summary */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-200">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 font-bold flex items-center justify-center">
              3
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900">
              طريقة الدفع وملخص التكلفة
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Payment Options */}
            <div className="space-y-4">
              <label className="block text-sm font-semibold text-slate-800">
                اختر طريقة الدفع المناسبة:
              </label>

              {/* Bankak Option */}
              <div 
                onClick={() => setPaymentMethod('bankak')}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  paymentMethod === 'bankak'
                    ? 'border-emerald-500 bg-emerald-50/50 shadow-sm'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <img 
                      src={bankakLogo} 
                      alt="لوقو بنكك" 
                      referrerPolicy="no-referrer"
                      className="w-9 h-9 object-contain rounded-xl border border-slate-200 shadow-sm bg-white p-0.5"
                    />
                    <div>
                      <strong className="text-slate-900 text-sm block">تحويل بنكك (Bankak)</strong>
                      <span className="text-[11px] text-slate-500 font-medium">بنك الخرطوم</span>
                    </div>
                  </div>
                  <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">موصى به</span>
                </div>

                <div className="text-xs text-slate-700 bg-white p-3 rounded-lg border border-emerald-200 space-y-1">
                  <div className="flex justify-between items-center">
                    <span>رقم حساب بنكك:</span>
                    <div className="flex items-center gap-2">
                      <strong className="text-emerald-950 font-black text-base font-mono">1926413</strong>
                      <button
                        type="button"
                        onClick={(e) => handleCopyAccount('1926413', e)}
                        className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1 shadow-xs cursor-pointer active:scale-95"
                        title="نسخ رقم حساب بنكك"
                      >
                        {copiedAccNum === '1926413' ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-200" />
                            <span className="text-[11px] font-extrabold text-emerald-100">تم النسخ!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span className="text-[11px]">نسخ</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>اسم صاحب الحساب:</span>
                    <strong className="text-slate-900 font-bold">محمد عثمان حاج شرفي عثمان</strong>
                  </div>
                </div>

                {paymentMethod === 'bankak' && (
                  <div className="mt-3 pt-3 border-t border-emerald-200 space-y-3">
                    <div className="bg-emerald-100/70 p-2.5 rounded-lg border border-emerald-200 text-xs text-emerald-950 flex items-start gap-2 font-medium">
                      <Info className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                      <span>إثبات الدفع: يمكنك إدخال رقم العملية المرجعي أو أرسال صورة الإشعار (أي خيار منهما يكفي لبدء وتأكيد الطلب).</span>
                    </div>

                    {/* Option A: Reference Number */}
                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-1">
                        1. رقم العملية / الإشعار المرجعي من بنكك (اختياري):
                      </label>
                      <input
                        type="text"
                        value={bankakTransactionId}
                        onChange={e => setBankakTransactionId(e.target.value)}
                        placeholder="أدخل رقم الإشعار المرجعي هنا (مثال: BNK-8491029)"
                        className="w-full bg-white border border-emerald-300 rounded-lg px-3 py-2 text-slate-900 font-mono text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>

                    {/* Option B: Screenshot / Image upload */}
                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-1">
                        2. أرسل صورة الإشعار / سكرين شوت التحويلة (اختياري):
                      </label>

                      {bankakProofUrl ? (
                        <div className="relative border border-emerald-300 rounded-xl p-2.5 bg-emerald-50 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <img 
                              src={bankakProofUrl} 
                              alt="إشعار التحويل" 
                              className="w-14 h-14 object-cover rounded-lg border border-emerald-300 bg-white shadow-sm"
                            />
                            <div className="text-xs">
                              <span className="font-bold text-emerald-950 block">تم إرفاق صورة الإشعار بنجاح ✅</span>
                              <span className="text-slate-600 text-[11px]">ستظهر الصورة لإدارة المكتبة للتأكيد الفوري</span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setBankakProofUrl('');
                              if (receiptInputRef.current) receiptInputRef.current.value = '';
                            }}
                            className="px-2.5 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg text-xs font-bold transition-colors flex items-center gap-1"
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>حذف</span>
                          </button>
                        </div>
                      ) : (
                        <div 
                          onClick={(e) => {
                            e.stopPropagation();
                            receiptInputRef.current?.click();
                          }}
                          className="border-2 border-dashed border-emerald-300 hover:border-emerald-500 bg-white hover:bg-emerald-50/50 p-3 rounded-xl cursor-pointer transition-all text-center group"
                        >
                          <input
                            type="file"
                            ref={receiptInputRef}
                            accept="image/*"
                            onChange={handleReceiptImageUpload}
                            className="hidden"
                          />
                          <div className="flex items-center justify-center gap-2 text-emerald-800 font-bold text-xs">
                            <Camera className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition-transform" />
                            <span>أرسل صورة الإشعار (اضغط هنا لرفع الصورة) 📷</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Okash Option */}
              <div 
                onClick={() => setPaymentMethod('okash')}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  paymentMethod === 'okash'
                    ? 'border-emerald-500 bg-emerald-50/50 shadow-sm'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <img 
                      src={okashLogo} 
                      alt="لوقو أوكاش" 
                      referrerPolicy="no-referrer"
                      className="w-9 h-9 object-contain rounded-xl border border-slate-200 shadow-sm bg-white p-0.5"
                    />
                    <div>
                      <strong className="text-slate-900 text-sm block">تحويل أوكاش (O-CASH)</strong>
                      <span className="text-[11px] text-slate-500 font-medium">بنك أم درمان الوطني</span>
                    </div>
                  </div>
                </div>

                <div className="text-xs text-slate-700 bg-white p-3 rounded-lg border border-emerald-200 space-y-1">
                  <div className="flex justify-between items-center">
                    <span>رقم حساب أوكاش:</span>
                    <div className="flex items-center gap-2">
                      <strong className="text-emerald-950 font-black text-base font-mono">798340</strong>
                      <button
                        type="button"
                        onClick={(e) => handleCopyAccount('798340', e)}
                        className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1 shadow-xs cursor-pointer active:scale-95"
                        title="نسخ رقم حساب أوكاش"
                      >
                        {copiedAccNum === '798340' ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-200" />
                            <span className="text-[11px] font-extrabold text-emerald-100">تم النسخ!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span className="text-[11px]">نسخ</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>اسم صاحب الحساب:</span>
                    <strong className="text-slate-900 font-bold">محمد عثمان حاج شرفي عثمان</strong>
                  </div>
                </div>

                {paymentMethod === 'okash' && (
                  <div className="mt-3 pt-3 border-t border-emerald-200 space-y-3">
                    <div className="bg-emerald-100/70 p-2.5 rounded-lg border border-emerald-200 text-xs text-emerald-950 flex items-start gap-2 font-medium">
                      <Info className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                      <span>إثبات الدفع: يمكنك إدخال رقم العملية المرجعي أو أرسال صورة الإشعار (أي خيار منهما يكفي لبدء وتأكيد الطلب).</span>
                    </div>

                    {/* Option A: Reference Number */}
                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-1">
                        1. رقم العملية / الإشعار المرجعي من أوكاش (اختياري):
                      </label>
                      <input
                        type="text"
                        value={bankakTransactionId}
                        onChange={e => setBankakTransactionId(e.target.value)}
                        placeholder="أدخل رقم العملية المرجعي من تطبيق أوكاش"
                        className="w-full bg-white border border-emerald-300 rounded-lg px-3 py-2 text-slate-900 font-mono text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>

                    {/* Option B: Screenshot / Image upload */}
                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-1">
                        2. أرسل صورة الإشعار / سكرين شوت التحويلة (اختياري):
                      </label>

                      {bankakProofUrl ? (
                        <div className="relative border border-emerald-300 rounded-xl p-2.5 bg-emerald-50 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <img 
                              src={bankakProofUrl} 
                              alt="إشعار التحويل" 
                              className="w-14 h-14 object-cover rounded-lg border border-emerald-300 bg-white shadow-sm"
                            />
                            <div className="text-xs">
                              <span className="font-bold text-emerald-950 block">تم إرفاق صورة الإشعار بنجاح ✅</span>
                              <span className="text-slate-600 text-[11px]">ستظهر الصورة لإدارة المكتبة للتأكيد الفوري</span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setBankakProofUrl('');
                              if (receiptInputRef.current) receiptInputRef.current.value = '';
                            }}
                            className="px-2.5 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg text-xs font-bold transition-colors flex items-center gap-1"
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>حذف</span>
                          </button>
                        </div>
                      ) : (
                        <div 
                          onClick={(e) => {
                            e.stopPropagation();
                            receiptInputRef.current?.click();
                          }}
                          className="border-2 border-dashed border-emerald-300 hover:border-emerald-500 bg-white hover:bg-emerald-50/50 p-3 rounded-xl cursor-pointer transition-all text-center group"
                        >
                          <input
                            type="file"
                            ref={receiptInputRef}
                            accept="image/*"
                            onChange={handleReceiptImageUpload}
                            className="hidden"
                          />
                          <div className="flex items-center justify-center gap-2 text-emerald-800 font-bold text-xs">
                            <Camera className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition-transform" />
                            <span>أرسل صورة الإشعار (اضغط هنا لرفع الصورة) 📷</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Fawry Option */}
              <div 
                onClick={() => setPaymentMethod('fawry')}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  paymentMethod === 'fawry'
                    ? 'border-emerald-500 bg-emerald-50/50 shadow-sm'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <img 
                      src={fawryLogo} 
                      alt="لوقو فوري" 
                      referrerPolicy="no-referrer"
                      className="w-9 h-9 object-contain rounded-xl border border-slate-200 shadow-sm bg-white p-0.5"
                    />
                    <div>
                      <strong className="text-slate-900 text-sm block">تحويل فوري (Fawry)</strong>
                      <span className="text-[11px] text-slate-500 font-medium">بنك فيصل الإسلامي</span>
                    </div>
                  </div>
                </div>

                <div className="text-xs text-slate-700 bg-white p-3 rounded-lg border border-emerald-200 space-y-1">
                  <div className="flex justify-between items-center">
                    <span>رقم حساب فوري:</span>
                    <div className="flex items-center gap-2">
                      <strong className="text-emerald-950 font-black text-base font-mono">51404329</strong>
                      <button
                        type="button"
                        onClick={(e) => handleCopyAccount('51404329', e)}
                        className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1 shadow-xs cursor-pointer active:scale-95"
                        title="نسخ رقم حساب فوري"
                      >
                        {copiedAccNum === '51404329' ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-200" />
                            <span className="text-[11px] font-extrabold text-emerald-100">تم النسخ!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span className="text-[11px]">نسخ</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>اسم صاحب الحساب:</span>
                    <strong className="text-slate-900 font-bold">محمد عثمان حاج شرفي عثمان</strong>
                  </div>
                </div>

                {paymentMethod === 'fawry' && (
                  <div className="mt-3 pt-3 border-t border-emerald-200 space-y-3">
                    <div className="bg-emerald-100/70 p-2.5 rounded-lg border border-emerald-200 text-xs text-emerald-950 flex items-start gap-2 font-medium">
                      <Info className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                      <span>إثبات الدفع: يمكنك إدخال رقم العملية المرجعي أو أرسال صورة الإشعار (أي خيار منهما يكفي لبدء وتأكيد الطلب).</span>
                    </div>

                    {/* Option A: Reference Number */}
                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-1">
                        1. رقم العملية / الإشعار المرجعي من فوري (اختياري):
                      </label>
                      <input
                        type="text"
                        value={bankakTransactionId}
                        onChange={e => setBankakTransactionId(e.target.value)}
                        placeholder="أدخل رقم العملية أو مرجع التحويل من فوري"
                        className="w-full bg-white border border-emerald-300 rounded-lg px-3 py-2 text-slate-900 font-mono text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>

                    {/* Option B: Screenshot / Image upload */}
                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-1">
                        2. أرسل صورة الإشعار / سكرين شوت التحويلة (اختياري):
                      </label>

                      {bankakProofUrl ? (
                        <div className="relative border border-emerald-300 rounded-xl p-2.5 bg-emerald-50 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <img 
                              src={bankakProofUrl} 
                              alt="إشعار التحويل" 
                              className="w-14 h-14 object-cover rounded-lg border border-emerald-300 bg-white shadow-sm"
                            />
                            <div className="text-xs">
                              <span className="font-bold text-emerald-950 block">تم إرفاق صورة الإشعار بنجاح ✅</span>
                              <span className="text-slate-600 text-[11px]">ستظهر الصورة لإدارة المكتبة للتأكيد الفوري</span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setBankakProofUrl('');
                              if (receiptInputRef.current) receiptInputRef.current.value = '';
                            }}
                            className="px-2.5 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg text-xs font-bold transition-colors flex items-center gap-1"
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>حذف</span>
                          </button>
                        </div>
                      ) : (
                        <div 
                          onClick={(e) => {
                            e.stopPropagation();
                            receiptInputRef.current?.click();
                          }}
                          className="border-2 border-dashed border-emerald-300 hover:border-emerald-500 bg-white hover:bg-emerald-50/50 p-3 rounded-xl cursor-pointer transition-all text-center group"
                        >
                          <input
                            type="file"
                            ref={receiptInputRef}
                            accept="image/*"
                            onChange={handleReceiptImageUpload}
                            className="hidden"
                          />
                          <div className="flex items-center justify-center gap-2 text-emerald-800 font-bold text-xs">
                            <Camera className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition-transform" />
                            <span>أرسل صورة الإشعار (اضغط هنا لرفع الصورة) 📷</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Special Order Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ملاحظات أو تعليمات خاصة للطباعة:
                </label>
                <textarea
                  rows={2}
                  value={orderNotes}
                  onChange={e => setOrderNotes(e.target.value)}
                  placeholder="مثال: يرجى جعل الغلاف كرتوني شفاف، أو طباعة أول 5 صفحات فقط..."
                  className="w-full border border-slate-300 rounded-xl p-3 text-xs text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

            </div>

            {/* Total Cost Breakdown Card */}
            <div className="bg-gradient-to-br from-emerald-900 via-emerald-800 to-emerald-950 text-white rounded-2xl p-6 flex flex-col justify-between border border-emerald-700 shadow-xl">
              <div>
                <h3 className="text-lg font-bold text-emerald-300 mb-4 border-b border-emerald-800 pb-3 flex items-center justify-between">
                  <span>ملخص فاتورة الطباعة</span>
                  <span className="text-xs font-normal text-emerald-200/80">العملة: جنيه سوداني</span>
                </h3>

                <div className="space-y-3 text-sm">
                  
                  {/* Customer Brief inside card */}
                  <div className="bg-emerald-950/70 p-3 rounded-xl border border-emerald-700/60 text-xs space-y-1.5">
                    <div className="text-emerald-300 font-bold border-b border-emerald-800 pb-1">
                      📋 تفاصيل مقدم الطلب الموحدة:
                    </div>
                    <div className="text-emerald-100 flex justify-between">
                      <span>اسم العميل:</span>
                      <strong className="text-white font-bold">{customerName || 'لم يدخل بعد'}</strong>
                    </div>
                    <div className="text-emerald-100 flex justify-between">
                      <span>الهاتف:</span>
                      <strong className="text-white font-mono">{customerPhone || 'لم يدخل بعد'}</strong>
                    </div>
                    {(institution || specialization) && (
                      <div className="text-emerald-200 text-[11px] pt-1 border-t border-emerald-800/60">
                        🎓 {institution} {specialization && `• ${specialization}`}
                      </div>
                    )}
                  </div>

                  {/* Materials list summary */}
                  {files.length > 0 && (
                    <div className="bg-emerald-950/80 p-3 rounded-xl border border-emerald-700/80 text-xs space-y-2">
                      <div className="text-emerald-300 font-bold border-b border-emerald-800 pb-1 flex justify-between items-center">
                        <span>📚 تفاصيل نمط طباعة المواد ({files.length}):</span>
                        <span className="text-[10px] text-emerald-200 font-mono">{totalPagesSum} صفحة ➔ {totalPrintedSheetsSum} ورقة</span>
                      </div>
                      <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1 custom-scrollbar">
                        {files.map((f, i) => {
                          const pps = f.pagesPerSheet || 1;
                          const sheetsPerCopy = Math.ceil(f.pageCount / pps);
                          const physicalPapers = Math.ceil(sheetsPerCopy / (f.sides === 'double' ? 2 : 1));

                          return (
                            <div key={i} className="text-emerald-100 text-[11px] bg-emerald-900/90 p-2 rounded-lg border border-emerald-700/70 space-y-1">
                              <div className="flex justify-between items-center">
                                <span className="font-bold text-white truncate max-w-[190px]">
                                  {i + 1}. {f.fileName}
                                </span>
                                <span className="text-amber-300 font-mono text-[11px] font-bold shrink-0">
                                  {formatSDG(f.calculatedPrice)}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5 flex-wrap text-[10px] font-medium text-emerald-200">
                                <span className="bg-emerald-800 px-1.5 py-0.5 rounded text-white font-bold">
                                  {pps === 2 ? '2:1 عادي' : pps === 4 ? '4:1 شائع ⭐' : pps === 8 ? '8:1 اسلايت' : `${pps} في 1`}
                                </span>
                                <span className="bg-emerald-800/80 px-1.5 py-0.5 rounded">
                                  وجهين 🔄
                                </span>
                                <span className="bg-amber-400 text-slate-950 px-1.5 py-0.5 rounded font-black font-mono">
                                  {physicalPapers * f.copies} ورقة مطبوعة
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div className="flex justify-between text-emerald-100/90">
                    <span>عدد الملفات:</span>
                    <strong className="text-white">{files.length} ملف</strong>
                  </div>
                  <div className="flex justify-between text-emerald-100/90">
                    <span>إجمالي صفحات المستندات الأصلية:</span>
                    <strong className="text-white">{totalPagesSum} صفحة</strong>
                  </div>
                  <div className="flex justify-between text-amber-300 font-bold bg-emerald-950/70 p-2.5 rounded-xl border border-emerald-700/80 my-1">
                    <span>عدد الورق المطبوع فعلياً (بعد التقسيم):</span>
                    <strong className="text-amber-300 text-sm">{totalPrintedSheetsSum} ورقة 🖨️</strong>
                  </div>
                  <div className="flex justify-between text-emerald-100/90">
                    <span>قيمة طباعة المستندات:</span>
                    <strong className="text-white">{formatSDG(subtotalSum)}</strong>
                  </div>
                  <div className="flex justify-between text-emerald-100/90">
                    <span>رسوم التوصيل ({city}):</span>
                    <strong className="text-white">{formatSDG(deliveryFee)}</strong>
                  </div>

                  {/* Coupon Box */}
                  <div className="bg-emerald-950/80 p-3 rounded-xl border border-emerald-700/80 space-y-2 my-2">
                    <label className="block text-xs font-bold text-emerald-200">
                      هل لديك كوبون / كود تخفيض؟ 🏷️
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={couponCodeInput}
                        onChange={e => setCouponCodeInput(e.target.value.toUpperCase())}
                        placeholder="أدخل كود الخصم (مثل BATCH29)"
                        className="flex-1 bg-emerald-950/90 border border-emerald-600/80 rounded-lg px-3 py-1.5 text-white font-mono font-bold text-xs focus:ring-2 focus:ring-amber-400 outline-none uppercase placeholder:text-emerald-300/60"
                      />
                      {appliedCoupon ? (
                        <button
                          type="button"
                          onClick={handleRemoveCoupon}
                          className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold shrink-0 cursor-pointer transition-colors"
                        >
                          إلغاء الخصم
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={handleApplyCoupon}
                          className="px-3.5 py-1.5 bg-amber-400 hover:bg-amber-500 text-slate-950 rounded-lg text-xs font-black shrink-0 cursor-pointer transition-colors"
                        >
                          تطبيق 🏷️
                        </button>
                      )}
                    </div>
                    {couponError && (
                      <p className="text-[11px] text-rose-300 font-bold bg-rose-950/90 p-2 rounded border border-rose-800">
                        {couponError}
                      </p>
                    )}
                    {couponSuccess && (
                      <p className="text-[11px] text-emerald-300 font-bold bg-emerald-900/90 p-2 rounded border border-emerald-500">
                        {couponSuccess}
                      </p>
                    )}
                  </div>

                  {discountAmount > 0 && (
                    <div className="flex justify-between text-amber-300 font-black bg-amber-950/40 p-2 rounded-lg border border-amber-500/40">
                      <span>تخفيض الكوبون ({appliedCoupon?.code} - {appliedCoupon?.discountPercentage}%):</span>
                      <strong className="text-amber-300 font-mono text-sm">- {formatSDG(discountAmount)}</strong>
                    </div>
                  )}

                  <div className="pt-4 border-t border-emerald-800/80 flex justify-between items-baseline">
                    <span className="text-base font-bold text-white">المبلغ الإجمالي المستحق:</span>
                    <span className="text-2xl font-black text-emerald-300">
                      {formatSDG(totalAmount)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-emerald-800/80">
                <button
                  type="submit"
                  disabled={isSubmitting || files.length === 0}
                  className="w-full bg-emerald-400 hover:bg-emerald-300 active:scale-[0.99] disabled:opacity-50 text-emerald-950 font-black py-4 px-6 rounded-xl shadow-lg transition-all text-center text-base sm:text-lg flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isSubmitting ? (
                    <span>جاري تأكيد الطباعة...</span>
                  ) : (
                    <>
                      <FileCheck className="w-5 h-5 text-emerald-950" />
                      <span>تأكيد وإرسال طلب الطباعة</span>
                    </>
                  )}
                </button>
                <p className="text-[11px] text-emerald-200/80 text-center mt-2">
                  بمجرد إرسال الطلب ستحصل على كود متابعة لمشاهدة مرحلة الطباعة والتغليف والتوصيل
                </p>
              </div>

            </div>

          </div>
        </div>

      </form>

      {/* Delivery Guide Modal */}
      {showDeliveryGuideModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm p-4 flex items-center justify-center overflow-y-auto">
          <div className="w-full max-w-3xl my-8">
            <DeliveryRatesGuide
              isOpen={true}
              onClose={() => setShowDeliveryGuideModal(false)}
              onSelectZone={(selectedZoneText) => {
                setCity(selectedZoneText);
                setShowDeliveryGuideModal(false);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
