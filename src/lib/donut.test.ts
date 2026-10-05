import { describe, it, expect } from 'vitest';
import { calculateWealthDonut, calculateExpenseCategoryDonut } from './donut';
import { Transaction } from '../types/transaction';
import { PocketSummary } from '../types/pocket';

describe('calculateWealthDonut with Pockets', () => {
  it('should split wealth donut into main savings and pockets', () => {
    const transactions: Transaction[] = [
      {
        id: '1',
        type: 'in',
        amount: 100000, // 1,000 Baht
        who: 'โฟกัส',
        date: '2026-10-04',
        note: '',
        createdBy: 'test-user',
        createdAt: '2026-10-04T10:00:00Z',
        updatedAt: '2026-10-04T10:00:00Z',
      },
    ];

    const pocketSummaries: PocketSummary[] = [
      {
        pocket: {
          id: 'p1',
          name: 'เงินเที่ยว',
          allocatedSatang: 50000,
          color: '#8B5CF6',
          createdAt: '',
          updatedAt: '',
        },
        spentSatang: 0,
        remainingSatang: 50000, // 500 Baht
        spentPercentage: 0,
      },
    ];

    const mainSavingsBalance = 50000; // 500 Baht

    const result = calculateWealthDonut(transactions, pocketSummaries, mainSavingsBalance);

    expect(result.isEmpty).toBe(false);
    expect(result.totalSatang).toBe(100000);
    expect(result.segments.length).toBe(2);

    const mainSeg = result.segments.find((s) => s.id === 'main-savings');
    expect(mainSeg).toBeDefined();
    expect(mainSeg?.label).toBe('กองกลางหลัก');
    expect(mainSeg?.valueSatang).toBe(50000);
    expect(mainSeg?.percentage).toBe(50);

    const pocketSeg = result.segments.find((s) => s.id === 'pocket-p1');
    expect(pocketSeg).toBeDefined();
    expect(pocketSeg?.label).toBe('เงินเที่ยว');
    expect(pocketSeg?.valueSatang).toBe(50000);
    expect(pocketSeg?.percentage).toBe(50);
  });

  it('should break down lending by debtor with distinct colors and distinct pocket color', () => {
    const transactions: Transaction[] = [
      {
        id: '1',
        type: 'in',
        amount: 1220000, // 12,200 Baht total deposited (from which 8,972 was lent, leaving 3,228 in bank)
        who: 'โฟกัส',
        date: '2026-10-04',
        note: 'เงินเข้ากองกลาง',
        createdBy: 'user1',
        createdAt: '2026-10-04T10:00:00Z',
        updatedAt: '2026-10-04T10:00:00Z',
      },
      {
        id: '2',
        type: 'lend',
        amount: 500000, // 5,000 Baht
        who: 'ปล่อยกู้',
        date: '2026-10-04',
        note: '',
        createdBy: 'user1',
        createdAt: '2026-10-04T10:00:00Z',
        updatedAt: '2026-10-04T10:00:00Z',
      },
      {
        id: '3',
        type: 'lend',
        amount: 350000, // 3,500 Baht
        who: 'แม่ต้นหยงยืม',
        date: '2026-10-04',
        note: '',
        createdBy: 'user1',
        createdAt: '2026-10-04T10:00:00Z',
        updatedAt: '2026-10-04T10:00:00Z',
      },
      {
        id: '4',
        type: 'lend',
        amount: 47200, // 472 Baht
        who: 'โฟกัส',
        date: '2026-10-04',
        note: '',
        createdBy: 'user1',
        createdAt: '2026-10-04T10:00:00Z',
        updatedAt: '2026-10-04T10:00:00Z',
      },
    ];

    // Pocket created with amber #F59E0B (which previously collided with lending)
    const pocketSummaries: PocketSummary[] = [
      {
        pocket: {
          id: 'p-kk',
          name: 'เที่ยวขอนแก่น',
          allocatedSatang: 200000,
          color: '#F59E0B',
          createdAt: '',
          updatedAt: '',
        },
        spentSatang: 0,
        remainingSatang: 200000, // 2,000 Baht
        spentPercentage: 0,
      },
    ];

    const mainSavingsBalance = 122800; // 1,228 Baht

    const result = calculateWealthDonut(transactions, pocketSummaries, mainSavingsBalance);

    expect(result.isEmpty).toBe(false);
    // Total = 1,228 + 2,000 + 5,000 + 3,500 + 472 = 12,200 Baht (1,220,000 satang)
    expect(result.totalSatang).toBe(1220000);

    // 5 segments: กองกลางหลัก, เที่ยวขอนแก่น, ปล่อยกู้, แม่ต้นหยงยืม, ยืม: โฟกัส
    expect(result.segments.length).toBe(5);

    const mainSeg = result.segments.find((s) => s.id === 'main-savings');
    expect(mainSeg?.label).toBe('กองกลางหลัก');
    expect(mainSeg?.valueSatang).toBe(122800);
    expect(mainSeg?.color).toBe('#10B981'); // Green

    const pocketSeg = result.segments.find((s) => s.id === 'pocket-p-kk');
    expect(pocketSeg?.label).toBe('เที่ยวขอนแก่น');
    expect(pocketSeg?.valueSatang).toBe(200000);
    // Pocket color should NOT be amber #F59E0B (remapped to distinct pocket color)
    expect(pocketSeg?.color).not.toBe('#F59E0B');
    expect(pocketSeg?.color).not.toBe('#10B981');

    const debtor1 = result.segments.find((s) => s.id === 'lend-ปล่อยกู้');
    expect(debtor1?.label).toBe('ปล่อยกู้');
    expect(debtor1?.valueSatang).toBe(500000);
    expect(debtor1?.color).toBe('#F59E0B'); // Debtor 1 (Amber)

    const debtor2 = result.segments.find((s) => s.id === 'lend-แม่ต้นหยงยืม');
    expect(debtor2?.label).toBe('แม่ต้นหยงยืม');
    expect(debtor2?.valueSatang).toBe(350000);
    expect(debtor2?.color).toBe('#F97316'); // Debtor 2 (Orange)

    const debtor3 = result.segments.find((s) => s.id === 'lend-โฟกัส');
    expect(debtor3?.label).toBe('ยืม: โฟกัส');
    expect(debtor3?.valueSatang).toBe(47200);
    expect(debtor3?.color).toBe('#EAB308'); // Debtor 3 (Gold)

    // Verify all 5 segments have distinct colors from each other
    const colors = result.segments.map((s) => s.color);
    const uniqueColors = new Set(colors);
    expect(uniqueColors.size).toBe(5);

    // Percentages sum cleanly to 100.00%
    const totalPercentage = result.segments.reduce((sum, s) => sum + s.percentage, 0);
    expect(Number(totalPercentage.toFixed(2))).toBe(100);

    // Verify segments are sorted descending by valueSatang (จากมากไปน้อย)
    for (let i = 0; i < result.segments.length - 1; i++) {
      expect(result.segments[i].valueSatang).toBeGreaterThanOrEqual(result.segments[i + 1].valueSatang);
    }
  });
});

