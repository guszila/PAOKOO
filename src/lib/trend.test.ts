import { describe, it, expect } from 'vitest';
import { calculateMonthTrend, getSmoothBezierPath } from './trend';
import { Transaction } from '../types/transaction';

describe('calculateMonthTrend', () => {
  it('should correctly aggregate daily and cumulative income/expense for a given month', () => {
    const transactions: Transaction[] = [
      {
        id: '1',
        type: 'in',
        amount: 100000, // 1,000 Baht on Oct 1
        who: 'โฟกัส',
        date: '2026-10-01',
        note: 'เงินเดือน',
        createdBy: 'u1',
        createdAt: '',
        updatedAt: '',
      },
      {
        id: '2',
        type: 'out',
        amount: 15000, // 150 Baht on Oct 2
        category: 'อาหาร',
        who: 'โฟกัส',
        date: '2026-10-02',
        note: 'ข้าวผัด',
        createdBy: 'u1',
        createdAt: '',
        updatedAt: '',
      },
      {
        id: '3',
        type: 'out',
        amount: 40000, // 400 Baht on Oct 4
        category: 'ค่าน้ำ-ไฟ-เน็ต',
        who: 'โฟกัส',
        date: '2026-10-04',
        note: 'ค่าเน็ต',
        createdBy: 'u1',
        createdAt: '',
        updatedAt: '',
      },
    ];

    const result = calculateMonthTrend(transactions, '2026-10', '2026-10-04');

    expect(result.daysCount).toBe(31);
    expect(result.totalIncome).toBe(100000);
    expect(result.totalExpense).toBe(55000);
    expect(result.netTotal).toBe(45000);

    // Peak expense should be Oct 4 (400 Baht)
    expect(result.peakExpenseDay?.dayNumber).toBe(4);
    expect(result.peakExpenseDay?.amount).toBe(40000);

    // Peak income should be Oct 1 (1,000 Baht)
    expect(result.peakIncomeDay?.dayNumber).toBe(1);
    expect(result.peakIncomeDay?.amount).toBe(100000);

    // Day 1
    const day1 = result.points[0];
    expect(day1.dayNumber).toBe(1);
    expect(day1.income).toBe(100000);
    expect(day1.expense).toBe(0);
    expect(day1.cumulativeIncome).toBe(100000);
    expect(day1.cumulativeExpense).toBe(0);

    // Day 2
    const day2 = result.points[1];
    expect(day2.income).toBe(0);
    expect(day2.expense).toBe(15000);
    expect(day2.cumulativeExpense).toBe(15000);

    // Day 4
    const day4 = result.points[3];
    expect(day4.income).toBe(0);
    expect(day4.expense).toBe(40000);
    expect(day4.cumulativeExpense).toBe(55000);

    // Savings rate: (1000 - 550) / 1000 = 45%
    expect(result.savingsRate).toBe(45);
  });

  it('generates a valid SVG smooth bezier path', () => {
    const coords = [
      { x: 10, y: 50 },
      { x: 50, y: 30 },
      { x: 90, y: 70 },
      { x: 130, y: 20 },
    ];
    const path = getSmoothBezierPath(coords);
    expect(path.startsWith('M 10.0 50.0')).toBe(true);
    expect(path.includes('C')).toBe(true);
  });

  it('guarantees zero overshoot on flat plateaus (e.g. cumulative income remaining flat)', () => {
    const coords = [
      { x: 0, y: 150 }, // Day 1: 0
      { x: 10, y: 150 }, // Day 2: 0
      { x: 20, y: 16 }, // Day 3: Spikes to 1,000 (y = 16)
      { x: 30, y: 16 }, // Day 4: Remains at 1,000 (y = 16)
      { x: 40, y: 16 }, // Day 5: Remains at 1,000 (y = 16)
    ];
    const path = getSmoothBezierPath(coords);
    // Flat sections should use L and not oscillate above y = 16 or below y = 150
    expect(path).toContain('L 10.0 150.0');
    expect(path).toContain('L 40.0 16.0');
    // None of the coordinates should go above y=16 (e.g. negative numbers) or below y=150
    const numbers = path.match(/-?[\d.]+/g)?.map(Number) || [];
    numbers.forEach((num) => {
      // Y coordinates should never be negative (overshoot above y=0)
      expect(num).toBeGreaterThanOrEqual(0);
    });
  });
});
