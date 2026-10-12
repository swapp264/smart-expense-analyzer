import React, { useState, useEffect } from 'react';
import { X, Target, Check, DollarSign } from 'lucide-react';

export default function BudgetModal({ isOpen, onClose, currentBudget, onSaveBudget }) {
  const [budgetVal, setBudgetVal] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setBudgetVal(currentBudget?.toString() || '2500');
      setError('');
    }
  }, [isOpen, currentBudget]);

  if (!isOpen) return null;

  const presets = [1500, 2500, 3500, 5000];

  const handleSubmit = (e) => {
    e.preventDefault();
    const parsed = parseFloat(budgetVal);
    if (isNaN(parsed) || parsed < 0) {
      setError('Please enter a valid positive budget amount.');
      return;
    }
    onSaveBudget(parsed);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-sm w-full shadow-2xl border border-slate-200/80 overflow-hidden transform transition-all">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-blue-100 text-blue-700">
              <Target className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Monthly Budget Limit</h3>
              <p className="text-[11px] text-slate-500">Configure your target monthly spending</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
              Target Monthly Limit ($)
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-slate-400 font-bold">$</span>
              <input
                type="number"
                step="50"
                min="0"
                value={budgetVal}
                onChange={(e) => setBudgetVal(e.target.value)}
                placeholder="2500"
                className="w-full pl-8 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-base font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                autoFocus
              />
            </div>
          </div>

          {/* Quick Presets */}
          <div>
            <span className="block text-[11px] font-medium text-slate-400 mb-1.5">Quick Presets:</span>
            <div className="grid grid-cols-4 gap-1.5">
              {presets.map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setBudgetVal(amt.toString())}
                  className={`py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                    parseFloat(budgetVal) === amt
                      ? 'bg-blue-50 border-blue-300 text-blue-700'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                  }`}
                >
                  ${amt}
                </button>
              ))}
            </div>
          </div>

          <p className="text-[11px] text-slate-400 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
            A real-time budget alert banner will appear at the top of the dashboard whenever spending exceeds this threshold.
          </p>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              Save Budget
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
