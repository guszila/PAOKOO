import { useState, useMemo } from 'react';
import { useTransactions } from './hooks/useTransactions';
import { useAuth } from './hooks/useAuth';
import { useHousehold } from './hooks/useHousehold';
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
import { Transaction, TransactionType, OutstandingDebtor } from './types/transaction';
import { calculateSummary } from './lib/summary';

export function App() {
  // Local state hook
  const {
    transactions: localTransactions,
    members: localMembers,
    setMembers: setLocalMembers,
    categories,
    addCategory,
    deleteCategory,
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
  } = useHousehold(user);

  // Active transactions: cloud if in household, otherwise local
  const isCloudActive = Boolean(user && household);
  const activeTransactions = isCloudActive ? cloudTransactions : localTransactions;

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
    refNo?: string;
    slipThumbnail?: string;
    fullSlipBase64?: string;
  } | null>(null);

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
    refNo: string;
    who: string;
    note: string;
    slipThumbnail: string;
    fullSlipBase64: string;
  }) => {
    setSelectedTxForEdit(null);
    setPrefillData({
      type: 'out',
      amount: data.amountSatang,
      who: data.who || activeMembers[0] || '',
      note: data.note,
      date: data.date,
      refNo: data.refNo,
      slipThumbnail: data.slipThumbnail,
      fullSlipBase64: data.fullSlipBase64,
      category: categories[0] || 'อาหาร',
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
  };

  // Delete transaction
  const handleDeleteTransaction = (id: string) => {
    if (isCloudActive) {
      deleteCloudTransaction(id);
    } else {
      deleteLocalTx(id);
    }
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
            />

            {/* 2. Quick-Action Row (5 actions) */}
            <QuickActions
              onSelectAction={handleQuickAction}
              onOpenScanner={() => setIsScannerOpen(true)}
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
              categories={categories}
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
              transactions={activeTransactions}
              members={activeMembers}
              categories={categories}
              user={user}
              household={household}
              onOpenAuth={() => setIsAuthOpen(true)}
              onOpenHousehold={() => setIsHouseholdOpen(true)}
              onLogout={logout}
              onUpdateMembers={setLocalMembers}
              onAddCategory={addCategory}
              onDeleteCategory={deleteCategory}
              onImportData={importData}
              onResetData={resetData}
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
        categories={categories}
        onOpenScanner={() => setIsScannerOpen(true)}
      />

      {/* Slip Scanner Bottom Sheet */}
      <SlipScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        existingTransactions={activeTransactions}
        memberNames={activeMembers}
        onApplySlip={handleApplySlip}
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
      />
    </div>
  );
}

export default App;
