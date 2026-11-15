import React, { useState, useEffect } from 'react';
import { X, Plus } from 'lucide-react';
import type { ReceptionItem } from '../types';
import { formatQuantityWithUnit } from '../utils/sunatXmlParser';

interface AddCountSheetProps {
  item: ReceptionItem | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (
    amountToAdd: number,
    rawInput: number,
    unitUsed: string,
    boxTag?: string,
    isLooseUnit?: boolean,
    manualFactor?: number
  ) => void;
}

export const AddCountSheet: React.FC<AddCountSheetProps> = ({
  item,
  isOpen,
  onClose,
  onConfirm,
}) => {
  const isPackageUnit = item
    ? item.unitName !== 'Unidad' && item.rawUnitCode !== 'NIU' && item.rawUnitCode !== 'ZZ'
    : false;

  const [inputVal, setInputVal] = useState<string>('1');
  const [countLooseUnits, setCountLooseUnits] = useState<boolean>(false);
  const [manualFactorInput, setManualFactorInput] = useState<string>('');
  const [boxTag, setBoxTag] = useState<string>('');

  useEffect(() => {
    if (item && isOpen) {
      setInputVal('1');
      setBoxTag('');
      setCountLooseUnits(item.conversionActive || false);
      setManualFactorInput(
        item.conversionActive && item.conversionFactor > 1 ? String(item.conversionFactor) : ''
      );
    }
  }, [item?.id, item?.conversionActive, item?.conversionFactor, isOpen]);

  if (!isOpen || !item) return null;

  const remainingXMLUnits = Math.max(0, item.expectedQuantity - item.receivedQuantity);

  const parsedQty = parseFloat(inputVal) || 0;
  const parsedFactor = parseInt(manualFactorInput, 10);
  const hasValidFactor = !isNaN(parsedFactor) && parsedFactor > 1;

  const handlePresetAdd = (amount: number) => {
    setInputVal(String(amount));
  };

  const handleFillRemaining = () => {
    if (countLooseUnits && hasValidFactor) {
      const totalExpectedUnits = item.expectedQuantity * parsedFactor;
      const totalRecUnits = (item.receivedQuantity * parsedFactor) + (item.looseUnitsReceived || 0);
      const remUnits = Math.max(0, totalExpectedUnits - totalRecUnits);
      setInputVal(String(remUnits));
    } else {
      setInputVal(String(remainingXMLUnits));
    }
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (parsedQty <= 0) return;

    if (countLooseUnits) {
      onConfirm(
        parsedQty,
        parsedQty,
        'Unidades',
        boxTag,
        true,
        hasValidFactor ? parsedFactor : undefined
      );
    } else {
      onConfirm(
        parsedQty,
        parsedQty,
        item.unitName,
        boxTag,
        false,
        undefined
      );
    }
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

        {/* Header */}
        <div className="px-4 py-2.5 bg-white text-[#1C1C1E] flex items-center justify-between border-b border-[#E5E5EA]">
          <div className="min-w-0 pr-2">
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-xs px-2 py-0.5 rounded-md bg-[#E5F2FF] text-[#007AFF] font-bold">
                {item.itemCode}
              </span>
              <span className="text-xs text-[#8E8E93]">Línea {item.lineId}</span>
            </div>
            <h2 className="text-sm font-bold truncate text-[#1C1C1E] mt-0.5">
              {item.description}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-[#F2F2F7] active:bg-[#E5E5EA] text-[#8E8E93] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current status display (iOS Style) */}
        <div className="bg-[#F2F2F7] px-4 py-2 border-b border-[#E5E5EA] flex items-center justify-between text-xs">
          <div>
            <span className="text-[#8E8E93]">Recibido actual: </span>
            <strong className="text-[#1C1C1E]">
              {formatQuantityWithUnit(item.receivedQuantity, item.unitName, item.unitNamePlural)}
              {(item.looseUnitsReceived || 0) > 0 && ` + ${item.looseUnitsReceived} Und`}
            </strong>
          </div>
          {!item.isExtra && (
            <div>
              <span className="text-[#8E8E93]">Esperado: </span>
              <strong className="text-[#1C1C1E]">
                {formatQuantityWithUnit(item.expectedQuantity, item.unitName, item.unitNamePlural)}
              </strong>
            </div>
          )}
        </div>

        {/* Form Body */}
        <div className="p-4 space-y-3.5 overflow-y-auto">
          {/* Switch: "Contar unidades sueltas" (Only when XML unit is a container) */}
          {isPackageUnit && (
            <div className="p-3 bg-[#F2F2F7] rounded-2xl border border-[#E5E5EA] space-y-2.5">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-[#1C1C1E]">Contar unidades sueltas</div>
                  <div className="text-[11px] text-[#8E8E93]">
                    {countLooseUnits ? 'Ingresando piezas individuales' : `Contando por ${item.unitNamePlural}`}
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={countLooseUnits}
                    onChange={(e) => setCountLooseUnits(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-[#E5E5EA] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-[#D1D1D6] after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#007AFF]"></div>
                </label>
              </div>

              {/* Sub-section: Factor input if counting loose units */}
              {countLooseUnits && (
                <div className="pt-2 border-t border-[#E5E5EA] space-y-1.5">
                  <label className="block text-[11px] font-semibold text-[#3A3A3C]">
                    ¿Cuántas unidades trae 1 {item.unitName}? <span className="font-normal text-[#8E8E93]">(opcional)</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="2"
                      placeholder="Ej. 12 (o dejar vacío)"
                      value={manualFactorInput}
                      onChange={(e) => setManualFactorInput(e.target.value)}
                      className="w-full text-xs font-bold px-3 py-2 rounded-xl border border-[#E5E5EA] bg-white text-[#1C1C1E] focus:outline-none focus:ring-2 focus:ring-[#007AFF]/30 focus:border-[#007AFF]"
                    />
                  </div>
                  <p className="text-[10px] text-[#8E8E93]">
                    {hasValidFactor
                      ? `Con factor: 1 ${item.unitName} = ${parsedFactor} Und. Total esperado: ${item.expectedQuantity * parsedFactor} Und.`
                      : 'Sin factor (conteo mixto): Se sumarán unidades sueltas y podrás presionar "Marcar como Completo" en la tarjeta.'}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Quantity Input with large buttons */}
          <div>
            <label className="block text-xs font-bold text-[#8E8E93] uppercase tracking-wider mb-1.5">
              Cantidad a sumar {countLooseUnits ? '(Unidades sueltas)' : `(${item.unitNamePlural})`}
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  const val = Math.max(1, (parseFloat(inputVal) || 0) - 1);
                  setInputVal(String(val));
                }}
                className="w-12 h-12 rounded-2xl bg-[#F2F2F7] hover:bg-[#E5E5EA] active:bg-[#D1D1D6] text-[#1C1C1E] font-bold text-xl flex items-center justify-center shrink-0 border border-[#E5E5EA]"
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
                  className="w-full h-12 text-center text-2xl font-black text-[#1C1C1E] bg-[#F2F2F7] border border-[#E5E5EA] rounded-2xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#007AFF]/30 focus:border-[#007AFF]"
                  placeholder="0"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#8E8E93] uppercase">
                  {countLooseUnits ? 'Und' : item.unitName}
                </span>
              </div>

              <button
                type="button"
                onClick={() => {
                  const val = (parseFloat(inputVal) || 0) + 1;
                  setInputVal(String(val));
                }}
                className="w-12 h-12 rounded-2xl bg-[#F2F2F7] hover:bg-[#E5E5EA] active:bg-[#D1D1D6] text-[#1C1C1E] font-bold text-xl flex items-center justify-center shrink-0 border border-[#E5E5EA]"
              >
                +
              </button>
            </div>
          </div>

          {/* Quick preset chips */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-bold text-[#8E8E93] uppercase tracking-wider">
              Atajos rápidos:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {[1, 2, 5, 10, 12, 24].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => handlePresetAdd(n)}
                  className="px-3 py-1.5 bg-[#F2F2F7] hover:bg-[#E5E5EA] active:bg-[#E5F2FF] active:text-[#007AFF] text-xs font-bold text-[#1C1C1E] rounded-xl border border-[#E5E5EA] transition-colors"
                >
                  +{n}
                </button>
              ))}
              {!countLooseUnits && remainingXMLUnits > 0 && (
                <button
                  type="button"
                  onClick={handleFillRemaining}
                  className="px-3 py-1.5 bg-[#EBF9EE] hover:bg-[#D5F5DA] text-[#34C759] text-xs font-bold rounded-xl border border-[#D1F2D9] transition-colors ml-auto"
                >
                  Resto ({remainingXMLUnits})
                </button>
              )}
            </div>
          </div>

          {/* Optional Box / Package Tag */}
          <div>
            <label className="block text-xs font-semibold text-[#8E8E93] mb-1">
              Etiqueta de caja o ubicación <span className="font-normal">(opcional)</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={boxTag}
                onChange={(e) => setBoxTag(e.target.value)}
                placeholder="Ej. Caja 1, Parihuela B, Paquete superior"
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-[#E5E5EA] bg-[#F2F2F7] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#007AFF]/30 focus:border-[#007AFF]"
              />
              <div className="flex gap-1.5 mt-2">
                {['Caja 1', 'Caja 2', 'Caja 3', 'Parihuela 1'].map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => setBoxTag(tag)}
                    className="text-[10px] font-semibold px-2.5 py-1 rounded-lg bg-[#F2F2F7] text-[#3A3A3C] hover:bg-[#E5E5EA] border border-[#E5E5EA]"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions: Clean button label "Confirmar" without duplicate + */}
        <div className="p-4 bg-white border-t border-[#E5E5EA] flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 px-4 border border-[#E5E5EA] text-[#3A3A3C] font-semibold rounded-2xl hover:bg-[#F2F2F7] active:bg-[#E5E5EA] transition-colors min-h-[48px]"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => handleSubmit()}
            disabled={parsedQty <= 0}
            className="flex-2 py-3 px-4 bg-[#007AFF] hover:bg-[#0066D6] active:bg-[#0055B3] disabled:opacity-40 text-white font-bold rounded-2xl shadow-xs flex items-center justify-center gap-1.5 transition-transform active:scale-98 min-h-[48px]"
          >
            <Plus className="w-5 h-5" />
            <span>Confirmar {parsedQty} {countLooseUnits ? 'Unidades' : item.unitNamePlural}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
