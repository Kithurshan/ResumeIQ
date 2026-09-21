import os
import pickle
import numpy as np
from typing import Dict, Any, List

class XGBoostInference:
    _instance = None
    _model = None

    # ── Transparent weighted scoring ──────────────────────
    # These weights drive the numeric overall_score that
    # determines candidate ranking.  XGBoost is still used
    # for the recommendation *label* only.
    SKILL_W       = 0.40
    EXPERIENCE_W  = 0.20
    SEMANTIC_W    = 0.15
    PROJECT_W     = 0.15
    EDUCATION_W   = 0.10

    # Bonus caps (added on top, then clamped to 100)
    PORTFOLIO_BONUS_MAX   = 5.0
    LINKEDIN_BONUS_MAX    = 5.0
    CERTIFICATION_BONUS   = 3.0

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(XGBoostInference, cls).__new__(cls)
            cls._instance._load_model()
        return cls._instance

    def _load_model(self):
        model_path = os.path.join(os.getcwd(), 'ml', 'models', 'resumeiq_xgboost_model.pkl')
        if not os.path.exists(model_path):
            self._model = None
            return
        try:
            with open(model_path, 'rb') as f:
                self._model = pickle.load(f)
        except Exception as e:
            print(f"Failed to load XGBoost model: {e}")
            self._model = None

    # ──────────────────────────────────────────────────────
    def _calculate_weighted_score(self, features: Dict[str, float]) -> float:
        """
        Compute a transparent overall score from component
        scores so that candidates with different strengths
        receive meaningfully different numbers.
        """
        base = (
            features.get("skill_score", 0.0)         * self.SKILL_W
            + features.get("experience_score", 0.0)   * self.EXPERIENCE_W
            + features.get("semantic_score", 0.0)      * self.SEMANTIC_W
            + features.get("project_score", 0.0)       * self.PROJECT_W
            + features.get("education_score", 0.0)     * self.EDUCATION_W
        )

        # Portfolio bonus: scale [0-100] → [0-BONUS_MAX]
        portfolio_raw = features.get("portfolio_score", 0.0)
        portfolio_bonus = (portfolio_raw / 100.0) * self.PORTFOLIO_BONUS_MAX

        # LinkedIn bonus
        linkedin_raw = features.get("linkedin_score", 0.0)
        linkedin_bonus = (linkedin_raw / 100.0) * self.LINKEDIN_BONUS_MAX

        # Certification bonus (binary: has certs or not)
        cert_bonus = self.CERTIFICATION_BONUS if features.get("certification_score", 0.0) > 0 else 0.0

        total = base + portfolio_bonus + linkedin_bonus + cert_bonus
        return round(min(100.0, max(0.0, total)), 2)

    # ──────────────────────────────────────────────────────
    def _get_recommendation_label(self, features: Dict[str, float], weighted_score: float) -> str:
        """
        Determine the recommendation label.
        Uses XGBoost if the model is available, otherwise
        falls back to score-based thresholds.
        """
        if self._model is not None:
            try:
                feature_order = [
                    'skill_score', 'experience_score', 'education_score',
                    'certification_score', 'semantic_score', 'portfolio_score',
                    'linkedin_score'
                ]
                feature_vector = np.array([[features.get(f, 0.0) for f in feature_order]])
                prediction = int(self._model.predict(feature_vector)[0])
                if prediction == 1 and weighted_score >= 65:
                    return "Highly Recommended"
                elif prediction == 1 or weighted_score >= 50:
                    return "Recommended"
                else:
                    return "Not Recommended"
            except Exception as e:
                print(f"[XGBoost] Classification fallback: {e}")

        # Fallback: pure score-based thresholds
        if weighted_score >= 75:
            return "Highly Recommended"
        elif weighted_score >= 50:
            return "Recommended"
        elif weighted_score >= 35:
            return "Potential Match"
        return "Not Recommended"

    # ──────────────────────────────────────────────────────
    def predict(self, features: Dict[str, float]) -> Dict[str, Any]:
        """
        Expects: skill_score, experience_score, education_score, 
        certification_score, semantic_score, portfolio_score,
        linkedin_score, project_score

        Returns overall_score (weighted) and recommendation label.
        The XGBoost model is no longer required — if missing,
        the recommendation falls back to score thresholds.
        """
        weighted_score = self._calculate_weighted_score(features)
        recommendation = self._get_recommendation_label(features, weighted_score)

        return {
            "overall_score": weighted_score,
            "recommendation": recommendation,
            "xgboost_probability": self._get_xgboost_proba(features),
        }

    def _get_xgboost_proba(self, features: Dict[str, float]) -> float:
        """Return XGBoost class-1 probability for informational purposes."""
        if self._model is None:
            return 0.0
        try:
            feature_order = [
                'skill_score', 'experience_score', 'education_score',
                'certification_score', 'semantic_score', 'portfolio_score',
                'linkedin_score'
            ]
            feature_vector = np.array([[features.get(f, 0.0) for f in feature_order]])
            proba = self._model.predict_proba(feature_vector)[0]
            return round(float(proba[1]) * 100, 2)
        except Exception:
            return 0.0

