import logging
from flask import Blueprint, request, jsonify
from backend.services.tone_service import tone_service

logger = logging.getLogger(__name__)
tone_bp = Blueprint('tone', __name__)

@tone_bp.route('/tone/rewrite', methods=['POST'])
def rewrite_tone():
    """Multi-Tone Writing Studio endpoint: transforms text to Academic, Professional, Casual, or Concise."""
    data = request.get_json(silent=True) or {}
    text = data.get('text', '').strip()
    target_tone = data.get('tone', 'academic').strip()

    if not text:
        return jsonify({'success': False, 'error': 'Text cannot be empty.'}), 400

    try:
        result = tone_service.rewrite_tone(text, target_tone)
        return jsonify({'success': True, 'data': result}), 200
    except Exception as e:
        logger.exception("Tone rewrite failed: %s", e)
        return jsonify({'success': False, 'error': 'Failed to rewrite text tone.'}), 500
