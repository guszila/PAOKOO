export const DEFAULT_EXPENSE_CATEGORIES = [
  'อาหาร',
  'ค่าบ้าน/ค่าเช่า',
  'ค่าน้ำ-ไฟ-เน็ต',
  'เดินทาง',
  'ของใช้',
  'สุขภาพ',
  'ท่องเที่ยว',
  'อื่นๆ',
];

export const MAX_CATEGORIES = 12;

export const CATEGORY_COLORS: Record<string, string> = {
  'อาหาร': '#EF4444', // Red
  'ค่าบ้าน/ค่าเช่า': '#F97316', // Orange
  'ค่าน้ำ-ไฟ-เน็ต': '#06B6D4', // Cyan
  'เดินทาง': '#3B82F6', // Blue
  'ของใช้': '#8B5CF6', // Purple
  'สุขภาพ': '#10B981', // Emerald
  'ท่องเที่ยว': '#EC4899', // Pink
  'อื่นๆ': '#64748B', // Slate
};

const EXTRA_PALETTE = [
  '#F59E0B',
  '#14B8A6',
  '#6366F1',
  '#84CC16',
  '#D946EF',
  '#0EA5E9',
];

export function getCategoryColor(category: string, index = 0): string {
  if (CATEGORY_COLORS[category]) {
    return CATEGORY_COLORS[category];
  }
  return EXTRA_PALETTE[index % EXTRA_PALETTE.length] || '#94A3B8';
}
