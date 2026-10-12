#!/usr/bin/env bash
# Exit on error
set -e

echo "=== [Render Build] Step 1: Installing Python Dependencies ==="
pip install -r backend/requirements.txt

echo "=== [Render Build] Step 2: Preparing Real Kaggle Dataset ==="
python backend/download_dataset.py

echo "=== [Render Build] Step 3: Training Scikit-Learn Model ==="
python backend/ml_classifier.py

echo "=== [Render Build] Step 4: Initializing SQLite Database ==="
python backend/database.py

echo "=== [Render Build] Step 5: Building React Frontend ==="
cd frontend
npm install
npm run build
cd ..

echo "=== [Render Build] Completed Successfully! ==="
