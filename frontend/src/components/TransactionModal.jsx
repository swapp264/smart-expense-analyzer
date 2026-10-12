import React, { useState, useEffect, useRef } from 'react';
import { X, Sparkles, Check, DollarSign, Calendar, Tag, FileText, ArrowRightLeft } from 'lucide-react';
import { predictCategory } from '../api';

const CATEGORIES = [
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

export default function TransactionModal({ isOpen, onClose, onSave, transactionToEdit }) {
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Food & Dining');
  const [type, setType] = useState('expense');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [predictedCat, setPredictedCat] = useState(null);
  const [predictConfidence, setPredictConfidence] = useState(null);
  const [isPredicting, setIsPredicting] = useState(false);
  const [userManuallySelectedCategory, setUserManuallySelectedCategory] = useState(false);
  const [error, setError] = useState('');

  const debounceTimeout = useRef(null);

  // Populate form if editing
  useEffect(() => {
    if (transactionToEdit) {
      setTitle(transactionToEdit.title || '');
      setAmount(transactionToEdit.amount?.toString() || '');
      setCategory(transactionToEdit.category || 'Food & Dining');
      setType(transactionToEdit.type || 'expense');
      setDate(transactionToEdit.date || new Date().toISOString().split('T')[0]);
      setUserManuallySelectedCategory(true);
      setPredictedCat(null);
    } else {
      // Reset for new transaction
      setTitle('');
      setAmount('');
      setCategory('Food & Dining');
      setType('expense');
      setDate(new Date().toISOString().split('T')[0]);
      setPredictedCat(null);
      setPredictConfidence(null);
      setUserManuallySelectedCategory(false);
      setError('');
    }
  }, [transactionToEdit, isOpen]);

  // Real-time ML Prediction trigger as user types title
  useEffect(() => {
    if (!isOpen || transactionToEdit) return;

    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }

    const trimmed = title.trim();
    if (trimmed.length < 3) {
      setPredictedCat(null);
      return;
    }

    debounceTimeout.current = setTimeout(async () => {
      setIsPredicting(true);
      try {
        const res = await predictCategory(trimmed);
        if (res && res.is_predicted && res.category) {
          setPredictedCat(res.category);
          setPredictConfidence(res.confidence);

          // Auto-apply if user hasn't deliberately picked a category yet
          if (!userManuallySelectedCategory) {
            setCategory(res.category);
            // If predicted category is Income, adjust type
            if (res.category === 'Income') {
              setType('income');
            } else if (type === 'income' && res.category !== 'Income') {
              setType('expense');
            }
          }
        }
      } catch (err) {
        console.error('Prediction error:', err);
      } finally {
        setIsPredicting(false);
      }
    }, 350);

    return () => clearTimeout(debounceTimeout.current);
  }, [title, isOpen, transactionToEdit, userManuallySelectedCategory, type]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    const parsedAmount = parseFloat(amount);
    if (!title.trim()) {
      setError('Please provide a transaction title or description.');
      return;
    }
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Please provide a valid positive amount.');
      return;
    }

    onSave({
      id: transactionToEdit?.id,
      title: title.trim(),
      amount: parsedAmount,
      category,
      type,
      date
    });
  };

  const applyPrediction = (cat) => {
    setCategory(cat);
    if (cat === 'Income') setType('income');
    else setType('expense');
    setUserManuallySelectedCategory(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200/80 overflow-hidden transform transition-all">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                {transactionToEdit ? 'Edit Transaction' : 'Add New Transaction'}
              </h3>
              <p className="text-[11px] text-slate-500">Record a new income or expense entry</p>
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

          {/* Type Switcher */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
              Transaction Type
            </label>
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl">
              <button
                type="button"
                onClick={() => {
                  setType('expense');
                  if (category === 'Income') setCategory('Food & Dining');
                }}
                className={`py-2 text-xs font-bold rounded-lg transition-all ${
                  type === 'expense'
                    ? 'bg-white text-rose-600 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Expense (-)
              </button>
              <button
                type="button"
                onClick={() => {
                  setType('income');
                  setCategory('Income');
                }}
                className={`py-2 text-xs font-bold rounded-lg transition-all ${
                  type === 'income'
                    ? 'bg-white text-emerald-600 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Income (+)
              </button>
            </div>
          </div>

          {/* Title / Description Field */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
              Title / Description
            </label>
            <input
              type="text"
              placeholder="e.g. Starbucks iced coffee, Uber ride, Grocery store"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              required
            />

            {/* Real-time ML Prediction Banner */}
            {predictedCat && (
              <div className="mt-2 flex items-center justify-between p-2 rounded-xl bg-emerald-50/80 border border-emerald-200 text-xs text-emerald-900 animate-in fade-in duration-150">
                <div className="flex items-center gap-1.5 truncate">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0 animate-pulse" />
                  <span className="truncate">
                    ML Suggestion: <strong className="font-bold">{predictedCat}</strong>{' '}
                    <span className="text-[10px] text-emerald-700">({(predictConfidence * 100).toFixed(0)}%)</span>
                  </span>
                </div>
                {category !== predictedCat && (
                  <button
                    type="button"
                    onClick={() => applyPrediction(predictedCat)}
                    className="px-2 py-0.5 text-[11px] font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-md flex-shrink-0 transition-colors"
                  >
                    Use
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Amount & Date in a 2-col row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                Amount ($)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-slate-400 text-sm">$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full pl-7 pr-3 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                required
              />
            </div>
          </div>

          {/* Category Dropdown (User can freely override ML suggestion) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider">
                Category
              </label>
              <span className="text-[10px] text-slate-400">Click dropdown to override ML</span>
            </div>
            <select
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setUserManuallySelectedCategory(true);
              }}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Actions */}
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
              {transactionToEdit ? 'Save Changes' : 'Add Transaction'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
