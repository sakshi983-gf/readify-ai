import unittest
from backend.services.scoring_service import scoring_service

class TestScoringService(unittest.TestCase):
    def test_grammar_scoring_perfect(self):
        result = scoring_service.calculate_grammar_score(word_count=100, error_count=0)
        self.assertEqual(result['score'], 100.0)
        self.assertEqual(result['density'], 0.0)

    def test_grammar_scoring_with_errors(self):
        result = scoring_service.calculate_grammar_score(word_count=100, error_count=2)
        # Fair academic scoring gives a realistic score above 80% rather than dropping to 0
        self.assertGreater(result['score'], 80.0)
        self.assertLessEqual(result['score'], 98.0)

    def test_overall_score_calculation(self):
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
            quiz_breakdown=[{'type': 'factual', 'is_correct': True}],
            student_name='Sakshi'
        )
        self.assertIsInstance(feedback, list)
        self.assertGreater(len(feedback), 0)
        titles = [f['title'] for f in feedback]
        self.assertIn('Outstanding Comprehension', titles)

if __name__ == '__main__':
    unittest.main()
