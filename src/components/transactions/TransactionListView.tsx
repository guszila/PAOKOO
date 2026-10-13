import React, { useMemo, useState } from 'react';
import { Transaction, TransactionType } from '../../types/transaction';
import { Pocket } from '../../types/pocket';
import { TransactionItem } from './TransactionItem';
import { TransactionFilters } from './TransactionFilters';
import { Receipt } from 'lucide-react';
import { DEFAULT_EXPENSE_CATEGORIES } from '../../config/categories';
import { formatSatang } from '../../lib/money';
import { formatThaiFullDate } from '../../lib/calendar';

const THAI_DAYS = ['วันอาทิตย์', 'วันจันทร์', 'วันอังคาร', 'วันพุธ', 'วันพฤหัสบดี', 'วันศุกร์', 'วันเสาร์'];

function getDayHeaderMeta(dateStr: string) {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const todayStr = `${yyyy}-${mm}-${dd}`;

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const yY = yesterday.getFullYear();
  const yM = String(yesterday.getMonth() + 1).padStart(2, '0');
  const yD = String(yesterday.getDate()).padStart(2, '0');
  const yesterdayStr = `${yY}-${yM}-${yD}`;

  if (dateStr === todayStr) {
    return {
      badge: 'วันนี้',
      sublabel: '',
      isToday: true,
      formattedDate: formatThaiFullDate(dateStr),
    };
  }

  if (dateStr === yesterdayStr) {
    return {
      badge: 'เมื่อวาน',
      sublabel: '',
      isToday: false,
      formattedDate: formatThaiFullDate(dateStr),
    };
  }

  const parts = dateStr.split('-').map(Number);
  let dayName = '';
  if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
    const dt = new Date(parts[0], parts[1] - 1, parts[2]);
    dayName = THAI_DAYS[dt.getDay()] || '';
  }

  return {
    badge: dayName || dateStr,
    sublabel: '',
    isToday: false,
    formattedDate: formatThaiFullDate(dateStr),
  };
}

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
  pockets?: Pocket[];
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
  pockets = [],
  isMasked = false,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const pocketMap = useMemo(() => {
    const map = new Map<string, string>();
    pockets.forEach((p) => map.set(p.id, p.name));
    return map;
  }, [pockets]);

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
        const pocketName = tx.pocketId ? pocketMap.get(tx.pocketId) : undefined;
        const pocketMatch = pocketName?.toLowerCase().includes(query);
        if (!whoMatch && !noteMatch && !refMatch && !catMatch && !pocketMatch) return false;
      }
      return true;
    });
  }, [transactions, selectedType, selectedMonth, selectedCategory, searchQuery, pocketMap]);

  // Group filtered transactions by date (preserving sorted order)
  const groupedTransactions = useMemo(() => {
    const groupMap = new Map<
      string,
      {
        dateStr: string;
        items: Transaction[];
        netSatang: number;
      }
    >();

    filtered.forEach((tx) => {
      const d = tx.date || 'ไม่ระบุวันที่';
      let g = groupMap.get(d);
      if (!g) {
        g = { dateStr: d, items: [], netSatang: 0 };
        groupMap.set(d, g);
      }
      g.items.push(tx);
      if (tx.type === 'in' || tx.type === 'back') {
        g.netSatang += tx.amount;
      } else {
        g.netSatang -= tx.amount;
      }
    });

    return Array.from(groupMap.values());
  }, [filtered]);

  return (
    <div className="space-y-4">
      {/* Filters Card */}
      <div className="bg-surface-light dark:bg-surface-dark border-2 border-[#242A20] dark:border-[#3C4A38] rounded-2xl p-4 shadow-[3px_3px_0px_#242A20] dark:shadow-[3px_3px_0px_#0A0F0A] space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 bg-[#8B1E43] rounded-full" />
            <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200 tracking-wider">
              ค้นหาและคัดกรอง
            </span>
          </div>
          <span className="text-[10px] font-semibold text-neutral-600 dark:text-neutral-400">
            {filtered.length}/{transactions.length} รายการ
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

      {/* Transactions List Grouped by Date */}
      {groupedTransactions.length === 0 ? (
        <div className="py-10 text-center text-xs text-neutral-500 bg-surface-light dark:bg-surface-dark border-2 border-[#242A20] dark:border-[#3C4A38] rounded-2xl flex flex-col items-center gap-2 shadow-[2px_2px_0px_#242A20]">
          <Receipt size={24} strokeWidth={2} className="text-neutral-400" />
          <span className="text-xs font-bold text-neutral-500">ไม่พบรายการ</span>
        </div>
      ) : (
        <div className="space-y-5">
          {groupedTransactions.map((group) => {
            const meta = getDayHeaderMeta(group.dateStr);
            return (
              <div key={group.dateStr} className="space-y-2">
                {/* Date Group Header & Divider */}
                <div className="pt-1 pb-1.5 border-b-2 border-dashed border-[#242A20]/25 dark:border-[#3C4A38]/60">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      {/* Badge (TODAY, YESTERDAY, or Date) */}
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded border border-[#242A20] dark:border-[#3C4A38] shadow-[1px_1px_0px_#242A20] shrink-0 ${
                          meta.isToday
                            ? 'bg-[#9BBC0F] text-[#0F380F]'
                            : 'bg-[#242A20] text-[#9BBC0F] dark:bg-[#3C4A38] dark:text-[#9BBC0F]'
                        }`}
                      >
                        {meta.badge}
                      </span>

                      {/* Thai Date Label */}
                      <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200 truncate">
                        {meta.formattedDate}
                      </span>

                      {meta.sublabel && meta.sublabel !== 'วันนี้' && meta.sublabel !== 'เมื่อวาน' && (
                        <span className="text-[11px] text-neutral-500 font-medium shrink-0">
                          ({meta.sublabel})
                        </span>
                      )}

                      {/* Item Count */}
                      <span className="text-[10px] text-neutral-500 shrink-0">
                        · {group.items.length} รายการ
                      </span>
                    </div>

                    {/* Daily Net Badge */}
                    <div className="flex items-center gap-1 shrink-0 text-[11px] px-1.5 py-0.5 rounded bg-surface-light dark:bg-surface-dark border border-[#242A20] dark:border-[#3C4A38] shadow-[1px_1px_0px_#242A20]">
                      <span className="text-[9.5px] font-bold text-neutral-500">สุทธิ</span>
                      <span
                        className={`font-bold tabular-nums ${
                          group.netSatang >= 0
                            ? 'text-[#306230] dark:text-[#9BBC0F]'
                            : 'text-[#8B1E43] dark:text-red-400'
                        }`}
                      >
                        {isMasked
                          ? '••••'
                          : `${group.netSatang >= 0 ? '+' : ''}${formatSatang(group.netSatang)}฿`}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Day Items */}
                <div className="space-y-2">
                  {group.items.map((tx) => (
                    <TransactionItem
                      key={tx.id}
                      transaction={tx}
                      onClick={onSelectTx}
                      isMasked={isMasked}
                      pocketName={tx.pocketId ? pocketMap.get(tx.pocketId) : undefined}
                      hideDate={true}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
