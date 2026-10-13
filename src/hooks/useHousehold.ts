import { useState, useEffect, useCallback } from 'react';
import { User } from 'firebase/auth';
import {
  doc,
  collection,
  onSnapshot,
  setDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  serverTimestamp,
  writeBatch,
  deleteField,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { Household } from '../types/household';
import { Transaction } from '../types/transaction';
import { Pocket } from '../types/pocket';
import { DEFAULT_EXPENSE_CATEGORIES, MAX_CATEGORIES } from '../config/categories';
import { sortTransactionsChronological } from '../lib/summary';

export function useHousehold(user: User | null) {
  const [household, setHousehold] = useState<Household | null>(null);
  const [householdId, setHouseholdId] = useState<string | null>(() => {
    return localStorage.getItem('paokoo_household_id') || null;
  });
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'offline' | 'synced' | 'connecting'>('offline');
  const [householdError, setHouseholdError] = useState<string | null>(null);

  // Generate 6-char random alphanumeric code: e.g. "PK-8492"
  const generateInviteCode = (): string => {
    const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
    let code = '';
    for (let i = 0; i < 4; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `PK-${code}`;
  };

  // 1. Listen to Household Document
  useEffect(() => {
    if (!user || !householdId) {
      setHousehold(null);
      setSyncStatus('offline');
      return;
    }

    setIsSyncing(true);
    const householdRef = doc(db, 'households', householdId);

    const unsubscribe = onSnapshot(
      householdRef,
      (docSnap) => {
        setIsSyncing(false);
        if (docSnap.exists()) {
          const data = docSnap.data() as Household;
          setHousehold({
            ...data,
            id: docSnap.id,
            categories:
              data.categories && Array.isArray(data.categories) && data.categories.length > 0
                ? data.categories
                : DEFAULT_EXPENSE_CATEGORIES,
            pockets: Array.isArray(data.pockets) ? data.pockets : [],
          });
          setSyncStatus('synced');
          localStorage.setItem('paokoo_household_id', docSnap.id);
        } else {
          setHousehold(null);
          setSyncStatus('offline');
        }
      },
      (error) => {
        console.error('Household snapshot error:', error);
        setIsSyncing(false);
        setSyncStatus('offline');
      }
    );

    return () => unsubscribe();
  }, [user, householdId]);

  // 2. Listen to Transactions Subcollection
  useEffect(() => {
    if (!user || !householdId) return;

    const txsRef = collection(db, 'households', householdId, 'transactions');

    const unsubscribe = onSnapshot(
      txsRef,
      (querySnap) => {
        const list: Transaction[] = [];
        querySnap.forEach((docSnap) => {
          const data = docSnap.data();
          list.push({
            id: docSnap.id,
            type: data.type,
            amount: data.amount,
            who: data.who,
            note: data.note || '',
            category: data.category,
            pocketId: data.pocketId,
            date: data.date,
            time: data.time,
            refNo: data.refNo,
            slipThumbnail: data.slipThumbnail,
            hasFullSlip: data.hasFullSlip,
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt || '',
            createdBy: data.createdBy || '',
            updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : data.updatedAt || '',
            updatedBy: data.updatedBy,
          });
        });

        // Sort newest first chronologically (date + time)
        setTransactions(sortTransactionsChronological(list));
      },
      (error) => {
        console.error('Transactions snapshot error:', error);
      }
    );

    return () => unsubscribe();
  }, [user, householdId]);

  // Create new household (User 1)
  const createHousehold = async (name: string, myName: string) => {
    if (!user) throw new Error('กรุณาเข้าสู่ระบบก่อนสร้างบัญชีคู่');
    setHouseholdError(null);

    const newId = `hh-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const inviteCode = generateInviteCode();
    const now = new Date().toISOString();

    const newHousehold: Household = {
      id: newId,
      name: name.trim() || 'บัญชีคู่ของเรา',
      members: [user.uid],
      memberNames: { [user.uid]: myName.trim() || user.displayName || 'ฉัน' },
      inviteCode,
      isLocked: false,
      createdAt: now,
      updatedAt: now,
    };

    try {
      // 1. Create household doc
      await setDoc(doc(db, 'households', newId), {
        ...newHousehold,
        categories: DEFAULT_EXPENSE_CATEGORIES,
      });

      // 2. Create invite code lookup doc
      await setDoc(doc(db, 'invites', inviteCode), {
        householdId: newId,
        createdAt: serverTimestamp(),
        used: false,
      });

      setHouseholdId(newId);
      setHousehold(newHousehold);
      localStorage.setItem('paokoo_household_id', newId);
      return newHousehold;
    } catch (err: any) {
      setHouseholdError(err.message || 'สร้างบัญชีคู่ไม่สำเร็จ');
      throw err;
    }
  };

  // Join household via invite code (User 2)
  const joinHouseholdWithCode = async (code: string, myName: string) => {
    if (!user) throw new Error('กรุณาเข้าสู่ระบบก่อนเข้าร่วมบัญชีคู่');
    setHouseholdError(null);

    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode) throw new Error('กรุณากรอกรหัสเชิญ');

    try {
      // 1. Lookup code
      const inviteRef = doc(db, 'invites', cleanCode);
      const inviteSnap = await getDoc(inviteRef);

      if (!inviteSnap.exists()) {
        throw new Error('ไม่พบรหัสเชิญนี้ หรือรหัสไม่ถูกต้อง');
      }

      const { householdId: targetHouseholdId } = inviteSnap.data() as { householdId: string };
      const hhRef = doc(db, 'households', targetHouseholdId);
      const hhSnap = await getDoc(hhRef);

      if (!hhSnap.exists()) {
        throw new Error('ไม่พบบัญชีคู่เป้าหมาย');
      }

      const hhData = hhSnap.data() as Household;

      // Check if already in household
      if (hhData.members.includes(user.uid)) {
        setHouseholdId(targetHouseholdId);
        localStorage.setItem('paokoo_household_id', targetHouseholdId);
        return hhData;
      }

      // Check if full (max 2)
      if (hhData.members.length >= 2 || hhData.isLocked) {
        throw new Error('บัญชีคู่นี้มีสมาชิกครบ 2 คนแล้ว (ถูกล็อกเพื่อความปลอดภัย)');
      }

      // Add user as 2nd member and lock
      const updatedMembers = [...hhData.members, user.uid];
      const updatedMemberNames = {
        ...hhData.memberNames,
        [user.uid]: myName.trim() || user.displayName || 'คู่ของฉัน',
      };

      await updateDoc(hhRef, {
        members: updatedMembers,
        memberNames: updatedMemberNames,
        isLocked: true, // locked permanently to 2 users
        updatedAt: new Date().toISOString(),
      });

      // Mark invite used
      await updateDoc(inviteRef, { used: true });

      setHouseholdId(targetHouseholdId);
      localStorage.setItem('paokoo_household_id', targetHouseholdId);
      return { ...hhData, members: updatedMembers, isLocked: true };
    } catch (err: any) {
      setHouseholdError(err.message || 'เข้าร่วมไม่สำเร็จ');
      throw err;
    }
  };

  // Add / Edit transaction in cloud
  const saveCloudTransaction = useCallback(
    async (
      txData: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>,
      id?: string
    ) => {
      if (!householdId || !user) return;

      const now = new Date().toISOString();
      const txId = id || `tx-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const txDocRef = doc(db, 'households', householdId, 'transactions', txId);

      // Build clean payload without any undefined values (Firestore rejects undefined)
      const payload: Record<string, any> = {
        id: txId,
        type: txData.type,
        amount: txData.amount,
        who: txData.who,
        note: txData.note || '',
        date: txData.date,
        updatedAt: now,
        updatedBy: user.uid,
      };

      if (txData.category) {
        payload.category = txData.category;
      } else if (id) {
        payload.category = deleteField();
      }

      if (txData.pocketId) {
        payload.pocketId = txData.pocketId;
      } else if (id) {
        payload.pocketId = deleteField();
      }
      if (txData.refNo) payload.refNo = txData.refNo;
      if (txData.slipThumbnail) payload.slipThumbnail = txData.slipThumbnail;
      if (txData.hasFullSlip !== undefined) payload.hasFullSlip = txData.hasFullSlip;
      if (!id) {
        payload.createdAt = now;
        payload.createdBy = user.uid;
      }

      await setDoc(txDocRef, payload, { merge: true });
    },
    [householdId, user]
  );

  // Delete transaction in cloud
  const deleteCloudTransaction = useCallback(
    async (id: string) => {
      if (!householdId) return;
      await deleteDoc(doc(db, 'households', householdId, 'transactions', id));
    },
    [householdId]
  );

  // Leave / Disconnect household locally
  const disconnectHousehold = () => {
    localStorage.removeItem('paokoo_household_id');
    setHouseholdId(null);
    setHousehold(null);
  };

  // Add category to household in Firestore
  const addHouseholdCategory = useCallback(
    async (cat: string) => {
      if (!householdId || !user) return;
      const trimmed = cat.trim();
      if (!trimmed) return;
      const current = household?.categories || DEFAULT_EXPENSE_CATEGORIES;
      if (current.includes(trimmed) || current.length >= MAX_CATEGORIES) return;

      const updated = [...current, trimmed];
      await updateDoc(doc(db, 'households', householdId), {
        categories: updated,
        updatedAt: new Date().toISOString(),
      });
    },
    [householdId, user, household]
  );

  // Delete category from household in Firestore
  const deleteHouseholdCategory = useCallback(
    async (catToDelete: string) => {
      if (!householdId || !user) return;
      const current = household?.categories || DEFAULT_EXPENSE_CATEGORIES;
      if (current.length <= 1) return; // Keep at least 1 category

      const updated = current.filter((c) => c !== catToDelete);
      await updateDoc(doc(db, 'households', householdId), {
        categories: updated,
        updatedAt: new Date().toISOString(),
      });
    },
    [householdId, user, household]
  );

  // Add pocket to household
  const addHouseholdPocket = useCallback(
    async (name: string, allocatedSatang: number, color?: string, icon?: string) => {
      if (!householdId || !user) return;
      const now = new Date().toISOString();
      const newPocket: Pocket = {
        id: `pocket-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        name: name.trim() || 'เงินแบ่งใช้',
        allocatedSatang: Math.max(0, Math.round(allocatedSatang)),
        color: color || '#10B981',
        icon: icon || 'wallet',
        createdAt: now,
        updatedAt: now,
      };
      const current = household?.pockets || [];
      const updated = [...current, newPocket];
      await updateDoc(doc(db, 'households', householdId), {
        pockets: updated,
        updatedAt: now,
      });
      return newPocket;
    },
    [householdId, user, household]
  );

  // Update pocket in household
  const updateHouseholdPocket = useCallback(
    async (id: string, updates: Partial<Omit<Pocket, 'id' | 'createdAt'>>) => {
      if (!householdId || !user) return;
      const now = new Date().toISOString();
      const current = household?.pockets || [];
      const updated = current.map((p) =>
        p.id === id ? { ...p, ...updates, updatedAt: now } : p
      );
      await updateDoc(doc(db, 'households', householdId), {
        pockets: updated,
        updatedAt: now,
      });
    },
    [householdId, user, household]
  );

  // Delete pocket from household
  const deleteHouseholdPocket = useCallback(
    async (id: string) => {
      if (!householdId || !user) return;
      const current = household?.pockets || [];
      const updated = current.filter((p) => p.id !== id);
      await updateDoc(doc(db, 'households', householdId), {
        pockets: updated,
        updatedAt: new Date().toISOString(),
      });
    },
    [householdId, user, household]
  );

  // Migrate local transactions to cloud household
  const migrateLocalToCloud = useCallback(
    async (
      localTxs: Transaction[],
      localCategories?: string[]
    ): Promise<{ count: number }> => {
      if (!householdId || !user) {
        throw new Error('ยังไม่ได้เชื่อมต่อบัญชีคู่');
      }

      if (!localTxs || localTxs.length === 0) {
        return { count: 0 };
      }

      const existingIds = new Set(transactions.map((t) => t.id));
      const toMigrate = localTxs.filter((tx) => !existingIds.has(tx.id));

      if (toMigrate.length === 0) {
        return { count: 0 };
      }

      const now = new Date().toISOString();

      // Chunk in batches of 400 (Firestore limit is 500 per batch)
      const CHUNK_SIZE = 400;
      for (let i = 0; i < toMigrate.length; i += CHUNK_SIZE) {
        const chunk = toMigrate.slice(i, i + CHUNK_SIZE);
        const batch = writeBatch(db);

        for (const tx of chunk) {
          const txDocRef = doc(db, 'households', householdId, 'transactions', tx.id);
          const payload: Record<string, any> = {
            id: tx.id,
            type: tx.type,
            amount: Math.round(tx.amount),
            who: tx.who.trim(),
            note: tx.note || '',
            date: tx.date,
            createdAt: tx.createdAt || now,
            createdBy: user.uid,
            updatedAt: now,
            updatedBy: user.uid,
          };

          if (tx.time) payload.time = tx.time;
          if (tx.category) payload.category = tx.category;
          if (tx.pocketId) payload.pocketId = tx.pocketId;
          if (tx.refNo) payload.refNo = tx.refNo;
          if (tx.slipThumbnail) payload.slipThumbnail = tx.slipThumbnail;
          if (tx.hasFullSlip !== undefined) payload.hasFullSlip = tx.hasFullSlip;

          batch.set(txDocRef, payload, { merge: true });
        }

        await batch.commit();
      }

      // Merge local categories into household if any new ones exist
      if (localCategories && localCategories.length > 0) {
        const currentCats = household?.categories || DEFAULT_EXPENSE_CATEGORIES;
        const mergedSet = new Set([...currentCats, ...localCategories]);
        const mergedList = Array.from(mergedSet).slice(0, MAX_CATEGORIES);
        if (mergedList.length > currentCats.length) {
          await updateDoc(doc(db, 'households', householdId), {
            categories: mergedList,
            updatedAt: now,
          });
        }
      }

      return { count: toMigrate.length };
    },
    [householdId, user, transactions, household]
  );

  return {
    household,
    householdId,
    transactions,
    isSyncing,
    syncStatus,
    householdError,
    createHousehold,
    joinHouseholdWithCode,
    saveCloudTransaction,
    deleteCloudTransaction,
    disconnectHousehold,
    addHouseholdCategory,
    deleteHouseholdCategory,
    addHouseholdPocket,
    updateHouseholdPocket,
    deleteHouseholdPocket,
    migrateLocalToCloud,
  };
}
