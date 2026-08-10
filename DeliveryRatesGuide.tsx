import React, { useState } from 'react';
import { Truck, MapPin, Package, Store, Info, X, ChevronDown, ChevronUp } from 'lucide-react';
import { DELIVERY_ZONES } from '../data/initialData';
import { formatSDG } from '../utils/pricing';

interface DeliveryRatesGuideProps {
  isOpen?: boolean;
  onClose?: () => void;
  onSelectZone?: (cityText: string, fee: number) => void;
}

export const DeliveryRatesGuide: React.FC<DeliveryRatesGuideProps> = ({
  isOpen = true,
  onClose,
  onSelectZone,
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'omdurman' | 'bahri_eastnile' | 'khartoum' | 'states'>('all');

  const filteredZones = activeTab === 'all'
    ? DELIVERY_ZONES.filter(z => z.regionKey !== 'pickup')
    : DELIVERY_ZONES.filter(z => z.regionKey === activeTab);

  const regionBadges: Record<string, { label: string; bg: string; text: string; icon: string }> = {
    omdurman: { label: 'أمدرمان 👑', bg: 'bg-amber-100', text: 'text-amber-900 border-amber-300', icon: '👑' },
    bahri_eastnile: { label: 'بحري وشرق النيل 💧', bg: 'bg-blue-100', text: 'text-blue-900 border-blue-300', icon: '💧' },
    khartoum: { label: 'الخرطوم 🏙️', bg: 'bg-emerald-100', text: 'text-emerald-900 border-emerald-300', icon: '🏙️' },
    states: { label: 'باقي الولايات (إرساليات) 📦', bg: 'bg-purple-100', text: 'text-purple-900 border-purple-300', icon: '📦' },
  };

  if (!isOpen) return null;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-emerald-900 text-white p-5 sm:p-6 flex items-center justify-between border-b border-emerald-500/40">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-400 text-emerald-950 flex items-center justify-center font-bold shadow-md">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <span>أسعار التوصيل والإرساليات (العاصمة والولايات)</span>
            </h3>
            <p className="text-xs text-emerald-200/80 mt-0.5">
              توصيل مباشر داخل العاصمة الخرطوم وإرساليات طرود لباقي ولايات السودان
            </p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-emerald-200 hover:text-white hover:bg-emerald-900 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Region Category Tabs */}
      <div className="bg-emerald-50/50 p-3 border-b border-emerald-100 overflow-x-auto flex gap-2 no-scrollbar">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'all'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-white text-slate-700 hover:bg-emerald-100/60 border border-emerald-200/80'
          }`}
        >
          الكل (جميع المناطق)
        </button>
        <button
          onClick={() => setActiveTab('omdurman')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'omdurman'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-white text-slate-700 hover:bg-emerald-100/60 border border-emerald-200/80'
          }`}
        >
          👑 أمدرمان
        </button>
        <button
          onClick={() => setActiveTab('bahri_eastnile')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'bahri_eastnile'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-white text-slate-700 hover:bg-emerald-100/60 border border-emerald-200/80'
          }`}
        >
          💧 بحري وشرق النيل
        </button>
        <button
          onClick={() => setActiveTab('khartoum')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'khartoum'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-white text-slate-700 hover:bg-emerald-100/60 border border-emerald-200/80'
          }`}
        >
          🏙️ الخرطوم
        </button>
        <button
          onClick={() => setActiveTab('states')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'states'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-white text-slate-700 hover:bg-emerald-100/60 border border-emerald-200/80'
          }`}
        >
          📦 باقي الولايات (إرساليات)
        </button>
      </div>

      {/* Notice box */}
      <div className="p-4 bg-amber-50 border-b border-amber-200/60 text-xs text-amber-950 flex items-start gap-2.5">
        <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <strong>ملاحظة التوصيل:</strong> التوصيل داخل العاصمة الخرطوم يتم عبر المناديب حتى موقعك، وباقي الولايات يتم عبر إرساليات وطرد سريع يصل مكاتب الولاية.
        </div>
      </div>

      {/* Grid of Zones */}
      <div className="p-4 sm:p-6 grid grid-cols-1 md:grid-cols-2 gap-3.5 max-h-[480px] overflow-y-auto">
        {filteredZones.map(zone => {
          const badge = regionBadges[zone.regionKey] || { label: zone.regionName, bg: 'bg-slate-100', text: 'text-slate-800 border-slate-200' };
          return (
            <div
              key={zone.id}
              onClick={() => onSelectZone && onSelectZone(`${zone.regionName} - ${zone.zoneName}`, zone.fee)}
              className={`p-4 rounded-xl border border-slate-200 bg-white hover:border-amber-400 hover:shadow-md transition-all flex flex-col justify-between group ${
                onSelectZone ? 'cursor-pointer' : ''
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${badge.bg} ${badge.text}`}>
                    {badge.label}
                  </span>
                  <span className="text-sm font-black text-amber-600 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-lg">
                    {formatSDG(zone.fee)}
                  </span>
                </div>
                <h4 className="text-sm font-bold text-slate-900 group-hover:text-amber-800 transition-colors">
                  {zone.zoneName}
                </h4>
                <p className="text-xs text-slate-600 mt-1.5 leading-relaxed bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  {zone.details}
                </p>
              </div>

              {onSelectZone && (
                <div className="mt-3 pt-2 border-t border-slate-100 flex justify-end">
                  <span className="text-xs font-bold text-amber-600 group-hover:underline flex items-center gap-1">
                    اختر هذه المنطقة للتوصيل ←
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Pickup option banner at bottom */}
      <div className="p-4 bg-slate-900 text-white border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <Store className="w-5 h-5 text-amber-400" />
          <div>
            <span className="text-xs font-bold block">استلام مباشر من فرع المكتبة (أم درمان - الثورة):</span>
            <span className="text-[11px] text-slate-400">مجاناً بدون أي رسوم توصيل (0 جنيه)</span>
          </div>
        </div>
        {onSelectZone && (
          <button
            onClick={() => onSelectZone('استلام مباشر من مقر المكتبة', 0)}
            className="bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold px-3.5 py-2 rounded-xl transition-all"
          >
            اختر الاستلام المباشر (مجاناً)
          </button>
        )}
      </div>
    </div>
  );
};
