"""
Audio & Pronunciation Assessment API Routes (Module 15).
"""
import logging
from flask import Blueprint, request, jsonify
from backend.services.pronunciation_service import pronunciation_service

logger = logging.getLogger(__name__)

audio_bp = Blueprint('audio', __name__)

@audio_bp.route('/audio/exercises', methods=['GET'])
def get_exercises():
    """Returns curated pronunciation practice exercises by CEFR level."""
    level = request.args.get('level', 'all')
    exercises = pronunciation_service.get_exercises(level)
    return jsonify({
        "success": True,
        "data": exercises,
        "count": len(exercises)
    }), 200

@audio_bp.route('/audio/evaluate', methods=['POST'])
def evaluate_audio():
    """
    Evaluates spoken text against reference text using CMUDict and Levenshtein alignment.
    Payload: { reference_text: str, spoken_text: str, duration_seconds: float }
    """
    data = request.get_json(silent=True) or {}
    reference = data.get('reference_text', '').strip()
    spoken = data.get('spoken_text', '').strip()
    duration = float(data.get('duration_seconds', 0.0))

    if not reference:
        return jsonify({
            "success": False,
            "error": "reference_text is required for pronunciation evaluation."
        }), 400

    try:
        report = pronunciation_service.evaluate_pronunciation(reference, spoken, duration)
        return jsonify({
            "success": True,
            "data": report
        }), 200
    except Exception as e:
        logger.error("Pronunciation evaluation error: %s", e)
        return jsonify({
            "success": False,
            "error": f"Failed to evaluate pronunciation: {str(e)}"
        }), 500
