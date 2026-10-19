import re
import json
import logging
from typing import List, Dict, Any, Optional
from backend.database.db import save_exercise_attempt

logger = logging.getLogger(__name__)

# Verified educational exercise bank spanning all 11 grammar categories and 3 difficulty tiers
EXERCISE_BANK: List[Dict[str, Any]] = [
    # 1. Subject-Verb Agreement (SVA)
    {
        "id": "sva_b1",
        "category": "subject_verb_agreement",
        "difficulty": "Beginner",
        "type": "mcq",
        "question": "Choose the correct verb to complete the sentence: 'She _____ to school every morning.'",
        "options": [
            {"id": "A", "text": "go"},
            {"id": "B", "text": "goes"},
            {"id": "C", "text": "going"},
            {"id": "D", "text": "gone"}
        ],
        "correct_answer": "B",
        "explanation": "Third-person singular subjects ('she', 'he', 'it') take verbs ending in '-s' or '-es' in the simple present tense ('She goes')."
    },
    {
        "id": "sva_b2",
        "category": "subject_verb_agreement",
        "difficulty": "Beginner",
        "type": "fill_blank",
        "question": "Fill in the blank: 'They _____ (is / are) playing cricket in the garden.'",
        "options": [
            {"id": "A", "text": "is"},
            {"id": "B", "text": "are"}
        ],
        "correct_answer": "B",
        "explanation": "Plural pronoun 'they' agrees with plural auxiliary verb 'are'."
    },
    {
        "id": "sva_i1",
        "category": "subject_verb_agreement",
        "difficulty": "Intermediate",
        "type": "sentence_correction",
        "question": "Identify and fix the error in: 'The list of new books are on the library desk.'",
        "options": [
            {"id": "A", "text": "The list of new books is on the library desk."},
            {"id": "B", "text": "The list of new books are on the library desk."},
            {"id": "C", "text": "The lists of new books is on the library desk."},
            {"id": "D", "text": "The list of new book are on the library desk."}
        ],
        "correct_answer": "A",
        "explanation": "The subject of the sentence is the singular head noun 'list', not the prepositional phrase 'of new books'. Therefore, use singular 'is'."
    },
    {
        "id": "sva_a1",
        "category": "subject_verb_agreement",
        "difficulty": "Advanced",
        "type": "mcq",
        "question": "Select the grammatically correct sentence involving correlative conjunctions:",
        "options": [
            {"id": "A", "text": "Neither the teacher nor the students was in the classroom."},
            {"id": "B", "text": "Neither the teacher nor the students were in the classroom."},
            {"id": "C", "text": "Neither the students nor the teacher were in the classroom."},
            {"id": "D", "text": "Either the principal or the teachers is attending the ceremony."}
        ],
        "correct_answer": "B",
        "explanation": "When subjects are joined by 'neither... nor', the verb agrees with the subject closest to it. 'Students' is plural and closest to the verb, so use 'were'."
    },

    # 2. Verb Tense
    {
        "id": "tense_b1",
        "category": "verb_tense",
        "difficulty": "Beginner",
        "type": "mcq",
        "question": "Complete the sentence: 'Yesterday, Maya _____ her grandmother in the hospital.'",
        "options": [
            {"id": "A", "text": "visit"},
            {"id": "B", "text": "visited"},
            {"id": "C", "text": "visiting"},
            {"id": "D", "text": "has visit"}
        ],
        "correct_answer": "B",
        "explanation": "Past time markers like 'yesterday' require the simple past tense ('visited')."
    },
    {
        "id": "tense_i1",
        "category": "verb_tense",
        "difficulty": "Intermediate",
        "type": "mcq",
        "question": "Choose the sentence that correctly expresses an ongoing action up to the present:",
        "options": [
            {"id": "A", "text": "She is living in Seattle since five years."},
            {"id": "B", "text": "She has been living in Seattle for five years."},
            {"id": "C", "text": "She lived in Seattle since five years."},
            {"id": "D", "text": "She was living in Seattle for five years."}
        ],
        "correct_answer": "B",
        "explanation": "The present perfect continuous tense ('has been living') paired with 'for' specifies an action that began in the past and continues into the present."
    },
    {
        "id": "tense_a1",
        "category": "verb_tense",
        "difficulty": "Advanced",
        "type": "mcq",
        "question": "Complete the conditional: 'If he _____ earlier, he would have caught the morning train.'",
        "options": [
            {"id": "A", "text": "woke up"},
            {"id": "B", "text": "had woken up"},
            {"id": "C", "text": "would wake up"},
            {"id": "D", "text": "has woken up"}
        ],
        "correct_answer": "B",
        "explanation": "Third conditional sentences require past perfect ('had woken up') in the if-clause to discuss hypothetical past outcomes ('would have caught')."
    },

    # 3. Articles (a, an, the)
    {
        "id": "art_b1",
        "category": "articles",
        "difficulty": "Beginner",
        "type": "fill_blank",
        "question": "Select the correct article: 'He ate _____ apple after lunch.'",
        "options": [
            {"id": "A", "text": "a"},
            {"id": "B", "text": "an"},
            {"id": "C", "text": "the"},
            {"id": "D", "text": "[no article]"}
        ],
        "correct_answer": "B",
        "explanation": "Use 'an' before words starting with a vowel sound (e.g. 'an apple')."
    },
    {
        "id": "art_i1",
        "category": "articles",
        "difficulty": "Intermediate",
        "type": "mcq",
        "question": "Select the sentence with correct article usage for unique celestial bodies and geographical features:",
        "options": [
            {"id": "A", "text": "Moon orbits around earth every month."},
            {"id": "B", "text": "The moon orbits around the Earth every month."},
            {"id": "C", "text": "A moon orbits around a Earth every month."},
            {"id": "D", "text": "The moon orbits around a Earth every month."}
        ],
        "correct_answer": "B",
        "explanation": "Use definite article 'the' before unique physical entities ('the moon', 'the Earth')."
    },
    {
        "id": "art_a1",
        "category": "articles",
        "difficulty": "Advanced",
        "type": "mcq",
        "question": "Which sentence correctly distinguishes between general concepts and specific instances?",
        "options": [
            {"id": "A", "text": "The life is full of surprises."},
            {"id": "B", "text": "Life is full of surprises, but the life of Gandhi was extraordinary."},
            {"id": "C", "text": "A life is full of surprises, but life of Gandhi was extraordinary."},
            {"id": "D", "text": "The life is full of surprises, but Gandhi's life was extraordinary."}
        ],
        "correct_answer": "B",
        "explanation": "Abstract nouns used in a general sense take no article ('Life is...'), while specific instances modified by a prepositional phrase take 'the' ('the life of Gandhi')."
    },

    # 4. Prepositions
    {
        "id": "prep_b1",
        "category": "prepositions",
        "difficulty": "Beginner",
        "type": "fill_blank",
        "question": "Complete the sentence: 'We have our English exam _____ Monday morning.'",
        "options": [
            {"id": "A", "text": "in"},
            {"id": "B", "text": "on"},
            {"id": "C", "text": "at"},
            {"id": "D", "text": "by"}
        ],
        "correct_answer": "B",
        "explanation": "Use 'on' for specific days of the week and dates ('on Monday')."
    },
    {
        "id": "prep_i1",
        "category": "prepositions",
        "difficulty": "Intermediate",
        "type": "mcq",
        "question": "Which sentence uses the correct dependent preposition for agreement or marriage?",
        "options": [
            {"id": "A", "text": "She was married with a software engineer."},
            {"id": "B", "text": "She was married to a software engineer."},
            {"id": "C", "text": "She was married by a software engineer."},
            {"id": "D", "text": "She was married on a software engineer."}
        ],
        "correct_answer": "B",
        "explanation": "In English, the adjective 'married' takes the preposition 'to', not 'with' ('married to someone')."
    },

    # 5. Pronouns
    {
        "id": "pro_b1",
        "category": "pronouns",
        "difficulty": "Beginner",
        "type": "mcq",
        "question": "Choose the correct subjective pronoun: '_____ and I went to the market together.'",
        "options": [
            {"id": "A", "text": "Her"},
            {"id": "B", "text": "She"},
            {"id": "C", "text": "Hers"},
            {"id": "D", "text": "Herself"}
        ],
        "correct_answer": "B",
        "explanation": "Use subject pronoun 'she' when referring to the person performing the action alongside 'I' ('She and I went')."
    },
    {
        "id": "pro_i1",
        "category": "pronouns",
        "difficulty": "Intermediate",
        "type": "mcq",
        "question": "Which sentence correctly uses possessive 'its' without confusing it with the contraction 'it's'?",
        "options": [
            {"id": "A", "text": "The dog was wagging it's tail when it saw the ball."},
            {"id": "B", "text": "The dog was wagging its tail when it saw the ball."},
            {"id": "C", "text": "The dog was wagging its' tail when it saw the ball."},
            {"id": "D", "text": "Its' tail was wagging quickly."}
        ],
        "correct_answer": "B",
        "explanation": "'Its' is the possessive pronoun ('its tail'). 'It's' is the contraction for 'it is' or 'it has'."
    },

    # 6. Singular & Plural Forms
    {
        "id": "plu_b1",
        "category": "singular_plural",
        "difficulty": "Beginner",
        "type": "mcq",
        "question": "Choose the correct plural form of 'child':",
        "options": [
            {"id": "A", "text": "childs"},
            {"id": "B", "text": "children"},
            {"id": "C", "text": "childrens"},
            {"id": "D", "text": "childes"}
        ],
        "correct_answer": "B",
        "explanation": "'Child' is an irregular noun whose plural is 'children'."
    },
    {
        "id": "plu_i1",
        "category": "singular_plural",
        "difficulty": "Intermediate",
        "type": "mcq",
        "question": "Which sentence correctly treats uncountable nouns like 'advice' and 'information'?",
        "options": [
            {"id": "A", "text": "He gave me many good advices for the exam."},
            {"id": "B", "text": "He gave me a good piece of advice for the exam."},
            {"id": "C", "text": "He gave me an advice for the exam."},
            {"id": "D", "text": "He gave me many advices."}
        ],
        "correct_answer": "B",
        "explanation": "'Advice' is an uncountable noun. It cannot be pluralized as 'advices'. Use 'a piece of advice' or 'advice'."
    },

    # 7. Word Order
    {
        "id": "wo_b1",
        "category": "word_order",
        "difficulty": "Beginner",
        "type": "mcq",
        "question": "Select the correctly ordered question:",
        "options": [
            {"id": "A", "text": "Where you are going tonight?"},
            {"id": "B", "text": "Where are you going tonight?"},
            {"id": "C", "text": "Where going you are tonight?"},
            {"id": "D", "text": "You are going where tonight?"}
        ],
        "correct_answer": "B",
        "explanation": "In English wh-questions, the auxiliary verb precedes the subject: Wh-word + auxiliary ('are') + subject ('you') + verb ('going')."
    },

    # 8. Spelling
    {
        "id": "spel_b1",
        "category": "spelling",
        "difficulty": "Beginner",
        "type": "mcq",
        "question": "Choose the correctly spelled word:",
        "options": [
            {"id": "A", "text": "definately"},
            {"id": "B", "text": "definitely"},
            {"id": "C", "text": "defanately"},
            {"id": "D", "text": "definitly"}
        ],
        "correct_answer": "B",
        "explanation": "'Definitely' is spelled d-e-f-i-n-i-t-e-l-y (from the root 'finite')."
    },

    # 9. Punctuation & Capitalization
    {
        "id": "punc_b1",
        "category": "punctuation",
        "difficulty": "Beginner",
        "type": "mcq",
        "question": "Which sentence is correctly punctuated?",
        "options": [
            {"id": "A", "text": "Although he was tired he finished the assignment."},
            {"id": "B", "text": "Although he was tired, he finished the assignment."},
            {"id": "C", "text": "Although, he was tired he finished the assignment."},
            {"id": "D", "text": "Although he was tired; he finished the assignment"}
        ],
        "correct_answer": "B",
        "explanation": "When a dependent adverbial clause ('Although he was tired') introduces a sentence, it must be followed by a comma."
    },

    # 10. Sentence Structure
    {
        "id": "struc_i1",
        "category": "sentence_structure",
        "difficulty": "Intermediate",
        "type": "mcq",
        "question": "Identify the sentence that avoids double-connector redundancy:",
        "options": [
            {"id": "A", "text": "Because he was sick, so he missed the lecture."},
            {"id": "B", "text": "Because he was sick, he missed the lecture."},
            {"id": "C", "text": "Although he tried hard, but he failed."},
            {"id": "D", "text": "Since it rained, therefore the match was cancelled."}
        ],
        "correct_answer": "B",
        "explanation": "Do not pair subordinate conjunctions ('Because') with coordinate conjunctions ('so') in the same sentence structure."
    }
]

