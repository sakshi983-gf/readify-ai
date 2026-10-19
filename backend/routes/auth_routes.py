import functools
import logging
from flask import Blueprint, request, jsonify
from backend.database.db import (
    create_user,
    authenticate_user,
    create_auth_token,
    get_user_by_token,
    delete_auth_token,
    update_user_profile
)

logger = logging.getLogger(__name__)
auth_bp = Blueprint('auth', __name__)

def get_current_user():
    """Extracts user from Authorization Bearer token header if present."""
    auth_header = request.headers.get('Authorization', '')
    if auth_header.startswith('Bearer '):
        token = auth_header[7:].strip()
        return get_user_by_token(token)
    return None

def require_auth(f):
    """Decorator requiring valid user session token."""
    @functools.wraps(f)
    def decorated(*args, **kwargs):
        user = get_current_user()
        if not user:
            return jsonify({
                'success': False,
                'error': 'Authentication required. Please sign in.'
            }), 401
        return f(user, *args, **kwargs)
    return decorated

@auth_bp.route('/auth/register', methods=['POST'])
def register():
    try:
        data = request.get_json(silent=True) or {}
        username = (data.get('username') or data.get('name') or '').strip()
        email = data.get('email', '').strip()
        password = data.get('password', '').strip()
        english_level = (data.get('english_level') or data.get('grade_level') or 'Intermediate').strip()

        if not username or not email or not password:
            return jsonify({'success': False, 'error': 'Username/name, email, and password are required.'}), 400

        if len(password) < 6:
            return jsonify({'success': False, 'error': 'Password must be at least 6 characters long.'}), 400

        user = create_user(
            username=username,
            email=email,
            password=password,
            role='student',
            english_level=english_level
        )
        token = create_auth_token(user['id'])

        user_data = {**user, 'name': user.get('username')}
        return jsonify({
            'success': True,
            'message': 'Account created successfully!',
            'data': {
                'user': user_data,
                'token': token,
                **user_data
            }
        }), 201
    except ValueError as ve:
        return jsonify({'success': False, 'error': str(ve)}), 400
    except Exception as e:
        logger.exception("Registration failed: %s", e)
        return jsonify({'success': False, 'error': 'Failed to create account.'}), 500

@auth_bp.route('/auth/login', methods=['POST'])
def login():
    try:
        data = request.get_json(silent=True) or {}
        email = data.get('email', '').strip()
        password = data.get('password', '').strip()

        if not email or not password:
            return jsonify({'success': False, 'error': 'Email and password are required.'}), 400

        user = authenticate_user(email, password)
        if not user:
            return jsonify({'success': False, 'error': 'Invalid email or password.'}), 401

        token = create_auth_token(user['id'])

        return jsonify({
            'success': True,
            'message': f"Welcome back, {user['username']}!",
            'data': {
                'user': user,
                'token': token,
                **user
            }
        }), 200
    except Exception as e:
        logger.exception("Login failed: %s", e)
        return jsonify({'success': False, 'error': 'Failed to authenticate user.'}), 500

@auth_bp.route('/auth/me', methods=['GET'])
def get_me():
    user = get_current_user()
    if not user:
        return jsonify({'success': False, 'error': 'Not authenticated'}), 401
    return jsonify({
        'success': True,
        'data': {
            'user': user,
            **user
        }
    }), 200

@auth_bp.route('/auth/profile', methods=['PUT', 'POST'])
def update_profile():
    user = get_current_user()
    if not user:
        return jsonify({'success': False, 'error': 'Not authenticated'}), 401

    data = request.get_json(silent=True) or {}
    username = data.get('username')
    english_level = data.get('english_level')

    updated = update_user_profile(user['id'], username=username, english_level=english_level)
    return jsonify({
        'success': True,
        'message': 'Profile updated successfully!',
        'data': {'user': updated}
    }), 200

@auth_bp.route('/auth/logout', methods=['POST'])
def logout():
    auth_header = request.headers.get('Authorization', '')
    if auth_header.startswith('Bearer '):
        token = auth_header[7:].strip()
        delete_auth_token(token)
    return jsonify({'success': True, 'message': 'Signed out successfully.'}), 200
