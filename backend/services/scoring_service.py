import re
import math
import logging

logger = logging.getLogger(__name__)

class ScoringService:
    @staticmethod
    def count_syllables(word: str) -> int:
        """Count approximate syllables in an English word."""
        word = word.lower().strip()
        if not word:
            return 0
        if len(word) <= 3:
            return 1
        word = re.sub(r'(?:[^laeiouy]|ed|es|e)$', '', word)
        syllables = len(re.findall(r'[aeiouy]{1,2}', word))
        return max(1, syllables)

    @classmethod
    def calculate_readability(cls, text: str) -> dict:
        words = re.findall(r'\b[A-Za-z]+\b', text)
        word_count = len(words)
        if word_count == 0:
            return {
                'reading_ease': 100.0,
                'grade_level': 1.0,
                'level_label': 'Very Easy',
                'reading_time_minutes': 0.1
            }

        sentences = [s for s in re.split(r'[.!?]+', text) if s.strip()]
        sentence_count = max(1, len(sentences))
        total_syllables = sum(cls.count_syllables(w) for w in words)

        asl = word_count / sentence_count
        asw = total_syllables / word_count

        ease = 206.835 - (1.015 * asl) - (84.6 * asw)
        ease = max(0.0, min(100.0, round(ease, 1)))

        grade = (0.39 * asl) + (11.8 * asw) - 15.59
        grade = max(1.0, round(grade, 1))

        if ease >= 90:
            level_label = 'Very Easy (5th Grade)'
        elif ease >= 80:
            level_label = 'Easy (6th Grade)'
        elif ease >= 70:
            level_label = 'Fairly Easy (7th Grade)'
        elif ease >= 60:
            level_label = 'Standard (8th-9th Grade)'
        elif ease >= 50:
            level_label = 'Fairly Difficult (10th-12th Grade)'
        elif ease >= 30:
            level_label = 'Difficult (College)'
        else:
            level_label = 'Very Difficult (College Graduate)'

        reading_time_minutes = round(max(0.2, word_count / 200.0), 1)

        return {
            'reading_ease': ease,
            'grade_level': grade,
            'level_label': level_label,
            'reading_time_minutes': reading_time_minutes
        }

    @staticmethod
    def calculate_grammar_score(word_count: int, error_count: int) -> dict:
        """
        Fair, academic grammar scoring rubric.
        Ensures students are not unfairly penalized to 0% for minor mechanical mistakes in short passages.
        """
        if word_count <= 0:
            return {'score': 100.0, 'density': 0.0, 'formula': '100% (No text entered)'}

        density = round((error_count / word_count) * 100, 1)

        if error_count == 0:
            score = 100.0
            formula = "100% (Pristine grammar, 0 errors detected)"
        else:
            # Scaled penalty formula normalized by length
            penalty = min(55.0, (error_count * 6.0) / max(0.9, math.log10(word_count + 8)))
            score = max(45.0, min(95.0, round(100.0 - penalty, 1)))
            formula = f"100 - ({error_count} errors normalized across {word_count} words) = {score}%"

        return {
            'score': score,
            'density': density,
            'formula': formula
        }

    @staticmethod
    def calculate_overall_score(grammar_score: float, comprehension_score: float, has_completed_quiz: bool = True) -> dict:
        if has_completed_quiz:
            score = round((0.60 * comprehension_score) + (0.40 * grammar_score), 1)
            formula = f"0.60 * {comprehension_score}% (Comprehension) + 0.40 * {grammar_score}% (Grammar) = {score}%"
        else:
            score = round(grammar_score, 1)
            formula = f"Initial Grammar Assessment = {score}% (Quiz pending)"

        return {
            'score': score,
            'formula': formula
        }

    @classmethod
    def generate_personalized_feedback(cls, comprehension_score: float, grammar_score: float, 
                                       error_counts: dict, word_count: int, 
                                       quiz_breakdown: list = None,
                                       student_name: str = None) -> list:
        feedback = []

        # Name personalized intro
        greeting = f"Great effort, {student_name}!" if student_name else "Great effort on your reading passage!"

        if quiz_breakdown is not None:
            if comprehension_score >= 80:
                feedback.append({
                    'type': 'success',
                    'title': 'Outstanding Comprehension',
                    'message': f"{greeting} You demonstrated strong mastery of the passage details and central theme."
                })
            elif comprehension_score >= 60:
                feedback.append({
                    'type': 'info',
                    'title': 'Good Reading Understanding',
                    'message': 'You grasped the main ideas well. Rereading specific supporting sentences can help lock in factual details.'
                })
            else:
                feedback.append({
                    'type': 'warning',
                    'title': 'Needs Practice',
                    'message': 'Comprehension was challenging on this passage. Try reading at a steady pace and reviewing unfamiliar vocabulary.'
                })

        total_errors = sum(error_counts.values()) if error_counts else 0
        if total_errors == 0:
            feedback.append({
                'type': 'success',
                'title': 'Flawless Grammar & Mechanics',
                'message': 'No grammatical or spelling issues detected. Your sentences flow naturally and clearly.'
            })
        else:
            grammar_errs = error_counts.get('grammar', 0)
            if grammar_errs > 0:
                feedback.append({
                    'type': 'tip',
                    'title': 'Grammar & Linking Verbs',
                    'message': 'Be sure to include linking verbs (like "is" or "are") and use continuous verb forms (like "studying in") for complete sentences.'
                })

            spelling_errs = error_counts.get('spelling', 0)
            if spelling_errs > 0:
                feedback.append({
                    'type': 'tip',
                    'title': 'Spelling Review',
                    'message': f'Found {spelling_errs} potential spelling adjustment{"s" if spelling_errs > 1 else ""}. Check the highlighted replacements in the workspace.'
                })

        feedback.append({
            'type': 'action',
            'title': 'Next Step',
            'message': 'Review your corrected text in the workspace, copy the polished version, and continue practicing to build your fluency!'
        })

        return feedback

scoring_service = ScoringService()
