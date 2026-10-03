import { describe, it, expect } from 'vitest';
import { calculateSummary, getOutstandingForPerson, checkOverRepayment } from '../lib/summary';
import { Transaction } from '../types/transaction';

describe('Financial Summary Formulas', () => {
  const mockDate = new Date('2026-10-15T12:00:00Z');

  const baseTransactions: Transaction[] = [
    // Deposit 5,000 THB into account by User A (500000 satang)
    {
      id: 'tx-1',
      type: 'in',
      amount: 500000,
      who: 'ต้น',
      note: 'เงินเดือนฝากเข้ากองกลาง',
      date: '2026-10-01',
      createdAt: '2026-10-01T08:00:00Z',
      createdBy: 'user-1',
      updatedAt: '2026-10-01T08:00:00Z',
    },
    // Deposit 5,000 THB into account by User B (500000 satang)
    {
      id: 'tx-2',
      type: 'in',
      amount: 500000,
      who: 'กิ๊ฟ',
      note: 'เงินเดือนฝากเข้ากองกลาง',
      date: '2026-10-01',
      createdAt: '2026-10-01T08:00:00Z',
      createdBy: 'user-2',
      updatedAt: '2026-10-01T08:00:00Z',
    },
    // Expense 1,200.50 THB (120050 satang)
    {
      id: 'tx-3',
      type: 'out',
      amount: 120050,
      who: 'กิ๊ฟ',
      note: 'ซื้อของเข้าบ้าน Lotus',
      date: '2026-10-05',
      createdAt: '2026-10-05T10:00:00Z',
      createdBy: 'user-2',
      updatedAt: '2026-10-05T10:00:00Z',
    },
    // Lend 2,000 THB to Somchai (200000 satang)
    {
      id: 'tx-4',
      type: 'lend',
      amount: 200000,
      who: 'สมชาย',
      note: 'สำรองจ่ายค่าซ่อมรถให้สมชาย',
      date: '2026-10-07',
      createdAt: '2026-10-07T11:00:00Z',
      createdBy: 'user-1',
      updatedAt: '2026-10-07T11:00:00Z',
    },
    // Partial Repayment 800 THB from Somchai (80000 satang)
    {
      id: 'tx-5',
      type: 'back',
      amount: 80000,
      who: 'สมชาย',
      note: 'สมชายโอนคืนรอบแรก',
      date: '2026-10-10',
      createdAt: '2026-10-10T15:00:00Z',
      createdBy: 'user-1',
      updatedAt: '2026-10-10T15:00:00Z',
    },
    // Lend 500 THB to Somsri (50000 satang)
    {
      id: 'tx-6',
      type: 'lend',
      amount: 50000,
      who: 'สมศรี',
      note: 'ยืมค่าตั๋วเครื่องบิน',
      date: '2026-10-11',
      createdAt: '2026-10-11T12:00:00Z',
      createdBy: 'user-2',
      updatedAt: '2026-10-11T12:00:00Z',
    },
    // Full Repayment 500 THB from Somsri (50000 satang)
    {
      id: 'tx-7',
      type: 'back',
      amount: 50000,
      who: 'สมศรี',
      note: 'สมศรีคืนครบ',
      date: '2026-10-12',
      createdAt: '2026-10-12T09:00:00Z',
      createdBy: 'user-2',
      updatedAt: '2026-10-12T09:00:00Z',
    },
  ];

  it('calculates current account balance accurately according to formula', () => {
    // Current balance = sum(in) + sum(back) - sum(out) - sum(lend)
    // sum(in) = 500,000 + 500,000 = 1,000,000 satang
    // sum(back) = 80,000 + 50,000 = 130,000 satang
    // sum(out) = 120,050 satang
    // sum(lend) = 200,000 + 50,000 = 250,000 satang
    // expected balance = 1,000,000 + 130,000 - 120,050 - 250,000 = 759,950 satang (7,599.50 THB)
    const summary = calculateSummary(baseTransactions, mockDate);
    expect(summary.currentBalance).toBe(759950);
  });

  it('computes outstanding balances per person and excludes fully repaid people', () => {
    const summary = calculateSummary(baseTransactions, mockDate);

    // Somsri lent 50,000, repaid 50,000 -> balance 0 (should be excluded)
    // Somchai lent 200,000, repaid 80,000 -> balance 120,000 satang (1,200.00 THB)
    expect(summary.debtors).toHaveLength(1);
    expect(summary.debtors[0]).toEqual({
      who: 'สมชาย',
      totalLent: 200000,
      totalRepaid: 80000,
      balance: 120000,
    });

    // Total lent out = sum of all outstanding balances = 120,000 satang
    expect(summary.totalLentOut).toBe(120000);
  });

  it('computes grand total = currentBalance + totalLentOut', () => {
    const summary = calculateSummary(baseTransactions, mockDate);
    // grandTotal = 759,950 + 120,000 = 879,950 satang (8,799.50 THB)
    expect(summary.grandTotal).toBe(879950);
  });

  it('computes this month deposits and expenses accurately', () => {
    const summary = calculateSummary(baseTransactions, mockDate);
    // This month (2026-10): deposits = 1,000,000 satang, expenses = 120,050 satang
    expect(summary.thisMonthDeposits).toBe(1000000);
    expect(summary.thisMonthExpenses).toBe(120050);
  });

  it('handles case-insensitivity and whitespace trimming for debtor names', () => {
    const txs: Transaction[] = [
      {
        id: '1',
        type: 'lend',
        amount: 30000,
        who: ' น้องมายด์ ',
        note: 'ค่าข้าว',
        date: '2026-10-01',
        createdAt: '',
        createdBy: '',
        updatedAt: '',
      },
      {
        id: '2',
        type: 'back',
        amount: 10000,
        who: 'น้องมายด์',
        note: 'โอนคืน',
        date: '2026-10-02',
        createdAt: '',
        createdBy: '',
        updatedAt: '',
      },
    ];

    expect(getOutstandingForPerson(txs, 'น้องมายด์')).toBe(20000);
    expect(getOutstandingForPerson(txs, ' น้องมายด์ ')).toBe(20000);
  });

  it('detects over-repayments and calculates exact excess amount', () => {
    // Somchai owes 120,000 satang (1,200 THB)
    const checkNormal = checkOverRepayment(baseTransactions, 'สมชาย', 100000);
    expect(checkNormal.isOver).toBe(false);
    expect(checkNormal.excessSatang).toBe(0);
    expect(checkNormal.currentDebtSatang).toBe(120000);

    const checkExact = checkOverRepayment(baseTransactions, 'สมชาย', 120000);
    expect(checkExact.isOver).toBe(false);
    expect(checkExact.excessSatang).toBe(0);

    const checkOver = checkOverRepayment(baseTransactions, 'สมชาย', 150000);
    expect(checkOver.isOver).toBe(true);
    expect(checkOver.excessSatang).toBe(30000); // 300.00 THB excess
    expect(checkOver.currentDebtSatang).toBe(120000);

    // Someone with 0 debt
    const checkZero = checkOverRepayment(baseTransactions, 'สมศรี', 10000);
    expect(checkZero.isOver).toBe(true);
    expect(checkZero.excessSatang).toBe(10000);
    expect(checkZero.currentDebtSatang).toBe(0);
  });
});
