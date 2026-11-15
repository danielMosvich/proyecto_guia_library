import React, { useState } from 'react';
import { X, CheckCircle2, Lock, ShieldAlert } from 'lucide-react';
import type { Reception, ReceptionItem } from '../types';

interface CloseReceptionModalProps {
  isOpen: boolean;
  reception: Reception;
  items: ReceptionItem[];
  onClose: () => void;
  onConfirmClose: (notes?: string, autoMarkMissing?: boolean) => void;
}

export const CloseReceptionModal: React.FC<CloseReceptionModalProps> = ({
  isOpen,
  reception,
  items,
  onClose,
  onConfirmClose,
}) => {
  const [notes, setNotes] = useState<string>('');
  const [autoMarkMissing, setAutoMarkMissing] = useState<boolean>(true);

  React.useEffect(() => {
    if (isOpen) {
      setNotes('');
      setAutoMarkMissing(true);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const standardItems = items.filter(i => !i.isExtra);
  const completeItems = standardItems.filter(i => i.status === 'completo' && i.incidentType === 'ninguno');
  const zeroItems = standardItems.filter(i => i.receivedQuantity === 0);
  const partialItems = standardItems.filter(i => i.receivedQuantity > 0 && i.receivedQuantity < i.expectedQuantity);
  const surplusItems = standardItems.filter(i => i.receivedQuantity > i.expectedQuantity);
  const extraItems = items.filter(i => i.isExtra);
  const observedItems = items.filter(i => i.incidentType !== 'ninguno');

  const isIncomplete = zeroItems.length > 0 || partialItems.length > 0;

  return (
    <div 
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div 
        className="w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] pb-safe"
        onClick={(e) => e.stopPropagation()}
      >
        {/* iOS Grabber */}
        <div className="pt-2.5 pb-1 flex justify-center">
          <div className="w-9 h-1 bg-[#D1D1D6] rounded-full" />
        </div>

        {/* Header (iOS Light) */}
        <div className="px-4 py-2.5 bg-white text-[#1C1C1E] flex items-center justify-between border-b border-[#E5E5EA]">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-xl bg-[#EBF9EE] text-[#34C759]">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#1C1C1E]">Finalizar Recepción</h2>
              <p className="text-[11px] text-[#8E8E93]">{reception.serieNumero} · {reception.proveedorNombre}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-[#F2F2F7] text-[#8E8E93]">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Validation Summary */}
        <div className="p-4 space-y-3.5 overflow-y-auto text-xs">
          <div className="grid grid-cols-2 gap-2 text-center">
            <div className="p-3 bg-[#EBF9EE] border border-[#D1F2D9] rounded-2xl">
              <div className="text-2xl font-black text-[#34C759]">{completeItems.length}</div>
              <div className="text-[11px] font-bold text-[#34C759]">Conformes (100%)</div>
            </div>
            <div className={`p-3 rounded-2xl border ${isIncomplete ? 'bg-[#FFF4E5] border-[#FFE2BF]' : 'bg-[#F2F2F7] border-[#E5E5EA]'}`}>
              <div className={`text-2xl font-black ${isIncomplete ? 'text-[#FF9500]' : 'text-[#8E8E93]'}`}>
                {zeroItems.length + partialItems.length}
              </div>
              <div className="text-[11px] font-bold text-[#1C1C1E]">Incompletos / Faltantes</div>
            </div>
          </div>

          {/* Warning banner if items remain missing */}
          {isIncomplete && (
            <div className="p-3 bg-[#FFF4E5] border border-[#FFE2BF] rounded-2xl flex gap-2.5 items-start text-[#FF9500]">
              <ShieldAlert className="w-5 h-5 text-[#FF9500] shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-[#1C1C1E]">Hay {zeroItems.length + partialItems.length} producto(s) pendientes o con entrega parcial.</p>
                <p className="text-[11px] text-[#8E8E93] mt-0.5">
                  {zeroItems.length} no registraron ningún ingreso y {partialItems.length} quedaron incompletos.
                </p>
              </div>
            </div>
          )}

          {/* Breakdown checklist */}
          <div className="p-3 bg-[#F2F2F7] rounded-2xl border border-[#E5E5EA] space-y-1.5">
            <div className="flex justify-between items-center text-[#3A3A3C]">
              <span>Total de líneas en documento:</span>
              <span className="font-bold text-[#1C1C1E]">{standardItems.length}</span>
            </div>
            {zeroItems.length > 0 && (
              <div className="flex justify-between items-center text-[#FF3B30] font-semibold">
                <span>• No llegaron (0 recibidos):</span>
                <span className="font-bold">{zeroItems.length}</span>
              </div>
            )}
            {partialItems.length > 0 && (
              <div className="flex justify-between items-center text-[#FF9500] font-semibold">
                <span>• Llegaron incompletos:</span>
                <span className="font-bold">{partialItems.length}</span>
              </div>
            )}
            {observedItems.length > 0 && (
              <div className="flex justify-between items-center text-[#FF3B30] font-semibold">
                <span>• Con observaciones:</span>
                <span className="font-bold">{observedItems.length}</span>
              </div>
            )}
            {surplusItems.length > 0 && (
              <div className="flex justify-between items-center text-[#007AFF] font-semibold">
                <span>• Sobrantes recibidos:</span>
                <span className="font-bold">{surplusItems.length}</span>
              </div>
            )}
            {extraItems.length > 0 && (
              <div className="flex justify-between items-center text-[#AF52DE] font-semibold">
                <span>• Productos extras:</span>
                <span className="font-bold">{extraItems.length}</span>
              </div>
            )}
          </div>

          {/* Auto mark missing checkbox */}
          {isIncomplete && (
            <label className="flex items-start gap-2.5 p-3 rounded-2xl border border-[#E5E5EA] bg-white cursor-pointer select-none">
              <input
                type="checkbox"
                checked={autoMarkMissing}
                onChange={(e) => setAutoMarkMissing(e.target.checked)}
                className="mt-0.5 w-4 h-4 text-[#34C759] rounded border-[#D1D1D6] focus:ring-[#34C759]"
              />
              <span className="text-xs text-[#1C1C1E] leading-tight">
                <strong>Marcar automáticamente como Faltante</strong> los ítems pendientes o incompletos para el reporte al proveedor.
              </span>
            </label>
          )}

          {/* Supervisor closing notes */}
          <div>
            <label className="block text-xs font-bold text-[#8E8E93] mb-1">
              Nota de cierre / Datos del transportista:
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ej. Chofer Manuel Torres placa F3X-890. Entrega en Almacén Central."
              className="w-full text-xs p-3 rounded-2xl border border-[#E5E5EA] bg-[#F2F2F7] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#34C759]/30 focus:border-[#34C759]"
            />
          </div>

          <p className="text-[11px] text-[#8E8E93] italic">
            Al cerrar, los botones de conteo se bloquearán para evitar toques involuntarios mientras guardas la mercadería en estantes.
          </p>
        </div>

        {/* Footer */}
        <div className="p-4 bg-white border-t border-[#E5E5EA] flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 px-4 border border-[#E5E5EA] text-[#3A3A3C] font-semibold rounded-2xl hover:bg-[#F2F2F7] min-h-[48px]"
          >
            Seguir revisando
          </button>
          <button
            type="button"
            onClick={() => onConfirmClose(notes, autoMarkMissing)}
            className="flex-2 py-3 px-4 bg-[#34C759] hover:bg-[#2EB84F] active:bg-[#28A745] text-white font-bold rounded-2xl shadow-xs flex items-center justify-center gap-2 min-h-[48px]"
          >
            <CheckCircle2 className="w-5 h-5" />
            <span>Confirmar y Cerrar</span>
          </button>
        </div>
      </div>
    </div>
  );
};
