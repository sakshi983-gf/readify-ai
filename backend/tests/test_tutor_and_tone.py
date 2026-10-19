"""
Unit tests for AI Tutor and Multi-Tone Writing Studio
"""
import os
import sys
import unittest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from backend.services.tutor_service import get_tutor_reply
from backend.services.tone_service import rewrite_passage_tone


class TestTutorAndTone(unittest.TestCase):
    def test_tutor_general_greeting(self):
        res = get_tutor_reply("Hello! Can you help me learn English?", mode="general")
        self.assertIn("reply", res)
        self.assertTrue(len(res["reply"]) > 20)
        self.assertIn("suggested_prompts", res)

    def test_tutor_grammar_explanation(self):
        res = get_tutor_reply("Why is 'They is playing' wrong?", mode="explain_grammar")
        self.assertIn("reply", res)
        self.assertTrue(len(res["reply"]) > 30)
        self.assertTrue(any("agreement" in s.lower() or "verb" in s.lower() or "are" in s.lower() for s in [res["reply"]]))

    def test_tutor_roleplay(self):
        res = get_tutor_reply("I am ready for the job interview practice", mode="roleplay")
        self.assertIn("reply", res)
        self.assertTrue(len(res["reply"]) > 20)

    def test_tutor_user_passage_correction(self):
        msg = "Yesterday, my friend go to college late because she miss the bus. Her teachers were angry, but she explain the reason politely. After the class, she discuss about her project with her friends. They gives her some useful suggestions, and she feel happy.correct thsi and say me why this is wrong grammar"
        res = get_tutor_reply(msg, mode="roleplay")
        self.assertIn("reply", res)
        self.assertIn("went", res["reply"].lower())
        self.assertIn("missed", res["reply"].lower())
        self.assertIn("explained", res["reply"].lower())
        self.assertIn("gave", res["reply"].lower())
        self.assertIn("felt", res["reply"].lower())

    def test_tutor_scenario_switch(self):
        res = get_tutor_reply("Can we switch to an academic debate roleplay?", mode="roleplay")
        self.assertIn("reply", res)
        self.assertIn("debate", res["reply"].lower())

    def test_tutor_vocab_enrichment(self):
        res = get_tutor_reply("Give me synonyms for important", mode="vocab")
        self.assertIn("reply", res)
        self.assertTrue(len(res["reply"]) > 20)

    def test_tone_academic(self):
        text = "This essay is about global warming and we should do stuff to fix it."
        res = rewrite_passage_tone(text, tone="academic")
        self.assertIn("rewritten_text", res)
        self.assertEqual(res["tone"], "academic")
        self.assertIn("adjustments", res)
        self.assertTrue(len(res["rewritten_text"]) > 10)

    def test_tone_professional(self):
        text = "Can u send me the report asap thanks."
        res = rewrite_passage_tone(text, tone="professional")
        self.assertIn("rewritten_text", res)
        self.assertEqual(res["tone"], "professional")
        self.assertTrue(len(res["rewritten_text"]) > 10)

    def test_tone_casual(self):
        text = "Furthermore, one must commence investigations immediately."
        res = rewrite_passage_tone(text, tone="casual")
        self.assertIn("rewritten_text", res)
        self.assertEqual(res["tone"], "casual")

    def test_tone_concise(self):
        text = "In the event that you need assistance, please feel free to reach out at this point in time."
        res = rewrite_passage_tone(text, tone="concise")
        self.assertIn("rewritten_text", res)
        self.assertEqual(res["tone"], "concise")
        self.assertLessEqual(res["rewritten_word_count"], res["original_word_count"])


if __name__ == "__main__":
    unittest.main()
