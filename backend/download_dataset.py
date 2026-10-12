"""
Comprehensive Kaggle Dataset Downloader and Preprocessor.
Downloads and integrates real transaction categorization datasets:
1. 'deepamchaudhary/banking-transaction-text-categorization-dataset' (Kaggle)
2. 'sahideseker/personal-expense-classification-dataset' (Kaggle, CC BY-SA 4.0)
"""

import os
import urllib.request
import zipfile
import io
import re
import pandas as pd

DATA_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'data')
os.makedirs(DATA_DIR, exist_ok=True)

KAGGLE_BANKING_URL = "https://www.kaggle.com/api/v1/datasets/download/deepamchaudhary/banking-transaction-text-categorization-dataset"
KAGGLE_PERSONAL_URL = "https://www.kaggle.com/api/v1/datasets/download/sahideseker/personal-expense-classification-dataset"

COMBINED_DATASET_CSV = os.path.join(DATA_DIR, 'transaction_categorization.csv')


def clean_text_for_training(text):
    if not isinstance(text, str):
        return ""
    text = text.lower()
    text = re.sub(r'ref\d+', '', text)
    text = re.sub(r'amt\d+', '', text)
    text = re.sub(r'\binr\b|\busd\b|\beur\b', '', text)
    text = re.sub(r'[^a-z0-9\s&/\-]', ' ', text)
    return ' '.join(text.split())


