import { describe, it, expect } from 'vitest';
import { calculateWealthDonut, calculateExpenseCategoryDonut } from '../lib/donut';
import { Transaction } from '../types/transaction';

describe('Donut Chart Calculations', () => {
  it('handles zero data correctly for wealth donut', () => {
    const res = calculateWealthDonut([]);
    expect(res.isEmpty).toBe(true);
    expect(res.totalSatang).toBe(0);
    expect(res.segments).toHaveLength(0);
  });

  it('handles zero data correctly for expense category donut', () => {
    const res = calculateExpenseCategoryDonut([], '2026-10');
    expect(res.isEmpty).toBe(true);
    expect(res.totalSatang).toBe(0);
    expect(res.segments).toHaveLength(0);
  });

  it('handles a single expense category with exact 100.00%', () => {
    const txs: Transaction[] = [
      {
        id: '1',
        type: 'out',
        amount: 25000,
        who: 'กิ๊ฟ',
        note: 'ข้าวเย็น',
        category: 'อาหาร',
        date: '2026-10-05',
        createdAt: '',
        createdBy: '',
        updatedAt: '',
      },
    ];

    const res = calculateExpenseCategoryDonut(txs, '2026-10');
    expect(res.isEmpty).toBe(false);
    expect(res.totalSatang).toBe(25000);
    expect(res.segments).toHaveLength(1);
    expect(res.segments[0].label).toBe('อาหาร');
    expect(res.segments[0].percentage).toBe(100.0);
  });

  it('ensures expense category percentages sum to 100.00% across multiple categories', () => {
    const txs: Transaction[] = [
      {
        id: '1',
        type: 'out',
        amount: 33333,
        who: 'กิ๊ฟ',
        note: 'หมวด 1',
        category: 'อาหาร',
        date: '2026-10-01',
        createdAt: '',
        createdBy: '',
        updatedAt: '',
      },
      {
        id: '2',
        type: 'out',
        amount: 33333,
        who: 'บีม',
        note: 'หมวด 2',
        category: 'เดินทาง',
        date: '2026-10-02',
        createdAt: '',
        createdBy: '',
        updatedAt: '',
      },
      {
        id: '3',
        type: 'out',
        amount: 33334,
        who: 'กิ๊ฟ',
        note: 'หมวด 3',
        category: 'ของใช้',
        date: '2026-10-03',
        createdAt: '',
        createdBy: '',
        updatedAt: '',
      },
    ];

    const res = calculateExpenseCategoryDonut(txs, '2026-10');
    expect(res.segments).toHaveLength(3);
    const sumPct = res.segments.reduce((acc, s) => acc + s.percentage, 0);
    expect(Number(sumPct.toFixed(2))).toBe(100.0);
  });

  it('calculates wealth donut segments matching the summary formula and 100% sum', () => {
    // Deposit 10,000 THB (1,000,000 satang)
    // Spend 2,000 THB (200,000 satang)
    // Lend 3,000 THB (300,000 satang)
    // Balance = 1,000,000 - 200,000 - 300,000 = 500,000 satang
    // Total deposited = balance (500,000) + expenses (200,000) + lent (300,000) = 1,000,000 satang
    const txs: Transaction[] = [
      {
        id: '1',
        type: 'in',
        amount: 1000000,
        who: 'บีม',
        note: 'เงินเข้า',
        date: '2026-10-01',
        createdAt: '',
        createdBy: '',
        updatedAt: '',
      },
      {
        id: '2',
        type: 'out',
        amount: 200000,
        who: 'กิ๊ฟ',
        note: 'ของใช้',
        category: 'ของใช้',
        date: '2026-10-02',
        createdAt: '',
        createdBy: '',
        updatedAt: '',
      },
      {
        id: '3',
        type: 'lend',
        amount: 300000,
        who: 'สมชาย',
        note: 'ยืมเงิน',
        date: '2026-10-03',
        createdAt: '',
        createdBy: '',
        updatedAt: '',
      },
    ];

    const res = calculateWealthDonut(txs);
    expect(res.totalSatang).toBe(1000000);
    expect(res.segments).toHaveLength(3);

    const balanceSeg = res.segments.find(s => s.id === 'balance');
    const lentSeg = res.segments.find(s => s.id === 'lent');
    const expSeg = res.segments.find(s => s.id === 'expenses');

    expect(balanceSeg?.valueSatang).toBe(500000);
    expect(balanceSeg?.percentage).toBe(50.0);

    expect(lentSeg?.valueSatang).toBe(300000);
    expect(lentSeg?.percentage).toBe(30.0);

    expect(expSeg?.valueSatang).toBe(200000);
    expect(expSeg?.percentage).toBe(20.0);

    const sumPct = res.segments.reduce((acc, s) => acc + s.percentage, 0);
    expect(sumPct).toBe(100.0);
  });

  it('assigns old expenses without category to "อื่นๆ"', () => {
    const txs: Transaction[] = [
      {
        id: '1',
        type: 'out',
        amount: 5000,
        who: 'บีม',
        note: 'ไม่มีหมวด',
        date: '2026-10-05',
        createdAt: '',
        createdBy: '',
        updatedAt: '',
      },
    ];

    const res = calculateExpenseCategoryDonut(txs, '2026-10');
    expect(res.segments[0].label).toBe('อื่นๆ');
  });
});
