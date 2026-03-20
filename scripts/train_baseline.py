from __future__ import annotations

import csv
import sys
from pathlib import Path

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, classification_report
from sklearn.model_selection import train_test_split

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

    x_train, x_test, y_train, y_test = train_test_split(
        texts,
        labels,
        test_size=0.25,
        random_state=42,
        stratify=labels,
    )

    vectorizer = TfidfVectorizer(stop_words=sorted(STOPWORDS_PT))
    x_train_vec = vectorizer.fit_transform(x_train)
    x_test_vec = vectorizer.transform(x_test)

    model = LogisticRegression(max_iter=1000)
    model.fit(x_train_vec, y_train)

    predictions = model.predict(x_test_vec)
    print(f"Acurácia: {accuracy_score(y_test, predictions):.2f}")
    print(classification_report(y_test, predictions))


if __name__ == "__main__":
    main()
