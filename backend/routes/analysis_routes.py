import re
import logging
from flask import Blueprint, request, jsonify
from backend.config import Config
from backend.services.grammar_service import grammar_service
from backend.services.comprehension_service import comprehension_service
from backend.services.scoring_service import scoring_service
from backend.database import db

logger = logging.getLogger(__name__)
analysis_bp = Blueprint('analysis', __name__)

@analysis_bp.route('/analyze', methods=['POST'])
def analyze_passage():
    """
    Main analysis endpoint. Analyzes passage for grammar, calculates readability,
    generates 5 comprehension questions, and initializes reading history.
    """
    try:
        data = request.get_json(silent=True) or {}
        text = data.get('text', '').strip()
        title = data.get('title', '').strip()

        if not text:
            return jsonify({
                'success': False,
                'error': 'Text passage is required. Please enter or paste some text.'
            }), 400

        words = re.findall(r'\b[A-Za-z0-9\']+\b', text)
        word_count = len(words)
        char_count = len(text)

        if word_count < Config.MIN_WORD_COUNT:
            return jsonify({
                'success': False,
                'error': f'Passage is too short. Please provide at least {Config.MIN_WORD_COUNT} words for meaningful analysis (currently {word_count} words).'
            }), 400

        if word_count > Config.MAX_WORD_COUNT:
            return jsonify({
                'success': False,
                'error': f'Passage exceeds maximum limit of {Config.MAX_WORD_COUNT} words (currently {word_count} words).'
            }), 400

        if not title:
            # Auto-generate title from first 6-8 words
            title = ' '.join(words[:7]).capitalize()
            if len(words) > 7:
                title += '...'

        # 1. Grammar Analysis
        grammar_result = grammar_service.check_text(text)
        errors = grammar_result.get('errors', [])
        corrected_text = grammar_result.get('corrected_text', text)
        category_counts = grammar_result.get('category_counts', {})

        # 2. Readability Analysis
        readability = scoring_service.calculate_readability(text)

        # 3. Grammar Scoring
        grammar_score_info = scoring_service.calculate_grammar_score(word_count, len(errors))
        grammar_score = grammar_score_info['score']

        # 4. Comprehension Questions Generation
        questions = comprehension_service.generate_questions(text, count=Config.DEFAULT_QUESTION_COUNT)

        # 5. Initial Overall Score (before quiz taken)
        overall_score_info = scoring_service.calculate_overall_score(grammar_score, 0.0, has_completed_quiz=False)
        overall_score = overall_score_info['score']

        # 6. Initial Feedback
        feedback = scoring_service.generate_personalized_feedback(
            comprehension_score=0.0,
            grammar_score=grammar_score,
            error_counts=category_counts,
            word_count=word_count,
            quiz_breakdown=None
        )

        # 7. Persist to SQLite
        record_data = {
            'title': title,
            'original_text': text,
            'corrected_text': corrected_text,
            'word_count': word_count,
            'char_count': char_count,
            'grammar_errors_count': len(errors),
            'grammar_score': grammar_score,
            'comprehension_score': 0.0,
            'overall_score': overall_score,
            'readability_score': readability['reading_ease'],
            'readability_level': readability['level_label'],
            'reading_time_minutes': readability['reading_time_minutes'],
            'quiz_data': questions,
            'feedback': feedback,
            'status': 'analyzed'
        }
        saved_record = db.save_analysis(record_data)

        # Prepare client response: strip correct answers from questions for client security
        sanitized_questions = []
        for q in questions:
            sanitized_questions.append({
                'id': q['id'],
                'type': q['type'],
                'question': q['question'],
                'options': q['options']
            })

        return jsonify({
            'success': True,
            'data': {
                'id': saved_record['id'],
                'title': title,
                'original_text': text,
                'corrected_text': corrected_text,
                'word_count': word_count,
                'char_count': char_count,
                'reading_time_minutes': readability['reading_time_minutes'],
                'readability': readability,
                'grammar': {
                    'errors': errors,
                    'error_count': len(errors),
                    'category_counts': category_counts,
                    'message': grammar_result.get('message', ''),
                    'score': grammar_score,
                    'formula': grammar_score_info['formula'],
                    'density': grammar_score_info['density']
                },
                'questions': sanitized_questions,
                'scores': {
                    'grammar_score': grammar_score,
                    'grammar_formula': grammar_score_info['formula'],
                    'comprehension_score': None,
                    'overall_score': overall_score,
                    'overall_formula': overall_score_info['formula']
                },
                'feedback': feedback
            }
        }), 200

    except Exception as e:
        logger.exception("Error in analyze_passage: %s", str(e))
        return jsonify({
            'success': False,
            'error': f'Failed to analyze passage: {str(e)}'
        }), 500

