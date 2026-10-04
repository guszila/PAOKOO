import { Transaction } from '../types/transaction';

export interface DayTrendPoint {
  dateStr: string;
  dayNumber: number;
  dayLabel: string; // e.g. "1 ต.ค."
  income: number;
  expense: number;
  net: number;
  cumulativeIncome: number;
  cumulativeExpense: number;
  cumulativeNet: number;
  hasActivity: boolean;
}

export interface MonthTrendData {
  yearMonth: string;
  daysCount: number;
  points: DayTrendPoint[];
  totalIncome: number;
  totalExpense: number;
  netTotal: number;
  dailyAvgExpense: number;
  dailyAvgIncome: number;
  peakExpenseDay: { dayNumber: number; dateStr: string; amount: number } | null;
  peakIncomeDay: { dayNumber: number; dateStr: string; amount: number } | null;
  savingsRate: number; // percentage (e.g. 45.5%)
  prevMonthTotalExpense: number;
  prevMonthExpenseChangePct: number | null; // % change compared to prev month total
}

/**
 * Calculates day-by-day and cumulative trend data for a given month (YYYY-MM).
 */
export function calculateMonthTrend(
  transactions: Transaction[],
  yearMonth: string,
  todayStr?: string
): MonthTrendData {
  const [yearNum, monthNum] = yearMonth.split('-').map(Number);
  const daysInMonth = new Date(yearNum, monthNum, 0).getDate();

  // Determine previous month YYYY-MM
  const prevDate = new Date(yearNum, monthNum - 2, 1);
  const prevYM = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;

  // Tally daily activity for the active month
  const dailyIncomeMap = new Map<number, number>();
  const dailyExpenseMap = new Map<number, number>();

  let prevMonthExpense = 0;

  for (const tx of transactions) {
    if (!tx.date) continue;
    const amount = Math.round(tx.amount);
    if (amount <= 0) continue;

    if (tx.date.startsWith(yearMonth)) {
      const day = Number(tx.date.slice(8, 10));
      if (day >= 1 && day <= daysInMonth) {
        if (tx.type === 'in' || tx.type === 'back') {
          dailyIncomeMap.set(day, (dailyIncomeMap.get(day) || 0) + amount);
        } else if (tx.type === 'out' || tx.type === 'lend') {
          dailyExpenseMap.set(day, (dailyExpenseMap.get(day) || 0) + amount);
        }
      }
    } else if (tx.date.startsWith(prevYM)) {
      if (tx.type === 'out' || tx.type === 'lend') {
        prevMonthExpense += amount;
      }
    }
  }

  // Build 1..N day points
  let cumIn = 0;
  let cumOut = 0;
  let totalIn = 0;
  let totalOut = 0;

  let peakExpense: { dayNumber: number; dateStr: string; amount: number } | null = null;
  let peakIncome: { dayNumber: number; dateStr: string; amount: number } | null = null;

  const points: DayTrendPoint[] = [];

  for (let d = 1; d <= daysInMonth; d++) {
    const dayStr = String(d).padStart(2, '0');
    const dateStr = `${yearMonth}-${dayStr}`;
    const dayIncome = dailyIncomeMap.get(d) || 0;
    const dayExpense = dailyExpenseMap.get(d) || 0;
    const dayNet = dayIncome - dayExpense;

    cumIn += dayIncome;
    cumOut += dayExpense;
    totalIn += dayIncome;
    totalOut += dayExpense;

    if (dayExpense > 0 && (!peakExpense || dayExpense > peakExpense.amount)) {
      peakExpense = { dayNumber: d, dateStr, amount: dayExpense };
    }

    if (dayIncome > 0 && (!peakIncome || dayIncome > peakIncome.amount)) {
      peakIncome = { dayNumber: d, dateStr, amount: dayIncome };
    }

    points.push({
      dateStr,
      dayNumber: d,
      dayLabel: `${d} ${getMonthShortThai(monthNum)}`,
      income: dayIncome,
      expense: dayExpense,
      net: dayNet,
      cumulativeIncome: cumIn,
      cumulativeExpense: cumOut,
      cumulativeNet: cumIn - cumOut,
      hasActivity: dayIncome > 0 || dayExpense > 0,
    });
  }

  // Active days count for average
  let activeDaysForAvg = daysInMonth;
  if (todayStr && todayStr.startsWith(yearMonth)) {
    const todayDay = Number(todayStr.slice(8, 10));
    activeDaysForAvg = Math.max(1, Math.min(todayDay, daysInMonth));
  }

  const dailyAvgExpense = activeDaysForAvg > 0 ? Math.round(totalOut / activeDaysForAvg) : 0;
  const dailyAvgIncome = activeDaysForAvg > 0 ? Math.round(totalIn / activeDaysForAvg) : 0;
  const savingsRate = totalIn > 0 ? Math.max(-100, Math.min(100, Math.round(((totalIn - totalOut) / totalIn) * 100))) : 0;

  let prevMonthExpenseChangePct: number | null = null;
  if (prevMonthExpense > 0) {
    prevMonthExpenseChangePct = Number((((totalOut - prevMonthExpense) / prevMonthExpense) * 100).toFixed(1));
  }

  return {
    yearMonth,
    daysCount: daysInMonth,
    points,
    totalIncome: totalIn,
    totalExpense: totalOut,
    netTotal: totalIn - totalOut,
    dailyAvgExpense,
    dailyAvgIncome,
    peakExpenseDay: peakExpense,
    peakIncomeDay: peakIncome,
    savingsRate,
    prevMonthTotalExpense: prevMonthExpense,
    prevMonthExpenseChangePct,
  };
}

