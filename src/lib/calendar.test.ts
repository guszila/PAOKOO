import { describe, it, expect } from 'vitest';
import {
  formatThaiMonthYear,
  formatThaiFullDate,
  formatCompactAmount,
  getCalendarMonthDays,
  groupTransactionsByDate,
} from './calendar';
import { Transaction } from '../types/transaction';

describe('calendar utilities', () => {
  it('formats Thai month and year correctly', () => {
    expect(formatThaiMonthYear('2026-10')).toBe('ตุลาคม 2569');
    expect(formatThaiMonthYear('2026-01')).toBe('มกราคม 2569');
  });

  it('formats Thai full date correctly', () => {
    expect(formatThaiFullDate('2026-10-04')).toBe('4 ตุลาคม 2569');
    expect(formatThaiFullDate('2026-10-04', true)).toBe('4 ต.ค. 2569');
  });

  it('formats compact amounts for badges', () => {
    expect(formatCompactAmount(50000)).toBe('500'); // 500 baht
    expect(formatCompactAmount(120000)).toBe('1.2k'); // 1,200 baht
    expect(formatCompactAmount(2000000)).toBe('20k'); // 20,000 baht
    expect(formatCompactAmount(150000000)).toBe('1.5M'); // 1.5M baht
  });

  it('generates 35 or 42 calendar grid cells starting on Sunday', () => {
    const days = getCalendarMonthDays('2026-10', '2026-10-04');
    expect(days.length % 7).toBe(0);
    expect(days.length).toBeGreaterThanOrEqual(35);

    // October 2026 starts on Thursday (index 4)
    // So days[0] should be previous month Sunday
    expect(days[0].isSunday).toBe(true);
    expect(days[0].isCurrentMonth).toBe(false);

    // Find Oct 4, 2026
    const oct4 = days.find((d) => d.dateStr === '2026-10-04');
    expect(oct4).toBeDefined();
    expect(oct4?.isToday).toBe(true);
    expect(oct4?.isCurrentMonth).toBe(true);
    expect(oct4?.dayNumber).toBe(4);
    expect(oct4?.isSunday).toBe(true);
  });

  it('groups transactions by date correctly', () => {
    const mockTxs: Transaction[] = [
      {
        id: '1',
        amount: 50000,
        type: 'out',
        who: 'โฟกัส',
        note: '',
        createdBy: 'user',
        date: '2026-10-04',
        category: 'อาหาร',
        createdAt: '2026-10-04T10:00:00Z',
        updatedAt: '2026-10-04T10:00:00Z',
      },
      {
        id: '2',
        amount: 100000,
        type: 'in',
        who: 'โฟกัส',
        note: '',
        createdBy: 'user',
        date: '2026-10-04',
        createdAt: '2026-10-04T11:00:00Z',
        updatedAt: '2026-10-04T11:00:00Z',
      },
      {
        id: '3',
        amount: 20000,
        type: 'out',
        who: 'ต้นหง',
        note: '',
        createdBy: 'user',
        date: '2026-10-05',
        category: 'เดินทาง',
        createdAt: '2026-10-05T08:00:00Z',
        updatedAt: '2026-10-05T08:00:00Z',
      },
    ];

    const grouped = groupTransactionsByDate(mockTxs, '2026-10');
    expect(grouped['2026-10-04']).toBeDefined();
    expect(grouped['2026-10-04'].inAmount).toBe(100000);
    expect(grouped['2026-10-04'].outAmount).toBe(50000);
    expect(grouped['2026-10-04'].net).toBe(50000);
    expect(grouped['2026-10-04'].transactions.length).toBe(2);

    expect(grouped['2026-10-05'].outAmount).toBe(20000);
  });
});
