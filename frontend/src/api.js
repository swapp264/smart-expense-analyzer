/**
 * API service helper to communicate with Flask backend
 */

const BASE_URL = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/+$/, '');

export async function fetchSummary() {
  const res = await fetch(`${BASE_URL}/summary`);
  if (!res.ok) throw new Error('Failed to load dashboard summary');
  return res.json();
}

export async function fetchTransactions(filters = {}) {
  const query = new URLSearchParams();
  if (filters.search) query.set('search', filters.search);
  if (filters.type && filters.type !== 'all') query.set('type', filters.type);
  if (filters.category && filters.category !== 'All') query.set('category', filters.category);
  if (filters.startDate) query.set('start_date', filters.startDate);
  if (filters.endDate) query.set('end_date', filters.endDate);

  const res = await fetch(`${BASE_URL}/transactions?${query.toString()}`);
  if (!res.ok) throw new Error('Failed to load transactions');
  return res.json();
}

export async function createTransaction(data) {
  const res = await fetch(`${BASE_URL}/transactions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to create transaction');
  }
  return res.json();
}

export async function updateTransaction(id, data) {
  const res = await fetch(`${BASE_URL}/transactions/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to update transaction');
  }
  return res.json();
}

export async function deleteTransaction(id) {
  const res = await fetch(`${BASE_URL}/transactions/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to delete transaction');
  }
  return res.json();
}

export async function updateBudget(monthlyBudget) {
  const res = await fetch(`${BASE_URL}/budget`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ monthly_budget: monthlyBudget }),
  });
  if (!res.ok) throw new Error('Failed to update budget');
  return res.json();
}

export async function predictCategory(title) {
  const res = await fetch(`${BASE_URL}/predict-category`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title }),
  });
  if (!res.ok) return { category: 'Other', confidence: 0, is_predicted: false };
  return res.json();
}

export async function fetchForecast() {
  const res = await fetch(`${BASE_URL}/forecast`);
  if (!res.ok) throw new Error('Failed to load expense forecast');
  return res.json();
}

export async function seedDemoData() {
  const res = await fetch(`${BASE_URL}/seed-demo`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error('Failed to seed demo data');
  return res.json();
}

export async function resetAllData() {
  const res = await fetch(`${BASE_URL}/reset-data`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error('Failed to reset data');
  return res.json();
}

export async function fetchDatasetInfo() {
  const res = await fetch(`${BASE_URL}/dataset-info`);
  if (!res.ok) throw new Error('Failed to load dataset details');
  return res.json();
}
