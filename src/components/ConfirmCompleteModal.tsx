import React from 'react';
import { X, Check, AlertCircle } from 'lucide-react';
import type { ReceptionItem } from '../types';
import { formatQuantityWithUnit } from '../utils/sunatXmlParser';

interface ConfirmCompleteModalProps {
  isOpen: boolean;
  item: ReceptionItem | null;
  onClose: () => void;
  onConfirm: (itemId: string) => void;
}

export const ConfirmCompleteModal: React.FC<ConfirmCompleteModalProps> = ({
  isOpen,
  item,
  onClose,
  onConfirm,
}) => {
  if (!isOpen || !item) return null;

  const remaining = Math.max(0, item.expectedQuantity - item.receivedQuantity);
  const amountToComplete = remaining > 0 ? remaining : item.expectedQuantity;
  const unitLabel = amountToComplete === 1 ? item.unitName : item.unitNamePlural;

  const handleConfirm = () => {
    onConfirm(item.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="w-full sm:max-w-sm bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col pb-safe"
        onClick={(e) => e.stopPropagation()}
      >
        {/* iOS Grabber on mobile */}
        <div className="pt-2.5 pb-1 flex justify-center sm:hidden">
          <div className="w-9 h-1 bg-[#D1D1D6] rounded-full" />
        </div>

        {/* Header */}
        <div className="px-4 py-3 bg-white text-[#1C1C1E] flex items-center justify-between border-b border-[#E5E5EA]">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-xl bg-[#EBF9EE] text-[#34C759]">
              <Check className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#1C1C1E]">Confirmar Recepción Completa</h2>
              <p className="text-[11px] text-[#8E8E93]">Línea #{item.lineId} · {item.itemCode}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-full hover:bg-[#F2F2F7] text-[#8E8E93]"
            aria-label="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 space-y-3">
          <div className="p-3 bg-[#F2F2F7] rounded-2xl border border-[#E5E5EA] space-y-1">
            <span className="font-mono text-[11px] font-bold text-[#007AFF] bg-[#E5F2FF] px-2 py-0.5 rounded-md">
              {item.itemCode}
            </span>
            <p className="text-xs font-bold text-[#1C1C1E] leading-snug pt-1">
              {item.description}
            </p>
          </div>

          <div className="p-3 bg-[#EBF9EE] border border-[#D1F2D9] rounded-2xl text-xs space-y-1 text-[#1C1C1E]">
            <div className="flex items-center gap-1.5 font-bold text-[#34C759]">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>¿Marcar todo como recibido conforme?</span>
            </div>
            <p className="text-[11px] text-[#3A3A3C] leading-relaxed">
              Se sumarán <strong>{amountToComplete} {unitLabel}</strong> para completar el 100% de la cantidad esperada (<strong>{formatQuantityWithUnit(item.expectedQuantity, item.unitName, item.unitNamePlural)}</strong>).
            </p>
            <p className="text-[10px] text-[#8E8E93]">
              El producto pasará a la pestaña <strong>Listos</strong>. Podrás revertir esta acción en cualquier momento desde el botón de Historial.
            </p>
          </div>
        </div>

        {/* Footer Buttons */}
        <div className="p-3.5 bg-white border-t border-[#E5E5EA] flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 px-3 border border-[#E5E5EA] text-[#3A3A3C] font-semibold rounded-2xl hover:bg-[#F2F2F7] active:bg-[#E5E5EA] text-xs transition-colors min-h-[44px]"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="flex-2 py-3 px-4 bg-[#34C759] hover:bg-[#2EB84F] active:bg-[#28A745] text-white font-bold rounded-2xl shadow-xs flex items-center justify-center gap-1.5 text-xs transition-transform active:scale-98 min-h-[44px]"
          >
            <Check className="w-4 h-4" />
            <span>Confirmar Todo ({amountToComplete})</span>
          </button>
        </div>
      </div>
    </div>
  );
};
