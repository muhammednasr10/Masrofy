"use client";

import { useCallback, useState } from "react";
import {
  emptyInvestmentForm,
  investmentToForm,
  type InvestmentFormState,
} from "@/components/investments/InvestmentFormFields";
import {
  emptyInvestmentProfitForm,
  type InvestmentProfitFormState,
} from "@/components/investments/InvestmentProfitModal";
import {
  emptyInvestmentValueForm,
  type InvestmentValueFormState,
} from "@/components/investments/InvestmentValueModal";
import type { Investment } from "@/lib/types/database";

export function useInvestmentModals(clearFeedback: () => void) {
  const [addForm, setAddForm] = useState<InvestmentFormState>(emptyInvestmentForm());
  const [editForm, setEditForm] = useState<InvestmentFormState | null>(null);
  const [profitForm, setProfitForm] = useState<InvestmentProfitFormState>(
    emptyInvestmentProfitForm(),
  );
  const [valueForm, setValueForm] = useState<InvestmentValueFormState | null>(null);
  const [editingInvestmentId, setEditingInvestmentId] = useState<string | null>(null);
  const [profitInvestmentId, setProfitInvestmentId] = useState<string | null>(null);
  const [valueInvestmentId, setValueInvestmentId] = useState<string | null>(null);
  const [historyInvestmentId, setHistoryInvestmentId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const openAddModal = useCallback(() => {
    setAddForm(emptyInvestmentForm());
    setShowAddModal(true);
    clearFeedback();
  }, [clearFeedback]);

  const closeAddModal = useCallback(() => {
    setShowAddModal(false);
    setAddForm(emptyInvestmentForm());
  }, []);

  const openEditModal = useCallback(
    (investment: Investment) => {
      setEditingInvestmentId(investment.id);
      setEditForm(investmentToForm(investment));
      clearFeedback();
    },
    [clearFeedback],
  );

  const closeEditModal = useCallback(() => {
    setEditingInvestmentId(null);
    setEditForm(null);
  }, []);

  const openProfitModal = useCallback(
    (investment: Investment) => {
      setProfitInvestmentId(investment.id);
      setProfitForm(emptyInvestmentProfitForm());
      clearFeedback();
    },
    [clearFeedback],
  );

  const closeProfitModal = useCallback(() => {
    setProfitInvestmentId(null);
    setProfitForm(emptyInvestmentProfitForm());
  }, []);

  const openValueModal = useCallback(
    (investment: Investment) => {
      setValueInvestmentId(investment.id);
      setValueForm(emptyInvestmentValueForm(investment));
      clearFeedback();
    },
    [clearFeedback],
  );

  const closeValueModal = useCallback(() => {
    setValueInvestmentId(null);
    setValueForm(null);
  }, []);

  const openHistoryModal = useCallback(
    (investment: Investment) => {
      clearFeedback();
      setHistoryInvestmentId(investment.id);
    },
    [clearFeedback],
  );

  const closeHistoryModal = useCallback(() => {
    setHistoryInvestmentId(null);
  }, []);

  return {
    addForm,
    editForm,
    profitForm,
    valueForm,
    editingInvestmentId,
    profitInvestmentId,
    valueInvestmentId,
    historyInvestmentId,
    showAddModal,
    setAddForm,
    setEditForm,
    setProfitForm,
    setValueForm,
    openAddModal,
    closeAddModal,
    openEditModal,
    closeEditModal,
    openProfitModal,
    closeProfitModal,
    openValueModal,
    closeValueModal,
    openHistoryModal,
    closeHistoryModal,
  };
}
