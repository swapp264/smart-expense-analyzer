"""
Flask REST API for Smart Expense Analyzer.
Exposes endpoints for transaction management, analytics, ML category prediction,
and Linear Regression next-month expense forecasting.
Serves static React frontend from frontend/dist when built.
"""

import os
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from database import (
    init_db,
    add_transaction,
    update_transaction,
    delete_transaction,
    get_transactions,
    get_dashboard_summary,
    get_budget,
    set_budget,
    seed_demo_data,
    clear_all_transactions
)
from ml_classifier import predict_category, get_model
from forecaster import forecast_next_month_expense

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
FRONTEND_DIST = os.path.join(BASE_DIR, '..', 'frontend', 'dist')

app = Flask(__name__, static_folder=FRONTEND_DIST, static_url_path='')
# Enable CORS for all routes
CORS(app, resources={r"/api/*": {"origins": "*"}})

# Initialize database and model on startup
init_db()
try:
    get_model()
except Exception as e:
    print(f"[WARN] Model load deferred: {e}")


@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'healthy',
        'service': 'Smart Expense Analyzer API',
        'version': '1.0.0'
    })


@app.route('/api/transactions', methods=['GET'])
def list_transactions():
    search = request.args.get('search', '')
    tx_type = request.args.get('type', '')
    category = request.args.get('category', '')
    start_date = request.args.get('start_date', '')
    end_date = request.args.get('end_date', '')
    limit = int(request.args.get('limit', 300))

    txs = get_transactions(
        search=search,
        tx_type=tx_type,
        category=category,
        start_date=start_date,
        end_date=end_date,
        limit=limit
    )
    return jsonify({'transactions': txs, 'count': len(txs)})


@app.route('/api/transactions', methods=['POST'])
def create_transaction():
    data = request.get_json(silent=True) or {}
    title = data.get('title', '').strip()
    amount = data.get('amount')
    category = data.get('category', '').strip()
    tx_type = data.get('type', 'expense').strip().lower()
    date = data.get('date', '').strip()

    if not title:
        return jsonify({'error': 'Title is required'}), 400
    if amount is None or float(amount) <= 0:
        return jsonify({'error': 'A valid positive amount is required'}), 400
    if not category:
        category = 'Other'
    if tx_type not in ('income', 'expense'):
        tx_type = 'expense'
    if not date:
        from datetime import datetime
        date = datetime.now().strftime('%Y-%m-%d')

    new_tx = add_transaction(title, float(amount), category, tx_type, date)
    return jsonify({'message': 'Transaction added successfully', 'transaction': new_tx}), 201


@app.route('/api/transactions/<int:tx_id>', methods=['PUT'])
def edit_transaction(tx_id):
    data = request.get_json(silent=True) or {}
    title = data.get('title', '').strip()
    amount = data.get('amount')
    category = data.get('category', '').strip()
    tx_type = data.get('type', 'expense').strip().lower()
    date = data.get('date', '').strip()

    if not title:
        return jsonify({'error': 'Title is required'}), 400
    if amount is None or float(amount) <= 0:
        return jsonify({'error': 'A valid positive amount is required'}), 400
    if not category:
        category = 'Other'
    if tx_type not in ('income', 'expense'):
        tx_type = 'expense'

    updated = update_transaction(tx_id, title, float(amount), category, tx_type, date)
    if not updated:
        return jsonify({'error': 'Transaction not found'}), 400
    return jsonify({'message': 'Transaction updated successfully', 'transaction': updated})


@app.route('/api/transactions/<int:tx_id>', methods=['DELETE'])
def remove_transaction(tx_id):
    success = delete_transaction(tx_id)
    if not success:
        return jsonify({'error': 'Transaction not found or could not be deleted'}), 404
    return jsonify({'message': 'Transaction deleted successfully', 'id': tx_id})


@app.route('/api/summary', methods=['GET'])
def summary():
    summary_data = get_dashboard_summary()
    return jsonify(summary_data)


@app.route('/api/budget', methods=['GET', 'POST'])
def budget_endpoint():
    if request.method == 'POST':
        data = request.get_json(silent=True) or {}
        new_budget = data.get('monthly_budget')
        if new_budget is None or float(new_budget) < 0:
            return jsonify({'error': 'A valid budget amount is required'}), 400
        saved_budget = set_budget(float(new_budget))
        return jsonify({'message': 'Budget updated successfully', 'monthly_budget': saved_budget})
    
    current_budget = get_budget()
    return jsonify({'monthly_budget': current_budget})


@app.route('/api/predict-category', methods=['POST'])
def predict_category_endpoint():
    data = request.get_json(silent=True) or {}
    title = data.get('title', '').strip()
    result = predict_category(title)
    return jsonify(result)


@app.route('/api/forecast', methods=['GET'])
def forecast_endpoint():
    summary_data = get_dashboard_summary()
    monthly_expenses = [
        {'month': item['month'], 'total': item['expenses']}
        for item in summary_data['monthly_trends']
        if item.get('expenses', 0) > 0
    ]
    forecast_result = forecast_next_month_expense(monthly_expenses)
    return jsonify(forecast_result)


@app.route('/api/seed-demo', methods=['POST'])
def seed_demo_endpoint():
    count = seed_demo_data()
    return jsonify({
        'message': f'Successfully loaded {count} demo transactions spanning the last 6 months!',
        'count': count
    })


@app.route('/api/reset-data', methods=['POST'])
def reset_data_endpoint():
    clear_all_transactions()
    return jsonify({'message': 'All transaction records have been reset.', 'success': True})


@app.route('/api/dataset-info', methods=['GET'])
def dataset_info():
    artifact = get_model()
    return jsonify({
        'dataset_name': 'Banking Transaction Text Categorization & Personal Expense Classification',
        'sources': [
            {
                'name': 'Banking Transaction Text Categorization Dataset (Deepam Chaudhary)',
                'url': 'https://www.kaggle.com/datasets/deepamchaudhary/banking-transaction-text-categorization-dataset',
                'description': 'Real-world digital payment descriptions from bank statements and merchant POS.'
            },
            {
                'name': 'Personal Expense Classification Dataset (Şahide Şeker)',
                'url': 'https://www.kaggle.com/datasets/sahideseker/personal-expense-classification-dataset',
                'license': 'CC BY-SA 4.0',
                'description': 'Classified personal expenses based on merchant transactions.'
            }
        ],
        'total_training_records': artifact.get('total_samples', 12135),
        'model_accuracy': round(artifact.get('accuracy', 0.996) * 100, 2),
        'classes': artifact.get('classes', []),
        'algorithms': {
            'classification': 'TF-IDF Vectorizer (ngram 1-2) + Multinomial Naive Bayes (alpha=0.1)',
            'forecasting': 'Scikit-Learn Linear Regression (Monthly time-series trend fitting)'
        }
    })


# Frontend SPA catch-all route (serves compiled React frontend if present)
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve_frontend(path):
    if path != "" and os.path.exists(os.path.join(FRONTEND_DIST, path)):
        return send_from_directory(FRONTEND_DIST, path)
    index_file = os.path.join(FRONTEND_DIST, 'index.html')
    if os.path.exists(index_file):
        return send_from_directory(FRONTEND_DIST, 'index.html')
    return jsonify({
        'status': 'healthy',
        'service': 'Smart Expense Analyzer API',
        'endpoints': '/api/summary, /api/transactions, /api/forecast, /api/predict-category'
    })


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    print(f"Starting Smart Expense Analyzer Backend on http://0.0.0.0:{port}")
    app.run(host='0.0.0.0', port=port, debug=True)
