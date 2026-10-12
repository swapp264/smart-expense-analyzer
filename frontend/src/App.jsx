import React, { useState, useEffect, useCallback } from 'react';
import Navbar from './components/Navbar';
import SummaryCards from './components/SummaryCards';
import BudgetAlertBanner from './components/BudgetAlertBanner';
import ForecastCard from './components/ForecastCard';
import ChartsSection from './components/ChartsSection';
import TransactionList from './components/TransactionList';
import TransactionModal from './components/TransactionModal';
import BudgetModal from './components/BudgetModal';
import DatasetInfoModal from './components/DatasetInfoModal';
import {
  fetchSummary,
  fetchTransactions,
  fetchForecast,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  updateBudget,
  seedDemoData,
  resetAllData
} from './api';
import { AlertCircle, CheckCircle2, Loader2, Sparkles, Database } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [summary, setSummary] = useState(null);
  const [forecast, setForecast] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSeeding, setIsSeeding] = useState(false);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [transactionToEdit, setTransactionToEdit] = useState(null);
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [isDatasetModalOpen, setIsDatasetModalOpen] = useState(false);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Load all app data concurrently
  const loadAllData = useCallback(async () => {
    try {
      setError(null);
      const [summaryRes, forecastRes, txRes] = await Promise.all([
        fetchSummary(),
        fetchForecast(),
        fetchTransactions()
      ]);
      setSummary(summaryRes);
      setForecast(forecastRes);
      setTransactions(txRes.transactions || []);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError(err.message || 'Failed to communicate with Flask backend.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // Handle saving transaction (Add or Edit)
  const handleSaveTransaction = async (txData) => {
    try {
      if (txData.id) {
        await updateTransaction(txData.id, txData);
        showToast('Transaction updated successfully!');
      } else {
        await createTransaction(txData);
        showToast('New transaction added successfully!');
      }
      setIsAddModalOpen(false);
      setTransactionToEdit(null);
      await loadAllData();
    } catch (err) {
      showToast(err.message || 'Failed to save transaction', 'error');
    }
  };

  // Handle deleting transaction
  const handleDeleteTransaction = async (id) => {
    try {
      await deleteTransaction(id);
      showToast('Transaction removed.');
      await loadAllData();
    } catch (err) {
      showToast(err.message || 'Failed to delete transaction', 'error');
    }
  };

  // Handle updating monthly budget
  const handleSaveBudget = async (newBudget) => {
    try {
      await updateBudget(newBudget);
      showToast(`Monthly budget set to $${newBudget.toLocaleString()}`);
      setIsBudgetModalOpen(false);
      await loadAllData();
    } catch (err) {
      showToast(err.message || 'Failed to update budget', 'error');
    }
  };

  // Handle Seeding Demo Data
  const handleSeedDemo = async () => {
    try {
      setIsSeeding(true);
      const res = await seedDemoData();
      showToast(res.message || 'Loaded 6 months of demo transactions!');
      await loadAllData();
    } catch (err) {
      showToast(err.message || 'Failed to seed demo data', 'error');
    } finally {
      setIsSeeding(false);
    }
  };

  // Handle Reset Data
  const handleResetData = async () => {
    try {
      await resetAllData();
      showToast('All transaction records cleared.');
      await loadAllData();
    } catch (err) {
      showToast(err.message || 'Failed to reset data', 'error');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col selection:bg-emerald-100 selection:text-emerald-900">
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenAddModal={() => {
          setTransactionToEdit(null);
          setIsAddModalOpen(true);
        }}
        onSeedDemo={handleSeedDemo}
        onResetData={handleResetData}
        onOpenDatasetModal={() => setIsDatasetModalOpen(true)}
        isSeeding={isSeeding}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Toast Alert */}
        {toast && (
          <div
            className={`fixed bottom-5 right-5 z-50 flex items-center gap-2 px-4 py-3 rounded-2xl shadow-xl border text-xs sm:text-sm font-semibold transition-all animate-in slide-in-from-bottom duration-200 ${
              toast.type === 'error'
                ? 'bg-rose-50 border-rose-200 text-rose-800'
                : 'bg-emerald-50 border-emerald-200 text-emerald-850'
            }`}
          >
            {toast.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-rose-600" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            )}
            <span>{toast.message}</span>
          </div>
        )}

        {/* Global Error Banner */}
        {error && (
          <div className="mb-6 rounded-2xl bg-rose-50 border border-rose-200 p-4 flex items-center justify-between text-rose-800 text-xs sm:text-sm">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
              <span>{error}</span>
            </div>
            <button
              onClick={loadAllData}
              className="px-3 py-1 rounded-lg bg-rose-600 text-white font-medium hover:bg-rose-700 text-xs"
            >
              Retry
            </button>
          </div>
        )}

        {loading ? (
          /* Loading State */
          <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3 text-slate-500">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
            <p className="text-sm font-medium">Connecting to SmartSpend API & SQLite Database...</p>
          </div>
        ) : (
          <>
            {/* Budget Alert Banner */}
            <BudgetAlertBanner
              summary={summary}
              onEditBudget={() => setIsBudgetModalOpen(true)}
            />

            {/* View 1: Dashboard */}
            {activeTab === 'dashboard' && (
              <div>
                {/* Metric Summary Cards */}
                <SummaryCards
                  summary={summary}
                  onEditBudget={() => setIsBudgetModalOpen(true)}
                />

                {/* Machine Learning Next-Month Expense Forecast */}
                <ForecastCard
                  forecast={forecast}
                  onSeedDemo={handleSeedDemo}
                />

                {/* Recharts Data Visualization (Monthly Trends & Category Donut) */}
                <ChartsSection
                  summary={summary}
                  forecast={forecast}
                />

                {/* Recent Transactions Preview Section */}
                <div>
                  <div className="flex items-center justify-between mb-3 px-1">
                    <h3 className="font-bold text-slate-900 text-base">Recent Transactions</h3>
                    <button
                      onClick={() => setActiveTab('transactions')}
                      className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 transition-colors"
                    >
                      View All Transactions ({transactions.length}) →
                    </button>
                  </div>

                  <TransactionList
                    transactions={transactions}
                    onAddTransaction={() => {
                      setTransactionToEdit(null);
                      setIsAddModalOpen(true);
                    }}
                    onEditTransaction={(tx) => {
                      setTransactionToEdit(tx);
                      setIsAddModalOpen(true);
                    }}
                    onDeleteTransaction={handleDeleteTransaction}
                    onSeedDemo={handleSeedDemo}
                  />
                </div>
              </div>
            )}

            {/* View 2: Full Transaction Register */}
            {activeTab === 'transactions' && (
              <div>
                <TransactionList
                  transactions={transactions}
                  onAddTransaction={() => {
                    setTransactionToEdit(null);
                    setIsAddModalOpen(true);
                  }}
                  onEditTransaction={(tx) => {
                    setTransactionToEdit(tx);
                    setIsAddModalOpen(true);
                  }}
                  onDeleteTransaction={handleDeleteTransaction}
                  onSeedDemo={handleSeedDemo}
                />
              </div>
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200/60 bg-white py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700">Smart Expense Analyzer</span>
            <span>•</span>
            <span>React + Vite, Tailwind CSS, Flask, SQLite, Scikit-Learn</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsDatasetModalOpen(true)}
              className="text-slate-600 hover:text-emerald-600 transition-colors flex items-center gap-1"
            >
              <Database className="w-3.5 h-3.5 text-purple-600" />
              <span>Real Kaggle Dataset (12,135 Samples)</span>
            </button>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <TransactionModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setTransactionToEdit(null);
        }}
        onSave={handleSaveTransaction}
        transactionToEdit={transactionToEdit}
      />

      <BudgetModal
        isOpen={isBudgetModalOpen}
        onClose={() => setIsBudgetModalOpen(false)}
        currentBudget={summary?.monthly_budget || 2500}
        onSaveBudget={handleSaveBudget}
      />

      <DatasetInfoModal
        isOpen={isDatasetModalOpen}
        onClose={() => setIsDatasetModalOpen(false)}
      />
    </div>
  );
}
