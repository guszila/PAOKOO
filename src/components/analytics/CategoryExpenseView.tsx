import React, { useState, useMemo } from 'react';
import { Transaction } from '../../types/transaction';
import { Pocket } from '../../types/pocket';
import { formatSatang } from '../../lib/money';
import { formatThaiFullDate } from '../../lib/calendar';
import { getCategoryColor } from '../../config/categories';
import { getCategoryEmoji } from '../../config/emojis';
import { ChevronDown, ChevronRight, TrendingUp, TrendingDown, Inbox } from 'lucide-react';

interface CategoryExpenseViewProps {
  transactions: Transaction[];
  yearMonth: string; // YYYY-MM
  isMasked?: boolean;
  pockets?: Pocket[];
  onSelectTx?: (tx: Transaction) => void;
}

interface CategoryGroup {
  id: string;
  name: string;
  emoji: string;
  color: string;
  totalSatang: number;
  percentage: number;
  txCount: number;
  transactions: Transaction[];
  // Geometry for SVG donut
  startAngle: number;
  endAngle: number;
  midAngle: number;
}

export const CategoryExpenseView: React.FC<CategoryExpenseViewProps> = ({
  transactions,
  yearMonth,
  isMasked = false,
  pockets = [],
  onSelectTx,
}) => {
  const [highlightedCatId, setHighlightedCatId] = useState<string | null>(null);
  const [expandedCatName, setExpandedCatName] = useState<string | null>(null);

  // Pocket map for name lookup
  const pocketMap = useMemo(() => {
    const map = new Map<string, string>();
    pockets.forEach((p) => map.set(p.id, p.name));
    return map;
  }, [pockets]);

  // Filter out expenses for selected month and group by category
  const { categoryGroups, totalSpentSatang, monthlyIncomeSatang } = useMemo(() => {
    let spent = 0;
    let income = 0;
    const groupMap = new Map<string, { total: number; txs: Transaction[] }>();

    transactions.forEach((tx) => {
      if (!tx.date || !tx.date.startsWith(yearMonth)) return;

      if (tx.type === 'in') {
        income += tx.amount;
      } else if (tx.type === 'out') {
        const amt = Math.round(tx.amount);
        if (amt <= 0) return;
        spent += amt;
        const cat = (tx.category && tx.category.trim()) ? tx.category.trim() : 'อื่นๆ';
        const existing = groupMap.get(cat) || { total: 0, txs: [] };
        existing.total += amt;
        existing.txs.push(tx);
        groupMap.set(cat, existing);
      }
    });

    // Sort categories descending by amount
    const sorted = Array.from(groupMap.entries()).sort((a, b) => b[1].total - a[1].total);

    // Compute angles and percentages for SVG donut
    let cumulativeAngle = -Math.PI / 2; // Start at 12 o'clock (-90 degrees)
    let runningPercentSum = 0;

    const groups: CategoryGroup[] = sorted.map(([catName, data], index) => {
      const isLast = index === sorted.length - 1;
      let pct = spent > 0 ? (data.total / spent) * 100 : 0;
      if (isLast && sorted.length > 1) {
        pct = Math.max(0, 100 - runningPercentSum);
      }
      runningPercentSum += pct;

      const angleSpan = spent > 0 ? (pct / 100) * 2 * Math.PI : 0;
      const startAngle = cumulativeAngle;
      const endAngle = cumulativeAngle + angleSpan;
      const midAngle = startAngle + angleSpan / 2;
      cumulativeAngle = endAngle;

      // Sort transactions inside category descending by date/time
      const sortedTxs = [...data.txs].sort((a, b) => {
        const da = a.date || '';
        const db = b.date || '';
        return db.localeCompare(da);
      });

      return {
        id: `cat-${catName}`,
        name: catName,
        emoji: getCategoryEmoji(catName),
        color: getCategoryColor(catName, index),
        totalSatang: data.total,
        percentage: pct,
        txCount: data.txs.length,
        transactions: sortedTxs,
        startAngle,
        endAngle,
        midAngle,
      };
    });

    return {
      categoryGroups: groups,
      totalSpentSatang: spent,
      monthlyIncomeSatang: income,
    };
  }, [transactions, yearMonth]);

  const isEmpty = categoryGroups.length === 0 || totalSpentSatang <= 0;

  // Donut SVG geometry constants
  const cx = 160;
  const cy = 160;
  const rOuter = 108;
  const rInner = 68;
  const rMid = (rOuter + rInner) / 2; // 88 for percentage text
  const rBadge = 132; // Floating bubble radius

  // Helper to generate SVG path for an annular sector
  const getSectorPath = (startAngle: number, endAngle: number) => {
    const xO1 = cx + rOuter * Math.cos(startAngle);
    const yO1 = cy + rOuter * Math.sin(startAngle);
    const xO2 = cx + rOuter * Math.cos(endAngle);
    const yO2 = cy + rOuter * Math.sin(endAngle);

    const xI2 = cx + rInner * Math.cos(endAngle);
    const yI2 = cy + rInner * Math.sin(endAngle);
    const xI1 = cx + rInner * Math.cos(startAngle);
    const yI1 = cy + rInner * Math.sin(startAngle);

    const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;

    return `M ${xO1} ${yO1} A ${rOuter} ${rOuter} 0 ${largeArc} 1 ${xO2} ${yO2} L ${xI2} ${yI2} A ${rInner} ${rInner} 0 ${largeArc} 0 ${xI1} ${yI1} Z`;
  };

  const handleToggleExpand = (name: string, id: string) => {
    setExpandedCatName((prev) => (prev === name ? null : name));
    setHighlightedCatId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="space-y-4">
      {/* Main Reference Card: Donut Hero + Category Details List */}
      <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-3xl p-4 sm:p-5 shadow-sm space-y-4">
        {/* Top Header Pill matching Image 2 */}
        <div className="flex items-center justify-between pb-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surfaceElevated-light dark:bg-surfaceElevated-dark border border-border-light dark:border-border-dark text-xs font-semibold text-neutral-800 dark:text-neutral-200 select-none shadow-xs">
            <span>ตามหมวดหมู่</span>
            <ChevronDown size={13} className="text-neutral-400" />
          </div>

          <div className="text-[11px] text-neutral-400">
            {categoryGroups.length > 0
              ? `${categoryGroups.length} หมวดหมู่`
              : 'ไม่มีรายการ'}
          </div>
        </div>

        {/* Hero Donut Chart matching Image 2 with percentage on arc & floating emoji badges */}
        <div className="relative w-full max-w-[310px] aspect-square mx-auto flex items-center justify-center">
          <svg viewBox="0 0 320 320" className="w-full h-full select-none overflow-visible">
            <defs>
              <filter id="badge-shadow" x="-30%" y="-30%" width="160%" height="160%">
                <feDropShadow dx="0" dy="2" stdDeviation="2.5" floodColor="#000000" floodOpacity="0.18" />
              </filter>
            </defs>

            {isEmpty ? (
              /* Empty state background ring */
              <circle
                cx={cx}
                cy={cy}
                r={rMid}
                fill="none"
                stroke="currentColor"
                strokeWidth={rOuter - rInner}
                className="text-neutral-200 dark:text-neutral-800"
              />
            ) : categoryGroups.length === 1 ? (
              /* Single category 100% full circle */
              (() => {
                const group = categoryGroups[0];
                const isHighlight = highlightedCatId === group.id;
                const badgeX = cx + rBadge * Math.cos(-Math.PI / 2);
                const badgeY = cy + rBadge * Math.sin(-Math.PI / 2);

                return (
                  <g>
                    <circle
                      cx={cx}
                      cy={cy}
                      r={rMid}
                      fill="none"
                      stroke={group.color}
                      strokeWidth={rOuter - rInner}
                      className="cursor-pointer transition-all duration-200"
                      onClick={() => handleToggleExpand(group.name, group.id)}
                    />
                    {/* 100% Text */}
                    <text
                      x={cx}
                      y={cy - rMid}
                      textAnchor="middle"
                      dominantBaseline="central"
                      className="fill-white font-bold text-xs"
                    >
                      100%
                    </text>
                    {/* Badge */}
                    <g
                      transform={`translate(${badgeX}, ${badgeY})`}
                      className="cursor-pointer transition-transform duration-200 hover:scale-110"
                      onClick={() => handleToggleExpand(group.name, group.id)}
                      filter="url(#badge-shadow)"
                    >
                      <circle
                        r="14"
                        fill="white"
                        className="dark:fill-neutral-900"
                        stroke={group.color}
                        strokeWidth={isHighlight ? '3.5' : '2.5'}
                      />
                      <text textAnchor="middle" dominantBaseline="central" fontSize="14" y="0.5">
                        {group.emoji}
                      </text>
                    </g>
                  </g>
                );
              })()
            ) : (
              /* Multiple categories sectors with arc percentage and floating emoji badges */
              categoryGroups.map((group) => {
                const isHighlight = highlightedCatId === group.id;
                const hasAnyHighlight = highlightedCatId !== null;
                const opacity = hasAnyHighlight ? (isHighlight ? 1 : 0.35) : 1;
                const path = getSectorPath(group.startAngle, group.endAngle);

                // Percentage text coords (center of arc)
                const textX = cx + rMid * Math.cos(group.midAngle);
                const textY = cy + rMid * Math.sin(group.midAngle);
                const showPercentage = group.percentage >= 4.5;

                // Floating Emoji Badge coords
                const badgeX = cx + rBadge * Math.cos(group.midAngle);
                const badgeY = cy + rBadge * Math.sin(group.midAngle);
                const showBadge = group.percentage >= 3.5 || categoryGroups.length <= 6;

                return (
                  <g key={group.id} style={{ opacity, transition: 'opacity 0.2s ease' }}>
                    {/* Arc Sector */}
                    <path
                      d={path}
                      fill={group.color}
                      stroke="var(--bg-surface, #ffffff)"
                      className="dark:stroke-neutral-900 cursor-pointer transition-transform duration-200"
                      strokeWidth="2"
                      onClick={() => handleToggleExpand(group.name, group.id)}
                    />

                    {/* Percentage on Arc (Like Image 2: 23%, 21%, etc.) */}
                    {showPercentage && (
                      <text
                        x={textX}
                        y={textY}
                        textAnchor="middle"
                        dominantBaseline="central"
                        className="fill-white font-bold text-[11px] pointer-events-none select-none drop-shadow-xs"
                      >
                        {Math.round(group.percentage)}%
                      </text>
                    )}

                    {/* Floating Circular Emoji Badge on outer rim (Matching Image 2) */}
                    {showBadge && (
                      <g
                        transform={`translate(${badgeX}, ${badgeY})`}
                        className="cursor-pointer transition-transform duration-200 hover:scale-115"
                        onClick={() => handleToggleExpand(group.name, group.id)}
                        filter="url(#badge-shadow)"
                      >
                        <circle
                          r="14"
                          fill="white"
                          className="dark:fill-neutral-900"
                          stroke={group.color}
                          strokeWidth={isHighlight ? '3.5' : '2.5'}
                        />
                        <text
                          textAnchor="middle"
                          dominantBaseline="central"
                          fontSize="13.5"
                          y="0.5"
                          className="select-none"
                        >
                          {group.emoji}
                        </text>
                      </g>
                    )}
                  </g>
                );
              })
            )}

            {/* Center Hole: "ค่าใช้จ่าย" + Total Amount (Matching Image 2) */}
            <circle
              cx={cx}
              cy={cy}
              r={rInner - 2}
              fill="transparent"
              className="pointer-events-none"
            />
            <text
              x={cx}
              y={cy - 10}
              textAnchor="middle"
              dominantBaseline="central"
              className="text-xs font-medium fill-neutral-500 dark:fill-neutral-400 select-none"
            >
              ค่าใช้จ่าย
            </text>
            <text
              x={cx}
              y={cy + 12}
              textAnchor="middle"
              dominantBaseline="central"
              className="text-base font-bold fill-neutral-900 dark:fill-neutral-100 tabular-nums select-none"
            >
              {isMasked ? '••••' : `฿${formatSatang(totalSpentSatang)}`}
            </text>
          </svg>
        </div>

        {/* Category Details Breakdown List matching Image 2 */}
        <div className="pt-2 border-t border-border-light/60 dark:border-border-dark/60">
          {isEmpty ? (
            <div className="py-8 text-center text-neutral-400 text-xs space-y-1.5">
              <Inbox size={28} className="mx-auto text-neutral-300 dark:text-neutral-600 mb-1" />
              <p className="font-medium text-neutral-600 dark:text-neutral-400">ยังไม่มีรายจ่ายในเดือนนี้</p>
              <p className="text-[11px] text-neutral-400">บันทึกค่าใช้จ่ายเพื่อดูสัดส่วนตามหมวดหมู่</p>
            </div>
          ) : (
            <div className="divide-y divide-border-light/40 dark:divide-border-dark/40">
              {categoryGroups.map((cat) => {
                const isExpanded = expandedCatName === cat.name;
                const isHighlight = highlightedCatId === cat.id;

                return (
                  <div
                    key={cat.id}
                    className={`transition-colors duration-150 rounded-2xl ${
                      isHighlight
                        ? 'bg-neutral-100/70 dark:bg-neutral-800/60'
                        : 'hover:bg-neutral-50/60 dark:hover:bg-neutral-800/30'
                    }`}
                  >
                    {/* Row Item: Emoji + Category | Percentage % | Amount ฿ (Matching Image 2) */}
                    <button
                      type="button"
                      onClick={() => handleToggleExpand(cat.name, cat.id)}
                      className="w-full flex items-center justify-between py-3 px-2 text-left cursor-pointer select-none"
                    >
                      {/* Left Column: Emoji in bubble + Category Name */}
                      <div className="flex items-center gap-3 min-w-0 pr-2">
                        <div
                          className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl shrink-0 shadow-xs border transition-transform group-hover:scale-105"
                          style={{
                            backgroundColor: `${cat.color}18`,
                            borderColor: `${cat.color}40`,
                          }}
                        >
                          <span className="leading-none">{cat.emoji}</span>
                        </div>
                        <div className="min-w-0">
                          <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100 block truncate">
                            {cat.name}
                          </span>
                          <span className="text-[11px] text-neutral-400 block">
                            {cat.txCount} รายการ
                          </span>
                        </div>
                      </div>

                      {/* Middle Column: Percentage % */}
                      <div className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 tabular-nums px-2 text-center shrink-0">
                        {cat.percentage.toFixed(2)}%
                      </div>

                      {/* Right Column: Amount ฿ */}
                      <div className="flex items-center gap-1.5 shrink-0 text-right">
                        <span className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 tabular-nums">
                          {isMasked ? '••••' : `฿${formatSatang(cat.totalSatang)}`}
                        </span>
                        <ChevronRight
                          size={14}
                          className={`text-neutral-400 transition-transform duration-200 ${
                            isExpanded ? 'rotate-90 text-neutral-700 dark:text-neutral-200' : ''
                          }`}
                        />
                      </div>
                    </button>

                    {/* Expandable Transaction Details for this category */}
                    {isExpanded && (
                      <div className="px-3 pb-3 pt-1 space-y-1.5 animate-fade-in">
                        <div className="text-[11px] font-semibold text-neutral-400 px-1 pb-1 border-b border-border-light/40 dark:border-border-dark/40">
                          รายการในหมวด {cat.name} ({cat.transactions.length} รายการ)
                        </div>
                        <div className="space-y-1 max-h-60 overflow-y-auto pr-1">
                          {cat.transactions.map((tx) => (
                            <div
                              key={tx.id}
                              onClick={() => onSelectTx?.(tx)}
                              className="flex items-center justify-between p-2 rounded-xl text-xs bg-surface-light dark:bg-card-dark border border-border-light/60 dark:border-border-dark/60 hover:border-neutral-400 dark:hover:border-neutral-600 cursor-pointer transition-colors"
                            >
                              <div className="min-w-0 pr-2">
                                <div className="text-neutral-800 dark:text-neutral-200 font-medium truncate">
                                  {tx.note?.trim() || tx.category || 'ไม่มีบันทึก'}
                                </div>
                                <div className="text-[10px] text-neutral-400">
                                  {formatThaiFullDate(tx.date)}
                                  {tx.who ? ` • ${tx.who}` : ''}
                                  {tx.pocketId && pocketMap.has(tx.pocketId)
                                    ? ` • ${pocketMap.get(tx.pocketId)}`
                                    : ''}
                                </div>
                              </div>
                              <div className="text-xs font-semibold text-red-600 dark:text-red-400 tabular-nums shrink-0">
                                {isMasked ? '••••' : `-${formatSatang(tx.amount)} ฿`}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Monthly Cashflow Mini-Cards (Retained from original screen) */}
      <div className="grid grid-cols-2 gap-2.5">
        <div className="p-3.5 rounded-2xl bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark">
          <div className="flex items-center gap-1.5 text-xs text-neutral-500 mb-1">
            <TrendingUp size={14} className="text-emerald-500" />
            <span>เงินเข้าเดือนนี้</span>
          </div>
          <div className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">
            {isMasked ? '••••' : `+${formatSatang(monthlyIncomeSatang)} ฿`}
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark">
          <div className="flex items-center gap-1.5 text-xs text-neutral-500 mb-1">
            <TrendingDown size={14} className="text-red-500" />
            <span>จ่ายออกเดือนนี้</span>
          </div>
          <div className="text-sm font-semibold text-red-600 dark:text-red-400 tabular-nums">
            {isMasked ? '••••' : `-${formatSatang(totalSpentSatang)} ฿`}
          </div>
        </div>
      </div>
    </div>
  );
};
