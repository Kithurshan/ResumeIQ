from typing import List

from sklearn.metrics.pairwise import cosine_similarity


class SemanticMatcher:
    """
    Handles SBERT semantic matching.

    SBERT converts text into numerical embeddings.
    Cosine similarity compares those embeddings.
    """

    MODEL_NAME = "all-MiniLM-L6-v2"

    def __init__(self):
        self._model = None

    @property
    def model(self):
        if self._model is None:
            # Lazy import: only load torch + sentence_transformers on first use,
            # so uvicorn can bind the port without waiting for these heavy imports.
            from sentence_transformers import SentenceTransformer
            print("Loading SBERT model for the first time...")
            self._model = SentenceTransformer(self.MODEL_NAME)
            print("SBERT model loaded successfully.")
        return self._model

    def create_embedding(self, text: str):
        """
        Convert text into an SBERT embedding.
        """

        if not text or not text.strip():
            return None

        return self.model.encode(
            text,
            convert_to_numpy=True,
            normalize_embeddings=True,
        )

    @staticmethod
    def _rescale_cosine(raw_cosine: float) -> float:
        """
        Rescale raw cosine similarity to a 0-100 score
        with realistic spread.

        SBERT all-MiniLM-L6-v2 produces cosine values
        typically in [0.2, 0.85] for related text.
        The old formula ((cos+1)/2)*100 compressed that
        into [60, 92.5], making candidates indistinguishable.

        This piecewise mapping gives full 0-100 spread:
          cos < 0.20  →  0-10   (unrelated)
          cos 0.20-0.40 → 10-30 (weak match)
          cos 0.40-0.55 → 30-50 (below average)
          cos 0.55-0.70 → 50-70 (moderate match)
          cos 0.70-0.82 → 70-85 (good match)
          cos 0.82-0.92 → 85-95 (very good)
          cos > 0.92  → 95-100  (near identical)
        """
        breakpoints = [
            (0.00, 0.0),
            (0.20, 10.0),
            (0.40, 30.0),
            (0.55, 50.0),
            (0.70, 70.0),
            (0.82, 85.0),
            (0.92, 95.0),
            (1.00, 100.0),
        ]

        # Clamp to [0, 1] (negative cosine → 0)
        cos = max(0.0, min(1.0, float(raw_cosine)))

        for i in range(len(breakpoints) - 1):
            x0, y0 = breakpoints[i]
            x1, y1 = breakpoints[i + 1]
            if cos <= x1:
                # Linear interpolation within segment
                t = (cos - x0) / (x1 - x0) if x1 != x0 else 0.0
                return y0 + t * (y1 - y0)

        return 100.0

    def calculate_similarity(
        self,
        text_a: str,
        text_b: str,
    ) -> float:
        """
        Calculate semantic similarity between two texts.

        Returns a percentage from 0 to 100.
        """

        if not text_a or not text_b:
            return 0.0

        embedding_a = self.create_embedding(
            text_a
        )

        embedding_b = self.create_embedding(
            text_b
        )

        if embedding_a is None or embedding_b is None:
            return 0.0

        similarity = cosine_similarity(
            [embedding_a],
            [embedding_b],
        )[0][0]

        score = self._rescale_cosine(similarity)

        return round(
            max(0.0, min(100.0, score)),
            2,
        )

    def compare_many(
        self,
        source_text: str,
        target_texts: List[str],
    ):
        """
        Compare one text against many texts.

        Useful for comparing a job requirement
        against several candidate skills.
        """

        if not source_text or not target_texts:
            return []

        source_embedding = self.create_embedding(
            source_text
        )

        results = []

        for target in target_texts:

            if not target:
                continue

            target_embedding = self.create_embedding(
                target
            )

            similarity = cosine_similarity(
                [source_embedding],
                [target_embedding],
            )[0][0]

            score = self._rescale_cosine(similarity)

            results.append({
                "text": target,
                "similarity": round(
                    score,
                    2,
                ),
            })

        return sorted(
            results,
            key=lambda item: item["similarity"],
            reverse=True,
        )