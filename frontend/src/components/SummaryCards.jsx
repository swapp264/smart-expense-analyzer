import React from 'react';
import { ArrowUpRight, ArrowDownRight, Wallet, Target, AlertCircle, Edit2 } from 'lucide-react';

export default function SummaryCards({ summary, onEditBudget }) {
  if (!summary) return null;

  const {
    total_income = 0,
    total_expense = 0,
    net_balance = 0,
    monthly_budget = 0,
    current_month_expense = 0,
    remaining_budget = 0,
    budget_used_percentage = 0,
    budget_exceeded = false
  } = summary;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* 1. Total Income */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Income</span>
          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <ArrowUpRight className="w-5 h-5" />
          </div>
        </div>
        <div className="text-2xl font-bold text-slate-900 tracking-tight">
          ${total_income.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
        <div className="flex items-center gap-1.5 mt-2 text-xs text-emerald-600 font-medium">
          <span>Current month:</span>
          <span className="font-semibold">${summary.current_month_income?.toLocaleString() || '0.00'}</span>
        </div>
      </div>

      {/* 2. Total Expenses */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Expenses</span>
          <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <ArrowDownRight className="w-5 h-5" />
          </div>
        </div>
        <div className="text-2xl font-bold text-slate-900 tracking-tight">
          ${total_expense.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
        <div className="flex items-center gap-1.5 mt-2 text-xs text-rose-600 font-medium">
          <span>This month:</span>
          <span className="font-semibold">${current_month_expense.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
        </div>
      </div>

      {/* 3. Net Balance */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Net Balance</span>
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
            net_balance >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
          }`}>
            <Wallet className="w-5 h-5" />
          </div>
        </div>
        <div className={`text-2xl font-bold tracking-tight ${net_balance >= 0 ? 'text-slate-900' : 'text-rose-600'}`}>
          ${net_balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
        <div className="flex items-center gap-1.5 mt-2 text-xs text-slate-500">
          <span className={`inline-block w-2 h-2 rounded-full ${net_balance >= 0 ? 'bg-emerald-500' : 'bg-rose-500'}`} />
          <span>{net_balance >= 0 ? 'Positive net savings' : 'Expenses exceed income'}</span>
        </div>
      </div>

      {/* 4. Monthly Budget & Remaining */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow relative group">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Monthly Budget</span>
            <button
              onClick={onEditBudget}
              title="Edit monthly budget"
              className="p-1 text-slate-400 hover:text-emerald-600 rounded transition-colors"
            >
              <Edit2 className="w-3 h-3" />
            </button>
          </div>
          <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Target className="w-5 h-5" />
          </div>
        </div>

        <div className="flex items-baseline justify-between">
          <div className="text-2xl font-bold text-slate-900 tracking-tight">
            ${remaining_budget.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <span className="text-xs text-slate-400">/ ${monthly_budget.toLocaleString()}</span>
        </div>

        {/* Progress Bar */}
        <div className="mt-3">
          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 rounded-full ${
                budget_exceeded
                  ? 'bg-rose-500'
                  : budget_used_percentage > 85
                  ? 'bg-amber-500'
                  : 'bg-emerald-500'
              }`}
              style={{ width: `${Math.min(100, Math.max(0, budget_used_percentage))}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[11px] mt-1 text-slate-500 font-medium">
            <span>{budget_used_percentage}% spent</span>
            <span className={budget_exceeded ? 'text-rose-600 font-semibold' : 'text-slate-500'}>
              {budget_exceeded ? 'Over limit' : `$${Math.max(0, remaining_budget).toFixed(0)} left`}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
