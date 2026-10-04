/**
 * Emoji mappings, categories, and helpers for expenses in PAOKOO
 */

export const CATEGORY_EMOJIS: Record<string, string> = {
  'อาหาร': '🍜',
  'ค่าบ้าน/ค่าเช่า': '🏠',
  'ค่าน้ำ-ไฟ-เน็ต': '⚡',
  'เดินทาง': '🚗',
  'ของใช้': '🛒',
  'สุขภาพ': '💊',
  'ท่องเที่ยว': '✈️',
  'อื่นๆ': '🏷️',
};

// Top popular quick emojis shown directly above the note field in expense form
export const POPULAR_EXPENSE_EMOJIS = [
  '🍜', '🍔', '☕', '🧋', '🍱',
  '🚗', '🛵', '⛽', '🛒', '🛍️',
  '🏠', '⚡', '💧', '🎬', '🎮',
  '💊', '🐾', '✈️', '🎁', '💸',
];

// Categorized emojis for expanded picker
export const EXPENSE_EMOJI_GROUPS = [
  {
    name: 'อาหาร & เครื่องดื่ม',
    icon: '🍜',
    emojis: ['🍜', '🍲', '🍛', '🍣', '🍱', '🍔', '🍕', '🍟', '🌮', '🥪', '🥩', '🍳', '🍞', '☕', '🧋', '🥤', '🧃', '🍺', '🍰', '🍦', '🍩'],
  },
  {
    name: 'เดินทาง & รถยนต์',
    icon: '🚗',
    emojis: ['🚗', '🛵', '🚲', '🚕', '🚌', '🚆', '✈️', '⛽', '🅿️', '🚖', '🚘', '🛴', '🚤', '🎫'],
  },
  {
    name: 'ช้อปปิ้ง & ของใช้',
    icon: '🛒',
    emojis: ['🛒', '🛍️', '👕', '👗', '👟', '🧴', '💄', '📱', '💻', '📦', '🏪', '🏬', '🎁', '📚'],
  },
  {
    name: 'บิล & ที่อยู่อาศัย',
    icon: '🏠',
    emojis: ['🏠', '🏢', '⚡', '💧', '📶', '🛋️', '🧹', '🔧', '🔑', '🛡️'],
  },
  {
    name: 'บันเทิง & พักผ่อน',
    icon: '🎬',
    emojis: ['🎬', '🎮', '🎧', '🎤', '🏖️', '🏕️', '🏨', '🎡', '🍻', '🎉', '⚽', '🏸'],
  },
  {
    name: 'สุขภาพ & สัตว์เลี้ยง',
    icon: '💊',
    emojis: ['💊', '🏥', '🦷', '👓', '🏋️', '🧘', '🐾', '🐶', '🐱', '💈', '✂️'],
  },
];

/**
 * Extracts the first emoji from a text string, or returns null if none found
 */
export function extractEmoji(text?: string): string | null {
  if (!text) return null;
  const match = text.match(/\p{Extended_Pictographic}(\uFE0F|\u200D\p{Extended_Pictographic})*/u);
  return match ? match[0] : null;
}

/**
 * Returns the emoji for a given category name
 */
export function getCategoryEmoji(category?: string): string {
  if (!category) return '💸';
  const existing = extractEmoji(category);
  if (existing) return existing;
  return CATEGORY_EMOJIS[category.trim()] || '🏷️';
}

/**
 * Prepend or replace the leading emoji in a note text
 */
export function setLeadingEmoji(note: string, emoji: string): string {
  const trimmed = note.trim();
  const currentEmoji = extractEmoji(trimmed);
  if (currentEmoji && trimmed.startsWith(currentEmoji)) {
    // Replace leading emoji
    const rest = trimmed.slice(currentEmoji.length).trimStart();
    return `${emoji} ${rest}`;
  }
  if (!trimmed) {
    return `${emoji} `;
  }
  return `${emoji} ${trimmed}`;
}

/**
 * Detect merchant / keywords in slip text and return an appropriate emoji
 */
export function detectSlipEmoji(text: string): string | null {
  if (!text) return null;
  const lower = text.toLowerCase();

  if (/cafe|amazon|inthanin|starbucks|ชา|กาแฟ|coffee|tea/i.test(lower)) return '☕';
  if (/7-eleven|cp all|เซเว่น|seven/i.test(lower)) return '🏪';
  if (/ptt|shell|bangchak|บางจาก|ปตท|caltex|esso|น้ำมัน|gas/i.test(lower)) return '⛽';
  if (/lotus|big c|makro|โลตัส|บิ๊กซี|แม็คโคร|tops|cj express/i.test(lower)) return '🛒';
  if (/grab|lineman|foodpanda|robinhood|shopeefood|delivery/i.test(lower)) return '🛵';
  if (/shopee|lazada|tiktok shop/i.test(lower)) return '🛍️';
  if (/โรงพยาบาล|hospital|clinic|คลินิก|pharmacy|ยา/i.test(lower)) return '💊';
  if (/ค่าไฟ|การไฟฟ|mea|pea/i.test(lower)) return '⚡';
  if (/ค่าน้ำ|การประปา|mwa|pwa/i.test(lower)) return '💧';
  if (/true|ais|dtac|3bb|nt broadband/i.test(lower)) return '📶';
  if (/cinema|major|sf cinema|ตั๋วหนัง/i.test(lower)) return '🎬';

  return null;
}
