/**
 * Bank of Thailand (BOT) Standard 3-digit Financial Institution Codes
 */
export const THAI_BANK_CODES: Record<string, { name: string; shortName: string; color: string }> = {
  '002': { name: 'ธนาคารกรุงเทพ', shortName: 'BBL', color: '#1e4598' },
  '004': { name: 'ธนาคารกสิกรไทย', shortName: 'KBANK', color: '#138f2d' },
  '006': { name: 'ธนาคารกรุงไทย', shortName: 'KTB', color: '#00a5e5' },
  '011': { name: 'ธนาคารทหารไทยธนชาต', shortName: 'TTB', color: '#002d63' },
  '014': { name: 'ธนาคารไทยพาณิชย์', shortName: 'SCB', color: '#4e2e7f' },
  '025': { name: 'ธนาคารกรุงศรีอยุธยา', shortName: 'BAY', color: '#fec43b' },
  '030': { name: 'ธนาคารออมสิน', shortName: 'GSB', color: '#eb1985' },
  '034': { name: 'ธนาคารเพื่อการเกษตรและสหกรณ์การเกษตร', shortName: 'BAAC', color: '#4b9b38' },
  '069': { name: 'ธนาคารเกียรตินาคินภัทร', shortName: 'KKP', color: '#199ccb' },
  '073': { name: 'ธนาคารแลนด์ แอนด์ เฮ้าส์', shortName: 'LH Bank', color: '#6d6e71' },
  '065': { name: 'ธนาคารธนชาต', shortName: 'TBANK', color: '#f15a22' },
  '067': { name: 'ธนาคารทิสโก้', shortName: 'TISCO', color: '#004f9e' },
  '022': { name: 'ธนาคารซีไอเอ็มบี ไทย', shortName: 'CIMB', color: '#7e1518' },
  '024': { name: 'ธนาคารยูโอบี', shortName: 'UOB', color: '#0b2265' },
};

export function getBankInfo(code?: string) {
  if (!code) return null;
  const clean = code.trim().padStart(3, '0');
  return THAI_BANK_CODES[clean] || { name: `ธนาคารรหัส ${code}`, shortName: code, color: '#0f766e' };
}
