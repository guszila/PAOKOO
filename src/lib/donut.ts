import { Transaction } from '../types/transaction';
import { getCategoryColor } from '../config/categories';
import { PocketSummary } from '../types/pocket';
import { calculateDebtors } from './summary';

export interface DonutSegment {
  id: string;
  label: string;
  valueSatang: number;
  percentage: number; // e.g. 50.00
  color: string;
}

export interface DonutData {
  title: string;
  totalSatang: number;
  segments: DonutSegment[];
  isEmpty: boolean;
}

// Distinct, vibrant palette for spending pockets on donut chart
// Excludes emerald green (#10B981) reserved for main savings and amber (#F59E0B) reserved for lending
export const POCKET_DONUT_COLORS = [
  '#8B5CF6', // Lavender Purple
  '#06B6D4', // Cyan Sky
  '#3B82F6', // Ocean Blue
  '#EC4899', // Hot Pink
  '#6366F1', // Indigo
  '#14B8A6', // Teal Mint
  '#D946EF', // Fuchsia
];

// Rich, warm palette for lending/borrowing by debtor (Amber, Orange, Golden tones)
export const LEND_DONUT_COLORS = [
  '#F59E0B', // Amber 500 (Signature PAOKOO loan color)
  '#F97316', // Vibrant Orange 500
  '#EAB308', // Sunflower Gold 500
  '#FB923C', // Coral Peach 400
  '#D97706', // Warm Honey 600
  '#EA580C', // Rust Orange 600
  '#FBBF24', // Marigold 400
  '#CA8A04', // Bronze Ochre 600
];

/**
 * Returns a display color for a pocket that avoids colliding with main savings (#10B981) or lending (#F59E0B).
 */
export function getPocketDisplayColor(color?: string, index = 0): string {
  const lower = (color || '').toLowerCase();
  if (!color || lower === '#10b981' || lower === '#f59e0b') {
    return POCKET_DONUT_COLORS[index % POCKET_DONUT_COLORS.length];
  }
  return color;
}

/**
 * Calculates Tab 1 Donut: "เงินของเรา" (Our Wealth Allocation)
 * Splits total deposited wealth across:
 * 1. กองกลางหลัก (Main savings pool)
 * 2. กล่องแบ่งเงินใช้ (Each spending pocket's remaining balance)
 * 3. สัดส่วนเงินให้ยืม (Each debtor's outstanding lent balance with individual colors)
 * 4. ค่าใช้จ่ายสะสม (Total accumulated expenses)
 * Total deposited = balance + total expenses + outstanding lent
 */
