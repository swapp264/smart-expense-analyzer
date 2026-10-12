"""
SQLite Database module for Smart Expense Analyzer.
Handles transactions storage, budget settings, aggregation, and demo data generation.
"""

import os
import sqlite3
from datetime import datetime, timedelta
import random

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, 'expenses.db')


def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute('''
        CREATE TABLE IF NOT EXISTS transactions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            amount REAL NOT NULL,
            category TEXT NOT NULL,
            type TEXT NOT NULL CHECK(type IN ('income', 'expense')),
            date TEXT NOT NULL,
            created_at TEXT NOT NULL
        )
    ''')

    cursor.execute('''
        CREATE TABLE IF NOT EXISTS settings (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL
        )
    ''')

    # Default monthly budget: $2,500.00
    cursor.execute('''
        INSERT OR IGNORE INTO settings (key, value)
        VALUES ('monthly_budget', '2500.0')
    ''')

    conn.commit()
    conn.close()


def get_budget() -> float:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT value FROM settings WHERE key = 'monthly_budget'")
    row = cursor.fetchone()
    conn.close()
    if row:
        try:
            return float(row['value'])
        except ValueError:
            return 2500.0
    return 2500.0


def set_budget(amount: float) -> float:
    amount = max(0.0, float(amount))
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        "INSERT OR REPLACE INTO settings (key, value) VALUES ('monthly_budget', ?)",
        (str(amount),)
    )
    conn.commit()
    conn.close()
    return amount


def add_transaction(title: str, amount: float, category: str, tx_type: str, date: str) -> dict:
    conn = get_db_connection()
    cursor = conn.cursor()
    now_iso = datetime.now().isoformat()
    cursor.execute(
        '''
        INSERT INTO transactions (title, amount, category, type, date, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
        ''',
        (title.strip(), round(float(amount), 2), category.strip(), tx_type.strip().lower(), date.strip(), now_iso)
    )
    tx_id = cursor.lastrowid
    conn.commit()
    
    cursor.execute("SELECT * FROM transactions WHERE id = ?", (tx_id,))
    row = dict(cursor.fetchone())
    conn.close()
    return row


def update_transaction(tx_id: int, title: str, amount: float, category: str, tx_type: str, date: str) -> dict:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        '''
        UPDATE transactions
        SET title = ?, amount = ?, category = ?, type = ?, date = ?
        WHERE id = ?
        ''',
        (title.strip(), round(float(amount), 2), category.strip(), tx_type.strip().lower(), date.strip(), tx_id)
    )
    conn.commit()
    
    cursor.execute("SELECT * FROM transactions WHERE id = ?", (tx_id,))
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None


def delete_transaction(tx_id: int) -> bool:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM transactions WHERE id = ?", (tx_id,))
    affected = cursor.rowcount
    conn.commit()
    conn.close()
    return affected > 0


def get_transactions(search='', tx_type='', category='', start_date='', end_date='', limit=200):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    query = "SELECT * FROM transactions WHERE 1=1"
    params = []

    if search and search.strip():
        query += " AND (title LIKE ? OR category LIKE ?)"
        term = f"%{search.strip()}%"
        params.extend([term, term])

    if tx_type and tx_type.strip().lower() in ('income', 'expense'):
        query += " AND type = ?"
        params.append(tx_type.strip().lower())

    if category and category.strip() and category != 'All':
        query += " AND category = ?"
        params.append(category.strip())

    if start_date:
        query += " AND date >= ?"
        params.append(start_date.strip())

    if end_date:
        query += " AND date <= ?"
        params.append(end_date.strip())

    query += " ORDER BY date DESC, id DESC LIMIT ?"
    params.append(limit)

    cursor.execute(query, params)
    rows = [dict(r) for r in cursor.fetchall()]
    conn.close()
    return rows


def get_dashboard_summary():
    """
    Computes total income, expenses, net balance, current month metrics,
    remaining budget, category breakdown, and monthly time-series.
    """
    conn = get_db_connection()
    cursor = conn.cursor()

    # All-time aggregates
    cursor.execute('''
        SELECT 
            COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as total_income,
            COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as total_expense,
            COUNT(*) as total_count
        FROM transactions
    ''')
    agg = dict(cursor.fetchone())
    total_income = round(float(agg['total_income']), 2)
    total_expense = round(float(agg['total_expense']), 2)
    net_balance = round(total_income - total_expense, 2)

    # Current month metrics
    current_month_prefix = datetime.now().strftime('%Y-%m')
    cursor.execute('''
        SELECT 
            COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as cur_income,
            COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as cur_expense
        FROM transactions
        WHERE date LIKE ?
    ''', (f"{current_month_prefix}%",))
    cur_agg = dict(cursor.fetchone())
    cur_month_income = round(float(cur_agg['cur_income']), 2)
    cur_month_expense = round(float(cur_agg['cur_expense']), 2)

    # Monthly Budget check
    monthly_budget = get_budget()
    remaining_budget = round(monthly_budget - cur_month_expense, 2)
    budget_used_pct = round((cur_month_expense / monthly_budget * 100), 1) if monthly_budget > 0 else 0
    budget_exceeded = cur_month_expense > monthly_budget
    budget_warning = cur_month_expense >= (0.85 * monthly_budget) and not budget_exceeded

    # Category breakdown for expenses
    cursor.execute('''
        SELECT category, SUM(amount) as total, COUNT(*) as count
        FROM transactions
        WHERE type = 'expense'
        GROUP BY category
        ORDER BY total DESC
    ''')
    category_rows = cursor.fetchall()
    
    category_breakdown = []
    for r in category_rows:
        cat_total = round(float(r['total']), 2)
        pct = round((cat_total / total_expense * 100), 1) if total_expense > 0 else 0
        category_breakdown.append({
            'category': r['category'],
            'total': cat_total,
            'percentage': pct,
            'count': r['count']
        })

    # Monthly trends (all months in database)
    cursor.execute('''
        SELECT 
            SUBSTR(date, 1, 7) as month,
            COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as expenses,
            COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as income
        FROM transactions
        GROUP BY month
        ORDER BY month ASC
    ''')
    monthly_rows = cursor.fetchall()
    
    monthly_trends = []
    for r in monthly_rows:
        exp = round(float(r['expenses']), 2)
        inc = round(float(r['income']), 2)
        monthly_trends.append({
            'month': r['month'],
            'expenses': exp,
            'income': inc,
            'net': round(inc - exp, 2)
        })

    conn.close()

    return {
        'total_income': total_income,
        'total_expense': total_expense,
        'net_balance': net_balance,
        'total_transactions': agg['total_count'],
        'current_month': current_month_prefix,
        'current_month_income': cur_month_income,
        'current_month_expense': cur_month_expense,
        'monthly_budget': monthly_budget,
        'remaining_budget': remaining_budget,
        'budget_used_percentage': budget_used_pct,
        'budget_exceeded': budget_exceeded,
        'budget_warning': budget_warning,
        'category_breakdown': category_breakdown,
        'monthly_trends': monthly_trends
    }


