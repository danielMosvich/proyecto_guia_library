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
    color: 'border-rose-400 bg-rose-50 text-rose-800'
  },
  {
    type: 'danado',
    label: 'Dañado / Roto',
    desc: 'Empaque roto, producto vencido o mercadería averiada',
    color: 'border-red-500 bg-red-50 text-red-900'
  },
  {
    type: 'cambiado',
    label: 'Modelo / Color cambiado',
    desc: 'El código o característica no coincide con lo facturado',
    color: 'border-amber-400 bg-amber-50 text-amber-800'
  },
  {
    type: 'sobrante',
    label: 'Sobrante',
    desc: 'Llegaron más unidades de las indicadas en el documento',
    color: 'border-blue-400 bg-blue-50 text-blue-800'
  },
  {
    type: 'otro',
    label: 'Otra Novedad',
    desc: 'Observación especial de lote, presentación o transporte',
    color: 'border-purple-400 bg-purple-50 text-purple-800'
  },
  {
    type: 'ninguno',
    label: 'Sin Novedad (Conforme)',
    desc: 'Limpiar incidencias previas y dejar conforme',
    color: 'border-emerald-400 bg-emerald-50 text-emerald-800'
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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="w-full sm:max-w-md bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] pb-safe"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-4 py-3 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
            <div>
              <h2 className="text-sm font-semibold text-white leading-tight">
                Registrar Novedad / Incidencia
              </h2>
              <p className="text-[11px] text-slate-400 font-mono truncate max-w-[240px]">
                [{item.itemCode}] {item.description}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Incident Type Selector */}
        <div className="p-4 space-y-3 overflow-y-auto">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
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
                  className={`w-full text-left p-3 rounded-xl border text-xs transition-all flex items-start justify-between gap-2 min-h-[44px] ${
                    isSelected
                      ? `${opt.color} ring-2 ring-blue-600 font-semibold shadow-xs`
                      : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                  }`}
                >
                  <div>
                    <div className="font-bold text-sm leading-tight">{opt.label}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">{opt.desc}</div>
                  </div>
                  {isSelected && (
                    <CheckCircle2 className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Observations Text */}
          <div className="pt-2">
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Detalle o justificación para el supervisor / reclamo:
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ej. Llegaron 3 frascos derramados en la esquina de la caja. El proveedor envió color azul en lugar de negro."
              className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 px-4 border border-slate-300 text-slate-700 font-semibold rounded-xl hover:bg-slate-100 min-h-[48px]"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex-2 py-3 px-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold rounded-xl shadow-md min-h-[48px]"
          >
            Guardar Observación
          </button>
        </div>
      </div>
    </div>
  );
};