def download_datasets(force=False):
    headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}
    dfs = []

    # 1. Download Banking Transaction Dataset
    train_csv_path = os.path.join(DATA_DIR, 'financial_transactions_train.csv')
    test_csv_path = os.path.join(DATA_DIR, 'financial_transactions_test.csv')

    if not (os.path.exists(train_csv_path) and os.path.exists(test_csv_path)) or force:
        print("[INFO] Fetching Banking Transaction Dataset from Kaggle...")
        try:
            req = urllib.request.Request(KAGGLE_BANKING_URL, headers=headers)
            with urllib.request.urlopen(req, timeout=45) as resp:
                z = zipfile.ZipFile(io.BytesIO(resp.read()))
                for name in z.namelist():
                    with open(os.path.join(DATA_DIR, name), 'wb') as f:
                        f.write(z.read(name))
                print(f"[INFO] Downloaded: {z.namelist()}")
        except Exception as e:
            print(f"[WARNING] Banking dataset download failed: {e}")

    if os.path.exists(train_csv_path):
        b_train = pd.read_csv(train_csv_path)
        b_test = pd.read_csv(test_csv_path) if os.path.exists(test_csv_path) else pd.DataFrame()
        banking_df = pd.concat([b_train, b_test], ignore_index=True)
        
        category_map = {
            'food': 'Food & Dining',
            'shopping': 'Shopping',
            'travel': 'Transportation',
            'emi': 'Bills & Utilities',
            'investment': 'Investment'
        }
        banking_df['category'] = banking_df['label'].str.lower().map(category_map)
        banking_df = banking_df.rename(columns={'transaction_narration': 'description'})[['description', 'category']]
        dfs.append(banking_df)
        print(f"[INFO] Loaded Banking Dataset: {len(banking_df)} rows")

    # 2. Download Personal Expense Classification Dataset
    personal_csv_path = os.path.join(DATA_DIR, 'personal_expense_classification.csv')
    if not os.path.exists(personal_csv_path) or force:
        print("[INFO] Fetching Personal Expense Dataset from Kaggle...")
        try:
            req = urllib.request.Request(KAGGLE_PERSONAL_URL, headers=headers)
            with urllib.request.urlopen(req, timeout=45) as resp:
                z = zipfile.ZipFile(io.BytesIO(resp.read()))
                for name in z.namelist():
                    with open(os.path.join(DATA_DIR, name), 'wb') as f:
                        f.write(z.read(name))
                print(f"[INFO] Downloaded: {z.namelist()}")
        except Exception as e:
            print(f"[WARNING] Personal expense dataset download failed: {e}")

    if os.path.exists(personal_csv_path):
        p_df = pd.read_csv(personal_csv_path)
        if 'description' in p_df.columns and 'category' in p_df.columns:
            p_clean = pd.DataFrame()
            if 'merchant' in p_df.columns:
                p_clean['description'] = p_df['merchant'].fillna('') + ' ' + p_df['description'].fillna('')
            else:
                p_clean['description'] = p_df['description']

            p_cat_map = {
                'food': 'Food & Dining',
                'transport': 'Transportation',
                'shopping': 'Shopping',
                'entertainment': 'Entertainment',
                'technology': 'Bills & Utilities'
            }
            p_clean['category'] = p_df['category'].str.lower().map(lambda x: p_cat_map.get(x, x.title()))
            dfs.append(p_clean[['description', 'category']])
            print(f"[INFO] Loaded Personal Expense Dataset: {len(p_clean)} rows")

    # 3. Targeted realistic vocabulary additions for household personal finance
    common_phrases = {
        "Bills & Utilities": [
            "Electricity bill monthly power payment", "Electric utility charge bill", "Water board municipal water bill",
            "Internet wifi broadband high speed bill", "Mobile phone postpaid recharge bill", "Apartment rent monthly landlord payment",
            "Home natural gas pipeline cylinder refill", "Trash collection sewage municipal utility", "Cable TV dish subscription bill",
            "Electricity board online bill payment", "Broadband fiber optic connection bill", "House rent maintenance payment"
        ],
        "Entertainment": [
            "Netflix monthly streaming subscription", "Spotify music family plan payment", "Disney Hotstar streaming subscription",
            "YouTube premium membership payment", "Cinema movie ticket booking PVR IMAX", "Movie theater tickets popcorn snacks",
            "PlayStation Plus game store purchase", "Steam video game digital purchase", "Concert tickets live show festival",
            "Bowling arcade amusement park tickets", "Amazon Prime video subscription fee", "Audible audiobooks monthly credit"
        ],
        "Health & Medical": [
            "Pharmacy drugstore medicine prescription", "Doctor consultation clinic hospital fee", "Dental clinic teeth cleaning checkup",
            "Gym monthly fitness membership workout", "Diagnostic lab blood test pathology", "Optometry eyeglasses eye clinic lenses",
            "Health insurance premium monthly payment", "Physiotherapy rehab session payment", "Vitamins health supplements store"
        ],
        "Income": [
            "Monthly salary direct deposit employer", "Payroll company salary credit account", "Freelance project payment client wire",
            "Consulting fee invoice payment received", "Company annual bonus incentive payout", "Stock dividend payout investment yield",
            "Rental property monthly income received", "Tax refund government direct deposit"
        ],
        "Food & Dining": [
            "Grocery store supermarket fresh fruits vegetables", "Supermarket food supplies dairy bread eggs",
            "Starbucks cafe coffee latte mocha", "Bakery fresh bread cakes pastries", "Pizza pasta Italian dinner restaurant",
            "Burger king meal fries soda lunch", "Cafe breakfast espresso cappuccino", "Dinner date restaurant food bill"
        ],
        "Transportation": [
            "Gas station petrol diesel fuel fill up", "Uber cab ride trip to airport", "Lyft taxi ride city center",
            "Public subway transit metro smart card recharge", "Bus pass train ticket railway booking",
            "Car parking lot garage fee", "Car wash auto maintenance motor service", "Toll booth highway turnpike fee"
        ],
        "Shopping": [
            "Amazon online retail package delivery", "Clothing apparel jeans jacket boutique", "Footwear sneakers boots shoes store",
            "Electronics gadgets wireless headphones charger", "Home decor furniture kitchen cookware", "Cosmetics skincare beauty products"
        ],
        "Investment": [
            "Mutual fund SIP monthly recurring investment", "Stock broker equity shares purchase",
            "Retirement 401k pension fund contribution", "Fixed deposit recurring deposit bank savings",
            "Gold sovereign bullion investment certificate", "Index fund ETF portfolio allocation"
        ]
    }

    supp_rows = []
    # Repeat the phrases slightly to give reasonable representation against 2000 bank samples
    for cat, phrases in common_phrases.items():
        for _ in range(15):
            for p in phrases:
                supp_rows.append({'description': p, 'category': cat})
                
    dfs.append(pd.DataFrame(supp_rows))

    # Combine all
    combined_df = pd.concat(dfs, ignore_index=True)
    combined_df['description'] = combined_df['description'].astype(str).str.strip()
    combined_df = combined_df[combined_df['description'].str.len() > 2]

    combined_df.to_csv(COMBINED_DATASET_CSV, index=False)
    print(f"\n[SUCCESS] Unified dataset created at {COMBINED_DATASET_CSV}")
    print(f"Total records: {len(combined_df)}")
    print("Class distribution:")
    print(combined_df['category'].value_counts())
    return COMBINED_DATASET_CSV


if __name__ == '__main__':
    download_datasets(force=False)
