import { Transaction } from '../types/transaction';

export interface CalendarDay {
  dateStr: string; // YYYY-MM-DD
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSunday: boolean;
  isSaturday: boolean;
}

export interface DayTransactionSummary {
  inAmount: number; // satang
  outAmount: number; // satang
  lendAmount: number; // satang
  backAmount: number; // satang
  net: number; // in - out
  transactions: Transaction[];
}

const THAI_MONTHS = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
];

const THAI_SHORT_MONTHS = [
  'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
  'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
];

/**
 * Returns formatted Thai month and Buddhist year (e.g. '2026-10' -> 'ตุลาคม 2569')
 */
export function formatThaiMonthYear(yearMonth: string): string {
  const [yStr, mStr] = yearMonth.split('-');
  const y = parseInt(yStr, 10);
  const m = parseInt(mStr, 10);
  if (isNaN(y) || isNaN(m) || m < 1 || m > 12) return yearMonth;
  const thaiYear = y > 2400 ? y : y + 543;
  return `${THAI_MONTHS[m - 1]} ${thaiYear}`;
}

/**
 * Returns formatted full Thai date (e.g. '2026-10-04' -> '4 ตุลาคม 2569')
 */
export function formatThaiFullDate(dateStr: string, isShort = false): string {
  const [yStr, mStr, dStr] = dateStr.split('-');
  const y = parseInt(yStr, 10);
  const m = parseInt(mStr, 10);
  const d = parseInt(dStr, 10);
  if (isNaN(y) || isNaN(m) || isNaN(d) || m < 1 || m > 12) return dateStr;
  const thaiYear = y > 2400 ? y : y + 543;
  const monthName = isShort ? THAI_SHORT_MONTHS[m - 1] : THAI_MONTHS[m - 1];
  return `${d} ${monthName} ${thaiYear}`;
}

/**
 * Compact Baht formatter for calendar badges (e.g. 500, 1.2k, 25k, 1.5M)
 */
export function formatCompactAmount(satang: number): string {
  const baht = Math.round(satang / 100);
  const absBaht = Math.abs(baht);
  if (absBaht >= 1_000_000) {
    const formatted = (baht / 1_000_000).toFixed(1).replace(/\.0$/, '');
    return `${formatted}M`;
  }
  if (absBaht >= 1_000) {
    const formatted = (baht / 1_000).toFixed(1).replace(/\.0$/, '');
    return `${formatted}k`;
  }
  return baht.toLocaleString('en-US');
}

/**
 * Builds array of days to render in 7-column calendar grid (Sun - Sat)
 */
export function getCalendarMonthDays(yearMonth: string, todayStr?: string): CalendarDay[] {
  const [yStr, mStr] = yearMonth.split('-');
  const year = parseInt(yStr, 10);
  const month = parseInt(mStr, 10); // 1-12
  if (isNaN(year) || isNaN(month) || month < 1 || month > 12) return [];

  const currentToday = todayStr || (() => {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  })();

  const firstDayOfWeek = new Date(year, month - 1, 1).getDay(); // 0 = Sunday, 6 = Saturday
  const daysInCurrentMonth = new Date(year, month, 0).getDate();
  const daysInPrevMonth = new Date(year, month - 1, 0).getDate();

  const days: CalendarDay[] = [];

  // 1. Leading days from previous month
  const prevMonthDate = new Date(year, month - 2, 1);
  const prevY = prevMonthDate.getFullYear();
  const prevM = String(prevMonthDate.getMonth() + 1).padStart(2, '0');

  for (let i = firstDayOfWeek - 1; i >= 0; i--) {
    const dayNum = daysInPrevMonth - i;
    const dateStr = `${prevY}-${prevM}-${String(dayNum).padStart(2, '0')}`;
    const dayOfWeek = new Date(prevY, parseInt(prevM, 10) - 1, dayNum).getDay();
    days.push({
      dateStr,
      dayNumber: dayNum,
      isCurrentMonth: false,
      isToday: dateStr === currentToday,
      isSunday: dayOfWeek === 0,
      isSaturday: dayOfWeek === 6,
    });
  }

  // 2. Days of current month
  const currM = String(month).padStart(2, '0');
  for (let d = 1; d <= daysInCurrentMonth; d++) {
    const dateStr = `${year}-${currM}-${String(d).padStart(2, '0')}`;
    const dayOfWeek = new Date(year, month - 1, d).getDay();
    days.push({
      dateStr,
      dayNumber: d,
      isCurrentMonth: true,
      isToday: dateStr === currentToday,
      isSunday: dayOfWeek === 0,
      isSaturday: dayOfWeek === 6,
    });
  }

  // 3. Trailing days from next month to complete the 7-column grid
  const remainingCells = (7 - (days.length % 7)) % 7;
  // If the grid has 35 days or 42 days, ensure clean grid
  const targetTotal = days.length + remainingCells < 35 ? 35 : days.length + remainingCells;
  const nextMonthDate = new Date(year, month, 1);
  const nextY = nextMonthDate.getFullYear();
  const nextM = String(nextMonthDate.getMonth() + 1).padStart(2, '0');

  let nextDayCounter = 1;
  while (days.length < targetTotal) {
    const dateStr = `${nextY}-${nextM}-${String(nextDayCounter).padStart(2, '0')}`;
    const dayOfWeek = new Date(nextY, parseInt(nextM, 10) - 1, nextDayCounter).getDay();
    days.push({
      dateStr,
      dayNumber: nextDayCounter,
      isCurrentMonth: false,
      isToday: dateStr === currentToday,
      isSunday: dayOfWeek === 0,
      isSaturday: dayOfWeek === 6,
    });
    nextDayCounter++;
  }

  return days;
}

/**
 * Aggregates transactions by date for the calendar
 */
export function groupTransactionsByDate(
  transactions: Transaction[],
  yearMonth?: string
): Record<string, DayTransactionSummary> {
  const map: Record<string, DayTransactionSummary> = {};

  transactions.forEach((tx) => {
    if (!tx.date) return;
    if (yearMonth && !tx.date.startsWith(yearMonth)) return;

    if (!map[tx.date]) {
      map[tx.date] = {
        inAmount: 0,
        outAmount: 0,
        lendAmount: 0,
        backAmount: 0,
        net: 0,
        transactions: [],
      };
    }

    const item = map[tx.date];
    item.transactions.push(tx);

    if (tx.type === 'in') item.inAmount += tx.amount;
    else if (tx.type === 'out') item.outAmount += tx.amount;
    else if (tx.type === 'lend') item.lendAmount += tx.amount;
    else if (tx.type === 'back') item.backAmount += tx.amount;

    item.net = item.inAmount - item.outAmount;
  });

  return map;
}
