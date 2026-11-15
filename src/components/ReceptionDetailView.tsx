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

interface ReceptionDetailViewProps {
  receptionId: string;
  onBack: () => void;
}

export const ReceptionDetailView: React.FC<ReceptionDetailViewProps> = ({
  receptionId,
  onBack,
}) => {
  // Live queries from Dexie
  const reception = useLiveQuery(
    () => db.receptions.get(receptionId),
    [receptionId]
  );

  const rawItems = useLiveQuery(
    () => db.receptionItems.where('receptionId').equals(receptionId).toArray(),
    [receptionId]
  );

  // Search & Filtering state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const debouncedSearchQuery = useDebounce(searchQuery, 280);

  // Default tab is 'pendientes' so completed items instantly vanish from view
  const [activeTab, setActiveTab] = useState<FilterTab>('pendientes');

  // Modals state
  const [activeAddCountItem, setActiveAddCountItem] = useState<ReceptionItem | null>(null);
  const [activeIncidentItem, setActiveIncidentItem] = useState<ReceptionItem | null>(null);
  const [isExtraModalOpen, setIsExtraModalOpen] = useState<boolean>(false);
  const [isCloseModalOpen, setIsCloseModalOpen] = useState<boolean>(false);
  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState<boolean>(false);

  // Sort raw items naturally (1, 2, 3... 10, 11)
  const items = useMemo(() => {
    if (!rawItems) return [];
    return sortItemsNaturally(rawItems);
  }, [rawItems]);

  // Compute 4 tabs counts: Pendientes, Parciales, Observados/Extras, Listos/Completos
  const tabsCount: FilterTabsCount = useMemo(() => {
    if (!items) {
      return { todos: 0, pendientes: 0, parciales: 0, observados: 0, completos: 0 };
    }

    let pendientes = 0;
    let parciales = 0;
    let observados = 0;
    let completos = 0;

    items.forEach((item) => {
      if (item.isExtra || item.status === 'observado' || item.status === 'extra') {
        observados++;
      } else if (item.status === 'completo') {
        completos++;
      } else if (item.status === 'parcial') {
        parciales++;
      } else {
        pendientes++;
      }
    });

    return {
      todos: items.length,
      pendientes,
      parciales,
      observados,
      completos,
    };
  }, [items]);

  // Check 100% completion celebration
  const isAllComplete = useMemo(() => {
    if (!items || items.length === 0) return false;
    return items.every((item) => item.isExtra || item.status === 'completo');
  }, [items]);

  useEffect(() => {
    if (isAllComplete && reception?.status === 'en_proceso' && items && items.length > 0) {
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
  }, [isAllComplete, reception?.status, items]);

  // Multi-token search with debounced value & natural sort
  const filteredItems = useMemo(() => {
    if (!items) return [];

    let result = items;

    // 1. Tab filter (4 fixed categories)
    if (activeTab === 'pendientes') {
      result = result.filter((i) => !i.isExtra && i.status === 'pendiente');
    } else if (activeTab === 'parciales') {
      result = result.filter((i) => !i.isExtra && i.status === 'parcial');
    } else if (activeTab === 'observados') {
      result = result.filter((i) => i.isExtra || i.status === 'observado' || i.status === 'extra');
    } else if (activeTab === 'completos') {
      result = result.filter((i) => !i.isExtra && i.status === 'completo');
    }

    // 2. Multi-token search filter (debounced)
    const query = debouncedSearchQuery.trim().toLowerCase();
    if (query) {
      const tokens = query.split(/\s+/).filter(Boolean);
      result = result.filter((item) => {
        const searchable = `${item.itemCode} ${item.description} ${item.lineId} ${item.observations} ${item.unitName}`.toLowerCase();
        return tokens.every((token) => searchable.includes(token));
      });
    }

    return result;
  }, [items, activeTab, debouncedSearchQuery]);

  // Actions
  const handleQuickComplete = async (itemId: string) => {
    await setItemToExpectedQuantity(itemId);
  };

  const handleSetManualComplete = async (itemId: string, completed: boolean) => {
    await setItemManualComplete(itemId, completed);
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
    await addItemCount(
      activeAddCountItem.id,
      amountToAdd,
      rawInput,
      unitUsed,
      boxTag,
      isLooseUnit,
      manualFactor
    );
  };

  const handleUndoLast = async (itemId: string) => {
    await undoLastPartialCount(itemId);
  };

  const handleIncidentSave = async (incidentType: IncidentType, observations: string) => {
    if (!activeIncidentItem) return;
    await updateItemIncident(activeIncidentItem.id, incidentType, observations);
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
    await addExtraItem(receptionId, data);
    setActiveTab('observados');
    setSearchQuery('');
  };

  const handleConfirmClose = async (notes?: string, autoMarkMissing?: boolean) => {
    await closeReception(receptionId, notes, autoMarkMissing);
    setIsCloseModalOpen(false);
    setIsSummaryModalOpen(true);
  };

  const handleReopen = async () => {
    await reopenReception(receptionId);
  };

  if (!reception || !items) {
    return (
      <div className="p-8 text-center text-[#8E8E93] text-xs">
        Cargando datos de la recepción...
      </div>
    );
  }

  const isClosed = reception.status === 'cerrada';

  return (
    <div className="min-h-screen bg-[#F2F2F7] flex flex-col pb-24">
      {/* Unified Single Sticky Header */}
      <ReceptionHeaderSticky
        reception={reception}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        tabsCount={tabsCount}
        onOpenCloseModal={() => setIsCloseModalOpen(true)}
        onOpenSummaryModal={() => setIsSummaryModalOpen(true)}
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
                  : activeTab === 'pendientes'
                  ? '¡Genial! No quedan productos pendientes en esta vista.'
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

        {/* List of Product Cards (Compact iOS Style, showing 3-4 cards per screen) */}
        {filteredItems.map((item) => (
          <ProductCard
            key={item.id}
            item={item}
            isClosed={isClosed}
            onQuickComplete={handleQuickComplete}
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
    </div>
  );
};
