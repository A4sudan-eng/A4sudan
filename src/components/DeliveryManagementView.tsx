import React, { useState, useMemo } from 'react';
import { 
  Truck, Plus, Search, Filter, Edit, Trash2, CheckCircle2, 
  MapPin, DollarSign, Building2, AlertCircle, RefreshCw, 
  RotateCcw, Sparkles, Navigation, Layers, ChevronDown, 
  Check, X, Eye, EyeOff, ShieldCheck, Download, Info
} from 'lucide-react';
import { DeliveryZone } from '../types';
import { 
  SUDANESE_STATES, 
  KHARTOUM_LOCALITIES, 
  OTHER_COMMON_LOCALITIES,
  normalizeDeliveryZone,
  saveStoredDeliveryZones
} from '../utils/deliveryManager';
import { formatSDG } from '../utils/pricing';

interface DeliveryManagementViewProps {
  deliveryZones: DeliveryZone[];
  onUpdateZones: (zones: DeliveryZone[]) => void;
  onResetZones?: () => void;
}

export const DeliveryManagementView: React.FC<DeliveryManagementViewProps> = ({
  deliveryZones,
  onUpdateZones,
  onResetZones,
}) => {
  // State for search and filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStateFilter, setSelectedStateFilter] = useState<string>('all');
  const [selectedLocalityFilter, setSelectedLocalityFilter] = useState<string>('all');

  // Form states for Add / Edit
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formState, setFormState] = useState<string>('ولاية الخرطوم');
  const [formLocality, setFormLocality] = useState<string>('محلية كرري');
  const [formNeighborhood, setFormNeighborhood] = useState<string>('');
  const [formZoneName, setFormZoneName] = useState<string>('');
  const [formFee, setFormFee] = useState<number | string>(5000);
  const [formDetails, setFormDetails] = useState<string>('');
  const [formIsActive, setFormIsActive] = useState<boolean>(true);

  // Notifications / Feedback
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [showResetConfirmModal, setShowResetConfirmModal] = useState(false);
  const [showFormModal, setShowFormModal] = useState(false);

  const showFeedback = (text: string, type: 'success' | 'error' = 'success') => {
    setFeedbackMessage({ type, text });
    setTimeout(() => {
      setFeedbackMessage(null);
    }, 4000);
  };

  // Localities available for currently selected form state
  const availableLocalitiesForForm = useMemo(() => {
    if (formState === 'ولاية الخرطوم') {
      return KHARTOUM_LOCALITIES;
    }
    if (OTHER_COMMON_LOCALITIES[formState]) {
      return OTHER_COMMON_LOCALITIES[formState];
    }
    return ['محلية المركز والمدينة', 'مكاتب الترحيلات والنقل السريع'];
  }, [formState]);

  // Extract unique states and localities for filter dropdowns
  const uniqueStates = useMemo(() => {
    const states = new Set<string>();
    deliveryZones.forEach(z => {
      if (z.state) states.add(z.state);
    });
    return Array.from(states);
  }, [deliveryZones]);

  const uniqueLocalities = useMemo(() => {
    const locs = new Set<string>();
    deliveryZones.forEach(z => {
      if (selectedStateFilter === 'all' || z.state === selectedStateFilter) {
        if (z.locality) locs.add(z.locality);
      }
    });
    return Array.from(locs);
  }, [deliveryZones, selectedStateFilter]);

  // Filtered zones list
  const filteredZones = useMemo(() => {
    return deliveryZones.filter(zone => {
      const matchSearch = 
        !searchTerm.trim() ||
        zone.state?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        zone.locality?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        zone.neighborhood?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        zone.zoneName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        zone.details?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(zone.fee).includes(searchTerm);

      const matchState = selectedStateFilter === 'all' || zone.state === selectedStateFilter;
      const matchLocality = selectedLocalityFilter === 'all' || zone.locality === selectedLocalityFilter;

      return matchSearch && matchState && matchLocality;
    });
  }, [deliveryZones, searchTerm, selectedStateFilter, selectedLocalityFilter]);

  // Statistics
  const stats = useMemo(() => {
    const activeZones = deliveryZones.filter(z => z.isActive !== false);
    const fees = activeZones.map(z => z.fee).filter(f => f > 0);
    const avgFee = fees.length > 0 ? Math.round(fees.reduce((a, b) => a + b, 0) / fees.length) : 0;
    const minFee = fees.length > 0 ? Math.min(...fees) : 0;
    const maxFee = fees.length > 0 ? Math.max(...fees) : 0;

    return {
      total: deliveryZones.length,
      active: activeZones.length,
      statesCount: uniqueStates.length,
      avgFee,
      minFee,
      maxFee,
    };
  }, [deliveryZones, uniqueStates]);

  // Open Form to Add
  const handleOpenAdd = () => {
    setIsEditing(false);
    setEditingId(null);
    setFormState('ولاية الخرطوم');
    setFormLocality('محلية كرري');
    setFormNeighborhood('');
    setFormZoneName('');
    setFormFee(5000);
    setFormDetails('');
    setFormIsActive(true);
    setShowFormModal(true);
  };

  // Open Form to Edit
  const handleOpenEdit = (zone: DeliveryZone) => {
    setIsEditing(true);
    setEditingId(zone.id);
    setFormState(zone.state || 'ولاية الخرطوم');
    setFormLocality(zone.locality || 'محلية كرري');
    setFormNeighborhood(zone.neighborhood || zone.zoneName);
    setFormZoneName(zone.zoneName);
    setFormFee(zone.fee);
    setFormDetails(zone.details || '');
    setFormIsActive(zone.isActive !== false);
    setShowFormModal(true);
  };

  // Save Add / Edit Zone
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formNeighborhood.trim() && !formZoneName.trim()) {
      alert('الرجاء كتابة اسم الحي أو المنطقة أو العنوان');
      return;
    }

    const feeNum = Number(formFee) || 0;
    if (feeNum < 0) {
      alert('الرجاء إدخال سعر توصيل صحيح');
      return;
    }

    const finalNeighborhood = formNeighborhood.trim() || formZoneName.trim();
    const finalZoneName = formZoneName.trim() || `${formLocality} - ${finalNeighborhood}`;

    // Derive regionKey for backward compatibility
    let derivedRegionKey = 'omdurman';
    const textToCheck = `${formState} ${formLocality} ${finalZoneName}`;
    if (textToCheck.includes('بحري') || textToCheck.includes('شرق النيل')) {
      derivedRegionKey = 'bahri_eastnile';
    } else if (textToCheck.includes('الخرطوم') && !textToCheck.includes('أمدرمان') && !textToCheck.includes('كرري') && !textToCheck.includes('أمبدة')) {
      derivedRegionKey = 'khartoum';
    } else if (formState !== 'ولاية الخرطوم') {
      derivedRegionKey = 'states';
    }

    let updatedList: DeliveryZone[];

    if (isEditing && editingId) {
      updatedList = deliveryZones.map(z => {
        if (z.id === editingId) {
          return normalizeDeliveryZone({
            ...z,
            state: formState,
            locality: formLocality,
            neighborhood: finalNeighborhood,
            zoneName: finalZoneName,
            fee: feeNum,
            details: formDetails.trim() || `${formState} - ${formLocality} - ${finalNeighborhood}`,
            regionKey: derivedRegionKey,
            regionName: formLocality,
            isActive: formIsActive,
          });
        }
        return z;
      });
      showFeedback(`تم تحديث منطقة (${finalZoneName}) وسعر التوصيل (${formatSDG(feeNum)}) بنجاح!`);
    } else {
      const newZoneId = `zone_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const newZone: DeliveryZone = normalizeDeliveryZone({
        id: newZoneId,
        state: formState,
        locality: formLocality,
        neighborhood: finalNeighborhood,
        zoneName: finalZoneName,
        fee: feeNum,
        details: formDetails.trim() || `${formState} - ${formLocality} - ${finalNeighborhood}`,
        regionKey: derivedRegionKey,
        regionName: formLocality,
        isActive: formIsActive,
      });

      updatedList = [newZone, ...deliveryZones];
      showFeedback(`تمت إضافة منطقة التوصيل الجديدة (${finalZoneName}) بسعر ${formatSDG(feeNum)} وستظهر فوراً في قائمة الطلبات!`);
    }

    onUpdateZones(updatedList);
    await saveStoredDeliveryZones(updatedList);
    setShowFormModal(false);
  };

  // Toggle Active/Inactive
  const handleToggleActive = async (id: string) => {
    const updated = deliveryZones.map(z => {
      if (z.id === id) {
        const nextActive = !(z.isActive !== false);
        return { ...z, isActive: nextActive };
      }
      return z;
    });
    onUpdateZones(updated);
    await saveStoredDeliveryZones(updated);
    showFeedback('تم تغيير حالة تفعيل المنطقة بنجاح');
  };

  // Delete Zone
  const handleDeleteZone = async (id: string) => {
    const target = deliveryZones.find(z => z.id === id);
    const updated = deliveryZones.filter(z => z.id !== id);
    onUpdateZones(updated);
    await saveStoredDeliveryZones(updated);
    setDeleteConfirmId(null);
    showFeedback(`تم حذف منطقة (${target?.zoneName || ''}) من جدول التوصيل بنجاح`);
  };

  // Quick Inline Price Change
  const handleQuickPriceChange = async (id: string, newPrice: number) => {
    if (newPrice < 0) return;
    const updated = deliveryZones.map(z => {
      if (z.id === id) {
        return { ...z, fee: newPrice };
      }
      return z;
    });
    onUpdateZones(updated);
    await saveStoredDeliveryZones(updated);
    showFeedback(`تم تحديث سعر التوصيل إلى ${formatSDG(newPrice)} بنجاح`);
  };

  return (
    <div className="space-y-6 text-right font-sans animate-in fade-in duration-200">
      
      {/* Top Banner & Header */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 p-6 rounded-3xl text-white shadow-xl border border-emerald-700/50 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-14 h-14 rounded-2xl bg-amber-400/20 border border-amber-400/40 text-amber-300 flex items-center justify-center shrink-0 shadow-inner">
            <Truck className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-black text-white">إدارة مناطق وأسعار التوصيل والإرساليات</h2>
              <span className="text-[11px] bg-amber-400 text-amber-950 px-2.5 py-0.5 rounded-full font-black">
                تحديث فوري ⚡
              </span>
            </div>
            <p className="text-xs sm:text-sm text-emerald-200/90 mt-1 leading-relaxed">
              تحكم كامل في الولايات والمحليات والأحياء والوصف التفصيلي وأسعار التوصيل. أي إضافة أو تعديل ينعكس فوراً في مستطيل اختيار العنوان بصفحة طلب الطباعة!
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto shrink-0">
          <button
            type="button"
            onClick={handleOpenAdd}
            className="flex-1 md:flex-none px-4 py-3 rounded-2xl bg-amber-400 hover:bg-amber-300 active:scale-95 text-amber-950 font-black text-xs sm:text-sm transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer"
          >
            <Plus className="w-5 h-5 stroke-[3]" />
            <span>إضافة منطقة توصيل جديدة</span>
          </button>

          {onResetZones && (
            <button
              type="button"
              onClick={() => setShowResetConfirmModal(true)}
              className="px-3.5 py-3 rounded-2xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-600/50 text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 cursor-pointer"
              title="استعادة تسعيرة ومناطق التوصيل القياسية الافتراضية"
            >
              <RotateCcw className="w-4 h-4 text-slate-400" />
              <span className="hidden sm:inline">استعادة الافتراضي</span>
            </button>
          )}
        </div>
      </div>

      {/* Feedback Banner */}
      {feedbackMessage && (
        <div className={`p-4 rounded-2xl border flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 ${
          feedbackMessage.type === 'success'
            ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
            : 'bg-rose-50 border-rose-300 text-rose-900'
        }`}>
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="text-xs sm:text-sm font-black">{feedbackMessage.text}</span>
          </div>
          <button
            onClick={() => setFeedbackMessage(null)}
            className="text-xs font-bold px-2 py-1 hover:opacity-75"
          >
            ✕
          </button>
        </div>
      )}

      {/* Quick Summary Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <span className="text-[11px] font-bold text-slate-500 block">إجمالي المناطق المسجلة</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-black text-slate-900">{stats.total}</span>
            <span className="text-[11px] text-emerald-600 font-bold">منطقة</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <span className="text-[11px] font-bold text-slate-500 block">المناطق المفعلة للطلب</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-black text-emerald-600">{stats.active}</span>
            <span className="text-[11px] text-slate-500 font-bold">نشطة</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <span className="text-[11px] font-bold text-slate-500 block">عدد الولايات المغطاة</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-black text-blue-600">{stats.statesCount}</span>
            <span className="text-[11px] text-slate-500 font-bold">ولاية</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <span className="text-[11px] font-bold text-slate-500 block">متوسط سعر التوصيل</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-xl font-black text-amber-600">{formatSDG(stats.avgFee)}</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between col-span-2 sm:col-span-1">
          <span className="text-[11px] font-bold text-slate-500 block">نطاق الأسعار (أدنى - أعلى)</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-xs font-bold text-slate-700">
              {formatSDG(stats.minFee)} - {formatSDG(stats.maxFee)}
            </span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row items-center gap-3">
          
          {/* Search Box */}
          <div className="relative flex-1 w-full">
            <Search className="w-4.5 h-4.5 text-slate-400 absolute right-3.5 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="ابحث باسم الولاية، المحلية، الحي، المعالم أو السعر..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pr-10 pl-4 py-2.5 text-xs sm:text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none transition-all font-medium"
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')}
                className="absolute left-3 top-3 text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                ✕
              </button>
            )}
          </div>

          {/* State Filter */}
          <div className="w-full md:w-56">
            <select
              value={selectedStateFilter}
              onChange={e => {
                setSelectedStateFilter(e.target.value);
                setSelectedLocalityFilter('all');
              }}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs sm:text-sm font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
            >
              <option value="all">📍 جميع الولايات ({uniqueStates.length})</option>
              {uniqueStates.map(st => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>

          {/* Locality Filter */}
          <div className="w-full md:w-56">
            <select
              value={selectedLocalityFilter}
              onChange={e => setSelectedLocalityFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs sm:text-sm font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
            >
              <option value="all">🏙️ جميع المحليات ({uniqueLocalities.length})</option>
              {uniqueLocalities.map(loc => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Quick State Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs scrollbar-thin">
          <span className="text-[11px] font-black text-slate-500 shrink-0 ml-1">تصفية سريعة:</span>
          <button
            onClick={() => { setSelectedStateFilter('all'); setSelectedLocalityFilter('all'); }}
            className={`px-2.5 py-1 rounded-lg font-bold shrink-0 transition-all cursor-pointer ${
              selectedStateFilter === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            الكل ({deliveryZones.length})
          </button>
          {['ولاية الخرطوم', 'ولاية الجزيرة', 'ولاية نهر النيل', 'ولاية البحر الأحمر'].map(st => {
            const count = deliveryZones.filter(z => z.state === st).length;
            return (
              <button
                key={st}
                onClick={() => { setSelectedStateFilter(st); setSelectedLocalityFilter('all'); }}
                className={`px-2.5 py-1 rounded-lg font-bold shrink-0 transition-all cursor-pointer ${
                  selectedStateFilter === st
                    ? 'bg-amber-400 text-amber-950 shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                {st} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Delivery Zones Table / Cards */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between gap-3 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-amber-500" />
            <h3 className="text-sm sm:text-base font-black text-slate-900">
              قائمة مناطق التوصيل والأسعار ({filteredZones.length} منطقة)
            </h3>
          </div>
          <span className="text-[11px] text-slate-500 font-bold hidden sm:inline">
            يتم تطبيق الأسعار والتعديلات بشكل فوري في استمارة الطلب
          </span>
        </div>

        {filteredZones.length === 0 ? (
          <div className="p-12 text-center text-slate-500 space-y-3">
            <Truck className="w-12 h-12 text-slate-300 mx-auto" />
            <p className="text-sm font-bold text-slate-700">لا توجد مناطق توصيل تطابق البحث أو التصفية الحالية</p>
            <button
              onClick={() => { setSearchTerm(''); setSelectedStateFilter('all'); setSelectedLocalityFilter('all'); }}
              className="text-xs text-amber-600 font-bold underline hover:text-amber-700"
            >
              إلغاء التصفية وعرض جميع المناطق
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs sm:text-sm border-collapse">
              <thead>
                <tr className="bg-slate-100/80 text-slate-700 border-b border-slate-200 font-black text-[11px] sm:text-xs">
                  <th className="py-3.5 px-4">الولاية والمحلية</th>
                  <th className="py-3.5 px-4">الحي / المنطقة</th>
                  <th className="py-3.5 px-4 min-w-[200px]">الوصف التفصيلي والحدود والمعالم</th>
                  <th className="py-3.5 px-4 text-center">سعر التوصيل (ج.س)</th>
                  <th className="py-3.5 px-4 text-center">الحالة</th>
                  <th className="py-3.5 px-4 text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredZones.map(zone => {
                  const isActive = zone.isActive !== false;
                  return (
                    <tr 
                      key={zone.id} 
                      className={`hover:bg-amber-50/40 transition-colors ${!isActive ? 'opacity-50 bg-slate-50/50' : ''}`}
                    >
                      {/* State & Locality */}
                      <td className="py-3.5 px-4 align-top">
                        <div className="space-y-1">
                          <span className="inline-block bg-slate-100 text-slate-700 font-black text-[10px] px-2 py-0.5 rounded-md border border-slate-200">
                            {zone.state || 'ولاية الخرطوم'}
                          </span>
                          <div className="font-bold text-slate-900 text-xs sm:text-sm flex items-center gap-1">
                            <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>{zone.locality || 'محلية عامة'}</span>
                          </div>
                        </div>
                      </td>

                      {/* Neighborhood / Zone Name */}
                      <td className="py-3.5 px-4 align-top">
                        <div className="font-black text-slate-900 text-xs sm:text-sm">
                          {zone.neighborhood || zone.zoneName}
                        </div>
                        {zone.zoneName && zone.zoneName !== zone.neighborhood && (
                          <div className="text-[11px] text-slate-500 mt-0.5 font-medium line-clamp-1">
                            العنوان بالطلب: {zone.zoneName}
                          </div>
                        )}
                      </td>

                      {/* Details & Coverage Boundaries */}
                      <td className="py-3.5 px-4 align-top">
                        <p className="text-xs text-slate-600 leading-relaxed font-medium">
                          {zone.details || 'تغطية شاملة للمنطقة والمحطات الرئيسية'}
                        </p>
                      </td>

                      {/* Price / Fee */}
                      <td className="py-3.5 px-4 align-top text-center">
                        <div className="inline-flex flex-col items-center">
                          <span className="text-sm sm:text-base font-black text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-xl shadow-xs">
                            {formatSDG(zone.fee)}
                          </span>
                          
                          {/* Quick Adjust Price Chips */}
                          <div className="flex items-center gap-1 mt-1.5">
                            <button
                              onClick={() => handleQuickPriceChange(zone.id, zone.fee + 1000)}
                              className="text-[10px] font-bold bg-slate-100 hover:bg-emerald-100 hover:text-emerald-800 text-slate-600 px-1.5 py-0.5 rounded transition-all cursor-pointer"
                              title="زيادة 1000 ج.س"
                            >
                              +1,000
                            </button>
                            <button
                              onClick={() => handleQuickPriceChange(zone.id, Math.max(0, zone.fee - 1000))}
                              className="text-[10px] font-bold bg-slate-100 hover:bg-rose-100 hover:text-rose-800 text-slate-600 px-1.5 py-0.5 rounded transition-all cursor-pointer"
                              title="تخفيض 1000 ج.س"
                            >
                              -1,000
                            </button>
                          </div>
                        </div>
                      </td>

                      {/* Active Status */}
                      <td className="py-3.5 px-4 align-top text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleActive(zone.id)}
                          className={`px-2.5 py-1 rounded-xl text-[11px] font-black inline-flex items-center gap-1 transition-all cursor-pointer border ${
                            isActive
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-300 hover:bg-emerald-200'
                              : 'bg-slate-200 text-slate-600 border-slate-300 hover:bg-slate-300'
                          }`}
                        >
                          {isActive ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-700" />
                              <span>مفعل بالطلب</span>
                            </>
                          ) : (
                            <>
                              <EyeOff className="w-3 h-3 text-slate-500" />
                              <span>معطل</span>
                            </>
                          )}
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 align-top text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(zone)}
                            className="p-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 transition-all cursor-pointer shadow-xs"
                            title="تعديل بيانات المنطقة والسعر"
                          >
                            <Edit className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => setDeleteConfirmId(zone.id)}
                            className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-all cursor-pointer shadow-xs"
                            title="حذف المنطقة"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL: ADD / EDIT DELIVERY ZONE FORM */}
      {showFormModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl p-5 sm:p-7 max-w-xl w-full border border-slate-200 shadow-2xl space-y-5 animate-in zoom-in-95 duration-150 text-right my-8 max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-900 flex items-center justify-center">
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900">
                    {isEditing ? 'تعديل بيانات منطقة التوصيل والسعر' : 'إضافة منطقة توصيل جديدة'}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    تظهر هذه المنطقة وسعرها فوراً في قائمة اختيار العنوان للعملاء
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowFormModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 flex items-center justify-center text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="space-y-4">
              
              {/* Field 1: State (الولاية) */}
              <div>
                <label className="block text-xs font-black text-slate-800 mb-1.5">
                  1. الولاية <span className="text-rose-500">*</span>
                </label>
                <div className="space-y-2">
                  <select
                    value={formState}
                    onChange={e => {
                      const st = e.target.value;
                      setFormState(st);
                      if (st === 'ولاية الخرطوم') {
                        setFormLocality('محلية كرري');
                      } else if (OTHER_COMMON_LOCALITIES[st]) {
                        setFormLocality(OTHER_COMMON_LOCALITIES[st][0]);
                      } else {
                        setFormLocality('محلية المركز والمدينة');
                      }
                    }}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-bold text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  >
                    {SUDANESE_STATES.map(st => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>

                  {/* Quick State Chips */}
                  <div className="flex flex-wrap gap-1.5">
                    {['ولاية الخرطوم', 'ولاية الجزيرة', 'ولاية نهر النيل', 'ولاية البحر الأحمر'].map(st => (
                      <button
                        type="button"
                        key={st}
                        onClick={() => {
                          setFormState(st);
                          if (st === 'ولاية الخرطوم') setFormLocality('محلية كرري');
                          else if (OTHER_COMMON_LOCALITIES[st]) setFormLocality(OTHER_COMMON_LOCALITIES[st][0]);
                        }}
                        className={`text-[11px] px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                          formState === st
                            ? 'bg-amber-400 text-amber-950 font-black shadow-xs'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Field 2: Locality (المحلية) */}
              <div>
                <label className="block text-xs font-black text-slate-800 mb-1.5">
                  2. المحلية <span className="text-rose-500">*</span>
                </label>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <select
                      value={formLocality}
                      onChange={e => setFormLocality(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-bold text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    >
                      {availableLocalitiesForForm.map(loc => (
                        <option key={loc} value={loc}>
                          {loc}
                        </option>
                      ))}
                      <option value="محلية أخرى (مخصصة)">محلية أخرى (مخصصة)</option>
                    </select>
                  </div>

                  {/* If custom locality selected or in Khartoum, show quick chips */}
                  {formState === 'ولاية الخرطوم' && (
                    <div className="flex flex-wrap gap-1.5">
                      {KHARTOUM_LOCALITIES.map(loc => (
                        <button
                          type="button"
                          key={loc}
                          onClick={() => setFormLocality(loc)}
                          className={`text-[11px] px-2 py-0.5 rounded-md font-bold transition-all cursor-pointer ${
                            formLocality === loc
                              ? 'bg-emerald-600 text-white font-black'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          {loc.replace('محلية ', '')}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Field 3: Neighborhood / Area (الحي والمنطقة) */}
              <div>
                <label className="block text-xs font-black text-slate-800 mb-1.5">
                  3. الحي أو المنطقة <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formNeighborhood}
                  onChange={e => setFormNeighborhood(e.target.value)}
                  placeholder="مثال: الثورة الحارات (1-60)، الجرافة، الروضة، الشنقيطي"
                  className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-bold text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">
                  اكتب اسم الحي أو الأحياء الرئيسية التابعة لهذه المنطقة
                </span>
              </div>

              {/* Field 4: Delivery Fee (سعر التوصيل ج.س) */}
              <div>
                <label className="block text-xs font-black text-slate-800 mb-1.5">
                  4. سعر التوصيل بالجنيه السوداني (SDG) <span className="text-rose-500">*</span>
                </label>
                <div className="space-y-2">
                  <div className="relative">
                    <input
                      type="number"
                      required
                      min="0"
                      step="500"
                      value={formFee}
                      onChange={e => setFormFee(e.target.value)}
                      placeholder="5000"
                      className="w-full bg-white border border-slate-300 rounded-xl pr-3.5 pl-24 py-2.5 text-sm sm:text-base font-black text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    />
                    <span className="absolute left-3 top-2.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-200">
                      ج.س (SDG)
                    </span>
                  </div>

                  {/* Preset Price Chips */}
                  <div className="flex flex-wrap gap-1.5">
                    {[5000, 7000, 8000, 10000, 12000, 15000, 18000].map(feeVal => (
                      <button
                        type="button"
                        key={feeVal}
                        onClick={() => setFormFee(feeVal)}
                        className={`text-[11px] px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                          Number(formFee) === feeVal
                            ? 'bg-emerald-600 text-white font-black shadow-xs'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        {formatSDG(feeVal)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Field 5: Detailed Description & Boundaries (الوصف التفصيلي) */}
              <div>
                <label className="block text-xs font-black text-slate-800 mb-1.5">
                  5. الوصف التفصيلي وحدود التغطية والمعالم
                </label>
                <textarea
                  rows={2}
                  value={formDetails}
                  onChange={e => setFormDetails(e.target.value)}
                  placeholder="مثال: يشمل جميع الحارات حتى موقف مواصلات الجرافة | الاستلام على الزلط الرئيسي أو المحطات المعتمدة"
                  className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-medium text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none resize-none"
                />
              </div>

              {/* Active Switch */}
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-xs font-black text-slate-900 block">تفعيل ظهور المنطقة في صفحة الطلب</span>
                  <span className="text-[11px] text-slate-500 font-medium">
                    عند التفعيل، تظهر المنطقة فوراً للعملاء للاختيار
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setFormIsActive(!formIsActive)}
                  className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                    formIsActive ? 'bg-emerald-500' : 'bg-slate-300'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform absolute top-0.5 ${
                      formIsActive ? 'left-1' : 'left-6'
                    }`}
                  />
                </button>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowFormModal(false)}
                  className="flex-1 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs sm:text-sm transition-all cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="flex-2 py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-amber-950 font-black text-xs sm:text-sm shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isEditing ? 'حفظ التعديلات' : 'إضافة المنطقة الآن'}</span>
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* MODAL: DELETE CONFIRMATION */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full border border-slate-200 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150 text-right">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            
            <div className="text-center">
              <h3 className="text-lg font-black text-slate-900">هل أنت متأكد من حذف منطقة التوصيل هذه؟</h3>
              <p className="text-xs text-slate-600 mt-1">
                سيتم إزالة المنطقة وسعرها من قائمة اختيار العنوان بالطلب.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs sm:text-sm transition-all cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={() => handleDeleteZone(deleteConfirmId)}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs sm:text-sm shadow-md transition-all cursor-pointer"
              >
                تأكيد الحذف
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: RESET CONFIRMATION */}
      {showResetConfirmModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full border border-slate-200 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150 text-right">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
              <RotateCcw className="w-6 h-6" />
            </div>
            
            <div className="text-center">
              <h3 className="text-lg font-black text-slate-900">استعادة مناطق وأسعار التوصيل الافتراضية؟</h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                سيتم استرجاع قائمة مناطق التوصيل القياسية لكافة محليات الخرطوم (كرري، أمدرمان، أمبدة، بحري، شرق النيل، الخرطوم، جبل أولياء) وباقي الولايات مع أسعارها المعتمدة.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowResetConfirmModal(false)}
                className="flex-1 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs sm:text-sm transition-all cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onResetZones) onResetZones();
                  setShowResetConfirmModal(false);
                  showFeedback('تمت استعادة مناطق وأسعار التوصيل الافتراضية بنجاح!');
                }}
                className="flex-1 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-amber-950 font-black text-xs sm:text-sm shadow-md transition-all cursor-pointer"
              >
                تأكيد الاستعادة
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
