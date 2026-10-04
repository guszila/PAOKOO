import { Transaction, FinancialSummary, OutstandingDebtor } from '../types/transaction';

/**
 * Calculates all financial summaries purely from transaction list.
 * All amounts are in integer satang.
 */
export function calculateSummary(
  transactions: Transaction[],
  currentDate: Date = new Date()
): FinancialSummary {
  let sumIn = 0;
  let sumOut = 0;
  let sumLend = 0;
  let sumBack = 0;

  // Track per-person lending & repayments
  // Map key: lowercased/trimmed name -> { who: originalName, lent: satang, repaid: satang }
  const debtorMap = new Map<string, { originalWho: string; lent: number; repaid: number }>();

  // Determine current year-month YYYY-MM
  const year = currentDate.getFullYear();
  const month = String(currentDate.getMonth() + 1).padStart(2, '0');
  const currentYearMonth = `${year}-${month}`;

  let thisMonthDeposits = 0;
  let thisMonthExpenses = 0;

  for (const tx of transactions) {
    const amount = Math.round(tx.amount);
    if (amount <= 0) continue;

    const personKey = tx.who.trim().toLowerCase();
    const isThisMonth = tx.date && tx.date.startsWith(currentYearMonth);

    switch (tx.type) {
      case 'in':
        sumIn += amount;
        if (isThisMonth) thisMonthDeposits += amount;
        break;

      case 'out':
        sumOut += amount;
        if (isThisMonth) thisMonthExpenses += amount;
        break;

      case 'lend':
        sumLend += amount;
        if (personKey) {
          const entry = debtorMap.get(personKey) || { originalWho: tx.who.trim(), lent: 0, repaid: 0 };
          entry.lent += amount;
          debtorMap.set(personKey, entry);
        }
        break;

      case 'back':
        sumBack += amount;
        if (personKey) {
          const entry = debtorMap.get(personKey) || { originalWho: tx.who.trim(), lent: 0, repaid: 0 };
          entry.repaid += amount;
          debtorMap.set(personKey, entry);
        }
        break;
    }
  }

  // Calculate outstanding balances (show only people with balance > 0)
  const debtors: OutstandingDebtor[] = [];
  let totalLentOut = 0;

  debtorMap.forEach((entry) => {
    const balance = entry.lent - entry.repaid;
    if (balance > 0) {
      debtors.push({
        who: entry.originalWho,
        totalLent: entry.lent,
        totalRepaid: entry.repaid,
        balance,
      });
      totalLentOut += balance;
    }
  });

  // Sort debtors by balance descending (highest debt first)
  debtors.sort((a, b) => b.balance - a.balance);

  // Current account balance = sum(in) + sum(back) - sum(out) - sum(lend)
  const currentBalance = sumIn + sumBack - sumOut - sumLend;

  // Grand total = account balance + total lent out
  const grandTotal = currentBalance + totalLentOut;

  // Last month date YYYY-MM
  const lastMonthDate = new Date(year, currentDate.getMonth() - 1, 1);
  const lastMonthYear = lastMonthDate.getFullYear();
  const lastMonthNum = String(lastMonthDate.getMonth() + 1).padStart(2, '0');
  const lastYearMonth = `${lastMonthYear}-${lastMonthNum}`;

  let lastMonthDeposits = 0;
  let lastMonthExpenses = 0;
  const categoryCount = new Map<string, number>();

  for (const tx of transactions) {
    if (tx.amount <= 0) continue;
    if (tx.date && tx.date.startsWith(lastYearMonth)) {
      if (tx.type === 'in') lastMonthDeposits += tx.amount;
      if (tx.type === 'out') lastMonthExpenses += tx.amount;
    }
    if (tx.type === 'out' && tx.date && tx.date.startsWith(currentYearMonth)) {
      const cat = tx.category?.trim() || 'อื่นๆ';
      categoryCount.set(cat, (categoryCount.get(cat) || 0) + tx.amount);
    }
  }

  const thisMonthNet = thisMonthDeposits - thisMonthExpenses;
  const lastMonthNet = lastMonthDeposits - lastMonthExpenses;

  // Find top category
  let topExpenseCategory: { category: string; amount: number } | undefined;
  if (categoryCount.size > 0) {
    const sortedCats = Array.from(categoryCount.entries()).sort((a, b) => b[1] - a[1]);
    if (sortedCats[0]) {
      topExpenseCategory = { category: sortedCats[0][0], amount: sortedCats[0][1] };
    }
  }

  return {
    currentBalance,
    totalLentOut,
    grandTotal,
    debtors,
    thisMonthDeposits,
    thisMonthExpenses,
    thisMonthNet,
    lastMonthNet,
    topExpenseCategory,
  };
}

/**
 * Returns current outstanding balance for a specific person in satang.
 */
export function getOutstandingForPerson(transactions: Transaction[], personName: string): number {
  if (!personName) return 0;
  const targetKey = personName.trim().toLowerCase();

  let lent = 0;
  let repaid = 0;

  for (const tx of transactions) {
    if (tx.who.trim().toLowerCase() === targetKey) {
      if (tx.type === 'lend') lent += tx.amount;
      if (tx.type === 'back') repaid += tx.amount;
    }
  }

  const balance = lent - repaid;
  return balance > 0 ? balance : 0;
}

/**
 * Checks if a repayment amount exceeds the person's current outstanding balance.
 */
export function checkOverRepayment(
  transactions: Transaction[],
  personName: string,
  repaymentSatang: number,
  excludeTxId?: string
): {
  isOver: boolean;
  excessSatang: number;
  currentDebtSatang: number;
} {
  const filteredTxs = excludeTxId ? transactions.filter(t => t.id !== excludeTxId) : transactions;
  const currentDebtSatang = getOutstandingForPerson(filteredTxs, personName);

  if (repaymentSatang > currentDebtSatang) {
    return {
      isOver: true,
      excessSatang: repaymentSatang - currentDebtSatang,
      currentDebtSatang,
    };
  }

  return {
    isOver: false,
    excessSatang: 0,
    currentDebtSatang,
  };
}

/**
 * Sorts transactions chronologically: newest date and time first.
 * If date and time are identical, falls back to createdAt or id.
 */
export function sortTransactionsChronological(txs: Transaction[]): Transaction[] {
  return [...txs].sort((a, b) => {
    const aTime = a.time && a.time.trim() ? a.time.trim() : '00:00';
    const bTime = b.time && b.time.trim() ? b.time.trim() : '00:00';
    const aKey = `${a.date} ${aTime}`;
    const bKey = `${b.date} ${bTime}`;

    if (aKey !== bKey) {
      return bKey.localeCompare(aKey); // Newest date & time first
    }

    if (a.createdAt && b.createdAt && a.createdAt !== b.createdAt) {
      return b.createdAt.localeCompare(a.createdAt);
    }

    return b.id.localeCompare(a.id);
  });
}

