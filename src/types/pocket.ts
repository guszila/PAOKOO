export interface Pocket {
  id: string;
  name: string; // e.g. "เงินแบ่งใช้", "ค่ากินประจำสัปดาห์"
  allocatedSatang: number; // e.g. 200000 satang (2,000 Baht)
  color?: string; // color theme: emerald, amber, purple, blue, rose
  icon?: string; // icon name: wallet, shopping-bag, coffee, utensils, car, plane
  createdAt: string;
  updatedAt: string;
}

export interface PocketSummary {
  pocket: Pocket;
  spentSatang: number;
  remainingSatang: number;
  spentPercentage: number;
}
