import logging
from flask import Blueprint, request, jsonify
from backend.database import db
from backend.routes.auth_routes import get_current_user

logger = logging.getLogger(__name__)
history_bp = Blueprint('history', __name__)

@history_bp.route('/history', methods=['GET'])
def get_history_list():
    """Retrieve reading analysis history records (user-scoped if logged in)."""
    try:
        user = get_current_user()
        user_id = user['id'] if user and user.get('role') != 'admin' else None

        limit = min(int(request.args.get('limit', 50)), 100)
        offset = max(int(request.args.get('offset', 0)), 0)
        records = db.get_history(user_id=user_id, limit=limit, offset=offset)
        return jsonify({
            'success': True,
            'data': records,
            'count': len(records)
        }), 200
    except Exception as e:
        logger.exception("Error in get_history_list: %s", str(e))
        return jsonify({'success': False, 'error': str(e)}), 500

@history_bp.route('/history/<int:history_id>', methods=['GET'])
def get_history_detail(history_id):
    """Retrieve full analysis details for a single record."""
    try:
        record = db.get_history_by_id(history_id)
        if not record:
            return jsonify({'success': False, 'error': 'Record not found'}), 404
        return jsonify({
            'success': True,
            'data': record
        }), 200
    except Exception as e:
        logger.exception("Error in get_history_detail: %s", str(e))
        return jsonify({'success': False, 'error': str(e)}), 500

@history_bp.route('/history/<int:history_id>', methods=['DELETE'])
def delete_history_item(history_id):
    """Delete a reading history record."""
    try:
        success = db.delete_history(history_id)
        if not success:
            return jsonify({'success': False, 'error': 'Record not found or already deleted'}), 404
        return jsonify({
            'success': True,
            'message': f'Record {history_id} deleted successfully.'
        }), 200
    except Exception as e:
        logger.exception("Error in delete_history_item: %s", str(e))
        return jsonify({'success': False, 'error': str(e)}), 500

@history_bp.route('/history', methods=['DELETE'])
def clear_all_history_items():
    """Clear all analysis history."""
    try:
        db.clear_all_history()
        return jsonify({
            'success': True,
            'message': 'All reading history cleared successfully.'
        }), 200
    except Exception as e:
        logger.exception("Error in clear_all_history_items: %s", str(e))
        return jsonify({'success': False, 'error': str(e)}), 500

@history_bp.route('/dashboard', methods=['GET'])
def get_dashboard():
    """Retrieve aggregated stats, recent activity, and score trends for the dashboard."""
    try:
        user = get_current_user()
        user_id = user['id'] if user and user.get('role') != 'admin' else None
        stats = db.get_dashboard_stats(user_id=user_id)
        return jsonify({
            'success': True,
            'data': stats
        }), 200
    except Exception as e:
        logger.exception("Error in get_dashboard: %s", str(e))
        return jsonify({'success': False, 'error': str(e)}), 500
