import logging
from flask import Blueprint, jsonify
from backend.services.coach_service import coach_service
from backend.routes.auth_routes import get_current_user

logger = logging.getLogger(__name__)
coach_bp = Blueprint('coach', __name__)

@coach_bp.route('/coach/diagnostic', methods=['GET'])
def get_diagnostic():
    """Retrieve student's personalized learning diagnostic and study plan."""
    user = get_current_user()
    user_id = user['id'] if user else 1  # Default to demo student if unauthenticated

    diagnostic = coach_service.get_diagnostic(user_id=user_id)
    # Add convenient aliases for frontend & integration testing
    diagnostic['weak_categories'] = diagnostic.get('weak_areas', [])
    diagnostic['strong_categories'] = diagnostic.get('strong_areas', [])
    diagnostic['priority_actions'] = [s.get('action') for s in diagnostic.get('actionable_steps', [])]
    diagnostic['overall_status'] = diagnostic.get('current_level', 'Intermediate')
    diagnostic['category_mastery'] = {t['category']: t['accuracy'] for t in diagnostic.get('all_topics', [])}
    diagnostic['topic_guides'] = {t['category']: t.get('info', {}) for t in diagnostic.get('all_topics', [])}

    return jsonify({
        'success': True,
        'data': diagnostic
    }), 200
