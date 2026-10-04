import { Pocket, PocketSummary } from '../types/pocket';
import { Transaction } from '../types/transaction';

/**
 * Calculates spending and remaining balance for each pocket based on transactions.
 */
export function calculatePocketSummaries(
  pockets: Pocket[],
  transactions: Transaction[]
): PocketSummary[] {
  // Aggregate expenses per pocket
  const pocketSpentMap = new Map<string, number>();

  for (const tx of transactions) {
    if (tx.type === 'out' && tx.pocketId) {
      const current = pocketSpentMap.get(tx.pocketId) || 0;
      pocketSpentMap.set(tx.pocketId, current + tx.amount);
    }
  }

  return pockets.map((pocket) => {
    const spentSatang = pocketSpentMap.get(pocket.id) || 0;
    const remainingSatang = pocket.allocatedSatang - spentSatang;
    const spentPercentage =
      pocket.allocatedSatang > 0
        ? Math.min(100, (spentSatang / pocket.allocatedSatang) * 100)
        : 0;

    return {
      pocket,
      spentSatang,
      remainingSatang,
      spentPercentage,
    };
  });
}

/**
 * Calculates remaining money strictly in the Main Savings account
 * (total real balance minus money currently allocated to pockets).
 */
export function calculateMainSavingsBalance(
  totalBalanceSatang: number,
  pocketSummaries: PocketSummary[]
): number {
  const totalAllocatedRemaining = pocketSummaries.reduce(
    (sum, ps) => sum + Math.max(0, ps.remainingSatang),
    0
  );
  return Math.max(0, totalBalanceSatang - totalAllocatedRemaining);
}
