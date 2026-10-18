import unittest
from backend.services.comprehension_service import comprehension_service

class TestComprehensionService(unittest.TestCase):
    def setUp(self):
        self.passage = (
            "Artificial intelligence is transforming education by enabling personalized learning experiences. "
            "Adaptive algorithms analyze student performance in real time to recommend targeted exercises. "
            "Teachers can monitor student progress more effectively because detailed analytics highlight areas of difficulty. "
            "Consequently, students gain confidence and master challenging concepts at their own pace. "
            "Educational technology continues to expand opportunities for learners across the world."
        )

    def test_generate_five_questions(self):
        questions = comprehension_service.generate_questions(self.passage, count=5)
        self.assertEqual(len(questions), 5)
        for q in questions:
            self.assertIn('id', q)
            self.assertIn('question', q)
            self.assertIn('options', q)
            self.assertEqual(len(q['options']), 4)
            self.assertIn('correct_answer', q)
            self.assertIn('explanation', q)

    def test_evaluate_perfect_answers(self):
        questions = comprehension_service.generate_questions(self.passage, count=5)
        answers = {str(q['id']): q['correct_answer'] for q in questions}
        result = comprehension_service.evaluate_answers(questions, answers)
        self.assertEqual(result['total_questions'], 5)
        self.assertEqual(result['correct_count'], 5)
        self.assertEqual(result['score_percentage'], 100.0)

    def test_evaluate_partial_answers(self):
        questions = comprehension_service.generate_questions(self.passage, count=5)
        # Answer first 2 correctly, next 3 wrong or omitted
        answers = {
            str(questions[0]['id']): questions[0]['correct_answer'],
            str(questions[1]['id']): questions[1]['correct_answer'],
            str(questions[2]['id']): 'Z'  # intentional wrong
        }
        result = comprehension_service.evaluate_answers(questions, answers)
        self.assertEqual(result['correct_count'], 2)
        self.assertEqual(result['score_percentage'], 40.0)

if __name__ == '__main__':
    unittest.main()
