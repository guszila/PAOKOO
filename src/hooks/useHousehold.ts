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
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { Household } from '../types/household';
import { Transaction } from '../types/transaction';
import { DEFAULT_EXPENSE_CATEGORIES } from '../config/categories';

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
          setHousehold({ ...data, id: docSnap.id });
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
            date: data.date,
            refNo: data.refNo,
            slipThumbnail: data.slipThumbnail,
            hasFullSlip: data.hasFullSlip,
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt || '',
            createdBy: data.createdBy || '',
            updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : data.updatedAt || '',
            updatedBy: data.updatedBy,
          });
        });

        // Sort newest first
        list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime() || b.id.localeCompare(a.id));
        setTransactions(list);
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

      if (txData.category) payload.category = txData.category;
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
  };
}
