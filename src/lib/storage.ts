import { Transaction } from '../types/transaction';
import { DEFAULT_EXPENSE_CATEGORIES, MAX_CATEGORIES } from '../config/categories';

const STORAGE_KEYS = {
  TRANSACTIONS: 'paokoo_local_transactions',
  MEMBERS: 'paokoo_local_members',
  THEME: 'paokoo_theme',
  CATEGORIES: 'paokoo_categories',
  HIDE_AMOUNTS: 'paokoo_hide_amounts',
};

const DEFAULT_MEMBERS = ['โฟกัส', 'ต้นหยง'];

export function getLocalTransactions(): Transaction[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
    if (!raw) {
      return [];
    }
    const parsed: Transaction[] = JSON.parse(raw);
    // Auto-clean any dummy test/sample transactions
    const cleaned = parsed.filter((tx) => !tx.id.startsWith('tx-sample-'));
    if (cleaned.length !== parsed.length) {
      saveLocalTransactions(cleaned);
    }
    // Safe migration: ensure any old expenses without category default gracefully
    return cleaned.map((tx) => ({
      ...tx,
      category: tx.type === 'out' ? (tx.category || 'อื่นๆ') : undefined,
    }));
  } catch (e) {
    console.error('Error reading transactions from localStorage:', e);
    return [];
  }
}

export function saveLocalTransactions(txs: Transaction[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(txs));
  } catch (e) {
    console.error('Error saving transactions to localStorage:', e);
  }
}

export function getLocalMembers(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.MEMBERS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify(DEFAULT_MEMBERS));
      return DEFAULT_MEMBERS;
    }
    const parsed: string[] = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      // Migrate old dummy placeholder names ('บีม', 'กิ๊ฟ') to actual names
      const m1 = parsed[0] === 'บีม' ? 'โฟกัส' : (parsed[0] || 'โฟกัส');
      const m2 = parsed[1] === 'กิ๊ฟ' ? 'ต้นหยง' : (parsed[1] || 'ต้นหยง');
      const updated = [m1, m2];
      if (updated[0] !== parsed[0] || updated[1] !== parsed[1]) {
        localStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify(updated));
      }
      return updated;
    }
    return DEFAULT_MEMBERS;
  } catch (e) {
    return DEFAULT_MEMBERS;
  }
}

export function saveLocalMembers(members: string[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify(members));
  } catch (e) {
    console.error('Error saving members to localStorage:', e);
  }
}

export function getLocalCategories(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(DEFAULT_EXPENSE_CATEGORIES));
      return DEFAULT_EXPENSE_CATEGORIES;
    }
    const list: string[] = JSON.parse(raw);
    return Array.isArray(list) && list.length > 0 ? list.slice(0, MAX_CATEGORIES) : DEFAULT_EXPENSE_CATEGORIES;
  } catch (e) {
    return DEFAULT_EXPENSE_CATEGORIES;
  }
}

export function saveLocalCategories(cats: string[]): void {
  try {
    const trimmed = cats.map(c => c.trim()).filter(Boolean).slice(0, MAX_CATEGORIES);
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(trimmed));
  } catch (e) {
    console.error('Error saving categories to localStorage:', e);
  }
}

export function getLocalHideAmounts(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEYS.HIDE_AMOUNTS) === 'true';
  } catch (e) {
    return false;
  }
}

export function saveLocalHideAmounts(hide: boolean): void {
  try {
    localStorage.setItem(STORAGE_KEYS.HIDE_AMOUNTS, hide ? 'true' : 'false');
  } catch (e) {
    console.error('Error saving hide-amounts:', e);
  }
}
