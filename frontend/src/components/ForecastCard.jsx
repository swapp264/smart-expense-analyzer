import React from 'react';
import { Cpu, TrendingUp, TrendingDown, Minus, Info, Sparkles, HelpCircle } from 'lucide-react';

export default function ForecastCard({ forecast, onSeedDemo }) {
  if (!forecast) return null;

  const hasData = forecast.has_sufficient_data;

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs mb-6 relative overflow-hidden">
      {/* Decorative background glow */}
      <div className="absolute -top-12 -right-12 w-36 h-36 bg-emerald-100/50 rounded-full blur-2xl pointer-events-none" />

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 rounded-xl bg-emerald-500 text-white shadow-xs">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-900 text-base">Next-Month Expense Forecast</h3>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 uppercase tracking-wider">
                Scikit-Learn ML
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Ordinary Least Squares Linear Regression applied to your monthly transaction totals
            </p>
          </div>
        </div>

        {hasData && (
          <div className="flex items-center gap-2 self-end sm:self-center">
            <span className="text-xs text-slate-500">Model basis:</span>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700">
              {forecast.data_points} Month History
            </span>
          </div>
        )}
      </div>

      {hasData ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          {/* 1. Projected Amount */}
          <div className="p-4 rounded-xl bg-gradient-to-br from-slate-50 to-emerald-50/30 border border-slate-200/60">
            <span className="text-xs font-medium text-slate-500">
              Projected for {forecast.next_month_name || 'Next Month'}
            </span>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
              ${forecast.predicted_expense?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Estimated total monthly spending based on trend
            </p>
          </div>

          {/* 2. Spending Trend & Direction */}
          <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/60 flex flex-col justify-between">
            <div>
              <span className="text-xs font-medium text-slate-500">Spending Velocity & Trend</span>
              <div className="flex items-center gap-2 mt-1">
                {forecast.trend_direction === 'increasing' ? (
                  <span className="inline-flex items-center gap-1 font-bold text-rose-600 text-lg">
                    <TrendingUp className="w-5 h-5" />
                    +{Math.abs(forecast.trend_percentage)}%
                  </span>
                ) : forecast.trend_direction === 'decreasing' ? (
                  <span className="inline-flex items-center gap-1 font-bold text-emerald-600 text-lg">
                    <TrendingDown className="w-5 h-5" />
                    -{Math.abs(forecast.trend_percentage)}%
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 font-bold text-slate-600 text-lg">
                    <Minus className="w-5 h-5" />
                    Stable (~0%)
                  </span>
                )}
                <span className="text-xs text-slate-400 capitalize">
                  ({forecast.trend_direction})
                </span>
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-2">
              Slope: {forecast.slope > 0 ? `+$${forecast.slope}/mo` : `-$${Math.abs(forecast.slope)}/mo`}
            </p>
          </div>

          {/* 3. Mathematical Model Statistics */}
          <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/60 flex flex-col justify-between">
            <div>
              <span className="text-xs font-medium text-slate-500">Statistical Parameters</span>
              <div className="mt-1 flex items-center justify-between text-xs">
                <span className="text-slate-600">Regression Fit (R²):</span>
                <span className="font-semibold text-slate-800">{forecast.r2_score ?? 'N/A'}</span>
              </div>
              <div className="mt-1 flex items-center justify-between text-xs">
                <span className="text-slate-600">Sample Months:</span>
                <span className="font-semibold text-slate-800">{forecast.data_points}</span>
              </div>
            </div>
            <p className="text-[11px] text-emerald-700 bg-emerald-50 px-2 py-1 rounded mt-2">
              ✓ Continuous live recalculation upon adding transactions
            </p>
          </div>
        </div>
      ) : (
        /* Insufficient data state */
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-blue-50 text-blue-600 flex-shrink-0 mt-0.5">
              <Info className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-semibold text-sm text-slate-800">
                More Historical Data Needed for Trend Prediction
              </h4>
              <p className="text-xs text-slate-500 mt-1 max-w-xl">
                {forecast.message ||
                  'Linear Regression requires at least 2 distinct months of transaction history. Once you log transactions across multiple months, projected expenses will automatically compute here.'}
              </p>
            </div>
          </div>

          <button
            onClick={onSeedDemo}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 shadow-xs transition-colors whitespace-nowrap self-end sm:self-center"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Load 6-Mo Demo Data
          </button>
        </div>
      )}
    </div>
  );
}
