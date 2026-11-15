import React, { useState, useMemo, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import confetti from 'canvas-confetti';
import {
  Plus,
  AlertCircle,
  PackagePlus,
  Lock,
} from 'lucide-react';

import type { ReceptionItem, FilterTabsCount, IncidentType, ExtraReason } from '../types';
import {
  db,
  addItemCount,
  setItemToExpectedQuantity,
  setItemManualComplete,
  undoLastPartialCount,
  updateItemIncident,
  addExtraItem,
  closeReception,
  reopenReception,
} from '../db';
import { sortItemsNaturally } from '../utils/sunatXmlParser';
import { useDebounce } from '../hooks/useDebounce';

import { ReceptionHeaderSticky, type FilterTab } from './ReceptionHeaderSticky';
import { ProductCard } from './ProductCard';
import { AddCountSheet } from './AddCountSheet';
import { IncidentSheet } from './IncidentSheet';
import { ExtraItemModal } from './ExtraItemModal';
import { CloseReceptionModal } from './CloseReceptionModal';
import { SummaryModal } from './SummaryModal';
import { ConfirmCompleteModal } from './ConfirmCompleteModal';
import { ActionHistorySheet } from './ActionHistorySheet';

interface ReceptionDetailViewProps {
  receptionId: string;
  onBack: () => void;
}

export const ReceptionDetailView: React.FC<ReceptionDetailViewProps> = ({
  receptionId,
  onBack,
}) => {
  // Live queries from Dexie with explicit null when not found
  const reception = useLiveQuery(
    async () => {
      const rec = await db.receptions.get(receptionId);
      return rec ?? null;
    },
    [receptionId]
  );

  const rawItems = useLiveQuery(
    () => db.receptionItems.where('receptionId').equals(receptionId).toArray(),
    [receptionId]
  );

  // Search & Filtering state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const debouncedSearchQuery = useDebounce(searchQuery, 280);

  // Default active tab is 'por_revisar' (Pendientes + Parciales)
  const [activeTab, setActiveTab] = useState<FilterTab>('por_revisar');

  // Modals state
  const [activeAddCountItem, setActiveAddCountItem] = useState<ReceptionItem | null>(null);
  const [activeIncidentItem, setActiveIncidentItem] = useState<ReceptionItem | null>(null);
  const [confirmCompleteItem, setConfirmCompleteItem] = useState<ReceptionItem | null>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);
  const [isExtraModalOpen, setIsExtraModalOpen] = useState<boolean>(false);
  const [isCloseModalOpen, setIsCloseModalOpen] = useState<boolean>(false);
  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState<boolean>(false);

  // Sort raw items naturally (1, 2, 3... 10, 11)
  const items = useMemo(() => {
    if (!rawItems) return [];
    return sortItemsNaturally(rawItems);
  }, [rawItems]);

  // Compute 4 tabs counts: Por revisar, Observados, Listos, Todos
  const tabsCount: FilterTabsCount = useMemo(() => {
    if (!items) {
      return { porRevisar: 0, observados: 0, listos: 0, todos: 0 };
    }

    let porRevisar = 0;
    let observados = 0;
    let listos = 0;

    items.forEach((item) => {
      if (item.isExtra || item.status === 'observado' || item.status === 'extra' || item.incidentType !== 'ninguno') {
        observados++;
      } else if (item.status === 'completo') {
        listos++;
      } else {
        // Pendiente o Parcial
        porRevisar++;
      }
    });

    return {
      porRevisar,
      observados,
      listos,
      todos: items.length,
    };
  }, [items]);

  // Check 100% completion celebration (fires only once per completion)
  const isAllComplete = useMemo(() => {
    if (!items || items.length === 0) return false;
    return items.every((item) => item.isExtra || item.status === 'completo');
  }, [items]);

  const hasCelebratedRef = React.useRef(false);

  useEffect(() => {
    if (!isAllComplete) {
      hasCelebratedRef.current = false;
      return;
    }

    if (isAllComplete && !hasCelebratedRef.current && reception?.status === 'en_proceso' && items && items.length > 0) {
      hasCelebratedRef.current = true;
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch (e) {
        // Safe check
      }
    }
  }, [isAllComplete, reception?.status, items?.length]);

  // Multi-token search with debounced value & natural sort
  const filteredItems = useMemo(() => {
    if (!items) return [];

    const query = debouncedSearchQuery.trim().toLowerCase();

    // 1. Buscador Global: Si hay texto en el input, busca en TODOS los ítems ignorando el filtro de pestaña
    if (query) {
      const tokens = query.split(/\s+/).filter(Boolean);
      return items.filter((item) => {
        const searchable = `${item.itemCode} ${item.description} ${item.lineId} ${item.observations} ${item.unitName} ${item.status}`.toLowerCase();
        return tokens.every((token) => searchable.includes(token));
      });
    }

    // 2. Si el buscador está vacío, aplica la pestaña seleccionada:
    if (activeTab === 'por_revisar') {
      // Muestra juntos Pendientes y Parciales (sólo salen cuando llegan al 100% Listos o son Observados)
      return items.filter(
        (i) => !i.isExtra && i.status !== 'completo' && i.status !== 'observado' && i.status !== 'extra' && i.incidentType === 'ninguno'
      );
    } else if (activeTab === 'observados') {
      // Dañados, faltantes, sobrantes y productos extras
      return items.filter(
        (i) => i.isExtra || i.status === 'observado' || i.status === 'extra' || i.incidentType !== 'ninguno'
      );
    } else if (activeTab === 'listos') {
      // 100% completados
      return items.filter(
        (i) => !i.isExtra && i.status === 'completo' && i.incidentType === 'ninguno'
      );
    }

    // activeTab === 'todos'
    return items;
  }, [items, activeTab, debouncedSearchQuery]);

  // Actions
  const handleRequestQuickComplete = (itemId: string) => {
    const found = items.find((i) => i.id === itemId);
    if (found) {
      setConfirmCompleteItem(found);
    }
  };

  const handleConfirmComplete = async (itemId: string) => {
    try {
      await setItemToExpectedQuantity(itemId);
    } catch (err) {
      console.error('Error al completar ítem:', err);
      alert('Error al guardar en base de datos local');
    } finally {
      setConfirmCompleteItem(null);
    }
  };

  const handleSetManualComplete = async (itemId: string, completed: boolean) => {
    try {
      await setItemManualComplete(itemId, completed);
    } catch (err) {
      console.error('Error al actualizar estado manual:', err);
    }
  };

  const handleAddCountConfirm = async (
    amountToAdd: number,
    rawInput: number,
    unitUsed: string,
    boxTag?: string,
    isLooseUnit?: boolean,
    manualFactor?: number
  ) => {
    if (!activeAddCountItem) return;
    const targetId = activeAddCountItem.id;
    try {
      await addItemCount(
        targetId,
        amountToAdd,
        rawInput,
        unitUsed,
        boxTag,
        isLooseUnit,
        manualFactor
      );
    } catch (err) {
      console.error('Error al sumar conteo:', err);
      alert('No se pudo registrar el conteo en almacenamiento local');
    }
  };

  const handleUndoLast = async (itemId: string) => {
    try {
      await undoLastPartialCount(itemId);
    } catch (err) {
      console.error('Error al deshacer último conteo:', err);
    }
  };

  const handleIncidentSave = async (incidentType: IncidentType, observations: string) => {
    if (!activeIncidentItem) return;
    const targetId = activeIncidentItem.id;
    try {
      await updateItemIncident(targetId, incidentType, observations);
    } catch (err) {
      console.error('Error al guardar incidencia:', err);
    }
  };

  const handleExtraItemConfirm = async (data: {
    itemCode?: string;
    description: string;
    unitName: string;
    unitNamePlural: string;
    quantity: number;
    reason: ExtraReason;
    observations?: string;
  }) => {
    try {
      await addExtraItem(receptionId, data);
      setActiveTab('observados');
      setSearchQuery('');
    } catch (err) {
      console.error('Error al registrar producto extra:', err);
      alert('No se pudo registrar el producto extra');
    }
  };

  const handleConfirmClose = async (notes?: string, autoMarkMissing?: boolean) => {
    try {
      await closeReception(receptionId, notes, autoMarkMissing);
      setIsCloseModalOpen(false);
      setIsSummaryModalOpen(true);
    } catch (err) {
      console.error('Error al cerrar recepción:', err);
      alert('Error al cerrar formalmente la recepción');
    }
  };

  const handleReopen = async () => {
    try {
      await reopenReception(receptionId);
    } catch (err) {
      console.error('Error al reabrir recepción:', err);
    }
  };

  if (reception === undefined || rawItems === undefined) {
    return (
      <div className="min-h-screen bg-[#F2F2F7] flex items-center justify-center p-6 text-center">
        <div className="bg-white border border-[#E5E5EA] rounded-2xl p-6 shadow-xs max-w-sm w-full space-y-3 animate-pulse">
          <div className="w-10 h-10 rounded-full bg-[#E5E5EA] mx-auto" />
          <div className="h-4 bg-[#E5E5EA] rounded-md w-36 mx-auto" />
          <p className="text-xs text-[#8E8E93]">Cargando productos del almacén...</p>
        </div>
      </div>
    );
  }

  if (reception === null) {
    return (
      <div className="min-h-screen bg-[#F2F2F7] flex items-center justify-center p-6 text-center">
        <div className="bg-white border border-[#E5E5EA] rounded-2xl p-6 shadow-xs max-w-sm w-full space-y-3">
          <div className="w-10 h-10 rounded-full bg-[#FFEBEA] text-[#FF3B30] flex items-center justify-center mx-auto">
            <AlertCircle className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-sm text-[#1C1C1E]">Recepción no encontrada</h3>
          <p className="text-xs text-[#8E8E93]">
            No se encontró el comprobante en la memoria del dispositivo. Puede haber sido eliminado.
          </p>
          <button
            onClick={onBack}
            className="w-full py-2.5 px-4 bg-[#007AFF] text-white text-xs font-bold rounded-xl shadow-xs"
          >
            Volver a la Lista
          </button>
        </div>
      </div>
    );
  }

  const isClosed = reception.status === 'cerrada';

  return (
    <div className="min-h-screen bg-[#F2F2F7] flex flex-col pb-24">
      {/* Unified Single Sticky Header with History Button */}
      <ReceptionHeaderSticky
        reception={reception}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        tabsCount={tabsCount}
        onOpenCloseModal={() => setIsCloseModalOpen(true)}
        onOpenSummaryModal={() => setIsSummaryModalOpen(true)}
        onOpenHistoryModal={() => setIsHistoryOpen(true)}
        onBack={onBack}
      />

      {/* Main Content Area */}
      <main className="max-w-2xl mx-auto w-full px-3 py-2 space-y-2 flex-1">
        {/* Closed Reception Banner (iOS style) */}
        {isClosed && (
          <div className="p-3 bg-[#EBF9EE] border border-[#D1F2D9] rounded-2xl flex items-center justify-between text-[#1C1C1E] text-xs">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-[#34C759]" />
              <div>
                <strong className="block text-[#1C1C1E]">Recepción cerrada formalmente</strong>
                <span className="text-[11px] text-[#34C759] font-medium">
                  {reception.closedAt && new Date(reception.closedAt).toLocaleString('es-PE')}
                </span>
              </div>
            </div>
            <button
              onClick={() => setIsSummaryModalOpen(true)}
              className="px-3 py-1.5 bg-[#34C759] hover:bg-[#2EB84F] text-white font-bold rounded-xl text-xs shadow-xs"
            >
              Ver Reportes
            </button>
          </div>
        )}

        {/* Empty Search Result with Direct "Register Extra" Action */}
        {filteredItems.length === 0 && (
          <div className="bg-white border border-[#E5E5EA] rounded-2xl p-5 text-center space-y-2.5 mt-1 shadow-xs">
            <div className="w-10 h-10 rounded-full bg-[#F2F2F7] flex items-center justify-center mx-auto text-[#8E8E93]">
              <AlertCircle className="w-5 h-5" />
            </div>

            <div>
              <h4 className="font-bold text-[#1C1C1E] text-xs sm:text-sm">
                {searchQuery ? `No se encontró "${searchQuery}"` : 'No hay productos en esta pestaña'}
              </h4>
              <p className="text-[11px] text-[#8E8E93] mt-0.5 max-w-xs mx-auto">
                {searchQuery
                  ? '¿La mercadería llegó físicamente pero no figura en la guía o factura del proveedor?'
                  : activeTab === 'por_revisar'
                  ? '¡Excelente! Todos los productos de esta lista ya fueron completados u observados.'
                  : 'Cambia de pestaña o realiza una búsqueda para ver los productos.'}
              </p>
            </div>

            {searchQuery && !isClosed && (
              <button
                type="button"
                onClick={() => setIsExtraModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#AF52DE] hover:bg-[#9E3ED0] active:bg-[#8D2EC2] text-white font-bold rounded-xl text-xs shadow-xs transition-transform active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>Registrar "{searchQuery}" como Producto Extra</span>
              </button>
            )}
          </div>
        )}

        {/* List of Product Cards */}
        {filteredItems.map((item) => (
          <ProductCard
            key={item.id}
            item={item}
            isClosed={isClosed}
            onQuickComplete={handleRequestQuickComplete}
            onOpenAddCount={setActiveAddCountItem}
            onUndoLast={handleUndoLast}
            onOpenIncident={setActiveIncidentItem}
            onSetManualComplete={handleSetManualComplete}
          />
        ))}
      </main>

      {/* Floating Action Button (+ Extra) in Bottom Right */}
      {!isClosed && (
        <div className="fixed bottom-5 right-4 z-30">
          <button
            type="button"
            onClick={() => setIsExtraModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2.5 bg-[#AF52DE] hover:bg-[#9E3ED0] active:bg-[#8D2EC2] text-white font-bold text-xs rounded-full shadow-lg transition-transform active:scale-90 border-2 border-white min-h-[44px]"
            title="Registrar producto extra no incluido en la guía"
          >
            <PackagePlus className="w-4 h-4" />
            <span className="font-bold">Extra</span>
          </button>
        </div>
      )}

      {/* Bottom Sheets and Modals */}
      <AddCountSheet
        item={activeAddCountItem}
        isOpen={Boolean(activeAddCountItem)}
        onClose={() => setActiveAddCountItem(null)}
        onConfirm={handleAddCountConfirm}
      />

      <IncidentSheet
        item={activeIncidentItem}
        isOpen={Boolean(activeIncidentItem)}
        onClose={() => setActiveIncidentItem(null)}
        onSave={handleIncidentSave}
      />

      <ExtraItemModal
        isOpen={isExtraModalOpen}
        initialQuery={searchQuery}
        onClose={() => setIsExtraModalOpen(false)}
        onConfirm={handleExtraItemConfirm}
      />

      <CloseReceptionModal
        isOpen={isCloseModalOpen}
        reception={reception}
        items={items}
        onClose={() => setIsCloseModalOpen(false)}
        onConfirmClose={handleConfirmClose}
      />

      <SummaryModal
        isOpen={isSummaryModalOpen}
        reception={reception}
        items={items}
        onClose={() => setIsSummaryModalOpen(false)}
        onReopen={handleReopen}
      />

      {/* Confirmation modal before marking full quantity */}
      <ConfirmCompleteModal
        isOpen={Boolean(confirmCompleteItem)}
        item={confirmCompleteItem}
        onClose={() => setConfirmCompleteItem(null)}
        onConfirm={handleConfirmComplete}
      />

      {/* Action History / Audit Drawer */}
      <ActionHistorySheet
        isOpen={isHistoryOpen}
        items={items}
        onClose={() => setIsHistoryOpen(false)}
        onUndoItem={handleUndoLast}
      />
    </div>
  );
};
