import { describe, it, expect } from 'vitest';
import { calculateWealthDonut } from './donut';
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
});
