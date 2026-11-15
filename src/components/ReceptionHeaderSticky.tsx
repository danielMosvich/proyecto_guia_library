import React from 'react';
import {
  Search,
  X,
  Share2,
  Lock,
  ArrowLeft,
} from 'lucide-react';
import type { Reception, FilterTabsCount } from '../types';

export type FilterTab = 'todos' | 'pendientes' | 'parciales' | 'observados' | 'completos';

interface ReceptionHeaderStickyProps {
  reception: Reception;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  activeTab: FilterTab;
  onTabChange: (tab: FilterTab) => void;
  tabsCount: FilterTabsCount;
  autoClearSearch: boolean;
  onToggleAutoClear: () => void;
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
  autoClearSearch,
  onToggleAutoClear,
  onOpenCloseModal,
  onOpenSummaryModal,
  onBack,
}) => {
  const percentComplete = tabsCount.todos > 0
    ? Math.round((tabsCount.completos / tabsCount.todos) * 100)
    : 0;

  return (
    <div className="sticky top-0 z-30 bg-slate-900 text-white shadow-md border-b border-slate-800">
      {/* 1. Global Thin Progress Bar (Topmost) */}
      <div className="w-full h-1.5 bg-slate-800 relative">
        <div
          className={`h-full transition-all duration-300 ${
            percentComplete === 100 ? 'bg-emerald-400' : 'bg-blue-500'
          }`}
          style={{ width: `${percentComplete}%` }}
        />
      </div>

      <div className="max-w-2xl mx-auto px-3 pt-2 pb-2.5 space-y-2">
        {/* Document Info & Main Action Buttons */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0 flex-1">
            <button
              type="button"
              onClick={onBack}
              title="Volver a lista de recepciones"
              className="p-1 -ml-1 text-slate-300 hover:text-white active:bg-slate-800 rounded-lg transition-colors shrink-0"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-xs text-white">
                  {reception.documentType === 'DespatchAdvice' ? 'Guía' : 'Factura'} {reception.serieNumero}
                </span>
                <span className="text-[11px] text-slate-400">·</span>
                <span className="text-[11px] text-emerald-400 font-bold">
                  {tabsCount.completos}/{tabsCount.todos} ({percentComplete}%)
                </span>
              </div>
              <p className="text-[11px] text-slate-400 truncate">
                {reception.proveedorNombre}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {reception.status !== 'cerrada' ? (
              <button
                type="button"
                onClick={onOpenCloseModal}
                className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs flex items-center gap-1 transition-transform active:scale-95"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Cerrar</span>
              </button>
            ) : (
              <span className="px-2 py-1 bg-emerald-950/80 text-emerald-300 border border-emerald-700/80 rounded-md text-[11px] font-bold flex items-center gap-1">
                <Lock className="w-3 h-3" />
                <span>Cerrada</span>
              </span>
            )}

            <button
              type="button"
              onClick={onOpenSummaryModal}
              title="Ver Resumen y Reportes para WhatsApp / Excel"
              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-lg text-xs font-semibold flex items-center gap-1 border border-slate-700 transition-colors"
            >
              <Share2 className="w-4 h-4 text-blue-400" />
            </button>
          </div>
        </div>

        {/* Search Bar with Large X Clear Button */}
        <div className="relative flex items-center">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Buscar por código, descripción (ej: chenille rojo)..."
            className="w-full text-xs bg-slate-800 text-white placeholder-slate-400 pl-9 pr-9 py-2.5 rounded-xl border border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute right-2 p-1.5 text-slate-400 hover:text-white active:bg-slate-700 rounded-full transition-colors"
              aria-label="Limpiar búsqueda"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Secondary options row: Auto-clear checkbox */}
        <div className="flex items-center justify-between text-[11px] text-slate-400 px-0.5">
          <label className="flex items-center gap-1.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={autoClearSearch}
              onChange={onToggleAutoClear}
              className="rounded bg-slate-800 border-slate-700 text-blue-600 focus:ring-0 w-3.5 h-3.5"
            />
            <span>Auto-limpiar búsqueda al completar ítem</span>
          </label>
          {searchQuery && (
            <span className="text-blue-300 font-medium">Filtrando lista</span>
          )}
        </div>

        {/* Pill Filter Tabs with Badges */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar text-xs">
          <button
            type="button"
            onClick={() => onTabChange('todos')}
            className={`px-2.5 py-1 rounded-full font-semibold shrink-0 transition-all flex items-center gap-1.5 min-h-[32px] ${
              activeTab === 'todos'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <span>Todos</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20 font-mono">
              {tabsCount.todos}
            </span>
          </button>

          <button
            type="button"
            onClick={() => onTabChange('pendientes')}
            className={`px-2.5 py-1 rounded-full font-semibold shrink-0 transition-all flex items-center gap-1.5 min-h-[32px] ${
              activeTab === 'pendientes'
                ? 'bg-slate-200 text-slate-900 shadow-xs'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <span>Pendientes</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-600 text-white font-mono">
              {tabsCount.pendientes}
            </span>
          </button>

          <button
            type="button"
            onClick={() => onTabChange('parciales')}
            className={`px-2.5 py-1 rounded-full font-semibold shrink-0 transition-all flex items-center gap-1.5 min-h-[32px] ${
              activeTab === 'parciales'
                ? 'bg-amber-500 text-slate-900 shadow-xs font-bold'
                : 'bg-slate-800 text-amber-300 hover:bg-slate-700'
            }`}
          >
            <span>En Proceso</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-400/30 text-amber-200 font-mono">
              {tabsCount.parciales}
            </span>
          </button>

          <button
            type="button"
            onClick={() => onTabChange('observados')}
            className={`px-2.5 py-1 rounded-full font-semibold shrink-0 transition-all flex items-center gap-1.5 min-h-[32px] ${
              activeTab === 'observados'
                ? 'bg-rose-600 text-white shadow-xs font-bold'
                : 'bg-slate-800 text-rose-300 hover:bg-slate-700'
            }`}
          >
            <span>Observados / Extras</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-rose-500/30 text-rose-200 font-mono">
              {tabsCount.observados}
            </span>
          </button>

          <button
            type="button"
            onClick={() => onTabChange('completos')}
            className={`px-2.5 py-1 rounded-full font-semibold shrink-0 transition-all flex items-center gap-1.5 min-h-[32px] ${
              activeTab === 'completos'
                ? 'bg-emerald-600 text-white shadow-xs font-bold'
                : 'bg-slate-800 text-emerald-300 hover:bg-slate-700'
            }`}
          >
            <span>Completos</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-500/30 text-emerald-200 font-mono">
              {tabsCount.completos}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
