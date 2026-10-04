import { useState, useMemo, useCallback } from 'react';
import { useTransactions } from './hooks/useTransactions';
import { useAuth } from './hooks/useAuth';
import { useHousehold } from './hooks/useHousehold';
import { useTheme } from './hooks/useTheme';
import { Header } from './components/layout/Header';
import { BottomNav, TabType } from './components/layout/BottomNav';
import { PortfolioHero } from './components/overview/PortfolioHero';
import { QuickActions } from './components/overview/QuickActions';
import { AssetSummaryCards } from './components/overview/AssetSummaryCards';
import { RecentTransactions } from './components/overview/RecentTransactions';
import { TransactionListView } from './components/transactions/TransactionListView';
import { AnalyticsView } from './components/analytics/AnalyticsView';
import { SettingsView } from './components/settings/SettingsView';
import { TransactionFormSheet } from './components/form/TransactionFormSheet';
import { AuthModal } from './components/auth/AuthModal';
import { HouseholdModal } from './components/household/HouseholdModal';
import { SlipScannerModal } from './components/scanner/SlipScannerModal';
import { PocketSection } from './components/pockets/PocketSection';
import { PocketModal } from './components/pockets/PocketModal';
import { PocketTopUpModal } from './components/pockets/PocketTopUpModal';
import { Transaction, TransactionType, OutstandingDebtor } from './types/transaction';
import { Pocket, PocketSummary } from './types/pocket';
import { calculateSummary } from './lib/summary';
import { calculatePocketSummaries, calculateMainSavingsBalance } from './lib/pocket';
import { useToast } from './context/ToastContext';
import { formatSatang } from './lib/money';

