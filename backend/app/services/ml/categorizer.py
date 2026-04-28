import numpy as np
import pandas as pd
import joblib
from pathlib import Path
from typing import Optional
from sklearn.pipeline import Pipeline
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import classification_report

MODEL_PATH = Path(__file__).parent.parent.parent.parent.parent / "ml" / "models" / "categorizer.pkl"

# Seed training data — grows over time from real DB rows
SEED_DATA = [
    ("AWS",             "cloud",     "Cloud Infrastructure"),
    ("Google Cloud",    "compute",   "Cloud Infrastructure"),
    ("Azure",           "storage",   "Cloud Infrastructure"),
    ("GitHub",          "software",  "Software & SaaS"),
    ("Slack",           "saas",      "Software & SaaS"),
    ("Notion",          "saas",      "Software & SaaS"),
    ("WeWork",          "office",    "Rent & Facilities"),
    ("Regus",           "office",    "Rent & Facilities"),
    ("Google Ads",      "marketing", "Marketing"),
    ("Meta Ads",        "marketing", "Marketing"),
    ("HubSpot",         "crm",       "Marketing"),
    ("Gusto",           "payroll",   "Payroll"),
    ("ADP",             "payroll",   "Payroll"),
    ("United Airlines", "travel",    "Travel & Entertainment"),
    ("Marriott",        "hotel",     "Travel & Entertainment"),
    ("Uber",            "travel",    "Travel & Entertainment"),
    ("Stripe",          "payment",   "Revenue"),
    ("PayPal",          "payment",   "Revenue"),
    ("Shopify",         "revenue",   "Revenue"),
    ("Staples",         "supplies",  "Office Supplies"),
    ("Amazon",          "equipment", "Hardware & Equipment"),
    ("Dell",            "hardware",  "Hardware & Equipment"),
    ("Allstate",        "insurance", "Insurance"),
    ("LegalZoom",       "legal",     "Legal & Compliance"),
    ("PG&E",            "utilities", "Utilities"),
    ("AT&T",            "utilities", "Utilities"),
]


class TransactionCategorizer:
    """TF-IDF + Logistic Regression pipeline for transaction categorization."""

    def __init__(self):
        self.pipeline: Optional[Pipeline] = None
        self._load_or_train()

    def _build_pipeline(self) -> Pipeline:
        return Pipeline([
            ("tfidf", TfidfVectorizer(
                analyzer="word",
                ngram_range=(1, 2),
                max_features=5000,
                lowercase=True,
            )),
            ("clf", LogisticRegression(
                max_iter=1000,
                C=5.0,
                solver="lbfgs",
            )),
        ])

    def _seed_df(self) -> pd.DataFrame:
        rows = []
        for vendor, desc, cat in SEED_DATA:
            rows.append({"text": f"{vendor} {desc}",          "category": cat})
            rows.append({"text": f"invoice {vendor}",         "category": cat})
            rows.append({"text": f"receipt {vendor} {desc}",  "category": cat})
        return pd.DataFrame(rows)

    def _load_or_train(self):
        if MODEL_PATH.exists():
            self.pipeline = joblib.load(MODEL_PATH)
        else:
            self.train(self._seed_df())

    def train(self, df: pd.DataFrame):
        """df must have columns: text (str), category (str)."""
        X = df["text"].tolist()
        y = df["category"].tolist()
        self.pipeline = self._build_pipeline()
        self.pipeline.fit(X, y)
        MODEL_PATH.parent.mkdir(parents=True, exist_ok=True)
        joblib.dump(self.pipeline, MODEL_PATH)
        return self.pipeline

    def predict(self, vendor: str, description: str = "") -> dict:
        """Return predicted category and confidence score."""
        if not self.pipeline:
            return {"category": "Other", "confidence": 0.0}

        text       = f"{vendor} {description}".strip()
        category   = self.pipeline.predict([text])[0]
        probs      = self.pipeline.predict_proba([text])[0]
        confidence = float(np.max(probs))

        classes  = self.pipeline.classes_
        top3_idx = np.argsort(probs)[::-1][:3]
        alternatives = [
            {"category": classes[i], "confidence": round(float(probs[i]), 3)}
            for i in top3_idx
        ]

        return {
            "category":     category,
            "confidence":   round(confidence, 3),
            "alternatives": alternatives,
        }

    def retrain_from_db(self, labeled_transactions: list[dict]):
        """
        Retrain with real labeled data from the database.
        labeled_transactions: [{"vendor": str, "description": str, "category": str}]
        """
        rows = [
            {
                "text":     f"{t['vendor']} {t.get('description', '')}",
                "category": t["category"],
            }
            for t in labeled_transactions
            if t.get("category")
        ]
        if len(rows) < 20:
            return None
        return self.train(pd.DataFrame(rows))

    def evaluate(self, df: pd.DataFrame) -> str:
        """Return a classification report string."""
        y_pred = self.pipeline.predict(df["text"].tolist())
        return classification_report(df["category"].tolist(), y_pred)


# Singleton loaded once at app startup
categorizer = TransactionCategorizer()