describe('calculateExpenseCategoryDonut', () => {
  it('should group expenses by category and calculate percentages correctly', () => {
    const transactions: Transaction[] = [
      {
        id: '1',
        type: 'out',
        amount: 40000, // 400 Baht
        category: 'ค่าน้ำ-ไฟ-เน็ต',
        who: 'โฟกัส',
        date: '2026-10-04',
        note: 'ค่าเน็ต',
        createdBy: 'u1',
        createdAt: '',
        updatedAt: '',
      },
      {
        id: '2',
        type: 'out',
        amount: 15000, // 150 Baht
        category: 'อาหาร',
        who: 'โฟกัส',
        date: '2026-10-04',
        note: 'ข้าวกะเพรา',
        createdBy: 'u1',
        createdAt: '',
        updatedAt: '',
      },
      {
        id: '3',
        type: 'in', // should be excluded from expense donut
        amount: 100000,
        who: 'โฟกัส',
        date: '2026-10-04',
        note: 'เงินเข้า',
        createdBy: 'u1',
        createdAt: '',
        updatedAt: '',
      },
    ];

    const result = calculateExpenseCategoryDonut(transactions, '2026-10');
    expect(result.isEmpty).toBe(false);
    expect(result.totalSatang).toBe(55000); // 550 Baht
    expect(result.segments.length).toBe(2);

    // 400 / 550 = 72.73%
    const utilitySeg = result.segments.find((s) => s.label === 'ค่าน้ำ-ไฟ-เน็ต');
    expect(utilitySeg?.valueSatang).toBe(40000);
    expect(utilitySeg?.percentage).toBe(72.73);

    // 150 / 550 = 27.27%
    const foodSeg = result.segments.find((s) => s.label === 'อาหาร');
    expect(foodSeg?.valueSatang).toBe(15000);
    expect(foodSeg?.percentage).toBe(27.27);

    // Total percentages should equal 100.00%
    const sum = result.segments.reduce((acc, s) => acc + s.percentage, 0);
    expect(Number(sum.toFixed(2))).toBe(100);
  });
});

