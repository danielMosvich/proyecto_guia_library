import React, { useRef, useState } from 'react';
import {
  Upload,
  FileCode,
  ArrowRight,
  Trash2,
  Share2,
  FileText,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import type { Reception } from '../types';
import { SAMPLE_DESPATCH_ADVICE_XML, SAMPLE_INVOICE_XML } from '../data/sampleXml';
import { parseSunatXml } from '../utils/sunatXmlParser';
import { saveReceptionWithItems, db } from '../db';
import { useLiveQuery } from 'dexie-react-hooks';

interface ReceptionListProps {
  onSelectReception: (receptionId: string) => void;
  onOpenSummary: (reception: Reception) => void;
}

export const ReceptionList: React.FC<ReceptionListProps> = ({
  onSelectReception,
  onOpenSummary,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Live query from Dexie IndexedDB
  const receptions = useLiveQuery(
    () => db.receptions.orderBy('updatedAt').reverse().toArray(),
    []
  );

  // Query all items to compute live progress for each reception in the list
  const allItems = useLiveQuery(() => db.receptionItems.toArray(), []);

  // Process uploaded XML files
  const processXmlString = async (xmlContent: string, fileName?: string) => {
    try {
      const parsed = parseSunatXml(xmlContent);
      await saveReceptionWithItems(parsed.reception, parsed.items);
      onSelectReception(parsed.reception.id);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(
        `Error al procesar ${fileName || 'el archivo'}: ${err.message || 'Formato XML inválido'}`
      );
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const content = await file.text();
        await processXmlString(content, file.name);
      }
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleLoadSampleGuide = async () => {
    setIsProcessing(true);
    setErrorMessage(null);
    try {
      await processXmlString(SAMPLE_DESPATCH_ADVICE_XML, 'Guía de Remisión de Prueba');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleLoadSampleInvoice = async () => {
    setIsProcessing(true);
    setErrorMessage(null);
    try {
      await processXmlString(SAMPLE_INVOICE_XML, 'Factura Electrónica de Prueba');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = async (receptionId: string, serieNumero: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(`¿Estás seguro de eliminar la recepción ${serieNumero}? Se borrarán todos los conteos.`)) {
      await db.transaction('rw', db.receptions, db.receptionItems, async () => {
        await db.receptionItems.where('receptionId').equals(receptionId).delete();
        await db.receptions.delete(receptionId);
      });
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-5 space-y-5">
      {/* Welcome Banner & Value Prop */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-4 sm:p-5 rounded-2xl shadow-lg border border-slate-700/60">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-400/30">
              <Sparkles className="w-3 h-3" />
              <span>Offline-First · 100% Persistente</span>
            </span>
            <h2 className="text-lg font-black text-white leading-tight">
              Control de Ingreso en Almacén
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              Carga Guías de Remisión (<code className="text-blue-300 font-mono">DespatchAdvice</code>) o Facturas (<code className="text-blue-300 font-mono">Invoice</code>) de SUNAT Perú. Cuenta mercadería caja por caja con el pulgar.
            </p>
          </div>
        </div>

        {/* Big Upload Area */}
        <div className="mt-4 pt-3 border-t border-slate-700/80 flex flex-col sm:flex-row gap-2.5">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".xml,text/xml,application/xml"
            multiple
            className="hidden"
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isProcessing}
            className="flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-bold rounded-xl shadow-md flex items-center justify-center gap-2 text-xs transition-transform active:scale-98 min-h-[48px]"
          >
            <Upload className="w-4 h-4" />
            <span>{isProcessing ? 'Procesando XML...' : 'Subir XML de SUNAT (.xml)'}</span>
          </button>

          <button
            type="button"
            onClick={handleLoadSampleGuide}
            disabled={isProcessing}
            className="py-3 px-3.5 bg-slate-700 hover:bg-slate-600 active:bg-slate-800 text-slate-200 font-semibold rounded-xl border border-slate-600 flex items-center justify-center gap-1.5 text-xs transition-colors min-h-[48px]"
          >
            <FileCode className="w-4 h-4 text-emerald-400" />
            <span>Cargar Guía de Prueba</span>
          </button>
        </div>
      </div>

      {/* Error alert if any */}
      {errorMessage && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-rose-900 text-xs">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-bold">Error en el archivo</p>
            <p className="text-[11px] text-rose-800 mt-0.5">{errorMessage}</p>
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-rose-500 hover:text-rose-700 p-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* Receptions History */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider">
            Recepciones en Dispositivo ({receptions?.length || 0})
          </h3>
          {receptions && receptions.length > 0 && (
            <button
              onClick={handleLoadSampleInvoice}
              className="text-[11px] font-semibold text-blue-600 hover:text-blue-800"
            >
              + Probar con Factura
            </button>
          )}
        </div>

        {(!receptions || receptions.length === 0) ? (
          <div className="bg-white border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-slate-800 text-sm">No hay recepciones activas</h4>
              <p className="text-xs text-slate-500 max-w-xs mx-auto mt-1">
                Sube un comprobante XML de SUNAT o presiona el botón de prueba para explorar el flujo completo de almacén.
              </p>
            </div>
            <button
              type="button"
              onClick={handleLoadSampleGuide}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-sm transition-transform active:scale-95"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Cargar Guía de Prueba Inmediata</span>
            </button>
          </div>
        ) : (
          <div className="space-y-2.5">
            {receptions.map((rec) => {
              // Calculate items progress for this reception
              const recItems = allItems?.filter(i => i.receptionId === rec.id) || [];
              const standardItems = recItems.filter(i => !i.isExtra);
              const completeItems = standardItems.filter(i => i.receivedQuantity === i.expectedQuantity && i.incidentType === 'ninguno');
              const percent = standardItems.length > 0
                ? Math.round((completeItems.length / standardItems.length) * 100)
                : 100;

              return (
                <div
                  key={rec.id}
                  onClick={() => onSelectReception(rec.id)}
                  className="bg-white rounded-2xl border border-slate-200 hover:border-blue-400 hover:shadow-md transition-all p-4 cursor-pointer space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                          {rec.documentType === 'DespatchAdvice' ? 'Guía' : 'Factura'} {rec.serieNumero}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            rec.status === 'cerrada'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {rec.status === 'cerrada' ? 'Cerrada' : 'En Curso'}
                        </span>
                      </div>
                      <h4 className="font-bold text-slate-900 text-sm mt-1 truncate">
                        {rec.proveedorNombre}
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        RUC: {rec.proveedorRuc} · Emisión: {rec.fechaEmision}
                      </p>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenSummary(rec);
                        }}
                        title="Ver resumen y reportes"
                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Share2 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => handleDelete(rec.id, rec.serieNumero, e)}
                        title="Eliminar recepción"
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Progress Bar & KPIs */}
                  <div className="space-y-1.5 pt-1 border-t border-slate-100">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-600 font-medium">
                        Progreso: <strong>{completeItems.length}</strong> de <strong>{standardItems.length}</strong> conformes
                      </span>
                      <span className="font-bold text-slate-800">{percent}%</span>
                    </div>

                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${
                          percent === 100 ? 'bg-emerald-500' : 'bg-blue-600'
                        }`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>

                  {/* Bottom Action Footer */}
                  <div className="flex items-center justify-between pt-1 text-xs">
                    <span className="text-[11px] text-slate-400">
                      Actualizado: {new Date(rec.updatedAt).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}
                    </span>

                    <span className="font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1">
                      <span>{rec.status === 'cerrada' ? 'Ver Detalle' : 'Continuar Conteo'}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
