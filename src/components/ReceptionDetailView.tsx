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
  undoLastPartialCount,
  updateItemIncident,
  updateItemConversion,
  addExtraItem,
  closeReception,
  reopenReception,
} from '../db';

import { ReceptionHeaderSticky, type FilterTab } from './ReceptionHeaderSticky';
import { ProductCard } from './ProductCard';
import { AddCountSheet } from './AddCountSheet';
import { IncidentSheet } from './IncidentSheet';
import { ConversionModal } from './ConversionModal';
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

  const items = useLiveQuery(
    () => db.receptionItems.where('receptionId').equals(receptionId).toArray(),
    [receptionId]
  );

  // Search & Filtering state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeTab, setActiveTab] = useState<FilterTab>('todos');
  const [autoClearSearch, setAutoClearSearch] = useState<boolean>(() => {
    return localStorage.getItem('sunat_auto_clear_search') === 'true';
  });

  // Modals state
  const [activeAddCountItem, setActiveAddCountItem] = useState<ReceptionItem | null>(null);
  const [activeIncidentItem, setActiveIncidentItem] = useState<ReceptionItem | null>(null);
  const [activeConversionItem, setActiveConversionItem] = useState<ReceptionItem | null>(null);
  const [isExtraModalOpen, setIsExtraModalOpen] = useState<boolean>(false);
  const [isCloseModalOpen, setIsCloseModalOpen] = useState<boolean>(false);
  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState<boolean>(false);

  const handleToggleAutoClear = () => {
    const nextVal = !autoClearSearch;
    setAutoClearSearch(nextVal);
    localStorage.setItem('sunat_auto_clear_search', String(nextVal));
  };

  // Compute tab counts
  const tabsCount: FilterTabsCount = useMemo(() => {
    if (!items) {
      return { todos: 0, pendientes: 0, parciales: 0, observados: 0, completos: 0 };
    }

    let pendientes = 0;
    let parciales = 0;
    let observados = 0;
    let completos = 0;

    items.forEach((item) => {
      if (item.isExtra || item.incidentType !== 'ninguno' || item.receivedQuantity > item.expectedQuantity) {
        observados++;
      } else if (item.receivedQuantity <= 0) {
        pendientes++;
      } else if (item.receivedQuantity < item.expectedQuantity) {
        parciales++;
      } else if (item.receivedQuantity === item.expectedQuantity) {
        completos++;
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
    return items.every(
      (item) => item.isExtra || (item.receivedQuantity === item.expectedQuantity && item.incidentType === 'ninguno')
    );
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
  }, [isAllComplete, reception?.status]);

  // Multi-token search & tab filtering
  const filteredItems = useMemo(() => {
    if (!items) return [];

    let result = items;

    // 1. Tab filter
    if (activeTab === 'pendientes') {
      result = result.filter(
        (i) => !i.isExtra && i.receivedQuantity <= 0 && i.incidentType === 'ninguno'
      );
    } else if (activeTab === 'parciales') {
      result = result.filter(
        (i) => !i.isExtra && i.receivedQuantity > 0 && i.receivedQuantity < i.expectedQuantity && i.incidentType === 'ninguno'
      );
    } else if (activeTab === 'observados') {
      result = result.filter(
        (i) => i.isExtra || i.incidentType !== 'ninguno' || i.receivedQuantity > i.expectedQuantity
      );
    } else if (activeTab === 'completos') {
      result = result.filter(
        (i) => !i.isExtra && i.receivedQuantity === i.expectedQuantity && i.incidentType === 'ninguno'
      );
    }

    // 2. Multi-token search filter
    const query = searchQuery.trim().toLowerCase();
    if (query) {
      const tokens = query.split(/\s+/).filter(Boolean);
      result = result.filter((item) => {
        const searchable = `${item.itemCode} ${item.description} ${item.lineId} ${item.observations} ${item.unitName}`.toLowerCase();
        return tokens.every((token) => searchable.includes(token));
      });
    }

    return result;
  }, [items, activeTab, searchQuery]);

  // Actions
  const handleQuickComplete = async (itemId: string) => {
    await setItemToExpectedQuantity(itemId);
    if (autoClearSearch) {
      setSearchQuery('');
    }
  };

  const handleAddCountConfirm = async (
    baseUnitsToAdd: number,
    rawInput: number,
    unitUsed: string,
    boxTag?: string
  ) => {
    if (!activeAddCountItem) return;
    await addItemCount(activeAddCountItem.id, baseUnitsToAdd, rawInput, unitUsed, boxTag);
    if (autoClearSearch) {
      setSearchQuery('');
    }
  };

  const handleUndoLast = async (itemId: string) => {
    await undoLastPartialCount(itemId);
  };

  const handleIncidentSave = async (incidentType: IncidentType, observations: string) => {
    if (!activeIncidentItem) return;
    await updateItemIncident(activeIncidentItem.id, incidentType, observations);
  };

  const handleConversionSave = async (active: boolean, factor: number, targetUnit: string) => {
    if (!activeConversionItem) return;
    await updateItemConversion(activeConversionItem.id, active, factor, targetUnit);
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
      <div className="p-8 text-center text-slate-500 text-xs">
        Cargando datos de la recepción...
      </div>
    );
  }

  const isClosed = reception.status === 'cerrada';

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col pb-24">
      {/* Top Sticky Header */}
      <ReceptionHeaderSticky
        reception={reception}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        tabsCount={tabsCount}
        autoClearSearch={autoClearSearch}
        onToggleAutoClear={handleToggleAutoClear}
        onOpenCloseModal={() => setIsCloseModalOpen(true)}
        onOpenSummaryModal={() => setIsSummaryModalOpen(true)}
        onBack={onBack}
      />

      {/* Main Content Area */}
      <main className="max-w-2xl mx-auto w-full px-3 py-3.5 space-y-2.5 flex-1">
        {/* Closed Reception Banner */}
        {isClosed && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-emerald-950 text-xs">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-emerald-700" />
              <div>
                <strong className="block">Recepción cerrada formalmente</strong>
                <span className="text-[11px] text-emerald-700">
                  {reception.closedAt && new Date(reception.closedAt).toLocaleString('es-PE')}
                </span>
              </div>
            </div>
            <button
              onClick={() => setIsSummaryModalOpen(true)}
              className="px-2.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-lg text-xs"
            >
              Ver Reportes
            </button>
          </div>
        )}

        {/* Empty Search Result with Direct "Register Extra" Action */}
        {filteredItems.length === 0 && (
          <div className="bg-white border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center space-y-3 mt-2">
            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
              <AlertCircle className="w-5 h-5" />
            </div>

            <div>
              <h4 className="font-bold text-slate-800 text-sm">
                {searchQuery ? `No se encontró "${searchQuery}"` : 'No hay productos en este filtro'}
              </h4>
              <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                {searchQuery
                  ? '¿La mercadería llegó físicamente pero no está en la guía o factura del proveedor?'
                  : 'Cambia de pestaña o realiza una búsqueda para ver los productos.'}
              </p>
            </div>

            {searchQuery && !isClosed && (
              <button
                type="button"
                onClick={() => setIsExtraModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white font-bold rounded-xl text-xs shadow-md transition-transform active:scale-95"
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
            onQuickComplete={handleQuickComplete}
            onOpenAddCount={setActiveAddCountItem}
            onUndoLast={handleUndoLast}
            onOpenIncident={setActiveIncidentItem}
            onOpenConversion={setActiveConversionItem}
          />
        ))}
      </main>

      {/* Floating Action Button (+ Extra) in Bottom Right */}
      {!isClosed && (
        <div className="fixed bottom-5 right-4 z-30">
          <button
            type="button"
            onClick={() => setIsExtraModalOpen(true)}
            className="flex items-center gap-2 px-4 py-3 bg-purple-700 hover:bg-purple-800 active:bg-purple-900 text-white font-bold text-xs rounded-full shadow-xl transition-transform active:scale-90 border-2 border-purple-500/40 min-h-[48px]"
            title="Registrar producto extra no incluido en la guía"
          >
            <PackagePlus className="w-5 h-5" />
            <span className="font-black">+ Extra</span>
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

      <ConversionModal
        item={activeConversionItem}
        isOpen={Boolean(activeConversionItem)}
        onClose={() => setActiveConversionItem(null)}
        onSave={handleConversionSave}
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
