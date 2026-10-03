import React, { useMemo, useState } from 'react';
import { Transaction, TransactionType } from '../../types/transaction';
import { TransactionItem } from './TransactionItem';
import { TransactionFilters } from './TransactionFilters';
import { Receipt } from 'lucide-react';
import { DEFAULT_EXPENSE_CATEGORIES } from '../../config/categories';

interface TransactionListViewProps {
  transactions: Transaction[];
  onSelectTx: (tx: Transaction) => void;
  selectedType: TransactionType | 'all';
  setSelectedType: (type: TransactionType | 'all') => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedMonth: string;
  setSelectedMonth: (month: string) => void;
  categories?: string[];
  isMasked?: boolean;
}

export const TransactionListView: React.FC<TransactionListViewProps> = ({
  transactions,
  onSelectTx,
  selectedType,
  setSelectedType,
  searchQuery,
  setSearchQuery,
  selectedMonth,
  setSelectedMonth,
  categories = DEFAULT_EXPENSE_CATEGORIES,
  isMasked = false,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Available months extracted from transactions
  const availableMonths = useMemo(() => {
    const set = new Set<string>();
    transactions.forEach((tx) => {
      if (tx.date && tx.date.length >= 7) {
        set.add(tx.date.slice(0, 7));
      }
    });
    return Array.from(set).sort().reverse();
  }, [transactions]);

  // Filter transactions
  const filtered = useMemo(() => {
    return transactions.filter((tx) => {
      // Type match
      if (selectedType !== 'all' && tx.type !== selectedType) {
        return false;
      }
      // Month match
      if (selectedMonth !== 'all' && !tx.date.startsWith(selectedMonth)) {
        return false;
      }
      // Category match (if selected and type is out or all)
      if (selectedCategory !== 'all') {
        if (tx.type === 'out') {
          const cat = tx.category?.trim() || 'อื่นๆ';
          if (cat !== selectedCategory) return false;
        } else {
          return false;
        }
      }
      // Search match
      if (searchQuery.trim()) {
        const query = searchQuery.trim().toLowerCase();
        const whoMatch = tx.who.toLowerCase().includes(query);
        const noteMatch = tx.note.toLowerCase().includes(query);
        const refMatch = tx.refNo?.toLowerCase().includes(query);
        const catMatch = tx.category?.toLowerCase().includes(query);
        if (!whoMatch && !noteMatch && !refMatch && !catMatch) return false;
      }
      return true;
    });
  }, [transactions, selectedType, selectedMonth, selectedCategory, searchQuery]);

  return (
    <div className="space-y-4">
      {/* Filters Card */}
      <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-3xl p-5 shadow-lg shadow-emerald-950/5 dark:shadow-none space-y-3.5">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
            ตัวกรองและค้นหา
          </span>
          <span className="text-xs text-neutral-500 font-medium">
            พบ {filtered.length} จาก {transactions.length} รายการ
          </span>
        </div>
        <TransactionFilters
          selectedType={selectedType}
          onTypeChange={setSelectedType}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedMonth={selectedMonth}
          onMonthChange={setSelectedMonth}
          availableMonths={availableMonths}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          categories={categories}
        />
      </div>

      {/* Transactions List */}
      {filtered.length === 0 ? (
        <div className="py-12 text-center text-xs text-neutral-500 dark:text-neutral-400 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-3xl flex flex-col items-center gap-2">
          <Receipt size={28} strokeWidth={1.5} className="text-neutral-400" />
          <span>ไม่พบรายการที่ตรงกับเงื่อนไข</span>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((tx) => (
            <TransactionItem
              key={tx.id}
              transaction={tx}
              onClick={onSelectTx}
              isMasked={isMasked}
            />
          ))}
        </div>
      )}
    </div>
  );
};
