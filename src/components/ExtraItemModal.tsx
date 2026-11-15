import React, { useState, useEffect } from 'react';
import { X, PlusCircle, AlertOctagon } from 'lucide-react';
import type { ExtraReason } from '../types';

interface ExtraItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialQuery?: string;
  onConfirm: (data: {
    itemCode?: string;
    description: string;
    unitName: string;
    unitNamePlural: string;
    quantity: number;
    reason: ExtraReason;
    observations?: string;
  }) => void;
}

const UNIT_CHOICES = [
  { singular: 'Unidad', plural: 'Unidades' },
  { singular: 'Caja', plural: 'Cajas' },
  { singular: 'Paquete', plural: 'Paquetes' },
  { singular: 'Bolsa', plural: 'Bolsas' },
  { singular: 'Botella', plural: 'Botellas' },
  { singular: 'Rollo', plural: 'Rollos' },
];

const REASON_CHOICES: Array<{ reason: ExtraReason; label: string; desc: string }> = [
  { reason: 'bonificacion', label: 'Bonificación / Regalo', desc: 'Mercadería promocional entregada sin costo por el proveedor' },
  { reason: 'error_envio', label: 'Enviado por Error', desc: 'No pertenece a esta orden de compra o pedido' },
  { reason: 'reemplazo', label: 'Reemplazo de otro ítem', desc: 'Sustituto de algún producto agotado' },
  { reason: 'otro', label: 'Otro Motivo', desc: 'Diferencia no identificada pendiente de liquidación' },
];

export const ExtraItemModal: React.FC<ExtraItemModalProps> = ({
  isOpen,
  onClose,
  initialQuery = '',
  onConfirm,
}) => {
  const [description, setDescription] = useState<string>('');
  const [itemCode, setItemCode] = useState<string>('');
  const [quantity, setQuantity] = useState<string>('1');
  const [selectedUnit, setSelectedUnit] = useState(UNIT_CHOICES[0]);
  const [reason, setReason] = useState<ExtraReason>('bonificacion');
  const [observations, setObservations] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      if (initialQuery.trim()) {
        if (/^\d+$/.test(initialQuery.trim())) {
          setItemCode(initialQuery.trim());
          setDescription('');
        } else {
          setDescription(initialQuery.trim().toUpperCase());
          setItemCode('');
        }
      } else {
        setDescription('');
        setItemCode('');
      }
      setQuantity('1');
      setSelectedUnit(UNIT_CHOICES[0]);
      setReason('bonificacion');
      setObservations('');
    }
  }, [initialQuery, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!description.trim()) return;

    const parsedQty = Math.max(1, parseFloat(quantity) || 1);

    onConfirm({
      itemCode: itemCode.trim() || undefined,
      description: description.trim(),
      unitName: selectedUnit.singular,
      unitNamePlural: selectedUnit.plural,
      quantity: parsedQty,
      reason,
      observations: observations.trim() || undefined,
    });

    onClose();
  };

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
            <div className="p-1.5 rounded-xl bg-[#F5EAFB] text-[#AF52DE]">
              <AlertOctagon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#1C1C1E]">Registrar Producto Extra</h2>
              <p className="text-[11px] text-[#8E8E93]">Mercadería física que NO figura en el comprobante</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-[#F2F2F7] text-[#8E8E93]">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 space-y-3.5 overflow-y-auto">
          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-[#8E8E93] uppercase tracking-wider mb-1">
              Descripción del Producto *
            </label>
            <input
              type="text"
              required
              autoFocus
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ej. RESALTADOR AMARILLO PASTEL ARTESCO"
              className="w-full text-xs font-medium px-3.5 py-2.5 rounded-2xl border border-[#E5E5EA] bg-[#F2F2F7] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#AF52DE]/30 focus:border-[#AF52DE] uppercase text-[#1C1C1E]"
            />
          </div>

          {/* SKU / Code */}
          <div>
            <label className="block text-xs font-semibold text-[#8E8E93] mb-1">
              Código / SKU / Código de barras <span className="font-normal">(opcional)</span>
            </label>
            <input
              type="text"
              value={itemCode}
              onChange={(e) => setItemCode(e.target.value)}
              placeholder="Ej. 7750123999 o dejar en blanco"
              className="w-full text-xs font-mono px-3.5 py-2.5 rounded-2xl border border-[#E5E5EA] bg-[#F2F2F7] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#AF52DE]/30 focus:border-[#AF52DE] text-[#1C1C1E]"
            />
          </div>

          {/* Quantity & Unit */}
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-xs font-bold text-[#8E8E93] uppercase tracking-wider mb-1">
                Cantidad Recibida *
              </label>
              <input
                type="number"
                inputMode="numeric"
                min="1"
                step="any"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full text-base font-bold text-center px-3 py-2 rounded-2xl border border-[#E5E5EA] bg-[#F2F2F7] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#AF52DE]/30 focus:border-[#AF52DE] text-[#1C1C1E]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#8E8E93] uppercase tracking-wider mb-1">
                Unidad *
              </label>
              <select
                value={selectedUnit.singular}
                onChange={(e) => {
                  const found = UNIT_CHOICES.find(u => u.singular === e.target.value) || UNIT_CHOICES[0];
                  setSelectedUnit(found);
                }}
                className="w-full text-xs font-semibold px-2 py-2.5 rounded-2xl border border-[#E5E5EA] bg-[#F2F2F7] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#AF52DE]/30 focus:border-[#AF52DE] text-[#1C1C1E]"
              >
                {UNIT_CHOICES.map(u => (
                  <option key={u.singular} value={u.singular}>
                    {u.singular}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Reason */}
          <div>
            <label className="block text-xs font-bold text-[#8E8E93] uppercase tracking-wider mb-1">
              Motivo de Ingreso Extra
            </label>
            <div className="grid grid-cols-1 gap-1.5">
              {REASON_CHOICES.map((r) => (
                <button
                  key={r.reason}
                  type="button"
                  onClick={() => setReason(r.reason)}
                  className={`text-left p-3 rounded-2xl border text-xs transition-colors ${
                    reason === r.reason
                      ? 'border-[#AF52DE] bg-[#F5EAFB] text-[#AF52DE] font-bold shadow-xs'
                      : 'border-[#E5E5EA] text-[#1C1C1E] hover:bg-[#F2F2F7]'
                  }`}
                >
                  <div className="font-bold text-xs">{r.label}</div>
                  <div className="text-[10px] text-[#8E8E93] mt-0.5">{r.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Observations */}
          <div>
            <label className="block text-xs font-semibold text-[#8E8E93] mb-1">
              Observaciones adicionales
            </label>
            <input
              type="text"
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
              placeholder="Ej. Vino adjunto en caja con cinta de embalaje"
              className="w-full text-xs px-3.5 py-2.5 rounded-2xl border border-[#E5E5EA] bg-[#F2F2F7] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#AF52DE]/30 focus:border-[#AF52DE] text-[#1C1C1E]"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-white border-t border-[#E5E5EA] flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 px-4 border border-[#E5E5EA] text-[#3A3A3C] font-semibold rounded-2xl hover:bg-[#F2F2F7] min-h-[48px]"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => handleSubmit()}
            disabled={!description.trim()}
            className="flex-2 py-3 px-4 bg-[#AF52DE] hover:bg-[#9E3ED0] active:bg-[#8D2EC2] disabled:opacity-40 text-white font-bold rounded-2xl shadow-xs flex items-center justify-center gap-1.5 min-h-[48px]"
          >
            <PlusCircle className="w-5 h-5" />
            <span>Registrar Extra</span>
          </button>
        </div>
      </div>
    </div>
  );
};
