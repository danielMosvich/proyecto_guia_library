import type { Reception, ReceptionItem, RecepcionPOSPayload } from '../types';
import { formatQuantityWithUnit } from './sunatXmlParser';

/**
 * Generates an executive WhatsApp-ready plain text summary for the supervisor.
 * Focuses exclusively on discrepancies and KPIs to speed up claims.
 */
export function generateWhatsAppSummary(reception: Reception, items: ReceptionItem[]): string {
  const docTypeLabel = reception.documentType === 'DespatchAdvice' ? 'Guía de Remisión' : 'Factura';
  const closedDateStr = reception.closedAt
    ? new Date(reception.closedAt).toLocaleString('es-PE', { dateStyle: 'short', timeStyle: 'short' })
    : new Date().toLocaleString('es-PE', { dateStyle: 'short', timeStyle: 'short' });

  const standardItems = items.filter(i => !i.isExtra);
  const completeItems = standardItems.filter(i => i.status === 'completo' && i.incidentType === 'ninguno');
  const conformityPercent = standardItems.length > 0 
    ? Math.round((completeItems.length / standardItems.length) * 100) 
    : 100;

  // Group exceptions
  const missingItems = items.filter(i => !i.isExtra && i.receivedQuantity < i.expectedQuantity);
  const damagedItems = items.filter(i => i.incidentType === 'danado' || i.incidentType === 'cambiado');
  const surplusItems = items.filter(i => !i.isExtra && i.receivedQuantity > i.expectedQuantity);
  const extraItems = items.filter(i => i.isExtra);

  const totalExceptions = missingItems.length + damagedItems.length + surplusItems.length + extraItems.length;

  let text = `📦 *REPORTE DE RECEPCIÓN DE ALMACÉN*\n`;
  text += `━━━━━━━━━━━━━━━━━━━━━\n`;
  text += `🏢 *Proveedor:* ${reception.proveedorNombre}\n`;
  text += `📄 *Doc:* ${docTypeLabel} *${reception.serieNumero}*\n`;
  text += `📅 *Cierre:* ${closedDateStr}\n`;
  text += `📊 *Conformidad:* ${conformityPercent}% (${completeItems.length}/${standardItems.length} ítems conformes)\n`;
  text += `━━━━━━━━━━━━━━━━━━━━━\n\n`;

  if (totalExceptions === 0) {
    text += `✅ *RECEPCIÓN 100% CONFORME*\n`;
    text += `Todos los ${standardItems.length} productos llegaron completos y en perfecto estado.\n`;
  } else {
    text += `⚠️ *RESUMEN DE DISCREPANCIAS Y NOVEDADES (${totalExceptions}):*\n\n`;

    if (missingItems.length > 0) {
      text += `🔴 *FALTANTES (${missingItems.length}):*\n`;
      missingItems.forEach(item => {
        const diff = item.expectedQuantity - item.receivedQuantity;
        text += ` • [${item.itemCode}] ${item.description}\n`;
        text += `    Llegó: ${formatQuantityWithUnit(item.receivedQuantity, item.unitName, item.unitNamePlural)} / Esperado: ${formatQuantityWithUnit(item.expectedQuantity, item.unitName, item.unitNamePlural)} (Falta: *${formatQuantityWithUnit(diff, item.unitName, item.unitNamePlural)}*)\n`;
        if (item.observations) text += `    Nota: ${item.observations}\n`;
      });
      text += `\n`;
    }

    if (damagedItems.length > 0) {
      text += `⚠️ *DAÑADOS / OBSERVADOS (${damagedItems.length}):*\n`;
      damagedItems.forEach(item => {
        text += ` • [${item.itemCode}] ${item.description}\n`;
        text += `    Incidencia: *${item.incidentType.toUpperCase()}* | Recibido: ${formatQuantityWithUnit(item.receivedQuantity, item.unitName, item.unitNamePlural)}\n`;
        if (item.observations) text += `    Detalle: ${item.observations}\n`;
      });
      text += `\n`;
    }

    if (surplusItems.length > 0) {
      text += `🔵 *SOBRANTES (${surplusItems.length}):*\n`;
      surplusItems.forEach(item => {
        const diff = item.receivedQuantity - item.expectedQuantity;
        text += ` • [${item.itemCode}] ${item.description}\n`;
        text += `    Llegó: ${item.receivedQuantity} / Esperado: ${item.expectedQuantity} (Sobra: *+${diff}*)\n`;
        if (item.observations) text += `    Nota: ${item.observations}\n`;
      });
      text += `\n`;
    }

    if (extraItems.length > 0) {
      text += `🟣 *PRODUCTOS EXTRAS (NO EN GUÍA) (${extraItems.length}):*\n`;
      extraItems.forEach(item => {
        const reason = item.extraReason ? item.extraReason.toUpperCase() : 'NO EN GUÍA';
        text += ` • [${item.itemCode}] ${item.description}\n`;
        text += `    Cant. ingresada: *${formatQuantityWithUnit(item.receivedQuantity, item.unitName, item.unitNamePlural)}* (Motivo: ${reason})\n`;
        if (item.observations) text += `    Nota: ${item.observations}\n`;
      });
      text += `\n`;
    }
  }

  if (reception.closedNotes) {
    text += `💬 *Observación general:* ${reception.closedNotes}\n\n`;
  }

  text += `_Generado automáticamente desde Recepción Almacén PWA_`;
  return text;
}

