import re
import logging
from flask import Blueprint, request, jsonify
from backend.config import Config
from backend.services.grammar_service import grammar_service
from backend.services.comprehension_service import comprehension_service
from backend.services.scoring_service import scoring_service
from backend.services.llm_service import llm_service
from backend.database import db

logger = logging.getLogger(__name__)
analysis_bp = Blueprint('analysis', __name__)

@analysis_bp.route('/analyze', methods=['POST'])
def analyze_passage():
    """
    Main analysis endpoint. Analyzes passage with AI engine (or local smart NLP),
    calculates fair scores, generates 5 contextual comprehension questions, and saves to database.
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
                'error': f'Passage is too short. Please provide at least {Config.MIN_WORD_COUNT} words (currently {word_count} words).'
            }), 400

        if word_count > Config.MAX_WORD_COUNT:
            return jsonify({
                'success': False,
                'error': f'Passage exceeds maximum limit of {Config.MAX_WORD_COUNT} words (currently {word_count} words).'
            }), 400

        # Extract student name if present for friendly personalized feedback
        name_match = re.search(r'\bmy name(?:\s+is)?\s+([A-Za-z]+)\b', text, re.IGNORECASE)
        student_name = name_match.group(1).capitalize() if name_match else None

        if not title:
            if student_name:
                title = f"Self-Introduction ({student_name})"
            else:
                title = ' '.join(words[:7]).capitalize()
                if len(words) > 7:
                    title += '...'

        # Readability metrics
        readability = scoring_service.calculate_readability(text)

        # Check if LLM Service returns results
        llm_result = llm_service.analyze_with_ai(text) if llm_service.is_ai_configured() else None

        if llm_result and 'corrected_text' in llm_result:
            corrected_text = llm_result['corrected_text']
            errors = llm_result.get('errors', [])
            grammar_score = float(llm_result.get('grammar_score', 80))
            grammar_formula = f"AI Accuracy Evaluation = {grammar_score}%"
            questions = llm_result.get('questions', [])
            raw_feedback = llm_result.get('feedback', '')
            feedback = [
                {
                    'type': 'celebration',
                    'title': 'AI Reading Diagnostics',
                    'message': raw_feedback or 'Great writing! Review your corrected text to elevate your English fluency.'
                }
            ]
            category_counts = {
                'grammar': sum(1 for e in errors if e.get('category') == 'grammar'),
                'spelling': sum(1 for e in errors if e.get('category') == 'spelling'),
                'punctuation': sum(1 for e in errors if e.get('category') == 'punctuation'),
                'style': sum(1 for e in errors if e.get('category') == 'style'),
            }
        else:
            # Smart Built-in Engine
            grammar_result = grammar_service.check_text(text)
            errors = grammar_result.get('errors', [])
            corrected_text = grammar_result.get('corrected_text', text)
            category_counts = grammar_result.get('category_counts', {})

            grammar_score_info = scoring_service.calculate_grammar_score(word_count, len(errors))
            grammar_score = grammar_score_info['score']
            grammar_formula = grammar_score_info['formula']

            questions = comprehension_service.generate_questions(text, count=Config.DEFAULT_QUESTION_COUNT)

            feedback = scoring_service.generate_personalized_feedback(
                comprehension_score=0.0,
                grammar_score=grammar_score,
                error_counts=category_counts,
                word_count=word_count,
                quiz_breakdown=None,
                student_name=student_name
            )

        # Initial overall score (before quiz taken)
        overall_score_info = scoring_service.calculate_overall_score(grammar_score, 0.0, has_completed_quiz=False)
        overall_score = overall_score_info['score']

        # Save to SQLite database
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

        # Sanitize questions for client response (remove correct answers until submitted)
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
                    'message': f"Identified {len(errors)} improvement{'s' if len(errors) != 1 else ''}." if errors else "No common grammatical or spelling errors detected.",
                    'score': grammar_score,
                    'formula': grammar_formula,
                    'density': round((len(errors) / max(1, word_count)) * 100, 1)
                },
                'questions': sanitized_questions,
                'scores': {
                    'grammar_score': grammar_score,
                    'grammar_formula': grammar_formula,
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

        eval_result = comprehension_service.evaluate_answers(questions, user_answers)
        comp_score = eval_result['score_percentage']
        grammar_score = record.get('grammar_score', 80.0)

        overall_score_info = scoring_service.calculate_overall_score(grammar_score, comp_score, has_completed_quiz=True)
        overall_score = overall_score_info['score']

        # Extract name for personalized feedback
        name_match = re.search(r'\bmy name(?:\s+is)?\s+([A-Za-z]+)\b', record['original_text'], re.IGNORECASE)
        student_name = name_match.group(1).capitalize() if name_match else None

        grammar_check = grammar_service.check_text(record['original_text'])
        error_counts = grammar_check.get('category_counts', {})

        feedback = scoring_service.generate_personalized_feedback(
            comprehension_score=comp_score,
            grammar_score=grammar_score,
            error_counts=error_counts,
            word_count=record.get('word_count', 0),
            quiz_breakdown=eval_result['breakdown'],
            student_name=student_name
        )

        db.update_quiz_results(
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

@analysis_bp.route('/ai-config', methods=['POST', 'GET'])
def ai_configuration():
    """Configure or check optional free AI provider keys (Gemini / Groq)."""
    if request.method == 'POST':
        data = request.get_json(silent=True) or {}
        provider = data.get('provider', '').lower()
        key = data.get('key', '').strip()
        if provider in ['gemini', 'groq'] and key:
            llm_service.set_api_key(provider, key)
            return jsonify({'success': True, 'message': f'{provider.capitalize()} AI key updated successfully!'}), 200
        return jsonify({'success': False, 'error': 'Invalid provider or key'}), 400

    return jsonify({
        'success': True,
        'configured': llm_service.is_ai_configured(),
        'providers': {
            'gemini': bool(llm_service.gemini_key),
            'groq': bool(llm_service.groq_key)
        }
    }), 200