/**
 * Returns Thai short month abbreviation (e.g. 1 -> "ม.ค.")
 */
export function getMonthShortThai(monthNum: number): string {
  const thaiMonths = [
    'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
    'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.',
  ];
  return thaiMonths[(monthNum - 1) % 12] || '';
}

/**
 * Converts an array of (x, y) coordinates into a smooth monotone cubic Bezier SVG path (Fritsch-Carlson).
 * Guarantees zero overshoot/undershoot at peaks, valleys, and plateaus.
 */
export function getSmoothBezierPath(points: { x: number; y: number }[]): string {
  const n = points.length;
  if (n === 0) return '';
  if (n === 1) return `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;
  if (n === 2) {
    return `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)} L ${points[1].x.toFixed(1)} ${points[1].y.toFixed(1)}`;
  }

  // 1. Calculate secants (slopes between consecutive points)
  const dxs: number[] = new Array(n - 1);
  const dys: number[] = new Array(n - 1);
  const deltas: number[] = new Array(n - 1);

  for (let i = 0; i < n - 1; i++) {
    const dx = points[i + 1].x - points[i].x;
    const dy = points[i + 1].y - points[i].y;
    dxs[i] = dx;
    dys[i] = dy;
    deltas[i] = dx !== 0 ? dy / dx : 0;
  }

  // 2. Calculate initial tangents at each point
  const ms: number[] = new Array(n);
  ms[0] = deltas[0];
  ms[n - 1] = deltas[n - 2];

  for (let i = 1; i < n - 1; i++) {
    const d0 = deltas[i - 1];
    const d1 = deltas[i];
    if (d0 * d1 <= 0) {
      // Local extremum (peak/valley) or flat segment: slope MUST be 0 to prevent overshoot
      ms[i] = 0;
    } else {
      // Harmonic mean (Fritsch-Carlson monotone filter)
      ms[i] = (2 * d0 * d1) / (d0 + d1);
    }
  }

  // 3. Fritsch-Carlson condition to prevent overshoot
  for (let i = 0; i < n - 1; i++) {
    const delta = deltas[i];
    if (delta === 0) {
      ms[i] = 0;
      ms[i + 1] = 0;
    } else {
      const alpha = ms[i] / delta;
      const beta = ms[i + 1] / delta;
      const dist = alpha * alpha + beta * beta;
      if (dist > 9) {
        const tau = 3 / Math.sqrt(dist);
        ms[i] = tau * alpha * delta;
        ms[i + 1] = tau * beta * delta;
      }
    }
  }

  // 4. Construct SVG path using cubic Bezier control points
  let path = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;

  for (let i = 0; i < n - 1; i++) {
    const p1 = points[i];
    const p2 = points[i + 1];
    const dx = dxs[i];

    // If both points have the same Y value (horizontal plateau), draw straight line for perfect precision
    if (Math.abs(p1.y - p2.y) < 0.001) {
      path += ` L ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
      continue;
    }

    const cp1x = p1.x + dx / 3;
    const cp1y = p1.y + (ms[i] * dx) / 3;
    const cp2x = p2.x - dx / 3;
    const cp2y = p2.y - (ms[i + 1] * dx) / 3;

    path += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
  }

  return path;
}
