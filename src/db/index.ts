import Dexie, { type Table } from 'dexie';
import type { Reception, ReceptionItem, IncidentType, ItemStatus, PartialCountEntry, ExtraReason } from '../types';

export class WarehouseDatabase extends Dexie {
  receptions!: Table<Reception, string>;
  receptionItems!: Table<ReceptionItem, string>;

  constructor() {
    super('SunatWarehouseDB');
    this.version(1).stores({
      receptions: '&id, status, serieNumero, fechaEmision, createdAt, updatedAt',
      receptionItems: '&id, receptionId, itemCode, status, isExtra, [receptionId+status], [receptionId+isExtra]'
    });
  }
}

export const db = new WarehouseDatabase();

/**
 * Calculates current status of an item based on its received quantity vs expected
 */
export function computeItemStatus(
  received: number,
  expected: number,
  incident: IncidentType,
  isExtra: boolean,
  observations: string = ''
): ItemStatus {
  if (isExtra) {
    return 'extra';
  }
  if (incident !== 'ninguno' && incident !== 'sobrante') {
    return 'observado';
  }
  if (received <= 0) {
    return 'pendiente';
  }
  if (received < expected) {
    return 'parcial';
  }
  if (received === expected) {
    return observations.trim().length > 0 ? 'observado' : 'completo';
  }
  // received > expected
  return 'observado';
}

/**
 * Saves a new reception with all its line items atomically in IndexedDB
 */
export async function saveReceptionWithItems(reception: Reception, items: ReceptionItem[]): Promise<void> {
  await db.transaction('rw', db.receptions, db.receptionItems, async () => {
    await db.receptions.put(reception);
    await db.receptionItems.bulkPut(items);
  });
}

/**
 * Increments an item's count (e.g. +14 units or +2 boxes).
 * Adds to the partial counts history and recalculates status.
 */
export async function addItemCount(
  itemId: string,
  baseUnitsToAdd: number,
  rawInput: number,
  unitUsed: string,
  boxTag?: string
): Promise<ReceptionItem | null> {
  return await db.transaction('rw', db.receptionItems, db.receptions, async () => {
    const item = await db.receptionItems.get(itemId);
    if (!item) return null;

    const newReceived = Math.max(0, item.receivedQuantity + baseUnitsToAdd);
    const newEntry: PartialCountEntry = {
      id: 'entry_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      amount: baseUnitsToAdd,
      inputAmount: rawInput,
      unitUsed,
      boxTag: boxTag?.trim() || undefined,
      timestamp: Date.now()
    };

    const newPartialCounts = [...(item.partialCounts || []), newEntry];
    
    // Auto-detect surplus
    let incident = item.incidentType;
    if (newReceived > item.expectedQuantity && !item.isExtra && incident === 'ninguno') {
      incident = 'sobrante';
    } else if (newReceived <= item.expectedQuantity && incident === 'sobrante') {
      incident = 'ninguno';
    }

    const newStatus = computeItemStatus(newReceived, item.expectedQuantity, incident, item.isExtra, item.observations);

    const updatedItem: ReceptionItem = {
      ...item,
      receivedQuantity: newReceived,
      partialCounts: newPartialCounts,
      incidentType: incident,
      status: newStatus,
      updatedAt: Date.now()
    };

    await db.receptionItems.put(updatedItem);
    await db.receptions.update(item.receptionId, { updatedAt: Date.now() });

    return updatedItem;
  });
}

/**
 * Sets an item's count to exactly the expected quantity in 1 tap (✓ Todo / + Resto).
 */
export async function setItemToExpectedQuantity(itemId: string): Promise<ReceptionItem | null> {
  return await db.transaction('rw', db.receptionItems, db.receptions, async () => {
    const item = await db.receptionItems.get(itemId);
    if (!item) return null;

    const needed = item.expectedQuantity - item.receivedQuantity;
    if (needed <= 0 && item.receivedQuantity === item.expectedQuantity) {
      return item; // already full
    }

    const amountToAdd = needed > 0 ? needed : item.expectedQuantity;
    const newReceived = item.expectedQuantity;

    const newEntry: PartialCountEntry = {
      id: 'entry_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      amount: amountToAdd,
      inputAmount: amountToAdd,
      unitUsed: item.unitName,
      boxTag: 'Resto completo',
      timestamp: Date.now()
    };

    const newPartialCounts = [...(item.partialCounts || []), newEntry];
    const incident: IncidentType = item.incidentType === 'sobrante' || item.incidentType === 'faltante' 
      ? 'ninguno' 
      : item.incidentType;

    const newStatus = computeItemStatus(newReceived, item.expectedQuantity, incident, item.isExtra, item.observations);

    const updatedItem: ReceptionItem = {
      ...item,
      receivedQuantity: newReceived,
      partialCounts: newPartialCounts,
      incidentType: incident,
      status: newStatus,
      updatedAt: Date.now()
    };

    await db.receptionItems.put(updatedItem);
    await db.receptions.update(item.receptionId, { updatedAt: Date.now() });

    return updatedItem;
  });
}

/**
 * Reverts the last partial count entry.
 */
export async function undoLastPartialCount(itemId: string): Promise<ReceptionItem | null> {
  return await db.transaction('rw', db.receptionItems, db.receptions, async () => {
    const item = await db.receptionItems.get(itemId);
    if (!item || !item.partialCounts || item.partialCounts.length === 0) return null;

    const lastEntry = item.partialCounts[item.partialCounts.length - 1];
    const newPartialCounts = item.partialCounts.slice(0, -1);
    const newReceived = Math.max(0, item.receivedQuantity - lastEntry.amount);

    let incident = item.incidentType;
    if (newReceived <= item.expectedQuantity && incident === 'sobrante') {
      incident = 'ninguno';
    }

    const newStatus = computeItemStatus(newReceived, item.expectedQuantity, incident, item.isExtra, item.observations);

    const updatedItem: ReceptionItem = {
      ...item,
      receivedQuantity: newReceived,
      partialCounts: newPartialCounts,
      incidentType: incident,
      status: newStatus,
      updatedAt: Date.now()
    };

    await db.receptionItems.put(updatedItem);
    await db.receptions.update(item.receptionId, { updatedAt: Date.now() });

    return updatedItem;
  });
}

