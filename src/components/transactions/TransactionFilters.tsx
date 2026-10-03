import React from 'react';
import { TransactionType } from '../../types/transaction';
import { Search, Calendar, Tag } from 'lucide-react';
import { DEFAULT_EXPENSE_CATEGORIES } from '../../config/categories';

interface TransactionFiltersProps {
  selectedType: TransactionType | 'all';
  onTypeChange: (type: TransactionType | 'all') => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedMonth: string; // YYYY-MM or 'all'
  onMonthChange: (month: string) => void;
  availableMonths: string[];
  selectedCategory: string; // 'all' or category name
  onCategoryChange: (category: string) => void;
  categories?: string[];
}

export const TransactionFilters: React.FC<TransactionFiltersProps> = ({
  selectedType,
  onTypeChange,
  searchQuery,
  onSearchChange,
  selectedMonth,
  onMonthChange,
  availableMonths,
  selectedCategory,
  onCategoryChange,
  categories = DEFAULT_EXPENSE_CATEGORIES,
}) => {
  const types: { key: TransactionType | 'all'; label: string }[] = [
    { key: 'all', label: 'ทั้งหมด' },
    { key: 'in', label: 'ฝากเข้า' },
    { key: 'out', label: 'รายจ่าย' },
    { key: 'lend', label: 'ให้ยืม' },
    { key: 'back', label: 'คืนเงิน' },
  ];

  return (
    <div className="space-y-2.5">
      {/* Search Input, Month & Category Selectors */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[160px]">
          <Search size={15} strokeWidth={1.5} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="ค้นหาชื่อผู้ทำรายการ หรือบันทึก..."
            className="w-full pl-8 pr-3 py-2 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-xl text-xs text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-none focus:border-neutral-900 dark:focus:border-neutral-100"
          />
        </div>

        {/* Month Dropdown */}
        <div className="relative shrink-0">
          <select
            value={selectedMonth}
            onChange={(e) => onMonthChange(e.target.value)}
            className="appearance-none pl-7 pr-6 py-2 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-xl text-xs text-neutral-800 dark:text-neutral-200 focus:outline-none cursor-pointer"
          >
            <option value="all">ทุกเดือน</option>
            {availableMonths.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
          <Calendar size={13} strokeWidth={1.5} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
        </div>

        {/* Category Dropdown (Shown for all or out) */}
        {(selectedType === 'all' || selectedType === 'out') && (
          <div className="relative shrink-0">
            <select
              value={selectedCategory}
              onChange={(e) => onCategoryChange(e.target.value)}
              className="appearance-none pl-7 pr-6 py-2 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-xl text-xs text-neutral-800 dark:text-neutral-200 focus:outline-none cursor-pointer"
            >
              <option value="all">ทุกหมวดหมู่</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <Tag size={12} strokeWidth={1.5} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
          </div>
        )}
      </div>

      {/* Type Filter Pills (Horizontal scrollable) */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
        {types.map((t) => (
          <button
            key={t.key}
            onClick={() => onTypeChange(t.key)}
            className={`min-h-[34px] px-3.5 text-xs rounded-xl transition-all shrink-0 border ${
              selectedType === t.key
                ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 border-neutral-900 dark:border-white font-medium'
                : 'bg-surface-light dark:bg-surface-dark text-neutral-600 dark:text-neutral-400 border-border-light dark:border-border-dark hover:border-neutral-400'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
    </div>
  );
};
