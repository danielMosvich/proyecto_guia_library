import React, { useState, useEffect } from 'react';
import { X, AlertTriangle, CheckCircle2 } from 'lucide-react';
import type { ReceptionItem, IncidentType } from '../types';

interface IncidentSheetProps {
  item: ReceptionItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (incidentType: IncidentType, observations: string) => void;
}

const INCIDENT_OPTIONS: Array<{
  type: IncidentType;
  label: string;
  desc: string;
  color: string;
}> = [
  {
    type: 'faltante',
    label: 'Faltante',
    desc: 'La cantidad física es menor a la que indica la guía/factura',
    color: 'border-[#FF3B30] bg-[#FFEBEA] text-[#FF3B30]'
  },
  {
    type: 'danado',
    label: 'Dañado / Roto',
    desc: 'Empaque roto, producto vencido o mercadería averiada',
    color: 'border-[#FF3B30] bg-[#FFEBEA] text-[#FF3B30]'
  },
  {
    type: 'cambiado',
    label: 'Modelo / Color cambiado',
    desc: 'El código o característica no coincide con lo facturado',
    color: 'border-[#FF9500] bg-[#FFF4E5] text-[#FF9500]'
  },
  {
    type: 'sobrante',
    label: 'Sobrante',
    desc: 'Llegaron más unidades de las indicadas en el documento',
    color: 'border-[#007AFF] bg-[#E5F2FF] text-[#007AFF]'
  },
  {
    type: 'otro',
    label: 'Otra Novedad',
    desc: 'Observación especial de lote, presentación o transporte',
    color: 'border-[#AF52DE] bg-[#F5EAFB] text-[#AF52DE]'
  },
  {
    type: 'ninguno',
    label: 'Sin Novedad (Conforme)',
    desc: 'Limpiar incidencias previas y dejar conforme',
    color: 'border-[#34C759] bg-[#EBF9EE] text-[#34C759]'
  }
];

export const IncidentSheet: React.FC<IncidentSheetProps> = ({
  item,
  isOpen,
  onClose,
  onSave
}) => {
  if (!isOpen || !item) return null;

  const [selectedType, setSelectedType] = useState<IncidentType>(item.incidentType);
  const [notes, setNotes] = useState<string>(item.observations || '');

  useEffect(() => {
    setSelectedType(item.incidentType);
    setNotes(item.observations || '');
  }, [item?.id, item?.incidentType, item?.observations]);

  const handleSave = () => {
    onSave(selectedType, notes);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
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
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-xl bg-[#FFF4E5] text-[#FF9500]">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#1C1C1E] leading-tight">
                Registrar Novedad / Incidencia
              </h2>
              <p className="text-[11px] text-[#8E8E93] font-mono truncate max-w-[240px]">
                [{item.itemCode}] {item.description}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-[#F2F2F7] text-[#8E8E93] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Incident Type Selector */}
        <div className="p-4 space-y-3 overflow-y-auto">
          <label className="block text-xs font-bold text-[#8E8E93] uppercase tracking-wider">
            Tipo de Incidencia
          </label>
          <div className="grid grid-cols-1 gap-2">
            {INCIDENT_OPTIONS.map((opt) => {
              const isSelected = selectedType === opt.type;
              return (
                <button
                  key={opt.type}
                  type="button"
                  onClick={() => setSelectedType(opt.type)}
                  className={`w-full text-left p-3 rounded-2xl border text-xs transition-all flex items-start justify-between gap-2 min-h-[44px] ${
                    isSelected
                      ? `${opt.color} ring-2 ring-[#007AFF] font-bold shadow-xs`
                      : 'border-[#E5E5EA] hover:bg-[#F2F2F7] text-[#1C1C1E] bg-white'
                  }`}
                >
                  <div>
                    <div className="font-bold text-sm leading-tight">{opt.label}</div>
                    <div className="text-[11px] text-[#8E8E93] mt-0.5">{opt.desc}</div>
                  </div>
                  {isSelected && (
                    <CheckCircle2 className="w-5 h-5 text-[#007AFF] shrink-0 mt-0.5" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Observations Text */}
          <div className="pt-2">
            <label className="block text-xs font-semibold text-[#8E8E93] mb-1">
              Detalle o justificación para el supervisor / reclamo:
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ej. Llegaron 3 frascos derramados en la esquina de la caja. El proveedor envió color azul en lugar de negro."
              className="w-full text-xs p-3 rounded-xl border border-[#E5E5EA] bg-[#F2F2F7] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#007AFF]/30 focus:border-[#007AFF]"
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
            onClick={handleSave}
            className="flex-2 py-3 px-4 bg-[#007AFF] hover:bg-[#0066D6] active:bg-[#0055B3] text-white font-bold rounded-2xl shadow-xs min-h-[48px]"
          >
            Guardar Observación
          </button>
        </div>
      </div>
    </div>
  );
};
