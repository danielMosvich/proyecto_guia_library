import React from 'react';
import {
  Check,
  Plus,
  RotateCcw,
  AlertTriangle,
  Lock,
  CheckCheck,
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
  onSetManualComplete: (itemId: string, completed: boolean) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  item,
  isClosed,
  onQuickComplete,
  onOpenAddCount,
  onUndoLast,
  onOpenIncident,
  onSetManualComplete,
}) => {
  // Border colors using iOS official palette
  const getBorderColor = () => {
    if (item.isExtra) return 'border-l-[#AF52DE]';
    switch (item.status) {
      case 'completo':
        return 'border-l-[#34C759]';
      case 'parcial':
        return 'border-l-[#FF9500]';
      case 'observado':
        return 'border-l-[#FF3B30]';
      case 'pendiente':
      default:
        return 'border-l-[#AEAEB2]';
    }
  };

  const getStatusBadge = () => {
    if (item.isExtra) {
      return (
        <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-[#F5EAFB] text-[#AF52DE] border border-[#E8CEF7]">
          EXTRA
        </span>
      );
    }
    switch (item.status) {
      case 'completo':
        return (
          <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-[#EBF9EE] text-[#34C759] border border-[#D1F2D9]">
            COMPLETO
          </span>
        );
      case 'parcial':
        return (
          <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-[#FFF4E5] text-[#FF9500] border border-[#FFE2BF]">
            PARCIAL
          </span>
        );
      case 'observado':
        return (
          <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-[#FFEBEA] text-[#FF3B30] border border-[#FFD0CE]">
            {item.incidentType === 'sobrante' ? 'SOBRANTE' : 'OBSERVADO'}
          </span>
        );
      case 'pendiente':
      default:
        return (
          <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-[#F2F2F7] text-[#8E8E93] border border-[#E5E5EA]">
            PENDIENTE
          </span>
        );
    }
  };

  const hasManualFactor = item.conversionActive && item.conversionFactor > 1;
  const hasLooseUnitsWithoutFactor = !hasManualFactor && (item.looseUnitsReceived || 0) > 0;

  // Expected vs received calculation
  let percent = 0;
  let remaining = Math.max(0, item.expectedQuantity - item.receivedQuantity);
  let surplus = Math.max(0, item.receivedQuantity - item.expectedQuantity);

  if (hasManualFactor) {
    const totalExpUnits = item.expectedQuantity * item.conversionFactor;
    const totalRecUnits = (item.receivedQuantity * item.conversionFactor) + (item.looseUnitsReceived || 0);
    percent = totalExpUnits > 0 ? Math.min(100, Math.round((totalRecUnits / totalExpUnits) * 100)) : 100;
    remaining = Math.max(0, totalExpUnits - totalRecUnits);
    surplus = Math.max(0, totalRecUnits - totalExpUnits);
  } else {
    percent = item.expectedQuantity > 0 
      ? Math.min(100, Math.round((item.receivedQuantity / item.expectedQuantity) * 100))
      : 100;
  }

  // Format partial count history e.g. "14 + 2"
  const historyText = item.partialCounts && item.partialCounts.length > 0
    ? item.partialCounts.map(p => `${p.inputAmount} ${p.unitUsed}`).join(' + ')
    : null;

  return (
    <div
      className={`bg-white rounded-xl shadow-xs border border-[#E5E5EA] border-l-4 transition-all ${getBorderColor()} overflow-hidden`}
    >
      <div className="p-2.5 space-y-1.5">
        {/* Top Badges Row (Compact) */}
        <div className="flex items-center justify-between gap-1 flex-wrap">
          <div className="flex items-center gap-1 min-w-0">
            <span className="text-[10px] font-bold text-[#8E8E93]">
              #{item.lineId}
            </span>
            <span className="font-mono text-[11px] font-bold px-1.5 py-0.5 rounded bg-[#F2F2F7] text-[#1C1C1E] border border-[#E5E5EA]">
              {item.itemCode}
            </span>
            {item.unitPrice > 0 && (
              <span className="text-[10px] text-[#8E8E93]">
                S/ {item.unitPrice.toFixed(2)}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            {getStatusBadge()}
          </div>
        </div>

        {/* Product Description in high contrast */}
        <h3 className="text-[#1C1C1E] font-bold text-xs sm:text-sm leading-tight tracking-tight line-clamp-2">
          {item.description}
        </h3>

        {/* Quantities & Progress Box (Compact iOS style) */}
        <div className="bg-[#F2F2F7] rounded-xl px-2.5 py-1.5 border border-[#E5E5EA] space-y-1">
          <div className="flex items-center justify-between text-xs">
            {/* If mixed count without factor */}
            {hasLooseUnitsWithoutFactor ? (
              <div className="flex items-center justify-between w-full">
                <div>
                  <span className="text-[#8E8E93]">Recibido: </span>
                  <strong className="text-[#1C1C1E]">
                    {item.receivedQuantity} {item.receivedQuantity === 1 ? item.unitName : item.unitNamePlural} + {item.looseUnitsReceived} {item.looseUnitsReceived === 1 ? 'Unidad' : 'Unidades'}
                  </strong>
                </div>
                <div className="text-right">
                  <span className="text-[#8E8E93]">Esperado: </span>
                  <strong className="text-[#1C1C1E]">
                    {formatQuantityWithUnit(item.expectedQuantity, item.unitName, item.unitNamePlural)}
                  </strong>
                </div>
              </div>
            ) : hasManualFactor ? (
              /* If manual conversion factor is active */
              <div className="flex items-center justify-between w-full">
                <div>
                  <span className="text-[#8E8E93]">Recibido: </span>
                  <strong className="text-[#1C1C1E]">
                    {(item.receivedQuantity * item.conversionFactor) + (item.looseUnitsReceived || 0)} / {item.expectedQuantity * item.conversionFactor} Unidades
                  </strong>
                  <span className="text-[10px] text-[#8E8E93] ml-1">
                    ({item.receivedQuantity} {item.receivedQuantity === 1 ? item.unitName : item.unitNamePlural})
                  </span>
                </div>
                <div className="text-right text-[11px] font-bold text-[#007AFF]">
                  1 {item.unitName} = {item.conversionFactor} Und
                </div>
              </div>
            ) : (
              /* Standard XML unit */
              <>
                <div>
                  <span className="text-[#8E8E93]">Recibido: </span>
                  <strong className="text-[#1C1C1E] text-xs">
                    {formatQuantityWithUnit(item.receivedQuantity, item.unitName, item.unitNamePlural)}
                  </strong>
                </div>

                {!item.isExtra && (
                  <div className="text-right">
                    <span className="text-[#8E8E93]">Esperado: </span>
                    <strong className="text-[#1C1C1E]">
                      {formatQuantityWithUnit(item.expectedQuantity, item.unitName, item.unitNamePlural)}
                    </strong>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Progress bar */}
          {!item.isExtra && (
            <div className="space-y-0.5">
              <div className="w-full h-1 bg-[#E5E5EA] rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    item.status === 'completo'
                      ? 'bg-[#34C759]'
                      : surplus > 0
                      ? 'bg-[#007AFF]'
                      : 'bg-[#FF9500]'
                  }`}
                  style={{ width: `${percent}%` }}
                />
              </div>

              <div className="flex justify-between items-center text-[10px]">
                <span className="font-medium text-[#8E8E93]">{percent}%</span>
                {item.status === 'completo' ? (
                  <span className="text-[#34C759] font-bold">Completo</span>
                ) : remaining > 0 ? (
                  <span className="text-[#FF9500] font-bold">
                    Faltan {remaining} {hasManualFactor ? 'Unidades' : (remaining === 1 ? item.unitName : item.unitNamePlural)}
                  </span>
                ) : surplus > 0 ? (
                  <span className="text-[#007AFF] font-bold">
                    Sobrante +{surplus}
                  </span>
                ) : (
                  <span className="text-[#8E8E93]">Sin iniciar</span>
                )}
              </div>
            </div>
          )}

          {/* Partial counts breakdown if multiple increments occurred */}
          {historyText && (
            <div className="pt-0.5 border-t border-[#E5E5EA] flex items-center justify-between text-[10px] text-[#3A3A3C]">
              <div className="truncate">
                <span className="text-[#8E8E93]">Hist: </span>
                <span className="font-mono font-medium">{historyText}</span>
              </div>
              {!isClosed && item.partialCounts.length > 0 && (
                <button
                  type="button"
                  onClick={() => onUndoLast(item.id)}
                  title="Deshacer último ingreso parcial"
                  className="inline-flex items-center gap-0.5 text-[10px] text-[#007AFF] hover:underline px-1 py-0.5 rounded hover:bg-white transition-colors shrink-0 font-medium"
                >
                  <RotateCcw className="w-2.5 h-2.5" />
                  <span>Deshacer</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Observations display */}
        {item.incidentType !== 'ninguno' && (
          <div className="p-1.5 rounded-lg bg-[#FFEBEA] border border-[#FFD0CE] text-[10px] text-[#FF3B30] flex items-start gap-1">
            <AlertTriangle className="w-3 h-3 text-[#FF3B30] shrink-0 mt-0.5" />
            <div className="min-w-0">
              <strong className="uppercase font-bold">{item.incidentType}: </strong>
              <span>{item.observations || 'Sin detalle'}</span>
            </div>
          </div>
        )}

        {/* Touch Action Buttons (Min 44px height for thumb ergonomics, clean labels without ✓ or +) */}
        {!isClosed ? (
          <div className="pt-0.5 flex items-center gap-1.5">
            {/* Quick Complete Button: Clean label "Todo (N)" or "Resto (N)" */}
            {!item.isExtra && remaining > 0 && !hasLooseUnitsWithoutFactor && (
              <button
                type="button"
                onClick={() => onQuickComplete(item.id)}
                className="flex-1 py-2 px-2.5 bg-[#34C759] hover:bg-[#2EB84F] active:bg-[#28A745] text-white font-bold rounded-xl shadow-xs flex items-center justify-center gap-1.5 text-xs transition-transform active:scale-98 min-h-[44px]"
              >
                <Check className="w-4 h-4" />
                <span>
                  {item.receivedQuantity === 0 ? `Todo (${remaining})` : `Resto (${remaining})`}
                </span>
              </button>
            )}

            {/* Manual Mark Complete Button (when mixed loose units without factor) */}
            {hasLooseUnitsWithoutFactor && item.status !== 'completo' && (
              <button
                type="button"
                onClick={() => onSetManualComplete(item.id, true)}
                className="flex-1 py-2 px-2.5 bg-[#34C759] hover:bg-[#2EB84F] active:bg-[#28A745] text-white font-bold rounded-xl shadow-xs flex items-center justify-center gap-1.5 text-xs transition-transform active:scale-98 min-h-[44px]"
              >
                <CheckCheck className="w-4 h-4" />
                <span>Marcar como Completo</span>
              </button>
            )}

            {/* Reopen manual completion if needed */}
            {hasLooseUnitsWithoutFactor && item.manualCompleted && (
              <button
                type="button"
                onClick={() => onSetManualComplete(item.id, false)}
                className="flex-1 py-2 px-2 border border-[#E5E5EA] bg-[#F2F2F7] text-[#3A3A3C] font-semibold rounded-xl text-[11px] flex items-center justify-center min-h-[44px]"
              >
                Reabrir a Parcial
              </button>
            )}

            {/* Incremental Add Count Button: Clean label "Sumar" */}
            <button
              type="button"
              onClick={() => onOpenAddCount(item)}
              className={`py-2 px-3 bg-[#007AFF] hover:bg-[#0066D6] active:bg-[#0055B3] text-white font-bold rounded-xl shadow-xs flex items-center justify-center gap-1.5 text-xs transition-transform active:scale-98 min-h-[44px] ${
                item.isExtra || remaining === 0 || item.manualCompleted ? 'flex-1' : ''
              }`}
            >
              <Plus className="w-4 h-4" />
              <span>Sumar</span>
            </button>

            {/* Quick incident button: ! */}
            <button
              type="button"
              onClick={() => onOpenIncident(item)}
              aria-label="Registrar novedad"
              className={`p-2 rounded-xl border flex items-center justify-center transition-colors min-w-[44px] min-h-[44px] ${
                item.incidentType !== 'ninguno'
                  ? 'bg-[#FFEBEA] border-[#FFD0CE] text-[#FF3B30] hover:bg-[#FFD7D5]'
                  : 'bg-[#F2F2F7] border-[#E5E5EA] text-[#8E8E93] hover:bg-[#E5E5EA] hover:text-[#1C1C1E]'
              }`}
            >
              <AlertTriangle className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="pt-0.5 flex items-center justify-center gap-1.5 py-1.5 px-2 bg-[#F2F2F7] rounded-xl text-[#8E8E93] text-[11px]">
            <Lock className="w-3 h-3" />
            <span>Recepción cerrada · Conteo bloqueado</span>
          </div>
        )}
      </div>
    </div>
  );
};
