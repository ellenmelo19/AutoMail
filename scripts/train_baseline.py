from __future__ import annotations

import csv
import sys
from pathlib import Path

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import classification_report, confusion_matrix
from sklearn.model_selection import StratifiedKFold, cross_val_predict, cross_val_score
from sklearn.pipeline import Pipeline

ROOT = Path(__file__).resolve().parents[1]
DATA_PATH = ROOT / "data" / "samples.csv"
sys.path.append(str(ROOT))

from app.services.nlp import STOPWORDS_PT  # noqa: E402


def load_dataset(path: Path) -> tuple[list[str], list[str]]:
    texts: list[str] = []
    labels: list[str] = []
    with path.open(encoding="utf-8") as handle:
        reader = csv.DictReader(handle)
        for row in reader:
            text = (row.get("text") or "").strip()
            label = (row.get("label") or "").strip()
            if text and label:
                texts.append(text)
                labels.append(label)
    return texts, labels


def main() -> None:
    texts, labels = load_dataset(DATA_PATH)
    if not texts:
        raise SystemExit("Dataset vazio. Verifique data/samples.csv.")

    pipeline = Pipeline(
        steps=[
            (
                "tfidf",
                TfidfVectorizer(
                    stop_words=sorted(STOPWORDS_PT),
                    ngram_range=(1, 2),
                    min_df=1,
                ),
            ),
            ("clf", LogisticRegression(max_iter=1000, class_weight="balanced")),
        ]
    )

    kfold = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    scores = cross_val_score(pipeline, texts, labels, cv=kfold, scoring="accuracy")
    print(f"Acurácia (5-fold): {scores.mean():.2f} ± {scores.std():.2f}")

    predictions = cross_val_predict(pipeline, texts, labels, cv=kfold)
    print(classification_report(labels, predictions))
    print("Matriz de confusão:")
    print(confusion_matrix(labels, predictions))


if __name__ == "__main__":
    main()
