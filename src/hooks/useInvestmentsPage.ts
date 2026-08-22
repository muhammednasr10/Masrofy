"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { emptyInvestmentProfitForm } from "@/components/investments/InvestmentProfitModal";
import { useInvestmentModals } from "@/hooks/useInvestmentModals";
import { useInvestmentMutations } from "@/hooks/useInvestmentMutations";
import { useInvestmentsDerivedData } from "@/hooks/useInvestmentsDerivedData";
import { usePageFeedback } from "@/hooks/usePageFeedback";
import type { Investment, InvestmentProfitEntry, InvestmentUpdate } from "@/lib/types/database";
import { loadInvestmentPageData } from "@/lib/investments";

export function useInvestmentsPage() {
  const { error, message, setError, setMessage, clearFeedback } = usePageFeedback();

  const [investments, setInvestments] = useState<Investment[]>([]);
  const [profitEntriesByInvestment, setProfitEntriesByInvestment] = useState<
    Record<string, InvestmentProfitEntry[]>
  >({});
  const [valueUpdatesByInvestment, setValueUpdatesByInvestment] = useState<
    Record<string, InvestmentUpdate[]>
  >({});
  const [currency, setCurrency] = useState("EGP");
  const [loading, setLoading] = useState(true);

  const modals = useInvestmentModals(clearFeedback);

  const derived = useInvestmentsDerivedData(
    investments,
    profitEntriesByInvestment,
    valueUpdatesByInvestment,
    modals.profitInvestmentId,
    modals.valueInvestmentId,
    modals.historyInvestmentId,
  );

  const loadData = useCallback(async () => {
    const supabase = createClient();
    const data = await loadInvestmentPageData(supabase);

    if (data.error) {
      setError(data.error);
    }

    setCurrency(data.currency);
    setInvestments(data.investments);
    setProfitEntriesByInvestment(data.profitEntriesByInvestment);
    setValueUpdatesByInvestment(data.valueUpdatesByInvestment);
    setLoading(false);
  }, [setError]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const mutations = useInvestmentMutations({
    investments,
    setInvestments,
    profitEntriesByInvestment,
    setProfitEntriesByInvestment,
    valueUpdatesByInvestment,
    setValueUpdatesByInvestment,
    addForm: modals.addForm,
    editForm: modals.editForm,
    profitForm: modals.profitForm,
    valueForm: modals.valueForm,
    editingInvestmentId: modals.editingInvestmentId,
    profitInvestmentId: modals.profitInvestmentId,
    valueInvestmentId: modals.valueInvestmentId,
    profitInvestment: derived.profitInvestment,
    valueInvestment: derived.valueInvestment,
    profitEntries: derived.profitEntries,
    closeAddModal: modals.closeAddModal,
    closeEditModal: modals.closeEditModal,
    closeProfitModal: modals.closeProfitModal,
    closeValueModal: modals.closeValueModal,
    resetProfitForm: () => modals.setProfitForm(emptyInvestmentProfitForm()),
    loadData,
    setError,
    setMessage,
    clearFeedback,
  });

  return {
    loading,
    currency,
    investments,
    summary: derived.summary,
    addForm: modals.addForm,
    editForm: modals.editForm,
    profitForm: modals.profitForm,
    valueForm: modals.valueForm,
    profitInvestment: derived.profitInvestment,
    valueInvestment: derived.valueInvestment,
    historyInvestment: derived.historyInvestment,
    historyUpdates: derived.historyUpdates,
    profitEntries: derived.profitEntries,
    editingInvestmentId: modals.editingInvestmentId,
    profitInvestmentId: modals.profitInvestmentId,
    valueInvestmentId: modals.valueInvestmentId,
    historyInvestmentId: modals.historyInvestmentId,
    showAddModal: modals.showAddModal,
    adding: mutations.adding,
    savingEdit: mutations.savingEdit,
    savingProfit: mutations.savingProfit,
    savingValue: mutations.savingValue,
    reorderingId: mutations.reorderingId,
    error,
    message,
    profitEntriesByInvestment,
    valueUpdatesByInvestment,
    setAddForm: modals.setAddForm,
    setEditForm: modals.setEditForm,
    setProfitForm: modals.setProfitForm,
    setValueForm: modals.setValueForm,
    openAddModal: modals.openAddModal,
    closeAddModal: modals.closeAddModal,
    openEditModal: modals.openEditModal,
    closeEditModal: modals.closeEditModal,
    openProfitModal: modals.openProfitModal,
    closeProfitModal: modals.closeProfitModal,
    openValueModal: modals.openValueModal,
    closeValueModal: modals.closeValueModal,
    openHistoryModal: modals.openHistoryModal,
    closeHistoryModal: modals.closeHistoryModal,
    handleAddSubmit: mutations.handleAddSubmit,
    handleEditSubmit: mutations.handleEditSubmit,
    handleProfitSubmit: mutations.handleProfitSubmit,
    handleValueSubmit: mutations.handleValueSubmit,
    handleDeleteProfitEntry: mutations.handleDeleteProfitEntry,
    handleMoveInvestment: mutations.handleMoveInvestment,
    handleDelete: mutations.handleDelete,
  };
}