def seed_demo_data():
    """
    Generates realistic 6-month historical personal transaction data
    to immediately power Linear Regression forecasting, Recharts charts,
    and category breakdowns.
    """
    init_db()
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Clear existing
    cursor.execute("DELETE FROM transactions")
    
    now = datetime.now()
    demo_records = []
    
    # Template transactions for each month
    # We create 6 consecutive months (from 5 months ago to current month)
    monthly_templates = [
        # (title, amount, category, type, day_offset)
        # Income
        ("Bi-Weekly Salary Deposit", 2200.0, "Income", "income", 1),
        ("Bi-Weekly Salary Deposit", 2200.0, "Income", "income", 15),
        ("Freelance Web Design Payout", 450.0, "Income", "income", 22),
        # Bills
        ("Apartment Rent Payment", 1200.0, "Bills & Utilities", "expense", 2),
        ("High-Speed Fiber Internet", 65.0, "Bills & Utilities", "expense", 5),
        ("Electricity Utility Bill", 95.0, "Bills & Utilities", "expense", 12),
        ("Mobile Phone Bill", 45.0, "Bills & Utilities", "expense", 18),
        # Food
        ("Weekly Supermarket Groceries", 145.0, "Food & Dining", "expense", 4),
        ("Weekly Supermarket Groceries", 160.0, "Food & Dining", "expense", 11),
        ("Weekly Supermarket Groceries", 130.0, "Food & Dining", "expense", 19),
        ("Weekly Supermarket Groceries", 155.0, "Food & Dining", "expense", 26),
        ("Starbucks Coffee & Snacks", 18.5, "Food & Dining", "expense", 7),
        ("Dinner at Italian Bistro", 68.0, "Food & Dining", "expense", 14),
        ("Sushi Lunch with Colleagues", 34.0, "Food & Dining", "expense", 21),
        # Transport
        ("Gas Station Shell Fuel", 52.0, "Transportation", "expense", 6),
        ("Gas Station Shell Fuel", 48.0, "Transportation", "expense", 20),
        ("Uber Ride Downtown", 24.5, "Transportation", "expense", 10),
        ("Metro Transit Card Top-up", 40.0, "Transportation", "expense", 3),
        # Shopping
        ("Amazon Electronics & Home", 85.0, "Shopping", "expense", 9),
        ("Clothing Store Purchase", 75.0, "Shopping", "expense", 16),
        # Entertainment
        ("Netflix Streaming Subscription", 15.99, "Entertainment", "expense", 8),
        ("Cinema IMAX Movie Tickets", 32.0, "Entertainment", "expense", 17),
        # Investment
        ("Index Fund Monthly Investment", 300.0, "Investment", "expense", 5)
    ]

    for month_back in range(5, -1, -1):
        # Target month year/month
        # Calculate target month date
        # E.g. month_back = 5 means 5 months ago
        year = now.year
        month = now.month - month_back
        while month <= 0:
            month += 12
            year -= 1

        for item in monthly_templates:
            title, base_amt, cat, tx_type, day = item
            
            # Add slight realistic natural variation (+- 10%) for expenses
            if tx_type == 'expense' and cat != 'Bills & Utilities':
                variation = random.uniform(0.9, 1.15)
                amt = round(base_amt * variation, 2)
            else:
                amt = base_amt

            # Cap day to valid month day
            safe_day = min(day, 28)
            date_str = f"{year:04d}-{month:02d}-{safe_day:02d}"
            created_at = f"{date_str}T10:00:00"

            demo_records.append((title, amt, cat, tx_type, date_str, created_at))

    cursor.executemany(
        '''
        INSERT INTO transactions (title, amount, category, type, date, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
        ''',
        demo_records
    )
    
    # Set default budget
    cursor.execute("INSERT OR REPLACE INTO settings (key, value) VALUES ('monthly_budget', '2600.0')")

    conn.commit()
    conn.close()
    return len(demo_records)


def clear_all_transactions():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM transactions")
    conn.commit()
    conn.close()
    return True


if __name__ == '__main__':
    init_db()
    count = seed_demo_data()
    print(f"[DB] Initialized and seeded {count} demo transactions.")
    summary = get_dashboard_summary()
    print("[DB] Summary:", summary)
