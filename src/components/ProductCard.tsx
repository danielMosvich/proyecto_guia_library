import React from 'react';
import {
  Check,
  Plus,
  RotateCcw,
  AlertTriangle,
  Scale,
  Lock,
} from 'lucide-react';
import type { ReceptionItem } from '../types';
import { formatQuantityWithUnit } from '../utils/sunatXmlParser';

interface ProductCardProps {
  item: ReceptionItem;
  isClosed: boolean;
  onQuickComplete: (itemId: string) => void;
  onOpenAddCount: (item: ReceptionItem) => void;
  onUndoLast: (itemId: string) => void;
  onOpenIncident: (item: ReceptionItem) => void;
  onOpenConversion: (item: ReceptionItem) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  item,
  isClosed,
  onQuickComplete,
  onOpenAddCount,
  onUndoLast,
  onOpenIncident,
  onOpenConversion,
}) => {
  // Border colors based on status
  const getBorderColor = () => {
    if (item.isExtra) return 'border-l-purple-600';
    switch (item.status) {
      case 'completo':
        return 'border-l-emerald-500';
      case 'parcial':
        return 'border-l-amber-500';
      case 'observado':
        return 'border-l-rose-500';
      case 'pendiente':
      default:
        return 'border-l-slate-300';
    }
  };

  const getStatusBadge = () => {
    if (item.isExtra) {
      return (
        <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-purple-100 text-purple-900 border border-purple-200">
          EXTRA · NO EN GUÍA
        </span>
      );
    }
    switch (item.status) {
      case 'completo':
        return (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200">
            COMPLETO
          </span>
        );
      case 'parcial':
        return (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-200">
            PARCIAL
          </span>
        );
      case 'observado':
        return (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-rose-100 text-rose-800 border border-rose-200">
            {item.incidentType === 'sobrante' ? 'SOBRANTE' : 'OBSERVADO'}
          </span>
        );
      case 'pendiente':
      default:
        return (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600 border border-slate-200">
            PENDIENTE
          </span>
        );
    }
  };

  const remaining = Math.max(0, item.expectedQuantity - item.receivedQuantity);
  const surplus = Math.max(0, item.receivedQuantity - item.expectedQuantity);
  const percent = item.expectedQuantity > 0 
    ? Math.min(100, Math.round((item.receivedQuantity / item.expectedQuantity) * 100))
    : 100;

  // Format partial count history e.g. "14 + 2"
  const historyText = item.partialCounts && item.partialCounts.length > 0
    ? item.partialCounts.map(p => `${p.inputAmount}`).join(' + ')
    : null;

  return (
    <div
      className={`bg-white rounded-xl shadow-xs border border-slate-200 border-l-[6px] transition-all ${getBorderColor()} overflow-hidden`}
    >
      <div className="p-3.5 space-y-2.5">
        {/* Top Badges Row */}
        <div className="flex items-center justify-between gap-1.5 flex-wrap">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-[11px] font-bold text-slate-400">
              #{item.lineId}
            </span>
            <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200">
              {item.itemCode}
            </span>
            {item.unitPrice > 0 && (
              <span className="text-[10px] text-slate-500 font-semibold">
                S/ {item.unitPrice.toFixed(2)}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            {getStatusBadge()}
          </div>
        </div>

        {/* Product Description */}
        <h3 className="text-slate-900 font-bold text-sm leading-snug tracking-tight">
          {item.description}
        </h3>

        {/* Quantities & Progress */}
        <div className="bg-slate-50 rounded-lg p-2.5 border border-slate-100 space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <div>
              <span className="text-slate-500">Recibido: </span>
              <strong className="text-slate-900 text-sm">
                {formatQuantityWithUnit(item.receivedQuantity, item.unitName, item.unitNamePlural)}
              </strong>
            </div>

            {!item.isExtra && (
              <div className="text-right">
                <span className="text-slate-500">Esperado: </span>
                <span className="font-bold text-slate-800">
                  {formatQuantityWithUnit(item.expectedQuantity, item.unitName, item.unitNamePlural)}
                </span>
              </div>
            )}
          </div>

          {/* Progress bar */}
          {!item.isExtra && (
            <div className="space-y-1">
              <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    item.status === 'completo'
                      ? 'bg-emerald-500'
                      : surplus > 0
                      ? 'bg-blue-500'
                      : 'bg-amber-500'
                  }`}
                  style={{ width: `${percent}%` }}
                />
              </div>

              <div className="flex justify-between items-center text-[11px]">
                <span className="font-medium text-slate-500">{percent}% completado</span>
                {remaining > 0 ? (
                  <span className="text-amber-700 font-bold">Faltan {remaining} {remaining === 1 ? item.unitName : item.unitNamePlural}</span>
                ) : surplus > 0 ? (
                  <span className="text-blue-700 font-bold">Sobrante +{surplus} {surplus === 1 ? item.unitName : item.unitNamePlural}</span>
                ) : (
                  <span className="text-emerald-700 font-bold">✓ 100% Completo</span>
                )}
              </div>
            </div>
          )}

          {/* Partial counts breakdown if multiple increments occurred */}
          {historyText && (
            <div className="pt-1 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-600">
              <div className="truncate">
                <span className="text-slate-400">Historial: </span>
                <span className="font-mono font-medium">{historyText}</span>
              </div>
              {!isClosed && item.partialCounts.length > 0 && (
                <button
                  type="button"
                  onClick={() => onUndoLast(item.id)}
                  title="Deshacer último ingreso parcial"
                  className="inline-flex items-center gap-1 text-[11px] text-slate-500 hover:text-slate-900 active:text-rose-600 px-1.5 py-0.5 rounded hover:bg-slate-200 transition-colors shrink-0"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Deshacer</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Multiplier / Conversion factor button */}
        {!item.isExtra && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onOpenConversion(item)}
              className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] transition-colors border ${
                item.conversionActive
                  ? 'bg-blue-50 border-blue-200 text-blue-800 font-semibold'
                  : 'bg-white border-slate-200 text-slate-500 hover:text-slate-800'
              }`}
            >
              <Scale className="w-3 h-3 text-blue-600" />
              {item.conversionActive ? (
                <span>1 {item.unitName} = {item.conversionFactor} {item.conversionTargetUnit || 'Unidades'}</span>
              ) : (
                <span>
                  {item.suggestedConversion ? `Sugerir factor (x${item.suggestedConversion})` : 'Configurar empaque'}
                </span>
              )}
            </button>
          </div>
        )}

        {/* Observations display */}
        {item.incidentType !== 'ninguno' && (
          <div className="p-2 rounded-lg bg-rose-50 border border-rose-200 text-[11px] text-rose-900 flex items-start gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
            <div className="min-w-0">
              <strong className="uppercase font-bold">{item.incidentType}: </strong>
              <span>{item.observations || 'Sin detalle'}</span>
            </div>
          </div>
        )}

        {/* Touch Action Buttons (Min 44px height for thumb ergonomics) */}
        {!isClosed ? (
          <div className="pt-1 flex items-center gap-2">
            {/* 1-Tap Quick Complete Button: ✓ Todo (N) or + Resto (N) */}
            {!item.isExtra && remaining > 0 && (
              <button
                type="button"
                onClick={() => onQuickComplete(item.id)}
                className="flex-1 py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold rounded-xl shadow-xs flex items-center justify-center gap-1.5 text-xs transition-transform active:scale-98 min-h-[44px]"
              >
                <Check className="w-4 h-4" />
                <span>
                  {item.receivedQuantity === 0 ? `✓ Todo (${remaining})` : `+ Resto (${remaining})`}
                </span>
              </button>
            )}

            {/* Incremental Add Count Button: + Sumar */}
            <button
              type="button"
              onClick={() => onOpenAddCount(item)}
              className={`py-2.5 px-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold rounded-xl shadow-xs flex items-center justify-center gap-1.5 text-xs transition-transform active:scale-98 min-h-[44px] ${
                item.isExtra || remaining === 0 ? 'flex-1' : ''
              }`}
            >
              <Plus className="w-4 h-4" />
              <span>+ Sumar</span>
            </button>

            {/* Quick incident button: ! */}
            <button
              type="button"
              onClick={() => onOpenIncident(item)}
              aria-label="Registrar novedad"
              className={`p-2.5 rounded-xl border flex items-center justify-center transition-colors min-w-[44px] min-h-[44px] ${
                item.incidentType !== 'ninguno'
                  ? 'bg-rose-50 border-rose-300 text-rose-700 hover:bg-rose-100'
                  : 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
              }`}
            >
              <AlertTriangle className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="pt-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-slate-100 rounded-xl text-slate-500 text-xs">
            <Lock className="w-3.5 h-3.5" />
            <span>Recepción cerrada · Conteo bloqueado</span>
          </div>
        )}
      </div>
    </div>
  );
};
