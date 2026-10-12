import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Plus,
  Trash2,
  Edit2,
  Calendar,
  Tag,
  ArrowUpRight,
  ArrowDownRight,
  Receipt,
  X
} from 'lucide-react';

const CATEGORY_BADGES = {
  'Food & Dining': 'bg-emerald-50 text-emerald-700 border-emerald-200/60',
  'Bills & Utilities': 'bg-blue-50 text-blue-700 border-blue-200/60',
  'Shopping': 'bg-amber-50 text-amber-700 border-amber-200/60',
  'Transportation': 'bg-purple-50 text-purple-700 border-purple-200/60',
  'Investment': 'bg-cyan-50 text-cyan-700 border-cyan-200/60',
  'Entertainment': 'bg-pink-50 text-pink-700 border-pink-200/60',
  'Health & Medical': 'bg-rose-50 text-rose-700 border-rose-200/60',
  'Income': 'bg-emerald-100 text-emerald-800 border-emerald-300/60',
  'Other': 'bg-slate-100 text-slate-700 border-slate-200'
};

const ALL_CATEGORIES = [
  'All',
  'Food & Dining',
  'Shopping',
  'Transportation',
  'Bills & Utilities',
  'Investment',
  'Entertainment',
  'Health & Medical',
  'Income',
  'Other'
];

