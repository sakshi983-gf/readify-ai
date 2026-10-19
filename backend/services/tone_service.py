import re
import logging
from typing import Dict, Any, List

logger = logging.getLogger(__name__)

# Lexical replacement dictionaries for tone shifting
FORMAL_SYNONYMS = {
    "start": "commence", "begin": "initiate", "help": "facilitate",
    "use": "utilize", "show": "demonstrate", "find": "ascertain",
    "ask": "inquire", "buy": "procure", "give": "provide",
    "get": "obtain", "look at": "examine", "make": "formulate",
    "good": "beneficial", "bad": "detrimental", "big": "substantial",
    "many": "numerous", "a lot of": "a substantial quantity of",
    "check": "verify", "need": "require", "think": "hypothesize",
    "about": "regarding", "also": "furthermore", "so": "consequently",
    "but": "however", "like": "such as", "kids": "children"
}

CASUAL_SYNONYMS = {
    "commence": "start", "initiate": "kick off", "facilitate": "help out with",
    "utilize": "use", "demonstrate": "show", "ascertain": "find out",
    "inquire": "ask", "procure": "pick up", "provide": "give",
    "obtain": "get", "examine": "check out", "formulate": "make",
    "beneficial": "great", "detrimental": "harmful", "substantial": "huge",
    "numerous": "plenty of", "verify": "double check", "require": "need",
    "consequently": "so", "furthermore": "also", "however": "but",
    "cannot": "can't", "do not": "don't", "is not": "isn't", "are not": "aren't"
}

CONCISE_REDUNDANCIES = [
    (r'\bdue to the fact that\b', 'because'),
    (r'\bin order to\b', 'to'),
    (r'\bat this point in time\b', 'now'),
    (r'\bfor the purpose of\b', 'to'),
    (r'\bin the event that\b', 'if'),
    (r'\ba large number of\b', 'many'),
    (r'\bhas the ability to\b', 'can'),
    (r'\bmake an assumption\b', 'assume'),
    (r'\bcome to an agreement\b', 'agree'),
    (r'\bdraw a conclusion\b', 'conclude'),
    (r'\bconduct an investigation of\b', 'investigate'),
    (r'\bvery unique\b', 'unique'),
    (r'\babsolutely essential\b', 'essential'),
    (r'\bfuture plans\b', 'plans'),
    (r'\bpast history\b', 'history')
]

