import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { BarChart3, PieChart as PieChartIcon, TrendingUp } from 'lucide-react';

const CATEGORY_COLORS = {
  'Food & Dining': '#10b981', // emerald-500
  'Bills & Utilities': '#3b82f6', // blue-500
  'Shopping': '#f59e0b', // amber-500
  'Transportation': '#8b5cf6', // purple-500
  'Investment': '#06b6d4', // cyan-500
  'Entertainment': '#ec4899', // pink-500
  'Health & Medical': '#ef4444', // red-500
  'Income': '#059669', // emerald-600
  'Other': '#64748b' // slate-500
};

export default function ChartsSection({ summary, forecast }) {
  const monthlyTrends = summary?.monthly_trends || [];
  const categoryBreakdown = summary?.category_breakdown || [];

  // Format month for display, e.g. "2026-05" -> "May '26"
  const formatMonth = (mStr) => {
    if (!mStr) return '';
    try {
      const [year, month] = mStr.split('-');
      const d = new Date(parseInt(year, 10), parseInt(month, 10) - 1, 1);
      return d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
    } catch {
      return mStr;
    }
  };

  const chartData = monthlyTrends.map((item) => ({
    ...item,
    formattedMonth: formatMonth(item.month)
  }));

  // Append forecasted month point if available
  if (forecast?.has_sufficient_data && forecast?.next_month && forecast?.predicted_expense) {
    chartData.push({
      month: forecast.next_month,
      formattedMonth: `${formatMonth(forecast.next_month)} (Proj.)`,
      expenses: forecast.predicted_expense,
      income: 0,
      isForecast: true
    });
  }

  // Custom Tooltip for bar chart
  const CustomBarTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const isProj = payload[0]?.payload?.isForecast;
      return (
        <div className="bg-slate-900 text-white text-xs rounded-xl p-3 shadow-lg border border-slate-800">
          <p className="font-semibold text-slate-200 mb-1.5 flex items-center gap-1.5">
            {label}
            {isProj && <span className="bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded text-[10px]">AI Projection</span>}
          </p>
          {payload.map((entry, index) => (
            <div key={`item-${index}`} className="flex items-center justify-between gap-4 py-0.5">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                <span className="capitalize">{entry.name}:</span>
              </span>
              <span className="font-semibold">
                ${Number(entry.value).toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  // Custom Tooltip for pie chart
  const CustomPieTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="bg-slate-900 text-white text-xs rounded-xl p-2.5 shadow-lg border border-slate-800">
          <p className="font-semibold text-slate-200">{data.name}</p>
          <p className="text-emerald-400 font-bold mt-0.5">
            ${Number(data.value).toLocaleString('en-US', { minimumFractionDigits: 2 })} ({data.payload.percentage}%)
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">
      {/* 1. Monthly Spending Trends */}
      <div className="lg:col-span-7 bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
                <BarChart3 className="w-4 h-4" />
              </div>
              <h3 className="font-semibold text-slate-900 text-sm sm:text-base">Monthly Cash Flow & Forecast</h3>
            </div>
            {forecast?.has_sufficient_data && (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                <TrendingUp className="w-3 h-3" />
                Next: ${forecast.predicted_expense?.toLocaleString()}
              </span>
            )}
          </div>

          <div className="h-64 sm:h-72 w-full">
            {chartData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-400 text-sm">
                No monthly transactions recorded yet.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="formattedMonth"
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    axisLine={{ stroke: '#e2e8f0' }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(val) => `$${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
                  />
                  <Tooltip content={<CustomBarTooltip />} />
                  <Legend
                    wrapperStyle={{ fontSize: 12, paddingTop: 10 }}
                    iconType="circle"
                    iconSize={8}
                  />
                  <Bar
                    dataKey="income"
                    name="Income"
                    fill="#10b981"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={28}
                  />
                  <Bar
                    dataKey="expenses"
                    name="Expenses"
                    fill="#f43f5e"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={28}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <p className="text-[11px] text-slate-400 mt-2 text-center">
          Bar chart calculates verified monthly totals from SQLite database records.
        </p>
      </div>

      {/* 2. Category Breakdown Donut */}
      <div className="lg:col-span-5 bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
                <PieChartIcon className="w-4 h-4" />
              </div>
              <h3 className="font-semibold text-slate-900 text-sm sm:text-base">Expense Categories</h3>
            </div>
            <span className="text-xs text-slate-400 font-medium">{categoryBreakdown.length} Categories</span>
          </div>

          {categoryBreakdown.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-slate-400 text-sm">
              No expense categories to show yet.
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <div className="w-48 h-48 sm:w-52 sm:h-52 relative flex-shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Tooltip content={<CustomPieTooltip />} />
                    <Pie
                      data={categoryBreakdown}
                      dataKey="total"
                      nameKey="category"
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={75}
                      paddingAngle={3}
                    >
                      {categoryBreakdown.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={CATEGORY_COLORS[entry.category] || CATEGORY_COLORS['Other']}
                          stroke="#ffffff"
                          strokeWidth={2}
                        />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                {/* Center text in donut */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-[10px] uppercase font-semibold text-slate-400">Total Spent</span>
                  <span className="text-xs sm:text-sm font-bold text-slate-800">
                    ${summary?.total_expense ? (summary.total_expense >= 1000 ? `${(summary.total_expense / 1000).toFixed(1)}k` : summary.total_expense) : '0'}
                  </span>
                </div>
              </div>

              {/* Category Breakdown legend list */}
              <div className="w-full flex-1 max-h-48 overflow-y-auto pr-1 space-y-1.5 text-xs">
                {categoryBreakdown.map((item, idx) => {
                  const color = CATEGORY_COLORS[item.category] || CATEGORY_COLORS['Other'];
                  return (
                    <div key={idx} className="flex items-center justify-between p-1.5 rounded-lg hover:bg-slate-50 transition-colors">
                      <div className="flex items-center gap-2 truncate">
                        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                        <span className="font-medium text-slate-700 truncate">{item.category}</span>
                      </div>
                      <div className="text-right flex-shrink-0 font-semibold text-slate-900">
                        ${item.total.toLocaleString()} <span className="text-[10px] text-slate-400 font-normal">({item.percentage}%)</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <p className="text-[11px] text-slate-400 mt-2 text-center">
          Proportions reflect historical expense spending distribution.
        </p>
      </div>
    </div>
  );
}
