import re
import random
import logging
from collections import Counter
import nltk
from nltk.corpus import stopwords, wordnet
from nltk.tokenize import sent_tokenize, word_tokenize

logger = logging.getLogger(__name__)

class ComprehensionService:
    def __init__(self):
        try:
            self.stop_words = set(stopwords.words('english'))
        except Exception:
            self.stop_words = {
                'the', 'a', 'an', 'and', 'or', 'but', 'is', 'are', 'was', 'were',
                'in', 'on', 'at', 'to', 'for', 'with', 'about', 'by', 'as', 'it',
                'this', 'that', 'from', 'they', 'we', 'he', 'she', 'you', 'i', 'of'
            }

    def generate_questions(self, text: str, count: int = 5) -> list:
        """
        Generate 5 comprehension questions directly based on the passage:
        - Main Idea / Purpose
        - Factual Detail
        - Vocabulary in Context
        - Cause & Effect / Relation
        - Passage Synthesis / Inference
        """
        if not text or not text.strip():
            return []

        sentences = [s.strip() for s in sent_tokenize(text) if len(s.strip()) > 10]
        if not sentences:
            sentences = [s.strip() for s in text.split('.') if len(s.strip()) > 10]

        # Extract meaningful content words
        words = [
            w.lower() for w in word_tokenize(text)
            if w.isalpha() and w.lower() not in self.stop_words and len(w) > 3
        ]
        word_freq = Counter(words)
        top_keywords = [w for w, _ in word_freq.most_common(8)]

        questions = []

        # 1. Main Idea Question
        main_idea_q = self._create_main_idea_question(sentences, top_keywords, text)
        if main_idea_q:
            main_idea_q['id'] = 1
            questions.append(main_idea_q)

        # 2. Vocabulary in Context Question
        vocab_q = self._create_vocabulary_question(sentences, words)
        if vocab_q:
            vocab_q['id'] = 2
            questions.append(vocab_q)

        # 3. Factual Detail Question
        factual_q = self._create_factual_question(sentences, top_keywords, excluded_indices={0})
        if factual_q:
            factual_q['id'] = 3
            questions.append(factual_q)

        # 4. Sentence Relationship / Cause & Effect Question
        relation_q = self._create_relationship_question(sentences)
        if relation_q:
            relation_q['id'] = 4
            questions.append(relation_q)

        # 5. Synthesis / Inference Question
        synth_q = self._create_synthesis_question(sentences, top_keywords)
        if synth_q:
            synth_q['id'] = 5
            questions.append(synth_q)

        # If any questions couldn't be generated due to short text, fill with sentence verification
        while len(questions) < min(count, 5):
            idx = len(questions) + 1
            fallback_q = self._create_fallback_question(sentences, len(questions))
            fallback_q['id'] = idx
            questions.append(fallback_q)

        return questions[:count]

    def _create_main_idea_question(self, sentences: list, top_keywords: list, full_text: str) -> dict:
        """Create question assessing understanding of the primary topic."""
        primary_keyword = top_keywords[0] if top_keywords else "the passage"
        secondary_keyword = top_keywords[1] if len(top_keywords) > 1 else "ideas"

        first_sentence = sentences[0] if sentences else ""
        correct_answer = (
            f"An exploration of {primary_keyword} and its significance to {secondary_keyword}."
            if top_keywords else f"Understanding the core theme: {first_sentence[:60]}..."
        )

        distractors = [
            f"A detailed historical biography of a single 18th-century inventor.",
            f"An argument against technological and educational progress.",
            f"A mathematical critique of {primary_keyword} formulas and calculations."
        ]

        options, correct_key = self._format_options(correct_answer, distractors)
        return {
            'type': 'main_idea',
            'question': "What is the primary topic or main idea expressed in this passage?",
            'options': options,
            'correct_answer': correct_key,
            'explanation': (
                f"The passage focuses centrally on '{primary_keyword}', "
                f"which appears frequently and frames the main discussion."
            )
        }

    def _create_vocabulary_question(self, sentences: list, words: list) -> dict:
        """Create question testing vocabulary meaning in context using WordNet."""
        target_word = None
        target_synonyms = []
        target_definition = ""

        # Search for a word that has clear synsets in WordNet
        candidate_words = [w for w in words if len(w) >= 5 and w.isalpha()]
        for w in candidate_words:
            syns = wordnet.synsets(w)
            if syns:
                syn = syns[0]
                target_definition = syn.definition()
                lemmas = [l.name().replace('_', ' ') for l in syn.lemmas() if l.name().lower() != w]
                if lemmas:
                    target_word = w
                    target_synonyms = lemmas
                    break

        if not target_word:
            # Fallback vocabulary word from available words
            target_word = candidate_words[0] if candidate_words else "crucial"
            correct_answer = "Significant, necessary, or important"
            distractors = ["Unrelated and insignificant", "Extremely fast-moving", "Easily broken or fragile"]
            explanation = f"In this reading passage, '{target_word}' is used in its standard contextual meaning."
        else:
            correct_answer = f"{target_synonyms[0].capitalize()} ({target_definition})"
            distractors = [
                "Completely contrary or opposite to standard practice",
                "Having no measurable value or meaning",
                "Occurring purely at random intervals"
            ]
            explanation = f"'{target_word}' is defined as: {target_definition}."

        options, correct_key = self._format_options(correct_answer, distractors)
        return {
            'type': 'vocabulary',
            'question': f"In the context of the passage, what does the word '{target_word}' most closely mean?",
            'options': options,
            'correct_answer': correct_key,
            'explanation': explanation
        }

    def _create_factual_question(self, sentences: list, top_keywords: list, excluded_indices: set) -> dict:
        """Create factual question based directly on a specific sentence."""
        target_sentence = None
        for i, s in enumerate(sentences):
            if i not in excluded_indices and 15 < len(s) < 160:
                target_sentence = s
                break

        if not target_sentence:
            target_sentence = sentences[-1] if sentences else "The passage conveys important insights."

        clean_sent = target_sentence.rstrip('.')
        correct_answer = f"{clean_sent}."
        
        # Generate plausible factual distractors
        distractors = [
            f"The passage states the direct opposite regarding {top_keywords[0] if top_keywords else 'the subject'}.",
            f"It was concluded that no further study or attention is necessary.",
            f"The events took place without any underlying reasons or results."
        ]

        options, correct_key = self._format_options(correct_answer, distractors)
        return {
            'type': 'factual',
            'question': "According to the passage, which of the following factual statements is true?",
            'options': options,
            'correct_answer': correct_key,
            'explanation': f"This statement directly corresponds to the passage text: \"{target_sentence}\""
        }

    def _create_relationship_question(self, sentences: list) -> dict:
        """Create question testing relationships, causes, or details in the passage."""
        # Find sentence with relational or descriptive qualities
        target = None
        for s in sentences[1:]:
            if any(w in s.lower() for w in ['because', 'since', 'as', 'leads to', 'result', 'important', 'help', 'allow']):
                target = s
                break
        if not target and len(sentences) > 1:
            target = sentences[len(sentences) // 2]
        elif not target:
            target = sentences[0]

        correct_answer = f"{target.rstrip('.')}."
        distractors = [
            "No clear relationship or consequence is established in the passage.",
            "The outcome proved to be counterproductive and was immediately abandoned.",
            "All participants decided to reject the proposed findings."
        ]

        options, correct_key = self._format_options(correct_answer, distractors)
        return {
            'type': 'relation',
            'question': "Which detail regarding causes, consequences, or actions is described in the text?",
            'options': options,
            'correct_answer': correct_key,
            'explanation': f"The author notes: \"{target}\""
        }

    def _create_synthesis_question(self, sentences: list, top_keywords: list) -> dict:
        """Create synthesis / inference question testing overall takeaway."""
        keyword = top_keywords[0] if top_keywords else "the passage"
        last_sentence = sentences[-1] if sentences else ""

        correct_answer = (
            f"Careful attention to {keyword} leads to greater understanding and effectiveness."
        )
        distractors = [
            f"The passage proves that {keyword} has no practical relevance today.",
            f"Readers are urged to avoid studying or practicing these concepts.",
            f"None of the mentioned ideas can be applied in real-world scenarios."
        ]

        options, correct_key = self._format_options(correct_answer, distractors)
        return {
            'type': 'inference',
            'question': "Which conclusion can be most reasonably inferred from the reading?",
            'options': options,
            'correct_answer': correct_key,
            'explanation': (
                f"Based on the concluding thoughts and progression of the passage "
                f"(\"{last_sentence[:80]}...\"), this is the most logical inference."
            )
        }

    def _create_fallback_question(self, sentences: list, index: int) -> dict:
        """Fallback question generator when passage is concise."""
        s = sentences[index % len(sentences)] if sentences else "The text provides foundational knowledge."
        correct_answer = f"\"{s.rstrip('.')}...\""
        distractors = [
            "The text mentions an unrelated discussion on quantum physics.",
            "The author expresses complete neutrality without providing any examples.",
            "The passage was originally written in an ancient unrecorded dialect."
        ]
        options, correct_key = self._format_options(correct_answer, distractors)
        return {
            'type': 'comprehension',
            'question': "Which sentence or statement is explicitly included in the reading?",
            'options': options,
            'correct_answer': correct_key,
            'explanation': f"This exact thought is presented in the passage: \"{s}\""
        }

    def _format_options(self, correct: str, distractors: list) -> tuple:
        """Shuffle choices and format as A, B, C, D multiple choice."""
        choices = [correct] + distractors[:3]
        random.shuffle(choices)
        labels = ['A', 'B', 'C', 'D']
        options = []
        correct_key = 'A'

        for i, text in enumerate(choices):
            lbl = labels[i]
            options.append({'id': lbl, 'text': text})
            if text == correct:
                correct_key = lbl

        return options, correct_key

    def evaluate_answers(self, questions: list, user_answers: dict) -> dict:
        """
        Evaluate submitted user answers against question answer keys.
        user_answers: dict mapping question_id (str or int) to selected option ('A', 'B', 'C', 'D')
        """
        if not questions:
            return {
                'total_questions': 0,
                'correct_count': 0,
                'score_percentage': 0.0,
                'breakdown': []
            }

        correct_count = 0
        breakdown = []

        for q in questions:
            q_id = str(q.get('id'))
            correct_ans = q.get('correct_answer', '').upper()
            user_choice = str(user_answers.get(q_id, '')).upper()
            is_correct = (user_choice == correct_ans) and (user_choice != '')

            if is_correct:
                correct_count += 1

            # Find option text
            selected_text = next((opt['text'] for opt in q.get('options', []) if opt['id'] == user_choice), 'No answer selected')
            correct_text = next((opt['text'] for opt in q.get('options', []) if opt['id'] == correct_ans), '')

            breakdown.append({
                'id': q.get('id'),
                'type': q.get('type', 'factual'),
                'question': q.get('question', ''),
                'selected_answer': user_choice,
                'selected_text': selected_text,
                'correct_answer': correct_ans,
                'correct_text': correct_text,
                'is_correct': is_correct,
                'explanation': q.get('explanation', ''),
                'options': q.get('options', [])
            })

        total = len(questions)
        score_pct = round((correct_count / total) * 100, 1) if total > 0 else 0.0

        return {
            'total_questions': total,
            'correct_count': correct_count,
            'score_percentage': score_pct,
            'breakdown': breakdown
        }

comprehension_service = ComprehensionService()
