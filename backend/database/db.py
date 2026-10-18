import sqlite3
import json
import logging
from datetime import datetime
from backend.config import Config

logger = logging.getLogger(__name__)

def get_db_connection():
    """Create and return a new SQLite database connection."""
    conn = sqlite3.connect(Config.DATABASE_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    """Initialize database tables and indexes."""
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS reading_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                title TEXT,
                original_text TEXT NOT NULL,
                corrected_text TEXT NOT NULL,
                word_count INTEGER DEFAULT 0,
                char_count INTEGER DEFAULT 0,
                grammar_errors_count INTEGER DEFAULT 0,
                grammar_score REAL DEFAULT 100.0,
                comprehension_score REAL DEFAULT 0.0,
                overall_score REAL DEFAULT 0.0,
                readability_score REAL DEFAULT 0.0,
                readability_level TEXT DEFAULT 'Standard',
                reading_time_minutes REAL DEFAULT 1.0,
                quiz_data TEXT DEFAULT '[]',
                feedback TEXT DEFAULT '[]',
                status TEXT DEFAULT 'analyzed'
            )
        ''')
        cursor.execute('''
            CREATE INDEX IF NOT EXISTS idx_reading_history_created 
            ON reading_history(created_at DESC)
        ''')
        conn.commit()
        logger.info("Database initialized successfully at %s", Config.DATABASE_PATH)
    except Exception as e:
        logger.error("Failed to initialize database: %s", str(e))
        conn.rollback()
        raise e
    finally:
        conn.close()

def save_analysis(data):
    """Save initial passage analysis results."""
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO reading_history (
                title, original_text, corrected_text, word_count, char_count,
                grammar_errors_count, grammar_score, comprehension_score,
                overall_score, readability_score, readability_level,
                reading_time_minutes, quiz_data, feedback, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            data.get('title', 'Untitled Reading'),
            data['original_text'],
            data.get('corrected_text', data['original_text']),
            data.get('word_count', 0),
            data.get('char_count', 0),
            data.get('grammar_errors_count', 0),
            data.get('grammar_score', 100.0),
            data.get('comprehension_score', 0.0),
            data.get('overall_score', 0.0),
            data.get('readability_score', 0.0),
            data.get('readability_level', 'Standard'),
            data.get('reading_time_minutes', 1.0),
            json.dumps(data.get('quiz_data', [])),
            json.dumps(data.get('feedback', [])),
            data.get('status', 'analyzed')
        ))
        conn.commit()
        record_id = cursor.lastrowid
        return get_history_by_id(record_id)
    except Exception as e:
        conn.rollback()
        logger.error("Failed to save analysis: %s", str(e))
        raise e
    finally:
        conn.close()

def update_quiz_results(history_id, comprehension_score, overall_score, quiz_data, feedback):
    """Update existing analysis with completed quiz answers, final scores, and feedback."""
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute('''
            UPDATE reading_history
            SET comprehension_score = ?,
                overall_score = ?,
                quiz_data = ?,
                feedback = ?,
                status = 'completed'
            WHERE id = ?
        ''', (
            comprehension_score,
            overall_score,
            json.dumps(quiz_data),
            json.dumps(feedback),
            history_id
        ))
        conn.commit()
        return get_history_by_id(history_id)
    except Exception as e:
        conn.rollback()
        logger.error("Failed to update quiz results for id %s: %s", history_id, str(e))
        raise e
    finally:
        conn.close()

def get_history(limit=50, offset=0):
    """Retrieve paginated reading history entries."""
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute('''
            SELECT id, created_at, title, word_count, char_count,
                   grammar_errors_count, grammar_score, comprehension_score,
                   overall_score, readability_score, readability_level, status,
                   SUBSTR(original_text, 1, 150) AS preview_text
            FROM reading_history
            ORDER BY created_at DESC
            LIMIT ? OFFSET ?
        ''', (limit, offset))
        rows = cursor.fetchall()
        return [dict(row) for row in rows]
    finally:
        conn.close()

def get_history_by_id(history_id):
    """Retrieve full analysis record by ID."""
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute('''
            SELECT * FROM reading_history WHERE id = ?
        ''', (history_id,))
        row = cursor.fetchone()
        if not row:
            return None
        res = dict(row)
        try:
            res['quiz_data'] = json.loads(res['quiz_data']) if res.get('quiz_data') else []
        except Exception:
            res['quiz_data'] = []
        try:
            res['feedback'] = json.loads(res['feedback']) if res.get('feedback') else []
        except Exception:
            res['feedback'] = []
        return res
    finally:
        conn.close()

def delete_history(history_id):
    """Delete a reading history record by ID."""
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute('DELETE FROM reading_history WHERE id = ?', (history_id,))
        conn.commit()
        return cursor.rowcount > 0
    finally:
        conn.close()

def clear_all_history():
    """Clear all reading history records."""
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute('DELETE FROM reading_history')
        conn.commit()
        return True
    finally:
        conn.close()

def get_dashboard_stats():
    """Calculate and return aggregate analytics for dashboard."""
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute('''
            SELECT 
                COUNT(*) AS total_analyzed,
                COALESCE(AVG(comprehension_score), 0) AS avg_comprehension,
                COALESCE(AVG(grammar_score), 0) AS avg_grammar,
                COALESCE(AVG(overall_score), 0) AS avg_overall,
                COALESCE(SUM(word_count), 0) AS total_words
            FROM reading_history
        ''')
        overview = dict(cursor.fetchone())
        
        # Format averages
        overview['avg_comprehension'] = round(overview['avg_comprehension'], 1)
        overview['avg_grammar'] = round(overview['avg_grammar'], 1)
        overview['avg_overall'] = round(overview['avg_overall'], 1)
        
        # Recent activities (last 5)
        cursor.execute('''
            SELECT id, created_at, title, word_count, grammar_score,
                   comprehension_score, overall_score, status
            FROM reading_history
            ORDER BY created_at DESC
            LIMIT 5
        ''')
        recent = [dict(r) for r in cursor.fetchall()]
        
        # Score trends (last 10 completed entries in chronological order)
        cursor.execute('''
            SELECT id, created_at, title, grammar_score, comprehension_score, overall_score
            FROM reading_history
            ORDER BY created_at ASC
            LIMIT 15
        ''')
        trends = [dict(r) for r in cursor.fetchall()]
        
        return {
            'overview': overview,
            'recent_activities': recent,
            'score_trends': trends
        }
    finally:
        conn.close()