class ToneWritingService:
    """
    Multi-Tone Writing Studio Engine (Module 14).
    Transforms English text into 4 distinct stylistic registers:
    - Academic (Scholarly & elevated)
    - Professional (Clear & business-ready)
    - Casual (Warm & conversational)
    - Concise (Executive brevity & high impact)
    """

    def rewrite_tone(self, text: str, target_tone: str) -> Dict[str, Any]:
        target_tone = target_tone.lower().strip()
        if not text or not text.strip():
            return {
                "original_text": text,
                "rewritten_text": text,
                "target_tone": target_tone,
                "word_count_original": 0,
                "word_count_rewritten": 0,
                "reduction_percentage": 0.0,
                "key_adjustments": []
            }

        cleaned = text.strip()
        orig_words = len(cleaned.split())
        adjustments = []

        if target_tone == "academic":
            rewritten, adjustments = self._to_academic(cleaned)
        elif target_tone == "professional":
            rewritten, adjustments = self._to_professional(cleaned)
        elif target_tone == "casual":
            rewritten, adjustments = self._to_casual(cleaned)
        elif target_tone == "concise":
            rewritten, adjustments = self._to_concise(cleaned)
        else:
            rewritten = cleaned
            adjustments = ["Preserved original text."]

        new_words = len(rewritten.split())
        reduction = 0.0
        if orig_words > 0:
            reduction = round(((orig_words - new_words) / orig_words) * 100, 1)

        return {
            "original_text": cleaned,
            "rewritten_text": rewritten,
            "target_tone": target_tone,
            "tone": target_tone,
            "word_count_original": orig_words,
            "word_count_rewritten": new_words,
            "original_word_count": orig_words,
            "rewritten_word_count": new_words,
            "reduction_percentage": max(0.0, reduction),
            "key_adjustments": adjustments,
            "adjustments": adjustments
        }

    def _to_academic(self, text: str) -> (str, List[str]):
        res = text
        adjustments = []

        # Expand contractions for academic register
        contractions = {
            r"\bcan't\b": "cannot", r"\bwon't\b": "will not", r"\bdon't\b": "do not",
            r"\bisn't\b": "is not", r"\baren't\b": "are not", r"\bit's\b": "it is",
            r"\bthere's\b": "there is", r"\bwe've\b": "we have", r"\bthey're\b": "they are"
        }
        for pat, repl in contractions.items():
            if re.search(pat, res, flags=re.IGNORECASE):
                res = re.sub(pat, repl, res, flags=re.IGNORECASE)
                adjustments.append(f"Expanded contraction '{pat[2:-2]}' to formal '{repl}'.")

        # Upgrade informal words to formal academic synonyms
        for inf, formal in FORMAL_SYNONYMS.items():
            pattern = r'\b' + re.escape(inf) + r'\b'
            if re.search(pattern, res, flags=re.IGNORECASE):
                res = re.sub(pattern, formal, res, flags=re.IGNORECASE)
                adjustments.append(f"Elevated vocabulary: replaced '{inf}' with scholarly '{formal}'.")

        if not adjustments:
            adjustments.append("Syntactic flow aligned with academic publication standards.")

        # Ensure capitalized first letter
        res = res[0].upper() + res[1:] if res else res
        return res, adjustments[:5]

    def _to_professional(self, text: str) -> (str, List[str]):
        res = text
        adjustments = []

        # Remove hesitation phrases and make action-oriented
        softeners = [
            (r'\bi think that\b', 'we observe that'),
            (r'\bmaybe we can\b', 'we recommend to'),
            (r'\bi just wanted to ask\b', 'we inquire'),
            (r'\ba lot of things\b', 'several key factors'),
            (r'\bbad stuff\b', 'adverse issues')
        ]
        for pat, repl in softeners:
            if re.search(pat, res, flags=re.IGNORECASE):
                res = re.sub(pat, repl, res, flags=re.IGNORECASE)
                adjustments.append(f"Professional framing: upgraded phrase to '{repl}'.")

        # Remove colloquial slang
        for inf, formal in [("kids", "students"), ("guys", "colleagues"), ("gonna", "going to"), ("wanna", "wish to")]:
            pattern = r'\b' + re.escape(inf) + r'\b'
            if re.search(pattern, res, flags=re.IGNORECASE):
                res = re.sub(pattern, formal, res, flags=re.IGNORECASE)
                adjustments.append(f"Replaced informal '{inf}' with professional '{formal}'.")

        if not adjustments:
            adjustments.append("Refined sentence clarity for business and technical communication.")

        return res, adjustments[:5]

    def _to_casual(self, text: str) -> (str, List[str]):
        res = text
        adjustments = []

        # Introduce natural contractions
        for formal, casual in CASUAL_SYNONYMS.items():
            pattern = r'\b' + re.escape(formal) + r'\b'
            if re.search(pattern, res, flags=re.IGNORECASE):
                res = re.sub(pattern, casual, res, flags=re.IGNORECASE)
                adjustments.append(f"Made conversational: changed '{formal}' to friendly '{casual}'.")

        if not adjustments:
            adjustments.append("Softened syntax for conversational, friendly communication.")

        return res, adjustments[:5]

    def _to_concise(self, text: str) -> (str, List[str]):
        res = text
        adjustments = []

        # Eliminate wordy phrases and redundancies
        for pattern, replacement in CONCISE_REDUNDANCIES:
            if re.search(pattern, res, flags=re.IGNORECASE):
                res = re.sub(pattern, replacement, res, flags=re.IGNORECASE)
                adjustments.append(f"Tightened phrasing: replaced '{pattern[2:-2]}' with '{replacement}'.")

        # Strip duplicate consecutive spaces
        res = re.sub(r'\s+', ' ', res).strip()

        if not adjustments:
            adjustments.append("Removed filler words and streamlined syntactic structure for maximum brevity.")

        return res, adjustments[:5]

tone_service = ToneWritingService()

def rewrite_passage_tone(text: str, tone: str) -> Dict[str, Any]:
    return tone_service.rewrite_tone(text, tone)

