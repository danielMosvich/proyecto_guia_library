import React, { useState, useEffect } from 'react';
import {
  Search,
  X,
  Share2,
  Lock,
  ChevronLeft,
  Wifi,
  WifiOff,
} from 'lucide-react';
import type { Reception, FilterTabsCount } from '../types';

export type FilterTab = 'pendientes' | 'parciales' | 'observados' | 'completos';

interface ReceptionHeaderStickyProps {
  reception: Reception;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  activeTab: FilterTab;
  onTabChange: (tab: FilterTab) => void;
  tabsCount: FilterTabsCount;
  onOpenCloseModal: () => void;
  onOpenSummaryModal: () => void;
  onBack: () => void;
}

export const ReceptionHeaderSticky: React.FC<ReceptionHeaderStickyProps> = ({
  reception,
  searchQuery,
  onSearchChange,
  activeTab,
  onTabChange,
  tabsCount,
  onOpenCloseModal,
  onOpenSummaryModal,
  onBack,
}) => {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const totalLines = tabsCount.todos;
  const percentComplete = totalLines > 0
    ? Math.round((tabsCount.completos / totalLines) * 100)
    : 0;

  return (
    <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md text-[#1C1C1E] shadow-xs border-b border-[#E5E5EA]">
      {/* 1. Global Thin Progress Bar (Topmost) */}
      <div className="w-full h-1 bg-[#E5E5EA] relative overflow-hidden">
        <div
          className={`h-full transition-all duration-300 ${
            percentComplete === 100 ? 'bg-[#34C759]' : 'bg-[#007AFF]'
          }`}
          style={{ width: `${percentComplete}%` }}
        />
      </div>

      <div className="max-w-2xl mx-auto px-3 pt-2 pb-2 space-y-2">
        {/* Unified Compact Navigation Bar: Back, Title, Provider, Progress, Online/Offline, Share, Close */}
        <div className="flex items-center justify-between gap-1.5">
          {/* Back button & Document Title */}
          <div className="flex items-center gap-1.5 min-w-0 flex-1">
            <button
              type="button"
              onClick={onBack}
              aria-label="Volver a recepciones"
              className="p-1 -ml-1 text-[#007AFF] hover:bg-slate-100 active:bg-slate-200 rounded-xl transition-colors shrink-0"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-bold text-xs text-[#1C1C1E] truncate max-w-[130px] xs:max-w-[170px]">
                  {reception.documentType === 'DespatchAdvice' ? 'Guía' : 'Factura'} {reception.serieNumero}
                </span>
                <span className="text-[11px] text-[#34C759] font-bold shrink-0">
                  {tabsCount.completos}/{totalLines} · {percentComplete}%
                </span>
              </div>
              <p className="text-[10px] text-[#8E8E93] truncate leading-tight">
                {reception.proveedorNombre}
              </p>
            </div>
          </div>

          {/* Right Actions: Online/Offline, Share, Close */}
          <div className="flex items-center gap-1 shrink-0">
            {/* Offline/Online compact badge */}
            <div
              className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-semibold border ${
                isOnline
                  ? 'bg-[#EBF9EE] text-[#34C759] border-[#D1F2D9]'
                  : 'bg-[#FFF4E5] text-[#FF9500] border-[#FFE2BF] animate-pulse'
              }`}
              title={isOnline ? 'Online' : 'Offline'}
            >
              {isOnline ? <Wifi className="w-2.5 h-2.5" /> : <WifiOff className="w-2.5 h-2.5" />}
              <span className="hidden xs:inline">{isOnline ? 'Online' : 'Off'}</span>
            </div>

            {/* Share / Summary Button */}
            <button
              type="button"
              onClick={onOpenSummaryModal}
              title="Resumen WhatsApp / Excel"
              className="p-1.5 bg-[#F2F2F7] hover:bg-[#E5E5EA] text-[#007AFF] rounded-xl text-xs font-semibold flex items-center border border-[#E5E5EA] transition-colors"
            >
              <Share2 className="w-3.5 h-3.5" />
            </button>

            {/* Close Button */}
            {reception.status !== 'cerrada' ? (
              <button
                type="button"
                onClick={onOpenCloseModal}
                className="px-2.5 py-1.5 bg-[#34C759] hover:bg-[#2EB84F] active:scale-95 text-white rounded-xl text-[11px] font-bold shadow-xs flex items-center gap-1 transition-transform"
              >
                <Lock className="w-3 h-3" />
                <span>Cerrar</span>
              </button>
            ) : (
              <span className="px-2 py-1 bg-[#EBF9EE] text-[#34C759] border border-[#D1F2D9] rounded-xl text-[10px] font-bold flex items-center gap-1">
                <Lock className="w-2.5 h-2.5" />
                <span>Cerrada</span>
              </span>
            )}
          </div>
        </div>

        {/* Search Bar with SEPARATED Large Clear Button */}
        <div className="flex items-center gap-1.5">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-[#8E8E93] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Buscar código o descripción..."
              className="w-full text-xs bg-[#F2F2F7] text-[#1C1C1E] placeholder-[#8E8E93] pl-8 pr-2.5 py-2 rounded-xl border border-transparent focus:bg-white focus:border-[#007AFF] focus:ring-2 focus:ring-[#007AFF]/20 transition-all outline-none"
            />
          </div>

          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="h-[34px] px-2.5 bg-[#E5E5EA] hover:bg-[#D1D1D6] active:bg-[#C7C7CC] text-[#1C1C1E] font-bold rounded-xl text-xs flex items-center justify-center gap-1 transition-all active:scale-95 shrink-0 shadow-2xs"
              aria-label="Limpiar búsqueda"
            >
              <X className="w-3.5 h-3.5 text-[#8E8E93]" />
              <span>Limpiar</span>
            </button>
          )}
        </div>

        {/* Fixed 4-Column Grid Tabs without horizontal scroll: Pend. (N), Parcial (N), Obs. (N), Listos (N) */}
        <div className="grid grid-cols-4 gap-1 w-full pt-0.5">
          <button
            type="button"
            onClick={() => onTabChange('pendientes')}
            className={`py-1.5 px-0.5 rounded-xl font-bold text-center transition-all flex items-center justify-center gap-1 min-h-[32px] text-[11px] leading-none ${
              activeTab === 'pendientes'
                ? 'bg-[#8E8E93] text-white shadow-xs'
                : 'bg-[#E5E5EA] text-[#3A3A3C] hover:bg-[#D1D1D6]'
            }`}
          >
            <span>Pend.</span>
            <span className={`text-[10px] px-1 py-0.2 rounded-full font-mono ${
              activeTab === 'pendientes' ? 'bg-white/25 text-white' : 'bg-white text-[#3A3A3C]'
            }`}>
              {tabsCount.pendientes}
            </span>
          </button>

          <button
            type="button"
            onClick={() => onTabChange('parciales')}
            className={`py-1.5 px-0.5 rounded-xl font-bold text-center transition-all flex items-center justify-center gap-1 min-h-[32px] text-[11px] leading-none ${
              activeTab === 'parciales'
                ? 'bg-[#FF9500] text-white shadow-xs'
                : 'bg-[#FFF4E5] text-[#FF9500] hover:bg-[#FFE8CC]'
            }`}
          >
            <span>Parcial</span>
            <span className={`text-[10px] px-1 py-0.2 rounded-full font-mono ${
              activeTab === 'parciales' ? 'bg-white/25 text-white' : 'bg-white text-[#FF9500]'
            }`}>
              {tabsCount.parciales}
            </span>
          </button>

          <button
            type="button"
            onClick={() => onTabChange('observados')}
            className={`py-1.5 px-0.5 rounded-xl font-bold text-center transition-all flex items-center justify-center gap-1 min-h-[32px] text-[11px] leading-none ${
              activeTab === 'observados'
                ? 'bg-[#FF3B30] text-white shadow-xs'
                : 'bg-[#FFEBEA] text-[#FF3B30] hover:bg-[#FFD7D5]'
            }`}
          >
            <span>Obs.</span>
            <span className={`text-[10px] px-1 py-0.2 rounded-full font-mono ${
              activeTab === 'observados' ? 'bg-white/25 text-white' : 'bg-white text-[#FF3B30]'
            }`}>
              {tabsCount.observados}
            </span>
          </button>

          <button
            type="button"
            onClick={() => onTabChange('completos')}
            className={`py-1.5 px-0.5 rounded-xl font-bold text-center transition-all flex items-center justify-center gap-1 min-h-[32px] text-[11px] leading-none ${
              activeTab === 'completos'
                ? 'bg-[#34C759] text-white shadow-xs'
                : 'bg-[#EBF9EE] text-[#34C759] hover:bg-[#D5F5DA]'
            }`}
          >
            <span>Listos</span>
            <span className={`text-[10px] px-1 py-0.2 rounded-full font-mono ${
              activeTab === 'completos' ? 'bg-white/25 text-white' : 'bg-white text-[#34C759]'
            }`}>
              {tabsCount.completos}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
