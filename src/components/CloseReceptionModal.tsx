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
  if (!isOpen) return null;

  const [notes, setNotes] = useState<string>('');
  const [autoMarkMissing, setAutoMarkMissing] = useState<boolean>(true);

  const standardItems = items.filter(i => !i.isExtra);
  const completeItems = standardItems.filter(i => i.receivedQuantity === i.expectedQuantity && i.incidentType === 'ninguno');
  const zeroItems = standardItems.filter(i => i.receivedQuantity === 0);
  const partialItems = standardItems.filter(i => i.receivedQuantity > 0 && i.receivedQuantity < i.expectedQuantity);
  const surplusItems = standardItems.filter(i => i.receivedQuantity > i.expectedQuantity);
  const extraItems = items.filter(i => i.isExtra);
  const observedItems = items.filter(i => i.incidentType !== 'ninguno');

  const isIncomplete = zeroItems.length > 0 || partialItems.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="w-full sm:max-w-md bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] pb-safe"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-4 py-3 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-emerald-400" />
            <div>
              <h2 className="text-sm font-bold text-white">Finalizar y Cerrar Recepción</h2>
              <p className="text-[11px] text-slate-400">{reception.serieNumero} · {reception.proveedorNombre}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Validation Summary */}
        <div className="p-4 space-y-3.5 overflow-y-auto text-xs">
          <div className="grid grid-cols-2 gap-2 text-center">
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
              <div className="text-2xl font-black text-emerald-700">{completeItems.length}</div>
              <div className="text-[11px] font-semibold text-emerald-800">Conformes (100%)</div>
            </div>
            <div className={`p-3 rounded-xl border ${isIncomplete ? 'bg-amber-50 border-amber-300' : 'bg-slate-50 border-slate-200'}`}>
              <div className={`text-2xl font-black ${isIncomplete ? 'text-amber-700' : 'text-slate-700'}`}>
                {zeroItems.length + partialItems.length}
              </div>
              <div className="text-[11px] font-semibold text-slate-700">Incompletos / Sin llegar</div>
            </div>
          </div>

          {/* Warning banner if items remain missing */}
          {isIncomplete && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex gap-2.5 items-start text-amber-900">
              <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Hay {zeroItems.length + partialItems.length} producto(s) pendientes o con entrega parcial.</p>
                <p className="text-[11px] text-amber-800 mt-0.5">
                  {zeroItems.length} no registraron ningún ingreso y {partialItems.length} quedaron incompletos.
                </p>
              </div>
            </div>
          )}

          {/* Breakdown checklist */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
            <div className="flex justify-between items-center text-slate-600">
              <span>Total de líneas en documento:</span>
              <span className="font-bold text-slate-900">{standardItems.length}</span>
            </div>
            {zeroItems.length > 0 && (
              <div className="flex justify-between items-center text-rose-700 font-medium">
                <span>• No llegaron (0 recibidos):</span>
                <span className="font-bold">{zeroItems.length}</span>
              </div>
            )}
            {partialItems.length > 0 && (
              <div className="flex justify-between items-center text-amber-700 font-medium">
                <span>• Llegaron incompletos:</span>
                <span className="font-bold">{partialItems.length}</span>
              </div>
            )}
            {observedItems.length > 0 && (
              <div className="flex justify-between items-center text-rose-700 font-medium">
                <span>• Con incidencias/observaciones:</span>
                <span className="font-bold">{observedItems.length}</span>
              </div>
            )}
            {surplusItems.length > 0 && (
              <div className="flex justify-between items-center text-blue-700 font-medium">
                <span>• Sobrantes recibidos:</span>
                <span className="font-bold">{surplusItems.length}</span>
              </div>
            )}
            {extraItems.length > 0 && (
              <div className="flex justify-between items-center text-purple-700 font-medium">
                <span>• Productos extras (no en guía):</span>
                <span className="font-bold">{extraItems.length}</span>
              </div>
            )}
          </div>

          {/* Auto mark missing checkbox */}
          {isIncomplete && (
            <label className="flex items-start gap-2.5 p-3 rounded-xl border border-slate-200 bg-white cursor-pointer select-none">
              <input
                type="checkbox"
                checked={autoMarkMissing}
                onChange={(e) => setAutoMarkMissing(e.target.checked)}
                className="mt-0.5 w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
              />
              <span className="text-xs text-slate-700 leading-tight">
                <strong>Marcar automáticamente como Faltante</strong> los ítems que no llegaron o quedaron incompletos (para el reclamo al proveedor).
              </span>
            </label>
          )}

          {/* Supervisor closing notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Nota general de cierre / Datos del transportista:
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ej. Chofer Manuel Torres, camión placa F3X-890. Entrega recibida en Almacén Central."
              className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <p className="text-[11px] text-slate-500 italic">
            Al cerrar, los botones de conteo se bloquearán para evitar toques involuntarios mientras guardas la mercadería en estantes.
          </p>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 px-4 border border-slate-300 text-slate-700 font-semibold rounded-xl hover:bg-slate-100 min-h-[48px]"
          >
            Seguir revisando
          </button>
          <button
            type="button"
            onClick={() => onConfirmClose(notes, autoMarkMissing)}
            className="flex-2 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold rounded-xl shadow-md flex items-center justify-center gap-2 min-h-[48px]"
          >
            <CheckCircle2 className="w-5 h-5" />
            <span>Confirmar y Cerrar</span>
          </button>
        </div>
      </div>
    </div>
  );
};