export default function TransactionList({
  transactions,
  onAddTransaction,
  onEditTransaction,
  onDeleteTransaction,
  onSeedDemo
}) {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all'); // 'all', 'expense', 'income'
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  // Client-side filtering & sorting
  const filtered = useMemo(() => {
    return transactions.filter((tx) => {
      // Search
      if (search.trim()) {
        const query = search.toLowerCase();
        const matchesTitle = tx.title?.toLowerCase().includes(query);
        const matchesCat = tx.category?.toLowerCase().includes(query);
        if (!matchesTitle && !matchesCat) return false;
      }
      // Type
      if (typeFilter !== 'all' && tx.type !== typeFilter) return false;
      // Category
      if (categoryFilter !== 'All' && tx.category !== categoryFilter) return false;
      // Dates
      if (startDate && tx.date < startDate) return false;
      if (endDate && tx.date > endDate) return false;

      return true;
    });
  }, [transactions, search, typeFilter, categoryFilter, startDate, endDate]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
  const paginated = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filtered.slice(start, start + itemsPerPage);
  }, [filtered, currentPage]);

  const hasActiveFilters = search || typeFilter !== 'all' || categoryFilter !== 'All' || startDate || endDate;

  const clearFilters = () => {
    setSearch('');
    setTypeFilter('all');
    setCategoryFilter('All');
    setStartDate('');
    setEndDate('');
    setCurrentPage(1);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 mb-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <h3 className="font-bold text-slate-900 text-base sm:text-lg">Transaction History</h3>
          <p className="text-xs text-slate-500">
            Showing {filtered.length} recorded transaction{filtered.length === 1 ? '' : 's'}
          </p>
        </div>

        <button
          onClick={onAddTransaction}
          className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs flex items-center gap-1.5 transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Add Transaction
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3 mb-5">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search transactions by title or category..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          />
        </div>

        {/* Type Filter Buttons */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl self-start sm:self-auto">
          {['all', 'expense', 'income'].map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setTypeFilter(tab);
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg capitalize transition-all ${
                typeFilter === tab
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {tab === 'all' ? 'All Types' : tab}
            </button>
          ))}
        </div>

        {/* Category Filter Dropdown */}
        <div className="w-full sm:w-auto">
          <select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full sm:w-44 px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          >
            {ALL_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat === 'All' ? 'All Categories' : cat}
              </option>
            ))}
          </select>
        </div>

        {/* Date Filters */}
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={startDate}
            onChange={(e) => {
              setStartDate(e.target.value);
              setCurrentPage(1);
            }}
            className="px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-emerald-500"
            title="Start date"
          />
          <span className="text-slate-400 text-xs">to</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => {
              setEndDate(e.target.value);
              setCurrentPage(1);
            }}
            className="px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-emerald-500"
            title="End date"
          />
        </div>

        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="px-2.5 py-1.5 rounded-xl text-xs text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors flex items-center gap-1"
          >
            <X className="w-3.5 h-3.5" />
            Clear
          </button>
        )}
      </div>

      {/* Transactions Table / List */}
      {filtered.length === 0 ? (
        /* Empty state */
        <div className="text-center py-12 px-4 rounded-xl border border-dashed border-slate-200 bg-slate-50/50">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 mx-auto flex items-center justify-center mb-3">
            <Receipt className="w-6 h-6" />
          </div>
          <h4 className="font-semibold text-slate-800 text-sm">No transactions found</h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
            {hasActiveFilters
              ? 'Try clearing your filters or search keywords to view transactions.'
              : 'Your transaction register is currently empty. Start logging expenses or load sample data.'}
          </p>
          <div className="flex items-center justify-center gap-2 mt-4">
            {hasActiveFilters ? (
              <button
                onClick={clearFilters}
                className="px-3.5 py-2 text-xs font-medium rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 transition-colors"
              >
                Reset Filters
              </button>
            ) : (
              <>
                <button
                  onClick={onAddTransaction}
                  className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
                >
                  Add First Transaction
                </button>
                <button
                  onClick={onSeedDemo}
                  className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                >
                  Load 6-Mo Demo Data
                </button>
              </>
            )}
          </div>
        </div>
      ) : (
        /* Responsive Table */
        <div className="overflow-x-auto rounded-xl border border-slate-100">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] uppercase tracking-wider font-semibold text-slate-500">
                <th className="py-3 px-4">Transaction / Title</th>
                <th className="py-3 px-3">Category</th>
                <th className="py-3 px-3">Date</th>
                <th className="py-3 px-3">Type</th>
                <th className="py-3 px-4 text-right">Amount</th>
                <th className="py-3 px-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-normal">
              {paginated.map((tx) => {
                const isIncome = tx.type === 'income';
                const badgeStyle = CATEGORY_BADGES[tx.category] || CATEGORY_BADGES['Other'];

                return (
                  <tr key={tx.id} className="hover:bg-slate-50/60 transition-colors group">
                    {/* Title */}
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-800">{tx.title}</div>
                    </td>

                    {/* Category */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${badgeStyle}`}>
                        {tx.category}
                      </span>
                    </td>

                    {/* Date */}
                    <td className="py-3 px-3 text-slate-500 text-xs whitespace-nowrap">
                      {tx.date}
                    </td>

                    {/* Type */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 text-[11px] font-bold ${
                        isIncome ? 'text-emerald-600' : 'text-slate-500'
                      }`}>
                        {isIncome ? (
                          <>
                            <ArrowUpRight className="w-3 h-3 text-emerald-500" /> Income
                          </>
                        ) : (
                          <>
                            <ArrowDownRight className="w-3 h-3 text-rose-500" /> Expense
                          </>
                        )}
                      </span>
                    </td>

                    {/* Amount */}
                    <td className="py-3 px-4 text-right font-bold whitespace-nowrap">
                      <span className={isIncome ? 'text-emerald-600' : 'text-slate-900'}>
                        {isIncome ? '+' : '-'}${Number(tx.amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => onEditTransaction(tx)}
                          title="Edit transaction"
                          className="p-1.5 text-slate-400 hover:text-emerald-600 rounded-lg hover:bg-slate-100 transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm(`Delete transaction "${tx.title}"?`)) {
                              onDeleteTransaction(tx.id);
                            }
                          }}
                          title="Delete transaction"
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 mt-2 border-t border-slate-100 text-xs text-slate-500">
          <span>
            Page <strong className="font-semibold text-slate-800">{currentPage}</strong> of{' '}
            <strong className="font-semibold text-slate-800">{totalPages}</strong>
          </span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 rounded-lg border border-slate-200 text-slate-600 disabled:opacity-40 hover:bg-slate-50 transition-colors"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 rounded-lg border border-slate-200 text-slate-600 disabled:opacity-40 hover:bg-slate-50 transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
