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
  const [copied, setCopied] = useState<boolean>(false);

  React.useEffect(() => {
    if (!isOpen) {
      setCopied(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const standardItems = items.filter(i => !i.isExtra);
  const completeItems = standardItems.filter(
    i => i.status === 'completo' && i.incidentType === 'ninguno'
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
    <div 
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div 
        className="w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] pb-safe"
        onClick={(e) => e.stopPropagation()}
      >
        {/* iOS Grabber */}
        <div className="pt-2.5 pb-1 flex justify-center">
          <div className="w-9 h-1 bg-[#D1D1D6] rounded-full" />
        </div>

        {/* Header (iOS Light) */}
        <div className="px-4 py-2.5 bg-white text-[#1C1C1E] flex items-center justify-between border-b border-[#E5E5EA]">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-xl bg-[#E5F2FF] text-[#007AFF]">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#1C1C1E]">Resumen y Reportes</h2>
              <p className="text-[11px] text-[#8E8E93]">
                {reception.serieNumero} · {reception.proveedorNombre}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-[#F2F2F7] text-[#8E8E93]">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4 overflow-y-auto text-xs">
          {/* Main Status & Conformity Card */}
          <div className="p-4 bg-[#F2F2F7] border border-[#E5E5EA] rounded-2xl flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                  reception.status === 'cerrada'
                    ? 'bg-[#EBF9EE] text-[#34C759]'
                    : 'bg-[#FFF4E5] text-[#FF9500]'
                }`}>
                  {reception.status === 'cerrada' ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                  {reception.status === 'cerrada' ? 'Recepción Cerrada' : 'En Curso (Abierta)'}
                </span>
                {reception.closedAt && (
                  <span className="text-[11px] text-[#8E8E93]">
                    {new Date(reception.closedAt).toLocaleDateString('es-PE')} {new Date(reception.closedAt).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                )}
              </div>
              <div className="text-[#3A3A3C] font-medium mt-1.5">
                {completeItems.length} de {standardItems.length} productos 100% conformes
              </div>
            </div>

            <div className="text-right">
              <div className="text-3xl font-black text-[#1C1C1E]">
                {conformityPercent}%
              </div>
              <div className="text-[10px] uppercase font-bold text-[#8E8E93]">
                Conformidad
              </div>
            </div>
          </div>

          {/* Quick Actions (WhatsApp, CSV, JSON) */}
          <div className="space-y-2">
            <span className="text-[11px] font-bold text-[#8E8E93] uppercase tracking-wider">
              Exportación y Entrega al Supervisor
            </span>

            {/* WhatsApp 1-tap copy button */}
            <button
              onClick={handleCopyWhatsApp}
              className={`w-full py-3.5 px-4 rounded-2xl font-bold flex items-center justify-center gap-2.5 shadow-xs transition-all min-h-[48px] ${
                copied
                  ? 'bg-[#34C759] text-white'
                  : 'bg-[#EBF9EE] hover:bg-[#D5F5DA] active:bg-[#C2EFCB] text-[#34C759] border border-[#D1F2D9]'
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-5 h-5" />
                  <span>¡Copiado! Listo para pegar en WhatsApp</span>
                </>
              ) : (
                <>
                  <Copy className="w-5 h-5 text-[#34C759]" />
                  <span>Copiar Resumen para Jefe / WhatsApp</span>
                </>
              )}
            </button>

            {/* Export Dual: Excel + JSON */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={handleExportCSV}
                className="py-3 px-3 rounded-2xl border border-[#E5E5EA] bg-white hover:bg-[#F2F2F7] active:bg-[#E5E5EA] text-[#1C1C1E] font-bold flex items-center justify-center gap-1.5 text-xs shadow-2xs min-h-[44px]"
              >
                <FileSpreadsheet className="w-4 h-4 text-[#34C759]" />
                <span>Descargar Excel (CSV)</span>
              </button>

              <button
                onClick={handleExportPOS}
                className="py-3 px-3 rounded-2xl border border-[#E5E5EA] bg-white hover:bg-[#F2F2F7] active:bg-[#E5E5EA] text-[#1C1C1E] font-bold flex items-center justify-center gap-1.5 text-xs shadow-2xs min-h-[44px]"
              >
                <FileJson className="w-4 h-4 text-[#007AFF]" />
                <span>Exportar JSON POS</span>
              </button>
            </div>
          </div>

          {/* Discrepancies Details Preview */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-[#8E8E93] uppercase tracking-wider">
                Excepciones y Novedades del Ingreso
              </span>
              <span className="text-[11px] font-semibold text-[#8E8E93]">
                {missingItems.length + damagedItems.length + surplusItems.length + extraItems.length} registros
              </span>
            </div>

            {missingItems.length === 0 && damagedItems.length === 0 && surplusItems.length === 0 && extraItems.length === 0 ? (
              <div className="p-4 bg-[#EBF9EE] border border-[#D1F2D9] rounded-2xl text-center text-[#34C759]">
                <CheckCircle2 className="w-6 h-6 text-[#34C759] mx-auto mb-1" />
                <p className="font-bold text-xs">Sin discrepancias</p>
                <p className="text-[11px] text-[#34C759]">Toda la mercadería se recibió completa y conforme.</p>
              </div>
            ) : (
              <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                {missingItems.map(item => (
                  <div key={item.id} className="p-3 bg-[#FFEBEA] border border-[#FFD0CE] rounded-2xl flex items-start gap-2">
                    <span className="px-1.5 py-0.5 rounded-md bg-[#FF3B30] text-white font-black text-[10px] shrink-0 mt-0.5">
                      FALTANTE
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-[#1C1C1E] truncate">[{item.itemCode}] {item.description}</div>
                      <div className="text-[#3A3A3C] text-[11px]">
                        Recibido: {item.receivedQuantity} / Esperado: {item.expectedQuantity} {item.unitNamePlural}
                        <strong className="text-[#FF3B30] ml-1">(-{item.expectedQuantity - item.receivedQuantity})</strong>
                      </div>
                    </div>
                  </div>
                ))}

                {damagedItems.map(item => (
                  <div key={item.id} className="p-3 bg-[#FFF4E5] border border-[#FFE2BF] rounded-2xl flex items-start gap-2">
                    <span className="px-1.5 py-0.5 rounded-md bg-[#FF9500] text-white font-black text-[10px] shrink-0 mt-0.5 uppercase">
                      {item.incidentType}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-[#1C1C1E] truncate">[{item.itemCode}] {item.description}</div>
                      <div className="text-[#3A3A3C] text-[11px]">{item.observations || 'Sin detalle adicional'}</div>
                    </div>
                  </div>
                ))}

                {surplusItems.map(item => (
                  <div key={item.id} className="p-3 bg-[#E5F2FF] border border-[#CCE5FF] rounded-2xl flex items-start gap-2">
                    <span className="px-1.5 py-0.5 rounded-md bg-[#007AFF] text-white font-black text-[10px] shrink-0 mt-0.5">
                      SOBRANTE
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-[#1C1C1E] truncate">[{item.itemCode}] {item.description}</div>
                      <div className="text-[#3A3A3C] text-[11px]">
                        Recibido: {item.receivedQuantity} / Esperado: {item.expectedQuantity}
                        <strong className="text-[#007AFF] ml-1">(+{item.receivedQuantity - item.expectedQuantity})</strong>
                      </div>
                    </div>
                  </div>
                ))}

                {extraItems.map(item => (
                  <div key={item.id} className="p-3 bg-[#F5EAFB] border border-[#E8CEF7] rounded-2xl flex items-start gap-2">
                    <span className="px-1.5 py-0.5 rounded-md bg-[#AF52DE] text-white font-black text-[10px] shrink-0 mt-0.5">
                      EXTRA
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-[#1C1C1E] truncate">[{item.itemCode}] {item.description}</div>
                      <div className="text-[#3A3A3C] text-[11px]">
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
            <div className="pt-2 border-t border-[#E5E5EA]">
              <button
                type="button"
                onClick={() => {
                  onReopen();
                  onClose();
                }}
                className="w-full py-2.5 px-3 text-xs font-semibold text-[#007AFF] hover:bg-[#E5F2FF] rounded-xl flex items-center justify-center gap-1.5"
              >
                <Unlock className="w-3.5 h-3.5" />
                <span>Reabrir edición (Desbloquear botones de conteo)</span>
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 bg-white border-t border-[#E5E5EA]">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-3 px-4 bg-[#007AFF] hover:bg-[#0066D6] text-white font-bold rounded-2xl text-xs min-h-[44px]"
          >
            Cerrar Ventana
          </button>
        </div>
      </div>
    </div>
  );
};
