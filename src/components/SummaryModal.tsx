import React, { useState } from 'react';
import {
  X,
  Share2,
  FileSpreadsheet,
  FileJson,
  Check,
  Copy,
  Lock,
  Unlock,
  CheckCircle2,
} from 'lucide-react';
import type { Reception, ReceptionItem } from '../types';
import {
  generateWhatsAppSummary,
  exportReceptionToCSV,
  exportReceptionToPOSPayload,
  downloadJSON,
} from '../utils/exportHelpers';
import { formatQuantityWithUnit } from '../utils/sunatXmlParser';

interface SummaryModalProps {
  isOpen: boolean;
  reception: Reception;
  items: ReceptionItem[];
  onClose: () => void;
  onReopen?: () => void;
}

export const SummaryModal: React.FC<SummaryModalProps> = ({
  isOpen,
  reception,
  items,
  onClose,
  onReopen,
}) => {
  if (!isOpen) return null;

  const [copied, setCopied] = useState<boolean>(false);

  const standardItems = items.filter(i => !i.isExtra);
  const completeItems = standardItems.filter(
    i => i.receivedQuantity === i.expectedQuantity && i.incidentType === 'ninguno'
  );
  const conformityPercent = standardItems.length > 0
    ? Math.round((completeItems.length / standardItems.length) * 100)
    : 100;

  const missingItems = items.filter(i => !i.isExtra && i.receivedQuantity < i.expectedQuantity);
  const damagedItems = items.filter(i => i.incidentType === 'danado' || i.incidentType === 'cambiado');
  const surplusItems = items.filter(i => !i.isExtra && i.receivedQuantity > i.expectedQuantity);
  const extraItems = items.filter(i => i.isExtra);

  const handleCopyWhatsApp = async () => {
    const text = generateWhatsAppSummary(reception, items);
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        // Fallback for older browsers
        const textarea = document.createElement('textarea');
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error('Error copying to clipboard:', err);
    }
  };

  const handleExportCSV = () => {
    exportReceptionToCSV(reception, items);
  };

  const handleExportPOS = () => {
    const payload = exportReceptionToPOSPayload(reception, items);
    downloadJSON(`POS_Recepcion_${reception.serieNumero}_${new Date().toISOString().split('T')[0]}.json`, payload);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="w-full sm:max-w-lg bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] pb-safe"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-4 py-3 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-blue-400" />
            <div>
              <h2 className="text-sm font-bold text-white">Resumen y Reportes de Recepción</h2>
              <p className="text-[11px] text-slate-400">
                {reception.serieNumero} · {reception.proveedorNombre}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4 overflow-y-auto text-xs">
          {/* Main Status & Conformity Card */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                  reception.status === 'cerrada'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-amber-100 text-amber-800'
                }`}>
                  {reception.status === 'cerrada' ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                  {reception.status === 'cerrada' ? 'Recepción Cerrada' : 'En Curso (Abierta)'}
                </span>
                {reception.closedAt && (
                  <span className="text-[11px] text-slate-500">
                    {new Date(reception.closedAt).toLocaleDateString('es-PE')} {new Date(reception.closedAt).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                )}
              </div>
              <div className="text-slate-600 mt-1.5">
                {completeItems.length} de {standardItems.length} productos 100% conformes
              </div>
            </div>

            <div className="text-right">
              <div className="text-3xl font-black text-slate-900">
                {conformityPercent}%
              </div>
              <div className="text-[10px] uppercase font-bold text-slate-400">
                Conformidad
              </div>
            </div>
          </div>

          {/* Quick Actions (WhatsApp, CSV, JSON) */}
          <div className="space-y-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Exportación y Entrega al Supervisor
            </span>

            {/* WhatsApp 1-tap copy button */}
            <button
              onClick={handleCopyWhatsApp}
              className={`w-full py-3 px-4 rounded-xl font-bold flex items-center justify-center gap-2.5 shadow-sm transition-all min-h-[48px] ${
                copied
                  ? 'bg-emerald-600 text-white'
                  : 'bg-emerald-50 hover:bg-emerald-100 active:bg-emerald-200 text-emerald-800 border-2 border-emerald-500'
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-5 h-5 animate-scale" />
                  <span>¡Copiado! Listo para pegar en WhatsApp</span>
                </>
              ) : (
                <>
                  <Copy className="w-5 h-5 text-emerald-700" />
                  <span>Copiar Resumen para Jefe / WhatsApp</span>
                </>
              )}
            </button>

            {/* Export Dual: Excel + JSON */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={handleExportCSV}
                className="py-2.5 px-3 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-800 font-semibold flex items-center justify-center gap-1.5 text-xs shadow-2xs min-h-[44px]"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                <span>Descargar Excel (CSV)</span>
              </button>

              <button
                onClick={handleExportPOS}
                className="py-2.5 px-3 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-800 font-semibold flex items-center justify-center gap-1.5 text-xs shadow-2xs min-h-[44px]"
              >
                <FileJson className="w-4 h-4 text-blue-600" />
                <span>Exportar JSON POS</span>
              </button>
            </div>
          </div>

          {/* Discrepancies Details Preview */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Excepciones y Novedades del Ingreso
              </span>
              <span className="text-[11px] font-semibold text-slate-500">
                {missingItems.length + damagedItems.length + surplusItems.length + extraItems.length} registros
              </span>
            </div>

            {missingItems.length === 0 && damagedItems.length === 0 && surplusItems.length === 0 && extraItems.length === 0 ? (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-center text-emerald-800">
                <CheckCircle2 className="w-6 h-6 text-emerald-600 mx-auto mb-1" />
                <p className="font-bold text-xs">Sin discrepancias</p>
                <p className="text-[11px] text-emerald-700">Toda la mercadería se recibió completa y conforme.</p>
              </div>
            ) : (
              <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                {missingItems.map(item => (
                  <div key={item.id} className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2">
                    <span className="px-1.5 py-0.5 rounded bg-rose-600 text-white font-black text-[10px] shrink-0 mt-0.5">
                      FALTANTE
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-slate-900 truncate">[{item.itemCode}] {item.description}</div>
                      <div className="text-slate-600 text-[11px]">
                        Recibido: {item.receivedQuantity} / Esperado: {item.expectedQuantity} {item.unitNamePlural}
                        <strong className="text-rose-700 ml-1">(-{item.expectedQuantity - item.receivedQuantity})</strong>
                      </div>
                    </div>
                  </div>
                ))}

                {damagedItems.map(item => (
                  <div key={item.id} className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2">
                    <span className="px-1.5 py-0.5 rounded bg-amber-600 text-white font-black text-[10px] shrink-0 mt-0.5 uppercase">
                      {item.incidentType}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-slate-900 truncate">[{item.itemCode}] {item.description}</div>
                      <div className="text-slate-600 text-[11px]">{item.observations || 'Sin detalle adicional'}</div>
                    </div>
                  </div>
                ))}

                {surplusItems.map(item => (
                  <div key={item.id} className="p-2.5 bg-blue-50 border border-blue-200 rounded-xl flex items-start gap-2">
                    <span className="px-1.5 py-0.5 rounded bg-blue-600 text-white font-black text-[10px] shrink-0 mt-0.5">
                      SOBRANTE
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-slate-900 truncate">[{item.itemCode}] {item.description}</div>
                      <div className="text-slate-600 text-[11px]">
                        Recibido: {item.receivedQuantity} / Esperado: {item.expectedQuantity}
                        <strong className="text-blue-700 ml-1">(+{item.receivedQuantity - item.expectedQuantity})</strong>
                      </div>
                    </div>
                  </div>
                ))}

                {extraItems.map(item => (
                  <div key={item.id} className="p-2.5 bg-purple-50 border border-purple-200 rounded-xl flex items-start gap-2">
                    <span className="px-1.5 py-0.5 rounded bg-purple-600 text-white font-black text-[10px] shrink-0 mt-0.5">
                      EXTRA
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-slate-900 truncate">[{item.itemCode}] {item.description}</div>
                      <div className="text-slate-600 text-[11px]">
                        Cantidad: {formatQuantityWithUnit(item.receivedQuantity, item.unitName, item.unitNamePlural)} ({item.extraReason})
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Re-open option if closed */}
          {reception.status === 'cerrada' && onReopen && (
            <div className="pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => {
                  onReopen();
                  onClose();
                }}
                className="w-full py-2 px-3 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg flex items-center justify-center gap-1.5"
              >
                <Unlock className="w-3.5 h-3.5 text-amber-600" />
                <span>Reabrir edición (Desbloquear botones de conteo)</span>
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-200">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs min-h-[44px]"
          >
            Cerrar Ventana
          </button>
        </div>
      </div>
    </div>
  );
};