class PracticeService:
    """
    Manages interactive pedagogical grammar practice exercises, answer grading,
    explanation rendering, and dynamic difficulty adjustment.
    """

    def get_exercises(self, category: Optional[str] = None, difficulty: Optional[str] = None, count: int = 5) -> List[Dict[str, Any]]:
        """Retrieve curated exercises filtered by grammar category and difficulty."""
        filtered = EXERCISE_BANK
        if category and category != 'all':
            filtered = [e for e in filtered if e['category'] == category]
        if difficulty and difficulty != 'all':
            filtered = [e for e in filtered if e['difficulty'].lower() == difficulty.lower()]

        if not filtered:
            filtered = EXERCISE_BANK

        # Return a copy without revealing correct answer for client submission
        selected = filtered[:count]
        sanitized = []
        for e in selected:
            sanitized.append({
                "id": e["id"],
                "category": e["category"],
                "category_label": e["category"].replace('_', ' ').title(),
                "difficulty": e["difficulty"],
                "type": e["type"],
                "question": e["question"],
                "options": e["options"]
            })
        return sanitized

    def submit_exercise(self, user_id: int, category: str, difficulty: str, answers: Dict[str, str]) -> Dict[str, Any]:
        """
        Grades submitted answers, stores results in SQLite database, and returns
        explanations and adaptive learning guidance.
        """
        bank_map = {e["id"]: e for e in EXERCISE_BANK}
        total = len(answers)
        correct_count = 0
        breakdown = []

        for q_id, user_ans in answers.items():
            ex = bank_map.get(q_id)
            if not ex:
                continue

            is_correct = (user_ans.strip().upper() == ex["correct_answer"].strip().upper())
            if is_correct:
                correct_count += 1

            breakdown.append({
                "question_id": q_id,
                "question": ex["question"],
                "category": ex["category"],
                "category_label": ex["category"].replace('_', ' ').title(),
                "difficulty": ex["difficulty"],
                "user_answer": user_ans,
                "correct_answer": ex["correct_answer"],
                "is_correct": is_correct,
                "explanation": ex["explanation"]
            })

        score_pct = round((correct_count / max(1, total)) * 100, 1)

        # Adaptive difficulty suggestion
        if score_pct >= 80:
            recommendation = "Excellent mastery! You are ready to advance to higher difficulty practice."
            suggested_difficulty = "Advanced" if difficulty == "Intermediate" else "Intermediate"
        elif score_pct >= 60:
            recommendation = "Good progress! Practice 2 more exercises to solidify these core concepts."
            suggested_difficulty = difficulty
        else:
            recommendation = "Review the explanations above and try foundation drills to reinforce the rules."
            suggested_difficulty = "Beginner" if difficulty == "Intermediate" else difficulty

        # Persist attempt to SQLite database
        attempt_id = save_exercise_attempt(
            user_id=user_id,
            exercise_type="grammar_practice",
            category=category or "mixed",
            difficulty=difficulty or "Intermediate",
            score=score_pct,
            total_questions=total,
            correct_answers=correct_count,
            details={"breakdown": breakdown, "recommendation": recommendation}
        )

        return {
            "attempt_id": attempt_id,
            "total_questions": total,
            "correct_count": correct_count,
            "score_percentage": score_pct,
            "recommendation": recommendation,
            "suggested_difficulty": suggested_difficulty,
            "breakdown": breakdown
        }

practice_service = PracticeService()
