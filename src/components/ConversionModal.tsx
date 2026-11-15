import React, { useState, useEffect } from 'react';
import { X, Scale, Sparkles, Check } from 'lucide-react';
import type { ReceptionItem } from '../types';

interface ConversionModalProps {
  item: ReceptionItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (active: boolean, factor: number, targetUnit: string) => void;
}

export const ConversionModal: React.FC<ConversionModalProps> = ({
  item,
  isOpen,
  onClose,
  onSave,
}) => {
  const [active, setActive] = useState<boolean>(item?.conversionActive || false);
  const [factor, setFactor] = useState<number>(item?.conversionFactor || 1);
  const [targetUnit, setTargetUnit] = useState<string>(item?.conversionTargetUnit || 'Unidad');

  useEffect(() => {
    if (item && isOpen) {
      setActive(item.conversionActive);
      setFactor(item.conversionFactor > 1 ? item.conversionFactor : item.suggestedConversion || 12);
      setTargetUnit(item.conversionTargetUnit || 'Unidad');
    }
  }, [item?.id, item?.conversionActive, item?.conversionFactor, item?.conversionTargetUnit, item?.suggestedConversion, isOpen]);

  if (!isOpen || !item) return null;

  const handleSave = () => {
    onSave(active, Math.max(1, factor), targetUnit.trim() || 'Unidad');
    onClose();
  };

  return (
    <div 
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div 
        className="w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header (iOS Light) */}
        <div className="px-4 py-3 bg-white text-[#1C1C1E] flex items-center justify-between border-b border-[#E5E5EA]">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-xl bg-[#E5F2FF] text-[#007AFF]">
              <Scale className="w-5 h-5" />
            </div>
            <h2 className="text-sm font-bold text-[#1C1C1E]">Factor de Conversión</h2>
          </div>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-[#F2F2F7] text-[#8E8E93]">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 space-y-4">
          <p className="text-xs text-[#8E8E93]">
            Define cuántas unidades mínimas contiene cada <strong>{item.unitName}</strong> para permitir conteos por cajas cerradas o por unidades sueltas.
          </p>

          {/* Toggle Switch (iOS style) */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-[#F2F2F7] border border-[#E5E5EA]">
            <div>
              <div className="text-xs font-bold text-[#1C1C1E]">Habilitar conversión</div>
              <div className="text-[11px] text-[#8E8E93]">
                1 {item.unitName} = {factor} {targetUnit}
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={active}
                onChange={(e) => setActive(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-[#E5E5EA] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-[#D1D1D6] after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#34C759]"></div>
            </label>
          </div>

          {/* Suggested factor badge if available */}
          {item.suggestedConversion && item.suggestedConversion > 1 && (
            <div className="p-2.5 bg-[#E5F2FF] border border-[#CCE5FF] rounded-2xl flex items-center justify-between text-xs text-[#007AFF]">
              <div className="flex items-center gap-1.5 font-medium">
                <Sparkles className="w-4 h-4 text-[#007AFF]" />
                <span>Sugerido por descripción: <strong>x{item.suggestedConversion}</strong></span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setFactor(item.suggestedConversion || 12);
                  setActive(true);
                }}
                className="text-xs font-bold text-[#007AFF] hover:underline px-2.5 py-1 bg-white rounded-xl border border-[#CCE5FF] shadow-2xs"
              >
                Aplicar
              </button>
            </div>
          )}

          {/* Factor multiplier input */}
          <div>
            <label className="block text-xs font-bold text-[#8E8E93] mb-1">
              Unidades por cada 1 {item.unitName}:
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                min="2"
                step="1"
                disabled={!active}
                value={factor}
                onChange={(e) => setFactor(parseInt(e.target.value, 10) || 1)}
                className="w-full text-lg font-bold text-center px-3 py-2 border rounded-2xl border-[#E5E5EA] bg-[#F2F2F7] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#007AFF]/30 disabled:bg-[#F2F2F7] disabled:text-[#AEAEB2]"
              />
            </div>
            <div className="flex gap-1.5 mt-2">
              {[6, 10, 12, 24, 36, 50, 100].map((f) => (
                <button
                  key={f}
                  type="button"
                  disabled={!active}
                  onClick={() => setFactor(f)}
                  className="flex-1 py-1 text-xs font-bold bg-[#F2F2F7] hover:bg-[#E5E5EA] disabled:opacity-40 text-[#1C1C1E] rounded-xl border border-[#E5E5EA]"
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* Target Unit Name */}
          <div>
            <label className="block text-xs font-bold text-[#8E8E93] mb-1">
              Nombre de la unidad mínima:
            </label>
            <input
              type="text"
              disabled={!active}
              value={targetUnit}
              onChange={(e) => setTargetUnit(e.target.value)}
              placeholder="Ej. Unidad, Frasco, Sobre"
              className="w-full text-xs px-3.5 py-2.5 border rounded-2xl border-[#E5E5EA] bg-[#F2F2F7] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#007AFF]/30 disabled:bg-[#F2F2F7]"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-3.5 bg-white border-t border-[#E5E5EA] flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 px-4 border border-[#E5E5EA] text-[#3A3A3C] font-semibold rounded-2xl hover:bg-[#F2F2F7] text-xs"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex-1 py-2.5 px-4 bg-[#007AFF] hover:bg-[#0066D6] text-white font-bold rounded-2xl shadow-xs flex items-center justify-center gap-1.5 text-xs"
          >
            <Check className="w-4 h-4" />
            <span>Guardar</span>
          </button>
        </div>
      </div>
    </div>
  );
};
