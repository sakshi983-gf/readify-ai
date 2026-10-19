import re
from typing import Dict, Any, List, Tuple

class GrammarClassificationService:
    """
    Intelligent Grammar Error Classifier (Module 4).
    Categorizes detected linguistic differences into fine-grained educational categories:
    - subject_verb_agreement
    - verb_tense
    - articles
    - prepositions
    - pronouns
    - singular_plural
    - word_order
    - spelling
    - punctuation
    - capitalization
    - sentence_structure
    """

    CATEGORIES = [
        'subject_verb_agreement',
        'verb_tense',
        'articles',
        'prepositions',
        'pronouns',
        'singular_plural',
        'word_order',
        'spelling',
        'punctuation',
        'capitalization',
        'sentence_structure'
    ]

    COMMON_PREPOSITIONS = {
        'in', 'on', 'at', 'to', 'for', 'with', 'by', 'of', 'from',
        'about', 'into', 'through', 'during', 'before', 'after',
        'above', 'below', 'between', 'under', 'since', 'without'
    }

    ARTICLES = {'a', 'an', 'the'}

    PRONOUNS = {
        'i', 'me', 'my', 'mine', 'myself',
        'you', 'your', 'yours', 'yourself',
        'he', 'him', 'his', 'himself',
        'she', 'her', 'hers', 'herself',
        'it', 'its', 'itself',
        'we', 'us', 'our', 'ours', 'ourselves',
        'they', 'them', 'their', 'theirs', 'themselves',
        'who', 'whom', 'whose', 'which', 'that'
    }

    COMMON_IRREGULAR_PLURALS = {
        ('child', 'children'), ('childs', 'children'),
        ('man', 'men'), ('mans', 'men'),
        ('woman', 'women'), ('womans', 'women'),
        ('foot', 'feet'), ('foots', 'feet'),
        ('tooth', 'teeth'), ('tooths', 'teeth'),
        ('mouse', 'mice'), ('mouses', 'mice'),
        ('person', 'people'), ('persons', 'people')
    }

    SVA_PAIRS = {
        ('is', 'are'), ('are', 'is'),
        ('was', 'were'), ('were', 'was'),
        ('am', 'is'), ('is', 'am'),
        ('am', 'are'), ('are', 'am'),
        ('has', 'have'), ('have', 'has'),
        ('do', 'does'), ('does', 'do'),
        ("don't", "doesn't"), ("doesn't", "don't"),
        ('go', 'goes'), ('goes', 'go'),
        ('play', 'plays'), ('plays', 'play'),
        ('study', 'studies'), ('studies', 'study'),
        ('help', 'helps'), ('helps', 'help'),
        ('work', 'works'), ('works', 'work'),
        ('know', 'knows'), ('knows', 'know'),
        ('live', 'lives'), ('lives', 'live'),
        ('want', 'wants'), ('wants', 'want')
    }

    TENSE_PAIRS = {
        ('went', 'go'), ('go', 'went'), ('went', 'gone'),
        ('saw', 'see'), ('see', 'saw'), ('saw', 'seen'), ('see', 'seen'), ('have see', 'have seen'),
        ('ran', 'run'), ('run', 'ran'),
        ('took', 'take'), ('take', 'took'), ('took', 'taken'),
        ('gave', 'give'), ('give', 'gave'), ('gave', 'given'),
        ('ate', 'eat'), ('eat', 'ate'), ('ate', 'eaten'),
        ('bought', 'buy'), ('buy', 'bought'),
        ('wrote', 'write'), ('write', 'wrote'), ('wrote', 'written')
    }

    SPELLING_TYPOS = {
        'hlo': 'hello', 'teh': 'the', 'sevevth': 'seventh', 'sciense': 'science',
        'awsome': 'awesome', 'everydays': 'every day', 'definately': 'definitely',
        'seperate': 'separate', 'untill': 'until', 'alot': 'a lot', 'truely': 'truly',
        'cant': "can't", 'wont': "won't", 'dont': "don't", 'didnt': "didn't",
        'isnt': "isn't", 'arent': "aren't", 'wasnt': "wasn't", 'werent': "weren't"
    }

    def classify_error(self, matched_text: str, replacement_text: str, context_sentence: str = "") -> Dict[str, Any]:
        """
        Classifies the difference between matched_text and replacement_text.
        Returns a dictionary with:
        - category (string)
        - explanation (string)
        - confidence (float between 0.0 and 1.0)
        - requires_review (bool)
        """
        m = matched_text.strip()
        r = replacement_text.strip()
        m_lower = m.lower()
        r_lower = r.lower()

        # 1. Pure Punctuation
        if self._is_punctuation_change(m, r):
            return {
                'category': 'punctuation',
                'explanation': self._build_punctuation_explanation(m, r),
                'confidence': 0.95,
                'requires_review': False
            }

        # 2. Pure Capitalization
        if m_lower == r_lower and m != r:
            return {
                'category': 'capitalization',
                'explanation': f"Capitalization: changed '{m}' to '{r}' for proper sentence casing.",
                'confidence': 0.96,
                'requires_review': False
            }

        # 3. Possessive noun form (friend -> friend's, Rahul -> Rahul's)
        if r.endswith("'s") and (m == r[:-2] or m_lower == r_lower[:-2]):
            return {
                'category': 'subject_verb_agreement',
                'explanation': f"Possessive noun: changed '{m}' to '{r}' to indicate ownership or relationship.",
                'confidence': 0.94,
                'requires_review': False
            }
        if r in ("'s", "’s"):
            return {
                'category': 'subject_verb_agreement',
                'explanation': "Possessive punctuation: added ''s' to indicate possession.",
                'confidence': 0.92,
                'requires_review': False
            }

        # 4. Articles (a, an, the)
        if (m_lower in self.ARTICLES and r_lower in self.ARTICLES) or \
           (not m_lower and r_lower in self.ARTICLES) or \
           (m_lower in self.ARTICLES and not r_lower) or \
           (m_lower.startswith('a ') or r_lower.startswith('an ') or m_lower.startswith('an ') or r_lower.startswith('a ')):
            return {
                'category': 'articles',
                'explanation': self._build_article_explanation(m, r),
                'confidence': 0.93,
                'requires_review': False
            }

        # 5. Prepositions (in, on, at, to, for, etc.)
        m_words = m_lower.split()
        r_words = r_lower.split()
        is_prep = False
        if (m_lower in self.COMMON_PREPOSITIONS and r_lower in self.COMMON_PREPOSITIONS) or \
           (not m_lower and r_lower in self.COMMON_PREPOSITIONS) or \
           (m_lower in self.COMMON_PREPOSITIONS and not r_lower):
            is_prep = True
        elif len(m_words) == 2 and len(r_words) == 2 and m_words[1] == r_words[1] and \
             (m_words[0] in self.COMMON_PREPOSITIONS or r_words[0] in self.COMMON_PREPOSITIONS):
            is_prep = True
        elif any(w in self.COMMON_PREPOSITIONS for w in m_words) and any(w in self.COMMON_PREPOSITIONS for w in r_words):
            if len(m_words) <= 2 and len(r_words) <= 2 and not any(w in self.ARTICLES for w in m_words + r_words):
                is_prep = True

        if is_prep:
            return {
                'category': 'prepositions',
                'explanation': f"Preposition usage: changed '{m or '[missing]'}' to '{r or '[omitted]'}' for correct idiomatic English.",
                'confidence': 0.92,
                'requires_review': False
            }

        # 6. Pronouns
        if m_lower in self.PRONOUNS and r_lower in self.PRONOUNS and m_lower != r_lower:
            return {
                'category': 'pronouns',
                'explanation': f"Pronoun reference: replaced '{m}' with '{r}' for grammatical consistency.",
                'confidence': 0.91,
                'requires_review': False
            }

        # 7. Complex Sentence Structure (multi-word clause rewrite)
        if len(m.split()) > 2 or len(r.split()) > 2:
            return {
                'category': 'sentence_structure',
                'explanation': f"Sentence structure: restructured '{m or '[clause]'}' to '{r}' for clarity and flow.",
                'confidence': 0.82,
                'requires_review': True  # Ambiguous/subjective multi-word rewrite requires student review
            }

        # 8. Singular vs Plural forms & Irregular Plurals
        plural_cues = {'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'many', 'several', 'few', 'these', 'those', 'multiple', 'various', 'both'}
        ctx_words = set(context_sentence.lower().split())
        m_words_set = set(m_lower.split())
        has_plural_cue = bool((ctx_words | m_words_set) & plural_cues)

        if (m_lower, r_lower) in self.COMMON_IRREGULAR_PLURALS or (r_lower, m_lower) in self.COMMON_IRREGULAR_PLURALS:
            return {
                'category': 'singular_plural',
                'explanation': f"Irregular plural: '{m}' should be '{r}'.",
                'confidence': 0.96,
                'requires_review': False
            }

        if has_plural_cue and (
            (r_lower.endswith('s') and r_lower[:-1] == m_lower) or
            (m_lower.endswith('s') and m_lower[:-1] == r_lower) or
            (r_lower.endswith('es') and r_lower[:-2] == m_lower) or
            (m_lower.endswith('es') and m_lower[:-2] == r_lower)
        ):
            return {
                'category': 'singular_plural',
                'explanation': f"Plural form: changed '{m}' to '{r}' to match plural quantity.",
                'confidence': 0.94,
                'requires_review': False
            }

        # 9. Subject-Verb Agreement (SVA)
        if (m_lower, r_lower) in self.SVA_PAIRS:
            return {
                'category': 'subject_verb_agreement',
                'explanation': f"Subject-verb agreement: changed '{m}' to '{r}' to match the grammatical number of the subject.",
                'confidence': 0.95,
                'requires_review': False
            }

        # SVA Verb inflections (e.g. helps -> help, plays -> play, studies -> study)
        if (m_lower.endswith('s') and m_lower[:-1] == r_lower) or \
           (r_lower.endswith('s') and r_lower[:-1] == m_lower) or \
           (m_lower.endswith('ies') and m_lower[:-3] + 'y' == r_lower) or \
           (r_lower.endswith('ies') and r_lower[:-3] + 'y' == m_lower):
            return {
                'category': 'subject_verb_agreement',
                'explanation': f"Subject-verb agreement: adjusted verb form '{m}' to '{r}' to agree with its subject.",
                'confidence': 0.92,
                'requires_review': False
            }

        # 10. Verb Tense
        if (m_lower, r_lower) in self.TENSE_PAIRS or 'study' in m_lower and 'studying' in r_lower or 'am study' in m_lower:
            return {
                'category': 'verb_tense',
                'explanation': f"Verb tense: changed '{m}' to '{r}' to maintain consistent grammatical tense.",
                'confidence': 0.91,
                'requires_review': False
            }
        if (m_lower.endswith('ed') and not r_lower.endswith('ed')) or (r_lower.endswith('ed') and not m_lower.endswith('ed')):
            return {
                'category': 'verb_tense',
                'explanation': f"Verb tense: adjusted '{m}' to '{r}' for the appropriate past/present aspect.",
                'confidence': 0.88,
                'requires_review': False
            }

        # 10. Spelling & Known Typos
        if m_lower in self.SPELLING_TYPOS:
            return {
                'category': 'spelling',
                'explanation': f"Spelling: corrected typo '{m}' to '{self.SPELLING_TYPOS[m_lower]}'.",
                'confidence': 0.97,
                'requires_review': False
            }

        # Single word edits of similar length without punctuation
        if len(m.split()) == 1 and len(r.split()) == 1 and m.isalpha() and r.isalpha():
            if abs(len(m) - len(r)) <= 2:
                # Levenshtein distance check
                dist = self._levenshtein_distance(m_lower, r_lower)
                if 1 <= dist <= 2:
                    return {
                        'category': 'spelling',
                        'explanation': f"Spelling: corrected '{m}' to '{r}'.",
                        'confidence': 0.89,
                        'requires_review': False
                    }

        # 11. Word Order / Inversion
        m_words = sorted(m_lower.split())
        r_words = sorted(r_lower.split())
        if len(m_words) > 1 and m_words == r_words and m_lower != r_lower:
            return {
                'category': 'word_order',
                'explanation': f"Word order: reordered '{m}' to '{r}' for natural English phrasing.",
                'confidence': 0.94,
                'requires_review': False
            }

        # 12. Complex Sentence Structure (multi-word rewrite or insertion)
        if len(m.split()) > 2 or len(r.split()) > 2:
            return {
                'category': 'sentence_structure',
                'explanation': f"Sentence structure: restructured '{m or '[clause]'}' to '{r}' for clarity and flow.",
                'confidence': 0.78,
                'requires_review': True  # Ambiguous/subjective multi-word rewrite requires student review
            }

        # Default fallback
        return {
            'category': 'sentence_structure',
            'explanation': f"Grammar refinement: modified '{m}' to '{r}' to improve sentence accuracy.",
            'confidence': 0.80,
            'requires_review': False
        }

    def _is_punctuation_change(self, m: str, r: str) -> bool:
        punct = set(",.:;?!'\"-()[]{}")
        if (all(c in punct for c in m) and all(c in punct for c in r)) or \
           (not m and all(c in punct for c in r)) or \
           (all(c in punct for c in m) and not r):
            return True
        return False

    def _build_punctuation_explanation(self, m: str, r: str) -> str:
        if not m:
            return f"Punctuation: added '{r}' to close the clause correctly."
        if not r:
            return f"Punctuation: removed unnecessary mark '{m}'."
        return f"Punctuation: replaced '{m}' with '{r}' for standard punctuation."

    def _build_article_explanation(self, m: str, r: str) -> str:
        if m.lower() == 'a' and r.lower() == 'an':
            return "Article choice: changed 'a' to 'an' before a vowel sound."
        if m.lower() == 'an' and r.lower() == 'a':
            return "Article choice: changed 'an' to 'a' before a consonant sound."
        if not m and r.lower() in self.ARTICLES:
            return f"Article: inserted definite/indefinite article '{r}'."
        return f"Article usage: adjusted '{m}' to '{r}'."

    def _levenshtein_distance(self, s1: str, s2: str) -> int:
        if len(s1) < len(s2):
            return self._levenshtein_distance(s2, s1)
        if len(s2) == 0:
            return len(s1)
        prev_row = range(len(s2) + 1)
        for i, c1 in enumerate(s1):
            curr_row = [i + 1]
            for j, c2 in enumerate(s2):
                insertions = prev_row[j + 1] + 1
                deletions = curr_row[j] + 1
                substitutions = prev_row[j] + (c1 != c2)
                curr_row.append(min(insertions, deletions, substitutions))
            prev_row = curr_row
        return prev_row[-1]

classification_service = GrammarClassificationService()
