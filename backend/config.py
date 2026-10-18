import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY', 'readify-ai-secret-key-2025-secure')
    DATABASE_PATH = os.environ.get('DATABASE_PATH', str(BASE_DIR / 'database' / 'readify.db'))
    DEBUG = os.environ.get('FLASK_DEBUG', 'False').lower() in ('true', '1', 't')
    PORT = int(os.environ.get('PORT', 5000))
    HOST = os.environ.get('HOST', '127.0.0.1')
    
    # NLP and Text limits
    MIN_WORD_COUNT = 5
    MAX_WORD_COUNT = 5000
    
    # Question count
    DEFAULT_QUESTION_COUNT = 5
