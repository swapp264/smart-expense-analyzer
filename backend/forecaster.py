"""
Expense Forecasting Module using Scikit-Learn Linear Regression.
Forecasts next month's total expenses based on the user's historical transactions.
"""

from datetime import datetime
import numpy as np
from sklearn.linear_model import LinearRegression
from sklearn.metrics import r2_score


def calculate_next_month_str(last_month_str: str) -> str:
    """Computes the YYYY-MM string for the following month."""
    try:
        dt = datetime.strptime(last_month_str, '%Y-%m')
        if dt.month == 12:
            next_dt = datetime(dt.year + 1, 1, 1)
        else:
            next_dt = datetime(dt.year, dt.month + 1, 1)
        return next_dt.strftime('%Y-%m')
    except Exception:
        now = datetime.now()
        if now.month == 12:
            return f"{now.year + 1}-01"
        return f"{now.year}-{now.month + 1:02d}"


def forecast_next_month_expense(monthly_expenses: list) -> dict:
    """
    Given a list of dicts [{'month': 'YYYY-MM', 'total': float}],
    fits a LinearRegression model and predicts next month's total expense.
    """
    # Filter and sort chronologically
    valid_data = [
        {'month': str(item['month']), 'total': float(item['total'])}
        for item in monthly_expenses
        if isinstance(item, dict) and 'month' in item and 'total' in item and item['total'] > 0
    ]
    valid_data.sort(key=lambda x: x['month'])

    n_points = len(valid_data)
    
    # Requirement: require sufficient historical data (at least 2 distinct months, 3+ recommended)
    if n_points < 2:
        return {
            'has_sufficient_data': False,
            'data_points': n_points,
            'message': (
                f"Expense forecasting requires at least 2 distinct months of data (3+ recommended). "
                f"Currently available: {n_points} month(s). Add more past transactions or click "
                f"'Load Demo Data' to preview AI forecasting."
            ),
            'predicted_expense': None,
            'trend_percentage': 0.0,
            'slope': 0.0,
            'trend_direction': 'neutral',
            'historical_months': valid_data
        }

    # Prepare features and target
    X = np.arange(n_points).reshape(-1, 1)
    y = np.array([item['total'] for item in valid_data], dtype=float)

    model = LinearRegression()
    model.fit(X, y)

    # Next month index is n_points
    next_X = np.array([[n_points]])
    pred_val = float(model.predict(next_X)[0])
    
    # Clamp to non-negative
    predicted_expense = float(max(0.0, round(pred_val, 2)))

    slope = float(model.coef_[0])
    last_val = float(y[-1])
    
    # Calculate trend % change relative to previous month
    if last_val > 0:
        trend_percentage = float(round(((predicted_expense - last_val) / last_val) * 100, 1))
    else:
        trend_percentage = 0.0

    trend_direction = 'increasing' if slope > 5 else ('decreasing' if slope < -5 else 'stable')

    # Calculate R2 if >= 3 points
    r2 = None
    if n_points >= 3:
        y_pred = model.predict(X)
        r2 = float(round(float(r2_score(y, y_pred)), 2))

    last_month = valid_data[-1]['month']
    next_month_str = calculate_next_month_str(last_month)
    next_month_name = datetime.strptime(next_month_str, '%Y-%m').strftime('%B %Y')

    trend_desc = (
        f"upward by ~{abs(trend_percentage)}%" if trend_direction == 'increasing'
        else (f"downward by ~{abs(trend_percentage)}%" if trend_direction == 'decreasing' else "stable")
    )

    message = (
        f"Linear Regression projection for {next_month_name}: "
        f"est. ${predicted_expense:,.2f} ({trend_desc} compared to last month)."
    )

    return {
        'has_sufficient_data': True,
        'data_points': int(n_points),
        'next_month': next_month_str,
        'next_month_name': next_month_name,
        'predicted_expense': predicted_expense,
        'slope': float(round(slope, 2)),
        'trend_percentage': trend_percentage,
        'trend_direction': trend_direction,
        'r2_score': r2,
        'message': message,
        'historical_months': valid_data
    }
