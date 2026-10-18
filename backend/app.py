import os
import sys
import logging
from pathlib import Path

# Add project root to sys.path
root_dir = Path(__file__).resolve().parent.parent
if str(root_dir) not in sys.path:
    sys.path.insert(0, str(root_dir))

from flask import Flask, jsonify
from flask_cors import CORS
from backend.config import Config
from backend.database.db import init_db
from backend.routes.analysis_routes import analysis_bp
from backend.routes.history_routes import history_bp

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(name)s: %(message)s'
)
logger = logging.getLogger('readify')

def create_app(config_class=Config):
    """Application factory for Readify Flask backend."""
    app = Flask(__name__)
    app.config.from_object(config_class)

    # Configure CORS to allow frontend communication
    CORS(app, resources={r"/api/*": {"origins": "*"}})

    # Initialize SQLite database
    with app.app_context():
        # Ensure database directory exists
        db_path = Path(app.config['DATABASE_PATH'])
        db_path.parent.mkdir(parents=True, exist_ok=True)
        init_db()

    # Health check endpoint
    @app.route('/api/health', methods=['GET'])
    def health_check():
        return jsonify({
            'status': 'healthy',
            'service': 'Readify Backend API',
            'version': '1.0.0',
            'database': 'SQLite connected',
            'mode': 'Local NLP Engine Active'
        }), 200

    # Register blueprints
    app.register_blueprint(analysis_bp, url_prefix='/api')
    app.register_blueprint(history_bp, url_prefix='/api')

    # Global error handlers
    @app.errorhandler(404)
    def not_found(error):
        return jsonify({'success': False, 'error': 'Endpoint not found'}), 404

    @app.errorhandler(500)
    def internal_error(error):
        return jsonify({'success': False, 'error': 'Internal server error'}), 500

    return app

if __name__ == '__main__':
    app = create_app()
    logger.info("Starting Readify Backend on %s:%s", Config.HOST, Config.PORT)
    app.run(host=Config.HOST, port=Config.PORT, debug=Config.DEBUG)
