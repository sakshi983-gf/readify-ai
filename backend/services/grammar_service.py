import re
import string
import logging
from spellchecker import SpellChecker

logger = logging.getLogger(__name__)

class GrammarService:
    def __init__(self):
        self.spell = SpellChecker(language='en')
        
        # Comprehensive global names, tech terms, and academic words
        custom_whitelist = {
            'sakshi', 'rahul', 'priya', 'ananya', 'aarav', 'rohan', 'sneha', 'amit', 'neha',
            'pooja', 'aditi', 'vikram', 'arjun', 'raj', 'kavya', 'shreya', 'riya', 'deepak',
            'readify', 'ai', 'nlp', 'app', 'online', 'website', 'internet', 'semester', 'semesters',
            'btech', 'mtech', 'bca', 'mca', 'phd', 'cgpa', 'gpa', 'syllabus', 'curriculum',
            'don\'t', 'doesn\'t', 'didn\'t', 'won\'t', 'can\'t', 'couldn\'t',
            'wouldn\'t', 'shouldn\'t', 'it\'s', 'that\'s', 'there\'s', 'what\'s', 'who\'s',
            'we\'re', 'they\'re', 'you\'re', 'i\'m', 'i\'ve', 'we\'ve', 'they\'ve', 'you\'ve'
        }
        self.spell.word_frequency.load_words(custom_whitelist)
        self.known_names = {
            'sakshi', 'rahul', 'priya', 'ananya', 'aarav', 'rohan', 'sneha', 'amit', 'neha',
            'pooja', 'aditi', 'vikram', 'arjun', 'raj', 'kavya', 'shreya', 'riya', 'deepak'
        }

    def check_text(self, text: str) -> dict:
        """
        Analyze text for spelling, grammar, punctuation, and syntax errors.
        Handles proper names intelligently without replacing them with dictionary words.
        """
        if not text or not text.strip():
            return {
                'original_text': text,
                'corrected_text': text,
                'errors': [],
                'error_count': 0,
                'category_counts': {'spelling': 0, 'grammar': 0, 'punctuation': 0, 'style': 0},
                'message': 'No text provided for analysis.'
            }

        # Step 0: Identify proper names in text (e.g. following 'my name', 'i am', 'called')
        detected_names = self._detect_proper_names(text)
        for name in detected_names:
            self.spell.word_frequency.load_words([name.lower()])

        errors = []

        # 1. Advanced Structural & Phrasing Checks (e.g., introductions, missing verbs, verb tenses)
        errors.extend(self._check_structural_syntax(text, detected_names))

        # 2. Check Sentence Capitalization & Lowercase 'i'
        errors.extend(self._check_capitalization(text))

        # 3. Check Repeated Words
        errors.extend(self._check_repeated_words(text))

        # 4. Check Article Usage (a vs an)
        errors.extend(self._check_articles(text))

        # 5. Check Subject-Verb Agreement
        errors.extend(self._check_subject_verb_agreement(text))

        # 6. Check Commonly Confused Words
        errors.extend(self._check_confused_words(text))

        # 7. Check Punctuation & Spacing
        errors.extend(self._check_punctuation(text))

        # 8. Check Spelling (Excluding proper names and protected words)
        errors.extend(self._check_spelling(text, detected_names))

        # Deduplicate overlapping errors
        errors = self._deduplicate_errors(errors)
        errors.sort(key=lambda x: x['offset'])

        # Apply corrections
        corrected_text = self.apply_corrections(text, errors)

        # Final polish for clean punctuation and spacing in corrected text
        corrected_text = self._post_process_corrected(corrected_text)

        category_counts = {
            'spelling': sum(1 for e in errors if e['category'] == 'spelling'),
            'grammar': sum(1 for e in errors if e['category'] == 'grammar'),
            'punctuation': sum(1 for e in errors if e['category'] == 'punctuation'),
            'style': sum(1 for e in errors if e['category'] == 'style'),
        }

        message = (
            "No common spelling or grammatical errors detected. Excellent writing!"
            if not errors
            else f"Detected {len(errors)} potential improvement{'s' if len(errors) != 1 else ''}."
        )

        return {
            'original_text': text,
            'corrected_text': corrected_text,
            'errors': errors,
            'error_count': len(errors),
            'category_counts': category_counts,
            'message': message
        }

    def _detect_proper_names(self, text: str) -> set:
        """Extract personal names so they are never treated as misspelled words."""
        names = set(self.known_names)
        patterns = [
            r'\bmy name(?:\s+is)?\s+([A-Za-z]+)\b',
            r'\bi am\s+([A-Za-z]+)\b',
            r'\bcalled\s+([A-Za-z]+)\b'
        ]
        for pat in patterns:
            for match in re.finditer(pat, text, re.IGNORECASE):
                word = match.group(1).lower()
                if word not in {'a', 'an', 'the', 'in', 'studying', 'student', 'very', 'not'}:
                    names.add(word)
        return names

    def _check_structural_syntax(self, text: str, detected_names: set) -> list:
        """Check for high-level sentence structure, missing linking verbs, and continuous tenses."""
        errors = []

        # 1. Missing linking verb in "my name [name]" (e.g. "my name sakshi")
        missing_is_pattern = re.compile(r'\b(my name)\s+([A-Za-z]+)\b', re.IGNORECASE)
        for match in missing_is_pattern.finditer(text):
            next_word = match.group(2)
            if next_word.lower() != 'is':
                # Target the gap after 'my name'
                start = match.start(1)
                end = match.end(2)
                matched_str = match.group(0)
                name_cap = next_word.capitalize()
                prefix = "My name is" if (match.group(1)[0].isupper() or start == 0) else "my name is"
                errors.append({
                    'id': f"link_verb_{start}",
                    'category': 'grammar',
                    'offset': start,
                    'length': len(matched_str),
                    'matched_text': matched_str,
                    'replacements': [f"{prefix} {name_cap}"],
                    'message': f"Missing linking verb 'is'. In English, say 'My name is {name_cap}'.",
                    'rule': 'MISSING_LINKING_VERB'
                })

        # 2. Verb form "am study" -> "am studying" or "am studying in the"
        study_pattern = re.compile(r'\b(am\s+study)\s+(?:in\s+)?(?:the\s+)?([a-z]+(?:\s+semester)?)\b', re.IGNORECASE)
        for match in study_pattern.finditer(text):
            target = match.group(0)
            sem_info = match.group(2)
            errors.append({
                'id': f"verb_tense_{match.start()}",
                'category': 'grammar',
                'offset': match.start(),
                'length': len(target),
                'matched_text': target,
                'replacements': [f"am studying in the {sem_info}"],
                'message': "Verb form & preposition: use present continuous 'am studying in the ...'.",
                'rule': 'VERB_FORM_CONTINUOUS'
            })

        # Simple "am study" standalone
        standalone_study = re.compile(r'\b(am\s+study)\b', re.IGNORECASE)
        for match in standalone_study.finditer(text):
            # Check if not already matched
            if not any(e['offset'] <= match.start() and e['offset'] + e['length'] >= match.end() for e in errors):
                errors.append({
                    'id': f"verb_study_{match.start()}",
                    'category': 'grammar',
                    'offset': match.start(),
                    'length': len(match.group(1)),
                    'matched_text': match.group(1),
                    'replacements': ['am studying'],
                    'message': "Use the continuous form 'am studying' after the auxiliary verb 'am'.",
                    'rule': 'AUXILIARY_VERB_AGREEMENT'
                })

        return errors

    def _check_capitalization(self, text: str) -> list:
        errors = []
        # Check standalone lowercase 'i'
        for match in re.finditer(r'\b(i)\b', text):
            errors.append({
                'id': f"cap_i_{match.start()}",
                'category': 'grammar',
                'offset': match.start(),
                'length': 1,
                'matched_text': 'i',
                'replacements': ['I'],
                'message': "The personal pronoun 'I' must always be capitalized.",
                'rule': 'PRONOUN_I_CAPITALIZATION'
            })

        # Check start of text capitalization
        first_letter_match = re.search(r'^[^\w]*([a-z])', text)
        if first_letter_match:
            char_pos = first_letter_match.start(1)
            char = first_letter_match.group(1)
            errors.append({
                'id': f"cap_start_{char_pos}",
                'category': 'punctuation',
                'offset': char_pos,
                'length': 1,
                'matched_text': char,
                'replacements': [char.upper()],
                'message': f"Sentences must begin with a capital letter: '{char.upper()}'.",
                'rule': 'SENTENCE_CAPITALIZATION'
            })

        # Check sentence start after punctuation
        for match in re.finditer(r'[.!?]\s+([a-z])', text):
            char_pos = match.start(1)
            char = match.group(1)
            errors.append({
                'id': f"cap_sent_{char_pos}",
                'category': 'punctuation',
                'offset': char_pos,
                'length': 1,
                'matched_text': char,
                'replacements': [char.upper()],
                'message': f"Start new sentences with a capital letter: '{char.upper()}'.",
                'rule': 'SENTENCE_CAPITALIZATION'
            })

        # Check proper names capitalization if lowercase
        for name in self.known_names:
            pattern = re.compile(rf'\b({name})\b', re.IGNORECASE)
            for match in pattern.finditer(text):
                matched = match.group(1)
                if matched[0].islower():
                    errors.append({
                        'id': f"cap_name_{match.start()}",
                        'category': 'grammar',
                        'offset': match.start(),
                        'length': len(matched),
                        'matched_text': matched,
                        'replacements': [matched.capitalize()],
                        'message': f"Proper nouns and names like '{matched.capitalize()}' must be capitalized.",
                        'rule': 'PROPER_NOUN_CAPITALIZATION'
                    })

        return errors

    def _check_repeated_words(self, text: str) -> list:
        errors = []
        pattern = re.compile(r'\b([A-Za-z]+)\s+\1\b', re.IGNORECASE)
        for match in pattern.finditer(text):
            word = match.group(1)
            errors.append({
                'id': f"repeat_{match.start()}",
                'category': 'grammar',
                'offset': match.start(),
                'length': len(match.group(0)),
                'matched_text': match.group(0),
                'replacements': [word],
                'message': f"Repeated word '{word}'. Remove the duplicate.",
                'rule': 'REPEATED_WORD'
            })
        return errors

    def _check_articles(self, text: str) -> list:
        errors = []
        pattern_a = re.compile(r'\b(a)\s+([aeiou][a-z]+)\b', re.IGNORECASE)
        for match in pattern_a.finditer(text):
            next_word = match.group(2).lower()
            if next_word in {'university', 'universal', 'universe', 'unique', 'uniform', 'unit', 'european', 'one'}:
                continue
            errors.append({
                'id': f"art_a_{match.start(1)}",
                'category': 'grammar',
                'offset': match.start(1),
                'length': len(match.group(1)),
                'matched_text': match.group(1),
                'replacements': ['an' if match.group(1).islower() else 'An'],
                'message': f"Use 'an' before vowel sounds ('{match.group(2)}').",
                'rule': 'ARTICLE_A_AN'
            })

        pattern_an = re.compile(r'\b(an)\s+([bcdfghjklmnpqrstvwxyz][a-z]+)\b', re.IGNORECASE)
        for match in pattern_an.finditer(text):
            next_word = match.group(2).lower()
            if next_word in {'hour', 'hours', 'honest', 'honesty', 'honor', 'honorable', 'heir', 'heiress'}:
                continue
            errors.append({
                'id': f"art_an_{match.start(1)}",
                'category': 'grammar',
                'offset': match.start(1),
                'length': len(match.group(1)),
                'matched_text': match.group(1),
                'replacements': ['a' if match.group(1).islower() else 'A'],
                'message': f"Use 'a' before consonant sounds ('{match.group(2)}').",
                'rule': 'ARTICLE_A_AN'
            })
        return errors

    def _check_subject_verb_agreement(self, text: str) -> list:
        errors = []
        patterns = [
            (r'\b(he|she|it)\s+(go)\b', 'goes', 'Subject-verb agreement: third-person singular takes "goes".'),
            (r'\b(he|she|it)\s+(have)\b', 'has', 'Subject-verb agreement: third-person singular takes "has".'),
            (r'\b(he|she|it)\s+(do)\b', 'does', 'Subject-verb agreement: third-person singular takes "does".'),
            (r'\b(he|she|it)\s+(don\'t)\b', "doesn't", 'Use "doesn\'t" with third-person singular subjects.'),
            (r'\b(they|we|you)\s+(has)\b', 'have', 'Subject-verb agreement: plural subjects take "have".'),
            (r'\b(they|we|you)\s+(is)\b', 'are', 'Subject-verb agreement: plural subjects take "are".'),
            (r'\b(they|we|you)\s+(was)\b', 'were', 'Subject-verb agreement: plural subjects take "were".'),
            (r'\b(i)\s+(has)\b', 'have', 'Use "have" with first-person singular "I".'),
            (r'\b(i)\s+(is)\b', 'am', 'Use "am" with first-person singular "I".')
        ]

        for pat, replacement, msg in patterns:
            for match in re.finditer(pat, text, re.IGNORECASE):
                verb_span = match.span(2)
                verb = match.group(2)
                errors.append({
                    'id': f"sva_{verb_span[0]}",
                    'category': 'grammar',
                    'offset': verb_span[0],
                    'length': len(verb),
                    'matched_text': verb,
                    'replacements': [replacement],
                    'message': msg,
                    'rule': 'SUBJECT_VERB_AGREEMENT'
                })
        return errors

    def _check_confused_words(self, text: str) -> list:
        errors = []
        confusions = [
            (r'\b(their)\s+(is|are|was|were)\b', 1, 'there', 'Did you mean "there" indicating existence or location?'),
            (r'\b(there)\s+(car|house|family|books|grades|work|ideas|parents)\b', 1, 'their', 'Did you mean "their" indicating possession?'),
            (r'\b(your)\s+(welcome|right|wrong|going|doing|reading)\b', 1, "you're", 'Did you mean "you\'re" (you are)?'),
            (r'\b(you\'re)\s+(book|name|car|turn|house|grade)\b', 1, "your", 'Did you mean possessive "your"?'),
            (r'\b(its)\s+(a|an|very|not|important|clear)\b', 1, "it's", 'Did you mean "it\'s" (it is)?'),
            (r'\b(to)\s+(much|many|fast|slow|hard|late|early)\b', 1, "too", 'Did you mean "too" (excessively)?'),
            (r'\b(than)\s+(I|we|he|she|they)\s+(went|did|saw)\b', 1, "then", 'Did you mean "then" (time)?'),
            (r'\bmore\s+([a-z]+)\s+(then)\b', 2, "than", 'Use "than" for comparisons.')
        ]

        for pat, group_idx, repl, msg in confusions:
            for match in re.finditer(pat, text, re.IGNORECASE):
                target_word = match.group(group_idx)
                span = match.span(group_idx)
                replacement = repl if target_word.islower() else repl.capitalize()
                errors.append({
                    'id': f"confused_{span[0]}",
                    'category': 'style',
                    'offset': span[0],
                    'length': len(target_word),
                    'matched_text': target_word,
                    'replacements': [replacement],
                    'message': msg,
                    'rule': 'CONFUSED_WORDS'
                })
        return errors

    def _check_punctuation(self, text: str) -> list:
        errors = []
        # Missing end punctuation
        stripped = text.rstrip()
        if stripped and stripped[-1] not in '.!?':
            errors.append({
                'id': f"terminal_punct_{len(stripped)}",
                'category': 'punctuation',
                'offset': len(stripped),
                'length': 0,
                'matched_text': '',
                'replacements': ['.'],
                'message': "End your sentence with proper terminal punctuation ('.').",
                'rule': 'MISSING_TERMINAL_PUNCTUATION'
            })
        return errors

    def _check_spelling(self, text: str, detected_names: set) -> list:
        errors = []
        for match in re.finditer(r"\b[A-Za-z]+(?:'[A-Za-z]+)?\b", text):
            word = match.group(0)
            lower_word = word.lower()

            if len(word) <= 1 or (word.isupper() and len(word) <= 5):
                continue

            # PROTECT NAMES: Never flag detected names or proper nouns as spelling errors!
            if lower_word in detected_names or lower_word in self.known_names:
                continue

            if lower_word in self.spell:
                continue

            candidates = self.spell.candidates(lower_word)
            if candidates:
                suggested_list = list(candidates)[:3]
                best_suggestion = suggested_list[0]
                if word[0].isupper():
                    suggested_list = [c.capitalize() for c in suggested_list]
                    best_suggestion = best_suggestion.capitalize()

                errors.append({
                    'id': f"spell_{match.start()}",
                    'category': 'spelling',
                    'offset': match.start(),
                    'length': len(word),
                    'matched_text': word,
                    'replacements': suggested_list,
                    'message': f"Possible spelling error '{word}'. Did you mean '{best_suggestion}'?",
                    'rule': 'SPELLING'
                })
        return errors

    def _deduplicate_errors(self, errors: list) -> list:
        deduped = []
        seen_spans = set()
        for err in errors:
            span = (err['offset'], err['offset'] + err['length'])
            overlap = False
            for s, e in seen_spans:
                if (err['offset'] >= s and err['offset'] < e) or (span[1] > s and span[1] <= e):
                    overlap = True
                    break
            if not overlap:
                deduped.append(err)
                seen_spans.add(span)
        return deduped

    def apply_corrections(self, text: str, errors: list) -> str:
        if not errors:
            return text

        sorted_errors = sorted(errors, key=lambda x: x['offset'], reverse=True)
        res = text

        for err in sorted_errors:
            offset = err['offset']
            length = err['length']
            replacements = err.get('replacements', [])
            if replacements and replacements[0] is not None:
                rep = replacements[0]
                res = res[:offset] + rep + res[offset + length:]

        return res

    def _post_process_corrected(self, text: str) -> str:
        """Polish final sentence: ensure sentence separation between clauses like 'Sakshi I am' -> 'Sakshi. I am'."""
        text = re.sub(r'([a-zA-Z]+)\s+(I\s+am)', r'\1. \2', text)
        text = re.sub(r'\s+([,.:;?!])', r'\1', text)
        text = re.sub(r'[^\S\r\n]{2,}', ' ', text)
        text = text.strip()
        if text and text[-1] not in '.!?':
            text += '.'
        return text

grammar_service = GrammarService()
