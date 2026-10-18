import re
import string
import logging
from spellchecker import SpellChecker

logger = logging.getLogger(__name__)

class GrammarService:
    def __init__(self):
        # Initialize spell checker with English dictionary
        self.spell = SpellChecker(language='en')
        # Add common modern / tech words and contractions to ignore list
        custom_words = {
            'readify', 'ai', 'nlp', 'app', 'online', 'website', 'internet',
            'email', 'smartphone', 'laptop', 'software', 'data', 'algorithm',
            'don\'t', 'doesn\'t', 'didn\'t', 'won\'t', 'can\'t', 'couldn\'t',
            'wouldn\'t', 'shouldn\'t', 'it\'s', 'that\'s', 'there\'s',
            'what\'s', 'who\'s', 'we\'re', 'they\'re', 'you\'re', 'i\'m',
            'i\'ve', 'we\'ve', 'they\'ve', 'you\'ve'
        }
        self.spell.word_frequency.load_words(custom_words)

    def check_text(self, text: str) -> dict:
        """
        Analyze text for spelling, grammar, punctuation, and capitalization errors.
        Returns a structured dictionary with errors and corrected text.
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

        errors = []

        # 1. Check Repeated Words
        errors.extend(self._check_repeated_words(text))

        # 2. Check Sentence Capitalization & Lowercase 'i'
        errors.extend(self._check_capitalization(text))

        # 3. Check Article Usage (a vs an)
        errors.extend(self._check_articles(text))

        # 4. Check Subject-Verb Agreement & Common Verb Errors
        errors.extend(self._check_subject_verb_agreement(text))

        # 5. Check Commonly Confused Words (their/there, your/you're, its/it's, etc.)
        errors.extend(self._check_confused_words(text))

        # 6. Check Punctuation & Spacing
        errors.extend(self._check_punctuation(text))

        # 7. Check Spelling Errors
        errors.extend(self._check_spelling(text))

        # Deduplicate errors with overlapping offsets
        errors = self._deduplicate_errors(errors)

        # Sort errors by offset
        errors.sort(key=lambda x: x['offset'])

        # Apply corrections to produce corrected text
        corrected_text = self.apply_corrections(text, errors)

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
                'message': f"Repeated word '{word}'. Consider removing the duplicate.",
                'rule': 'REPEATED_WORD'
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
                'message': "The pronoun 'I' must always be capitalized.",
                'rule': 'PRONOUN_I_CAPITALIZATION'
            })

        # Sentence start capitalization
        # Match beginning of text or punctuation followed by space and lowercase letter
        pattern = re.compile(r'(?:^|[.!?]\s+)([a-z])')
        for match in pattern.finditer(text):
            char_pos = match.start(1)
            char = match.group(1)
            errors.append({
                'id': f"cap_start_{char_pos}",
                'category': 'punctuation',
                'offset': char_pos,
                'length': 1,
                'matched_text': char,
                'replacements': [char.upper()],
                'message': f"Sentences should begin with a capital letter: '{char.upper()}'.",
                'rule': 'SENTENCE_CAPITALIZATION'
            })
        return errors

    def _check_articles(self, text: str) -> list:
        errors = []
        # 'a' followed by vowel sound word (basic heuristic on a, e, i, o, u)
        # Exceptions: university, unique, european, etc.
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
                'message': f"Use 'an' instead of 'a' before words starting with a vowel sound ('{match.group(2)}').",
                'rule': 'ARTICLE_A_AN'
            })

        # 'an' followed by consonant sound word
        pattern_an = re.compile(r'\b(an)\s+([bcdfghjklmnpqrstvwxyz][a-z]+)\b', re.IGNORECASE)
        for match in pattern_an.finditer(text):
            next_word = match.group(2).lower()
            # exceptions with silent h: hour, honest, honor, heir
            if next_word in {'hour', 'hours', 'honest', 'honesty', 'honor', 'honorable', 'heir', 'heiress'}:
                continue
            errors.append({
                'id': f"art_an_{match.start(1)}",
                'category': 'grammar',
                'offset': match.start(1),
                'length': len(match.group(1)),
                'matched_text': match.group(1),
                'replacements': ['a' if match.group(1).islower() else 'A'],
                'message': f"Use 'a' instead of 'an' before words starting with a consonant sound ('{match.group(2)}').",
                'rule': 'ARTICLE_A_AN'
            })
        return errors

    def _check_subject_verb_agreement(self, text: str) -> list:
        errors = []
        patterns = [
            (r'\b(he|she|it)\s+(go)\b', r'\1 goes', 'Subject-verb agreement: third person singular requires "goes".'),
            (r'\b(he|she|it)\s+(have)\b', r'\1 has', 'Subject-verb agreement: third person singular requires "has".'),
            (r'\b(he|she|it)\s+(do)\b', r'\1 does', 'Subject-verb agreement: third person singular requires "does".'),
            (r'\b(he|she|it)\s+(don\'t)\b', r'\1 doesn\'t', 'Use "doesn\'t" with third person singular pronouns.'),
            (r'\b(they|we|you)\s+(has)\b', r'\1 have', 'Subject-verb agreement: plural pronouns require "have".'),
            (r'\b(they|we|you)\s+(is)\b', r'\1 are', 'Subject-verb agreement: plural pronouns require "are".'),
            (r'\b(they|we|you)\s+(was)\b', r'\1 were', 'Subject-verb agreement: plural pronouns require "were".'),
            (r'\b(he|she|it)\s+(run|walk|play|think|read|write|make|take|know|like|need|want)\b', 
             None, 'Third person singular verbs usually end in "-s".')
        ]

        for pat, repl_template, msg in patterns:
            for match in re.finditer(pat, text, re.IGNORECASE):
                # find verb group
                full_span = match.span()
                verb_span = match.span(2)
                verb = match.group(2)
                if repl_template:
                    replacement = "has" if verb.lower() == "have" else ("goes" if verb.lower() == "go" else ("does" if verb.lower() == "do" else ("doesn't" if verb.lower() == "don't" else ("have" if verb.lower() == "has" else ("are" if verb.lower() == "is" else "were")))))
                else:
                    replacement = verb + "s"
                
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
            (r'\b(your)\s+(welcome|right|wrong|going|doing|reading)\b', 1, "you're", 'Did you mean "you\'re" (short for "you are")?'),
            (r'\b(you\'re)\s+(book|name|car|turn|house|grade)\b', 1, "your", 'Did you mean the possessive "your"?'),
            (r'\b(its)\s+(a|an|very|not|important|clear)\b', 1, "it's", 'Did you mean "it\'s" (short for "it is")?'),
            (r'\b(to)\s+(much|many|fast|slow|hard|late|early)\b', 1, "too", 'Did you mean "too" meaning excessively?'),
            (r'\b(than)\s+(I|we|he|she|they)\s+(went|did|saw)\b', 1, "then", 'Did you mean "then" indicating time?'),
            (r'\bmore\s+([a-z]+)\s+(then)\b', 2, "than", 'Use "than" for comparisons.'),
            (r'\b(loose)\s+(weight|my|your|the|a)\s+(game|match|key|keys|money)\b', 1, "lose", 'Did you mean "lose" (the opposite of win/find)?')
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
        # Space before punctuation (e.g. "word ,")
        for match in re.finditer(r'\s+([,.:;?!])', text):
            errors.append({
                'id': f"punct_space_{match.start()}",
                'category': 'punctuation',
                'offset': match.start(),
                'length': len(match.group(0)),
                'matched_text': match.group(0),
                'replacements': [match.group(1)],
                'message': "Unnecessary space before punctuation mark.",
                'rule': 'SPACE_BEFORE_PUNCTUATION'
            })

        # Multiple consecutive spaces
        for match in re.finditer(r'[^\S\r\n]{2,}', text):
            errors.append({
                'id': f"multispace_{match.start()}",
                'category': 'punctuation',
                'offset': match.start(),
                'length': len(match.group(0)),
                'matched_text': match.group(0),
                'replacements': [' '],
                'message': "Multiple consecutive spaces detected.",
                'rule': 'MULTIPLE_SPACES'
            })

        # Missing terminal punctuation at end of non-empty text
        stripped = text.rstrip()
        if stripped and stripped[-1] not in '.!?':
            errors.append({
                'id': f"terminal_punct_{len(stripped)}",
                'category': 'punctuation',
                'offset': len(stripped),
                'length': 0,
                'matched_text': '',
                'replacements': ['.'],
                'message': "Consider ending your sentence with a period or terminal punctuation mark.",
                'rule': 'MISSING_TERMINAL_PUNCTUATION'
            })

        return errors

    def _check_spelling(self, text: str) -> list:
        errors = []
        # Find all words with their positions
        for match in re.finditer(r"\b[A-Za-z]+(?:'[A-Za-z]+)?\b", text):
            word = match.group(0)
            # Skip if capitalized unless at sentence beginning
            # Skip single letters (like 'a' or 'I')
            if len(word) <= 1:
                continue

            # Don't flag uppercase acronyms (e.g. UNESCO, NASA, AI, USA)
            if word.isupper() and len(word) <= 5:
                continue

            lower_word = word.lower()
            if lower_word in self.spell:
                continue

            # Check if unknown
            candidates = self.spell.candidates(lower_word)
            if candidates:
                # Rank candidates: prioritize candidates with shortest distance
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
        """Filter out errors that overlap on the exact same character offsets."""
        deduped = []
        seen_spans = set()
        for err in errors:
            span = (err['offset'], err['offset'] + err['length'])
            # if span collides exactly or within, keep the first (more specific)
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
        """
        Produce corrected text by applying suggested replacements from right to left.
        """
        if not errors:
            return text

        # Sort errors from end of string to start so offsets remain valid
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

grammar_service = GrammarService()
