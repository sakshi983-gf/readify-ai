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
        # Remove trailing silent 'e', 'es', 'ed'
        word = re.sub(r'(?:[^laeiouy]|ed|es|e)$', '', word)
        # Count vowel groups
        syllables = len(re.findall(r'[aeiouy]{1,2}', word))
        return max(1, syllables)

    @classmethod
    def calculate_readability(cls, text: str) -> dict:
        """
        Calculate Flesch Reading Ease and Flesch-Kincaid Grade Level.
        Formula:
        - Flesch Reading Ease = 206.835 - (1.015 * ASL) - (84.6 * ASW)
          where ASL = Average Sentence Length (words / sentences)
                ASW = Average Syllables per Word (syllables / words)
        - Flesch-Kincaid Grade Level = (0.39 * ASL) + (11.8 * ASW) - 15.59
        """
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

        # Average reading speed is ~200-250 words per minute
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
        Calculate grammar accuracy score (0-100%).
        Formula:
        - Error Density (%) = (error_count / total_words) * 100
        - Penalty = Error Density * 8
        - Grammar Score = max(0, min(100, round(100 - Penalty)))
        """
        if word_count <= 0:
            return {'score': 100.0, 'density': 0.0, 'formula': '100% (No words entered)'}

        density = round((error_count / word_count) * 100, 2)
        penalty = density * 8.0
        score = max(0.0, min(100.0, round(100.0 - penalty, 1)))

        formula = f"max(0, 100 - (({error_count} errors / {word_count} words) * 100 * 8)) = {score}%"

        return {
            'score': score,
            'density': density,
            'formula': formula
        }

    @staticmethod
    def calculate_overall_score(grammar_score: float, comprehension_score: float, has_completed_quiz: bool = True) -> dict:
        """
        Calculate overall reading performance score.
        Formula:
        If quiz completed:
        - Overall = round(0.60 * Comprehension Score + 0.40 * Grammar Score)
        If quiz not yet completed:
        - Overall = round(Grammar Score)
        """
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
                                       quiz_breakdown: list = None) -> list:
        """
        Generate contextual, personalized feedback based on measurable metrics:
        - Actual comprehension quiz results
        - Specific grammar/spelling error categories
        - Passage length and depth
        """
        feedback = []

        # 1. Comprehension Assessment Feedback
        if quiz_breakdown is not None:
            if comprehension_score >= 90:
                feedback.append({
                    'type': 'success',
                    'title': 'Exceptional Comprehension',
                    'message': 'Outstanding performance! You answered the comprehension questions accurately and demonstrated strong grasp of central ideas and key details.'
                })
            elif comprehension_score >= 70:
                feedback.append({
                    'type': 'info',
                    'title': 'Good Reading Understanding',
                    'message': 'Solid understanding! You captured the main ideas well. Rereading specific supporting sentences can help lock in factual and relational details.'
                })
            elif comprehension_score >= 50:
                feedback.append({
                    'type': 'warning',
                    'title': 'Moderate Comprehension',
                    'message': 'You answered some questions correctly. Try reading the passage at a steadier pace and noting cause-and-effect transitions to boost accuracy.'
                })
            else:
                feedback.append({
                    'type': 'warning',
                    'title': 'Needs Practice',
                    'message': 'Comprehension was challenging on this passage. Try breaking complex sentences into smaller thoughts and re-checking vocabulary in context.'
                })

            # Check specific question types missed
            missed_types = [q.get('type') for q in quiz_breakdown if not q.get('is_correct')]
            if 'vocabulary' in missed_types:
                feedback.append({
                    'type': 'tip',
                    'title': 'Vocabulary Practice Tip',
                    'message': 'Review contextual clues surrounding unfamiliar words before choosing a synonym.'
                })
            if 'main_idea' in missed_types:
                feedback.append({
                    'type': 'tip',
                    'title': 'Main Idea Strategy',
                    'message': 'Pay special attention to the introductory and concluding sentences where the author summarizes the core message.'
                })

        # 2. Grammar & Mechanical Feedback
        total_errors = sum(error_counts.values()) if error_counts else 0
        spelling_errors = error_counts.get('spelling', 0) if error_counts else 0
        grammar_errors = error_counts.get('grammar', 0) if error_counts else 0
        punct_errors = error_counts.get('punctuation', 0) if error_counts else 0

        if total_errors == 0:
            feedback.append({
                'type': 'success',
                'title': 'Pristine Grammar',
                'message': 'No common grammar or spelling errors were detected. Your passage demonstrates excellent clarity and precision.'
            })
        else:
            if spelling_errors > 0:
                feedback.append({
                    'type': 'tip',
                    'title': 'Spelling Review',
                    'message': f'Detected {spelling_errors} potential spelling mistake{"s" if spelling_errors > 1 else ""}. Inspect the highlighted words and suggested replacements.'
                })
            if grammar_errors > 0:
                feedback.append({
                    'type': 'tip',
                    'title': 'Grammar & Subject-Verb Agreement',
                    'message': f'Found {grammar_errors} grammatical improvement{"s" if grammar_errors > 1 else ""}. Check pronoun forms and subject-verb consistency.'
                })
            if punct_errors > 0:
                feedback.append({
                    'type': 'tip',
                    'title': 'Punctuation & Spacing',
                    'message': f'Identified {punct_errors} punctuation/spacing notice{"s" if punct_errors > 1 else ""}. Verify sentence-ending punctuation and clean spacing.'
                })

        # 3. Overall Encouragement / Next Step
        if grammar_score >= 85 and comprehension_score >= 80:
            feedback.append({
                'type': 'celebration',
                'title': 'Ready for Advanced Passages',
                'message': 'You are reading and writing with high proficiency. Try testing yourself on longer or more technical texts!'
            })
        else:
            feedback.append({
                'type': 'action',
                'title': 'Next Step',
                'message': 'Review your highlighted corrections in the workspace, copy the polished text, and test another passage to track your score progression.'
            })

        return feedback

scoring_service = ScoringService()
