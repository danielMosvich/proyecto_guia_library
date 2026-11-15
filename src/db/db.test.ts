import { describe, it, expect, beforeEach } from 'vitest';
import 'fake-indexeddb/auto';
import {
  db,
  saveReceptionWithItems,
  addItemCount,
  setItemToExpectedQuantity,
  undoLastPartialCount,
  updateItemIncident,
  updateItemConversion,
  addExtraItem,
  closeReception,
  reopenReception,
  computeItemStatus,
} from './index';
import type { Reception, ReceptionItem } from '../types';

describe('Warehouse IndexedDB Persistence & Business Logic', () => {
  beforeEach(async () => {
    await db.receptions.clear();
    await db.receptionItems.clear();
  });

  const testReception: Reception = {
    id: 'rec_test_1',
    documentType: 'DespatchAdvice',
    serieNumero: 'T001-001',
    fechaEmision: '2026-11-15',
    proveedorRuc: '20123456789',
    proveedorNombre: 'DISTRIBUIDORA LIMA S.A.C.',
    status: 'en_proceso',
    totalLines: 1,
    totalExpectedQuantity: 48,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  const testItem: ReceptionItem = {
    id: 'rec_test_1_line_1',
    receptionId: 'rec_test_1',
    lineId: '1',
    itemCode: 'SKU-001',
    description: 'CUADERNO RAYADO 100H',
    rawUnitCode: 'NIU',
    unitName: 'Unidad',
    unitNamePlural: 'Unidades',
    expectedQuantity: 48,
    receivedQuantity: 0,
    unitPrice: 0,
    conversionActive: false,
    conversionFactor: 1,
    status: 'pendiente',
    incidentType: 'ninguno',
    observations: '',
    isExtra: false,
    partialCounts: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  it('Computes item statuses accurately', () => {
    expect(computeItemStatus(0, 48, 'ninguno', false)).toBe('pendiente');
    expect(computeItemStatus(14, 48, 'ninguno', false)).toBe('parcial');
    expect(computeItemStatus(48, 48, 'ninguno', false)).toBe('completo');
    expect(computeItemStatus(50, 48, 'sobrante', false)).toBe('observado');
    expect(computeItemStatus(10, 48, 'danado', false)).toBe('observado');
    expect(computeItemStatus(10, 0, 'ninguno', true)).toBe('extra');
  });

  it('Saves reception and performs incremental box-by-box count with history', async () => {
    await saveReceptionWithItems(testReception, [testItem]);

    // 1st partial count: 14 units in Box 1
    const step1 = await addItemCount(testItem.id, 14, 14, 'Unidad', 'Caja 1');
    expect(step1?.receivedQuantity).toBe(14);
    expect(step1?.status).toBe('parcial');
    expect(step1?.partialCounts.length).toBe(1);
    expect(step1?.partialCounts[0].boxTag).toBe('Caja 1');

    // 2nd partial count: +2 units in Box 4
    const step2 = await addItemCount(testItem.id, 2, 2, 'Unidad', 'Caja 4');
    expect(step2?.receivedQuantity).toBe(16);
    expect(step2?.status).toBe('parcial');
    expect(step2?.partialCounts.length).toBe(2);

    // Verify persistence from DB
    const persisted = await db.receptionItems.get(testItem.id);
    expect(persisted?.receivedQuantity).toBe(16);
    expect(persisted?.partialCounts.length).toBe(2);
  });

  it('Supports undoing the last partial count', async () => {
    await saveReceptionWithItems(testReception, [testItem]);
    await addItemCount(testItem.id, 14, 14, 'Unidad', 'Caja 1');
    await addItemCount(testItem.id, 20, 20, 'Unidad', 'Caja 2'); // Mistyped

    const reverted = await undoLastPartialCount(testItem.id);
    expect(reverted?.receivedQuantity).toBe(14);
    expect(reverted?.partialCounts.length).toBe(1);
    expect(reverted?.partialCounts[0].amount).toBe(14);
  });

  it('Completes to expected quantity in 1 tap (✓ Todo)', async () => {
    await saveReceptionWithItems(testReception, [testItem]);
    const completed = await setItemToExpectedQuantity(testItem.id);

    expect(completed?.receivedQuantity).toBe(48);
    expect(completed?.status).toBe('completo');
  });

  it('Updates packaging conversion multiplier', async () => {
    await saveReceptionWithItems(testReception, [testItem]);
    const updated = await updateItemConversion(testItem.id, true, 12, 'Unidad');

    expect(updated?.conversionActive).toBe(true);
    expect(updated?.conversionFactor).toBe(12);
  });

  it('Updates item incident and observations', async () => {
    await saveReceptionWithItems(testReception, [testItem]);
    const updated = await updateItemIncident(testItem.id, 'danado', 'Caja chancada y rota');

    expect(updated?.incidentType).toBe('danado');
    expect(updated?.status).toBe('observado');
    expect(updated?.observations).toBe('Caja chancada y rota');
  });

  it('Registers extra products not in guide', async () => {
    await saveReceptionWithItems(testReception, [testItem]);

    const extra = await addExtraItem(testReception.id, {
      description: 'CINTA DE EMBALAJE PEGAFAN',
      unitName: 'Rollo',
      unitNamePlural: 'Rollos',
      quantity: 5,
      reason: 'bonificacion',
      observations: 'Entregado por chofer de regalo',
    });

    expect(extra.isExtra).toBe(true);
    expect(extra.status).toBe('extra');
    expect(extra.extraReason).toBe('bonificacion');
    expect(extra.receivedQuantity).toBe(5);

    const count = await db.receptionItems.where('receptionId').equals(testReception.id).count();
    expect(count).toBe(2);
  });

  it('Closes reception, locks items, and auto-marks unreceived as missing', async () => {
    await saveReceptionWithItems(testReception, [testItem]); // received = 0

    await closeReception(testReception.id, 'Cierre sin novedad', true);

    const rec = await db.receptions.get(testReception.id);
    expect(rec?.status).toBe('cerrada');
    expect(rec?.closedAt).toBeDefined();

    const item = await db.receptionItems.get(testItem.id);
    expect(item?.incidentType).toBe('faltante');
    expect(item?.status).toBe('observado');
    expect(item?.observations).toContain('Faltante detectado al cierre');

    // Reopen for supervisor
    await reopenReception(testReception.id);
    const reopened = await db.receptions.get(testReception.id);
    expect(reopened?.status).toBe('en_proceso');
  });
});
