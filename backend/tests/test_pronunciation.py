"""
Unit tests for Pronunciation Assessment and Audio Engine (Module 15).
"""
import os
import sys
import unittest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from backend.services.pronunciation_service import pronunciation_service


class TestPronunciationService(unittest.TestCase):
    def test_get_exercises(self):
        all_ex = pronunciation_service.get_exercises()
        self.assertTrue(len(all_ex) >= 5)
        
        beg_ex = pronunciation_service.get_exercises("Beginner")
        self.assertTrue(all(e["level"] == "Beginner" for e in beg_ex))

    def test_get_phonemes_cmu(self):
        phones = pronunciation_service.get_phonemes("ship")
        self.assertTrue(len(phones) >= 3)
        self.assertIn("SH", phones)
        self.assertIn("P", phones)

        sheep_phones = pronunciation_service.get_phonemes("sheep")
        self.assertTrue(len(sheep_phones) >= 3)
        self.assertIn("IY", sheep_phones)

    def test_perfect_pronunciation_evaluation(self):
        ref = "Hello good morning it is a wonderful day"
        spoken = "Hello good morning it is a wonderful day"
        res = pronunciation_service.evaluate_pronunciation(ref, spoken, duration_seconds=3.0)
        
        self.assertEqual(res["completeness_score"], 100.0)
        self.assertEqual(res["accuracy_score"], 100.0)
        self.assertTrue(res["overall_score"] >= 90)
        self.assertIn("C2", res["cefr_level"])

    def test_partial_pronunciation_evaluation(self):
        ref = "The cat sat on the mat and drank fresh milk"
        spoken = "The cat sat on the and drink fresh milk"
        res = pronunciation_service.evaluate_pronunciation(ref, spoken, duration_seconds=4.0)
        
        self.assertTrue(res["completeness_score"] < 100.0)
        self.assertTrue(res["overall_score"] > 50)
        self.assertIn("words", res)
        # Verify word statuses
        words = {w["word"].lower(): w["status"] for w in res["words"]}
        self.assertEqual(words["cat"], "perfect")
        self.assertIn(words["mat"], ["omitted", "needs_work"])

    def test_audio_routes_api(self):
        from backend.app import create_app
        from backend.config import Config
        app = create_app(Config)
        client = app.test_client()

        # Test exercises endpoint
        res = client.get('/api/audio/exercises')
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data['success'])
        self.assertTrue(len(data['data']) > 0)

        # Test evaluation endpoint
        payload = {
            'reference_text': 'I am learning English with Readify.',
            'spoken_text': 'I am learning English with Readify',
            'duration_seconds': 2.5
        }
        res_eval = client.post('/api/audio/evaluate', json=payload)
        self.assertEqual(res_eval.status_code, 200)
        eval_data = res_eval.get_json()
        self.assertTrue(eval_data['success'])
        self.assertIn('overall_score', eval_data['data'])
        self.assertIn('cefr_level', eval_data['data'])
        self.assertIn('word_analysis', eval_data['data'])


if __name__ == "__main__":
    unittest.main()

