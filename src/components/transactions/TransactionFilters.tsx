import React from 'react';
import { TransactionType } from '../../types/transaction';
import { Search, Calendar, Tag } from 'lucide-react';
import { DEFAULT_EXPENSE_CATEGORIES } from '../../config/categories';
import { getCategoryEmoji } from '../../config/emojis';

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
  const types: { key: TransactionType | 'all'; label: string; code: string }[] = [
    { key: 'all', label: 'ทั้งหมด', code: 'ALL' },
    { key: 'in', label: 'ฝากเข้า', code: 'IN' },
    { key: 'out', label: 'รายจ่าย', code: 'OUT' },
    { key: 'lend', label: 'ให้ยืม', code: 'LEND' },
    { key: 'back', label: 'คืนเงิน', code: 'RECV' },
  ];

  return (
    <div className="space-y-2.5">
      {/* Search Input, Month & Category Selectors */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[160px]">
          <Search size={14} strokeWidth={2} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="ค้นหาชื่อ หรือบันทึก..."
            className="w-full pl-8 pr-3 py-2 bg-surface-light dark:bg-surface-dark border-2 border-[#242A20] dark:border-[#3C4A38] rounded-xl text-xs text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-500 shadow-[1.5px_1.5px_0px_#242A20] focus:outline-none"
          />
        </div>

        {/* Month Dropdown */}
        <div className="relative shrink-0">
          <select
            value={selectedMonth}
            onChange={(e) => onMonthChange(e.target.value)}
            className="appearance-none pl-7 pr-6 py-2 bg-surface-light dark:bg-surface-dark border-2 border-[#242A20] dark:border-[#3C4A38] rounded-xl text-xs font-semibold text-neutral-800 dark:text-neutral-200 shadow-[1.5px_1.5px_0px_#242A20] focus:outline-none cursor-pointer"
          >
            <option value="all">ALL MONTH</option>
            {availableMonths.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
          <Calendar size={13} strokeWidth={2} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-500 pointer-events-none" />
        </div>

        {/* Category Dropdown (Shown for all or out) */}
        {(selectedType === 'all' || selectedType === 'out') && (
          <div className="relative shrink-0">
            <select
              value={selectedCategory}
              onChange={(e) => onCategoryChange(e.target.value)}
              className="appearance-none pl-7 pr-6 py-2 bg-surface-light dark:bg-surface-dark border-2 border-[#242A20] dark:border-[#3C4A38] rounded-xl text-xs font-semibold text-neutral-800 dark:text-neutral-200 shadow-[1.5px_1.5px_0px_#242A20] focus:outline-none cursor-pointer"
            >
              <option value="all">ALL CATEGORIES</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {getCategoryEmoji(c)} {c}
                </option>
              ))}
            </select>
            <Tag size={12} strokeWidth={2} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-500 pointer-events-none" />
          </div>
        )}
      </div>

      {/* Type Filter Pills (Horizontal scrollable with Game Boy buttons) */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
        {types.map((t) => {
          const isActive = selectedType === t.key;
          return (
            <button
              key={t.key}
              onClick={() => onTypeChange(t.key)}
              className={`min-h-[32px] px-3 text-xs font-bold rounded-lg transition-all shrink-0 border-2 border-[#242A20] dark:border-[#3C4A38] active:translate-x-[1px] active:translate-y-[1px] ${
                isActive
                  ? 'bg-[#8B1E43] text-white shadow-[2px_2px_0px_#242A20] dark:shadow-[2px_2px_0px_#0A0F0A]'
                  : 'bg-surfaceElevated-light dark:bg-surfaceElevated-dark text-neutral-700 dark:text-neutral-300 shadow-[1.5px_1.5px_0px_#242A20] hover:bg-neutral-200 dark:hover:bg-neutral-800'
              }`}
            >
              {t.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};
