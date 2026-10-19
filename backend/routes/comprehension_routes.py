import logging
from flask import Blueprint, request, jsonify
from backend.services.reading_comprehension_service import reading_comprehension_service
from backend.routes.auth_routes import get_current_user

logger = logging.getLogger(__name__)
comprehension_bp = Blueprint('comprehension', __name__)

@comprehension_bp.route('/comprehension/passages', methods=['GET'])
def get_passages():
    """Retrieve grounded reading passages filtered by topic and difficulty."""
    topic = request.args.get('topic', 'all')
    difficulty = request.args.get('difficulty', 'all')

    passages = reading_comprehension_service.get_passages(topic=topic, difficulty=difficulty)
    return jsonify({
        'success': True,
        'data': {
            'passages': passages,
            'count': len(passages)
        }
    }), 200

@comprehension_bp.route('/comprehension/submit', methods=['POST'])
def submit_comprehension():
    """Evaluate submitted student answers against grounded passage evidence."""
    data = request.get_json(silent=True) or {}
    passage_id = data.get('passage_id')
    answers = data.get('answers', {})

    if not passage_id:
        return jsonify({'success': False, 'error': 'passage_id is required.'}), 400

    user = get_current_user()
    user_id = user['id'] if user else 1

    try:
        result = reading_comprehension_service.evaluate_comprehension(
            user_id=user_id,
            passage_id=passage_id,
            answers=answers
        )
        return jsonify({'success': True, 'data': result}), 200
    except ValueError as ve:
        return jsonify({'success': False, 'error': str(ve)}), 404
    except Exception as e:
        logger.exception("Comprehension evaluation failed: %s", e)
        return jsonify({'success': False, 'error': 'Failed to evaluate reading comprehension.'}), 500
