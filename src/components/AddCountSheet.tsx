import React, { useState, useEffect } from 'react';
import { X, Plus } from 'lucide-react';
import type { ReceptionItem } from '../types';
import { formatQuantityWithUnit } from '../utils/sunatXmlParser';

interface AddCountSheetProps {
  item: ReceptionItem | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (baseUnitsToAdd: number, rawInput: number, unitUsed: string, boxTag?: string) => void;
}

export const AddCountSheet: React.FC<AddCountSheetProps> = ({
  item,
  isOpen,
  onClose,
  onConfirm,
}) => {
  if (!isOpen || !item) return null;

  const [inputVal, setInputVal] = useState<string>('1');
  const [selectedUnitType, setSelectedUnitType] = useState<'base' | 'box'>(
    item.conversionActive ? 'base' : 'base'
  );
  const [boxTag, setBoxTag] = useState<string>('');

  const remaining = Math.max(0, item.expectedQuantity - item.receivedQuantity);
  const factor = item.conversionActive && item.conversionFactor > 1 ? item.conversionFactor : 1;

  // Reset form when item opens
  useEffect(() => {
    setInputVal('1');
    setBoxTag('');
    setSelectedUnitType('base');
  }, [item?.id]);

  const parsedQty = parseFloat(inputVal) || 0;
  const baseUnitsToAdd = selectedUnitType === 'box' ? parsedQty * factor : parsedQty;

  const handlePresetAdd = (amount: number) => {
    setInputVal(String(amount));
  };

  const handleFillRemaining = () => {
    if (selectedUnitType === 'box') {
      const boxes = remaining / factor;
      setInputVal(String(Number.isInteger(boxes) ? boxes : boxes.toFixed(1)));
    } else {
      setInputVal(String(remaining));
    }
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (baseUnitsToAdd <= 0) return;

    const unitLabel = selectedUnitType === 'box' ? item.unitName : (item.conversionTargetUnit || 'Unidad');
    onConfirm(baseUnitsToAdd, parsedQty, unitLabel, boxTag);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="w-full sm:max-w-md bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] pb-safe"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-4 py-3 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="min-w-0 pr-2">
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-xs px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 font-bold">
                {item.itemCode}
              </span>
              <span className="text-xs text-slate-400">Línea {item.lineId}</span>
            </div>
            <h2 className="text-sm font-semibold truncate text-white mt-0.5">
              {item.description}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current status display */}
        <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-200 flex items-center justify-between text-xs">
          <div>
            <span className="text-slate-500">Recibido actual:</span>{' '}
            <span className="font-bold text-slate-800">
              {formatQuantityWithUnit(item.receivedQuantity, item.unitName, item.unitNamePlural)}
            </span>
          </div>
          {!item.isExtra && (
            <div>
              <span className="text-slate-500">Esperado:</span>{' '}
              <span className="font-bold text-slate-800">
                {formatQuantityWithUnit(item.expectedQuantity, item.unitName, item.unitNamePlural)}
              </span>
              {remaining > 0 && (
                <span className="ml-1 text-amber-600 font-semibold">
                  (Faltan {remaining})
                </span>
              )}
            </div>
          )}
        </div>

        {/* Form Body */}
        <div className="p-4 space-y-4 overflow-y-auto">
          {/* Unit Toggle if Conversion is active */}
          {item.conversionActive && factor > 1 && (
            <div className="flex rounded-lg bg-slate-100 p-1 border border-slate-200 text-xs">
              <button
                type="button"
                onClick={() => setSelectedUnitType('base')}
                className={`flex-1 py-1.5 rounded-md font-medium transition-all ${
                  selectedUnitType === 'base'
                    ? 'bg-white text-blue-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Sumar por {item.conversionTargetUnit || 'Unidades'} sueltas
              </button>
              <button
                type="button"
                onClick={() => setSelectedUnitType('box')}
                className={`flex-1 py-1.5 rounded-md font-medium transition-all ${
                  selectedUnitType === 'box'
                    ? 'bg-white text-blue-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Sumar por {item.unitName} (x{factor})
              </button>
            </div>
          )}

          {/* Quantity Input with large buttons */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Cantidad a sumar ahora
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  const val = Math.max(1, (parseFloat(inputVal) || 0) - 1);
                  setInputVal(String(val));
                }}
                className="w-12 h-12 rounded-xl bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-800 font-bold text-xl flex items-center justify-center shrink-0 border border-slate-300"
              >
                -
              </button>

              <div className="relative flex-1">
                <input
                  type="number"
                  inputMode="numeric"
                  min="0.01"
                  step="any"
                  value={inputVal}
                  onChange={(e) => setInputVal(e.target.value)}
                  onFocus={(e) => e.target.select()}
                  className="w-full h-12 text-center text-2xl font-black text-slate-900 bg-white border-2 border-blue-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
                  placeholder="0"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 uppercase">
                  {selectedUnitType === 'box' ? item.unitName : (item.conversionTargetUnit || item.unitName)}
                </span>
              </div>

              <button
                type="button"
                onClick={() => {
                  const val = (parseFloat(inputVal) || 0) + 1;
                  setInputVal(String(val));
                }}
                className="w-12 h-12 rounded-xl bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-800 font-bold text-xl flex items-center justify-center shrink-0 border border-slate-300"
              >
                +
              </button>
            </div>

            {/* If box mode, display calculated units */}
            {selectedUnitType === 'box' && factor > 1 && (
              <p className="text-xs text-blue-700 font-semibold mt-1 text-center">
                = {baseUnitsToAdd} {item.conversionTargetUnit || 'Unidades'}
              </p>
            )}
          </div>

          {/* Quick preset chips */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Atajos rápidos:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {[1, 2, 5, 10, 12, 24].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => handlePresetAdd(n)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 active:bg-blue-100 active:text-blue-700 text-xs font-bold text-slate-700 rounded-lg border border-slate-200 transition-colors"
                >
                  +{n}
                </button>
              ))}
              {remaining > 0 && (
                <button
                  type="button"
                  onClick={handleFillRemaining}
                  className="px-3 py-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 text-xs font-bold rounded-lg border border-emerald-300 transition-colors ml-auto"
                >
                  Resto ({remaining})
                </button>
              )}
            </div>
          </div>

          {/* Optional Box / Package Tag */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Etiqueta de caja o ubicación <span className="text-slate-400 font-normal">(opcional)</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={boxTag}
                onChange={(e) => setBoxTag(e.target.value)}
                placeholder="Ej. Caja 1, Parihuela B, Paquete superior"
                className="w-full text-xs px-3 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <div className="flex gap-1.5 mt-1.5">
                {['Caja 1', 'Caja 2', 'Caja 3', 'Parihuela 1'].map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => setBoxTag(tag)}
                    className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-600 hover:bg-slate-200"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 px-4 border border-slate-300 text-slate-700 font-semibold rounded-xl hover:bg-slate-100 active:bg-slate-200 transition-colors min-h-[48px]"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => handleSubmit()}
            disabled={baseUnitsToAdd <= 0}
            className="flex-2 py-3 px-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 text-white font-bold rounded-xl shadow-md flex items-center justify-center gap-2 transition-transform active:scale-98 min-h-[48px]"
          >
            <Plus className="w-5 h-5" />
            <span>Confirmar +{baseUnitsToAdd}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
