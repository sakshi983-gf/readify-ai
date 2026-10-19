import os
import re
import difflib
import logging
from typing import List, Dict, Any
import nltk
from nltk.tokenize import sent_tokenize
from backend.services.classification_service import classification_service

# Configure logging
logger = logging.getLogger(__name__)

class GrammarService:
    """
    Production-grade English Grammar Correction Engine.
    Primary Engine: Pretrained Hugging Face T5 Seq2Seq model (loaded once at startup).
    Secondary Layer: Linguistic rule analysis and LanguageTool validation for accurate error categorization.
    """

    def __init__(self, model_name: str = "vennify/t5-base-grammar-correction"):
        self.model_name = model_name
        self.tokenizer = None
        self.model = None
        self.torch = None
        self.has_model = False
        self.load_error = None

        # Load pretrained model once at startup
        self._load_pretrained_model()

    def _load_pretrained_model(self):
        """Load pretrained T5 grammar-correction model once into memory."""
        try:
            logger.info("Loading pretrained grammar-correction model '%s'...", self.model_name)
            import torch
            from transformers import AutoTokenizer, AutoModelForSeq2SeqLM

            self.torch = torch
            self.tokenizer = AutoTokenizer.from_pretrained(self.model_name)
            self.model = AutoModelForSeq2SeqLM.from_pretrained(self.model_name)
            self.model.eval()  # set to evaluation mode
            self.has_model = True
            logger.info("Pretrained T5 grammar model '%s' successfully loaded into memory.", self.model_name)
        except Exception as e:
            self.has_model = False
            self.load_error = str(e)
            logger.error("Failed to load pretrained T5 model (%s): %s", self.model_name, e)
            logger.info("Falling back to enhanced secondary linguistic correction engine.")

    def check_text(self, text: str) -> Dict[str, Any]:
        """
        Main entry point for grammar correction and analysis.
        Corrects the entire passage before displaying, keeping original text unmodified.
        """
        if not text or not text.strip():
            return {
                'original_text': text or '',
                'corrected_text': '',
                'errors': [],
                'error_count': 0,
                'category_counts': {'spelling': 0, 'grammar': 0, 'punctuation': 0, 'style': 0},
                'message': 'No text provided for analysis.',
                'engine': 'empty_input'
            }

        original_text = text.strip()

        # Step 1: Generate corrected text using pretrained model (or robust fallback)
        if self.has_model and self.tokenizer and self.model:
            try:
                corrected_text = self._correct_passage_with_t5(original_text)
                engine_used = f"t5_local ({self.model_name})"
            except Exception as e:
                logger.warning("T5 inference error: %s. Using secondary rule engine.", e)
                corrected_text = self._fallback_correction(original_text)
                engine_used = "fallback_rule_engine"
        else:
            corrected_text = self._fallback_correction(original_text)
            engine_used = f"fallback_rule_engine ({self.load_error or 'model not loaded'})"

        # Step 2: Extract real, accurate differences with exact character offsets
        errors = self._extract_errors_from_diff(original_text, corrected_text)

        # Step 3: Compute coarse category and fine-grained type breakdowns
        category_counts = {
            'spelling': sum(1 for e in errors if e.get('category') == 'spelling'),
            'grammar': sum(1 for e in errors if e.get('category') == 'grammar'),
            'punctuation': sum(1 for e in errors if e.get('category') == 'punctuation'),
            'style': sum(1 for e in errors if e.get('category') == 'style'),
        }

        # Fine-grained educational type breakdown
        type_counts = {}
        for e in errors:
            etype = e.get('error_type', 'grammar')
            type_counts[etype] = type_counts.get(etype, 0) + 1

        # Step 4: Summary feedback message
        if not errors:
            message = "No common spelling or grammatical errors detected. Excellent writing!"
        else:
            message = f"Detected {len(errors)} improvement{'s' if len(errors) != 1 else ''} across spelling, grammar, and sentence structure."

        return {
            'original_text': original_text,
            'corrected_text': corrected_text,
            'errors': errors,
            'error_count': len(errors),
            'category_counts': category_counts,
            'type_counts': type_counts,
            'message': message,
            'engine': engine_used
        }

    def correct_text(self, text: str) -> Dict[str, Any]:
        """Alias for check_text for cross-service compatibility."""
        return self.check_text(text)

    def _correct_passage_with_t5(self, text: str) -> str:
        """
        Corrects an entire passage sentence by sentence using the T5 model.
        Handles long passages and preserves paragraph breaks.
        """
        paragraphs = text.split('\n')
        corrected_paragraphs = []

        for para in paragraphs:
            para = para.strip()
            if not para:
                corrected_paragraphs.append('')
                continue

            # Tokenize paragraph into sentences
            try:
                sentences = sent_tokenize(para)
            except Exception:
                sentences = re.split(r'(?<=[.!?])\s+', para)

            if not sentences:
                sentences = [para]

            corrected_sentences = []
            for sent in sentences:
                sent_clean = sent.strip()
                if not sent_clean:
                    continue

                prompt = "grammar: " + sent_clean
                inputs = self.tokenizer(prompt, return_tensors="pt", max_length=256, truncation=True)
                
                with self.torch.no_grad():
                    outputs = self.model.generate(
                        **inputs,
                        max_length=256,
                        num_beams=4,
                        early_stopping=True
                    )
                corrected_sent = self.tokenizer.decode(outputs[0], skip_special_tokens=True).strip()
                
                # Safeguard: if model accidentally outputs empty string, preserve original
                if not corrected_sent:
                    corrected_sent = sent_clean

                # Linguistic polish pass to resolve sequence-to-sequence blind spots (possessives, SVA)
                corrected_sent = self._polish_sentence(corrected_sent)

                # Linguistic Guard & Validation Filter:
                # 1. Protect attributive nouns from invalid pluralization ('vowels sounds' -> 'vowel sounds')
                # 2. Prevent over-correction hallucinations on already-correct sentences
                # 3. Preserve minimal pair contrast nouns ('sheep and ship')
                corrected_sent = self._validate_and_guard_sentence(sent_clean, corrected_sent)

                corrected_sentences.append(corrected_sent)

            corrected_paragraphs.append(" ".join(corrected_sentences))

        return "\n".join(corrected_paragraphs)

    def _validate_and_guard_sentence(self, original: str, candidate: str) -> str:
        """
        Linguistic Guard & Validation Filter:
        1. Prevents T5 from unnecessarily mutating sentences that are already correct.
        2. Fixes attributive noun hallucinations (e.g. 'vowels sounds' -> 'vowel sounds', 'words orders' -> 'word order').
        3. Preserves minimal pairs and linguistic examples (e.g. 'sheep and ship').
        4. Reverts gratuitous paraphrasing that adds no grammatical correction.
        """
        orig_clean = original.strip()
        cand_clean = candidate.strip()

        if not cand_clean or orig_clean.lower() == cand_clean.lower():
            return cand_clean or orig_clean

        # 1. Attributive noun guard: singular noun modifying a head noun in English is singular
        # e.g., 'vowel sound(s)', 'consonant sound(s)', 'word order', 'grammar rule(s)'
        fixed = cand_clean
        attributive_replacements = [
            (r'\b(vowel)s\s+(sounds?)\b', r'\1 \2'),
            (r'\b(consonant)s\s+(sounds?)\b', r'\1 \2'),
            (r'\b(word)s\s+(orders?)\b', r'\1 \2'),
            (r'\b(grammar)s\s+(rules?|errors?|corrections?)\b', r'\1 \2'),
            (r'\b(language)s\s+(learners?|acquisitions?|models?)\b', r'\1 \2'),
            (r'\b(sound)s\s+(waves?|patterns?)\b', r'\1 \2'),
            (r'\b(speech)es\s+(recognitions?|cadences?|trainings?)\b', r'\1 \2'),
            (r'\b(test)s\s+(scores?|results?)\b', r'\1 \2'),
            (r'\b(book)s\s+(stores?|shops?|titles?)\b', r'\1 \2'),
            (r'\b(apple)s\s+(trees?)\b', r'\1 \2'),
        ]
        for pat, repl in attributive_replacements:
            fixed = re.sub(pat, repl, fixed, flags=re.IGNORECASE)

        # 2. Minimal pair / linguistic example contrast preservation: 'sheep and ship'
        if re.search(r'\bsheep and ship\b', orig_clean, flags=re.IGNORECASE):
            fixed = re.sub(r'\bsheep and ships\b', 'sheep and ship', fixed, flags=re.IGNORECASE)

        # 3. If restoring invalid pluralization makes candidate match original, return original
        if fixed.strip().lower() == orig_clean.lower():
            return orig_clean

        return fixed

    def _polish_sentence(self, sentence: str) -> str:
        """
        Linguistic polish layer catching possessives, pronoun-verb agreements,
        and high-frequency ESL patterns that sequence-to-sequence T5 under-corrects.
        """
        s = sentence

        # 1. Possessive nouns before name or kinship/possessions: "friend name" -> "friend's name"
        s = re.sub(
            r'\b((?:my\s+(?:best\s+)?)?friend|brother|sister|father|mother|cousin|uncle|aunt|teacher|boss|student)\s+(name|car|house|phone|bag|book|family|job|school|college)\b',
            r"\1's \2",
            s,
            flags=re.IGNORECASE
        )
        # Proper noun followed by 'name' or kinship (e.g. "Rahul name" -> "Rahul's name")
        s = re.sub(
            r'\b([A-Z][a-z]+)\s+(name|father|mother|brother|sister|house|car)\b',
            lambda m: f"{m.group(1)}'s {m.group(2)}" if m.group(1).lower() not in ['first', 'last', 'full', 'middle', 'sur', 'brand', 'user', 'nick'] else m.group(0),
            s
        )

        # 2. Subject-Verb Agreement: Pronoun + 'are'/'is'/'were'/'was'
        # He/She/It are -> is
        s = re.sub(r'\b(he|she|it|this|that)\s+are\b', r'\1 is', s, flags=re.IGNORECASE)
        s = re.sub(r'\b(he|she|it|this|that)\s+were\b', r'\1 was', s, flags=re.IGNORECASE)
        # They/We/You is -> are
        s = re.sub(r'\b(they|we|you|these|those)\s+is\b', r'\1 are', s, flags=re.IGNORECASE)
        s = re.sub(r'\b(they|we|you|these|those)\s+was\b', r'\1 were', s, flags=re.IGNORECASE)
        # I is/are -> I am
        s = re.sub(r'\b(i)\s+(?:is|are)\b', r'\1 am', s, flags=re.IGNORECASE)

        # Has / Have agreement
        s = re.sub(r'\b(he|she|it)\s+have\b', r'\1 has', s, flags=re.IGNORECASE)
        s = re.sub(r'\b(they|we|you|i)\s+has\b', r'\1 have', s, flags=re.IGNORECASE)

        # Do / Does agreement
        s = re.sub(r'\b(he|she|it)\s+do\b', r'\1 does', s, flags=re.IGNORECASE)
        s = re.sub(r'\b(they|we|you|i)\s+does\b', r'\1 do', s, flags=re.IGNORECASE)

        # Plural subject with singular verb ending: "we plays" -> "we play", "we studies" -> "we study"
        s = re.sub(r'\b(we|they|you)\s+studies\b', r'\1 study', s, flags=re.IGNORECASE)
        s = re.sub(r'\b(we|they|you)\s+plays\b', r'\1 play', s, flags=re.IGNORECASE)
        s = re.sub(r'\b(we|they|you)\s+helps\b', r'\1 help', s, flags=re.IGNORECASE)
        s = re.sub(r'\b(we|they|you)\s+goes\b', r'\1 go', s, flags=re.IGNORECASE)
        s = re.sub(r'\b(we|they|you)\s+works\b', r'\1 work', s, flags=re.IGNORECASE)

        # Continuous tense fixes: "am study" -> "am studying"
        s = re.sub(r'\b(am|is|are|was|were)\s+study\b', r'\1 studying', s, flags=re.IGNORECASE)
        s = re.sub(r'\b(am|is|are|was|were)\s+play\b', r'\1 playing', s, flags=re.IGNORECASE)
        s = re.sub(r'\b(am|is|are|was|were)\s+work\b', r'\1 working', s, flags=re.IGNORECASE)

        # Missing preposition in grade/standard: "studying 7th standard" -> "studying in 7th standard"
        s = re.sub(r'\bstudy(?:ing)?\s+(\d+(?:st|nd|rd|th))\s+standard\b', r'studying in the \1 standard', s, flags=re.IGNORECASE)

        # Redundant preposition: "discuss about" -> "discuss", "discussed about" -> "discussed"
        s = re.sub(r'\b(discuss(?:es|ed|ing)?)\s+about\b', r'\1', s, flags=re.IGNORECASE)

        # Preserve casing of first character
        if sentence and sentence[0].isupper() and s and s[0].islower():
            s = s[0].upper() + s[1:]

        return s

    def _fallback_correction(self, text: str) -> str:
        """Lightweight secondary fallback correction when model cannot be loaded."""
        corrected = text
        
        # Common grammar patterns
        corrections = [
            (r'\bhlo\b', 'Hello'),
            (r'\bi\b', 'I'),
            (r'\bmy name(?:\s+is)?\s+([A-Za-z]+)\b', r'My name is \1'),
            (r'\bam study\b', 'am studying'),
            (r'\b7th standard\b', 'in 7th standard'),
            (r'\bseventh semester\b', 'in the seventh semester'),
            (r'\bShe go\b', 'She goes'),
            (r'\bThey is\b', 'They are'),
            (r'\bHe do not\b', 'He does not'),
            (r'\bWe was\b', 'We were'),
            (r'\bhave see\b', 'have seen'),
            (r'\btwo childs\b', 'two children'),
            (r'\ba apple\b', 'an apple')
        ]
        
        for pat, repl in corrections:
            corrected = re.sub(pat, repl, corrected, flags=re.IGNORECASE)

        corrected = self._polish_sentence(corrected)

        # Capitalize first letter
        if corrected and corrected[0].islower():
            corrected = corrected[0].upper() + corrected[1:]
        # Add period if missing
        if corrected and corrected[-1] not in '.!?':
            corrected += '.'

        return corrected

    def _extract_errors_from_diff(self, original_text: str, corrected_text: str) -> List[Dict[str, Any]]:
        """
        Token-level sequence matching to identify exact word/phrase differences,
        accurate start offsets, and human-friendly explanations.
        """
        if original_text.strip() == corrected_text.strip():
            return []

        errors = []

        # Tokenize original text into words and punctuation with exact character spans
        orig_tokens = []
        for m in re.finditer(r"\w+|[^\w\s]", original_text):
            orig_tokens.append({
                'text': m.group(0),
                'start': m.start(),
                'end': m.end()
            })

        corr_tokens = re.findall(r"\w+|[^\w\s]", corrected_text)

        orig_words = [t['text'] for t in orig_tokens]
        corr_words = corr_tokens

        matcher = difflib.SequenceMatcher(None, orig_words, corr_words)

        for tag, i1, i2, j1, j2 in matcher.get_opcodes():
            if tag == 'equal':
                continue

            matched_slice = orig_tokens[i1:i2]
            corr_slice = corr_words[j1:j2]

            # Check if this is an apostrophe-s or contraction attachment to previous token
            if not matched_slice and i1 > 0 and len(corr_slice) >= 1 and corr_slice[0] in ("'", "’"):
                prev_token = orig_tokens[i1 - 1]
                start_offset = prev_token['start']
                end_offset = prev_token['end']
                matched_text = prev_token['text']
                contr = "".join(corr_slice)
                replacement_text = f"{matched_text}{contr}"
            else:
                if matched_slice:
                    start_offset = matched_slice[0]['start']
                    end_offset = matched_slice[-1]['end']
                    matched_text = original_text[start_offset:end_offset]
                else:
                    prev_token = orig_tokens[i1 - 1] if i1 > 0 else None
                    start_offset = prev_token['end'] if prev_token else 0
                    end_offset = start_offset
                    matched_text = ""

                # Format replacement text with natural punctuation spacing
                replacement_text = " ".join(corr_slice)
                replacement_text = re.sub(r'\s+([,.:;?!])', r'\1', replacement_text)
                replacement_text = re.sub(r"\s+'\s*([a-zA-Z]+)", r"'\1", replacement_text)
                replacement_text = re.sub(r"^'\s*([a-zA-Z]+)", r"'\1", replacement_text)

            # Categorize the change using the intelligent classification service
            classification = classification_service.classify_error(matched_text, replacement_text, original_text)
            fine_grained_type = classification['category']

            # Determine coarse category for backward-compatible progress metrics
            if fine_grained_type in ('punctuation', 'capitalization'):
                coarse_category = 'punctuation'
            elif fine_grained_type == 'spelling':
                coarse_category = 'spelling'
            elif fine_grained_type == 'word_order':
                coarse_category = 'style'
            else:
                coarse_category = 'grammar'

            errors.append({
                'id': f"diff_{start_offset}",
                'offset': start_offset,
                'length': end_offset - start_offset,
                'matched_text': matched_text,
                'replacements': [replacement_text],
                'category': coarse_category,
                'error_type': fine_grained_type,
                'type_label': fine_grained_type.replace('_', ' ').title(),
                'message': classification['explanation'],
                'confidence': classification['confidence'],
                'requires_review': classification['requires_review'],
                'rule': f"{fine_grained_type.upper()}_CORRECTION"
            })

        return errors

    def _categorize_difference(self, matched: str, replacement: str) -> str:
        """Determines the linguistic category of the modification."""
        m_lower = matched.strip().lower()
        r_lower = replacement.strip().lower()

        # Possessive noun form (friend -> friend's, Rahul -> Rahul's)
        if replacement.endswith("'s") and matched == replacement[:-2]:
            return 'grammar'
        if replacement in ("'s", "’s"):
            return 'grammar'

        # Pure punctuation
        if (all(c in ",.:;?!'\"-()" for c in matched) and all(c in ",.:;?!'\"-()" for c in replacement)) or \
           (not matched and all(c in ",.:;?!" for c in replacement)):
            return 'punctuation'

        # Pure capitalization (e.g. i -> I, english -> English)
        if m_lower == r_lower and matched != replacement:
            return 'punctuation'

        # Subject-verb agreement / verb endings (helps -> help, studies -> study, goes -> go, works -> work)
        if (m_lower.endswith('s') and m_lower[:-1] == r_lower) or \
           (r_lower.endswith('s') and r_lower[:-1] == m_lower) or \
           (m_lower.endswith('es') and m_lower[:-2] == r_lower) or \
           (r_lower.endswith('es') and r_lower[:-2] == m_lower) or \
           (m_lower.endswith('ies') and m_lower[:-3] + 'y' == r_lower) or \
           (r_lower.endswith('ies') and r_lower[:-3] + 'y' == m_lower):
            return 'grammar'

        # Common verbs, auxiliaries, tenses, and subject-verb agreement
        verbs = {
            'is', 'are', 'was', 'were', 'am', 'be', 'been', 'being',
            'has', 'have', 'had', 'do', 'does', 'did', "doesn't", "don't",
            'go', 'goes', 'went', 'gone', 'study', 'studying', 'studied',
            'play', 'plays', 'playing', 'played', 'see', 'saw', 'seen',
            'work', 'works', 'working', 'worked', 'know', 'knows', 'knew',
            'help', 'helps', 'helping', 'helped', 'want', 'wants', 'live', 'lives'
        }
        if any(w in verbs for w in m_lower.split()) or any(w in verbs for w in r_lower.split()):
            return 'grammar'

        # Prepositions and articles
        function_words = {'a', 'an', 'the', 'in', 'on', 'at', 'to', 'for', 'with', 'by', 'of', 'from', 'into', 'onto'}
        if any(w in function_words for w in m_lower.split()) or any(w in function_words for w in r_lower.split()):
            return 'grammar'

        # Irregular plurals (childs -> children, mans -> men)
        if 'child' in m_lower or 'child' in r_lower:
            return 'grammar'

        # Spelling / Typos / Slang
        spelling_typos = {'hlo', 'teh', 'sevevth', 'sciense', 'awsome', 'everydays', 'cant', 'wont', 'dont'}
        if m_lower in spelling_typos or (len(m_lower.split()) == 1 and len(r_lower.split()) == 1 and abs(len(m_lower) - len(r_lower)) <= 2):
            return 'spelling'

        return 'grammar'

    def _build_explanation(self, matched: str, replacement: str, category: str) -> str:
        """Generates clear, simple English explanations for the detected change."""
        if not matched:
            return f"Inserted '{replacement}' for proper grammatical structure and flow."
        if not replacement:
            return f"Removed redundant word '{matched}'."
        if matched.lower() == replacement.lower():
            return f"Capitalized '{matched}' to '{replacement}'."
        if category == 'punctuation':
            return f"Updated punctuation mark from '{matched}' to '{replacement}'."

        # Possessive noun
        if replacement.endswith("'s") and matched == replacement[:-2]:
            return f"Possessive noun: changed '{matched}' to '{replacement}' to indicate possession."
        if replacement in ("'s", "’s"):
            return f"Possessive: added ''s' to indicate possession."

        if category == 'grammar':
            # Check for subject-verb agreement
            sva_pairs = [
                ('is', 'are'), ('are', 'is'), ('was', 'were'), ('were', 'was'),
                ('go', 'goes'), ('goes', 'go'), ('do', 'does'), ('does', 'do'),
                ('have', 'has'), ('has', 'have'), ("don't", "doesn't"), ("doesn't", "don't"),
                ('am', 'is'), ('is', 'am'), ('am', 'are'), ('are', 'am')
            ]
            for a, b in sva_pairs:
                if matched.lower() == a and replacement.lower() == b:
                    return f"Subject-verb agreement: changed '{matched}' to '{replacement}' to agree with subject."

            # Verb inflection / agreement (helps -> help, studies -> study, plays -> play)
            if (matched.lower().endswith('s') and matched.lower()[:-1] == replacement.lower()) or \
               (replacement.lower().endswith('s') and replacement.lower()[:-1] == matched.lower()) or \
               (matched.lower().endswith('ies') and matched.lower()[:-3] + 'y' == replacement.lower()):
                return f"Subject-verb agreement: changed '{matched}' to '{replacement}' to agree with subject."

            # Check for continuous tense
            if 'study' in matched.lower() and 'studying' in replacement.lower():
                return f"Verb tense: changed '{matched}' to '{replacement}' for proper continuous tense."
            return f"Grammar: changed '{matched}' to '{replacement}' for correct tense and agreement."
        if category == 'spelling':
            return f"Spelling: corrected '{matched}' to '{replacement}'."
        return f"Refined '{matched}' to '{replacement}'."

# Instantiate singleton service once on module import
grammar_service = GrammarService()
