import type { DocumentType, Reception, ReceptionItem } from '../types';

/**
 * Standard UN/ECE Rec 20 dictionary translated to clear Spanish
 */
export interface UnitTranslation {
  singular: string;
  plural: string;
}

export const UNIT_DICTIONARY: Record<string, UnitTranslation> = {
  NIU: { singular: 'Unidad', plural: 'Unidades' },
  ZZ: { singular: 'Unidad', plural: 'Unidades' },
  BX: { singular: 'Caja', plural: 'Cajas' },
  PK: { singular: 'Paquete', plural: 'Paquetes' },
  BG: { singular: 'Bolsa', plural: 'Bolsas' },
  BO: { singular: 'Botella', plural: 'Botellas' },
  CS: { singular: 'Cajón', plural: 'Cajones' },
  RO: { singular: 'Rollo', plural: 'Rollos' },
  DZN: { singular: 'Docena', plural: 'Docenas' },
  SET: { singular: 'Juego', plural: 'Juegos' },
  GLL: { singular: 'Galón', plural: 'Galones' },
  KGM: { singular: 'Kilogramo', plural: 'Kilogramos' },
  MTR: { singular: 'Metro', plural: 'Metros' },
  LTR: { singular: 'Litro', plural: 'Litros' },
  GRM: { singular: 'Gramo', plural: 'Gramos' },
  MIL: { singular: 'Millar', plural: 'Millares' },
  TNE: { singular: 'Tonelada', plural: 'Toneladas' },
  CEN: { singular: 'Ciento', plural: 'Cientos' },
  BLX: { singular: 'Bolsa', plural: 'Bolsas' },
  BAL: { singular: 'Balde', plural: 'Baldes' },
  LBR: { singular: 'Libra', plural: 'Libras' },
  YRD: { singular: 'Yarda', plural: 'Yardas' },
};

/**
 * Translates technical code to Spanish. NEVER returns raw technical code.
 */
export function translateUnitCode(code?: string | null): UnitTranslation {
  if (!code) {
    return { singular: 'Unidad', plural: 'Unidades' };
  }
  const normalized = code.trim().toUpperCase();
  if (UNIT_DICTIONARY[normalized]) {
    return UNIT_DICTIONARY[normalized];
  }
  // If it's something like "UND", "UNI", "UN"
  if (['UND', 'UNI', 'UN', 'PZA', 'PZ', 'PIEZA'].includes(normalized)) {
    return { singular: 'Unidad', plural: 'Unidades' };
  }
  if (['CJ', 'CJA', 'BOX'].includes(normalized)) {
    return { singular: 'Caja', plural: 'Cajas' };
  }
  if (['PAQ', 'PAQ.'].includes(normalized)) {
    return { singular: 'Paquete', plural: 'Paquetes' };
  }
  if (['BOL', 'BOLSA'].includes(normalized)) {
    return { singular: 'Bolsa', plural: 'Bolsas' };
  }
  if (['BOT', 'BOTELLA'].includes(normalized)) {
    return { singular: 'Botella', plural: 'Botellas' };
  }
  if (['DOC', 'DOCENA'].includes(normalized)) {
    return { singular: 'Docena', plural: 'Docenas' };
  }
  if (['KG', 'KILOS', 'KILO'].includes(normalized)) {
    return { singular: 'Kilogramo', plural: 'Kilogramos' };
  }
  // Default fallback to "Unidad" instead of cryptic UN/ECE codes
  return { singular: 'Unidad', plural: 'Unidades' };
}

/**
 * Helper to format quantity with appropriate singular or plural unit name
 */
export function formatQuantityWithUnit(qty: number, singular: string, plural: string): string {
  const formattedQty = Number.isInteger(qty) ? qty.toString() : qty.toFixed(2);
  const unit = Math.abs(qty) === 1 ? singular : plural;
  return `${formattedQty} ${unit}`;
}

/**
 * Cleans text from CDATA, unwanted XML artifacts, and extra whitespace
 */