export function App() {
  // Toast notification hook
  const { showToast } = useToast();

  // Theme management at root
  const { theme, setTheme } = useTheme();

  // Local state hook
  const {
    transactions: localTransactions,
    members: localMembers,
    setMembers: setLocalMembers,
    categories,
    addCategory,
    deleteCategory,
    pockets: localPockets,
    addPocket: addLocalPocket,
    updatePocket: updateLocalPocket,
    deletePocket: deleteLocalPocket,
    isMasked,
    toggleMask,
    summary: localSummary,
    addTransaction: addLocalTx,
    updateTransaction: updateLocalTx,
    deleteTransaction: deleteLocalTx,
    importData,
    resetData,
  } = useTransactions();

  // Cloud Auth & Household hooks
  const { user, login, register, logout, authError } = useAuth();
  const {
    household,
    transactions: cloudTransactions,
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
  } = useHousehold(user);

  // Active transactions: cloud if in household, otherwise local
  const isCloudActive = Boolean(user && household);
  const activeTransactions = isCloudActive ? cloudTransactions : localTransactions;

  // Active categories: cloud household categories if connected, else local categories
  const activeCategories = useMemo(() => {
    if (isCloudActive && household && household.categories && household.categories.length > 0) {
      return household.categories;
    }
    return categories;
  }, [isCloudActive, household, categories]);

  // Unified add category handler
  const handleAddCategory = useCallback(
    (cat: string) => {
      if (isCloudActive) {
        addHouseholdCategory(cat);
      } else {
        addCategory(cat);
      }
      showToast({
        type: 'success',
        title: 'เพิ่มหมวดหมู่สำเร็จ',
        message: `หมวดหมู่ "${cat}"`,
      });
    },
    [isCloudActive, addHouseholdCategory, addCategory, showToast]
  );

  // Unified delete category handler
  const handleDeleteCategory = useCallback(
    (cat: string) => {
      if (isCloudActive) {
        deleteHouseholdCategory(cat);
      } else {
        deleteCategory(cat);
      }
      showToast({
        type: 'delete',
        title: 'ลบหมวดหมู่เรียบร้อยแล้ว',
        message: `หมวดหมู่ "${cat}"`,
      });
    },
    [isCloudActive, deleteHouseholdCategory, deleteCategory, showToast]
  );

  // Local to cloud migration handler
  const handleMigrateLocalToCloud = useCallback(async () => {
    const result = await migrateLocalToCloud(localTransactions, categories);
    if (result.count > 0) {
      showToast({
        type: 'success',
        title: 'ย้ายข้อมูลขึ้นระบบคลาวด์สำเร็จ',
        message: `นำเข้า ${result.count} รายการ เรียบร้อยแล้ว`,
      });
    }
    return result;
  }, [migrateLocalToCloud, localTransactions, categories, showToast]);

  // Active members
  const activeMembers = useMemo(() => {
    if (household && household.memberNames) {
      return Object.values(household.memberNames);
    }
    return localMembers;
  }, [household, localMembers]);

  // Recalculate summary dynamically based on active transactions
  const activeSummary = useMemo(() => {
    if (isCloudActive) {
      return calculateSummary(cloudTransactions);
    }
    return localSummary;
  }, [isCloudActive, cloudTransactions, localSummary]);

  // Active pockets: cloud household pockets if connected, else local pockets
  const activePockets = useMemo(() => {
    if (isCloudActive && household && household.pockets && Array.isArray(household.pockets)) {
      return household.pockets;
    }
    return localPockets;
  }, [isCloudActive, household, localPockets]);

  // Pocket summaries (spent, remaining, percentage)
  const pocketSummaries = useMemo(() => {
    return calculatePocketSummaries(activePockets, activeTransactions);
  }, [activePockets, activeTransactions]);

  // Main savings balance (total bank balance - remaining in pockets)
  const mainSavingsBalance = useMemo(() => {
    return calculateMainSavingsBalance(activeSummary.currentBalance, pocketSummaries);
  }, [activeSummary.currentBalance, pocketSummaries]);

  const [activeTab, setActiveTab] = useState<TabType>('overview');

  // Modal states
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isHouseholdOpen, setIsHouseholdOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [selectedTxForEdit, setSelectedTxForEdit] = useState<Transaction | null>(null);
  const [prefillData, setPrefillData] = useState<{
    type?: TransactionType;
    who?: string;
    amount?: number;
    note?: string;
    category?: string;
    date?: string;
    time?: string;
    refNo?: string;
    slipThumbnail?: string;
    fullSlipBase64?: string;
    pocketId?: string;
  } | null>(null);

  // Pocket modals state
  const [isPocketModalOpen, setIsPocketModalOpen] = useState(false);
  const [selectedPocketForEdit, setSelectedPocketForEdit] = useState<Pocket | null>(null);
  const [isTopUpModalOpen, setIsTopUpModalOpen] = useState(false);
  const [selectedSummaryForTopUp, setSelectedSummaryForTopUp] = useState<PocketSummary | null>(null);

  const handleOpenCreatePocket = useCallback(() => {
    setSelectedPocketForEdit(null);
    setIsPocketModalOpen(true);
  }, []);

  const handleOpenEditPocket = useCallback((pocket: Pocket) => {
    setSelectedPocketForEdit(pocket);
    setIsPocketModalOpen(true);
  }, []);

  const handleOpenTopUpPocket = useCallback((summary: PocketSummary) => {
    setSelectedSummaryForTopUp(summary);
    setIsTopUpModalOpen(true);
  }, []);

  const handleSavePocket = useCallback(
    (data: { name: string; allocatedSatang: number; color: string; icon: string }) => {
      if (selectedPocketForEdit) {
        if (isCloudActive) {
          updateHouseholdPocket(selectedPocketForEdit.id, data);
        } else {
          updateLocalPocket(selectedPocketForEdit.id, data);
        }
        showToast({
          type: 'success',
          title: 'แก้ไขกล่องแบ่งเงินสำเร็จ',
          message: `กล่อง "${data.name}"`,
        });
      } else {
        if (isCloudActive) {
          addHouseholdPocket(data.name, data.allocatedSatang, data.color, data.icon);
        } else {
          addLocalPocket(data.name, data.allocatedSatang, data.color, data.icon);
        }
        showToast({
          type: 'success',
          title: 'สร้างกล่องแบ่งเงินสำเร็จ',
          message: `กล่อง "${data.name}" (${formatSatang(data.allocatedSatang)} ฿)`,
        });
      }
    },
    [selectedPocketForEdit, isCloudActive, updateHouseholdPocket, updateLocalPocket, addHouseholdPocket, addLocalPocket, showToast]
  );

  const handleDeletePocket = useCallback(
    (id: string) => {
      if (isCloudActive) {
        deleteHouseholdPocket(id);
      } else {
        deleteLocalPocket(id);
      }
      showToast({
        type: 'delete',
        title: 'ลบกล่องแบ่งเงินเรียบร้อยแล้ว',
        message: 'กล่องเงินถูกลบออกจากรายการแล้ว',
      });
    },
    [isCloudActive, deleteHouseholdPocket, deleteLocalPocket, showToast]
  );

  const handleTopUpPocket = useCallback(
    (pocketId: string, additionalSatang: number) => {
      const targetPocket = activePockets.find((p) => p.id === pocketId);
      if (!targetPocket) return;
      const newAllocated = targetPocket.allocatedSatang + additionalSatang;
      if (isCloudActive) {
        updateHouseholdPocket(pocketId, { allocatedSatang: newAllocated });
      } else {
        updateLocalPocket(pocketId, { allocatedSatang: newAllocated });
      }
      showToast({
        type: 'success',
        title: 'เติมเงินเข้ากล่องสำเร็จ',
        message: `เติมเงิน +${formatSatang(additionalSatang)} ฿ เข้ากล่อง "${targetPocket.name}"`,
      });
    },
    [activePockets, isCloudActive, updateHouseholdPocket, updateLocalPocket, showToast]
  );

  // Filters State for All Transactions tab
  const [selectedType, setSelectedType] = useState<TransactionType | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('all');

  // Open Form for New Transaction
  const handleOpenAdd = () => {
    setSelectedTxForEdit(null);
    setPrefillData(null);
    setIsFormOpen(true);
  };

  // Apply scanned slip data to prefill form
  const handleApplySlip = (data: {
    amountSatang: number;
    date: string;
    time?: string;
    refNo: string;
    who: string;
    note: string;
    slipThumbnail: string;
    fullSlipBase64: string;
    pocketId?: string;
  }) => {
    setSelectedTxForEdit(null);
    setPrefillData({
      type: 'out',
      amount: data.amountSatang,
      who: data.who || activeMembers[0] || '',
      note: data.note,
      date: data.date,
      time: data.time,
      refNo: data.refNo,
      slipThumbnail: data.slipThumbnail,
      fullSlipBase64: data.fullSlipBase64,
      category: categories[0] || 'อาหาร',
      pocketId: data.pocketId,
    });
    setIsFormOpen(true);
  };

  // Quick Action click (opens form pre-selected with type)
  const handleQuickAction = (type: TransactionType) => {
    setSelectedTxForEdit(null);
    setPrefillData({
      type,
      who: activeMembers[0] || '',
      category: type === 'out' ? categories[0] || 'อาหาร' : undefined,
    });
    setIsFormOpen(true);
  };

  // Open Form for Editing
  const handleSelectTx = (tx: Transaction) => {
    setSelectedTxForEdit(tx);
    setPrefillData(null);
    setIsFormOpen(true);
  };

  // Repaid button clicked on Debtor Card
  const handleRepayClick = (debtor: OutstandingDebtor) => {
    setSelectedTxForEdit(null);
    setPrefillData({
      type: 'back',
      who: debtor.who,
      amount: debtor.balance,
      note: `คืนเงินยืมครบจำนวน (${debtor.who})`,
    });
    setIsFormOpen(true);
  };

  // Helper for transaction type text in toast
  const getTxTypeLabel = (txType: TransactionType) => {
    switch (txType) {
      case 'in':
        return 'ฝากเข้า';
      case 'out':
        return 'รายจ่าย';
      case 'lend':
        return 'ให้ยืม/สำรอง';
      case 'back':
        return 'ได้รับคืน';
    }
  };

  // Save transaction (create or update, routes to cloud if in household)
  const handleSaveTransaction = (
    txData: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>,
    id?: string
  ) => {
    if (isCloudActive) {
      saveCloudTransaction(txData, id);
    } else {
      if (id) {
        updateLocalTx(id, txData);
      } else {
        addLocalTx(txData);
      }
    }

    const typeLabel = getTxTypeLabel(txData.type);
    if (id) {
      showToast({
        type: 'success',
        title: 'แก้ไขรายการสำเร็จ',
        message: `${typeLabel} ${formatSatang(txData.amount)} ฿ (${txData.who})`,
      });
    } else {
      showToast({
        type: 'success',
        title: 'บันทึกรายการสำเร็จ',
        message: `${typeLabel} ${formatSatang(txData.amount)} ฿ (${txData.who})`,
      });
    }
  };

  // Delete transaction
  const handleDeleteTransaction = (id: string) => {
    if (isCloudActive) {
      deleteCloudTransaction(id);
    } else {
      deleteLocalTx(id);
    }
    showToast({
      type: 'delete',
      title: 'ลบรายการเรียบร้อยแล้ว',
      message: 'รายการถูกลบออกจากบัญชีแล้ว',
    });
  };

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark text-neutral-900 dark:text-neutral-100 flex flex-col font-sans transition-colors overflow-x-hidden">
      <Header
        user={user}
        household={household}
        activeTab={activeTab}
        totalTransactions={activeTransactions.length}
        latestDate={activeTransactions[0]?.date}
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenHousehold={() => setIsHouseholdOpen(true)}
      />

      <main className="flex-1 max-w-md w-full mx-auto px-4 pb-28">
        {activeTab === 'overview' && (
          <div className="space-y-4 animate-fade-in">
            {/* 1. Investment Portfolio Hero Card */}
            <PortfolioHero
              currentBalance={activeSummary.currentBalance}
              totalLentOut={activeSummary.totalLentOut}
              grandTotal={activeSummary.grandTotal}
              thisMonthNet={activeSummary.thisMonthNet}
              lastMonthNet={activeSummary.lastMonthNet}
              transactions={activeTransactions}
              isMasked={isMasked}
              onToggleMask={toggleMask}
              pocketSummaries={pocketSummaries}
              mainSavingsBalance={mainSavingsBalance}
            />

            {/* 2. Quick-Action Row (5 actions) */}
            <QuickActions
              onSelectAction={handleQuickAction}
              onOpenScanner={() => setIsScannerOpen(true)}
            />

            {/* 2.5 Spending Pockets (Model 2: กระเป๋าย่อยแบ่งเงินใช้ แบบ MAKE by KBank) */}
            <PocketSection
              pocketSummaries={pocketSummaries}
              onOpenCreate={handleOpenCreatePocket}
              onOpenEdit={handleOpenEditPocket}
              onOpenTopUp={handleOpenTopUpPocket}
              isMasked={isMasked}
            />

            {/* 3. Asset Summary Cards */}
            <AssetSummaryCards
              currentBalance={activeSummary.currentBalance}
              totalLentOut={activeSummary.totalLentOut}
              thisMonthExpenses={activeSummary.thisMonthExpenses}
              thisMonthDeposits={activeSummary.thisMonthDeposits}
              topExpenseCategory={activeSummary.topExpenseCategory}
              debtors={activeSummary.debtors}
              onRepayClick={handleRepayClick}
              isMasked={isMasked}
            />

            {/* 4. 4 Most Recent Transactions with View All */}
            <RecentTransactions
              transactions={activeTransactions}
              onViewAll={() => setActiveTab('transactions')}
              onSelectTx={handleSelectTx}
              pockets={activePockets}
              isMasked={isMasked}
            />
          </div>
        )}

        {activeTab === 'transactions' && (
          <div className="relative -mt-10 space-y-3 z-20 animate-fade-in">
            <TransactionListView
              transactions={activeTransactions}
              onSelectTx={handleSelectTx}
              selectedType={selectedType}
              setSelectedType={setSelectedType}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              selectedMonth={selectedMonth}
              setSelectedMonth={setSelectedMonth}
              categories={activeCategories}
              pockets={activePockets}
              isMasked={isMasked}
            />
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="relative -mt-10 z-20 animate-fade-in">
            <AnalyticsView
              transactions={activeTransactions}
              isMasked={isMasked}
            />
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="relative -mt-10 z-20 animate-fade-in">
            <SettingsView
              theme={theme}
              onThemeChange={setTheme}
              transactions={activeTransactions}
              members={activeMembers}
              categories={activeCategories}
              user={user}
              household={household}
              onOpenAuth={() => setIsAuthOpen(true)}
              onOpenHousehold={() => setIsHouseholdOpen(true)}
              onLogout={logout}
              onUpdateMembers={setLocalMembers}
              onAddCategory={handleAddCategory}
              onDeleteCategory={handleDeleteCategory}
              onImportData={importData}
              onResetData={resetData}
              localTransactionsCount={isCloudActive ? localTransactions.length : 0}
              onMigrateLocalToCloud={handleMigrateLocalToCloud}
            />
          </div>
        )}
      </main>

      {/* Bottom Navigation with 5 Equal Slots and Centered Plus */}
      <BottomNav
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onOpenAdd={handleOpenAdd}
      />

      {/* Add / Edit Form Bottom Sheet */}
      <TransactionFormSheet
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSave={handleSaveTransaction}
        onDelete={handleDeleteTransaction}
        initialTransaction={selectedTxForEdit}
        prefill={prefillData}
        existingTransactions={activeTransactions}
        memberNames={activeMembers}
        categories={activeCategories}
        pockets={activePockets}
        pocketSummaries={pocketSummaries}
        onOpenScanner={() => setIsScannerOpen(true)}
      />

      {/* Slip Scanner Bottom Sheet */}
      <SlipScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        existingTransactions={activeTransactions}
        memberNames={activeMembers}
        pockets={activePockets}
        pocketSummaries={pocketSummaries}
        onApplySlip={handleApplySlip}
      />

      {/* Pocket Create / Edit Modal */}
      <PocketModal
        isOpen={isPocketModalOpen}
        onClose={() => setIsPocketModalOpen(false)}
        pocket={selectedPocketForEdit}
        onSave={handleSavePocket}
        onDelete={handleDeletePocket}
      />

      {/* Pocket Top-Up Modal */}
      <PocketTopUpModal
        isOpen={isTopUpModalOpen}
        onClose={() => setIsTopUpModalOpen(false)}
        pocketSummary={selectedSummaryForTopUp}
        onTopUp={handleTopUpPocket}
      />

      {/* Auth Modal (Login / Register) */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onLogin={login}
        onRegister={register}
        error={authError}
      />

      {/* Household Modal (Create / Join 2 Users) */}
      <HouseholdModal
        isOpen={isHouseholdOpen}
        onClose={() => setIsHouseholdOpen(false)}
        household={household}
        currentUserId={user?.uid}
        onCreateHousehold={createHousehold}
        onJoinHousehold={joinHouseholdWithCode}
        onDisconnect={disconnectHousehold}
        localTransactionsCount={localTransactions.length}
        onMigrateLocalToCloud={handleMigrateLocalToCloud}
      />
    </div>
  );
}

export default App;