@analysis_bp.route('/grammar-check', methods=['POST'])
def check_grammar():
    """Standalone grammar check endpoint."""
    try:
        data = request.get_json(silent=True) or {}
        text = data.get('text', '').strip()
        if not text:
            return jsonify({'success': False, 'error': 'Text is required.'}), 400

        result = grammar_service.check_text(text)
        words = re.findall(r'\b[A-Za-z0-9\']+\b', text)
        grammar_score_info = scoring_service.calculate_grammar_score(len(words), result['error_count'])

        return jsonify({
            'success': True,
            'data': {
                **result,
                'score': grammar_score_info['score'],
                'formula': grammar_score_info['formula']
            }
        }), 200
    except Exception as e:
        logger.exception("Error in check_grammar: %s", str(e))
        return jsonify({'success': False, 'error': str(e)}), 500

@analysis_bp.route('/generate-questions', methods=['POST'])
def generate_questions():
    """Standalone question generation endpoint."""
    try:
        data = request.get_json(silent=True) or {}
        text = data.get('text', '').strip()
        count = int(data.get('count', 5))
        if not text:
            return jsonify({'success': False, 'error': 'Text is required.'}), 400

        questions = comprehension_service.generate_questions(text, count=count)
        return jsonify({'success': True, 'data': {'questions': questions}}), 200
    except Exception as e:
        logger.exception("Error in generate_questions: %s", str(e))
        return jsonify({'success': False, 'error': str(e)}), 500

@analysis_bp.route('/submit-answers', methods=['POST'])
def submit_answers():
    """
    Submits user quiz answers, calculates comprehension score and combined overall score,
    generates personalized feedback, and updates the database record.
    """
    try:
        data = request.get_json(silent=True) or {}
        history_id = data.get('history_id')
        user_answers = data.get('answers', {})

        if not history_id:
            return jsonify({'success': False, 'error': 'history_id is required.'}), 400

        record = db.get_history_by_id(history_id)
        if not record:
            return jsonify({'success': False, 'error': 'Analysis record not found.'}), 404

        questions = record.get('quiz_data', [])
        if not questions:
            return jsonify({'success': False, 'error': 'No quiz questions found for this record.'}), 400

        # Evaluate answers
        eval_result = comprehension_service.evaluate_answers(questions, user_answers)
        comp_score = eval_result['score_percentage']
        grammar_score = record.get('grammar_score', 100.0)

        # Calculate final overall score
        overall_score_info = scoring_service.calculate_overall_score(grammar_score, comp_score, has_completed_quiz=True)
        overall_score = overall_score_info['score']

        # Count grammar errors by category
        grammar_check = grammar_service.check_text(record['original_text'])
        error_counts = grammar_check.get('category_counts', {})

        # Generate contextual personalized feedback
        feedback = scoring_service.generate_personalized_feedback(
            comprehension_score=comp_score,
            grammar_score=grammar_score,
            error_counts=error_counts,
            word_count=record.get('word_count', 0),
            quiz_breakdown=eval_result['breakdown']
        )

        # Update in SQLite
        updated_record = db.update_quiz_results(
            history_id=history_id,
            comprehension_score=comp_score,
            overall_score=overall_score,
            quiz_data=eval_result['breakdown'],
            feedback=feedback
        )

        return jsonify({
            'success': True,
            'data': {
                'history_id': history_id,
                'comprehension_score': comp_score,
                'grammar_score': grammar_score,
                'overall_score': overall_score,
                'overall_formula': overall_score_info['formula'],
                'correct_count': eval_result['correct_count'],
                'total_questions': eval_result['total_questions'],
                'breakdown': eval_result['breakdown'],
                'feedback': feedback
            }
        }), 200

    except Exception as e:
        logger.exception("Error in submit_answers: %s", str(e))
        return jsonify({'success': False, 'error': f'Failed to submit answers: {str(e)}'}), 500
