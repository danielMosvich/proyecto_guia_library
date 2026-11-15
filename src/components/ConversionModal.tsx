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
  if (!isOpen || !item) return null;

  const [active, setActive] = useState<boolean>(item.conversionActive);
  const [factor, setFactor] = useState<number>(item.conversionFactor || 1);
  const [targetUnit, setTargetUnit] = useState<string>(item.conversionTargetUnit || 'Unidad');

  useEffect(() => {
    setActive(item.conversionActive);
    setFactor(item.conversionFactor > 1 ? item.conversionFactor : item.suggestedConversion || 12);
    setTargetUnit(item.conversionTargetUnit || 'Unidad');
  }, [item?.id, item?.conversionActive, item?.conversionFactor, item?.conversionTargetUnit]);

  const handleSave = () => {
    onSave(active, Math.max(1, factor), targetUnit.trim() || 'Unidad');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-4 py-3 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Scale className="w-5 h-5 text-blue-400" />
            <h2 className="text-sm font-semibold text-white">Factor de Conversión de Empaque</h2>
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 space-y-4">
          <p className="text-xs text-slate-600">
            Define cuántas unidades mínimas contiene cada <strong>{item.unitName}</strong> para permitir conteos mixtos (por cajas cerradas o por unidades sueltas).
          </p>

          {/* Toggle Switch */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
            <div>
              <div className="text-xs font-bold text-slate-800">Habilitar conversión</div>
              <div className="text-[11px] text-slate-500">
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
              <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {/* Suggested factor badge if available */}
          {item.suggestedConversion && item.suggestedConversion > 1 && (
            <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between text-xs text-blue-900">
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-blue-600" />
                <span>Detectado en descripción: <strong>x{item.suggestedConversion}</strong></span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setFactor(item.suggestedConversion || 12);
                  setActive(true);
                }}
                className="text-xs font-bold text-blue-700 hover:underline px-2 py-1 bg-white rounded-md border border-blue-200 shadow-xs"
              >
                Aplicar
              </button>
            </div>
          )}

          {/* Factor multiplier input */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Cantidad de unidades por cada 1 {item.unitName}:
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                min="2"
                step="1"
                disabled={!active}
                value={factor}
                onChange={(e) => setFactor(parseInt(e.target.value, 10) || 1)}
                className="w-full text-lg font-bold text-center px-3 py-2 border rounded-xl border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100 disabled:text-slate-400"
              />
            </div>
            <div className="flex gap-1.5 mt-2">
              {[6, 10, 12, 24, 36, 50, 100].map((f) => (
                <button
                  key={f}
                  type="button"
                  disabled={!active}
                  onClick={() => setFactor(f)}
                  className="flex-1 py-1 text-xs font-semibold bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-700 rounded-lg border border-slate-200"
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* Target Unit Name */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Nombre de la unidad mínima:
            </label>
            <input
              type="text"
              disabled={!active}
              value={targetUnit}
              onChange={(e) => setTargetUnit(e.target.value)}
              placeholder="Ej. Unidad, Frasco, Sobre"
              className="w-full text-xs px-3 py-2 border rounded-xl border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 px-4 border border-slate-300 text-slate-700 font-semibold rounded-xl hover:bg-slate-100 text-xs"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex-1 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md flex items-center justify-center gap-1.5 text-xs"
          >
            <Check className="w-4 h-4" />
            <span>Guardar</span>
          </button>
        </div>
      </div>
    </div>
  );
};
