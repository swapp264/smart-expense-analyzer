# Smart Expense Analyzer 💰🤖

A simple, modern, professional, and fully functional **Smart Expense Analyzer** web application. Built with React (Vite) + Tailwind CSS, Flask, SQLite, and Scikit-Learn.

---

## 🌟 Key Features

1. **Clean Financial Dashboard**:
   - Light aesthetic, white cards, subtle shadows, and emerald green accents.
   - 4 Summary Cards: **Total Income**, **Total Expenses**, **Net Balance**, and **Monthly Budget & Remaining** with real-time progress bar.
   - Interactive Data Visualizations (Recharts): Monthly Cash Flow bar chart with AI next-month projections and category distribution donut chart.

2. **Automatic Expense Categorization (Scikit-Learn NLP)**:
   - Powered by a machine learning model (**TF-IDF Vectorizer + Multinomial Naive Bayes**) trained on **12,135 real transaction descriptions from Kaggle**.
   - As you type a transaction title (e.g., *"Starbucks iced mocha"*, *"Uber cab to airport"*, *"Netflix subscription"*, *"Electricity bill payment"*), the app instantly predicts the category in real time with confidence percentage.
   - Users can accept the AI suggestion or freely override it from the category dropdown before saving.

3. **Next-Month Expense Prediction (Scikit-Learn Linear Regression)**:
   - Fits an **Ordinary Least Squares Linear Regression** model on your historical monthly expense totals stored in SQLite.
   - Projects next month's spending, computes trend velocity (+% change), regression slope ($m$), and $R^2$ goodness-of-fit.
   - Displays clear explanatory guidance when more historical data is needed (< 2 months) with a 1-click **Load Demo Data** option.

4. **Robust Expense Management**:
   - Add, edit, and delete transactions with full validation.
   - Filter and search transactions by keyword, type (Income / Expense), category, and date range.
   - Configurable monthly budget with dynamic warning and exceeded alert banners.
   - Stored in a persistent local **SQLite database** (`backend/expenses.db`).
   - One-click **Seed Demo Data** (populates 6 months of realistic transactions) and **Reset Data** controls.

---

## 📊 Real Kaggle Datasets & Machine Learning Provenance

This application uses real transaction classification data from Kaggle rather than mock data:

