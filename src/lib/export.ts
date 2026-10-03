import { Transaction } from '../types/transaction';
import { satangToBaht } from './money';

/**
 * Downloads a text/blob file in browser.
 */
function downloadFile(content: string | Blob, fileName: string, contentType: string) {
  const blob = typeof content === 'string' ? new Blob([content], { type: contentType }) : content;
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Exports data to JSON file.
 */
export function exportToJSON(
  transactions: Transaction[],
  members: string[],
  categories?: string[]
) {
  const data = {
    app: 'PAOKOO',
    version: '1.1',
    exportDate: new Date().toISOString(),
    members,
    categories,
    transactions,
  };
  const jsonStr = JSON.stringify(data, null, 2);
  const dateStr = new Date().toISOString().slice(0, 10);
  downloadFile(jsonStr, `paokoo_backup_${dateStr}.json`, 'application/json');
}

/**
 * Exports transactions to CSV formatted for Excel/Sheets (supports Thai UTF-8 with BOM).
 */
export function exportToCSV(transactions: Transaction[]) {
  const typeMap: Record<string, string> = {
    in: 'เงินเข้า (Deposit)',
    out: 'รายจ่าย (Expense)',
    lend: 'ให้ยืม/สำรองจ่าย (Lend)',
    back: 'ได้รับเงินคืน (Repayment)',
  };

  const headers = [
    'ลำดับ',
    'วันที่',
    'ประเภท',
    'หมวดหมู่',
    'จำนวนเงิน (บาท)',
    'จำนวนเงิน (สตางค์)',
    'ผู้ทำรายการ/ผู้ยืม',
    'บันทึก',
    'เลขอ้างอิง',
  ];

  const rows = transactions.map((t, idx) => {
    const categoryName = t.type === 'out' ? (t.category || 'อื่นๆ') : '';
    return [
      idx + 1,
      `"${t.date}"`,
      `"${typeMap[t.type] || t.type}"`,
      `"${categoryName.replace(/"/g, '""')}"`,
      satangToBaht(t.amount).toFixed(2),
      t.amount,
      `"${(t.who || '').replace(/"/g, '""')}"`,
      `"${(t.note || '').replace(/"/g, '""')}"`,
      `"${t.refNo || ''}"`,
    ].join(',');
  });

  // Include UTF-8 BOM so Excel opens Thai characters without garbling
  const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
  const dateStr = new Date().toISOString().slice(0, 10);
  downloadFile(csvContent, `paokoo_transactions_${dateStr}.csv`, 'text/csv;charset=utf-8;');
}

/**
 * Validates and parses imported JSON backup.
 */
export function parseImportJSON(jsonText: string): {
  transactions: Transaction[];
  members?: string[];
  categories?: string[];
} {
  const parsed = JSON.parse(jsonText);
  if (!parsed || !Array.isArray(parsed.transactions)) {
    throw new Error('โครงสร้างไฟล์สำรองข้อมูล JSON ไม่ถูกต้อง');
  }

  const validTransactions: Transaction[] = parsed.transactions.map((tx: any) => ({
    id: tx.id || `tx-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    type: ['in', 'out', 'lend', 'back'].includes(tx.type) ? tx.type : 'out',
    amount: Number(tx.amount) || 0,
    who: String(tx.who || 'ไม่ระบุ'),
    note: String(tx.note || ''),
    category: tx.type === 'out' ? String(tx.category || 'อื่นๆ') : undefined,
    date: String(tx.date || new Date().toISOString().slice(0, 10)),
    refNo: tx.refNo ? String(tx.refNo) : undefined,
    slipThumbnail: tx.slipThumbnail,
    createdAt: tx.createdAt || new Date().toISOString(),
    createdBy: tx.createdBy || 'import',
    updatedAt: tx.updatedAt || new Date().toISOString(),
  }));

  return {
    transactions: validTransactions,
    members: Array.isArray(parsed.members) ? parsed.members : undefined,
    categories: Array.isArray(parsed.categories) ? parsed.categories : undefined,
  };
}
