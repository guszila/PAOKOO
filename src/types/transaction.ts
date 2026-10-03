export type TransactionType = 'in' | 'out' | 'lend' | 'back';

export interface Transaction {
  id: string;
  type: TransactionType;
  /** Amount stored in SATANG (amount * 100) as an integer to prevent any floating-point errors */
  amount: number;
  /** Who made the deposit/expense, or who borrowed/repaid */
  who: string;
  /** Description or memo */
  note: string;
  /** Date formatted as YYYY-MM-DD */
  date: string;
  /** Expense Category (for type === 'out') e.g. 'อาหาร', 'เดินทาง', etc. */
  category?: string;
  /** Reference number from bank transfer slip (for duplicate check) */
  refNo?: string;
  /** Slip image thumbnail (<40KB base64 JPEG) embedded in transaction */
  slipThumbnail?: string;
  /** Flag if full viewing slip exists in slips collection */
  hasFullSlip?: boolean;
  /** Timestamp ISO string or ms */
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy?: string;
}

export interface OutstandingDebtor {
  who: string;
  totalLent: number; // in satang
  totalRepaid: number; // in satang
  balance: number; // in satang (totalLent - totalRepaid)
}

export interface FinancialSummary {
  /** Current account balance = sum(in) + sum(back) - sum(out) - sum(lend) */
  currentBalance: number;
  /** Total money lent out awaiting repayment = sum of all debtor balances */
  totalLentOut: number;
  /** Grand total = currentBalance + totalLentOut */
  grandTotal: number;
  /** Debtors with balance > 0 */
  debtors: OutstandingDebtor[];
  /** Deposits in current month */
  thisMonthDeposits: number;
  /** Expenses in current month */
  thisMonthExpenses: number;
  /** Net change this month = deposits - expenses */
  thisMonthNet: number;
  /** Net change last month */
  lastMonthNet: number;
  /** Top expense category this month */
  topExpenseCategory?: { category: string; amount: number };
}