function cleanText(text?: string | null): string {
  if (!text) return '';
  return text
    .replace(/<!\[CDATA\[(.*?)\]\]>/gs, '$1')
    .replace(/[\r\n\t]+/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

/**
 * Searches for an element inside a parent node ignoring namespaces
 */
function findElement(parent: Element | Document, localName: string): Element | null {
  const elements = parent.getElementsByTagNameNS('*', localName);
  if (elements.length > 0) return elements[0];

  // Fallback for some non-standard XML trees
  const allElements = parent.getElementsByTagName('*');
  for (let i = 0; i < allElements.length; i++) {
    const el = allElements[i];
    if (el.localName === localName || el.nodeName.endsWith(':' + localName) || el.nodeName === localName) {
      return el;
    }
  }
  return null;
}

/**
 * Searches for all elements with a given local name inside a parent node
 */
function findElements(parent: Element | Document, localName: string): Element[] {
  const nsElements = parent.getElementsByTagNameNS('*', localName);
  if (nsElements.length > 0) {
    return Array.from(nsElements);
  }

  // Fallback
  const matches: Element[] = [];
  const allElements = parent.getElementsByTagName('*');
  for (let i = 0; i < allElements.length; i++) {
    const el = allElements[i];
    if (el.localName === localName || el.nodeName.endsWith(':' + localName) || el.nodeName === localName) {
      matches.push(el);
    }
  }
  return matches;
}

/**
 * Retrieves text content of a sub-element matching localName
 */
function getSubElementText(parent: Element | Document, localName: string): string {
  const el = findElement(parent, localName);
  return cleanText(el?.textContent);
}

/**
 * Detects conversion factor (Disabled: SUNAT XML does not specify internal packing factor).
 * Always returns null to avoid misinterpreting product descriptions (e.g., 250 GR, 40 GR).
 */
export function detectConversionFactor(_description?: string, _itemElement?: Element): number | null {
  return null;
}

export interface ParsedSunatDocument {
  reception: Reception;
  items: ReceptionItem[];
}

/**
 * Natural numerical sort for warehouse items:
 * Ensures Line 1, 2, 3... 9, 10, 11 instead of alphabetical 1, 10, 100, 2
 */
export function sortItemsNaturally(items: ReceptionItem[]): ReceptionItem[] {
  return [...items].sort((a, b) => {
    // Put extra items at the end
    if (a.isExtra && !b.isExtra) return 1;
    if (!a.isExtra && b.isExtra) return -1;

    const numA = parseInt(a.lineId, 10);
    const numB = parseInt(b.lineId, 10);
    if (!isNaN(numA) && !isNaN(numB)) {
      if (numA !== numB) return numA - numB;
    }

    return a.lineId.localeCompare(b.lineId, undefined, { numeric: true, sensitivity: 'base' });
  });
}

/**
 * Universal SUNAT XML Parser for DespatchAdvice (Guías de Remisión) and Invoice (Facturas)
 */
export function parseSunatXml(xmlString: string, customDOMParser?: any): ParsedSunatDocument {
  const ParserClass = customDOMParser || (typeof DOMParser !== 'undefined' ? DOMParser : null);
  if (!ParserClass) {
    throw new Error('DOMParser no está disponible en el entorno de ejecución.');
  }
  const parser = new ParserClass();
  const xmlDoc = parser.parseFromString(xmlString, 'application/xml');

  // Check for XML parse errors
  const parseError = xmlDoc.getElementsByTagName('parsererror');
  if (parseError.length > 0) {
    throw new Error('El archivo XML contiene errores de sintaxis y no pudo ser interpretado.');
  }

  const rootElement = xmlDoc.documentElement;
  const rootName = rootElement.localName || rootElement.nodeName.replace(/^.*:/, '');

  let documentType: DocumentType;
  if (rootName === 'DespatchAdvice') {
    documentType = 'DespatchAdvice';
  } else if (rootName === 'Invoice') {
    documentType = 'Invoice';
  } else {
    // Attempt fallback heuristic
    if (findElements(xmlDoc, 'DespatchLine').length > 0) {
      documentType = 'DespatchAdvice';
    } else if (findElements(xmlDoc, 'InvoiceLine').length > 0) {
      documentType = 'Invoice';
    } else {
      throw new Error(`Tipo de documento SUNAT no reconocido (${rootName}). Debe ser DespatchAdvice (Guía de Remisión) o Invoice (Factura).`);
    }
  }

  // Document metadata
  const docId = getSubElementText(rootElement, 'ID') || ('DOC-' + Date.now().toString().slice(-6));
  const issueDate = getSubElementText(rootElement, 'IssueDate') || new Date().toISOString().split('T')[0];
  const issueTime = getSubElementText(rootElement, 'IssueTime') || undefined;

  // Supplier info extraction
  let supplierRuc = '';
  let supplierName = '';

  const supplierParty =
    findElement(rootElement, 'DespatchSupplierParty') ||
    findElement(rootElement, 'AccountingSupplierParty');

  if (supplierParty) {
    // RUC
    const partyId = findElement(supplierParty, 'PartyIdentification');
    if (partyId) {
      supplierRuc = getSubElementText(partyId, 'ID');
    }
    if (!supplierRuc) {
      const partyTaxScheme = findElement(supplierParty, 'PartyTaxScheme');
      if (partyTaxScheme) {
        supplierRuc = getSubElementText(partyTaxScheme, 'CompanyID');
      }
    }

    // Name
    const partyLegalEntity = findElement(supplierParty, 'PartyLegalEntity');
    if (partyLegalEntity) {
      supplierName = getSubElementText(partyLegalEntity, 'RegistrationName');
    }
    if (!supplierName) {
      const partyName = findElement(supplierParty, 'PartyName');
      if (partyName) {
        supplierName = getSubElementText(partyName, 'Name');
      }
    }
  }

  if (!supplierRuc) supplierRuc = '20000000001';
  if (!supplierName) supplierName = 'PROVEEDOR SUNAT';

  // Customer info extraction
  let customerRuc = '';
  let customerName = '';
  const customerParty =
    findElement(rootElement, 'DeliveryCustomerParty') ||
    findElement(rootElement, 'AccountingCustomerParty');

  if (customerParty) {
    const custId = findElement(customerParty, 'PartyIdentification');
    if (custId) customerRuc = getSubElementText(custId, 'ID');
    if (!customerRuc) {
      const custTax = findElement(customerParty, 'PartyTaxScheme');
      if (custTax) customerRuc = getSubElementText(custTax, 'CompanyID');
    }

    const custLegal = findElement(customerParty, 'PartyLegalEntity');
    if (custLegal) customerName = getSubElementText(custLegal, 'RegistrationName');
    if (!customerName) {
      const custName = findElement(customerParty, 'PartyName');
      if (custName) customerName = getSubElementText(custName, 'Name');
    }
  }

  // Unique reception ID
  const receptionId = `rec_${documentType.toLowerCase()}_${docId.replace(/[^a-zA-Z0-9_-]/g, '_')}_${Date.now()}`;

  // Extract lines
  const lineTag = documentType === 'DespatchAdvice' ? 'DespatchLine' : 'InvoiceLine';
  const rawLines = findElements(rootElement, lineTag);

  if (rawLines.length === 0) {
    throw new Error(`El comprobante ${docId} no contiene líneas de detalle (${lineTag}).`);
  }

  const items: ReceptionItem[] = [];
  let totalExpectedQuantity = 0;

  rawLines.forEach((lineEl, index) => {
    const rawLineId = getSubElementText(lineEl, 'ID') || String(index + 1);
    const itemEl = findElement(lineEl, 'Item');

    // Supplier Item Identification (SKU / Code)
    let itemCode = '';
    if (itemEl) {
      const sellersId = findElement(itemEl, 'SellersItemIdentification');
      if (sellersId) {
        itemCode = getSubElementText(sellersId, 'ID');
      }
      if (!itemCode) {
        const standardId = findElement(itemEl, 'StandardItemIdentification');
        if (standardId) {
          itemCode = getSubElementText(standardId, 'ID');
        }
      }
      if (!itemCode) {
        const commodity = findElement(itemEl, 'CommodityClassification');
        if (commodity) {
          itemCode = getSubElementText(commodity, 'ItemClassificationCode');
        }
      }
    }
    if (!itemCode) {
      itemCode = `ART-${String(index + 1).padStart(3, '0')}`;
    }

    // Description
    let description = '';
    if (itemEl) {
      description = getSubElementText(itemEl, 'Description');
    }
    if (!description) {
      description = `Producto ${itemCode}`;
    }

    // Quantity tag: DeliveredQuantity in DespatchAdvice, InvoicedQuantity in Invoice
    const qtyTag = documentType === 'DespatchAdvice' ? 'DeliveredQuantity' : 'InvoicedQuantity';
    const quantityEl = findElement(lineEl, qtyTag);

    const rawUnitCode = quantityEl?.getAttribute('unitCode') || 'NIU';
    const rawQtyText = quantityEl?.textContent || '1';
    const expectedQuantity = Math.max(0, parseFloat(rawQtyText) || 1);

    totalExpectedQuantity += expectedQuantity;

    // Price (for Invoice or POS future integration)
    let unitPrice = 0;
    if (documentType === 'Invoice') {
      const priceEl = findElement(lineEl, 'Price');
      if (priceEl) {
        const priceAmount = getSubElementText(priceEl, 'PriceAmount');
        unitPrice = parseFloat(priceAmount) || 0;
      } else {
        const pricingRef = findElement(lineEl, 'PricingReference');
        if (pricingRef) {
          const altPrice = getSubElementText(pricingRef, 'PriceAmount');
          unitPrice = parseFloat(altPrice) || 0;
        }
      }
    }

    // Translation of unitCode
    const unitTrans = translateUnitCode(rawUnitCode);

    const itemId = `${receptionId}_${rawLineId}`;

    items.push({
      id: itemId,
      receptionId,
      lineId: rawLineId,
      itemCode,
      description,
      rawUnitCode,
      unitName: unitTrans.singular,
      unitNamePlural: unitTrans.plural,
      expectedQuantity,
      receivedQuantity: 0,
      looseUnitsReceived: 0,
      unitPrice,
      conversionActive: false,
      conversionFactor: 1,
      conversionTargetUnit: 'Unidad',
      suggestedConversion: null,
      manualCompleted: false,
      status: 'pendiente',
      incidentType: 'ninguno',
      observations: '',
      isExtra: false,
      partialCounts: [],
      createdAt: Date.now(),
      updatedAt: Date.now()
    });
  });

  const reception: Reception = {
    id: receptionId,
    documentType,
    serieNumero: docId,
    fechaEmision: issueDate,
    horaEmision: issueTime,
    proveedorRuc: cleanText(supplierRuc),
    proveedorNombre: cleanText(supplierName),
    clienteRuc: cleanText(customerRuc),
    clienteNombre: cleanText(customerName),
    status: 'en_proceso',
    totalLines: items.length,
    totalExpectedQuantity,
    createdAt: Date.now(),
    updatedAt: Date.now()
  };

  return { reception, items };
}