/**
 * Builds CSV for Excel with UTF-8 BOM (\uFEFF)
 */
export function exportReceptionToCSV(reception: Reception, items: ReceptionItem[]): void {
  const headers = [
    'N° Línea',
    'Código / SKU',
    'Descripción del Producto',
    'Unidad Medida',
    'Cant. Esperada',
    'Cant. Recibida Real',
    'Diferencia',
    'Estado',
    'Incidencia',
    'Es Extra / Bonificación',
    'Desglose Conteos Parciales',
    'Observaciones'
  ];

  const rows = items.map(item => {
    const diff = item.isExtra 
      ? item.receivedQuantity 
      : item.receivedQuantity - item.expectedQuantity;
    
    const partialsHistory = item.partialCounts && item.partialCounts.length > 0
      ? item.partialCounts.map(p => `${p.inputAmount} ${p.unitUsed}${p.boxTag ? ` [${p.boxTag}]` : ''}`).join(' + ')
      : `${item.receivedQuantity} ${item.unitName}`;

    return [
      item.lineId,
      `"${item.itemCode.replace(/"/g, '""')}"`,
      `"${item.description.replace(/"/g, '""')}"`,
      `"${item.unitName}"`,
      item.expectedQuantity,
      item.receivedQuantity,
      diff,
      `"${item.status.toUpperCase()}"`,
      `"${item.incidentType.toUpperCase()}"`,
      item.isExtra ? 'SI' : 'NO',
      `"${partialsHistory.replace(/"/g, '""')}"`,
      `"${(item.observations || '').replace(/"/g, '""')}"`
    ].join(',');
  });

  const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Recepcion_${reception.serieNumero}_${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Builds typed JSON Payload for POS and Kardex Ingestion
 */
export function exportReceptionToPOSPayload(reception: Reception, items: ReceptionItem[]): RecepcionPOSPayload {
  const standardItems = items.filter(i => !i.isExtra);
  const completeItems = standardItems.filter(i => i.status === 'completo' && i.incidentType === 'ninguno');
  const conformityPercent = standardItems.length > 0
    ? Math.round((completeItems.length / standardItems.length) * 100)
    : 100;

  return {
    version: '1.0.0',
    documentoOrigen: {
      tipo: reception.documentType,
      serieNumero: reception.serieNumero,
      fechaEmision: reception.fechaEmision,
      proveedorRuc: reception.proveedorRuc,
      proveedorNombre: reception.proveedorNombre
    },
    recepcion: {
      id: reception.id,
      fechaInicio: new Date(reception.createdAt).toISOString(),
      fechaCierre: reception.closedAt ? new Date(reception.closedAt).toISOString() : new Date().toISOString(),
      totalLineas: items.length,
      itemsRecibidosConformes: completeItems.length,
      itemsConDiscrepancia: standardItems.length - completeItems.length,
      porcentajeConformidad: conformityPercent,
      observacionesCierre: reception.closedNotes
    },
    movimientosInventario: items.map(item => {
      const diff = item.isExtra 
        ? item.receivedQuantity 
        : item.receivedQuantity - item.expectedQuantity;
      
      const countsBreakdown = item.partialCounts && item.partialCounts.length > 0
        ? item.partialCounts.map(p => `${p.inputAmount} ${p.unitUsed}${p.boxTag ? ` (${p.boxTag})` : ''}`).join(' + ')
        : `${item.receivedQuantity} ${item.unitName}`;

      return {
        linea: item.lineId,
        sku: item.itemCode,
        nombre: item.description,
        unidadMedida: item.unitName,
        cantidadEsperada: item.expectedQuantity,
        cantidadIngresadaReal: item.receivedQuantity,
        diferencia: diff,
        costoUnitario: item.unitPrice,
        costoTotalEstimado: Number((item.unitPrice * item.receivedQuantity).toFixed(2)),
        esBonificacionOExtra: item.isExtra,
        motivoExtra: item.extraReason || null,
        tipoIncidencia: item.incidentType,
        observacion: item.observations,
        desgloseConteos: countsBreakdown
      };
    })
  };
}

/**
 * Downloads arbitrary object as JSON file
 */
export function downloadJSON(filename: string, data: unknown): void {
  const jsonStr = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