/**
 * Updates an item's incident type and observation note.
 */
export async function updateItemIncident(
  itemId: string,
  incidentType: IncidentType,
  observations: string
): Promise<ReceptionItem | null> {
  return await db.transaction('rw', db.receptionItems, db.receptions, async () => {
    const item = await db.receptionItems.get(itemId);
    if (!item) return null;

    const newStatus = computeItemStatus(
      item.receivedQuantity,
      item.expectedQuantity,
      incidentType,
      item.isExtra,
      observations
    );

    const updatedItem: ReceptionItem = {
      ...item,
      incidentType,
      observations: observations.trim(),
      status: newStatus,
      updatedAt: Date.now()
    };

    await db.receptionItems.put(updatedItem);
    await db.receptions.update(item.receptionId, { updatedAt: Date.now() });

    return updatedItem;
  });
}

/**
 * Updates conversion multiplier settings for an item.
 */
export async function updateItemConversion(
  itemId: string,
  conversionActive: boolean,
  conversionFactor: number,
  conversionTargetUnit?: string
): Promise<ReceptionItem | null> {
  return await db.transaction('rw', db.receptionItems, async () => {
    const item = await db.receptionItems.get(itemId);
    if (!item) return null;

    const updatedItem: ReceptionItem = {
      ...item,
      conversionActive,
      conversionFactor: Math.max(1, conversionFactor),
      conversionTargetUnit: conversionTargetUnit || item.conversionTargetUnit,
      updatedAt: Date.now()
    };

    await db.receptionItems.put(updatedItem);
    return updatedItem;
  });
}

/**
 * Registers an extra product not present in the guide/invoice.
 */
export async function addExtraItem(
  receptionId: string,
  data: {
    itemCode?: string;
    description: string;
    unitName: string;
    unitNamePlural: string;
    quantity: number;
    reason: ExtraReason;
    observations?: string;
  }
): Promise<ReceptionItem> {
  const lineId = 'EXTRA-' + Date.now().toString().slice(-6);
  const id = `${receptionId}_${lineId}`;

  const extraItem: ReceptionItem = {
    id,
    receptionId,
    lineId,
    itemCode: (data.itemCode && data.itemCode.trim()) || ('EXTRA-' + Math.floor(1000 + Math.random() * 9000)),
    description: data.description.trim(),
    rawUnitCode: 'NIU',
    unitName: data.unitName,
    unitNamePlural: data.unitNamePlural,
    expectedQuantity: 0,
    receivedQuantity: data.quantity,
    unitPrice: 0,
    conversionActive: false,
    conversionFactor: 1,
    status: 'extra',
    incidentType: 'ninguno',
    observations: data.observations?.trim() || '',
    isExtra: true,
    extraReason: data.reason,
    partialCounts: [
      {
        id: 'entry_' + Date.now(),
        amount: data.quantity,
        inputAmount: data.quantity,
        unitUsed: data.unitName,
        boxTag: 'Ingreso Extra (' + data.reason + ')',
        timestamp: Date.now()
      }
    ],
    createdAt: Date.now(),
    updatedAt: Date.now()
  };

  await db.transaction('rw', db.receptionItems, db.receptions, async () => {
    await db.receptionItems.put(extraItem);
    const rec = await db.receptions.get(receptionId);
    if (rec) {
      await db.receptions.update(receptionId, {
        totalLines: rec.totalLines + 1,
        updatedAt: Date.now()
      });
    }
  });

  return extraItem;
}

/**
 * Finalizes and closes a reception. Optionally auto-marks incomplete items as 'faltante'.
 */
export async function closeReception(
  receptionId: string,
  notes?: string,
  autoMarkMissing: boolean = true
): Promise<void> {
  await db.transaction('rw', db.receptions, db.receptionItems, async () => {
    const items = await db.receptionItems.where('receptionId').equals(receptionId).toArray();
    const now = Date.now();

    if (autoMarkMissing) {
      for (const item of items) {
        if (!item.isExtra && item.receivedQuantity < item.expectedQuantity) {
          const diff = item.expectedQuantity - item.receivedQuantity;
          const currentObs = item.observations ? item.observations + ' | ' : '';
          const newObs = `${currentObs}Faltante detectado al cierre (${diff} ${diff === 1 ? item.unitName : item.unitNamePlural})`;

          await db.receptionItems.update(item.id, {
            incidentType: 'faltante',
            status: 'observado',
            observations: newObs,
            updatedAt: now
          });
        }
      }
    }

    await db.receptions.update(receptionId, {
      status: 'cerrada',
      closedAt: now,
      closedNotes: notes?.trim() || undefined,
      updatedAt: now
    });
  });
}

/**
 * Re-opens a closed reception for supervisor corrections.
 */
export async function reopenReception(receptionId: string): Promise<void> {
  await db.receptions.update(receptionId, {
    status: 'en_proceso',
    updatedAt: Date.now()
  });
}

/**
 * Deletes a reception and all its associated items.
 */
export async function deleteReception(receptionId: string): Promise<void> {
  await db.transaction('rw', db.receptions, db.receptionItems, async () => {
    await db.receptionItems.where('receptionId').equals(receptionId).delete();
    await db.receptions.delete(receptionId);
  });
}
