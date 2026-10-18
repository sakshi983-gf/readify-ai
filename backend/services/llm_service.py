import os
import re
import json
import logging
import requests

logger = logging.getLogger(__name__)

class LLMService:
    """
    Intelligent AI integration service supporting:
    1. Google Gemini (free tier)
    2. Groq Llama-3 (free tier)
    3. Free anonymous reasoning LLM proxy
    4. Seamless fallback to local Readify NLP engine
    """

    def __init__(self):
        self.gemini_key = os.environ.get('GEMINI_API_KEY', '').strip()
        self.groq_key = os.environ.get('GROQ_API_KEY', '').strip()

    def set_api_key(self, provider: str, key: str):
        if provider == 'gemini':
            self.gemini_key = key.strip()
        elif provider == 'groq':
            self.groq_key = key.strip()

    def is_ai_configured(self) -> bool:
        return bool(self.gemini_key or self.groq_key)

    def analyze_with_ai(self, text: str) -> dict:
        """
        Analyze passage with advanced LLM if configured or available.
        Returns None if no LLM responded or on error.
        """
        # Try Groq if key exists
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
        try:
            prompt = self._build_prompt(text)
            headers = {
                "Authorization": f"Bearer {self.groq_key}",
                "Content-Type": "application/json"
            }
            payload = {
                "model": "llama-3.1-8b-instant",
                "messages": [
                    {"role": "system", "content": "You are Readify's English AI engine. You must output strictly valid JSON."},
                    {"role": "user", "content": prompt}
                ],
                "temperature": 0.2,
                "response_format": {"type": "json_object"}
            }
            res = requests.post("https://api.groq.com/openai/v1/chat/completions", headers=headers, json=payload, timeout=12)
            if res.status_code == 200:
                data = res.json()
                content = data['choices'][0]['message']['content']
                return json.loads(content)
        except Exception as e:
            logger.warning("Groq call failed: %s", e)
        return None

    def _call_gemini(self, text: str) -> dict:
        try:
            prompt = self._build_prompt(text)
            url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={self.gemini_key}"
            payload = {
                "contents": [{"parts": [{"text": prompt}]}],
                "generationConfig": {"response_mime_type": "application/json"}
            }
            res = requests.post(url, json=payload, timeout=12)
            if res.status_code == 200:
                data = res.json()
                content = data['candidates'][0]['content']['parts'][0]['text']
                return json.loads(content)
        except Exception as e:
            logger.warning("Gemini call failed: %s", e)
        return None

    def _build_prompt(self, text: str) -> str:
        return f"""
Analyze this English passage like an expert teacher and reading comprehension specialist:
"{text}"

Instructions:
1. Correct all grammar, punctuation, phrasing, and capitalization errors naturally.
2. NEVER replace personal names (like 'Sakshi', 'Rahul', 'Alex') with random dictionary words! Preserve and capitalize proper names.
3. If an introductory sentence is missing verbs (e.g. "my name sakshi"), add the linking verb ("My name is Sakshi.").
4. If verb tenses are incorrect (e.g. "am study"), correct them ("am studying in the").
5. List every detected error with matched_text, replacement, simple explanation, and category.
6. Provide a fair grammar accuracy score (0-100). Do not give 0 for understandable English sentences.
7. Generate 5 multiple choice comprehension questions based on the text:
   - Question types: factual, detail, main_idea, vocabulary, inference
   - 4 choices (A, B, C, D) with one correct answer and clear explanation.
8. Provide warm, encouraging personalized feedback.

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
