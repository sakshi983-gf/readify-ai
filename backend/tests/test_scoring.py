import unittest
from backend.services.scoring_service import scoring_service

class TestScoringService(unittest.TestCase):
    def test_grammar_scoring_perfect(self):
        result = scoring_service.calculate_grammar_score(word_count=100, error_count=0)
        self.assertEqual(result['score'], 100.0)
        self.assertEqual(result['density'], 0.0)

    def test_grammar_scoring_with_errors(self):
        # 2 errors in 100 words -> density 2% -> penalty 16% -> score 84%
        result = scoring_service.calculate_grammar_score(word_count=100, error_count=2)
        self.assertEqual(result['score'], 84.0)

    def test_overall_score_calculation(self):
        # 60% comprehension (80) + 40% grammar (90) = 48 + 36 = 84%
        result = scoring_service.calculate_overall_score(grammar_score=90.0, comprehension_score=80.0)
        self.assertEqual(result['score'], 84.0)

    def test_readability_metrics(self):
        text = "Reading books opens minds. Simple words make reading enjoyable for everyone."
        res = scoring_service.calculate_readability(text)
        self.assertIn('reading_ease', res)
        self.assertIn('grade_level', res)
        self.assertIn('level_label', res)
        self.assertGreater(res['reading_ease'], 0)

    def test_personalized_feedback(self):
        feedback = scoring_service.generate_personalized_feedback(
            comprehension_score=95.0,
            grammar_score=90.0,
            error_counts={'spelling': 1},
            word_count=150,
            quiz_breakdown=[{'type': 'factual', 'is_correct': True}]
        )
        self.assertIsInstance(feedback, list)
        self.assertGreater(len(feedback), 0)
        titles = [f['title'] for f in feedback]
        self.assertIn('Exceptional Comprehension', titles)

if __name__ == '__main__':
    unittest.main()
