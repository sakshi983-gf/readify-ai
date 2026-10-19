import logging
from typing import Dict, Any, List
from backend.database.db import (
    get_user_by_id,
    get_user_grammar_topic_breakdown,
    get_user_exercise_history,
    get_history
)

logger = logging.getLogger(__name__)

GRAMMAR_TOPIC_DESCRIPTIONS = {
    'subject_verb_agreement': {
        'title': 'Subject-Verb Agreement',
        'rule_summary': 'Singular subjects take singular verbs (ends in -s/-es); plural subjects take base verbs.',
        'common_trap': 'Words between subject and verb (e.g., "The list of items is...") do not change the subject number.',
        'tip': 'Identify the core head noun first before selecting the verb form.'
    },
    'verb_tense': {
        'title': 'Verb Tense & Aspect',
        'rule_summary': 'Keep tenses consistent within a timeframe; use present perfect (have/has + past participle) for actions connecting past and present.',
        'common_trap': 'Using simple past with duration ("lived since 5 years" instead of "has lived for 5 years").',
        'tip': 'Look for time marker words like yesterday, since, already, and while.'
    },
    'articles': {
        'title': 'Articles (A, An, The)',
        'rule_summary': 'Use "a" before consonant sounds, "an" before vowel sounds, and "the" for specific or unique nouns.',
        'common_trap': 'Using "an" before words starting with a written vowel that makes a consonant sound (e.g., "a unique opportunity").',
        'tip': 'Base "a vs an" on phonetics (sound), not just the first letter.'
    },
    'prepositions': {
        'title': 'Prepositions of Time & Place',
        'rule_summary': 'Use "at" for precise times/points, "on" for days and surfaces, and "in" for enclosed spaces, months, and years.',
        'common_trap': 'Using "in Monday" or "married with". Correct: "on Monday", "married to".',
        'tip': 'Learn dependent prepositions as complete collocations (e.g., "good at", "afraid of").'
    },
    'pronouns': {
        'title': 'Pronoun Case & Reference',
        'rule_summary': 'Use subjective pronouns (I, he, she, they) as sentence subjects, and objective pronouns (me, him, her, them) as objects.',
        'common_trap': 'Confusing possessive "its" with contraction "it\'s" (it is).',
        'tip': 'If you can replace it with "it is", write "it\'s"; otherwise, use "its".'
    },
    'singular_plural': {
        'title': 'Singular & Plural Nouns',
        'rule_summary': 'Countable nouns can be pluralized; uncountable nouns (advice, information, equipment) cannot take plural -s.',
        'common_trap': 'Writing "advices" or "childs". Correct: "pieces of advice", "children".',
        'tip': 'Use "pieces of" or "types of" when quantifying uncountable nouns.'
    },
    'word_order': {
        'title': 'Sentence Word Order',
        'rule_summary': 'Standard English follows Subject-Verb-Object (SVO). Questions invert to Auxiliary-Subject-Verb.',
        'common_trap': 'Putting adverbs in awkward positions ("Always she comes" instead of "She always comes").',
        'tip': 'Place adverbs of frequency immediately before the main verb, but after the verb "to be".'
    },
    'spelling': {
        'title': 'Spelling & Orthography',
        'rule_summary': 'Pay close attention to silent letters, double consonants, and unstressed vowels.',
        'common_trap': 'Common typos: "definately" -> "definitely", "seperate" -> "separate".',
        'tip': 'Break tricky words into syllables (de-fin-ite-ly).'
    },
    'punctuation': {
        'title': 'Punctuation & Mechanics',
        'rule_summary': 'Use commas after introductory dependent clauses and periods/question marks to cleanly end sentences.',
        'common_trap': 'Run-on sentences without conjunctions or periods.',
        'tip': 'Read the sentence out loud; natural breathing pauses often indicate needed punctuation.'
    },
    'capitalization': {
        'title': 'Capitalization Rules',
        'rule_summary': 'Capitalize the first word of every sentence, the pronoun "I", and proper nouns (names, cities, days, months).',
        'common_trap': 'Leaving the pronoun "i" lowercase or forgetting to capitalize days of the week.',
        'tip': 'Proper nouns refer to specific unique individuals, places, or official titles.'
    },
    'sentence_structure': {
        'title': 'Complex Sentence Structure',
        'rule_summary': 'Avoid double conjunctions in the same clause (do not combine "Because... so" or "Although... but").',
        'common_trap': '"Because he was ill, so he stayed home." Correct: "Because he was ill, he stayed home."',
        'tip': 'Choose either the subordinating conjunction or the coordinating conjunction, not both.'
    }
}

