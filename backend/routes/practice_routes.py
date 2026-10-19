import logging
from flask import Blueprint, request, jsonify
from backend.services.practice_service import practice_service, EXERCISE_BANK
from backend.services.coach_service import GRAMMAR_TOPIC_DESCRIPTIONS
from backend.routes.auth_routes import get_current_user

logger = logging.getLogger(__name__)
practice_bp = Blueprint('practice', __name__)

@practice_bp.route('/practice/categories', methods=['GET'])
def get_categories():
    """List available grammar categories with descriptions and rule hints."""
    categories = []
    for cat_id, meta in GRAMMAR_TOPIC_DESCRIPTIONS.items():
        count = sum(1 for e in EXERCISE_BANK if e['category'] == cat_id)
        categories.append({
            'id': cat_id,
            'title': meta['title'],
            'name': meta['title'],
            'icon': 'target',
            'rule_summary': meta['rule_summary'],
            'common_trap': meta['common_trap'],
            'tip': meta['tip'],
            'available_exercises': count
        })
    return jsonify({'success': True, 'data': categories}), 200

@practice_bp.route('/practice/exercises', methods=['GET'])
def get_exercises():
    """Retrieve exercises filtered by category and difficulty."""
    category = request.args.get('category', 'all')
    difficulty = request.args.get('difficulty', 'all')
    count = int(request.args.get('count', 5))

    exercises = practice_service.get_exercises(category=category, difficulty=difficulty, count=count)
    return jsonify({
        'success': True,
        'data': {
            'exercises': exercises,
            'count': len(exercises),
            'category': category,
            'difficulty': difficulty
        }
    }), 200

@practice_bp.route('/practice/submit', methods=['POST'])
def submit_practice():
    """Grade exercise answers and record attempt to student progress."""
    data = request.get_json(silent=True) or {}
    category = data.get('category', 'mixed')
    difficulty = data.get('difficulty', 'Intermediate')
    answers = data.get('answers', {})

    if not answers:
        return jsonify({'success': False, 'error': 'No answers provided.'}), 400

    user = get_current_user()
    user_id = user['id'] if user else 1  # Fallback to demo student if unauthenticated

    result = practice_service.submit_exercise(
        user_id=user_id,
        category=category,
        difficulty=difficulty,
        answers=answers
    )

    return jsonify({'success': True, 'data': result}), 200