### 1. Source Datasets on Kaggle
- **[Banking Transaction Text Categorization Dataset](https://www.kaggle.com/datasets/deepamchaudhary/banking-transaction-text-categorization-dataset)** by Deepam Chaudhary:
  - 11,000 real-world banking statement narrations, POS descriptions, and transaction texts categorized into standard financial buckets.
- **[Personal Expense Classification Dataset](https://www.kaggle.com/datasets/sahideseker/personal-expense-classification-dataset)** by Şahide Şeker:
  - License: **CC BY-SA 4.0**
  - Personal expense entries mapping merchant descriptions to spending categories.

### 2. Dataset Storage Location
Raw CSV files and cleaned training data are stored in:
```
backend/data/
├── financial_transactions_train.csv
├── financial_transactions_test.csv
├── personal_expense_classification.csv
└── transaction_categorization.csv   # Unified cleaned dataset (12,135 records)
```

### 3. Machine Learning Algorithms
- **Category Classification**: `TfidfVectorizer(ngram_range=(1, 2), sublinear_tf=True)` + `MultinomialNB(alpha=0.1)`.
  - **Accuracy**: **99.62%** on stratified test split.
  - Persisted model artifact: `backend/model.joblib`.
- **Next-Month Expense Forecasting**: `LinearRegression()` from `sklearn.linear_model` fitted on the user's monthly spending totals from SQLite.

---

## 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19, Vite, Tailwind CSS (v4) |
| **Icons & Charts** | Lucide React, Recharts |
| **Backend** | Python 3, Flask, Flask-CORS |
| **Database** | SQLite3 (`expenses.db`) |
| **Machine Learning** | Scikit-Learn (`TfidfVectorizer`, `MultinomialNB`, `LinearRegression`), Pandas, NumPy, Joblib |

---

## 🚀 Quickstart Guide

### Prerequisites
- **Python 3.9+**
- **Node.js 18+** & **npm**

---

### Step 1: Backend Setup (Flask + ML + SQLite)

1. Open a terminal and navigate to the `backend/` directory:
   ```bash
   cd backend
   ```

2. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Download & prepare the Kaggle dataset (automatic, no credentials required):
   ```bash
   python download_dataset.py
   ```

4. Train the Scikit-learn classification model:
   ```bash
   python ml_classifier.py
   ```

5. Initialize the SQLite database:
   ```bash
   python database.py
   ```

6. Start the Flask backend server:
   ```bash
   python app.py
   ```
   *The backend will be running at `http://127.0.0.1:5000`.*

---

### Step 2: Frontend Setup (React + Vite + Tailwind)

1. In a new terminal, navigate to the `frontend/` directory:
   ```bash
   cd frontend
   ```

2. Install frontend dependencies:
   ```bash
   npm install
   ```

3. Start the Vite development server:
   ```bash
   npm run dev
   ```
   *Open your browser at `http://localhost:5173`.*

---

## 🌐 API Endpoints Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Health check endpoint |
| `GET` | `/api/summary` | Dashboard metrics, balances, category breakdown, monthly trends |
| `GET` | `/api/transactions` | Filterable list of transactions (`?search=&type=&category=&start_date=&end_date=`) |
| `POST` | `/api/transactions` | Create a new transaction |
| `PUT` | `/api/transactions/<id>` | Update an existing transaction |
| `DELETE` | `/api/transactions/<id>` | Delete a transaction |
| `GET` / `POST` | `/api/budget` | Get or update monthly budget limit |
| `POST` | `/api/predict-category` | Real-time NLP category prediction from description |
| `GET` | `/api/forecast` | Scikit-learn Linear Regression next-month expense projection |
| `POST` | `/api/seed-demo` | Seed 6 months of realistic demo transactions |
| `POST` | `/api/reset-data` | Clear all saved transactions |
| `GET` | `/api/dataset-info` | Kaggle dataset metadata and model accuracy metrics |

---

## 🧪 Testing the Machine Learning Features

1. **Auto-Categorization Test**:
   - Click **Add Transaction** in the UI.
   - In the **Title / Description** field, type `"Starbucks iced latte"`. Observe the instant badge: `ML Suggestion: Food & Dining (98%)`.
   - Change the text to `"Uber ride to airport"`. Notice it dynamically switches to `Transportation (100%)`.
   - Type `"Electricity utility bill"` -> suggests `Bills & Utilities (92%)`.
   - Type `"Monthly company salary"` -> suggests `Income (100%)`.
   - Notice you can freely adjust or override the category dropdown at any time.

2. **Linear Regression Forecasting Test**:
   - If starting fresh, click **Demo Data** in the top navigation bar.
   - Look at the **Next-Month Expense Forecast** card and the **Monthly Cash Flow & Forecast** chart.
   - The card shows the Ordinary Least Squares projection, regression slope ($m$), $R^2$ fit, and spending velocity percentage.

---

## 🚀 Deploying on Render (Step-by-Step)

You can deploy this full-stack application to **[Render.com](https://render.com)** on their free tier.

### Option 1: One-Click / Single Web Service Deployment (Recommended)
This method compiles the React frontend into static assets and lets the Flask backend serve both the UI and the API from a single free Render Web Service.

1. **Push your code to GitHub**:
   ```bash
   git init
   git add .
   git commit -m "Initial commit for Smart Expense Analyzer"
   git remote add origin https://github.com/<your-username>/<your-repo-name>.git
   git branch -M main
   git push -u origin main
   ```

2. **Go to Render Dashboard**:
   - Log in at [dashboard.render.com](https://dashboard.render.com).
   - Click **New +** > **Web Service**.
   - Connect your GitHub repository.

3. **Configure Service Settings**:
   - **Name**: `smart-expense-analyzer` (or your preferred name)
   - **Region**: Closest to you (e.g., *Oregon (US West)* or *Frankfurt (EU)*)
   - **Branch**: `main`
   - **Root Directory**: *(leave blank)*
   - **Runtime**: `Python 3`
   - **Build Command**:
     ```bash
     ./render-build.sh
     ```
     *(Or if using Windows line endings or running directly: `chmod +x render-build.sh && ./render-build.sh`)*
   - **Start Command**:
     ```bash
     gunicorn --chdir backend app:app --bind 0.0.0.0:$PORT
     ```
   - **Instance Type**: `Free`

4. **Environment Variables**:
   Under **Environment Variables**, add:
   - `PYTHON_VERSION` = `3.11.9`

5. **Deploy**:
   - Click **Create Web Service**.
   - Render will automatically execute `render-build.sh`, install packages, download the real Kaggle dataset, train the Scikit-learn model, build the React frontend, and boot up Gunicorn.
   - Once deployment status shows `Live`, open your provided `.onrender.com` URL to view your live application!

---

### Option 2: Render Blueprint (Infrastructure-as-Code)
If your repository contains the included `render.yaml`:
1. In the Render Dashboard, click **New +** > **Blueprint**.
2. Select your repository.
3. Render will read `render.yaml` and configure the build command, start command, and environment automatically.
4. Click **Apply**.

---

## 📄 License & Attribution

- **Banking Transaction Text Categorization Dataset**: Deepam Chaudhary ([Kaggle](https://www.kaggle.com/datasets/deepamchaudhary/banking-transaction-text-categorization-dataset)).
- **Personal Expense Classification Dataset**: Şahide Şeker ([Kaggle](https://www.kaggle.com/datasets/sahideseker/personal-expense-classification-dataset)), licensed under [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/).

