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
} from '../lib/storage';
import { calculateSummary } from '../lib/summary';
import { MAX_CATEGORIES } from '../config/categories';

export function useTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>(() => getLocalTransactions());
  const [members, setMembers] = useState<string[]>(() => getLocalMembers());
  const [categories, setCategories] = useState<string[]>(() => getLocalCategories());
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

    setTransactions((prev) => [newTx, ...prev]);
    return newTx;
  }, []);

  const updateTransaction = useCallback((id: string, updates: Partial<Omit<Transaction, 'id' | 'createdAt'>>) => {
    const now = new Date().toISOString();
    setTransactions((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...updates, updatedAt: now } : t))
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
    setTransactions(importedTxs);
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

  return {
    transactions,
    members,
    setMembers,
    categories,
    setCategories,
    addCategory,
    deleteCategory,
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
