import logging
from flask import Blueprint, request, jsonify
from backend.services.tutor_service import tutor_service
from backend.routes.auth_routes import get_current_user

logger = logging.getLogger(__name__)
tutor_bp = Blueprint('tutor', __name__)

@tutor_bp.route('/tutor/chat', methods=['POST'])
def chat():
    """Interactive conversational AI Tutor chat endpoint."""
    data = request.get_json(silent=True) or {}
    message = data.get('message', '').strip()
    history = data.get('history', [])
    mode = data.get('mode', 'general')
    current_passage = data.get('current_passage', '')

    if not message:
        return jsonify({'success': False, 'error': 'Message cannot be empty.'}), 400

    try:
        response = tutor_service.generate_reply(
            user_message=message,
            history=history,
            mode=mode,
            current_passage=current_passage
        )
        return jsonify({'success': True, 'data': response}), 200
    except Exception as e:
        logger.exception("Tutor chat failed: %s", e)
        return jsonify({'success': False, 'error': 'Failed to generate tutor response.'}), 500
