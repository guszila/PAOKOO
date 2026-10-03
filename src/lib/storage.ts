import { Transaction } from '../types/transaction';
import { DEFAULT_EXPENSE_CATEGORIES, MAX_CATEGORIES } from '../config/categories';

const STORAGE_KEYS = {
  TRANSACTIONS: 'paokoo_local_transactions',
  MEMBERS: 'paokoo_local_members',
  THEME: 'paokoo_theme',
  CATEGORIES: 'paokoo_categories',
  HIDE_AMOUNTS: 'paokoo_hide_amounts',
};

const DEFAULT_MEMBERS = ['บีม', 'กิ๊ฟ'];

const DEFAULT_TRANSACTIONS: Transaction[] = [
  {
    id: 'tx-sample-1',
    type: 'in',
    amount: 1500000, // 15,000.00 THB
    who: 'บีม',
    note: 'เงินเดือนโอนเข้ากองกลาง',
    date: new Date().toISOString().slice(0, 7) + '-01',
    createdAt: new Date().toISOString(),
    createdBy: 'บีม',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'tx-sample-2',
    type: 'in',
    amount: 1500000, // 15,000.00 THB
    who: 'กิ๊ฟ',
    note: 'เงินเดือนโอนเข้ากองกลาง',
    date: new Date().toISOString().slice(0, 7) + '-01',
    createdAt: new Date().toISOString(),
    createdBy: 'กิ๊ฟ',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'tx-sample-3',
    type: 'out',
    amount: 245075, // 2,450.75 THB
    who: 'กิ๊ฟ',
    note: 'ซื้อของสดและของใช้เข้าบ้าน',
    category: 'ของใช้',
    date: new Date().toISOString().slice(0, 7) + '-03',
    createdAt: new Date().toISOString(),
    createdBy: 'กิ๊ฟ',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'tx-sample-4',
    type: 'lend',
    amount: 150000, // 1,500.00 THB
    who: 'สมชาย',
    note: 'สำรองจ่ายค่าอะไหล่รถให้ก่อน',
    date: new Date().toISOString().slice(0, 7) + '-05',
    createdAt: new Date().toISOString(),
    createdBy: 'บีม',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'tx-sample-5',
    type: 'lend',
    amount: 60000, // 600.00 THB
    who: 'พี่นก',
    note: 'จ่ายค่าตั๋วหนังล่วงหน้า',
    date: new Date().toISOString().slice(0, 7) + '-06',
    createdAt: new Date().toISOString(),
    createdBy: 'บีม',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'tx-sample-6',
    type: 'back',
    amount: 50000, // 500.00 THB
    who: 'สมชาย',
    note: 'สมชายโอนคืนรอบแรก',
    date: new Date().toISOString().slice(0, 7) + '-08',
    createdAt: new Date().toISOString(),
    createdBy: 'บีม',
    updatedAt: new Date().toISOString(),
  },
];

export function getLocalTransactions(): Transaction[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
    if (!raw) {
      saveLocalTransactions(DEFAULT_TRANSACTIONS);
      return DEFAULT_TRANSACTIONS;
    }
    const parsed: Transaction[] = JSON.parse(raw);
    // Safe migration: ensure any old expenses without category default gracefully
    return parsed.map((tx) => ({
      ...tx,
      category: tx.type === 'out' ? (tx.category || 'อื่นๆ') : undefined,
    }));
  } catch (e) {
    console.error('Error reading transactions from localStorage:', e);
    return DEFAULT_TRANSACTIONS;
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
    return JSON.parse(raw);
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
