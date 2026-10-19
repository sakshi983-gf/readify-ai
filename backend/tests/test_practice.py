import os
import unittest
import tempfile
from backend.app import create_app
from backend.config import Config

class TestPracticeEndpoints(unittest.TestCase):
    def setUp(self):
        self.db_fd, self.temp_db = tempfile.mkstemp(suffix='.db')
        
        class TestConfig(Config):
            TESTING = True
            DATABASE_PATH = self.temp_db

        self.app = create_app(TestConfig)
        self.client = self.app.test_client()

    def tearDown(self):
        os.close(self.db_fd)
        if os.path.exists(self.temp_db):
            os.remove(self.temp_db)

    def test_get_practice_categories(self):
        res = self.client.get('/api/practice/categories')
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data['success'])
        self.assertEqual(len(data['data']), 11)
        first_cat = data['data'][0]
        self.assertIn('id', first_cat)
        self.assertIn('name', first_cat)
        self.assertIn('title', first_cat)

    def test_get_practice_exercises_filtered(self):
        res = self.client.get('/api/practice/exercises?category=subject_verb_agreement&difficulty=Beginner&count=5')
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data['success'])
        exercises = data['data']['exercises']
        self.assertGreaterEqual(len(exercises), 1)
        ex = exercises[0]
        self.assertEqual(ex['category'], 'subject_verb_agreement')
        self.assertEqual(ex['difficulty'], 'Beginner')
        self.assertIn('question', ex)
        self.assertIn('type', ex)

    def test_submit_practice_correct_answer(self):
        # Fetch an exercise
        res = self.client.get('/api/practice/exercises?category=subject_verb_agreement&count=1')
        exercises = res.get_json()['data']['exercises']
        ex = exercises[0]
        ex_id = ex['id']

        # Submit answer (for sva_b1, answer is 'B')
        submit_res = self.client.post('/api/practice/submit', json={
            'category': 'subject_verb_agreement',
            'difficulty': 'Beginner',
            'answers': {ex_id: 'B'}
        })
        self.assertEqual(submit_res.status_code, 200)
        sub_data = submit_res.get_json()
        self.assertTrue(sub_data['success'])
        self.assertIn('score_percentage', sub_data['data'])
        self.assertIn('breakdown', sub_data['data'])
        self.assertIn('recommendation', sub_data['data'])

if __name__ == '__main__':
    unittest.main()
