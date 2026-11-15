export type DocumentType = 'DespatchAdvice' | 'Invoice';

export type ReceptionStatus = 'en_proceso' | 'cerrada';

export type ItemStatus = 'pendiente' | 'parcial' | 'completo' | 'observado' | 'extra';

export type IncidentType =
  | 'ninguno'
  | 'faltante'
  | 'danado'
  | 'cambiado'
  | 'sobrante'
  | 'otro';

export type ExtraReason =
  | 'bonificacion'
  | 'error_envio'
  | 'reemplazo'
  | 'otro';

export interface PartialCountEntry {
  id: string;
  amount: number;             // Amount added (in XML units or loose units)
  inputAmount: number;        // Raw input entered by user
  unitUsed: string;           // E.g. "Caja" or "Unidades"
  isLooseUnit?: boolean;      // True if entered as loose units
  boxTag?: string;            // E.g. "Caja 1", "Parihuela 3"
  timestamp: number;
}

export interface ReceptionItem {
  id: string;                 // receptionId + '_' + lineId
  receptionId: string;
  lineId: string;             // From XML cbc:ID or generated
  itemCode: string;           // Supplier code or SKU
  description: string;
  rawUnitCode: string;        // E.g. "NIU", "BX", "PK"
  unitName: string;           // Translated Spanish singular: "Unidad", "Caja"
  unitNamePlural: string;     // Translated Spanish plural: "Unidades", "Cajas"
  expectedQuantity: number;   // Expected in XML unit (e.g. 2 Cajas)
  receivedQuantity: number;   // Currently received in XML unit (e.g. 1 Caja)
  unitPrice: number;          // Unit price (from Invoice or 0)
  
  // Loose units & conversion settings
  looseUnitsReceived: number; // Conteo de unidades sueltas recibidas (ej. 5)
  conversionActive: boolean;  // True si el usuario definió un factor manual
  conversionFactor: number;   // Factor manual (ej. 1 Caja = 12 Unidades)
  conversionTargetUnit?: string; // E.g. "Unidad"
  suggestedConversion?: number | null; // Deprecated: keep optional null for compat
  manualCompleted?: boolean;  // True si el usuario lo marcó manualmente como completo

  // Status & Incidents
  status: ItemStatus;
  incidentType: IncidentType;
  observations: string;

  // Extra item fields
  isExtra: boolean;
  extraReason?: ExtraReason | null;

  // Conteo incremental history
  partialCounts: PartialCountEntry[];

  createdAt: number;
  updatedAt: number;
}

export interface Reception {
  id: string;
  documentType: DocumentType;
  serieNumero: string;
  fechaEmision: string;
  horaEmision?: string;
  
  // Supplier Info
  proveedorRuc: string;
  proveedorNombre: string;
  
  // Customer Info
  clienteRuc?: string;
  clienteNombre?: string;

  // Status
  status: ReceptionStatus;
  totalLines: number;
  totalExpectedQuantity: number;
  
  // Timestamps
  createdAt: number;
  updatedAt: number;
  closedAt?: number;
  closedNotes?: string;
}

// Contract for POS Ingestion
export interface RecepcionPOSPayload {
  version: string;
  documentoOrigen: {
    tipo: DocumentType;
    serieNumero: string;
    fechaEmision: string;
    proveedorRuc: string;
    proveedorNombre: string;
  };
  recepcion: {
    id: string;
    fechaInicio: string;
    fechaCierre: string;
    totalLineas: number;
    itemsRecibidosConformes: number;
    itemsConDiscrepancia: number;
    porcentajeConformidad: number;
    observacionesCierre?: string;
  };
  movimientosInventario: Array<{
    linea: string;
    sku: string;
    nombre: string;
    unidadMedida: string;
    cantidadEsperada: number;
    cantidadIngresadaReal: number;
    diferencia: number;
    costoUnitario: number;
    costoTotalEstimado: number;
    esBonificacionOExtra: boolean;
    motivoExtra?: string | null;
    tipoIncidencia: IncidentType;
    observacion: string;
    desgloseConteos: string;
  }>;
}

export interface FilterTabsCount {
  porRevisar: number;
  observados: number;
  listos: number;
  todos: number;
}