class LearningCoachService:
    """
    Personalized AI Learning Coach (Module 5).
    Evaluates student exercise history and reading performance to diagnose recurring weaknesses,
    calculate mastery levels, and formulate adaptive learning recommendations.
    """

    def get_diagnostic(self, user_id: int) -> Dict[str, Any]:
        """
        Generates full learning diagnostic and personalized study plan for student.
        """
        user = get_user_by_id(user_id) if user_id else None
        english_level = user.get('english_level', 'Intermediate') if user else 'Intermediate'
        student_name = user.get('username', 'Student') if user else 'Student'

        # 1. Fetch performance data
        topic_stats = get_user_grammar_topic_breakdown(user_id) if user_id else []
        recent_exercises = get_user_exercise_history(user_id, limit=10) if user_id else []
        reading_entries = get_history(user_id=user_id, limit=10) if user_id else []

        # 2. Build full category breakdown combining default topics with user attempts
        analyzed_categories = {}
        for item in topic_stats:
            cat = item['category']
            analyzed_categories[cat] = {
                'category': cat,
                'title': GRAMMAR_TOPIC_DESCRIPTIONS.get(cat, {}).get('title', cat.replace('_', ' ').title()),
                'attempts': item['attempts'],
                'accuracy': item['accuracy'],
                'avg_score': item['avg_score'],
                'status': item['status'],
                'info': GRAMMAR_TOPIC_DESCRIPTIONS.get(cat, {})
            }

        # Fill in untouched categories so the student sees their complete mastery map
        for cat_key, meta in GRAMMAR_TOPIC_DESCRIPTIONS.items():
            if cat_key not in analyzed_categories:
                analyzed_categories[cat_key] = {
                    'category': cat_key,
                    'title': meta['title'],
                    'attempts': 0,
                    'accuracy': 70.0,  # neutral baseline for unpracticed
                    'avg_score': 70.0,
                    'status': 'unpracticed',
                    'info': meta
                }

        all_topics_list = list(analyzed_categories.values())

        # Sort by accuracy ascending so weakest topics appear first
        all_topics_list.sort(key=lambda x: x['accuracy'])

        weak_areas = [t for t in all_topics_list if t['status'] in ('weak', 'moderate', 'unpracticed')][:3]
        strong_areas = [t for t in all_topics_list if t['status'] == 'mastered'][:3]

        # 3. Overall Mastery Score (0-100%)
        if topic_stats:
            overall_mastery = round(sum(t['accuracy'] for t in topic_stats) / len(topic_stats), 1)
        else:
            overall_mastery = 70.0

        # Determine recommended level
        if overall_mastery >= 85 and len(topic_stats) >= 3:
            recommended_level = 'Advanced'
        elif overall_mastery >= 65:
            recommended_level = 'Intermediate'
        else:
            recommended_level = 'Beginner'

        # 4. Generate Personalized Learning Recommendations
        actionable_steps = []
        for idx, weak in enumerate(weak_areas, 1):
            cat_name = weak['category']
            cat_info = GRAMMAR_TOPIC_DESCRIPTIONS.get(cat_name, {})
            actionable_steps.append({
                'priority': idx,
                'category': cat_name,
                'title': weak['title'],
                'current_accuracy': f"{weak['accuracy']}%",
                'action': f"Complete 5 targeted practice drills on {weak['title']}.",
                'core_rule': cat_info.get('rule_summary', ''),
                'pro_tip': cat_info.get('tip', '')
            })

        # Add a reading comprehension recommendation
        actionable_steps.append({
            'priority': len(actionable_steps) + 1,
            'category': 'reading_comprehension',
            'title': 'Active Reading Comprehension',
            'current_accuracy': 'Ongoing',
            'action': f"Analyze an {english_level} passage in your Reading Workspace to boost contextual vocabulary.",
            'core_rule': 'Identify the main idea in paragraph 1 and evidence details in paragraphs 2-3.',
            'pro_tip': 'Take the 5-question comprehension quiz immediately after reading to cement understanding.'
        })

        return {
            'student_name': student_name,
            'current_level': english_level,
            'recommended_level': recommended_level,
            'overall_mastery': overall_mastery,
            'total_exercises_completed': len(recent_exercises),
            'total_readings_analyzed': len(reading_entries),
            'weak_areas': weak_areas,
            'strong_areas': strong_areas,
            'all_topics': all_topics_list,
            'actionable_steps': actionable_steps,
            'coach_summary': f"Welcome {student_name}! Your current overall mastery is {overall_mastery}%. "
                             f"Focusing on {weak_areas[0]['title'] if weak_areas else 'core grammar'} "
                             f"will yield the fastest improvement in your reading and writing fluency."
        }

coach_service = LearningCoachService()
