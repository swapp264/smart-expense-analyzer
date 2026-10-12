import React from 'react';
import { AlertTriangle, AlertCircle, Edit3 } from 'lucide-react';

export default function BudgetAlertBanner({ summary, onEditBudget }) {
  if (!summary) return null;

  const {
    current_month_expense,
    monthly_budget,
    budget_exceeded,
    budget_warning,
    remaining_budget,
    budget_used_percentage
  } = summary;

  if (!budget_exceeded && !budget_warning) return null;

  const isExceeded = budget_exceeded;

  return (
    <div
      className={`mb-6 rounded-xl border p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all shadow-sm ${
        isExceeded
          ? 'bg-rose-50/80 border-rose-200 text-rose-900'
          : 'bg-amber-50/80 border-amber-200 text-amber-900'
      }`}
    >
      <div className="flex items-center gap-3">
        <div
          className={`p-2 rounded-lg flex-shrink-0 ${
            isExceeded ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-600'
          }`}
        >
          {isExceeded ? <AlertTriangle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
        </div>
        <div>
          <h4 className="font-semibold text-sm sm:text-base">
            {isExceeded ? 'Monthly Budget Exceeded!' : 'Approaching Budget Limit'}
          </h4>
          <p className="text-xs sm:text-sm mt-0.5 opacity-90">
            {isExceeded ? (
              <>
                You have spent <span className="font-semibold">${current_month_expense.toLocaleString()}</span> this
                month, exceeding your limit of <span className="font-semibold">${monthly_budget.toLocaleString()}</span> by{' '}
                <span className="font-bold underline">${Math.abs(remaining_budget).toLocaleString()}</span> ({budget_used_percentage}% utilized).
              </>
            ) : (
              <>
                You have used <span className="font-semibold">{budget_used_percentage}%</span> of your monthly limit ($
                {current_month_expense.toLocaleString()} of ${monthly_budget.toLocaleString()}). Only{' '}
                <span className="font-semibold">${remaining_budget.toLocaleString()}</span> left.
              </>
            )}
          </p>
        </div>
      </div>

      <button
        onClick={onEditBudget}
        className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 whitespace-nowrap self-end sm:self-center transition-colors shadow-xs ${
          isExceeded
            ? 'bg-rose-600 hover:bg-rose-700 text-white'
            : 'bg-amber-600 hover:bg-amber-700 text-white'
        }`}
      >
        <Edit3 className="w-3.5 h-3.5" />
        Adjust Budget
      </button>
    </div>
  );
}
