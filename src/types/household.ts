export interface HouseholdMember {
  uid: string;
  name: string;
  email?: string;
  avatarUrl?: string;
}

export interface Household {
  id: string;
  name: string;
  members: string[]; // max 2 UIDs
  memberNames: Record<string, string>; // { [uid]: name }
  inviteCode: string; // e.g. "PK-8492"
  isLocked: boolean;
  createdAt: string;
  updatedAt: string;
}
