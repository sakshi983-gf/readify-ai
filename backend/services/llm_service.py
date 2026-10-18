import os
import re
import json
import logging
from pathlib import Path
import requests

logger = logging.getLogger(__name__)

CONFIG_FILE = Path(__file__).resolve().parent.parent / 'database' / 'ai_config.json'

class LLMService:
    """
    Intelligent AI integration service supporting:
    1. Groq (Meta Llama 3.3 70B / Llama 3.1 8B) - 100% Free, zero credit card
    2. Google Gemini (Gemini 1.5 Flash) - 100% Free, zero credit card
    3. Seamless fallback to Readify's enhanced local linguistic & T5 engine
    """

    def __init__(self):
        self.gemini_key = os.environ.get('GEMINI_API_KEY', '').strip()
        self.groq_key = os.environ.get('GROQ_API_KEY', '').strip()
        self._load_persisted_config()

    def _load_persisted_config(self):
        try:
            if CONFIG_FILE.exists():
                with open(CONFIG_FILE, 'r', encoding='utf-8') as f:
                    cfg = json.load(f)
                    if not self.groq_key and cfg.get('groq_key'):
                        self.groq_key = cfg['groq_key'].strip()
                    if not self.gemini_key and cfg.get('gemini_key'):
                        self.gemini_key = cfg['gemini_key'].strip()
        except Exception as e:
            logger.warning("Could not load persisted AI config: %s", e)

    def _save_persisted_config(self):
        try:
            CONFIG_FILE.parent.mkdir(parents=True, exist_ok=True)
            cfg = {
                'groq_key': self.groq_key,
                'gemini_key': self.gemini_key
            }
            with open(CONFIG_FILE, 'w', encoding='utf-8') as f:
                json.dump(cfg, f, indent=2)
        except Exception as e:
            logger.warning("Could not persist AI config: %s", e)

    def set_api_key(self, provider: str, key: str):
        if provider == 'gemini':
            self.gemini_key = key.strip()
        elif provider == 'groq':
            self.groq_key = key.strip()
        self._save_persisted_config()

    def is_ai_configured(self) -> bool:
        return bool(self.gemini_key or self.groq_key)

    def analyze_with_ai(self, text: str) -> dict:
        """
        Analyze passage with advanced 70B LLM if configured.
        Returns None on failure or if not configured, allowing seamless fallback.
        """
        # Try Groq (Llama-3.3-70B / 3.1-8B) first if key exists
        if self.groq_key:
            res = self._call_groq(text)
            if res:
                return res

        # Try Gemini if key exists
        if self.gemini_key:
            res = self._call_gemini(text)
            if res:
                return res

        return None

    def _call_groq(self, text: str) -> dict:
        # Try flagship 70B model first, fallback to 8B instant
        models_to_try = ["llama-3.3-70b-versatile", "llama-3.1-8b-instant"]
        prompt = self._build_prompt(text)
        headers = {
            "Authorization": f"Bearer {self.groq_key}",
            "Content-Type": "application/json"
        }

        for model in models_to_try:
            try:
                payload = {
                    "model": model,
                    "messages": [
                        {"role": "system", "content": "You are Readify's advanced English reading and grammar AI engine. You must output strictly valid JSON."},
                        {"role": "user", "content": prompt}
                    ],
                    "temperature": 0.2,
                    "response_format": {"type": "json_object"}
                }
                res = requests.post("https://api.groq.com/openai/v1/chat/completions", headers=headers, json=payload, timeout=14)
                if res.status_code == 200:
                    data = res.json()
                    content = data['choices'][0]['message']['content']
                    parsed = json.loads(content)
                    if parsed and 'corrected_text' in parsed:
                        logger.info("Groq model %s successfully processed passage.", model)
                        return parsed
                else:
                    logger.warning("Groq (%s) returned status %s: %s", model, res.status_code, res.text[:200])
            except Exception as e:
                logger.warning("Groq call for model %s failed: %s", model, e)
        return None

    def _call_gemini(self, text: str) -> dict:
        models_to_try = ["gemini-1.5-flash", "gemini-2.0-flash"]
        prompt = self._build_prompt(text)

        for model in models_to_try:
            try:
                url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={self.gemini_key}"
                payload = {
                    "contents": [{"parts": [{"text": prompt}]}],
                    "generationConfig": {"response_mime_type": "application/json"}
                }
                res = requests.post(url, json=payload, timeout=14)
                if res.status_code == 200:
                    data = res.json()
                    content = data['candidates'][0]['content']['parts'][0]['text']
                    parsed = json.loads(content)
                    if parsed and 'corrected_text' in parsed:
                        logger.info("Gemini model %s successfully processed passage.", model)
                        return parsed
                else:
                    logger.warning("Gemini (%s) returned status %s: %s", model, res.status_code, res.text[:200])
            except Exception as e:
                logger.warning("Gemini call for model %s failed: %s", model, e)
        return None

    def _build_prompt(self, text: str) -> str:
        return f"""
Analyze this English passage like an expert teacher and reading comprehension specialist:
"{text}"

Instructions:
1. Correct all grammar, punctuation, phrasing, and capitalization errors naturally.
2. NEVER replace personal names (like 'Sakshi', 'Rahul', 'Alex') with random dictionary words! Preserve and capitalize proper names.
3. If an introductory sentence is missing verbs (e.g. "my name rahul"), add the linking verb ("My name is Rahul.").
4. If verb tenses are incorrect (e.g. "am study"), correct them ("am studying in the").
5. Correct possessive forms (e.g. "friend name" -> "friend's name").
6. Correct subject-verb agreement (e.g. "he are" -> "he is", "we plays" -> "we play").
7. List every detected error with matched_text, replacement, simple explanation, and category.
8. Provide a fair grammar accuracy score (0-100).
9. Generate 5 multiple choice comprehension questions based on the text:
   - Question types: factual, detail, main_idea, vocabulary, inference
   - 4 choices (A, B, C, D) with one correct answer and clear explanation.
10. Provide warm, encouraging personalized feedback.

Output strictly valid JSON with this exact structure:
{{
  "corrected_text": "...",
  "grammar_score": 80,
  "errors": [
    {{"matched_text": "...", "replacement": "...", "message": "...", "category": "grammar"}}
  ],
  "questions": [
    {{
      "id": 1,
      "type": "factual",
      "question": "...",
      "options": [{{"id": "A", "text": "..."}}, {{"id": "B", "text": "..."}}, {{"id": "C", "text": "..."}}, {{"id": "D", "text": "..."}}],
      "correct_answer": "A",
      "explanation": "..."
    }}
  ],
  "feedback": "..."
}}
"""

llm_service = LLMService()
