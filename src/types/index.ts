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
  amount: number;             // Amount in base unit
  inputAmount: number;        // Raw input entered by user
  unitUsed: string;           // E.g. "Caja" or "Unidad"
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
  expectedQuantity: number;   // Expected in base unit
  receivedQuantity: number;   // Currently received in base unit
  unitPrice: number;          // Unit price (from Invoice or 0)
  
  // Unit conversion settings
  conversionActive: boolean;
  conversionFactor: number;   // E.g., 1 Caja = 12 Unidades
  conversionTargetUnit?: string; // E.g. "Unidad"
  suggestedConversion?: number | null; // Auto-detected from CAX12, etc.

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
  todos: number;
  pendientes: number;
  parciales: number;
  observados: number;
  completos: number;
}
