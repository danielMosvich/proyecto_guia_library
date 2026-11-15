import { describe, it, expect } from 'vitest';
import { JSDOM } from 'jsdom';
import { parseSunatXml, translateUnitCode, detectConversionFactor, sortItemsNaturally } from './sunatXmlParser';
import { SAMPLE_DESPATCH_ADVICE_XML, SAMPLE_INVOICE_XML } from '../data/sampleXml';
import { generateWhatsAppSummary, exportReceptionToPOSPayload } from './exportHelpers';
import type { ReceptionItem } from '../types';

const dom = new JSDOM();

describe('SUNAT XML Parser and Warehouse Rules', () => {
  it('Sorts items naturally by Line ID (1, 2, 3... 10, 100) instead of alphabetical (1, 10, 100, 2)', () => {
    const mockItems = [
      { id: '100', lineId: '100', isExtra: false },
      { id: '1', lineId: '1', isExtra: false },
      { id: '10', lineId: '10', isExtra: false },
      { id: '2', lineId: '2', isExtra: false },
      { id: 'extra', lineId: 'EXTRA-999', isExtra: true },
    ] as ReceptionItem[];

    const sorted = sortItemsNaturally(mockItems);
    expect(sorted.map(i => i.lineId)).toEqual(['1', '2', '10', '100', 'EXTRA-999']);
  });
  it('Translates UN/ECE Rec 20 codes to Spanish (never raw codes)', () => {
    expect(translateUnitCode('NIU').singular).toBe('Unidad');
    expect(translateUnitCode('NIU').plural).toBe('Unidades');
    expect(translateUnitCode('BX').singular).toBe('Caja');
    expect(translateUnitCode('BX').plural).toBe('Cajas');
    expect(translateUnitCode('PK').singular).toBe('Paquete');
    expect(translateUnitCode('PK').plural).toBe('Paquetes');
    expect(translateUnitCode('BG').singular).toBe('Bolsa');
    expect(translateUnitCode('BO').singular).toBe('Botella');
    expect(translateUnitCode('CS').singular).toBe('Cajón');
    expect(translateUnitCode('RO').singular).toBe('Rollo');
    expect(translateUnitCode('DZN').singular).toBe('Docena');
    expect(translateUnitCode('ZZ').singular).toBe('Unidad');
    expect(translateUnitCode('XYZ_UNKNOWN').singular).toBe('Unidad');
  });

  it('Disabled automatic factor detection to prevent misinterpreting descriptions (e.g. 250 GR)', () => {
    expect(detectConversionFactor('LIMPIATIPOS ARTESCO COLOR AZUL CAX24')).toBe(null);
    expect(detectConversionFactor('SILICONA LIQUIDA 250ML')).toBe(null);
  });

  it('Parses DespatchAdvice (Guía de Remisión) correctly with base XML unit', () => {
    const { reception, items } = parseSunatXml(SAMPLE_DESPATCH_ADVICE_XML, dom.window.DOMParser);

    expect(reception.documentType).toBe('DespatchAdvice');
    expect(reception.serieNumero).toBe('T108-00624402');
    expect(reception.proveedorRuc).toBe('20512345678');
    expect(reception.proveedorNombre).toContain('DISTRIBUIDORA NACIONAL');
    expect(items.length).toBe(8);

    // Item 1
    expect(items[0].itemCode).toBe('50974001');
    expect(items[0].unitName).toBe('Caja');
    expect(items[0].expectedQuantity).toBe(5);
    expect(items[0].conversionFactor).toBe(1);

    // Item 2
    expect(items[1].itemCode).toBe('50974002');
    expect(items[1].unitName).toBe('Paquete');
    expect(items[1].expectedQuantity).toBe(10);
    expect(items[1].suggestedConversion).toBe(null);

    // Item 3
    expect(items[2].itemCode).toBe('50974003');
    expect(items[2].unitName).toBe('Unidad');
    expect(items[2].expectedQuantity).toBe(48);

    // Item 8
    expect(items[7].itemCode).toBe('50974008');
    expect(items[7].unitName).toBe('Botella');
    expect(items[7].expectedQuantity).toBe(24);
  });

  it('Parses Invoice (Factura Electrónica) correctly with unit prices', () => {
    const { reception, items } = parseSunatXml(SAMPLE_INVOICE_XML, dom.window.DOMParser);

    expect(reception.documentType).toBe('Invoice');
    expect(reception.serieNumero).toBe('F001-00089234');
    expect(reception.proveedorRuc).toBe('20100123456');
    expect(reception.proveedorNombre).toContain('PAPELERIA INDUSTRIAL');
    expect(items.length).toBe(3);

    expect(items[0].itemCode).toBe('7751234001');
    expect(items[0].expectedQuantity).toBe(12);
    expect(items[0].unitPrice).toBe(60.0);
    expect(items[0].unitName).toBe('Caja');
  });

  it('Generates formatted executive WhatsApp summary for supervisor', () => {
    const { reception, items } = parseSunatXml(SAMPLE_DESPATCH_ADVICE_XML, dom.window.DOMParser);
    
    // Simulate discrepancies
    items[0].receivedQuantity = 3; // expected 5, missing 2
    items[0].incidentType = 'faltante';

    items[1].receivedQuantity = 10;
    items[1].incidentType = 'danado';
    items[1].observations = 'Caja mojada por lluvia en transporte';

    items[2].receivedQuantity = 48; // complete

    const summary = generateWhatsAppSummary(reception, items);
    expect(summary).toContain('REPORTE DE RECEPCIÓN DE ALMACÉN');
    expect(summary).toContain('T108-00624402');
    expect(summary).toContain('FALTANTES');
    expect(summary).toContain('DAÑADOS');
    expect(summary).toContain('Caja mojada por lluvia');
  });

  it('Builds typed payload for POS and Kardex Ingestion', () => {
    const { reception, items } = parseSunatXml(SAMPLE_DESPATCH_ADVICE_XML, dom.window.DOMParser);
    const payload = exportReceptionToPOSPayload(reception, items);

    expect(payload.version).toBe('1.0.0');
    expect(payload.documentoOrigen.serieNumero).toBe('T108-00624402');
    expect(payload.movimientosInventario.length).toBe(8);
    expect(payload.movimientosInventario[0].sku).toBe('50974001');
    expect(payload.movimientosInventario[0].unidadMedida).toBe('Caja');
  });
});
