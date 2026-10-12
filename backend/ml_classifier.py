"""
Machine Learning Classifier for Expense Categorization.
Trained on real Kaggle transaction dataset using Scikit-Learn:
- TF-IDF Vectorizer (n-grams 1-2)
- Multinomial Naive Bayes classifier
"""

import os
import re
import joblib
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.naive_bayes import MultinomialNB
from sklearn.pipeline import Pipeline
from sklearn.metrics import classification_report, accuracy_score

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_CSV = os.path.join(BASE_DIR, 'data', 'transaction_categorization.csv')
MODEL_PATH = os.path.join(BASE_DIR, 'model.joblib')


def preprocess_text(text: str) -> str:
    """Cleans transaction description string for vectorization."""
    if not isinstance(text, str):
        return ""
    text = text.lower()
    # Remove transaction IDs, amounts, currencies common in banking narrations
    text = re.sub(r'ref\d+', '', text)
    text = re.sub(r'amt\d+', '', text)
    text = re.sub(r'\binr\b|\busd\b|\beur\b|\bref\b', '', text)
    # Remove symbols and punctuation
    text = re.sub(r'[^a-z0-9\s&/\-]', ' ', text)
    return ' '.join(text.split())


def train_model():
    if not os.path.exists(DATA_CSV):
        from download_dataset import download_datasets
        download_datasets()

    print(f"[ML] Loading dataset from {DATA_CSV}...")
    df = pd.read_csv(DATA_CSV)
    df['clean_text'] = df['description'].apply(preprocess_text)
    
    # Filter empty texts
    df = df[df['clean_text'].str.len() > 0]
    
    X = df['clean_text']
    y = df['category']
    
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.15, random_state=42, stratify=y
    )
    
    print(f"[ML] Training on {len(X_train)} samples, testing on {len(X_test)} samples...")
    pipeline = Pipeline([
        ('tfidf', TfidfVectorizer(
            ngram_range=(1, 2),
            sublinear_tf=True,
            min_df=1,
            max_df=0.95
        )),
        ('nb', MultinomialNB(alpha=0.1))
    ])
    
    pipeline.fit(X_train, y_train)
    
    y_pred = pipeline.predict(X_test)
    acc = accuracy_score(y_test, y_pred)
    print(f"[ML] Model trained successfully! Test Accuracy: {acc * 100:.2f}%")
    
    # Save model and categories list
    model_artifact = {
        'pipeline': pipeline,
        'classes': list(pipeline.classes_),
        'accuracy': float(acc),
        'total_samples': len(df)
    }
    joblib.dump(model_artifact, MODEL_PATH)
    print(f"[ML] Saved model artifact to {MODEL_PATH}")
    return model_artifact


_model_cache = None

def get_model():
    global _model_cache
    if _model_cache is None:
        if not os.path.exists(MODEL_PATH):
            _model_cache = train_model()
        else:
            _model_cache = joblib.load(MODEL_PATH)
    return _model_cache


def predict_category(text: str) -> dict:
    """
    Predicts the expense category for a given user transaction description.
    Returns:
        category: top predicted category name
        confidence: probability between 0 and 1
        all_scores: dict mapping category -> score
    """
    if not text or not text.strip():
        return {
            'category': 'Other',
            'confidence': 0.0,
            'is_predicted': False
        }

    artifact = get_model()
    pipeline = artifact['pipeline']
    cleaned = preprocess_text(text)
    
    if not cleaned:
        return {
            'category': 'Other',
            'confidence': 0.0,
            'is_predicted': False
        }

    probs = pipeline.predict_proba([cleaned])[0]
    classes = pipeline.classes_
    
    top_idx = probs.argmax()
    top_cat = classes[top_idx]
    top_prob = float(probs[top_idx])

    # Build top candidate distribution
    sorted_indices = probs.argsort()[::-1]
    candidates = [
        {'category': classes[i], 'confidence': round(float(probs[i]), 3)}
        for i in sorted_indices[:3] if probs[i] > 0.05
    ]

    return {
        'category': top_cat,
        'confidence': round(top_prob, 3),
        'candidates': candidates,
        'is_predicted': True
    }


if __name__ == '__main__':
    train_model()
    
    # Quick sanity checks
    test_cases = [
        "Starbucks iced mocha",
        "Uber ride to airport",
        "Amazon headphones order",
        "Electricity bill payment",
        "Netflix subscription",
        "Monthly company salary deposit",
        "Pharmacy medicine prescription",
        "Mutual fund SIP investment"
    ]
    print("\n--- Model Test Predictions ---")
    for t in test_cases:
        res = predict_category(t)
        print(f"'{t}' -> {res['category']} (confidence: {res['confidence'] * 100:.1f}%)")
