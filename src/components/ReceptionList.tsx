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
import { saveReceptionWithItems, deleteReception, db } from '../db';
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
      // Fail-safe timeout protection so UI NEVER hangs permanently
      const savePromise = saveReceptionWithItems(parsed.reception, parsed.items);
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Tiempo de espera agotado al guardar en base de datos local.')), 12000)
      );
      await Promise.race([savePromise, timeoutPromise]);
      onSelectReception(parsed.reception.id);
    } catch (err: any) {
      console.error('Error al procesar XML:', err);
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
      try {
        await deleteReception(receptionId);
      } catch (err: any) {
        console.error('Error al eliminar recepción:', err);
        setErrorMessage(`No se pudo eliminar la recepción: ${err.message || 'Error en IndexedDB'}`);
      }
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-3.5 py-4 space-y-4">
      {/* Welcome Banner (iOS Light Card) */}
      <div className="bg-white text-[#1C1C1E] p-4 sm:p-5 rounded-2xl shadow-xs border border-[#E5E5EA]">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1.5">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#E5F2FF] text-[#007AFF] border border-[#CCE5FF]">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Offline-First · Almacén SUNAT</span>
            </span>
            <h2 className="text-lg font-bold text-[#1C1C1E] leading-tight">
              Control de Ingreso y Recepción
            </h2>
            <p className="text-xs text-[#8E8E93] leading-relaxed">
              Carga Guías (<code className="text-[#007AFF] font-mono bg-[#F2F2F7] px-1 py-0.5 rounded">DespatchAdvice</code>) o Facturas (<code className="text-[#007AFF] font-mono bg-[#F2F2F7] px-1 py-0.5 rounded">Invoice</code>) de SUNAT Perú. Cuenta mercadería caja por caja con una sola mano.
            </p>
          </div>
        </div>

        {/* Big Upload Area (iOS Colors) */}
        <div className="mt-4 pt-3.5 border-t border-[#E5E5EA] flex flex-col sm:flex-row gap-2.5">
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
            className="flex-1 py-3 px-4 bg-[#007AFF] hover:bg-[#0066D6] active:bg-[#0055B3] text-white font-bold rounded-xl shadow-xs flex items-center justify-center gap-2 text-xs transition-transform active:scale-98 min-h-[44px]"
          >
            <Upload className="w-4 h-4" />
            <span>{isProcessing ? 'Procesando XML...' : 'Subir XML SUNAT (.xml)'}</span>
          </button>

          <button
            type="button"
            onClick={handleLoadSampleGuide}
            disabled={isProcessing}
            className="py-3 px-3.5 bg-[#F2F2F7] hover:bg-[#E5E5EA] active:bg-[#D1D1D6] text-[#1C1C1E] font-semibold rounded-xl border border-[#E5E5EA] flex items-center justify-center gap-1.5 text-xs transition-colors min-h-[44px]"
          >
            <FileCode className="w-4 h-4 text-[#34C759]" />
            <span>Guía de Prueba</span>
          </button>
        </div>
      </div>

      {/* Error alert if any */}
      {errorMessage && (
        <div className="p-3.5 bg-[#FFEBEA] border border-[#FFD0CE] rounded-2xl flex items-start gap-2.5 text-[#FF3B30] text-xs">
          <AlertCircle className="w-4 h-4 text-[#FF3B30] shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-bold">Error en el archivo</p>
            <p className="text-[11px] text-[#FF3B30] mt-0.5">{errorMessage}</p>
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-[#FF3B30] hover:opacity-75 p-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* Receptions History */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-bold text-[#8E8E93] uppercase tracking-wider">
            Recepciones en Dispositivo ({receptions?.length || 0})
          </h3>
          {receptions && receptions.length > 0 && (
            <button
              onClick={handleLoadSampleInvoice}
              className="text-[11px] font-semibold text-[#007AFF] hover:underline"
            >
              + Probar con Factura
            </button>
          )}
        </div>

        {receptions === undefined ? (
          <div className="bg-white border border-[#E5E5EA] rounded-2xl p-8 text-center space-y-3 shadow-xs animate-pulse">
            <div className="w-12 h-12 rounded-full bg-[#E5E5EA] mx-auto" />
            <div>
              <div className="h-4 bg-[#E5E5EA] rounded-md w-40 mx-auto" />
              <div className="h-3 bg-[#F2F2F7] rounded-md w-56 mx-auto mt-2" />
            </div>
            <p className="text-xs text-[#8E8E93] font-medium">Cargando recepciones locales...</p>
          </div>
        ) : receptions.length === 0 ? (
          <div className="bg-white border border-[#E5E5EA] rounded-2xl p-8 text-center space-y-3 shadow-xs">
            <div className="w-12 h-12 rounded-full bg-[#F2F2F7] flex items-center justify-center mx-auto text-[#8E8E93]">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-[#1C1C1E] text-sm">No hay recepciones activas</h4>
              <p className="text-xs text-[#8E8E93] max-w-xs mx-auto mt-1">
                Sube un comprobante XML de SUNAT o presiona el botón de prueba para explorar el flujo completo de almacén.
              </p>
            </div>
            <button
              type="button"
              onClick={handleLoadSampleGuide}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#34C759] hover:bg-[#2EB84F] text-white font-bold rounded-xl text-xs shadow-xs transition-transform active:scale-95"
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
              const completeItems = standardItems.filter(i => i.status === 'completo' && i.incidentType === 'ninguno');
              const percent = standardItems.length > 0
                ? Math.round((completeItems.length / standardItems.length) * 100)
                : 100;

              return (
                <div
                  key={rec.id}
                  onClick={() => onSelectReception(rec.id)}
                  className="bg-white rounded-2xl border border-[#E5E5EA] hover:border-[#007AFF] shadow-xs hover:shadow-sm transition-all p-4 cursor-pointer space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-lg bg-[#E5F2FF] text-[#007AFF] border border-[#CCE5FF]">
                          {rec.documentType === 'DespatchAdvice' ? 'Guía' : 'Factura'} {rec.serieNumero}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            rec.status === 'cerrada'
                              ? 'bg-[#EBF9EE] text-[#34C759]'
                              : 'bg-[#FFF4E5] text-[#FF9500]'
                          }`}
                        >
                          {rec.status === 'cerrada' ? 'Cerrada' : 'En Curso'}
                        </span>
                      </div>
                      <h4 className="font-bold text-[#1C1C1E] text-sm mt-1.5 truncate">
                        {rec.proveedorNombre}
                      </h4>
                      <p className="text-[11px] text-[#8E8E93]">
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
                        className="p-2 text-[#8E8E93] hover:text-[#007AFF] hover:bg-[#E5F2FF] rounded-xl transition-colors"
                      >
                        <Share2 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => handleDelete(rec.id, rec.serieNumero, e)}
                        title="Eliminar recepción"
                        className="p-2 text-[#8E8E93] hover:text-[#FF3B30] hover:bg-[#FFEBEA] rounded-xl transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Progress Bar & KPIs */}
                  <div className="space-y-1.5 pt-1 border-t border-[#E5E5EA]">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-[#3A3A3C] font-medium">
                        Progreso: <strong>{completeItems.length}</strong> de <strong>{standardItems.length}</strong> conformes
                      </span>
                      <span className="font-bold text-[#1C1C1E]">{percent}%</span>
                    </div>

                    <div className="w-full h-1.5 bg-[#E5E5EA] rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${
                          percent === 100 ? 'bg-[#34C759]' : 'bg-[#007AFF]'
                        }`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>

                  {/* Bottom Action Footer */}
                  <div className="flex items-center justify-between pt-1 text-xs">
                    <span className="text-[11px] text-[#8E8E93]">
                      Actualizado: {new Date(rec.updatedAt).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}
                    </span>

                    <span className="font-bold text-[#007AFF] flex items-center gap-0.5">
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
