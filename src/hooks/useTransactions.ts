import { useState, useEffect, useMemo, useCallback } from 'react';
import { Transaction } from '../types/transaction';
import {
  getLocalTransactions,
  saveLocalTransactions,
  getLocalMembers,
  saveLocalMembers,
  getLocalCategories,
  saveLocalCategories,
  getLocalHideAmounts,
  saveLocalHideAmounts,
  getLocalPockets,
  saveLocalPockets,
} from '../lib/storage';
import { Pocket } from '../types/pocket';
import { calculateSummary, sortTransactionsChronological } from '../lib/summary';
import { MAX_CATEGORIES } from '../config/categories';

export function useTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>(() => getLocalTransactions());
  const [members, setMembers] = useState<string[]>(() => getLocalMembers());
  const [categories, setCategories] = useState<string[]>(() => getLocalCategories());
  const [pockets, setPockets] = useState<Pocket[]>(() => getLocalPockets());
  const [isMasked, setIsMasked] = useState<boolean>(() => getLocalHideAmounts());

  // Save to localStorage whenever transactions change
  useEffect(() => {
    saveLocalTransactions(transactions);
  }, [transactions]);

  // Save to localStorage whenever members change
  useEffect(() => {
    saveLocalMembers(members);
  }, [members]);

  // Save to localStorage whenever categories change
  useEffect(() => {
    saveLocalCategories(categories);
  }, [categories]);

  // Save to localStorage whenever pockets change
  useEffect(() => {
    saveLocalPockets(pockets);
  }, [pockets]);

  // Save to localStorage whenever isMasked changes
  useEffect(() => {
    saveLocalHideAmounts(isMasked);
  }, [isMasked]);

  const toggleMask = useCallback(() => {
    setIsMasked((prev) => !prev);
  }, []);

  // Calculate live financial summary
  const summary = useMemo(() => {
    return calculateSummary(transactions);
  }, [transactions]);

  const addTransaction = useCallback((txData: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString();
    const newTx: Transaction = {
      ...txData,
      id: `tx-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      createdAt: now,
      updatedAt: now,
    };

    setTransactions((prev) => sortTransactionsChronological([newTx, ...prev]));
    return newTx;
  }, []);

  const updateTransaction = useCallback((id: string, updates: Partial<Omit<Transaction, 'id' | 'createdAt'>>) => {
    const now = new Date().toISOString();
    setTransactions((prev) =>
      sortTransactionsChronological(
        prev.map((t) => (t.id === id ? { ...t, ...updates, updatedAt: now } : t))
      )
    );
  }, []);

  const deleteTransaction = useCallback((id: string) => {
    setTransactions((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addCategory = useCallback((newCat: string) => {
    const trimmed = newCat.trim();
    if (!trimmed) return;
    setCategories((prev) => {
      if (prev.includes(trimmed) || prev.length >= MAX_CATEGORIES) return prev;
      return [...prev, trimmed];
    });
  }, []);

  const deleteCategory = useCallback((catToDelete: string) => {
    setCategories((prev) => {
      if (prev.length <= 1) return prev; // Keep at least 1
      return prev.filter((c) => c !== catToDelete);
    });
  }, []);

  const importData = useCallback((importedTxs: Transaction[], newMembers?: string[], newCategories?: string[]) => {
    setTransactions(sortTransactionsChronological(importedTxs));
    if (newMembers && newMembers.length > 0) {
      setMembers(newMembers);
    }
    if (newCategories && newCategories.length > 0) {
      setCategories(newCategories.slice(0, MAX_CATEGORIES));
    }
  }, []);

  const resetData = useCallback(() => {
    localStorage.removeItem('paokoo_local_transactions');
    localStorage.removeItem('paokoo_categories');
    setTransactions(getLocalTransactions());
    setCategories(getLocalCategories());
  }, []);

  const addPocket = useCallback((name: string, allocatedSatang: number, color?: string, icon?: string) => {
    const now = new Date().toISOString();
    const newPocket: Pocket = {
      id: `pocket-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: name.trim() || 'เงินแบ่งใช้',
      allocatedSatang: Math.max(0, Math.round(allocatedSatang)),
      color: color || '#10B981',
      icon: icon || 'wallet',
      createdAt: now,
      updatedAt: now,
    };
    setPockets((prev) => [...prev, newPocket]);
    return newPocket;
  }, []);

  const updatePocket = useCallback((id: string, updates: Partial<Omit<Pocket, 'id' | 'createdAt'>>) => {
    const now = new Date().toISOString();
    setPockets((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updates, updatedAt: now } : p))
    );
  }, []);

  const deletePocket = useCallback((id: string) => {
    setPockets((prev) => prev.filter((p) => p.id !== id));
  }, []);

  return {
    transactions,
    members,
    setMembers,
    categories,
    setCategories,
    addCategory,
    deleteCategory,
    pockets,
    setPockets,
    addPocket,
    updatePocket,
    deletePocket,
    isMasked,
    toggleMask,
    summary,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    importData,
    resetData,
  };
}