export function calculateWealthDonut(
  transactions: Transaction[],
  pocketSummaries?: PocketSummary[],
  mainSavingsBalance?: number
): DonutData {
  let sumIn = 0;
  let sumOut = 0;
  let sumLend = 0;
  let sumBack = 0;

  for (const tx of transactions) {
    const amount = Math.round(tx.amount);
    if (amount <= 0) continue;
    if (tx.type === 'in') sumIn += amount;
    else if (tx.type === 'out') sumOut += amount;
    else if (tx.type === 'lend') sumLend += amount;
    else if (tx.type === 'back') sumBack += amount;
  }

  // Current balance = sum(in) + sum(back) - sum(out) - sum(lend)
  const balance = sumIn + sumBack - sumOut - sumLend;
  // Outstanding lent = sum(lend) - sum(back)
  const outstandingLent = Math.max(0, sumLend - sumBack);
  // Total expenses all time
  const totalExpenses = sumOut;

  // Formula: total deposited = balance + total expenses + outstanding lent
  const totalDeposited = (balance > 0 ? balance : 0) + totalExpenses + outstandingLent;

  if (totalDeposited <= 0) {
    return {
      title: 'เงินของเรา',
      totalSatang: 0,
      segments: [],
      isEmpty: true,
    };
  }

  const rawSegments: Array<{ id: string; label: string; valueSatang: number; color: string }> = [];

  // Active pockets with remaining balance
  const activePocketsWithMoney = pocketSummaries?.filter((ps) => ps.remainingSatang > 0) || [];

  if (activePocketsWithMoney.length > 0) {
    // 1. กองกลางหลัก
    const effectiveMainSavings = mainSavingsBalance !== undefined
      ? Math.max(0, mainSavingsBalance)
      : Math.max(0, balance - activePocketsWithMoney.reduce((acc, p) => acc + p.remainingSatang, 0));

    if (effectiveMainSavings > 0) {
      rawSegments.push({
        id: 'main-savings',
        label: 'กองกลางหลัก',
        valueSatang: effectiveMainSavings,
        color: '#10B981', // Emerald green
      });
    }

    // 2. Spending Pockets
    activePocketsWithMoney.forEach((ps, idx) => {
      const segColor = getPocketDisplayColor(ps.pocket.color, idx);

      rawSegments.push({
        id: `pocket-${ps.pocket.id}`,
        label: ps.pocket.name,
        valueSatang: ps.remainingSatang,
        color: segColor,
      });
    });
  } else {
    // No pockets or all pockets have 0 balance: show as single "เงินเก็บคงเหลือ"
    if (balance > 0) {
      rawSegments.push({
        id: 'balance',
        label: 'เงินเก็บคงเหลือ',
        valueSatang: balance,
        color: '#10B981', // Green
      });
    }
  }

  // 3. Outstanding lent: broken down per person who borrowed (multi-color)
  if (outstandingLent > 0) {
    const debtors = calculateDebtors(transactions);

    if (debtors.length > 0) {
      let allocatedLent = 0;
      debtors.forEach((debtor, idx) => {
        const segColor = LEND_DONUT_COLORS[idx % LEND_DONUT_COLORS.length];
        const displayLabel = debtor.who.includes('ยืม') || debtor.who.includes('กู้')
          ? debtor.who
          : `ยืม: ${debtor.who}`;

        rawSegments.push({
          id: `lend-${debtor.who}`,
          label: displayLabel,
          valueSatang: debtor.balance,
          color: segColor,
        });
        allocatedLent += debtor.balance;
      });

      // If there is any remaining unassigned lent amount (e.g. anonymous lend transactions)
      const unassignedLent = Math.max(0, outstandingLent - allocatedLent);
      if (unassignedLent > 0) {
        rawSegments.push({
          id: 'lend-other',
          label: 'ยืม: อื่นๆ',
          valueSatang: unassignedLent,
          color: LEND_DONUT_COLORS[debtors.length % LEND_DONUT_COLORS.length],
        });
      }
    } else {
      // Fallback if no named debtors were found
      rawSegments.push({
        id: 'lent',
        label: 'เงินที่ถูกยืมค้าง',
        valueSatang: outstandingLent,
        color: LEND_DONUT_COLORS[0],
      });
    }
  }

  // 4. Expenses
  if (totalExpenses > 0) {
    rawSegments.push({
      id: 'expenses',
      label: 'ค่าใช้จ่ายสะสม',
      valueSatang: totalExpenses,
      color: '#64748B', // Slate
    });
  }

  // Sort descending by valueSatang (จากมากไปน้อย)
  rawSegments.sort((a, b) => b.valueSatang - a.valueSatang);

  const segments = normalizePercentages(rawSegments, totalDeposited);

  return {
    title: 'เงินของเรา',
    totalSatang: totalDeposited,
    segments,
    isEmpty: segments.length === 0,
  };
}

/**
 * Calculates Tab 2 Donut: "ค่าใช้จ่าย" (Expenses by Category for given month YYYY-MM)
 */
export function calculateExpenseCategoryDonut(
  transactions: Transaction[],
  yearMonth: string // YYYY-MM
): DonutData {
  const categoryMap = new Map<string, number>();
  let totalSpent = 0;

  for (const tx of transactions) {
    if (tx.type === 'out' && tx.date && tx.date.startsWith(yearMonth)) {
      const amount = Math.round(tx.amount);
      if (amount <= 0) continue;
      const cat = (tx.category && tx.category.trim()) ? tx.category.trim() : 'อื่นๆ';
      const current = categoryMap.get(cat) || 0;
      categoryMap.set(cat, current + amount);
      totalSpent += amount;
    }
  }

  if (totalSpent <= 0) {
    return {
      title: 'ค่าใช้จ่าย',
      totalSatang: 0,
      segments: [],
      isEmpty: true,
    };
  }

  // Sort categories by amount descending
  const sorted = Array.from(categoryMap.entries()).sort((a, b) => b[1] - a[1]);

  const rawSegments = sorted.map(([cat, amount], idx) => ({
    id: `cat-${cat}`,
    label: cat,
    valueSatang: amount,
    color: getCategoryColor(cat, idx),
  }));

  const segments = normalizePercentages(rawSegments, totalSpent);

  return {
    title: 'ค่าใช้จ่าย',
    totalSatang: totalSpent,
    segments,
    isEmpty: false,
  };
}

/**
 * Helper to compute percentages with 2 decimals that sum cleanly to 100.00%
 */
function normalizePercentages(
  items: { id: string; label: string; valueSatang: number; color: string }[],
  total: number
): DonutSegment[] {
  if (items.length === 0 || total <= 0) return [];

  if (items.length === 1) {
    return [
      {
        ...items[0],
        percentage: 100.0,
      },
    ];
  }

  let runningSum = 0;
  const result: DonutSegment[] = items.map((item, idx) => {
    if (idx === items.length - 1) {
      // Last item gets the exact remainder to ensure 100.00%
      const remainder = Math.max(0, 100 - runningSum);
      return {
        ...item,
        percentage: Number(remainder.toFixed(2)),
      };
    }
    const pct = Number(((item.valueSatang / total) * 100).toFixed(2));
    runningSum += pct;
    return {
      ...item,
      percentage: pct,
    };
  });

  return result;
}
